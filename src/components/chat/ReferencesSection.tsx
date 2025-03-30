import React, { useState, useEffect } from 'react';
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
  const [processedReferences, setProcessedReferences] = useState<Array<Reference & { originalUrl?: string }>>([]);

  useEffect(() => {
    if (!references || references.length === 0) {
      return;
    }

    // Process references and log transformations
    const processed = references.map(reference => {
      const originalUrl = reference.url;
      let validatedUrl = reference.url;
      
      console.log('Processing reference:', {
        title: reference.title,
        originalUrl
      });
      
      // Ensure the URL is valid and clean
      try {
        if (reference.url) {
          validatedUrl = cleanAndValidateUrl(reference.url);
          
          // Log URL transformation
          console.log('URL transformation:', {
            title: reference.title,
            originalUrl,
            cleanedUrl: validatedUrl,
            different: originalUrl !== validatedUrl
          });
        } else {
          validatedUrl = getSafeUrlForMedicalTopic(reference.title);
          console.log('Generated fallback URL:', {
            title: reference.title,
            fallbackUrl: validatedUrl
          });
        }
      } catch (e) {
        validatedUrl = getSafeUrlForMedicalTopic(reference.title);
        console.log('Error processing URL:', {
          title: reference.title,
          originalUrl,
          error: String(e),
          fallbackUrl: validatedUrl
        });
      }
      
      return {
        ...reference,
        url: validatedUrl,
        originalUrl
      };
    });
    
    setProcessedReferences(processed);
  }, [references]);

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

  // Function to clean and validate URLs
  const cleanAndValidateUrl = (url: string): string => {
    console.log('Cleaning URL:', url);
    
    // Remove any markdown formatting if present
    let cleanedUrl = url.replace(/[\[\]()]/g, '');
    console.log('After markdown cleaning:', cleanedUrl);
    
    // Remove any trailing punctuation
    cleanedUrl = cleanedUrl.replace(/[.,;:?!]$/, '');
    console.log('After trailing punctuation removal:', cleanedUrl);
    
    try {
      // Check if the URL has a protocol, if not add https
      if (!cleanedUrl.match(/^https?:\/\//i)) {
        cleanedUrl = 'https://' + cleanedUrl;
        console.log('Added https protocol:', cleanedUrl);
      }
      
      // Try to create a URL object to validate
      const urlObj = new URL(cleanedUrl);
      console.log('Valid URL object created:', urlObj.href);
      
      // Ensure only http or https protocols
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        console.log('Invalid protocol detected:', urlObj.protocol);
        throw new Error('Invalid protocol');
      }
      
      // Keep full URL path including query parameters and hash
      return urlObj.href;
    } catch (e) {
      // If there's any issue with the URL, fall back to a Google search for the title
      console.log('URL validation error:', String(e));
      const fallbackUrl = getSafeUrlForMedicalTopic(url);
      console.log('Using fallback URL:', fallbackUrl);
      return fallbackUrl;
    }
  };
  
  // Function to get safe fallback URLs for medical topics
  const getSafeUrlForMedicalTopic = (title: string): string => {
    const lowerTitle = title.toLowerCase();
    
    // Map to reliable medical websites based on content
    if (lowerTitle.includes("pubmed") || lowerTitle.includes("ncbi")) {
      return "https://pubmed.ncbi.nlm.nih.gov/";
    } else if (lowerTitle.includes("uptodate") || lowerTitle.includes("up to date")) {
      return "https://www.uptodate.com/";
    } else if (lowerTitle.includes("medscape")) {
      return "https://www.medscape.com/";
    } else if (lowerTitle.includes("mayo")) {
      return "https://www.mayoclinic.org/";
    } else if (lowerTitle.includes("who") || lowerTitle.includes("world health")) {
      return "https://www.who.int/";
    } else if (lowerTitle.includes("cdc")) {
      return "https://www.cdc.gov/";
    } else if (lowerTitle.includes("nejm")) {
      return "https://www.nejm.org/";
    } else if (lowerTitle.includes("jama") || lowerTitle.includes("journal")) {
      return "https://jamanetwork.com/";
    } else if (lowerTitle.includes("bmj")) {
      return "https://www.bmj.com/";
    } else if (lowerTitle.includes("lancet")) {
      return "https://www.thelancet.com/";
    } else if (lowerTitle.includes("robbins") || lowerTitle.includes("pathology")) {
      return "https://www.elsevier.com/books/robbins-and-cotran-pathologic-basis-of-disease/kumar/978-0-323-53113-9";
    } else {
      // Use Google Scholar as a safer general fallback
      return `https://scholar.google.com/scholar?q=${encodeURIComponent(title)}`;
    }
  };

  const handleLinkClick = (url: string, originalUrl: string | undefined, title: string) => {
    console.log('Link clicked:', {
      title,
      originalUrl,
      processedUrl: url
    });
  };

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
          <span className="text-xs text-gray-500">{processedReferences.length} source{processedReferences.length > 1 ? 's' : ''}</span>
        </CollapsibleTrigger>
        
        <CollapsibleContent className={`p-3 ${contentStyles[theme]} border-t ${theme === 'blackpink' ? 'border-[#FF5C8D]/30' : theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <ul className="space-y-2">
            {processedReferences.map((reference, index) => (
              <li key={index} className="pl-2 border-l-2 border-opacity-50 border-blue-400">
                <div className="flex flex-col">
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${linkStyles[theme]} font-medium flex items-center hover:underline`}
                    onClick={() => handleLinkClick(reference.url, reference.originalUrl, reference.title)}
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
