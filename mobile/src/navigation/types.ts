import type { NavigatorScreenParams } from '@react-navigation/native';
import type { YearKey } from '@/lib/questionBank';

export type HomeStackParamList = {
  HomeMain: undefined;
  BrowseHome: { year?: YearKey; focusSearch?: boolean } | undefined;
  /** `path` is a list of subtopic keys walked down from the year node. */
  BrowseNode: {
    year: YearKey;
    path: string[];
    title: string;
    /**
     * A question to scroll to and flash on arrival, set when the reader came
     * from a search result. Arriving in a topic of sixty questions with no
     * indication of which one was searched for makes the search worth less
     * than the scroll it saved.
     */
    highlight?: string;
    /** Which tab the highlighted question is on, so it is not hidden by the other. */
    highlightType?: 'essay' | 'short-notes';
  };
};

export type RootTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Notes: undefined;
  Timer: undefined;
  AskAI: { question?: string; nonce?: number } | undefined;
  Progress: undefined;
};
