'use client';

import * as React from 'react';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  Video,
  FileText,
  MessageSquare,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface MeetingDetailsProps {
  meetingId: string;
}

const statusConfig = {
  upcoming: { label: 'Upcoming', variant: 'default' as const, color: 'bg-blue-500' },
  active: { label: 'Active', variant: 'default' as const, color: 'bg-green-500' },
  processing: { label: 'Processing', variant: 'secondary' as const, color: 'bg-yellow-500' },
  completed: { label: 'Completed', variant: 'secondary' as const, color: 'bg-gray-500' },
  cancelled: { label: 'Cancelled', variant: 'secondary' as const, color: 'bg-red-500' },
};

export function MeetingDetails({ meetingId }: MeetingDetailsProps) {
  const router = useRouter();
  const { data: meeting, isLoading, error } = trpc.meetings.getOne.useQuery({ id: meetingId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-sm text-muted-foreground">
          {error?.message || 'Meeting not found'}
        </p>
        <Button onClick={() => router.push('/dashboard/meetings')}>
          Back to Meetings
        </Button>
      </div>
    );
  }

  const status = statusConfig[meeting.status];
  const avatarUrl = meeting.agent?.avatarSeed
    ? `https://api.dicebear.com/7.x/bottts/svg?seed=${meeting.agent.avatarSeed}`
    : undefined;

  const canJoin = meeting.status === 'upcoming' || meeting.status === 'active';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl} alt={meeting.agent?.name || 'Agent'} />
            <AvatarFallback>
              {meeting.agent?.name?.substring(0, 2).toUpperCase() || 'AI'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{meeting.name}</h2>
            <p className="text-muted-foreground">
              with {meeting.agent?.name || 'Unknown Agent'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={status.variant}>
            <div className={`w-2 h-2 rounded-full ${status.color} mr-2`} />
            {status.label}
          </Badge>
          {canJoin && (
            <Button onClick={() => router.push(`/dashboard/meetings/${meeting.id}/${meeting.status === 'active' ? 'call' : 'lobby'}` as any)}>
              <Video className="h-4 w-4 mr-2" />
              {meeting.status === 'active' ? 'Rejoin Call' : 'Start Call'}
            </Button>
          )}
        </div>
      </div>

      {/* Meeting Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Created</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(meeting.createdAt), 'PPpp')}
              </p>
            </div>
          </div>

          {meeting.startedAt && (
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Started</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(meeting.startedAt), 'PPpp')}
                </p>
              </div>
            </div>
          )}

          {meeting.endedAt && (
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Ended</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(meeting.endedAt), 'PPpp')}
                </p>
              </div>
            </div>
          )}

          {meeting.durationSeconds && (
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">
                  {Math.floor(meeting.durationSeconds / 60)}m {meeting.durationSeconds % 60}s
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">AI Agent</p>
              <p className="text-sm text-muted-foreground">
                {meeting.agent?.name || 'Unknown'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="summary" disabled={!meeting.summary}>
            Summary
          </TabsTrigger>
          <TabsTrigger value="transcript" disabled={!meeting.transcriptUrl}>
            Transcript
          </TabsTrigger>
          <TabsTrigger value="recording" disabled={!meeting.recordingUrl}>
            Recording
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatarUrl} alt={meeting.agent?.name || 'Agent'} />
                  <AvatarFallback>
                    {meeting.agent?.name?.substring(0, 2).toUpperCase() || 'AI'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{meeting.agent?.name}</p>
                  <Badge variant="secondary">AI Agent</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Instructions</p>
                <p className="text-sm text-muted-foreground">
                  {meeting.agent?.instructions || 'No instructions provided'}
                </p>
              </div>
            </CardContent>
          </Card>

          {meeting.status === 'upcoming' && (
            <Card>
              <CardHeader>
                <CardTitle>Ready to Start?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Click the button below to enter the video lobby and start your meeting.
                </p>
                <Button onClick={() => router.push(`/dashboard/meetings/${meeting.id}/lobby` as any)}>
                  <Video className="h-4 w-4 mr-2" />
                  Start Meeting
                </Button>
              </CardContent>
            </Card>
          )}

          {meeting.status === 'processing' && (
            <Card>
              <CardHeader>
                <CardTitle>Processing Meeting</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-sm text-muted-foreground">
                  We're generating your meeting summary and transcript. This usually takes a few minutes.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                AI-Generated Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meeting.summary ? (
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm whitespace-pre-wrap">{meeting.summary}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Summary not available yet. It will be generated after the meeting ends.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transcript">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Meeting Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meeting.transcriptUrl ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Transcript is available for download.
                  </p>
                  <Button variant="outline" asChild>
                    <a href={meeting.transcriptUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      View Transcript
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Transcript not available yet. It will be generated after the meeting ends.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recording">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Meeting Recording
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meeting.recordingUrl ? (
                <div className="space-y-4">
                  <video
                    controls
                    className="w-full rounded-lg"
                    src={meeting.recordingUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Recording not available yet. It will be available after the meeting ends.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
