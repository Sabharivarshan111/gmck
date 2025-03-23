
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme/ThemeProvider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ThemeToggleProps {
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
}

export function ThemeToggle({ size = 'default', variant = 'outline' }: ThemeToggleProps) {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={`
            px-2
            ${theme === "blackpink" ? "text-[#FF5C8D] border-[#FF5C8D]" : ""}
          `}
        >
          {theme === "light" && <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />}
          {theme === "dark" && <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />}
          {theme === "blackpink" && (
            <svg viewBox="0 0 24 24" className="h-[1.2rem] w-[1.2rem] fill-current">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm1-13.5c0 .8-.7 1.5-1.5 1.5S10 7.3 10 6.5 10.7 5 11.5 5s1.5.7 1.5 1.5zm-4 3.5c0 .8-.7 1.5-1.5 1.5S6 11.3 6 10.5 6.7 9 7.5 9 9 9.7 9 10.5zm6 0c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5S17.3 9 16.5 9 15 9.7 15 10.5zM12 17.5c2.3 0 4.3-1.5 5-3.5H7c.7 2 2.7 3.5 5 3.5z" />
            </svg>
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className={theme === "light" ? "bg-accent" : ""}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className={theme === "dark" ? "bg-accent" : ""}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("blackpink")}
          className={theme === "blackpink" ? "bg-accent" : ""}
        >
          <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4 fill-current">
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm1-13.5c0 .8-.7 1.5-1.5 1.5S10 7.3 10 6.5 10.7 5 11.5 5s1.5.7 1.5 1.5zm-4 3.5c0 .8-.7 1.5-1.5 1.5S6 11.3 6 10.5 6.7 9 7.5 9 9 9.7 9 10.5zm6 0c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5S17.3 9 16.5 9 15 9.7 15 10.5zM12 17.5c2.3 0 4.3-1.5 5-3.5H7c.7 2 2.7 3.5 5 3.5z" />
          </svg>
          <span>BlackPink</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
