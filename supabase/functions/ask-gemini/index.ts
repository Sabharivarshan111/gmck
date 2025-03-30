
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Enhanced rate limiting mechanism with backoff
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 5; // Max requests per minute

// Function to check if the request is rate limited with exponential backoff
function isRateLimited(clientId: string): { limited: boolean; retryAfter?: number } {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientId) || { 
    requests: [],
    consecutiveHits: 0,
    backoffUntil: 0
  };
  
  // Check if in backoff period
  if (clientData.backoffUntil > now) {
    return { limited: true, retryAfter: Math.ceil((clientData.backoffUntil - now) / 1000) };
  }
  
  // Remove timestamps older than the window
  const recentRequests = clientData.requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  // Check if too many requests in the window
  const isLimited = recentRequests.length >= MAX_REQUESTS_PER_WINDOW;
  
  if (isLimited) {
    // Increase consecutive hits and calculate backoff
    clientData.consecutiveHits++;
    const backoffSeconds = Math.min(30, Math.pow(2, clientData.consecutiveHits - 1)); // Exponential backoff, max 30 seconds
    clientData.backoffUntil = now + (backoffSeconds * 1000);
    
    // Update the map with current state
    clientData.requests = recentRequests;
    rateLimitMap.set(clientId, clientData);
    
    return { limited: true, retryAfter: backoffSeconds };
  } else {
    // Reset consecutive hits on successful non-limited request
    if (recentRequests.length === 0) {
      clientData.consecutiveHits = 0;
    }
    
    // Add the new timestamp
    recentRequests.push(now);
    
    // Update the map
    clientData.requests = recentRequests;
    rateLimitMap.set(clientId, clientData);
    
    return { limited: false };
  }
}

// Add logging with timestamp
function logWithTimestamp(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(data);
  }
}

// Helper to extract references from response text
function extractReferences(text: string): Array<{ title: string; url: string; author?: string; year?: string; journal?: string }> {
  const references = [];
  
  // Look for References or Sources sections
  const referencesSectionRegex = /(?:References|Sources|Further Reading|Citations):\s*(?:\n|$)([\s\S]*?)(?:$|(?:\n\n(?!-))|(?:\n(?=[A-Z][a-z]+:)))/i;
  const referencesMatch = text.match(referencesSectionRegex);
  
  if (referencesMatch && referencesMatch[1]) {
    // Extract the references section text
    const referencesSection = referencesMatch[1].trim();
    
    // Remove the references section from the original response
    text = text.replace(referencesSectionRegex, '');
    
    // Split by new lines for each reference
    const referenceLines = referencesSection.split('\n').filter(line => line.trim());
    
    for (const line of referenceLines) {
      // Try to extract URLs
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urlMatch = line.match(urlRegex);
      
      if (urlMatch) {
        // Extract title - assume everything before the URL is the title
        let title = line.split(urlMatch[0])[0].trim();
        
        // Remove numbering (1., 2., etc.) from the beginning of the title
        title = title.replace(/^\d+\.\s+/, '');
        
        // Remove markdown link formatting if present
        title = title.replace(/\[(.*?)\]\(.*?\)/g, '$1');
        
        // If title ends with a colon or a dash, remove it
        title = title.replace(/[:.-]$/, '').trim();
        
        // If title is empty, use the URL domain
        if (!title) {
          try {
            const url = new URL(urlMatch[0]);
            title = url.hostname.replace(/^www\./, '');
          } catch {
            title = "Reference link";
          }
        }
        
        // Clean and validate URL before adding to references
        let cleanedUrl = urlMatch[0];
        
        // Remove any trailing punctuation or parentheses from the URL
        cleanedUrl = cleanedUrl.replace(/[.,;:?!)]+$/, '');
        
        // Validate the URL is properly formatted
        try {
          // This will throw if URL is invalid
          new URL(cleanedUrl);
          
          // Double check the protocol is http or https
          if (!cleanedUrl.startsWith('http://') && !cleanedUrl.startsWith('https://')) {
            cleanedUrl = 'https://' + cleanedUrl;
          }
          
          references.push({
            title,
            url: cleanedUrl
          });
        } catch (e) {
          // If URL is invalid, use a safe fallback
          const safeUrl = `https://www.google.com/search?q=${encodeURIComponent(title)}`;
          references.push({
            title,
            url: safeUrl
          });
        }
      }
    }
  }
  
  return references;
}

// Process and clean up response text
function processResponseText(text: string): { cleanedText: string; references: Array<any> } {
  // Extract references from the text
  const references = extractReferences(text);
  
  // Remove any "References:" or "Sources:" sections
  let cleanedText = text.replace(/(?:References|Sources|Further Reading|Citations):\s*(?:\n|$)[\s\S]*?(?:$|(?:\n\n(?!-))|(?:\n(?=[A-Z][a-z]+:)))/gi, '');
  
  // Trim trailing whitespace and newlines
  cleanedText = cleanedText.trim();
  
  return { cleanedText, references };
}

