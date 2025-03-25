
import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, ExternalLink, Link2 } from "lucide-react";
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
              <ChevronDown className={`h-3 w-3 mr-1.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
              Sources and related content {references.length > 0 && `(${references.length})`}
            </span>
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
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {reference.url ? (
                      <Link2 className={`h-4 w-4 ${theme === "blackpink" ? "text-pink-400" : "text-blue-400"}`} />
                    ) : (
                      <FileText className={`h-4 w-4 ${theme === "blackpink" ? "text-pink-400" : "text-blue-400"}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {reference.title}
                    </div>
                    <div className={theme === "blackpink" ? "text-pink-300/70" : "text-gray-400"}>
                      {reference.journal 
                        ? `${reference.authors.includes(',') ? reference.authors.split(',')[0] + ' et al.' : reference.authors}, ${reference.journal} (${reference.year})`
                        : `${reference.authors} (${reference.year})`
                      }
                    </div>
                    {reference.url && (
                      <a 
                        href={reference.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`flex items-center mt-1 ${
                          theme === "blackpink" 
                            ? "text-pink-400 hover:text-pink-300" 
                            : "text-blue-400 hover:text-blue-300"
                        }`}
                      >
                        {new URL(reference.url).hostname}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
