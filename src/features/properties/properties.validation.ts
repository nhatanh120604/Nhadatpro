import { z } from 'zod';

export const propertyStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);

export const propertyBaseSchema = z.object({
  propertyCode: z
    .string()
    .trim()
    .min(1, 'Property code is required')
    .max(50, 'Property code must be at most 50 characters')
    .transform((value) => value.toUpperCase()),
  propertyName: z
    .string()
    .trim()
    .min(1, 'Property name is required')
    .max(255, 'Property name must be at most 255 characters'),
  addressLine: z
    .string()
    .trim()
    .min(1, 'Address is required')
    .max(255, 'Address must be at most 255 characters'),
  ward: z
    .string()
    .trim()
    .max(100, 'Ward must be at most 100 characters')
    .optional()
    .or(z.literal('')),
  district: z
    .string()
    .trim()
    .max(100, 'District must be at most 100 characters')
    .optional()
    .or(z.literal('')),
  city: z
    .string()
    .trim()
    .max(100, 'City must be at most 100 characters')
    .optional()
    .or(z.literal('')),
  propertyType: z
    .string()
    .trim()
    .max(50, 'Property type must be at most 50 characters')
    .optional()
    .or(z.literal('')),
  status: propertyStatusSchema.default('ACTIVE'),
});

export const createPropertySchema = propertyBaseSchema;

export const updatePropertySchema = propertyBaseSchema.extend({
  propertyId: z
    .string()
    .trim()
    .min(1, 'Property id is required')
    .regex(/^\d+$/, 'Property id must be a numeric string'),
});

export const deletePropertySchema = z.object({
  propertyId: z
    .string()
    .trim()
    .min(1, 'Property id is required')
    .regex(/^\d+$/, 'Property id must be a numeric string'),
});

export const getPropertyByIdSchema = z.object({
  propertyId: z
    .string()
    .trim()
    .min(1, 'Property id is required')
    .regex(/^\d+$/, 'Property id must be a numeric string'),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type DeletePropertyInput = z.infer<typeof deletePropertySchema>;
export type GetPropertyByIdInput = z.infer<typeof getPropertyByIdSchema>;
