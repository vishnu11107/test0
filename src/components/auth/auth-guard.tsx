import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Server component that protects routes requiring authentication
 * Redirects to login if user is not authenticated
 */
export async function AuthGuard({ children }: AuthGuardProps) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return <>{children}</>;
}
