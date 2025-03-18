
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

interface ChatInputProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isDisabled?: boolean;
}

export const ChatInput = ({ prompt, setPrompt, onSubmit, isLoading, isDisabled }: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { theme } = useTheme();

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
          placeholder={isDisabled ? "Please wait before sending another message..." : "Ask a medical question..."}
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            adjustTextareaHeight();
          }}
          onKeyDown={handleKeyDown}
          className={`min-h-[36px] max-h-[80px] resize-none text-sm flex-grow ${
            theme === "blackpink" 
              ? "bg-black border-pink-500 focus:ring-pink-400 text-pink-400 placeholder-pink-400/50" 
              : theme === "dark" 
                ? "bg-gray-900 border-gray-700 focus:ring-gray-600 text-white" 
                : "bg-gray-100 border-gray-300 focus:ring-gray-400 text-gray-900"
          } ${isDisabled ? 'opacity-60' : ''}`}
          disabled={isLoading || isDisabled}
        />
        <Button 
          type="submit" 
          className={`${
            theme === "blackpink"
              ? "bg-black border border-pink-500 text-pink-400 hover:bg-black/70"
              : theme === "dark"
                ? "bg-white text-black hover:bg-gray-200"
                : "bg-gray-900 text-white hover:bg-gray-800"
          } transition-colors duration-200 h-9 w-9 p-0 flex items-center justify-center`}
          disabled={isLoading || isDisabled}
        >
          {isLoading ? (
            <Loader2 className={`h-4 w-4 animate-spin ${theme === "blackpink" ? "text-pink-400" : ""}`} />
          ) : (
            <Send className={`h-4 w-4 ${theme === "blackpink" ? "text-pink-400" : ""}`} />
          )}
        </Button>
      </div>
    </form>
  );
};
