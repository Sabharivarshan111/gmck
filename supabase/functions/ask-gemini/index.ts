import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.0";

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

// Function to validate a URL and check if it's from a trusted medical source
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

function isTrustedMedicalDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const trustedDomains = [
      'pubmed.ncbi.nlm.nih.gov',
      'ncbi.nlm.nih.gov',
      'nlm.nih.gov',
      'mayoclinic.org',
      'clevelandclinic.org',
      'medlineplus.gov',
      'cdc.gov',
      'who.int',
      'nih.gov',
      'nejm.org',
      'jamanetwork.com',
      'thelancet.com',
      'bmj.com',
      'acponline.org',
      'heart.org',
      'cancer.gov',
      'cancer.org',
      'diabetes.org',
      'uptodate.com',
      'medscape.com',
      'webmd.com',
      'healthline.com',
      'medicalnewstoday.com'
    ];
    
    return trustedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain));
  } catch (e) {
    return false;
  }
}

// Enhanced function to extract references from the text with better parsing and validation
function extractReferences(text: string): Array<{title: string; authors: string; journal?: string; year: string; url?: string; source?: string}> {
  const references = [];
  
  // Check if the response contains a references section
  const referencesMatch = text.match(/References:?\s*\n([\s\S]+)$/i) || 
                         text.match(/Sources:?\s*\n([\s\S]+)$/i) ||
                         text.match(/Citations:?\s*\n([\s\S]+)$/i);
  
  if (referencesMatch) {
    const referencesText = referencesMatch[1];
    
    // Split by numbered references or bullet points
    const referenceItems = referencesText.split(/\n\s*(?:\d+\.|\-|\*)\s+/);
    
    for (let item of referenceItems) {
      item = item.trim();
      if (!item) continue;
      
      // Try to extract structured information from each reference
      const reference: {
        title: string;
        authors: string;
        journal?: string;
        year: string;
        url?: string;
        source?: string;
      } = {
        title: "Untitled Reference",
        authors: "Unknown",
        year: "n.d."
      };
      
      // Extract URL if present
      const urlMatch = item.match(/(https?:\/\/[^\s\)]+)/);
      if (urlMatch) {
        const potentialUrl = urlMatch[1].replace(/[,\.;"\)]+$/, ''); // Clean up potential trailing punctuation
        if (isValidUrl(potentialUrl)) {
          reference.url = potentialUrl;
          
          // Try to determine the source domain
          try {
            const urlObj = new URL(potentialUrl);
            if (urlObj.hostname.includes('pubmed') || urlObj.hostname.includes('ncbi.nlm.nih.gov')) {
              reference.source = 'PubMed';
            } else if (urlObj.hostname.includes('mayoclinic')) {
              reference.source = 'Mayo Clinic';
            } else if (urlObj.hostname.includes('clevelandclinic')) {
              reference.source = 'Cleveland Clinic';
            } else if (urlObj.hostname.includes('medscape')) {
              reference.source = 'Medscape';
            } else if (urlObj.hostname.includes('who.int')) {
              reference.source = 'WHO';
            } else if (urlObj.hostname.includes('cdc.gov')) {
              reference.source = 'CDC';
            } else if (urlObj.hostname.includes('nih.gov')) {
              reference.source = 'NIH';
            } else {
              reference.source = urlObj.hostname.replace('www.', '');
            }
          } catch (e) {
            // URL parsing failed
          }
          
          // Remove the URL from the item to make other parsing easier
          item = item.replace(urlMatch[1], '').trim();
        }
      }
      
      // Extract title - usually the first part up to a period or comma
      const titleMatch = item.match(/^"([^"]+)"/) ||  // Quoted title
                        item.match(/^([^\.,:]+)[\.,:]/); // Up to first punctuation
      if (titleMatch) {
        reference.title = titleMatch[1].trim();
        // Remove the title from the item to make other parsing easier
        item = item.replace(titleMatch[0], '').trim();
      } else {
        // If no clear title pattern, try to extract a reasonable title
        const potentialTitle = item.split(/[\.,:]/).shift() || '';
        if (potentialTitle.length > 3) {
          reference.title = potentialTitle.trim();
          item = item.replace(potentialTitle, '').replace(/^[\.,:]/, '').trim();
        }
      }
      
      // Extract year
      const yearMatch = item.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        reference.year = yearMatch[0];
      }
      
      // Extract journal if present
      const journalMatch = item.match(/([A-Z][A-Za-z\s]+Journal|[A-Z][A-Za-z\s]+Annals|[A-Z][A-Za-z\s]+Review|[A-Z][A-Za-z\s&;]+)/);
      if (journalMatch) {
        reference.journal = journalMatch[1].trim();
      }
      
      // Extract authors - anything remaining before the year or journal
      let authorsText = item;
      if (reference.journal) {
        authorsText = item.split(reference.journal)[0].trim();
      } else if (yearMatch) {
        authorsText = item.split(yearMatch[0])[0].trim();
      }
      
      if (authorsText) {
        // Clean up authors text (remove trailing punctuation)
        authorsText = authorsText.replace(/[,\.;]$/, '').trim();
        reference.authors = authorsText || "Unknown";
      }
      
      // Only add references with URLs if they have a valid title
      if (reference.title !== "Untitled Reference") {
        references.push(reference);
      }
    }
  }
  
  // Filter out references without valid URLs
  return references.filter(ref => !ref.url || isValidUrl(ref.url));
}

