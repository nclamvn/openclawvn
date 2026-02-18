export type MemoryCategory =
  | "identity"
  | "preference"
  | "project"
  | "relationship"
  | "skill"
  | "fact";

export type UserFact = {
  id: string;
  category: MemoryCategory;
  content: string;
  confidence: number;
  source: {
    sessionId: string;
    extractedAt: string;
  };
  verified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserFactSearchQuery = {
  keyword?: string;
  category?: MemoryCategory;
  minConfidence?: number;
  limit?: number;
};

export type UserFactExtractionResult = {
  facts: UserFact[];
  sessionId: string;
  tokensUsed: number;
};

export type UserFactStoreData = {
  facts: UserFact[];
  lastExtraction: string | null;
  version: number;
};
