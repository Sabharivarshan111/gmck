
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
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
        status: 200 // We're still returning 200 to avoid issues with client
      }
    );
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set in Supabase secrets');
      return new Response(
        JSON.stringify({ error: 'API key configuration error' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

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

    console.log(`Processing prompt: ${prompt.substring(0, 50)}...`);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful medical AI assistant. Provide accurate, relevant information about medical topics. Always include proper disclaimers when giving medical advice.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', errorText);
        
        // Handle rate limiting specifically
        if (response.status === 429) {
          console.log('Rate limit hit with OpenAI API');
          return new Response(
            JSON.stringify({ 
              error: 'Our AI service is experiencing high demand. Please try again in a moment.',
              isRateLimit: true
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          );
        }
        
        // Try to parse the error as JSON, but handle if it's not
        let parsedError;
        try {
          parsedError = JSON.parse(errorText);
        } catch (e) {
          parsedError = { message: 'Unknown error format from OpenAI API' };
        }
        
        return new Response(
          JSON.stringify({ 
            error: `OpenAI API error: ${parsedError.error?.message || parsedError.message || 'Unknown error'}` 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }

      const data = await response.json();

      const aiResponse = data.choices[0].message.content;
      console.log(`AI response generated successfully (${aiResponse.length} chars)`);
      
      return new Response(
        JSON.stringify({ response: aiResponse }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } catch (apiError) {
      console.error('Error calling OpenAI API:', apiError);
      return new Response(
        JSON.stringify({ error: 'Error communicating with AI service' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
  } catch (error) {
    console.error('Error in ask-ai function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});
