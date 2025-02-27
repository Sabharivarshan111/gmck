
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

export const AiChat = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast({
        title: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ask-gemini', {
        body: { prompt: prompt.trim() }
      });

      if (error) throw error;

      if (data?.response) {
        setResponse(data.response);
        toast({
          title: "Response generated successfully",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error generating response",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full space-y-4"
    >
      <Card className="backdrop-blur-sm bg-gray-950/50 border-gray-800">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Ask any medical question..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] bg-gray-900 border-gray-800 focus:ring-gray-700"
            />
            <Button 
              type="submit" 
              className="w-full bg-white text-black hover:bg-gray-200 transition-colors duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Ask AI
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AnimatePresence>
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="backdrop-blur-sm bg-gray-950/50 border-gray-800">
              <CardContent className="p-4">
                <div className="prose dark:prose-invert max-w-none">
                  <h3 className="text-lg font-semibold mb-2 text-white">AI Response:</h3>
                  <div className="whitespace-pre-wrap text-sm text-gray-300">
                    {response}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
