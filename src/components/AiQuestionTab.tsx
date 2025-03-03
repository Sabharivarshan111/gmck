
import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Loader2, Send, RefreshCw } from 'lucide-react';
import { useToast } from './ui/use-toast';

interface AiQuestionTabProps {
  question: string;
}

export const AiQuestionTab: React.FC<AiQuestionTabProps> = ({ question }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAskAi = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('ask-gemini', {
        body: { prompt: `As a medical expert, please answer this question concisely: ${question}` }
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || "Error communicating with AI service");
      }

      if (data?.error) {
        console.error("AI service error:", data.error);
        throw new Error(data.error || "Error generating response");
      }

      if (data?.response) {
        setResponse(data.response);
        toast({
          title: "Response generated successfully",
        });
      } else {
        throw new Error("No response received from AI");
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || "Error generating response");
      toast({
        title: "Error generating response",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-3 border-gray-800 bg-gray-950/70 backdrop-blur-sm">
      <CardContent className="p-4">
        <Tabs defaultValue="question">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="question">Question</TabsTrigger>
            <TabsTrigger value="askAi">Ask AI</TabsTrigger>
          </TabsList>
          
          <TabsContent value="question" className="text-left">
            <div className="flex items-start gap-2 p-2 bg-gray-900/50 rounded-md">
              <Info className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-200 whitespace-pre-wrap">{question}</div>
            </div>
          </TabsContent>
          
          <TabsContent value="askAi">
            {!response && !isLoading && (
              <div className="flex flex-col items-center space-y-4 py-2">
                <div className="text-gray-400 text-center mb-2">
                  <RefreshCw className="h-5 w-5 mx-auto mb-2" />
                  <p className="text-sm">Ask ACEV about this question</p>
                </div>
                <Button 
                  onClick={handleAskAi} 
                  className="bg-white text-black hover:bg-gray-200 transition-colors duration-200"
                >
                  Generate Answer
                </Button>
              </div>
            )}
            
            {isLoading && (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-400">Generating answer...</span>
              </div>
            )}
            
            {error && !isLoading && (
              <div className="p-3 bg-red-500/20 text-red-300 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {response && !isLoading && (
              <div className="p-3 bg-gray-800/50 text-gray-100 rounded-md text-sm whitespace-pre-wrap">
                {response}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
