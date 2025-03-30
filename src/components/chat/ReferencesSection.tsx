
import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, ExternalLink } from "lucide-react";
import { Reference } from "@/models/ChatMessage";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ReferencesSectionProps {
  references: Reference[];
}

export const ReferencesSection = ({ references }: ReferencesSectionProps) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  if (!references || references.length === 0) return null;

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
              Sources and related content ({references.length})
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
            {references.map((reference, index) => (
              <div 
                key={index} 
                className={`p-2 rounded ${
                  theme === "blackpink" 
                    ? "bg-black/30 border border-pink-500/20" 
                    : "bg-gray-800/30 border border-gray-700/30"
                }`}
              >
                <div className="font-medium">
                  {reference.title}
                </div>
                <div className={`text-xs ${theme === "blackpink" ? "text-pink-300/70" : "text-gray-400"}`}>
                  {reference.authors} ({reference.year})
                  {reference.journal && ` - ${reference.journal}`}
                </div>
                {reference.url && (
                  <a 
                    href={reference.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`flex items-center mt-1 text-xs ${
                      theme === "blackpink" 
                        ? "text-pink-400 hover:text-pink-300" 
                        : "text-blue-400 hover:text-blue-300"
                    }`}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Source
                  </a>
                )}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
