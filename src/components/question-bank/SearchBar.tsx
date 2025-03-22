
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme/ThemeProvider";

interface SearchBarProps {
  searchQuery: string;
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SearchBar = ({ searchQuery, handleSearch }: SearchBarProps) => {
  const { theme } = useTheme();
  
  return (
    <div className="relative mb-6">
      <Search 
        className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
          theme === "blackpink" 
            ? "text-[#FF5C8D]" 
            : "text-gray-500 dark:text-gray-400"
        } h-5 w-5 search-icon`} 
      />
      <Input
        type="text"
        placeholder="Search questions here"
        value={searchQuery}
        onChange={handleSearch}
        className={`w-full ${
          theme === "blackpink"
            ? "bg-black border-[#FF5C8D] text-[#FF5C8D]" 
            : "bg-gray-100 dark:bg-gray-800/50 border-none"
        } pl-12 h-14 rounded-full 
          ${theme === "blackpink" 
            ? "placeholder:text-[#FF5C8D]/50" 
            : "text-gray-700 dark:text-gray-300 placeholder:text-gray-500 dark:placeholder:text-gray-400"
          }
          hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors text-base search-input`}
      />
    </div>
  );
};

export default SearchBar;
