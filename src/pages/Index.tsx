
import QuestionBank from "@/components/QuestionBank";
import { InstallPrompt } from "@/components/InstallPrompt";
import { AiChat } from "@/components/AiChat";
import PomodoroTimer from "@/components/PomodoroTimer";

const Index = () => {
  return (
    <div className="min-h-screen bg-black">
      <InstallPrompt />
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-[2fr,1fr] animate-fade-in">
          <div className="space-y-8">
            <div className="group">
              <h1 className="text-4xl font-bold mb-8 text-white tracking-tight">
                ACEV
                <span className="text-gray-500 ml-2 text-lg">Medical Education</span>
              </h1>
              <QuestionBank />
            </div>
          </div>
          <div className="lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
            <AiChat />
          </div>
        </div>
      </div>
      <PomodoroTimer />
    </div>
  );
};

export default Index;
