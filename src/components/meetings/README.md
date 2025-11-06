# Meeting Components

This directory contains all UI components related to meeting management.

## Components

### MeetingList
Main component for displaying and managing meetings with filtering, search, and pagination.

**Features:**
- Paginated meeting grid
- Search by meeting name
- Filter by status (upcoming, active, completed, processing, cancelled)
- Filter by agent
- Create, edit, and delete meetings
- Join/start meetings

### MeetingCard
Individual meeting card component with status-aware display.

**Features:**
- Displays meeting name and associated agent
- Status badge with color coding
- Creation date and duration (if available)
- Action buttons based on meeting status:
  - Start/Rejoin for upcoming/active meetings
  - View Details for completed meetings
  - Edit for upcoming meetings
  - Delete for non-active meetings

### MeetingForm
Form component for creating and editing meetings.

**Features:**
- Meeting name input
- Agent selection dropdown with avatars
- Form validation
- Agent preview with instructions
- Disabled state for editing (agent cannot be changed)

### MeetingDetails
Comprehensive meeting details view with tabbed interface.

**Features:**
- Meeting information card with timestamps and duration
- Tabbed interface with 4 tabs:
  - **Overview**: Agent details and meeting status
  - **Summary**: AI-generated meeting summary
  - **Transcript**: Meeting transcript viewer
  - **Recording**: Video recording playback
- Status-aware actions (start/rejoin call)
- Processing indicator for meetings being processed

## Usage

```tsx
import { MeetingList, MeetingCard, MeetingForm, MeetingDetails } from '@/components/meetings';

// Display meeting list
<MeetingList />

// Display meeting details
<MeetingDetails meetingId="meeting-id" />
```

## Status Configuration

Meetings have 5 possible statuses:
- **upcoming**: Meeting is scheduled but not started
- **active**: Meeting is currently in progress
- **processing**: Meeting has ended and is being processed
- **completed**: Meeting is finished with all post-call intelligence available
- **cancelled**: Meeting was cancelled

Each status has specific UI behavior and available actions.
