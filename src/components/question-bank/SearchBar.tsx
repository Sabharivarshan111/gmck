
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  searchQuery: string;
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SearchBar = ({ searchQuery, handleSearch }: SearchBarProps) => {
  return (
    <div className="relative mb-6">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-5 w-5" />
      <Input
        type="text"
        placeholder="Search questions here"
        value={searchQuery}
        onChange={handleSearch}
        className="w-full bg-gray-100 dark:bg-gray-800/50 border-none pl-12 h-14 rounded-full 
                   text-gray-700 dark:text-gray-300 placeholder:text-gray-500 dark:placeholder:text-gray-400
                   hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors text-base"
      />
    </div>
  );
};

export default SearchBar;
