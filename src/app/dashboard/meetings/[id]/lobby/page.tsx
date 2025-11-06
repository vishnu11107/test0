'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VideoLobby } from '@/components/video';
import { trpc } from '@/lib/trpc/client';
import { useSession } from '@/lib/auth/client';

interface LobbyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function LobbyPage({ params }: LobbyPageProps) {
  const router = useRouter();
  const { id } = use(params);
  
  const { data: meeting, isLoading } = trpc.meetings.getOne.useQuery({
    id,
  });

  const { data: session } = useSession();
  const user = session?.user;

  useEffect(() => {
    // Redirect if meeting is not in upcoming status
    if (meeting && meeting.status !== 'upcoming') {
      router.push(`/dashboard/meetings/${id}`);
    }
  }, [meeting, id, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <p className="mt-4 text-gray-600">Loading meeting...</p>
        </div>
      </div>
    );
  }

  if (!meeting || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Meeting not found</p>
        </div>
      </div>
    );
  }

  const handleJoinCall = () => {
    router.push(`/dashboard/meetings/${id}/call`);
  };

  return (
    <VideoLobby
      onJoinCall={handleJoinCall}
      userName={user?.name || user?.email}
      agentName={meeting.agent?.name || 'AI Agent'}
    />
  );
}
