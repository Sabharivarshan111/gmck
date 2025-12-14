import { useEffect } from "react";
import { Link } from "react-router-dom";
import QuestionBank from "@/components/QuestionBank";
import { InstallPrompt } from "@/components/InstallPrompt";
import { AiChat } from "@/components/AiChat";
import PomodoroTimer from "@/components/PomodoroTimer";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Eye } from "lucide-react";
import { AdBanner } from "@/components/AdBanner";

const Index = () => {
  const { theme } = useTheme();
  
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
                <h1 className="text-4xl font-bold mb-2 text-foreground tracking-tight flex items-center gap-2">
                  <Eye className="h-8 w-8" />
                  ORBIT
                  <span className="text-muted-foreground ml-2 text-lg">MBBS QBANK WITH AI</span>
                </h1>
              </div>
              <ThemeToggle />
            </div>
          </div>
          
          {/* Header Ad Banner */}
          <AdBanner adSlot="YOUR_AD_SLOT_1" adFormat="horizontal" className="w-full max-w-3xl" />
          
          <div className="grid gap-8 grid-cols-1 lg:grid-cols-[1fr,1fr] w-full mb-28">
            <div className="space-y-8">
              <QuestionBank />
            </div>
            
            <div className="lg:h-[calc(100vh-12rem)] overflow-hidden flex flex-col">
              <AiChat />
            </div>
          </div>
          
          {/* Footer Ad Banner */}
          <AdBanner adSlot="YOUR_AD_SLOT_2" adFormat="horizontal" className="w-full max-w-3xl" />
        </div>
      </div>
      <PomodoroTimer />
      
      <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-muted-foreground">
        <div className="flex justify-center gap-4 mb-2">
          <Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link to="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
          <Link to="/about" className="hover:text-primary transition-colors">About</Link>
        </div>
        Created by{' '}
        <a 
          href="https://www.instagram.com/_varshan_king/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="
            transition-all duration-300 
            animate-pulse 
            text-primary 
            drop-shadow-[0_0_10px_rgba(255,92,141,0.5)] 
            cursor-pointer 
            px-2 py-1 
            rounded-md 
            border border-transparent 
            border-primary/30 
            bg-primary/10
            hover:animate-none
          "
        >
          Sabharivarshan S
        </a>
      </div>
    </div>
  );
};

export default Index;
