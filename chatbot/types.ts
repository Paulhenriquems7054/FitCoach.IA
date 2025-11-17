export interface WebSearchResult {
  uri: string;
  title: string;
}

export interface MapSearchResultReview {
    text: string;
    author: string;
    rating: number;
}

export interface MapSearchResult {
  uri: string;
  title: string;
  reviews?: MapSearchResultReview[];
}

export interface ChatMessage {
  role: 'user' | 'gemini' | 'system';
  content: string;
  isStreaming?: boolean;
  isError?: boolean;
  imageUrl?: string;
  videoUrl?: string;
  videoMimeType?: string;
  webResults?: WebSearchResult[];
  mapsResults?: MapSearchResult[];
  audioBase64?: string;
}