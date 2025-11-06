'use client';

import * as React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Video, Calendar, Clock } from 'lucide-react';
import type { Meeting } from '@/lib/db/schema';
import { formatDistanceToNow } from 'date-fns';

interface MeetingCardProps {
  meeting: Meeting & {
    agent?: {
      id: string;
      name: string;
      avatarSeed: string | null;
      instructions: string;
    } | null;
  };
  onEdit?: (meeting: Meeting) => void;
  onDelete?: (meeting: Meeting) => void;
  onJoin?: (meeting: Meeting) => void;
  onViewDetails?: (meeting: Meeting) => void;
}

const statusConfig = {
  upcoming: { label: 'Upcoming', variant: 'default' as const, color: 'bg-blue-500' },
  active: { label: 'Active', variant: 'default' as const, color: 'bg-green-500' },
  processing: { label: 'Processing', variant: 'secondary' as const, color: 'bg-yellow-500' },
  completed: { label: 'Completed', variant: 'secondary' as const, color: 'bg-gray-500' },
  cancelled: { label: 'Cancelled', variant: 'secondary' as const, color: 'bg-red-500' },
};

export function MeetingCard({ meeting, onEdit, onDelete, onJoin, onViewDetails }: MeetingCardProps) {
  const avatarUrl = meeting.agent?.avatarSeed
    ? `https://api.dicebear.com/7.x/bottts/svg?seed=${meeting.agent.avatarSeed}`
    : undefined;

  const status = statusConfig[meeting.status];
  const canJoin = meeting.status === 'upcoming' || meeting.status === 'active';
  const canEdit = meeting.status === 'upcoming';
  const canDelete = meeting.status !== 'active';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4 pb-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatarUrl} alt={meeting.agent?.name || 'Agent'} />
          <AvatarFallback>
            {meeting.agent?.name?.substring(0, 2).toUpperCase() || 'AI'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{meeting.name}</h3>
          <p className="text-sm text-muted-foreground truncate">
            with {meeting.agent?.name || 'Unknown Agent'}
          </p>
        </div>
        <Badge variant={status.variant} className="shrink-0">
          <div className={`w-2 h-2 rounded-full ${status.color} mr-2`} />
          {status.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Created {formatDistanceToNow(new Date(meeting.createdAt), { addSuffix: true })}
          </span>
        </div>
        {meeting.durationSeconds && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Duration: {Math.floor(meeting.durationSeconds / 60)}m {meeting.durationSeconds % 60}s
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 pt-4">
        {canJoin && onJoin && (
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onJoin(meeting)}
          >
            <Video className="h-4 w-4 mr-2" />
            {meeting.status === 'active' ? 'Rejoin' : 'Start'}
          </Button>
        )}
        {meeting.status === 'completed' && onViewDetails && (
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails(meeting)}
          >
            View Details
          </Button>
        )}
        {canEdit && onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(meeting)}
            aria-label="Edit meeting"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {canDelete && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(meeting)}
            aria-label="Delete meeting"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
