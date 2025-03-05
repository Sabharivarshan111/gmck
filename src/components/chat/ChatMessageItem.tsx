
import { motion } from "framer-motion";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/models/ChatMessage";

interface ChatMessageItemProps {
  message: ChatMessage;
  onCopy: (content: string) => void;
}

export const ChatMessageItem = ({ message, onCopy }: ChatMessageItemProps) => {
  // Helper to style and format code blocks and markdown in AI responses
  const formatContent = (content: string) => {
    if (message.role !== 'assistant') return content;
    
    // Check for and format code blocks
    if (content.includes('```')) {
      const parts = content.split(/(```(?:.*?\n)?.*?```)/gs);
      
      return parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Extract the code without the backticks
          const codeContent = part.replace(/```(?:.*?\n)?(.*)```/s, '$1').trim();
          
          return (
            <pre key={index} className="bg-gray-800 p-3 rounded-md my-2 overflow-x-auto">
              <code className="text-gray-100 text-xs">{codeContent}</code>
            </pre>
          );
        }
        
        // Format markdown links
        if (part.includes('[') && part.includes(']') && part.includes('(') && part.includes(')')) {
          const linkFormatted = part.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
            return `<a href="${url}" target="_blank" class="text-blue-400 underline">${text}</a>`;
          });
          
          return <span key={index} dangerouslySetInnerHTML={{ __html: linkFormatted }} />;
        }
        
        // Format bullet lists
        if (part.includes('\n- ')) {
          const bulletPoints = part.split('\n- ');
          return (
            <div key={index} className="space-y-1 my-2">
              {bulletPoints[0]}
              <ul className="list-disc list-inside pl-2">
                {bulletPoints.slice(1).map((point, i) => (
                  <li key={i} className="ml-2">{point}</li>
                ))}
              </ul>
            </div>
          );
        }
        
        // Check for bold text with ** or __
        if (part.includes('**') || part.includes('__')) {
          const boldFormatted = part
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>');
          
          return <span key={index} dangerouslySetInnerHTML={{ __html: boldFormatted }} />;
        }
        
        return <span key={index}>{part}</span>;
      });
    }
    
    return content;
  };

  return (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-lg p-3",
        message.role === 'user' 
          ? "bg-gray-800/50 text-white ml-4" 
          : "bg-gray-900/50 text-gray-100 mr-4 border-l-2 border-white/20"
      )}
    >
      <div className="flex justify-between items-start mb-1">
        <p className="text-xs font-medium text-gray-400">
          {message.role === 'user' ? 'You' : 'ACEV'}
        </p>
        {message.role === 'assistant' && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            onClick={() => onCopy(message.content)}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <div className="whitespace-pre-wrap text-sm">
        {formatContent(message.content)}
      </div>
      {message.role === 'user' && message.content.includes("Triple-tapped:") && (
        <div className="mt-1 text-xs text-blue-400">
          Question from triple-tap interaction
        </div>
      )}
    </motion.div>
  );
};
