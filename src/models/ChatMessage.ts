
export interface Reference {
  title: string;
  url: string;
  author?: string;
  year?: string;
  journal?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  references?: Reference[];
}
