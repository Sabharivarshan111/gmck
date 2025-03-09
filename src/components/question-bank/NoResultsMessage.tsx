
import { AlertTriangle } from "lucide-react";

interface NoResultsMessageProps {
  searchQuery: string;
}

const NoResultsMessage = ({ searchQuery }: NoResultsMessageProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-700 dark:text-gray-400">
      <AlertTriangle className="h-8 w-8 mb-2 text-amber-500" />
      <p>No results found for "{searchQuery}"</p>
    </div>
  );
};

export default NoResultsMessage;
