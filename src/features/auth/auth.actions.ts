'use server';

import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import {
  buildGoogleRedirectUri,
  clearGoogleOnboardingPayload,
  clearGoogleOAuthState,
  getGoogleOAuthState,
  getGoogleOnboardingPayload,
  setGoogleOnboardingPayload,
  setGoogleOAuthState,
} from '@/lib/google-auth';
import { setSession } from '@/lib/session';
import {
  CompleteGoogleOnboardingInput,
  ConfirmGoogleAccountLinkInput,
  LoginInput,
  RegisterInput,
  completeGoogleOnboardingSchema,
  confirmGoogleAccountLinkSchema,
  loginSchema,
  registerSchema,
} from './auth.validation';
import { AuthActionResponse, Role } from './auth.types';

type AuthRedirectData = {
  redirectTo: string;
};

type BeginGoogleAuthInput = {
  origin: string;
};

type HandleGoogleCallbackInput = {
  origin: string;
  code: string;
  state: string;
};

type GoogleTokenResponse = {
  access_token: string;
};

type GoogleUserInfo = {
  sub: string;
  email?: string;
  name?: string;
};

const registrationRedirect: Record<Extract<Role, 'OWNER' | 'TENANT' | 'MANAGER'>, string> = {
  OWNER: '/owner/dashboard',
  TENANT: '/tenant/dashboard',
  MANAGER: '/manager/dashboard',
};

function mapDuplicateFieldMessage(target: string) {
  if (target.includes('email')) {
    return { email: ['Email already exists'] } as Record<string, string[]>;
  }

  if (target.includes('phone')) {
    return { phone: ['Phone number already exists'] } as Record<string, string[]>;
  }

  return undefined;
}

function getGoogleCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Google OAuth credentials');
  }

  return { clientId, clientSecret };
}

async function resolveRoleId(role: Extract<Role, 'OWNER' | 'TENANT' | 'MANAGER'>) {
  const targetRole = await prisma.role.findUnique({
    where: { name: role },
    select: { id: true },
  });

  if (!targetRole) {
    throw new Error('ROLE_NOT_FOUND');
  }

  return targetRole.id;
}

async function createUnusablePasswordHash() {
  return await bcrypt.hash(`google-auth-only:${crypto.randomUUID()}`, 10);
}

async function exchangeGoogleCodeForToken({
  code,
  origin,
}: {
  code: string;
  origin: string;
}) {
  const { clientId, clientSecret } = getGoogleCredentials();
  const redirectUri = buildGoogleRedirectUri(origin);

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
    cache: 'no-store',
  });

  if (!tokenResponse.ok) {
    throw new Error('GOOGLE_TOKEN_EXCHANGE_FAILED');
  }

  return (await tokenResponse.json()) as GoogleTokenResponse;
}

async function getGoogleUserInfo(accessToken: string) {
  const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('GOOGLE_USERINFO_FAILED');
  }

  return (await response.json()) as GoogleUserInfo;
}

export async function loginAction(
  data: LoginInput
): Promise<AuthActionResponse<AuthRedirectData>> {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { role: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      return { success: false, message: 'Invalid email or inactive account' };
    }

    const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordsMatch) {
      return { success: false, message: 'Incorrect password' };
    }

    const roleName = user.role.name as Role;

    await setSession({
      userId: user.id.toString(),
      email: user.email || '',
      role: roleName,
    });

    return {
      success: true,
      data: { redirectTo: `/${roleName.toLowerCase()}/dashboard` },
    };
  } catch (error) {
    console.error('Login action error:', error);
    if (error instanceof Error && error.message.includes('JWT_SECRET')) {
      return {
        success: false,
        message: 'Server configuration is incomplete: JWT_SECRET is missing.',
      };
    }
    return { success: false, message: 'Unable to sign in right now' };
  }
}

