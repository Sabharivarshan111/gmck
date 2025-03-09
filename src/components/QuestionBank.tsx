import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSwipeable } from "react-swipeable";
import { useQuestionBank } from "@/hooks/use-question-bank";
import SearchBar from "./question-bank/SearchBar";
import NoResultsMessage from "./question-bank/NoResultsMessage";
import QuestionBankContent from "./question-bank/QuestionBankContent";
import ExtrasContent from "./question-bank/ExtrasContent";

export interface QuestionType {
  name: string;
  questions: string[];
}

export interface SubTopicContent {
  name: string;
  subtopics: {
    [key: string]: QuestionType | { name: string; questions: any[] };
  };
}

export interface SubTopic {
  name: string;
  subtopics: {
    [key: string]: SubTopicContent | any;
  };
}

export interface Topic {
  name: string;
  subtopics: {
    [key: string]: SubTopic | any;
  };
}

export interface QuestionBankData {
  [key: string]: Topic;
}

const QuestionBank = () => {
  const {
    searchQuery,
    activeTab,
    expandedItems,
    hasSearchResults,
    isRendered,
    essayFilteredData,
    shortNotesFilteredData,
    hasContentToDisplay,
    setActiveTab,
    setExpandedItems,
    handleSearch
  } = useQuestionBank();

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (activeTab === "extras") {
        setActiveTab("essay");
      } else if (activeTab === "essay") {
        setActiveTab("short-notes");
      }
    },
    onSwipedRight: () => {
      if (activeTab === "short-notes") {
        setActiveTab("essay");
      } else if (activeTab === "essay") {
        setActiveTab("extras");
      }
    },
    trackMouse: true
  });

  if (!isRendered) {
    return (
      <div className="bg-white dark:bg-black h-full min-h-[600px] flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  const googleDriveLink = "https://drive.google.com";

  return (
    <div className="bg-white dark:bg-black h-full min-h-[600px]">
      <div className="flex-1 p-4 max-w-4xl mx-auto space-y-4" {...handlers}>
        <Tabs 
          defaultValue="essay" 
          value={activeTab}
          className="w-full"
          onValueChange={(value) => setActiveTab(value as "extras" | "essay" | "short-notes")}
        >
          <TabsList className="w-full grid grid-cols-3 h-12 bg-gray-100 dark:bg-gray-950 rounded-lg mb-4">
            <TabsTrigger 
              value="extras" 
              className="text-lg font-medium text-gray-700 dark:text-gray-400 data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:bottom-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-black dark:data-[state=active]:after:bg-white relative"
            >
              Extras
            </TabsTrigger>
            <TabsTrigger 
              value="essay" 
              className="text-lg font-medium text-gray-700 dark:text-gray-400 data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:bottom-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-black dark:data-[state=active]:after:bg-white relative"
            >
              Essay
            </TabsTrigger>
            <TabsTrigger 
              value="short-notes"
              className="text-lg font-medium text-gray-700 dark:text-gray-400 data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:bottom-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-black dark:data-[state=active]:after:bg-white relative"
            >
              Short notes
            </TabsTrigger>
          </TabsList>

          {activeTab !== "extras" && (
            <SearchBar 
              searchQuery={searchQuery}
              handleSearch={handleSearch}
            />
          )}

          <ScrollArea className="h-[calc(100vh-12rem)] min-h-[500px]">
            {!hasSearchResults && searchQuery.trim() !== "" && (
              <NoResultsMessage searchQuery={searchQuery} />
            )}
            
            <TabsContent value="extras" className="mt-0 min-h-[500px] bg-transparent">
              <ExtrasContent driveLink={googleDriveLink} />
            </TabsContent>
            
            <TabsContent value="essay" className="mt-0 min-h-[500px] bg-transparent">
              <QuestionBankContent
                activeTab="essay"
                hasContentToDisplay={hasContentToDisplay}
                filteredData={essayFilteredData}
                expandedItems={expandedItems}
                searchQuery={searchQuery}
              />
            </TabsContent>

            <TabsContent value="short-notes" className="mt-0 min-h-[500px] bg-transparent">
              <QuestionBankContent
                activeTab="short-notes"
                hasContentToDisplay={hasContentToDisplay}
                filteredData={shortNotesFilteredData}
                expandedItems={expandedItems}
                searchQuery={searchQuery}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
};

export default QuestionBank;
