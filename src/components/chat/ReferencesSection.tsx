
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Reference } from '@/models/ChatMessage';

interface ReferencesSectionProps {
  references: Reference[];
}

export const ReferencesSection: React.FC<ReferencesSectionProps> = ({ references }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  if (!references || references.length === 0) {
    return null;
  }

  // Theme-specific styles
  const containerStyles = {
    dark: "bg-gray-800/60 border border-gray-700",
    light: "bg-white border border-gray-200",
    blackpink: "bg-black border border-[#FF5C8D]"
  };

  const headerStyles = {
    dark: "text-white",
    light: "text-gray-900",
    blackpink: "text-[#FF5C8D]"
  };

  const contentStyles = {
    dark: "bg-gray-800/80 text-gray-200",
    light: "bg-gray-50 text-gray-700",
    blackpink: "bg-black text-[#FFDEE2]"
  };

  const linkStyles = {
    dark: "text-blue-400 hover:text-blue-300",
    light: "text-blue-600 hover:text-blue-500",
    blackpink: "text-[#FF5C8D] hover:text-[#FF8CAD]"
  };

  // Verify all references have valid URLs, filter out any that don't
  const validReferences = references.filter(ref => {
    if (!ref.url) return false;
    try {
      // Basic URL validation
      new URL(ref.url);
      return true;
    } catch (e) {
      console.error("Invalid URL in reference:", ref);
      return false;
    }
  });

  if (validReferences.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 mb-2 rounded-lg overflow-hidden shadow-sm">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className={`${containerStyles[theme]} rounded-lg transition-all duration-200`}
      >
        <CollapsibleTrigger className="w-full p-3 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 cursor-pointer">
          <div className={`flex items-center space-x-2 ${headerStyles[theme]} font-medium`}>
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>Sources and related content</span>
          </div>
          <span className="text-xs text-gray-500">{validReferences.length} source{validReferences.length > 1 ? 's' : ''}</span>
        </CollapsibleTrigger>
        
        <CollapsibleContent className={`p-3 ${contentStyles[theme]} border-t ${theme === 'blackpink' ? 'border-[#FF5C8D]/30' : theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <ul className="space-y-2">
            {validReferences.map((reference, index) => (
              <li key={index} className="pl-2 border-l-2 border-opacity-50 border-blue-400">
                <div className="flex flex-col">
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${linkStyles[theme]} font-medium flex items-center hover:underline`}
                  >
                    {reference.title}
                    <ExternalLink className="h-3 w-3 ml-1 inline-block" />
                  </a>
                  
                  {(reference.author || reference.year || reference.journal) && (
                    <p className="text-xs text-opacity-80 mt-1">
                      {reference.author && <span>{reference.author}</span>}
                      {reference.year && reference.author && <span>, </span>}
                      {reference.year && <span>{reference.year}</span>}
                      {reference.journal && (reference.author || reference.year) && <span>, </span>}
                      {reference.journal && <span className="italic">{reference.journal}</span>}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
