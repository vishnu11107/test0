'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, MessageSquare } from 'lucide-react';
import type { Agent } from '@/lib/db/schema';

interface AgentCardProps {
  agent: Agent;
  onEdit?: (agent: Agent) => void;
  onDelete?: (agent: Agent) => void;
  onViewDetails?: (agent: Agent) => void;
}

export function AgentCard({
  agent,
  onEdit,
  onDelete,
  onViewDetails,
}: AgentCardProps) {
  // Generate DiceBear avatar URL
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${agent.avatarSeed || agent.id}`;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center gap-4 pb-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={avatarUrl} alt={agent.name} />
          <AvatarFallback>
            {agent.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold">{agent.name}</h3>
          <Badge variant="secondary" className="mt-1">
            AI Agent
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {agent.instructions}
        </p>
      </CardContent>
      <CardFooter className="flex gap-2 pt-4">
        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails(agent)}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Details
          </Button>
        )}
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(agent)}
            aria-label="Edit agent"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(agent)}
            aria-label="Delete agent"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
