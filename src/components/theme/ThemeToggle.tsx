
import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FontSizeToggle } from "./FontSizeToggle";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleThemeChange = (newTheme: "dark" | "light" | "blackpink") => {
    setTheme(newTheme);
    setIsOpen(false);
    
    const themeName = 
      newTheme === "dark" ? "Dark" : 
      newTheme === "light" ? "Light" : 
      "Black Pink";
    
    toast({
      title: `${themeName} theme activated`,
      description: `The app will now use the ${themeName.toLowerCase()} theme`,
      duration: 2000,
    });
  };

  const buttonClass = theme === "dark" 
    ? "bg-gray-800/60 border border-gray-700/60 hover:bg-gray-700/60"
    : theme === "light"
      ? "bg-white border border-gray-200 hover:bg-gray-100" 
      : "bg-black border border-[#FF5C8D] hover:bg-black/80"; // Using darker pink color

  return (
    <div className="flex items-center space-x-2">
      <FontSizeToggle />
      
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            className={`w-9 h-9 rounded-full ${buttonClass} font-toggle-button`}
          >
            {theme === "dark" ? (
              <Moon className="h-4 w-4 text-white" />
            ) : theme === "light" ? (
              <Sun className="h-4 w-4 text-gray-900" />
            ) : (
              <span className="h-4 w-4 flex items-center justify-center text-[#FF5C8D] font-bold">BP</span>
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={`mt-2 ${theme === "blackpink" ? "bg-black border-[#FF5C8D]" : ""}`}>
          <DropdownMenuItem 
            onClick={() => handleThemeChange("dark")}
            className={`flex items-center gap-2 ${theme === "dark" ? "bg-gray-700/60" : ""} ${theme === "blackpink" ? "text-[#FF5C8D] hover:bg-black/60" : ""}`}
          >
            <Moon className={`h-4 w-4 ${theme === "blackpink" ? "text-[#FF5C8D]" : ""}`} />
            <span className={theme === "blackpink" ? "text-[#FF5C8D]" : ""}>Dark</span>
            {theme === "dark" && <span className={`ml-auto text-xs ${theme === "blackpink" ? "text-[#FF5C8D]" : ""}`}>Default</span>}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleThemeChange("light")}
            className={`flex items-center gap-2 ${theme === "light" ? "bg-gray-200/60" : ""} ${theme === "blackpink" ? "text-[#FF5C8D] hover:bg-black/60" : ""}`}
          >
            <Sun className={`h-4 w-4 ${theme === "blackpink" ? "text-[#FF5C8D]" : ""}`} />
            <span className={theme === "blackpink" ? "text-[#FF5C8D]" : ""}>Light</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className={theme === "blackpink" ? "bg-[#FF5C8D]/30" : ""} />
          <DropdownMenuItem
            onClick={() => handleThemeChange("blackpink")}
            className={`flex items-center gap-2 ${theme === "blackpink" ? "bg-black/60 text-[#FF5C8D] hover:bg-black/90" : ""}`}
          >
            <span className={theme === "blackpink" ? "text-[#FF5C8D] font-bold text-sm" : "text-pink-500 font-bold text-sm"}>BP</span>
            <span className={theme === "blackpink" ? "text-[#FF5C8D]" : ""}>Black Pink</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
