# Video Call Components

This directory contains the UI components for video call functionality in the Meet AI platform.

## Components

### VideoLobby

Pre-call interface where users can test their camera and microphone before joining a call.

**Features:**
- Real-time video preview
- Camera and microphone toggle controls
- Device permission handling
- Error state display for permission issues
- User avatar fallback when camera is off

**Props:**
- `onJoinCall`: Callback function when user clicks "Join Call"
- `userName`: Name of the user joining the call
- `agentName`: Name of the AI agent they're meeting with

**Usage:**
```tsx
<VideoLobby
  onJoinCall={() => router.push(`/call/${meetingId}`)}
  userName="John Doe"
  agentName="Sales Assistant"
/>
```

### CallInterface

Main video call interface with video display and controls.

**Features:**
- Split-screen layout with AI agent and user video
- Real-time call duration tracking
- Picture-in-picture user video
- Integrated call controls
- Automatic media device initialization
- Agent connection status simulation

**Props:**
- `meetingId`: ID of the meeting for navigation after call ends
- `userName`: Name of the user in the call
- `agentName`: Name of the AI agent
- `agentAvatar`: Optional avatar URL for the AI agent
- `onCallEnd`: Optional callback when call ends

**Usage:**
```tsx
<CallInterface
  meetingId="meeting-123"
  userName="John Doe"
  agentName="Sales Assistant"
  agentAvatar="https://example.com/avatar.png"
  onCallEnd={async () => {
    await updateMeetingStatus('completed');
  }}
/>
```

### CallControls

Control panel for managing camera, microphone, and ending the call.

**Features:**
- Camera toggle button
- Microphone toggle button
- End call button
- Visual state indicators (on/off)
- Accessibility labels
- Disabled state support

**Props:**
- `isCameraOn`: Boolean indicating camera state
- `isMicOn`: Boolean indicating microphone state
- `onToggleCamera`: Callback to toggle camera
- `onToggleMic`: Callback to toggle microphone
- `onEndCall`: Callback to end the call
- `disabled`: Optional boolean to disable all controls

**Usage:**
```tsx
<CallControls
  isCameraOn={true}
  isMicOn={true}
  onToggleCamera={() => toggleCamera()}
  onToggleMic={() => toggleMic()}
  onEndCall={() => endCall()}
/>
```

### AIAgentDisplay

Visual representation of the AI agent participant in the call.

**Features:**
- Gradient background with agent avatar
- Speaking indicator with animations
- Active/connecting status badge
- Animated speaking visualization
- Bot icon fallback when no avatar provided

**Props:**
- `agentName`: Name of the AI agent
- `agentAvatar`: Optional avatar URL
- `isActive`: Boolean indicating if agent is connected (default: true)
- `isSpeaking`: Boolean indicating if agent is currently speaking (default: false)

**Usage:**
```tsx
<AIAgentDisplay
  agentName="Sales Assistant"
  agentAvatar="https://example.com/avatar.png"
  isActive={true}
  isSpeaking={false}
/>
```

## Integration with Stream Video SDK

These components provide the UI layer for video calls. They should be integrated with the Stream Video SDK for actual WebRTC functionality:

1. **VideoLobby**: Initialize Stream client and prepare for call
2. **CallInterface**: Connect to Stream call and manage participants
3. **CallControls**: Control Stream video/audio tracks
4. **AIAgentDisplay**: Display AI agent status from Stream events

## Media Device Handling

The components handle media device access using the browser's `getUserMedia` API:

- Automatic permission requests
- Error handling for denied permissions
- Track management (enable/disable)
- Cleanup on component unmount

## Accessibility

All components follow accessibility best practices:

- ARIA labels on interactive elements
- Keyboard navigation support
- Visual focus indicators
- Screen reader friendly status updates
- Color contrast compliance (WCAG AA)

## Responsive Design

Components are designed to work across different screen sizes:

- Mobile-optimized layouts
- Touch-friendly controls
- Adaptive video grid
- Responsive typography

## Future Enhancements

- Screen sharing functionality
- Chat overlay during calls
- Recording indicator
- Network quality indicator
- Participant list for multi-party calls
- Virtual backgrounds
