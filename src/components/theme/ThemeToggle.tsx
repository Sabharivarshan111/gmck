
import { useState } from "react";
import { Moon, Sun, Plus } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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

  return (
    <div className="flex items-center space-x-2">
      <FontSizeToggle />
      
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            className={`w-9 h-9 rounded-full ${
              theme === "dark" 
                ? "bg-gray-800/60 border border-gray-700/60 hover:bg-gray-700/60" 
                : theme === "light"
                ? "bg-white border border-gray-200 hover:bg-gray-100"
                : "bg-black border border-[#D946EF]/60 hover:bg-gray-900/60"
            }`}
          >
            {theme === "dark" ? (
              <Moon className="h-4 w-4 text-white" />
            ) : theme === "light" ? (
              <Sun className="h-4 w-4 text-gray-900" />
            ) : (
              <span className="h-4 w-4 flex items-center justify-center text-[#D946EF] font-bold">BP</span>
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="mt-2">
          <DropdownMenuItem 
            onClick={() => handleThemeChange("dark")}
            className={`flex items-center gap-2 ${theme === "dark" ? "bg-gray-700/60" : ""}`}
          >
            <Moon className="h-4 w-4" />
            <span>Dark</span>
            {theme === "dark" && <span className="ml-auto text-xs">Default</span>}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleThemeChange("light")}
            className={`flex items-center gap-2 ${theme === "light" ? "bg-gray-200/60" : ""}`}
          >
            <Sun className="h-4 w-4" />
            <span>Light</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleThemeChange("blackpink")}
            className={`flex items-center gap-2 ${theme === "blackpink" ? "bg-black text-[#D946EF]" : ""}`}
          >
            <span className="text-[#D946EF] font-bold text-sm">BP</span>
            <span>Black Pink</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
