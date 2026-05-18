export type Role = 'OWNER' | 'MANAGER' | 'TENANT' | 'ADMIN';

export interface SessionPayload {
  userId: string;
  email: string;
  role: Role;
  exp: number;
  name: string;
}

export type AuthActionResponse<T = null> = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: T;
};
