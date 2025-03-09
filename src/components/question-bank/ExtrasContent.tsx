
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExtrasContentProps {
  driveLink?: string;
}

const ExtrasContent = ({ driveLink = "https://drive.google.com" }: ExtrasContentProps) => {
  const handleOpenDrive = () => {
    window.open(driveLink, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <div className="text-center max-w-md space-y-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Additional Resources
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Access supplementary materials, lecture notes, and additional study resources in our Google Drive folder.
        </p>
        <Button 
          size="lg" 
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleOpenDrive}
        >
          <ExternalLink className="mr-2 h-5 w-5" />
          Open Google Drive
        </Button>
      </div>
    </div>
  );
};

export default ExtrasContent;
