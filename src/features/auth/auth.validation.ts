import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự'),
});

export type LoginInput = z.infer<typeof loginSchema>;
const phoneSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{9,11}$/, 'Phone number must be 9 to 11 digits');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/[0-9]/, 'Password must include a number');

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(255, 'Full name must be at most 255 characters'),
  email: z.string().trim().email('Invalid email'),
  phone: phoneSchema,
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;

const selfServeRoleSchema = z.enum(['OWNER', 'MANAGER', 'TENANT']);

export const completeGoogleOnboardingSchema = z.object({
  role: selfServeRoleSchema,
  phone: phoneSchema,
});

export const confirmGoogleAccountLinkSchema = z.object({
  confirmed: z.literal(true),
});

export type CompleteGoogleOnboardingInput = z.infer<typeof completeGoogleOnboardingSchema>;
export type ConfirmGoogleAccountLinkInput = z.infer<typeof confirmGoogleAccountLinkSchema>;
