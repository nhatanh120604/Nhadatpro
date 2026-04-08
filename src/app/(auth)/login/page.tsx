import { LoginClientPage } from '@/components/auth/LoginClientPage';
import { isGoogleAuthConfigured } from '@/lib/google-auth';

export default function LoginPage() {
  return <LoginClientPage googleAuthEnabled={isGoogleAuthConfigured()} />;
}
