
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
    const { prompt } = await req.json();
    console.log("Received prompt:", prompt);
    
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not set in environment variables" }),
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
    
    // Create a more specific system prompt for triple-tapped medical questions
    let systemPrompt = "";
    
    if (isTripleTapQuestion) {
      // Extract the actual question content without the "Triple-tapped:" prefix
      const actualQuestion = prompt.replace("Triple-tapped:", "").trim();
      
      systemPrompt = `You are ACEV, a highly specialized medical AI assistant focused on providing detailed medical explanations. 
      A student has specifically asked about "${actualQuestion}". 
      Please provide a comprehensive yet concise explanation of this medical topic, covering:
      - Definition and key characteristics
      - Clinical significance and relevance
      - Pathophysiology or mechanism (if applicable)
      - Important facts for medical exams
      
      Format your response with clear sections and bullet points where appropriate. Be detailed and specific.`;
      
      console.log("Processing triple-tapped question:", actualQuestion);
    } else {
      // For regular chat questions, use a more conversational approach
      systemPrompt = "You are ACEV, a helpful and knowledgeable medical assistant. Provide concise, accurate medical information. For medical emergencies, always advise seeking immediate professional help. Your responses should be compassionate, clear, and based on established medical knowledge. Never mention that you're powered by Gemini.";
    }
    
    console.log("Using system prompt:", systemPrompt);
    
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
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred while processing your request" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
