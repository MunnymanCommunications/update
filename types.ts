
export interface Assistant {
  id: string;
  user_id: string;
  name: string;
  avatar: string;
  personality: string[];
  attitude: string;
  voice: string;
  prompt: string;
  description: string;
  author_name: string;
  orb_hue: number;
  is_public: boolean;
}

export interface MemoryItem {
  id: number;
  assistant_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface ConversationTurn {
  speaker: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface WebSearchResult {
  uri: string;
  title: string;
}
