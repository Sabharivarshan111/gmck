
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Set up a medical context prompt
    const medicalContext = `You are a medical education AI assistant. You help medical students understand complex topics and answer their questions. You should:
    1. Provide clear, accurate medical information
    2. Use proper medical terminology
    3. Include relevant examples when helpful
    4. Break down complex concepts into understandable parts

    Question or topic to address: ${prompt}`;

    // Generate content
    const result = await model.generateContent(medicalContext);
    const response = await result.response;
    const text = response.text();

    console.log("Generated response for prompt:", prompt);
    
    return new Response(
      JSON.stringify({ 
        response: text,
        status: 'success' 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error("Error in ask-gemini function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'error'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
