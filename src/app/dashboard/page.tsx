import { UserProfile } from '@/components/auth/user-profile';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your Meet AI dashboard
        </p>
      </div>
      <UserProfile />
    </div>
  );
}