async function registerUser(
  role: Extract<Role, 'OWNER' | 'TENANT' | 'MANAGER'>,
  data: RegisterInput
): Promise<AuthActionResponse<AuthRedirectData>> {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const targetRoleId = await resolveRoleId(role);
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const user = await prisma.user.create({
      data: {
        fullName: parsed.data.fullName,
        email: parsed.data.email.toLowerCase(),
        phone: parsed.data.phone,
        passwordHash,
        roleId: targetRoleId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
      },
    });

    await setSession({
      userId: user.id.toString(),
      email: user.email || '',
      role,
    });

    return {
      success: true,
      message: 'Registration successful',
      data: {
        redirectTo: registrationRedirect[role],
      },
    };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002' &&
      'meta' in error
    ) {
      const target = Array.isArray((error as { meta?: { target?: string[] } }).meta?.target)
        ? (error as { meta?: { target?: string[] } }).meta?.target?.join(',')
        : '';
      const duplicateErrors = mapDuplicateFieldMessage(target || '');

      if (duplicateErrors) {
        return {
          success: false,
          errors: duplicateErrors,
        };
      }
    }

    console.error(`register${role} error:`, error);
    if (error instanceof Error && error.message.includes('JWT_SECRET')) {
      return {
        success: false,
        message: 'Server configuration is incomplete: JWT_SECRET is missing.',
      };
    }
    return { success: false, message: 'Unable to create account right now' };
  }
}

export async function registerOwner(data: RegisterInput) {
  return registerUser('OWNER', data);
}

export async function registerTenant(data: RegisterInput) {
  return registerUser('TENANT', data);
}

export async function registerManager(data: RegisterInput) {
  return registerUser('MANAGER', data);
}

export async function beginGoogleAuth({
  origin,
}: BeginGoogleAuthInput): Promise<AuthActionResponse<{ url: string }>> {
  try {
    const { clientId } = getGoogleCredentials();
    const nonce = crypto.randomUUID();
    await setGoogleOAuthState({ nonce });

    const redirectUri = buildGoogleRedirectUri(origin);
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', nonce);
    url.searchParams.set('prompt', 'select_account');

    return {
      success: true,
      data: {
        url: url.toString(),
      },
    };
  } catch (error) {
    console.error('beginGoogleAuth error:', error);
    return { success: false, message: 'Unable to start Google sign-in right now' };
  }
}

export async function handleGoogleCallback({
  origin,
  code,
  state,
}: HandleGoogleCallbackInput): Promise<AuthActionResponse<AuthRedirectData>> {
  try {
    const storedState = await getGoogleOAuthState();
    await clearGoogleOAuthState();

    if (!storedState || storedState.nonce !== state) {
      return { success: false, message: 'Google sign-in could not be verified' };
    }

    const token = await exchangeGoogleCodeForToken({ code, origin });
    const googleUser = await getGoogleUserInfo(token.access_token);
    const providerEmail = googleUser.email?.toLowerCase();

    if (!providerEmail || !googleUser.sub) {
      return { success: false, message: 'Google account did not provide a valid email' };
    }

    const linkedAccount = await prisma.authAccount.findFirst({
      where: {
        provider: 'google',
        providerAccountId: googleUser.sub,
      },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });

    if (linkedAccount) {
      if (linkedAccount.user.status !== 'ACTIVE') {
        return { success: false, message: 'This account is inactive and cannot sign in' };
      }

      const roleName = linkedAccount.user.role.name as Role;
      await clearGoogleOnboardingPayload();
      await setSession({
        userId: linkedAccount.user.id.toString(),
        email: linkedAccount.user.email || '',
        role: roleName,
      });

      return {
        success: true,
        data: { redirectTo: `/${roleName.toLowerCase()}/dashboard` },
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: providerEmail },
      include: { role: true },
    });

    if (existingUser) {
      if (existingUser.status !== 'ACTIVE') {
        return { success: false, message: 'An inactive account already exists for this email' };
      }

      await setGoogleOnboardingPayload({
        mode: 'link',
        provider: 'google',
        providerAccountId: googleUser.sub,
        providerEmail,
        fullName: googleUser.name || existingUser.fullName,
        existingUserId: existingUser.id.toString(),
        existingRole: existingUser.role.name as Role,
        existingFullName: existingUser.fullName,
        existingStatus: existingUser.status,
      });

      return {
        success: true,
        data: { redirectTo: '/onboarding/google' },
      };
    }

    await setGoogleOnboardingPayload({
      mode: 'create',
      provider: 'google',
      providerAccountId: googleUser.sub,
      providerEmail,
      fullName: googleUser.name || providerEmail.split('@')[0],
    });

    return {
      success: true,
      data: { redirectTo: '/onboarding/google' },
    };
  } catch (error) {
    console.error('handleGoogleCallback error:', error);
    return { success: false, message: 'Unable to complete Google sign-in right now' };
  }
}

