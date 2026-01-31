/**
 * Exam Item Types
 */

export type ItemType = 'multiple-choice' | 'free-response' | 'essay';
export type ItemStatus = 'draft' | 'review' | 'approved' | 'archived';
export type SecurityLevel = 'standard' | 'secure' | 'highly-secure';

export interface ExamItem {
  id: string;
  subject: string; // e.g., "AP Biology", "AP Calculus"
  itemType: ItemType;
  difficulty: number; // 1-5
  content: {
    question: string;
    options?: string[]; // For multiple choice
    correctAnswer: string;
    explanation: string;
  };
  metadata: {
    author: string;
    created: number; // timestamp
    lastModified: number; // timestamp
    version: number;
    status: ItemStatus;
    tags: string[];
  };
  securityLevel: SecurityLevel;
}

export interface CreateItemRequest {
  subject: string;
  itemType: ItemType;
  difficulty: number;
  content: {
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation: string;
  };
  metadata: {
    author: string;
    status: ItemStatus;
    tags: string[];
  };
  securityLevel: SecurityLevel;
}

export interface UpdateItemRequest {
  subject?: string;
  itemType?: ItemType;
  difficulty?: number;
  content?: Partial<ExamItem["content"]>;
  metadata?: Partial<ExamItem["metadata"]>;
  securityLevel?: SecurityLevel;
}

export interface ListItemsQuery {
  limit?: number;
  cursor?: string;
  subject?: string;
  status?: string;
}

export interface ListItemsResult {
  items: ExamItem[];
  cursor?: string;
}
