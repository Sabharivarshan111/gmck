
import QuestionBank from "@/components/QuestionBank";
import { InstallPrompt } from "@/components/InstallPrompt";
import { AiChat } from "@/components/AiChat";
import PomodoroTimer from "@/components/PomodoroTimer";

const Index = () => {
  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      <InstallPrompt />
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center animate-fade-in">
          <div className="w-full mb-8">
            <div className="group">
              <h1 className="text-4xl font-bold mb-8 text-white tracking-tight">
                ACEV
                <span className="text-gray-500 ml-2 text-lg">Medical Education</span>
              </h1>
            </div>
          </div>
          
          <div className="grid gap-8 grid-cols-1 lg:grid-cols-[1fr,1fr] w-full mb-20">
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
    </div>
  );
};

export default Index;
