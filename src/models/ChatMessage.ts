
export interface Reference {
  title: string;
  authors: string;
  journal?: string;
  year: string;
  url?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  references?: Reference[];
}
