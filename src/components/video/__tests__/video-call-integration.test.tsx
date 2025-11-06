import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VideoLobby } from '../video-lobby';
import { CallInterface } from '../call-interface';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock OpenAI Realtime hook
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockSendAudio = vi.fn();

vi.mock('@/lib/openai', () => ({
  useRealtime: vi.fn(() => ({
    isConnected: true,
    isSpeaking: false,
    messages: [],
    connect: mockConnect,
    disconnect: mockDisconnect,
    sendAudio: mockSendAudio,
    sendText: vi.fn(),
    updateInstructions: vi.fn(),
    error: null,
  })),
}));

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn();
const mockVideoTrack = { enabled: true, stop: vi.fn() };
const mockAudioTrack = { enabled: true, stop: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();

  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
      getUserMedia: mockGetUserMedia,
    },
    writable: true,
  });

  // Mock AudioContext
  global.AudioContext = vi.fn().mockImplementation(() => ({
    createMediaStreamSource: vi.fn(() => ({
      connect: vi.fn(),
    })),
    createScriptProcessor: vi.fn(() => ({
      connect: vi.fn(),
      disconnect: vi.fn(),
      onaudioprocess: null,
    })),
    destination: {},
    close: vi.fn(),
  })) as any;

  mockGetUserMedia.mockResolvedValue({
    getTracks: () => [mockVideoTrack, mockAudioTrack],
    getVideoTracks: () => [mockVideoTrack],
    getAudioTracks: () => [mockAudioTrack],
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Video Call Integration', () => {
  describe('Complete Call Lifecycle', () => {
    it('completes full flow from lobby to call to end', async () => {
      const onJoinCall = vi.fn();

      // Step 1: Render lobby
      const { unmount: unmountLobby } = render(
        <VideoLobby
          onJoinCall={onJoinCall}
          userName="Test User"
          agentName="Test Agent"
        />
      );

      // Wait for media access
      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      // Join the call
      const joinButton = screen.getByRole('button', { name: /join call/i });
      fireEvent.click(joinButton);

      expect(onJoinCall).toHaveBeenCalled();

      unmountLobby();

      // Step 2: Render call interface
      const onCallEnd = vi.fn();
      const { unmount: unmountCall } = render(
        <CallInterface
          meetingId="test-meeting-123"
          userName="Test User"
          agentName="Test Agent"
          onCallEnd={onCallEnd}
        />
      );

      // Wait for call to initialize
      await waitFor(() => {
        expect(screen.getByText(/meeting with test agent/i)).toBeInTheDocument();
      });

      // Verify AI agent connected
      expect(mockConnect).toHaveBeenCalled();

      // Step 3: End the call
      const endCallButton = screen.getByLabelText(/end call/i);
      fireEvent.click(endCallButton);

      await waitFor(() => {
        expect(onCallEnd).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/dashboard/meetings/test-meeting-123');
      });

      unmountCall();

      // Verify cleanup
      expect(mockDisconnect).toHaveBeenCalled();
      expect(mockVideoTrack.stop).toHaveBeenCalled();
      expect(mockAudioTrack.stop).toHaveBeenCalled();
    });

    it('handles device testing in lobby before joining', async () => {
      const onJoinCall = vi.fn();

      render(
        <VideoLobby
          onJoinCall={onJoinCall}
          userName="Test User"
          agentName="Test Agent"
        />
      );

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      // Test camera toggle
      const cameraButton = screen.getAllByRole('button')[0];
      fireEvent.click(cameraButton);
      expect(mockVideoTrack.enabled).toBe(false);

      fireEvent.click(cameraButton);
      expect(mockVideoTrack.enabled).toBe(true);

      // Join call with devices working
      const joinButton = screen.getByRole('button', { name: /join call/i });
      fireEvent.click(joinButton);

      expect(onJoinCall).toHaveBeenCalled();
    });
  });

  describe('AI Agent Response Flow', () => {
    it('processes audio and sends to AI agent during call', async () => {
      render(
        <CallInterface
          meetingId="test-meeting-123"
          userName="Test User"
          agentName="Test Agent"
          agentInstructions="You are a helpful assistant"
        />
      );

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalled();
      });

      // Verify audio processing is set up
      expect(global.AudioContext).toHaveBeenCalled();
    });

    it('displays AI agent speaking state during response', async () => {
      const { useRealtime } = await import('@/lib/openai');
      (useRealtime as any).mockReturnValue({
        isConnected: true,
        isSpeaking: true,
        messages: [],
        connect: mockConnect,
        disconnect: mockDisconnect,
        sendAudio: mockSendAudio,
        sendText: vi.fn(),
        updateInstructions: vi.fn(),
        error: null,
      });

      const { container } = render(
        <CallInterface
          meetingId="test-meeting-123"
          userName="Test User"
          agentName="Test Agent"
        />
      );

      await waitFor(() => {
        const speakingIndicators = container.querySelectorAll('.animate-bounce');
        expect(speakingIndicators.length).toBeGreaterThan(0);
      });
    });

    it('handles AI agent reconnection during call', async () => {
      const { useRealtime } = await import('@/lib/openai');

      // Start disconnected
      (useRealtime as any).mockReturnValue({
        isConnected: false,
        isSpeaking: false,
        messages: [],
        connect: mockConnect,
        disconnect: mockDisconnect,
        sendAudio: mockSendAudio,
        sendText: vi.fn(),
        updateInstructions: vi.fn(),
        error: null,
      });

      const { rerender } = render(
        <CallInterface
          meetingId="test-meeting-123"
          userName="Test User"
          agentName="Test Agent"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Connecting...')).toBeInTheDocument();
      });

      // Simulate reconnection
      (useRealtime as any).mockReturnValue({
        isConnected: true,
        isSpeaking: false,
        messages: [],
        connect: mockConnect,
        disconnect: mockDisconnect,
        sendAudio: mockSendAudio,
        sendText: vi.fn(),
        updateInstructions: vi.fn(),
        error: null,
      });

      rerender(
        <CallInterface
          meetingId="test-meeting-123"
          userName="Test User"
          agentName="Test Agent"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });
  });

  describe('Media Control Scenarios', () => {
    it('handles camera toggle during active call', async () => {
      render(
        <CallInterface
          meetingId="test-meeting-123"
          userName="Test User"
          agentName="Test Agent"
        />
      );

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      // Turn camera off
      const cameraButton = screen.getByLabelText(/turn camera off/i);
      fireEvent.click(cameraButton);

      await waitFor(() => {
        expect(screen.getByText(/camera is off/i)).toBeInTheDocument();
        expect(screen.getByText('T')).toBeInTheDocument();
      });

      // Turn camera back on
      fireEvent.click(screen.getByLabelText(/turn camera on/i));

      await waitFor(() => {
        expect(screen.queryByText(/camera is off/i)).not.toBeInTheDocument();
      });
    });

    it('handles microphone toggle during active call', async () => {
      render(
        <CallInterface
          meetingId="test-meeting-123"
          userName="Test User"
          agentName="Test Agent"
        />
      );

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      // Mute microphone
      const micButton = screen.getByLabelText(/mute microphone/i);
      fireEvent.click(micButton);

      expect(mockAudioTrack.enabled).toBe(false);

      // Verify muted indicator appears (SVG icon in the video overlay)
      await waitFor(() => {
        const mutedIndicator = screen.getByRole('button', { name: /unmute microphone/i });
        expect(mutedIndicator).toBeInTheDocument();
      });

      // Unmute microphone
      fireEvent.click(screen.getByLabelText(/unmute microphone/i));

      expect(mockAudioTrack.enabled).toBe(true);
    });

    it('maintains call state when toggling devices', async () => {
      render(
        <CallInterface
          meetingId="test-meeting-123"
          userName="Test User"
          agentName="Test Agent"
        />
      );

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalled();
      });

      // Toggle camera
      const cameraButton = screen.getByLabelText(/turn camera off/i);
      fireEvent.click(cameraButton);

      // Toggle microphone
      const micButton = screen.getByLabelText(/mute microphone/i);
      fireEvent.click(micButton);

      // Verify call is still active
      expect(screen.getByText(/meeting with test agent/i)).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('recovers from media access failure in lobby', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));

      const onJoinCall = vi.fn();

      render(
        <VideoLobby
          onJoinCall={onJoinCall}
          userName="Test User"
          agentName="Test Agent"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/unable to access camera or microphone/i)).toBeInTheDocument();
      });

      // Join button should be disabled
      const joinButton = screen.getByRole('button', { name: /join call/i });
      expect(joinButton).toBeDisabled();
    });

    it('continues call when AI agent fails to connect', async () => {
      mockConnect.mockRejectedValueOnce(new Error('Connection failed'));

      render(
        <CallInterface
          meetingId="test-meeting-123"
          userName="Test User"
          agentName="Test Agent"
        />
      );

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalled();
      });

      // Call should still be functional
      expect(screen.getByText(/meeting with test agent/i)).toBeInTheDocument();

      // User can still end call
      const endCallButton = screen.getByLabelText(/end call/i);
      expect(endCallButton).toBeEnabled();
    });

    it('handles media track loss during call', async () => {
      render(
        <CallInterface
          meetingId="test-meeting-123"
          userName="Test User"
          agentName="Test Agent"
        />
      );

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      // Simulate track loss
      mockVideoTrack.enabled = false;
      mockAudioTrack.enabled = false;

      // Call should still be active
      expect(screen.getByText(/meeting with test agent/i)).toBeInTheDocument();
    });
  });

  describe('Call Duration Tracking', () => {
    it('tracks call duration from start to end', async () => {
      const onCallEnd = vi.fn();

      render(
        <CallInterface
          meetingId="test-meeting-123"
          userName="Test User"
          agentName="Test Agent"
          onCallEnd={onCallEnd}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/00:00/)).toBeInTheDocument();
      });

      // End call
      const endCallButton = screen.getByLabelText(/end call/i);
      fireEvent.click(endCallButton);

      await waitFor(() => {
        expect(onCallEnd).toHaveBeenCalled();
      });
    });
  });

  describe('Multiple Participants Scenario', () => {
    it('displays user and AI agent simultaneously', async () => {
      render(
        <CallInterface
          meetingId="test-meeting-123"
          userName="Test User"
          agentName="Test Agent"
          agentAvatar="https://example.com/avatar.png"
        />
      );

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      // User display
      expect(screen.getByText(/test user \(you\)/i)).toBeInTheDocument();

      // AI agent display
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
    });

    it('shows correct participant states', async () => {
      const { useRealtime } = await import('@/lib/openai');
      (useRealtime as any).mockReturnValue({
        isConnected: true,
        isSpeaking: true,
        messages: [],
        connect: mockConnect,
        disconnect: mockDisconnect,
        sendAudio: mockSendAudio,
        sendText: vi.fn(),
        updateInstructions: vi.fn(),
        error: null,
      });

      // Create fresh mock tracks for this test
      const testVideoTrack = { enabled: true, stop: vi.fn() };
      const testAudioTrack = { enabled: true, stop: vi.fn() };

      mockGetUserMedia.mockResolvedValueOnce({
        getTracks: () => [testVideoTrack, testAudioTrack],
        getVideoTracks: () => [testVideoTrack],
        getAudioTracks: () => [testAudioTrack],
      });

      render(
        <CallInterface
          meetingId="test-meeting-123"
          userName="Test User"
          agentName="Test Agent"
        />
      );

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      // Mute user microphone
      const micButton = screen.getByLabelText(/mute microphone/i);
      fireEvent.click(micButton);

      // Verify microphone was toggled
      expect(testAudioTrack.enabled).toBe(false);

      // AI agent is active
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });
});
