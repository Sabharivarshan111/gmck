
import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleThemeChange = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    setIsOpen(false);
    
    toast({
      title: `${newTheme === "dark" ? "Dark" : "Light"} theme activated`,
      description: `The app will now use the ${newTheme} theme`,
      duration: 2000,
    });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className={`w-9 h-9 rounded-full ${
            theme === "dark" 
              ? "bg-gray-800/60 border border-gray-700/60 hover:bg-gray-700/60" 
              : "bg-white border border-gray-200 hover:bg-gray-100"
          }`}
        >
          {theme === "dark" ? (
            <Moon className="h-4 w-4 text-white" />
          ) : (
            <Sun className="h-4 w-4 text-gray-900" />
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
