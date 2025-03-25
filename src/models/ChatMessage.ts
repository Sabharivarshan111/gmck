
export interface Reference {
  title: string;
  authors?: string;
  publication?: string;
  year?: string | number;
  url?: string;
  type: "article" | "link";
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  references?: Reference[];
}