// Add logging with timestamp
function logWithTimestamp(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(data);
  }
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
    
    // Check if the prompt is medical-related
    const isMedicalQuery = prompt.toLowerCase().includes('medical') || 
                        prompt.toLowerCase().includes('medicine') ||
                        prompt.toLowerCase().includes('doctor') ||
                        prompt.toLowerCase().includes('disease') ||
                        prompt.toLowerCase().includes('pathology') ||
                        prompt.toLowerCase().includes('pharmacology') ||
                        prompt.toLowerCase().includes('symptom') ||
                        prompt.toLowerCase().includes('treatment') ||
                        prompt.toLowerCase().includes('diagnosis') ||
                        prompt.toLowerCase().includes('patient') ||
                        prompt.toLowerCase().includes('hospital') ||
                        prompt.toLowerCase().includes('clinic');
    
    logWithTimestamp(`[${requestId}] Processing prompt: ${prompt.substring(0, 50)}...`);
    logWithTimestamp(`[${requestId}] Is medical query: ${isMedicalQuery}`);
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

    // Create a client instance
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use Gemini 2.0 Flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Extract the actual question content without any prefix
    const actualQuestion = isTripleTap ? prompt.replace(/Triple-tapped:|triple-tapped:/i, "").trim() : prompt;
    
    // Determine if we have a specialized request type
    const isMCQsRequest = explicitMCQRequest;
    const isImportantQsRequest = explicitImportantQRequest;
    
    // For context-based questions, we need the conversation history
    const needsConversationContext = conversationHistory.length > 0 && 
                                    (isNeedingClarification || 
                                     actualQuestion.toLowerCase().includes("i don't understand") || 
                                     actualQuestion.toLowerCase().includes("can't understand") ||
                                     actualQuestion.toLowerCase().includes("explain") ||
                                     actualQuestion.toLowerCase().includes("similar") ||
                                     actualQuestion.toLowerCase().includes("generate") ||
                                     actualQuestion.toLowerCase().includes("more detail"));
    
    // Create a targeted system prompt based on the request type
    let systemPrompt = "";
    let generationConfig = {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2000, // Increase for more detailed responses
    };
    
    // If requesting MCQs
    if (isMCQsRequest) {
      systemPrompt = `You are ACEV, a highly specialized medical AI assistant. The user has requested you to generate 10 high-quality multiple choice questions (MCQs) in the style of NEET PG or USMLE exams.

Please generate EXACTLY 10 MCQs based on ${needsConversationContext ? "the previous conversation context" : "the user's request"}. 

Each MCQ should:
1. Be clinically relevant
2. Test application of knowledge rather than mere recall
3. Have 4 options (A, B, C, D) with one correct answer
4. Include a brief explanation immediately after each question's answer (not at the end of all questions)

The MCQs should follow this exact format for each question:

Question 1: [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Answer: [Correct option letter]
Explanation: [Brief explanation]

Question 2: [Question text]
...and so on.

IMPORTANT:
- Generate EXACTLY 5 case-based scenarios and 5 direct knowledge questions
- Place the answer and explanation immediately after each question, not grouped at the end
- Make the questions varied in difficulty and cover different aspects of the topic
- Follow NEET PG/USMLE style format and complexity
- Make sure all questions are accurate and properly formatted`;

      // Adjust generation parameters for MCQs
      generationConfig.temperature = 0.8; // More creative
      generationConfig.maxOutputTokens = 4000; // Longer for 10 MCQs
    }
    // For regular chat questions about medical topics
    else if (isMedicalQuery) {
      systemPrompt = `You are ACEV, a helpful and knowledgeable medical assistant. Provide concise, accurate medical information. For medical emergencies, always advise seeking immediate professional help. Your responses should be compassionate, clear, and based on established medical knowledge. Never mention that you're powered by Gemini.

IMPORTANT: You MUST include reputable medical references and sources at the end of your response. 

Your references MUST:
1. Be from reputable medical sources like PubMed, NCBI, Mayo Clinic, Cleveland Clinic, WHO, CDC, NIH, or major medical journals
2. Include full, working URLs that start with http:// or https://
3. Be directly relevant to the specific medical topic being discussed
4. Be formatted in a section called "References:" at the end of your response
5. Include at least 3-5 references for each response

Format each reference as follows:
1. Author(s) (Year). Title. Journal/Source. URL

For example:
References:
1. Smith J, et al. (2021). Recent advances in treating hypertension. Journal of Cardiology. https://pubmed.ncbi.nlm.nih.gov/example12345
2. Mayo Clinic Staff. (2023). Hypertension. Mayo Clinic. https://www.mayoclinic.org/diseases-conditions/high-blood-pressure/symptoms-causes/syc-20373410
3. Centers for Disease Control and Prevention. (2023). Facts about Hypertension. CDC. https://www.cdc.gov/bloodpressure/facts.htm

Again, make sure all URLs are complete, correct, and from reputable medical sources.`;
      
      // Adjust for medical responses
      generationConfig.temperature = 0.6; // Less creative, more factual
      generationConfig.maxOutputTokens = 3000; // Longer to include references
    }
    // For regular chat questions (non-medical)
    else {
      systemPrompt = "You are ACEV, a helpful and knowledgeable assistant. Provide concise, accurate information. Your responses should be compassionate, clear, and based on established knowledge. Never mention that you're powered by Gemini. If you use information from textbooks or research papers, please include a list of sources or references at the end of your response in a section titled 'References:'.";
    }
    
    logWithTimestamp(`[${requestId}] Request type: ${isMCQsRequest ? "MCQs" : isImportantQsRequest ? "Important Questions" : isTripleTap ? "Triple-tap" : isMedicalQuery ? "Medical Query" : needsConversationContext ? "Contextual" : "Regular"}`);
    
    try {
      // Increased timeout for Gemini requests
      const timeoutMs = 30000; // 30 seconds timeout
      
      // Build conversation messages with history if needed
      const messages = [];
      
      // Add system prompt
      messages.push({ role: "user", parts: [{ text: systemPrompt }] });
      messages.push({ role: "model", parts: [{ text: "I understand. I'll act as ACEV, a medical assistant providing helpful, accurate information while prioritizing patient safety." }] });
      
      // Add conversation history if needed for context
      if (needsConversationContext && conversationHistory.length > 0) {
        // Only include up to the last 10 messages to avoid context window issues
        const recentHistory = conversationHistory.slice(-10);
        
        logWithTimestamp(`[${requestId}] Including ${recentHistory.length} messages from conversation history`);
        
        for (const message of recentHistory) {
          messages.push({ 
            role: message.role === 'user' ? 'user' : 'model', 
            parts: [{ text: message.content }] 
          });
        }
      }
      
      // Add current user question
      messages.push({ role: "user", parts: [{ text: actualQuestion }] });
      
      // Set up the model with conversation and config
      const modelPromise = model.generateContent({
        contents: messages,
        generationConfig
      });
      
      // Set up timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });
      
      // Race the model response against the timeout
      const result = await Promise.race([modelPromise, timeoutPromise]) as any;
      
      const response = result.response;
      const text = response.text();
      
      // Extract and validate references
      const references = extractReferences(text);
      
      // Only for medical queries, validate the references if present
      let validatedReferences = references;
      if (isMedicalQuery && references.length > 0) {
        validatedReferences = references
          .filter(ref => !ref.url || isValidUrl(ref.url))
          .map(ref => {
            // Mark trusted sources
            if (ref.url && isTrustedMedicalDomain(ref.url)) {
              ref.source = ref.source || "Trusted Medical Source";
            }
            return ref;
          });
        
        logWithTimestamp(`[${requestId}] Found ${references.length} references, ${validatedReferences.length} validated`);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      logWithTimestamp(`[${requestId}] AI response generated successfully in ${duration}ms`);

      return new Response(
        JSON.stringify({ 
          response: text,
          references: validatedReferences.length > 0 ? validatedReferences : undefined,
          isMedicalQuery: isMedicalQuery
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (modelError) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logWithTimestamp(`[${requestId}] AI Model Error after ${duration}ms:`, modelError);
      
      // Check for rate limiting error with Gemini
      if (modelError.message && modelError.message.includes("429")) {
        logWithTimestamp(`[${requestId}] Rate limit hit with Gemini API`);
        return new Response(
          JSON.stringify({ 
            error: "Our AI service is experiencing high demand. Please try again in a moment.",
            isRateLimit: true,
            retryAfter: 30 // Suggest client wait 30 seconds
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
      
      // Improved timeout error handling with more user-friendly message
      if (modelError.message && modelError.message.includes("timed out")) {
        logWithTimestamp(`[${requestId}] Request to Gemini API timed out`);
        return new Response(
          JSON.stringify({ 
            error: "The AI service is taking longer than expected. Your question might be complex - try asking a more focused question or try again later.",
            details: "AI processing timeout"
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to generate response from AI model", 
          details: modelError.message 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    logWithTimestamp(`[${requestId}] Unhandled error after ${duration}ms:`, error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An error occurred while processing your request",
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