export async function completeGoogleOnboarding(
  data: CompleteGoogleOnboardingInput
): Promise<AuthActionResponse<AuthRedirectData>> {
  const parsed = completeGoogleOnboardingSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const onboarding = await getGoogleOnboardingPayload();
  if (!onboarding || onboarding.mode !== 'create') {
    return { success: false, message: 'Google onboarding session has expired' };
  }

  try {
    const targetRoleId = await resolveRoleId(parsed.data.role);
    const passwordHash = await createUnusablePasswordHash();

    const createdUser = await prisma.user.create({
      data: {
        fullName: onboarding.fullName,
        email: onboarding.providerEmail,
        phone: parsed.data.phone,
        passwordHash,
        roleId: targetRoleId,
        status: 'ACTIVE',
        authAccounts: {
          create: {
            provider: onboarding.provider,
            providerAccountId: onboarding.providerAccountId,
            providerEmail: onboarding.providerEmail,
          },
        },
      },
      include: {
        role: true,
      },
    });

    const roleName = createdUser.role.name as Role;
    await clearGoogleOnboardingPayload();
    await setSession({
      userId: createdUser.id.toString(),
      email: createdUser.email || '',
      role: roleName,
    });

    return {
      success: true,
      data: {
        redirectTo: `/${roleName.toLowerCase()}/dashboard`,
      },
    };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002' &&
      'meta' in error
    ) {
      const target = Array.isArray((error as { meta?: { target?: string[] } }).meta?.target)
        ? (error as { meta?: { target?: string[] } }).meta?.target?.join(',')
        : '';
      const duplicateErrors = mapDuplicateFieldMessage(target || '');

      if (duplicateErrors) {
        return {
          success: false,
          errors: duplicateErrors,
        };
      }
    }

    console.error('completeGoogleOnboarding error:', error);
    return { success: false, message: 'Unable to create your account right now' };
  }
}

export async function confirmGoogleAccountLink(
  data: ConfirmGoogleAccountLinkInput
): Promise<AuthActionResponse<AuthRedirectData>> {
  const parsed = confirmGoogleAccountLinkSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const onboarding = await getGoogleOnboardingPayload();
  if (!onboarding || onboarding.mode !== 'link') {
    return { success: false, message: 'Google linking session has expired' };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: BigInt(onboarding.existingUserId) },
      include: { role: true },
    });

    if (!existingUser || existingUser.status !== 'ACTIVE') {
      return { success: false, message: 'This account is unavailable for linking' };
    }

    const existingLink = await prisma.authAccount.findFirst({
      where: {
        userId: existingUser.id,
        provider: 'google',
      },
      select: {
        id: true,
      },
    });

    if (!existingLink) {
      await prisma.authAccount.create({
        data: {
          userId: existingUser.id,
          provider: 'google',
          providerAccountId: onboarding.providerAccountId,
          providerEmail: onboarding.providerEmail,
        },
      });
    }

    const roleName = existingUser.role.name as Role;
    await clearGoogleOnboardingPayload();
    await setSession({
      userId: existingUser.id.toString(),
      email: existingUser.email || '',
      role: roleName,
    });

    return {
      success: true,
      data: {
        redirectTo: `/${roleName.toLowerCase()}/dashboard`,
      },
    };
  } catch (error) {
    console.error('confirmGoogleAccountLink error:', error);
    return { success: false, message: 'Unable to link your Google account right now' };
  }
}
