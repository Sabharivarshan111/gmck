
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const reqData = await req.json().catch(() => ({}));
    const { prompt } = reqData;
    
    if (!prompt) {
      console.error('Missing prompt in request');
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
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
          status: 500,
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
      return new Response(
        JSON.stringify({ 
          error: "Failed to generate response from AI model", 
          details: modelError.message 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502,
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
        status: 500,
      }
    );
  }
});
