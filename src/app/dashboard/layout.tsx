import { AuthGuard } from '@/components/auth/auth-guard';
import { DashboardLayout } from '@/components/navigation';

export default function DashboardLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}