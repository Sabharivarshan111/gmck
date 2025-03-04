
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const ChatInput = ({ prompt, setPrompt, onSubmit, isLoading }: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          placeholder="Ask a medical question..."
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            adjustTextareaHeight();
          }}
          onKeyDown={handleKeyDown}
          className="min-h-[36px] max-h-[80px] bg-gray-900 border-gray-700 focus:ring-gray-600 resize-none text-sm flex-grow"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          className="bg-white text-black hover:bg-gray-200 transition-colors duration-200 h-9 w-9 p-0 flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
};
