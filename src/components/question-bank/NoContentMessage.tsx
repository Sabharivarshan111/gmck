
import { FolderOpen } from "lucide-react";

const NoContentMessage = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400 min-h-[500px] bg-white dark:bg-transparent">
      <FolderOpen className="h-12 w-12 mb-2 text-gray-400 dark:text-gray-500" />
      <p className="text-gray-700 dark:text-gray-400">No content available</p>
    </div>
  );
};

export default NoContentMessage;
