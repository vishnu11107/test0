'use client';

import * as React from 'react';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface AgentDetailsProps {
  agentId: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function AgentDetails({ agentId, onEdit, onDelete }: AgentDetailsProps) {
  const { data: agent, isLoading, error } = trpc.agents.getOne.useQuery({ id: agentId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loader" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-sm text-muted-foreground">
          {error?.message || 'Failed to load agent details.'}
        </p>
      </div>
    );
  }

  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${agent.avatarSeed || agent.id}`;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl} alt={agent.name} />
              <AvatarFallback>{agent.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{agent.name}</h2>
                  <Badge variant="secondary" className="mt-2">
                    AI Agent
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {onEdit && (
                    <Button variant="outline" size="sm" onClick={onEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="outline" size="sm" onClick={onDelete}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created {format(new Date(agent.createdAt), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Updated {format(new Date(agent.updatedAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{agent.instructions}</p>
        </CardContent>
      </Card>

      {/* Metadata Card */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Agent ID</span>
            <span className="font-mono">{agent.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Avatar Seed</span>
            <span className="font-mono">{agent.avatarSeed}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
