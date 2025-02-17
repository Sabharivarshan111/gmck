
import QuestionBank from "@/components/QuestionBank";
import { InstallPrompt } from "@/components/InstallPrompt";
import PomodoroTimer from "@/components/PomodoroTimer";

const Index = () => {
  return (
    <>
      <InstallPrompt />
      <QuestionBank />
      <PomodoroTimer />
    </>
  );
};

export default Index;
