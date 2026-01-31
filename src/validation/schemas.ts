import { z } from 'zod';

const itemTypes = ['multiple-choice', 'free-response', 'essay'] as const;
const statuses = ['draft', 'review', 'approved', 'archived'] as const;
const securityLevels = ['standard', 'secure', 'highly-secure'] as const;

export const CreateItemSchema = z.object({
  subject: z.string().min(1),
  itemType: z.enum(itemTypes),
  difficulty: z.number().int().min(1).max(5),
  content: z.object({
    question: z.string().min(1),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().min(1),
    explanation: z.string().min(1),
  }),
  metadata: z.object({
    author: z.string().min(1),
    status: z.enum(statuses),
    tags: z.array(z.string()),
  }),
  securityLevel: z.enum(securityLevels),
}).refine((data) => data.itemType !== 'multiple-choice' || (data.content.options && data.content.options.length >= 2), {
  message: 'Multiple-choice items must have at least two options', path: ['content', 'options'],
});

export const UpdateItemSchema = z.object({
  subject: z.string().min(1).optional(),
  itemType: z.enum(itemTypes).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  content: z.object({
    question: z.string().min(1).optional(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().min(1).optional(),
    explanation: z.string().min(1).optional(),
  }).optional(),
  metadata: z.object({
    author: z.string().min(1).optional(),
    status: z.enum(statuses).optional(),
    tags: z.array(z.string()).optional(),
  }).strict().optional(),
  securityLevel: z.enum(securityLevels).optional(),
});

export const ItemIdSchema = z.string().uuid();

export const ListItemsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  subject: z.string().optional(),
  status: z.enum(statuses).optional(),
});
