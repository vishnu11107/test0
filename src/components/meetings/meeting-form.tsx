'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import type { Meeting, Agent } from '@/lib/db/schema';
import { trpc } from '@/lib/trpc/client';

interface MeetingFormProps {
  meeting?: Meeting;
  onSubmit: (data: MeetingFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export interface MeetingFormData {
  name: string;
  agentId: string;
}

export function MeetingForm({ meeting, onSubmit, onCancel, isLoading }: MeetingFormProps) {
  const [formData, setFormData] = React.useState<MeetingFormData>({
    name: meeting?.name || '',
    agentId: meeting?.agentId || '',
  });

  const [errors, setErrors] = React.useState<Partial<Record<keyof MeetingFormData, string>>>({});

  // Fetch agents for selection
  const { data: agentsData, isLoading: isLoadingAgents } = trpc.agents.getMany.useQuery({
    page: 1,
    limit: 100, // Get all agents for selection
  });

  const agents = agentsData?.data || [];
  const selectedAgent = agents.find((a) => a.id === formData.agentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Partial<Record<keyof MeetingFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Name must be less than 255 characters';
    }

    if (!formData.agentId) {
      newErrors.agentId = 'Agent is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit(formData);
  };

  const handleChange = (field: keyof MeetingFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const avatarUrl = selectedAgent?.avatarSeed
    ? `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedAgent.avatarSeed}`
    : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Meeting Name</Label>
        <Input
          id="name"
          placeholder="e.g., Spanish Practice Session, Mock Interview"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          disabled={isLoading || !!meeting}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive">
            {errors.name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent">AI Agent</Label>
        <Select
          value={formData.agentId}
          onValueChange={(value) => handleChange('agentId', value)}
          disabled={isLoading || isLoadingAgents || !!meeting}
        >
          <SelectTrigger id="agent" aria-invalid={!!errors.agentId}>
            <SelectValue placeholder="Select an agent" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${agent.avatarSeed || agent.id}`}
                      alt={agent.name}
                    />
                    <AvatarFallback>{agent.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span>{agent.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.agentId && (
          <p id="agent-error" className="text-sm text-destructive">
            {errors.agentId}
          </p>
        )}
        {agents.length === 0 && !isLoadingAgents && (
          <p className="text-sm text-muted-foreground">
            No agents available. Create an agent first.
          </p>
        )}
      </div>

      {selectedAgent && (
        <div className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={avatarUrl} alt={selectedAgent.name} />
              <AvatarFallback>
                {selectedAgent.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{selectedAgent.name}</p>
              <p className="text-sm text-muted-foreground">Selected Agent</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {selectedAgent.instructions}
          </p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading || agents.length === 0}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {meeting ? 'Update Meeting' : 'Create Meeting'}
        </Button>
      </div>
    </form>
  );
}
