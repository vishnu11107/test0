import { AuthGuard } from '@/components/auth/auth-guard';
import { AgentList } from '@/components/agents';

export default function AgentsPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto py-8 px-4">
        <AgentList />
      </div>
    </AuthGuard>
  );
}
