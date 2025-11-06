// Core domain models
export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  subscriptionTier: 'free_trial' | 'basic' | 'pro' | 'enterprise';
  subscriptionExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  name: string;
  userId: string;
  instructions: string;
  avatarSeed: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    meetings: number;
  };
}

export interface Meeting {
  id: string;
  name: string;
  userId: string;
  agentId: string;
  streamCallId: string | null;
  status: 'upcoming' | 'active' | 'completed' | 'processing' | 'cancelled';
  startedAt: Date | null;
  endedAt: Date | null;
  durationSeconds: number | null;
  transcriptUrl: string | null;
  recordingUrl: string | null;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
  agent?: Agent;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TranscriptEntry {
  timestamp: number;
  speaker: 'user' | 'agent';
  text: string;
}

// Form types
export interface CreateAgentInput {
  name: string;
  instructions: string;
}

export interface UpdateAgentInput extends CreateAgentInput {
  id: string;
}

export interface CreateMeetingInput {
  name: string;
  agentId: string;
}

// Subscription types
export interface SubscriptionLimits {
  maxAgents: number;
  maxMeetingsPerMonth: number;
  maxMeetingDurationMinutes: number;
  hasPostCallIntelligence: boolean;
  hasVideoRecording: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<
  User['subscriptionTier'],
  SubscriptionLimits
> = {
  free_trial: {
    maxAgents: 2,
    maxMeetingsPerMonth: 5,
    maxMeetingDurationMinutes: 15,
    hasPostCallIntelligence: false,
    hasVideoRecording: false,
  },
  basic: {
    maxAgents: 5,
    maxMeetingsPerMonth: 50,
    maxMeetingDurationMinutes: 60,
    hasPostCallIntelligence: true,
    hasVideoRecording: false,
  },
  pro: {
    maxAgents: 20,
    maxMeetingsPerMonth: 200,
    maxMeetingDurationMinutes: 120,
    hasPostCallIntelligence: true,
    hasVideoRecording: true,
  },
  enterprise: {
    maxAgents: -1, // unlimited
    maxMeetingsPerMonth: -1, // unlimited
    maxMeetingDurationMinutes: -1, // unlimited
    hasPostCallIntelligence: true,
    hasVideoRecording: true,
  },
};

// Database types (re-exported from schema)
export type {
  User as DbUser,
  NewUser,
  Session,
  NewSession,
  Account,
  NewAccount,
  Agent as DbAgent,
  NewAgent,
  Meeting as DbMeeting,
  NewMeeting,
} from '@/lib/db/schema';
