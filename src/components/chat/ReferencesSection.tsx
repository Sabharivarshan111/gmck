
import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Link, ExternalLink } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface Reference {
  title: string;
  authors?: string;
  publication?: string;
  year?: string | number;
  url?: string;
  type: "article" | "link";
}

interface ReferencesSectionProps {
  references: Reference[];
}

export const ReferencesSection = ({ references }: ReferencesSectionProps) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  if (!references || references.length === 0) {
    return null;
  }

  const titleClassName = theme === "blackpink" 
    ? "text-[#FF5C8D] flex items-center gap-2 text-sm font-medium cursor-pointer hover:text-[#FF8CAD] transition-colors"
    : "text-blue-400 flex items-center gap-2 text-sm font-medium cursor-pointer hover:text-blue-300 transition-colors";
  
  const referenceItemClassName = theme === "blackpink"
    ? "bg-black/60 border border-[#FF5C8D]/30 rounded-md p-3 mb-2"
    : "bg-gray-800/60 border border-gray-700/40 rounded-md p-3 mb-2";
    
  const linkClassName = theme === "blackpink"
    ? "text-[#FF5C8D] hover:text-[#FF8CAD] flex items-center gap-1 text-xs"
    : "text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs";

  return (
    <div className="mt-3 pt-2 border-t border-gray-700/40">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className={titleClassName}>
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Sources and related content
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          {references.map((reference, index) => (
            <div key={index} className={referenceItemClassName}>
              <div className="flex items-start gap-2">
                {reference.type === "article" ? (
                  <FileText className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <Link className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-100">
                    {reference.title}
                  </p>
                  {reference.authors && (
                    <p className="text-xs text-gray-400 mt-1">
                      {reference.authors}, {reference.publication} ({reference.year})
                    </p>
                  )}
                  {reference.url && (
                    <a 
                      href={reference.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={linkClassName}
                    >
                      {new URL(reference.url).hostname}
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
