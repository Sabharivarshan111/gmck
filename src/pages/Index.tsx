
import QuestionBank from "@/components/QuestionBank";
import { InstallPrompt } from "@/components/InstallPrompt";
import PomodoroTimer from "@/components/PomodoroTimer";
import { AiChat } from "@/components/AiChat";

const Index = () => {
  return (
    <>
      <InstallPrompt />
      <QuestionBank />
      <PomodoroTimer />
      <AiChat />
    </>
  );
};

export default Index;
