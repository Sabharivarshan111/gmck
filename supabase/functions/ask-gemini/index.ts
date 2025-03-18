
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

// Function to extract key concepts from a pathology question
function extractKeyTopics(question: string): string[] {
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

// New function to determine the subject and topic from user input
function extractSubjectAndTopic(prompt: string): { subject: string | null; topic: string | null } {
  const text = prompt.toLowerCase();
  
  // Check for subjects
  const subjects = [
    { name: "pharmacology", aliases: ["pharma", "pharmacodynamics", "pharmacokinetics"] },
    { name: "microbiology", aliases: ["micro", "bacteria", "virus", "fungi", "parasites"] },
    { name: "pathology", aliases: ["patho", "histology", "cytology"] }
  ];
  
  let detectedSubject = null;
  let detectedTopic = null;
  
  // Try to detect subject
  for (const subject of subjects) {
    if (text.includes(subject.name) || subject.aliases.some(alias => text.includes(alias))) {
      detectedSubject = subject.name;
      break;
    }
  }
  
  // If we detected a subject, try to find a topic
  if (detectedSubject) {
    // Extract potential topics based on the detected subject
    const topicPatterns = {
      "pharmacology": [
        "general", "peripheral nervous system", "autonomic nervous system", 
        "central nervous system", "cardiovascular", "respiratory", "autacoids",
        "hormones", "gastrointestinal", "anti-microbial", "neoplastic", "miscellaneous"
      ],
      "microbiology": [
        "bacteria", "virus", "fungi", "parasites", "immunology", "sterilization",
        "disinfection", "antibiotics", "vaccination"
      ],
      "pathology": [
        "cell injury", "inflammation", "neoplasia", "hemodynamic", "genetic disorders",
        "immunology", "infectious diseases", "environmental", "nutritional", 
        "infancy", "childhood", "blood vessels", "heart", "hematopoietic", 
        "respiratory", "kidney", "gastrointestinal", "liver", "pancreas", 
        "male genital", "female genital", "breast", "endocrine", "skin", 
        "bone", "joint", "soft tissue", "peripheral nerve", "central nervous system"
      ]
    };
    
    // Check if any topic is mentioned in the text
    if (detectedSubject && topicPatterns[detectedSubject]) {
      for (const topic of topicPatterns[detectedSubject]) {
        if (text.includes(topic.toLowerCase())) {
          detectedTopic = topic;
          break;
        }
      }
    }
  }
  
  return { subject: detectedSubject, topic: detectedTopic };
}

// Add logging with timestamp
function logWithTimestamp(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(data);
  }
}

// Helper function to check if a prompt is requesting MCQs
function isMCQRequest(prompt: string): boolean {
  return /generate\s+(?:10|ten)\s+mcqs?|create\s+(?:10|ten)\s+mcqs?|make\s+(?:10|ten)\s+mcqs?|ten\s+mcqs?|10\s+mcqs?/i.test(prompt);
}

