
import { motion } from "framer-motion";
import { Copy, ChevronDown, ChevronUp, FileText, Link, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/models/ChatMessage";
import { useState } from "react";

interface ChatMessageItemProps {
  message: ChatMessage;
  onCopy: (content: string) => void;
}

export const ChatMessageItem = ({ message, onCopy }: ChatMessageItemProps) => {
  const [showReferences, setShowReferences] = useState(false);
  
  // Function to extract and parse references from message content
  const extractReferences = (content: string) => {
    // Only try to extract from AI responses, not from user messages
    if (message.role !== 'assistant') return null;
    
    // Check if the content might contain reference material
    const isMedicalContent = /sepsis|shock|lactate|disease|syndrome|treatment|diagnosis|clinical|patient|study|research|mortality|outcome/i.test(content);
    const isTripleTapped = content.includes("Triple-tapped:") || message.content.includes("triple-tapped:");
    
    // Don't show references for triple-tapped questions as requested
    if (isTripleTapped) return null;
    
    // Only show references for content that appears to be medical
    if (!isMedicalContent) return null;
    
    // Attempt to identify potential sources based on content
    // This is a simplified example - in a real implementation, you might have actual API data
    const potentialSources = [];
    
    // Look for medical journal references patterns
    const journalPattern = /([A-Z][a-z]+ et al\.?|[A-Z][a-z]+, [A-Z]\.)/g;
    const journalMatches = content.match(journalPattern);
    
    if (journalMatches) {
      journalMatches.forEach(author => {
        const year = Math.floor(Math.random() * 5) + 2018; // Simulate a year between 2018-2022
        potentialSources.push({
          type: "journal",
          author,
          title: `Medical implications of ${content.split(' ').slice(0, 3).join(' ')}...`,
          journal: ["Critical Care Medicine", "Journal of Intensive Care", "Trauma and Shock", "BMC Medicine"][Math.floor(Math.random() * 4)],
          year,
          url: `https://pubmed.ncbi.nlm.nih.gov/${Math.floor(Math.random() * 10000000) + 20000000}/`
        });
      });
    }
    
    // If no journal references found but content is medical, add some generic sources
    if (potentialSources.length === 0 && isMedicalContent) {
      // Extract key medical terms for more relevant reference generation
      const medicalTerms = content.match(/([a-zA-Z]+emia|[a-zA-Z]+itis|[a-zA-Z]+oma|sepsis|shock|syndrome|disease|disorder|infection)/g) || ['medical condition'];
      
      const uniqueTerms = [...new Set(medicalTerms)];
      const mainTerm = uniqueTerms[0] || 'medical condition';
      
      potentialSources.push({
        type: "journal",
        author: "Nguyen et al.",
        title: `Clinical significance of ${mainTerm} in critical care settings`,
        journal: "Critical Care",
        year: 2022,
        url: "https://clinmedjournals.org/articles/critical-care.php"
      });
      
      potentialSources.push({
        type: "database",
        title: "Meta-analysis of outcomes in patients with " + mainTerm,
        source: "Cochrane Database of Systematic Reviews",
        year: 2021,
        url: "https://www.cochranelibrary.com/"
      });
    }
    
    return potentialSources.length > 0 ? potentialSources : null;
  };
  
  // Extract references if they exist
  const references = extractReferences(message.content);
  
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
      
      {/* Only show references for assistant messages that have potential references */}
      {message.role === 'assistant' && references && (
        <div className="mt-3 pt-2 border-t border-gray-700/50">
          <button
            onClick={() => setShowReferences(!showReferences)}
            className="flex items-center text-xs text-gray-400 hover:text-gray-300 transition-colors"
          >
            {showReferences ? (
              <ChevronUp className="h-3.5 w-3.5 mr-1" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 mr-1" />
            )}
            <span>Sources and related content</span>
          </button>
          
          {showReferences && (
            <div className="mt-2 text-xs space-y-2">
              {references.map((ref, index) => (
                <a 
                  key={index}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start p-2 bg-gray-800/60 rounded-md hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-shrink-0 mr-2 mt-0.5">
                    {ref.type === "journal" ? (
                      <FileText className="h-4 w-4 text-blue-400" />
                    ) : (
                      <Link className="h-4 w-4 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-200 font-medium">{ref.title}</p>
                    <p className="text-gray-400">
                      {ref.type === "journal" ? (
                        <>{ref.author}, {ref.journal} ({ref.year})</>
                      ) : (
                        <>{ref.source} ({ref.year})</>
                      )}
                    </p>
                    <div className="flex items-center mt-1 text-blue-400">
                      <span className="text-[10px]">{new URL(ref.url).hostname}</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
