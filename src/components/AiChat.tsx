
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
    <div className="w-full max-w-3xl mx-auto p-4 space-y-4">
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Ask any medical question..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Ask AI'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {response && (
        <Card>
          <CardContent className="p-4">
            <div className="prose dark:prose-invert">
              <h3 className="text-lg font-semibold mb-2">AI Response:</h3>
              <div className="whitespace-pre-wrap text-sm">
                {response}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
