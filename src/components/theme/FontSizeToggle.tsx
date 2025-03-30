
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Type } from "lucide-react";

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 24;
const DEFAULT_FONT_SIZE = 16;
const FONT_SIZE_STORAGE_KEY = "app-font-size";

export function FontSizeToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved font size from local storage on initial render
    const savedFontSize = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    if (savedFontSize) {
      setFontSize(Number(savedFontSize));
      applyFontSize(Number(savedFontSize));
    } else {
      // If no saved font size, apply the default
      applyFontSize(DEFAULT_FONT_SIZE);
    }
  }, []);

  const applyFontSize = (size: number) => {
    document.documentElement.style.fontSize = `${size}px`;
    
    // Apply font size to specific elements
    const questionCards = document.querySelectorAll('.question-card');
    questionCards.forEach(card => {
      const cardElement = card as HTMLElement;
      cardElement.style.fontSize = `${size * 0.875}px`; // 0.875 is roughly equivalent to text-sm
      
      // Adjust padding based on font size
      const paddingScale = size / DEFAULT_FONT_SIZE;
      cardElement.style.padding = `${Math.max(8, 12 * paddingScale)}px ${Math.max(12, 16 * paddingScale)}px`;
    });
    
    // Save to local storage
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, size.toString());
  };

  const handleFontSizeChange = (value: number[]) => {
    const newSize = value[0];
    setFontSize(newSize);
    applyFontSize(newSize);
  };

  const handlePresetClick = (size: number) => {
    setFontSize(size);
    applyFontSize(size);
    setIsOpen(false);
    
    toast({
      title: `Font size: ${size}px`,
      description: "Text size has been updated",
      duration: 2000,
    });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="w-9 h-9 rounded-full bg-white border border-gray-200 hover:bg-gray-100 dark:bg-gray-800/60 dark:border-gray-700/60 dark:hover:bg-gray-700/60"
        >
          <Type className="h-4 w-4 text-gray-900 dark:text-white" />
          <span className="sr-only">Adjust font size</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="mt-2 w-64 p-4">
        <div className="mb-4 text-sm font-medium">
          Text Size: {fontSize}px
        </div>
        
        <Slider 
          value={[fontSize]} 
          min={MIN_FONT_SIZE} 
          max={MAX_FONT_SIZE} 
          step={1}
          onValueChange={handleFontSizeChange}
          className="mb-6"
        />
        
        <div className="grid grid-cols-3 gap-2">
          <DropdownMenuItem 
            onClick={() => handlePresetClick(14)}
            className="flex justify-center"
          >
            Small
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handlePresetClick(16)}
            className="flex justify-center"
          >
            Medium
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handlePresetClick(20)}
            className="flex justify-center"
          >
            Large
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
