import { z } from 'zod';

const idSchema = z
  .string()
  .trim()
  .min(1, 'Id is required')
  .regex(/^\d+$/, 'Id must be a numeric string');

const optionalMoneySchema = z.coerce
  .number()
  .min(0, 'Value must be non-negative');

const optionalTextSchema = z
  .string()
  .trim()
  .max(1000, 'Text must be at most 1000 characters')
  .optional()
  .or(z.literal(''));

export const unitInviteSchema = z.object({
  unitId: idSchema,
});

export const requestUnitConnectionSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(8, 'Invite code is required')
    .max(64, 'Invite code is too long'),
});

export const rejectConnectionRequestSchema = z.object({
  requestId: idSchema,
  rejectionNote: optionalTextSchema,
});

export const getConnectionRequestSchema = z.object({
  requestId: idSchema,
});

export const approveUnitConnectionAndCreateLeaseSchema = z
  .object({
    requestId: idSchema,
    startDate: z.string().trim().min(1, 'Start date is required'),
    endDate: z.string().trim().min(1, 'End date is required'),
    dueDayOfMonth: z.coerce.number().int().min(1).max(28),
    baseRent: z.coerce.number().positive('Base rent must be greater than zero'),
    depositAmount: optionalMoneySchema,
    managementFee: optionalMoneySchema,
    utilityNote: optionalTextSchema,
  })
  .refine((value) => new Date(value.endDate) > new Date(value.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const requestEarlyTerminationSchema = z.object({
  leaseId: idSchema,
  note: optionalTextSchema,
});

export const executeLeaseTerminationSchema = z.object({
  leaseId: idSchema,
});

export type UnitInviteInput = z.infer<typeof unitInviteSchema>;
export type RequestUnitConnectionInput = z.infer<typeof requestUnitConnectionSchema>;
export type RejectConnectionRequestInput = z.infer<typeof rejectConnectionRequestSchema>;
export type GetConnectionRequestInput = z.infer<typeof getConnectionRequestSchema>;
export type ApproveUnitConnectionAndCreateLeaseInput = z.infer<
  typeof approveUnitConnectionAndCreateLeaseSchema
>;
export type RequestEarlyTerminationInput = z.infer<typeof requestEarlyTerminationSchema>;
export type ExecuteLeaseTerminationInput = z.infer<typeof executeLeaseTerminationSchema>;
