# Agent Management Components

This directory contains the UI components for managing AI agents in the Meet AI platform.

## Components

### AgentList

The main component that displays a paginated, searchable list of AI agents with create, edit, and delete functionality.

**Features:**
- Pagination support
- Real-time search with debouncing
- Create new agents via dialog
- Edit existing agents
- Delete agents with confirmation
- Responsive grid layout

**Usage:**
```tsx
import { AgentList } from '@/components/agents';

export default function AgentsPage() {
  return <AgentList />;
}
```

### AgentCard

Displays an individual agent in a card format with avatar, name, instructions preview, and action buttons.

**Props:**
- `agent`: Agent object to display
- `onEdit?`: Callback when edit button is clicked
- `onDelete?`: Callback when delete button is clicked
- `onViewDetails?`: Callback when details button is clicked

**Usage:**
```tsx
import { AgentCard } from '@/components/agents';

<AgentCard
  agent={agent}
  onEdit={(agent) => console.log('Edit', agent)}
  onDelete={(agent) => console.log('Delete', agent)}
/>
```

### AgentForm

Form component for creating or editing agents with validation.

**Props:**
- `agent?`: Agent object for editing (omit for create mode)
- `onSubmit`: Callback with form data when submitted
- `onCancel?`: Callback when cancel button is clicked
- `isLoading?`: Loading state for submit button

**Usage:**
```tsx
import { AgentForm } from '@/components/agents';

<AgentForm
  agent={existingAgent} // Optional
  onSubmit={(data) => console.log('Submit', data)}
  onCancel={() => console.log('Cancel')}
  isLoading={false}
/>
```

### AgentDetails

Displays detailed information about a specific agent including full instructions, metadata, and timestamps.

**Props:**
- `agentId`: ID of the agent to display
- `onEdit?`: Callback when edit button is clicked
- `onDelete?`: Callback when delete button is clicked

**Usage:**
```tsx
import { AgentDetails } from '@/components/agents';

<AgentDetails
  agentId="agent-id"
  onEdit={() => console.log('Edit')}
  onDelete={() => console.log('Delete')}
/>
```

## Features

### DiceBear Avatar Integration

All agent components use DiceBear's Bottts style for generating unique, consistent avatars based on the agent's `avatarSeed`. The avatar URL format is:

```
https://api.dicebear.com/7.x/bottts/svg?seed={avatarSeed}
```

### Form Validation

The AgentForm component includes client-side validation:
- Name: Required, max 255 characters
- Instructions: Required
- Avatar seed: Auto-generated if not provided

### Responsive Design

All components are responsive and adapt to different screen sizes:
- Mobile: Single column layout
- Tablet: 2 column grid
- Desktop: 3 column grid

### Accessibility

Components follow accessibility best practices:
- Proper ARIA labels
- Keyboard navigation support
- Focus indicators
- Screen reader support
- Semantic HTML

## Testing

Test files are located in `__tests__/` directory:
- `agent-form.test.tsx`: Tests form validation, submission, and interactions
- `agent-card.test.tsx`: Tests card rendering and action callbacks

Run tests:
```bash
npm test -- src/components/agents/__tests__
```

## Dependencies

- `@radix-ui/react-avatar`: Avatar component
- `@radix-ui/react-dialog`: Dialog/modal component
- `lucide-react`: Icon library
- `date-fns`: Date formatting
- `nanoid`: Unique ID generation
- `@trpc/client`: API client
- `@tanstack/react-query`: Data fetching and caching
