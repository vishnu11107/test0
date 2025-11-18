'use client';

import { use, useEffect, useState } from 'react';
import { CallInterface } from '@/components/video';

interface TestCallPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface Meeting {
  id: string;
  name: string;
  status: string;
  agent: {
    id: string;
    name: string;
    avatarSeed?: string;
    instructions?: string;
  } | null;
}

export default function TestCallPage({ params }: TestCallPageProps) {
  const { id } = use(params);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const response = await fetch(`/api/test/meeting/${id}`);
        const data = await response.json();
        
        if (data.success) {
          setMeeting(data.meeting);
          
          // Update status to active if it's upcoming
          if (data.meeting.status === 'upcoming') {
            await fetch(`/api/test/meeting/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'active' }),
            });
            setMeeting(prev => prev ? { ...prev, status: 'active' } : null);
          }
        } else {
          setError(data.error || 'Meeting not found');
        }
      } catch (err) {
        setError('Failed to load meeting');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMeeting();
  }, [id]);

  const handleCallEnd = async () => {
    try {
      await fetch(`/api/test/meeting/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'processing' }),
      });
    } catch (err) {
      console.error('Failed to update meeting status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-blue-600" />
          <p className="mt-4 text-gray-400">Connecting to call...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-gray-400">{error || 'Meeting not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <CallInterface
      meetingId={id}
      userName="Test User"
      agentName={meeting.agent?.name || 'AI Agent'}
      agentAvatar={meeting.agent?.avatarSeed || undefined}
      agentInstructions={meeting.agent?.instructions}
      onCallEnd={handleCallEnd}
    />
  );
}