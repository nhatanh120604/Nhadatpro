import { z } from 'zod';

export const occupancyStatusSchema = z.enum(['VACANT', 'OCCUPIED', 'MAINTENANCE']);

const nullableDecimalInput = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return Number.NaN;
    return parsed;
  })
  .refine((value) => value === null || (!Number.isNaN(value) && value >= 0), {
    message: 'Value must be a non-negative number',
  });

export const createUnitSchema = z.object({
  propertyId: z
    .string()
    .trim()
    .min(1, 'Property id is required')
    .regex(/^\d+$/, 'Property id must be a numeric string'),
  unitCode: z
    .string()
    .trim()
    .min(1, 'Unit code is required')
    .max(50, 'Unit code must be at most 50 characters')
    .transform((value) => value.toUpperCase()),
  unitName: z
    .string()
    .trim()
    .max(255, 'Unit name must be at most 255 characters')
    .optional()
    .or(z.literal('')),
  floorNumber: z.coerce.number().int().optional(),
  bedroomCount: z.coerce.number().int().optional(),
  bathroomCount: z.coerce.number().int().optional(),
  areaSqm: nullableDecimalInput,
  furnishingStatus: z
    .string()
    .trim()
    .max(50, 'Furnishing status must be at most 50 characters')
    .optional()
    .or(z.literal('')),
  defaultMonthlyRent: nullableDecimalInput,
  defaultDeposit: nullableDecimalInput,
  occupancyStatus: occupancyStatusSchema.default('VACANT'),
});

export const updateUnitSchema = createUnitSchema.extend({
  unitId: z
    .string()
    .trim()
    .min(1, 'Unit id is required')
    .regex(/^\d+$/, 'Unit id must be a numeric string'),
});

export const deleteUnitSchema = z.object({
  unitId: z
    .string()
    .trim()
    .min(1, 'Unit id is required')
    .regex(/^\d+$/, 'Unit id must be a numeric string'),
});

export const getUnitsByPropertyIdSchema = z.object({
  propertyId: z
    .string()
    .trim()
    .min(1, 'Property id is required')
    .regex(/^\d+$/, 'Property id must be a numeric string'),
});

export const getUnitByIdSchema = z.object({
  propertyId: z
    .string()
    .trim()
    .min(1, 'Property id is required')
    .regex(/^\d+$/, 'Property id must be a numeric string'),
  unitId: z
    .string()
    .trim()
    .min(1, 'Unit id is required')
    .regex(/^\d+$/, 'Unit id must be a numeric string'),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
export type DeleteUnitInput = z.infer<typeof deleteUnitSchema>;
export type GetUnitsByPropertyIdInput = z.infer<typeof getUnitsByPropertyIdSchema>;
export type GetUnitByIdInput = z.infer<typeof getUnitByIdSchema>;
