
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple rate limiting mechanism
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 5; // Max requests per minute

// Function to check if the request is rate limited
function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const clientRequests = rateLimitMap.get(clientId) || [];
  
  // Remove timestamps older than the window
  const recentRequests = clientRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  // Check if too many requests in the window
  const isLimited = recentRequests.length >= MAX_REQUESTS_PER_WINDOW;
  
  // Update the map with the new timestamp
  if (!isLimited) {
    recentRequests.push(now);
    rateLimitMap.set(clientId, recentRequests);
  }
  
  return isLimited;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  // Get client IP or some identifier for rate limiting
  // For demo, using a placeholder - in production use a real client identifier
  const clientId = req.headers.get('x-forwarded-for') || 'anonymous';
  
  // Check rate limiting
  if (isRateLimited(clientId)) {
    console.log(`Rate limited client: ${clientId}`);
    return new Response(
      JSON.stringify({ 
        error: 'Rate limit exceeded. Please try again later.',
        isRateLimit: true
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
      console.error('Error parsing request:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    const { prompt } = reqData || {};
    
    if (!prompt) {
      console.error('Missing prompt in request');
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    console.log("Received prompt:", prompt);
    
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      console.error("GEMINI_API_KEY not set in environment variables");
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Check if the prompt contains "Triple-tapped:" which indicates it came from triple tap action
    const isTripleTapQuestion = prompt.includes("Triple-tapped:");
    
    // Check if the question is from pathology paper 1 or 2
    const isPathologyQuestion = prompt.toLowerCase().includes("pathology") || 
                              prompt.toLowerCase().includes("paper 1") || 
                              prompt.toLowerCase().includes("paper 2");
    
    // Create a more specific system prompt for triple-tapped medical questions
    let systemPrompt = "";
    
    if (isTripleTapQuestion) {
      // Extract the actual question content without the "Triple-tapped:" prefix
      const actualQuestion = prompt.replace("Triple-tapped:", "").trim();
      
      if (isPathologyQuestion) {
        // Specialized prompt for pathology questions referencing Robbins Pathology book
        systemPrompt = `You are ACEV, a highly specialized medical AI assistant focused on providing detailed pathology explanations. 
        A student has specifically asked about "${actualQuestion}". 
        Please provide a comprehensive yet concise explanation of this pathology topic, based primarily on the Robbins Pathology textbook, covering:
        - Definition and key characteristics
        - Clinical significance and relevance
        - Pathophysiology or mechanism
        - Pathological findings (gross and microscopic if applicable)
        - Important facts for medical exams
        
        Format your response with clear sections and bullet points where appropriate. Be detailed and specific, drawing information specifically from Robbins Pathology textbook as your primary source.`;
      } else {
        // General medical system prompt for non-pathology questions
        systemPrompt = `You are ACEV, a highly specialized medical AI assistant focused on providing detailed medical explanations. 
        A student has specifically asked about "${actualQuestion}". 
        Please provide a comprehensive yet concise explanation of this medical topic, covering:
        - Definition and key characteristics
        - Clinical significance and relevance
        - Pathophysiology or mechanism (if applicable)
        - Important facts for medical exams
        
        Format your response with clear sections and bullet points where appropriate. Be detailed and specific.`;
      }
      
      console.log("Processing triple-tapped question:", actualQuestion);
      console.log("Is pathology question:", isPathologyQuestion);
    } else {
      // For regular chat questions, use a more conversational approach
      systemPrompt = "You are ACEV, a helpful and knowledgeable medical assistant. Provide concise, accurate medical information. For medical emergencies, always advise seeking immediate professional help. Your responses should be compassionate, clear, and based on established medical knowledge. Never mention that you're powered by Gemini.";
    }
    
    console.log("Using system prompt:", systemPrompt);
    
    try {
      const result = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "I understand. I'll act as ACEV, a medical assistant providing helpful, accurate information while prioritizing patient safety." }] },
          { role: "user", parts: [{ text: isTripleTapQuestion ? prompt.replace("Triple-tapped:", "").trim() : prompt }] }
        ]
      });

      const response = result.response;
      const text = response.text();
      
      console.log("AI response generated successfully");

      return new Response(
        JSON.stringify({ response: text }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (modelError) {
      console.error("AI Model Error:", modelError);
      
      // Check for rate limiting error with Gemini
      if (modelError.message && modelError.message.includes("429")) {
        console.log("Rate limit hit with Gemini API");
        return new Response(
          JSON.stringify({ 
            error: "Our AI service is experiencing high demand. Please try again in a moment.",
            isRateLimit: true
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
    console.error("Error:", error);
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
