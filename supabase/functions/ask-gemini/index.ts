
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.2.0";

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
    console.log("Received prompt:", prompt);
    
    // Get API key from environment variable
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set');
      throw new Error('API key not configured');
    }

    console.log("API key found, initializing Gemini...");
    
    // Initialize Gemini AI with the latest version
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use the latest model identifier
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    console.log("Generating content with model: gemini-1.5-pro");
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Response generated successfully");
    
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
    console.error('Error in ask-gemini function:', error.message);
    
    // Return a more detailed error response
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'error',
        details: 'An error occurred while processing your request'
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
