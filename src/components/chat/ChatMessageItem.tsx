
import { motion } from "framer-motion";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/models/ChatMessage";
import { ReferencesSection } from "./ReferencesSection";

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
        
        // Format markdown links with proper validation
        if (part.includes('[') && part.includes(']') && part.includes('(') && part.includes(')')) {
          // Replace markdown links with proper HTML links, ensuring URLs are valid
          const linkFormatted = part.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
            // Log the markdown link being processed
            console.log('Processing markdown link:', { text, url });
            
            // Clean the URL from any trailing punctuation
            const cleanUrl = url.replace(/[.,;:!?]+$/, '');
            console.log('Cleaned URL:', cleanUrl);
            
            // Ensure URL is properly formatted
            let validUrl = cleanUrl;
            try {
              // Check if URL has protocol
              if (!cleanUrl.match(/^https?:\/\//i)) {
                validUrl = 'https://' + cleanUrl;
                console.log('Added https protocol:', validUrl);
              }
              
              // Test URL validity
              new URL(validUrl);
              console.log('Valid URL created:', validUrl);
            } catch (e) {
              // If invalid, use Google search as fallback
              console.log('URL validation failed:', String(e));
              validUrl = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
              console.log('Using fallback search URL:', validUrl);
            }
            
            return `<a href="${validUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline">${text}</a>`;
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
        
        // Format headings for better readability (especially in medical/pathology answers)
        if (part.includes('\n## ') || part.includes('\n# ')) {
          const headingFormatted = part
            .replace(/\n## (.*?)(?:\n|$)/g, '\n<h3 class="text-lg font-bold mt-3 mb-1 text-blue-300">$1</h3>\n')
            .replace(/\n# (.*?)(?:\n|$)/g, '\n<h2 class="text-xl font-bold mt-4 mb-2 text-blue-200">$1</h2>\n');
          
          return <span key={index} dangerouslySetInnerHTML={{ __html: headingFormatted }} />;
        }
        
        // Check for bold text with ** or __
        if (part.includes('**') || part.includes('__')) {
          const boldFormatted = part
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
            .replace(/__(.*?)__/g, '<strong class="text-white">$1</strong>');
          
          return <span key={index} dangerouslySetInnerHTML={{ __html: boldFormatted }} />;
        }
        
        // Handle numbered lists
        if (/\n\d+\.\s/.test(part)) {
          const listFormatted = part.replace(/\n(\d+)\.\s(.*?)(?=\n\d+\.\s|\n\n|$)/g, 
            '\n<div class="flex gap-2 my-1"><span class="font-bold">$1.</span><span>$2</span></div>');
          
          return <span key={index} dangerouslySetInnerHTML={{ __html: listFormatted }} />;
        }
        
        return <span key={index}>{part}</span>;
      });
    }
    
    return content;
  };

  // Log the references if they exist
  if (message.role === 'assistant' && message.references && message.references.length > 0) {
    console.log('Message has references:', message.references);
  }

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
      
      {/* Add References Section only for assistant messages with references */}
      {message.role === 'assistant' && message.references && message.references.length > 0 && (
        <ReferencesSection references={message.references} />
      )}
    </motion.div>
  );
};

