import { z } from 'zod';

export const expenseCategories = [
  'MAINTENANCE',
  'REPAIR',
  'UTILITY',
  'CLEANING',
  'MANAGEMENT',
  'TAX',
  'INSURANCE',
  'MARKETING',
  'SUPPLIES',
  'OTHER',
] as const;

export const idSchema = z
  .string()
  .trim()
  .min(1, 'Id is required')
  .regex(/^\d+$/, 'Id must be a numeric string');

const optionalIdSchema = idSchema.optional().or(z.literal(''));

const optionalTextSchema = z
  .string()
  .trim()
  .max(1000, 'Text must be at most 1000 characters')
  .optional()
  .or(z.literal(''));

const optionalUrlSchema = z
  .string()
  .trim()
  .max(500, 'URL must be at most 500 characters')
  .url('Receipt URL must be valid')
  .optional()
  .or(z.literal(''));

const expenseBaseSchema = z.object({
  propertyId: idSchema,
  unitId: optionalIdSchema,
  category: z.enum(expenseCategories),
  amount: z.coerce
    .number()
    .positive('Amount must be greater than zero')
    .max(999999999999, 'Amount is too large'),
  expenseDate: z.string().trim().min(1, 'Expense date is required'),
  vendorName: z
    .string()
    .trim()
    .max(255, 'Vendor name must be at most 255 characters')
    .optional()
    .or(z.literal('')),
  note: optionalTextSchema,
  receiptUrl: optionalUrlSchema,
});

export const listExpensesSchema = z.object({
  propertyId: optionalIdSchema,
  billingYear: z.coerce.number().int().min(2000).max(2100).optional(),
  billingMonth: z.coerce.number().int().min(1).max(12).optional(),
  status: z.enum(['ALL', 'ACTIVE', 'VOIDED']).default('ACTIVE'),
});

export const createExpenseSchema = expenseBaseSchema;

export const updateExpenseSchema = expenseBaseSchema.extend({
  expenseId: idSchema,
});

export const voidExpenseSchema = z.object({
  expenseId: idSchema,
});

export type ListExpensesInput = z.infer<typeof listExpensesSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type VoidExpenseInput = z.infer<typeof voidExpenseSchema>;
export type ExpenseCategory = typeof expenseCategories[number];
