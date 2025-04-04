
import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, ExternalLink, ExclamationTriangle } from "lucide-react";
import { Reference } from "@/models/ChatMessage";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { isValidMedicalSourceUrl } from "@/lib/utils";

interface ReferencesSectionProps {
  references: Reference[];
}

export const ReferencesSection = ({ references }: ReferencesSectionProps) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  if (!references || references.length === 0) return null;

  // Identify and prioritize references with URLs
  const referencesWithUrls = references.filter(ref => ref.url);
  const referencesWithoutUrls = references.filter(ref => !ref.url);
  
  // Sort references to prioritize trusted medical sources
  const sortedReferences = [
    ...referencesWithUrls.filter(ref => isValidMedicalSourceUrl(ref.url || '')), 
    ...referencesWithUrls.filter(ref => !isValidMedicalSourceUrl(ref.url || '')),
    ...referencesWithoutUrls
  ];

  // Function to render the source label
  const getSourceLabel = (reference: Reference) => {
    if (reference.source) return reference.source;
    if (!reference.url) return null;
    
    try {
      const url = new URL(reference.url);
      // Extract domain and format it
      let domain = url.hostname.replace('www.', '');
      
      // Special cases for common medical sites
      if (domain.includes('pubmed') || domain.includes('ncbi.nlm.nih.gov')) {
        return 'PubMed';
      } else if (domain.includes('mayoclinic')) {
        return 'Mayo Clinic';
      } else if (domain.includes('clevelandclinic')) {
        return 'Cleveland Clinic';
      } else if (domain.includes('medscape')) {
        return 'Medscape';
      } else if (domain.includes('who.int')) {
        return 'WHO';
      } else if (domain.includes('cdc.gov')) {
        return 'CDC';
      } else if (domain.includes('nih.gov')) {
        return 'NIH';
      }
      
      return domain;
    } catch (e) {
      return null;
    }
  };

  return (
    <div className={`mt-3 pt-2 ${theme === "blackpink" ? "border-t border-pink-500/30" : "border-t border-gray-700/50"}`}>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full"
      >
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`w-full justify-between text-xs p-1 ${
              theme === "blackpink" 
                ? "text-pink-400 hover:bg-pink-950/30" 
                : "text-gray-400 hover:bg-gray-800/50"
            }`}
          >
            <span className="flex items-center">
              <FileText className="h-3 w-3 mr-1.5" />
              Sources and references ({sortedReferences.length})
            </span>
            {isOpen ? (
              <ChevronUp className="h-3 w-3 ml-1" />
            ) : (
              <ChevronDown className="h-3 w-3 ml-1" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="space-y-2 text-xs">
            {sortedReferences.map((reference, index) => {
              const isValidSource = reference.url ? isValidMedicalSourceUrl(reference.url) : false;
              const sourceLabel = getSourceLabel(reference);
              
              return (
                <div 
                  key={index} 
                  className={`p-2 rounded ${
                    theme === "blackpink" 
                      ? `bg-black/30 border ${isValidSource ? 'border-pink-500/40' : 'border-pink-500/20'}` 
                      : `bg-gray-800/30 border ${isValidSource ? 'border-blue-500/30' : 'border-gray-700/30'}`
                  }`}
                >
                  {sourceLabel && (
                    <div className={`
                      text-xs font-medium px-1.5 py-0.5 rounded-sm inline-block mb-1 mr-2
                      ${theme === "blackpink" 
                        ? "bg-pink-950/50 text-pink-300" 
                        : isValidSource ? "bg-blue-900/50 text-blue-300" : "bg-gray-700/70 text-gray-300"
                      }
                    `}>
                      {sourceLabel}
                    </div>
                  )}
                  <div className="font-medium">
                    {reference.title}
                  </div>
                  <div className={`text-xs ${theme === "blackpink" ? "text-pink-300/70" : "text-gray-400"}`}>
                    {reference.authors} ({reference.year})
                    {reference.journal && ` - ${reference.journal}`}
                  </div>
                  {reference.url ? (
                    <a 
                      href={reference.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={`flex items-center mt-1 text-xs ${
                        theme === "blackpink" 
                          ? "text-pink-400 hover:text-pink-300" 
                          : isValidSource 
                            ? "text-blue-400 hover:text-blue-300" 
                            : "text-gray-400 hover:text-gray-300"
                      }`}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Source
                    </a>
                  ) : null}
                  
                  {reference.url && !isValidSource && (
                    <div className="mt-1 flex items-start text-xs text-amber-400/80">
                      <ExclamationTriangle className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
                      <span>Non-medical source - use with caution</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
