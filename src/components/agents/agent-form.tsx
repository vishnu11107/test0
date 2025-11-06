'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Sparkles } from 'lucide-react';
import type { Agent } from '@/lib/db/schema';
import { nanoid } from 'nanoid';

interface AgentFormProps {
  agent?: Agent;
  onSubmit: (data: AgentFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export interface AgentFormData {
  name: string;
  instructions: string;
  avatarSeed: string;
}

export function AgentForm({ agent, onSubmit, onCancel, isLoading }: AgentFormProps) {
  const [formData, setFormData] = React.useState<AgentFormData>({
    name: agent?.name || '',
    instructions: agent?.instructions || '',
    avatarSeed: agent?.avatarSeed || nanoid(),
  });

  const [errors, setErrors] = React.useState<Partial<Record<keyof AgentFormData, string>>>({});

  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${formData.avatarSeed}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const newErrors: Partial<Record<keyof AgentFormData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Name must be less than 255 characters';
    }
    
    if (!formData.instructions.trim()) {
      newErrors.instructions = 'Instructions are required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    onSubmit(formData);
  };

  const handleChange = (field: keyof AgentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const regenerateAvatar = () => {
    setFormData(prev => ({ ...prev, avatarSeed: nanoid() }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={avatarUrl} alt="Agent avatar" />
          <AvatarFallback>{formData.name.substring(0, 2).toUpperCase() || 'AI'}</AvatarFallback>
        </Avatar>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={regenerateAvatar}
          disabled={isLoading}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Regenerate Avatar
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Agent Name</Label>
        <Input
          id="name"
          placeholder="e.g., Language Tutor, Interview Coach"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          disabled={isLoading}
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
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          placeholder="Describe the agent's personality, expertise, and how it should interact..."
          value={formData.instructions}
          onChange={(e) => handleChange('instructions', e.target.value)}
          disabled={isLoading}
          rows={6}
          aria-invalid={!!errors.instructions}
          aria-describedby={errors.instructions ? 'instructions-error' : undefined}
        />
        {errors.instructions && (
          <p id="instructions-error" className="text-sm text-destructive">
            {errors.instructions}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          These instructions will guide the AI agent's behavior during conversations.
        </p>
      </div>

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {agent ? 'Update Agent' : 'Create Agent'}
        </Button>
      </div>
    </form>
  );
}