serve(async (req) => {
  const requestId = crypto.randomUUID().substring(0, 8);
  const startTime = Date.now();
  logWithTimestamp(`[${requestId}] Request received`);
  
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  // Get client IP or some identifier for rate limiting
  const clientId = req.headers.get('x-forwarded-for') || 'anonymous';
  
  // Check rate limiting with enhanced logic
  const rateLimitResult = isRateLimited(clientId);
  if (rateLimitResult.limited) {
    logWithTimestamp(`[${requestId}] Rate limited client: ${clientId}, retry after: ${rateLimitResult.retryAfter}s`);
    return new Response(
      JSON.stringify({ 
        error: `Rate limit exceeded. Please try again in ${rateLimitResult.retryAfter} seconds.`,
        isRateLimit: true,
        retryAfter: rateLimitResult.retryAfter
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }

  try {
    let reqData;
    try {
      reqData = await req.json();
    } catch (parseError) {
      logWithTimestamp(`[${requestId}] Error parsing request:`, parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    const { 
      prompt, 
      conversationHistory = [], 
      isTripleTap = false,
      isMCQRequest: explicitMCQRequest = false,
      isImportantQuestionsRequest: explicitImportantQRequest = false,
      isNeedingClarification = false
    } = reqData || {};
    
    if (!prompt) {
      logWithTimestamp(`[${requestId}] Missing prompt in request`);
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    logWithTimestamp(`[${requestId}] Processing prompt: ${prompt.substring(0, 50)}...`);
    logWithTimestamp(`[${requestId}] Conversation history length: ${conversationHistory.length}`);
    logWithTimestamp(`[${requestId}] Request types: isTripleTap=${isTripleTap}, isMCQRequest=${explicitMCQRequest}, isImportantQuestionsRequest=${explicitImportantQRequest}, isNeedingClarification=${isNeedingClarification}`);
    
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      logWithTimestamp(`[${requestId}] GEMINI_API_KEY not set in environment variables`);
      return new Response(
        JSON.stringify({ error: "API key configuration error" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Determine if we have a specialized request type
    const isMCQsRequest = explicitMCQRequest || /generate\s+(?:10|ten)\s+mcqs?|create\s+(?:10|ten)\s+mcqs?|make\s+(?:10|ten)\s+mcqs?|ten\s+mcqs?|10\s+mcqs?|generate\s+mcqs?/i.test(prompt);
    const isImportantQsRequest = explicitImportantQRequest || /important question|important topics|high yield|frequently asked|commonly asked|repeated questions/i.test(prompt);
    const needsConversationContext = conversationHistory.length > 0 && 
                                     (isNeedingClarification || 
                                      prompt.toLowerCase().includes("i don't understand") || 
                                      prompt.toLowerCase().includes("can't understand") ||
                                      prompt.toLowerCase().includes("explain") ||
                                      prompt.toLowerCase().includes("similar") ||
                                      prompt.toLowerCase().includes("generate") ||
                                      prompt.toLowerCase().includes("more detail"));
    
    // Create a targeted system prompt based on the request type
    let systemPrompt = "";
    const timeoutMs = 30000; // 30 seconds timeout
    
    // Default system prompt
    systemPrompt = `You are ACEV, a helpful and knowledgeable medical assistant. Provide concise, accurate medical information. For medical emergencies, always advise seeking immediate professional help. Your responses should be compassionate, clear, and based on established medical knowledge.
    
    After providing your response, include a "References:" section with 2-5 relevant sources for the information.`;
    
    // Direct API call to Gemini 2.0 Flash
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt }]
          },
          {
            role: "model",
            parts: [{ text: "I understand. I'll act as ACEV, a medical assistant providing helpful, accurate information while prioritizing patient safety." }]
          },
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 4000,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (!response.ok) {
      const errorData = await response.text();
      logWithTimestamp(`[${requestId}] Gemini API error (${response.status}): ${errorData}`);
      return new Response(
        JSON.stringify({ 
          error: `Error from Gemini API: ${response.status} ${response.statusText}`, 
          details: errorData 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      logWithTimestamp(`[${requestId}] No candidates returned from Gemini`);
      return new Response(
        JSON.stringify({ error: "No response generated from Gemini" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Extract the response text
    const responseText = data.candidates[0].content.parts[0].text;
    
    // Process the response to extract references and clean the text
    const { cleanedText, references } = processResponseText(responseText);
    
    logWithTimestamp(`[${requestId}] Successfully generated response (length: ${cleanedText.length})`);
    if (references.length > 0) {
      logWithTimestamp(`[${requestId}] Extracted ${references.length} references`);
    }

    // Return the response with references
    return new Response(
      JSON.stringify({ 
        response: cleanedText,
        references,
        queueStats: {
          isQueueActive: false,
          queueLength: 0,
          estimatedWaitTime: 0,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    logWithTimestamp(`[${requestId}] Error processing request:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request: ' + error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});