// Helper function to check if a prompt is asking for important questions
function isImportantQuestionsRequest(prompt: string): boolean {
  return /important question|important topics|high yield|frequently asked|commonly asked|repeated questions/i.test(prompt);
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

    // Create a client instance
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use Gemini 2.0 Flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Extract the actual question content without any prefix
    const actualQuestion = isTripleTap ? prompt.replace(/Triple-tapped:|triple-tapped:/i, "").trim() : prompt;
    
    // Determine if we have a specialized request type
    const isMCQsRequest = explicitMCQRequest || isMCQRequest(actualQuestion);
    const isImportantQsRequest = explicitImportantQRequest || isImportantQuestionsRequest(actualQuestion);
    const isPathologyQuestion = isPathologyTopic(actualQuestion);
    const subjectInfo = extractSubjectAndTopic(actualQuestion);
    
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

Please generate 10 MCQs based on ${needsConversationContext ? "the previous conversation context" : "the user's request"}. 

Each MCQ should:
1. Be clinically relevant
2. Test application of knowledge rather than mere recall
3. Have 4 options (A, B, C, D) with one correct answer
4. Include a brief explanation of why the correct answer is right and others are wrong

Format each question as:
Question 1: [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Answer: [Correct option letter]
Explanation: [Brief explanation]

Include a mix of case-based scenarios and direct knowledge questions. Ensure the questions are varied in difficulty and cover different aspects of the topic.`;

      // Adjust generation parameters for MCQs
      generationConfig.temperature = 0.8; // More creative
      generationConfig.maxOutputTokens = 4000; // Longer for 10 MCQs
    }
    // If asking for important questions by subject
    else if (isImportantQsRequest) {
      const { subject, topic } = subjectInfo;
      
      systemPrompt = `You are ACEV, a specialized medical AI assistant. The user is asking about important questions or high-yield topics for ${subject || "medical"} exams${topic ? ` specifically about ${topic}` : ""}.

${subject ? 
`Please provide a comprehensive list of the most important and frequently tested questions in ${subject}${topic ? ` on the topic of ${topic}` : ""} that appear in medical entrance exams like NEET PG and USMLE.

Organize your response in this format:
1. First list ESSAY-TYPE QUESTIONS (longer answer questions) in order of frequency/importance
2. Then list SHORT NOTES QUESTIONS in order of frequency/importance

For each question, include:
- The question text
- An indicator of how frequently it appears (*** for very frequent, ** for moderately frequent, * for occasionally asked)` : 
`Please ask the user to specify which medical subject they are interested in (Pharmacology, Microbiology, or Pathology), and if possible, which specific topic within that subject. This will help me provide more targeted and relevant information.`}

Make your response concise, well-structured, and easy to read. Focus on high-yield information that will be most valuable for exam preparation.`;

      // Adjust generation parameters for question lists
      generationConfig.temperature = 0.3; // More factual
      generationConfig.maxOutputTokens = 4000; // Longer for comprehensive lists
    }
    // If triple-tapped for a pathology question
    else if (isTripleTap && isPathologyQuestion) {
      const keyTopics = extractKeyTopics(actualQuestion);
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
    }
    // If triple-tapped for a non-pathology question
    else if (isTripleTap && !isPathologyQuestion) {
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
    // If the user is asking for clarification or following up on a previous response
    else if (needsConversationContext) {
      systemPrompt = `You are ACEV, a medical AI assistant. The user is asking for clarification or more information about something discussed in your previous conversation.

Please carefully examine the conversation history and respond specifically to the user's question: "${actualQuestion}"

If they are asking you to explain a specific concept or line from your previous answer, provide a more detailed and simplified explanation.

If they are asking for similar questions or examples, provide additional questions that are similar to what was discussed before, including both case-based and knowledge-based questions.

Keep your response focused, clear, and helpful. Use examples and analogies where appropriate to aid understanding.`;

      // Adjust generation parameters for clarification
      generationConfig.temperature = 0.4; // More factual for explanations
      generationConfig.maxOutputTokens = 3000; // Medium length
    }
    // For regular chat questions
    else {
      systemPrompt = "You are ACEV, a helpful and knowledgeable medical assistant. Provide concise, accurate medical information. For medical emergencies, always advise seeking immediate professional help. Your responses should be compassionate, clear, and based on established medical knowledge. Never mention that you're powered by Gemini.";
    }
    
    logWithTimestamp(`[${requestId}] Request type: ${isMCQsRequest ? "MCQs" : isImportantQsRequest ? "Important Questions" : isTripleTap ? "Triple-tap" : needsConversationContext ? "Contextual" : "Regular"}`, { 
      isMCQsRequest, 
      isImportantQsRequest, 
      isTripleTap, 
      needsConversationContext, 
      subjectInfo 
    });
    
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
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      logWithTimestamp(`[${requestId}] AI response generated successfully in ${duration}ms`);

      return new Response(
        JSON.stringify({ response: text }),
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
