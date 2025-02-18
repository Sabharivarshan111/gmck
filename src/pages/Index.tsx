
import QuestionBank from "@/components/QuestionBank";
import { InstallPrompt } from "@/components/InstallPrompt";
import PomodoroTimer from "@/components/PomodoroTimer";

const Index = () => {
  return (
    <div className="min-h-screen bg-black">
      <InstallPrompt />
      <QuestionBank />
      <PomodoroTimer />
    </div>
  );
};

export default Index;
