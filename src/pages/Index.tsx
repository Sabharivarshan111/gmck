
import QuestionBank from "@/components/QuestionBank";
import { InstallPrompt } from "@/components/InstallPrompt";
import PomodoroTimer from "@/components/PomodoroTimer";
import { AiChat } from "@/components/AiChat";

const Index = () => {
  return (
    <div className="container mx-auto px-4">
      <InstallPrompt />
      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
        <div className="space-y-8">
          <QuestionBank />
          <PomodoroTimer />
        </div>
        <div>
          <AiChat />
        </div>
      </div>
    </div>
  );
};

export default Index;
