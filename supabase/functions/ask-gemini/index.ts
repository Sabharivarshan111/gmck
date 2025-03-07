
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

// Function to extract key concepts from a pathology question
function extractKeyTopics(question: string): string[] {
  // List of important pathology concepts to look for
  const keyPathologyConcepts = [
    "Philadelphia chromosome", "BCR-ABL", "translocation", "tyrosine kinase", 
    "myeloproliferative", "leukemia", "lymphoma", "metastasis", "neoplasia",
    "oncogene", "tumor suppressor", "apoptosis", "angiogenesis", "grading", "staging",
    "differentiation", "mutation", "chromosomal abnormality", "fusion gene",
    "histopathology", "immunohistochemistry", "molecular markers", "cytogenetics"
  ];
  
  const extractedTopics = [];
  
  // Check if any key concepts are in the question
  for (const concept of keyPathologyConcepts) {
    if (question.toLowerCase().includes(concept.toLowerCase())) {
      extractedTopics.push(concept);
    }
  }
  
  // Find disease-specific names (often capitalized terms)
  const possibleDiseaseNames = question.match(/[A-Z][a-z]+([\s-][A-Z][a-z]+)*/g) || [];
  for (const name of possibleDiseaseNames) {
    if (name.length > 3 && !extractedTopics.includes(name)) {
      extractedTopics.push(name);
    }
  }

  // Extract specific disease names from the question (common pathology conditions)
  const pathologyConditions = [
    "Chronic Myeloid Leukemia", "CML", "Acute Leukemia", "Multiple Myeloma",
    "Hodgkin Lymphoma", "Non-Hodgkin Lymphoma", "Sickle Cell Anemia",
    "Thalassemia", "Iron Deficiency Anemia", "Megaloblastic Anemia",
    "Hemophilia", "Thrombocytopenia", "Carcinoma", "Sarcoma", "Melanoma",
    "Pneumonia", "Tuberculosis", "Emphysema", "Asthma", "Cirrhosis",
    "Hepatitis", "Pancreatitis", "Gastritis", "Peptic Ulcer", "Ulcerative Colitis",
    "Crohn Disease", "Glomerulonephritis", "Pyelonephritis", "Alzheimer Disease",
    "Parkinson Disease", "Multiple Sclerosis", "Myocardial Infarction",
    "Atherosclerosis", "Hypertension", "Rheumatic Heart Disease",
    "Diabetes Mellitus", "Thyroiditis", "Graves Disease", "Addison Disease",
    "Cushing Syndrome", "Osteoarthritis", "Rheumatoid Arthritis", "Osteoporosis",
    "Osteomyelitis", "Basal Cell Carcinoma", "Squamous Cell Carcinoma"
  ];
  
  for (const condition of pathologyConditions) {
    if (question.toLowerCase().includes(condition.toLowerCase()) && 
        !extractedTopics.includes(condition)) {
      extractedTopics.push(condition);
    }
  }
  
  return extractedTopics;
}

// Function to determine if a question is a pathology topic
function isPathologyTopic(question: string): boolean {
  const pathologyKeywords = [
    "pathology", "histology", "morphology", "histopathology", "cytology",
    "neoplasm", "tumor", "carcinoma", "sarcoma", "leukemia", "lymphoma",
    "inflammation", "infarct", "necrosis", "apoptosis", "metaplasia",
    "dysplasia", "hyperplasia", "atrophy", "hypertrophy", "paper 1", "paper 2"
  ];
  
  return pathologyKeywords.some(keyword => 
    question.toLowerCase().includes(keyword.toLowerCase()));
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
    
    // Extract the actual question content without the "Triple-tapped:" prefix
    const actualQuestion = isTripleTapQuestion ? prompt.replace("Triple-tapped:", "").trim() : prompt;
    
    // Check if the question is from pathology
    const isPathologyQuestion = isPathologyTopic(actualQuestion) || 
                               actualQuestion.toLowerCase().includes("pathology") || 
                               actualQuestion.toLowerCase().includes("paper 1") || 
                               actualQuestion.toLowerCase().includes("paper 2");
    
    // Extract key topics from the question if it's a pathology question
    const keyTopics = isPathologyQuestion ? extractKeyTopics(actualQuestion) : [];
    console.log("Extracted key topics:", keyTopics);
    
    // Create a more specific system prompt for triple-tapped medical questions
    let systemPrompt = "";
    
    if (isTripleTapQuestion) {
      if (isPathologyQuestion) {
        // Enhanced specialized prompt for pathology questions with key topics
        let topicList = keyTopics.length > 0 ? 
          `Important concepts to address: ${keyTopics.join(", ")}` : 
          "Identify and address key pathology concepts in the question";
          
        systemPrompt = `You are ACEV, a highly specialized medical AI assistant focused on providing detailed pathology explanations for medical students. 
        A student has specifically asked about "${actualQuestion}". 
        ${topicList}
        
        Please provide a comprehensive yet structured explanation of this pathology topic, based primarily on the Robbins Pathology textbook, covering:
        
        1. DEFINITION: Start with a clear, concise definition
        2. EPIDEMIOLOGY: Brief demographic information if relevant
        3. ETIOLOGY & PATHOGENESIS: The cause and detailed molecular/genetic mechanisms
        4. MORPHOLOGY: Key gross and microscopic findings with specific details
        5. CLINICAL FEATURES: Typical presentation and progression
        6. DIAGNOSTIC WORKUP: Key tests and findings
        7. TREATMENT OPTIONS: Current therapeutic approaches from first-line to advanced options
        8. PROGNOSIS: Expected outcome with and without treatment
        
        For specific entities like "Philadelphia chromosome" or genetic markers, provide detailed descriptions of their mechanism, significance, and clinical relevance.
        
        Format your response with clear sections using bold headings and bullet points for key information. Be precise and detailed while maintaining readability.
        
        IMPORTANT: Always include detailed information about the TREATMENT OPTIONS, even if not explicitly asked. Medical students need to know the current therapeutic approaches from first-line to advanced options.`;
      } else {
        // General medical system prompt for non-pathology questions
        systemPrompt = `You are ACEV, a highly specialized medical AI assistant focused on providing detailed medical explanations. 
        A student has specifically asked about "${actualQuestion}". 
        
        Please provide a comprehensive yet concise explanation of this medical topic, covering:
        - Definition and key characteristics
        - Clinical significance and relevance
        - Pathophysiology or mechanism (if applicable)
        - Diagnostic approach
        - Treatment options and management
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
          { role: "user", parts: [{ text: isTripleTapQuestion ? actualQuestion : prompt }] }
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
