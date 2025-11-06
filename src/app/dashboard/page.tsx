import { AuthGuard } from '@/components/auth/auth-guard';
import { UserProfile } from '@/components/auth/user-profile';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <UserProfile />
      </div>
    </AuthGuard>
  );
}
