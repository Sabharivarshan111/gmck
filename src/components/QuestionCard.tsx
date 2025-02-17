
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Loader2 } from "lucide-react";

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || ""); 

interface QuestionCardProps {
  question: string;
  index: number;
}

const QuestionCard = ({ question, index }: QuestionCardProps) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  
  const pageNumberMatch = question.match(/\(Pg\.No: ([^)]+)\)/);
  const pageNumbers = pageNumberMatch ? pageNumberMatch[1] : "";
  const cleanQuestion = question.replace(/\(Pg\.No: [^)]+\)/, '');

  const handleTap = async () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      if (!aiResponse && !loading && genAI) {
        await generateAIResponse();
      }
    }

    setLastTap(now);
  };

  const generateAIResponse = async () => {
    if (!genAI) return;
    
    try {
      setLoading(true);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `Please provide a detailed medical answer for the following question: ${cleanQuestion}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      setAiResponse(text);
    } catch (error) {
      console.error('Error generating AI response:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      className="transition-all duration-200 hover:bg-gray-900 bg-gray-950 border-gray-800 mb-4"
      onClick={handleTap}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={(checked) => setIsCompleted(checked as boolean)}
              className="h-5 w-5 border-gray-600"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-300 whitespace-pre-wrap">
              {cleanQuestion}
            </p>
            {pageNumbers && (
              <p className="text-xs text-gray-500 mt-2">
                Page: {pageNumbers}
              </p>
            )}
            {loading && (
              <div className="flex items-center justify-center mt-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            )}
            {aiResponse && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-200 whitespace-pre-wrap">
                  {aiResponse}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
