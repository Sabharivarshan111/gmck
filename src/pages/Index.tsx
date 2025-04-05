
import { useEffect } from "react";
import QuestionBank from "@/components/QuestionBank";
import { InstallPrompt } from "@/components/InstallPrompt";
import { AiChat } from "@/components/AiChat";
import PomodoroTimer from "@/components/PomodoroTimer";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";

const Index = () => {
  const { theme } = useTheme();
  
  // Ensure the page starts at the top when loaded
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      <InstallPrompt />
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center animate-fade-in">
          <div className="w-full mb-8">
            <div className="flex justify-between items-center">
              <div className="group">
                <h1 className="text-4xl font-bold mb-2 text-foreground tracking-tight">
                  ACEV
                  <span className="text-muted-foreground ml-2 text-lg">MBBS QBANK WITH AI</span>
                </h1>
              </div>
              <ThemeToggle />
            </div>
          </div>
          
          <div className="grid gap-8 grid-cols-1 lg:grid-cols-[1fr,1fr] w-full mb-28">
            <div className="space-y-8">
              <QuestionBank />
            </div>
            
            <div className="lg:h-[calc(100vh-12rem)] overflow-hidden flex flex-col">
              <AiChat />
            </div>
          </div>
        </div>
      </div>
      <PomodoroTimer />
      
      {/* Creator attribution */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-muted-foreground">
        Created by{' '}
        <a 
          href="https://www.instagram.com/_varshan_king/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:underline hover:text-primary transition-colors"
        >
          Sabharivarshan S
        </a>
      </div>
    </div>
  );
};

export default Index;
