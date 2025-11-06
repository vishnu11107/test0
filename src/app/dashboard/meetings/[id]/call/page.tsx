'use client';

import { use, useEffect } from 'react';
import { CallInterface } from '@/components/video';
import { trpc } from '@/lib/trpc/client';
import { useSession } from '@/lib/auth/client';

interface CallPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CallPage({ params }: CallPageProps) {
  const { id } = use(params);
  
  const { data: meeting, isLoading } = trpc.meetings.getOne.useQuery({
    id,
  });

  const { data: session } = useSession();
  const user = session?.user;

  const updateMeetingMutation = trpc.meetings.updateStatus.useMutation();

  useEffect(() => {
    // Update meeting status to active when call page loads
    if (meeting && meeting.status === 'upcoming') {
      updateMeetingMutation.mutate({
        id,
        status: 'active',
      });
    }
  }, [meeting?.status, id, updateMeetingMutation]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-blue-600" />
          <p className="mt-4 text-gray-400">Connecting to call...</p>
        </div>
      </div>
    );
  }

  if (!meeting || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-gray-400">Meeting not found</p>
        </div>
      </div>
    );
  }

  const handleCallEnd = async () => {
    // Update meeting status to processing
    await updateMeetingMutation.mutateAsync({
      id,
      status: 'processing',
    });
  };

  return (
    <CallInterface
      meetingId={id}
      userName={user?.name || user?.email}
      agentName={meeting.agent?.name || 'AI Agent'}
      agentAvatar={meeting.agent?.avatarSeed || undefined}
      agentInstructions={meeting.agent?.instructions}
      onCallEnd={handleCallEnd}
    />
  );
}
