
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  searchQuery: string;
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SearchBar = ({ searchQuery, handleSearch }: SearchBarProps) => {
  return (
    <div className="relative mb-6">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400 h-4 w-4" />
      <Input
        type="text"
        placeholder="Search questions here"
        value={searchQuery}
        onChange={handleSearch}
        className="w-full bg-gray-800/50 dark:bg-gray-800/50 border-none pl-10 h-12 rounded-full 
                   text-gray-300 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-400
                   bg-white/10 dark:bg-gray-800/50"
      />
    </div>
  );
};

export default SearchBar;
