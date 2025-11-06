import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    isConnected: false,
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

describe('CallInterface', () => {
  const defaultProps = {
    meetingId: 'test-meeting-123',
    userName: 'Test User',
    agentName: 'Test Agent',
    agentAvatar: 'https://example.com/avatar.png',
    agentInstructions: 'You are a helpful assistant',
  };

  describe('Initialization', () => {
    it('renders call interface with meeting details', async () => {
      render(<CallInterface {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/meeting with test agent/i)).toBeInTheDocument();
      });
    });

    it('requests media access on mount', async () => {
      render(<CallInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 24000,
          },
        });
      });
    });

    it('connects AI agent on mount', async () => {
      render(<CallInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalled();
      });
    });

    it('displays call duration timer', async () => {
      render(<CallInterface {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/00:00/)).toBeInTheDocument();
      });
    });
  });

  describe('Video Controls', () => {
    it('toggles camera on and off', async () => {
      render(<CallInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const cameraButton = screen.getByLabelText(/turn camera off/i);
      fireEvent.click(cameraButton);

      expect(mockVideoTrack.enabled).toBe(false);
    });

    it('toggles microphone on and off', async () => {
      render(<CallInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const micButton = screen.getByLabelText(/mute microphone/i);
      fireEvent.click(micButton);

      expect(mockAudioTrack.enabled).toBe(false);
    });

    it('displays user initial when camera is off', async () => {
      render(<CallInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const cameraButton = screen.getByLabelText(/turn camera off/i);
      fireEvent.click(cameraButton);

      await waitFor(() => {
        expect(screen.getByText('T')).toBeInTheDocument();
        expect(screen.getByText(/camera is off/i)).toBeInTheDocument();
      });
    });
  });

  describe('AI Agent Integration', () => {
    it('displays AI agent with correct name', async () => {
      render(<CallInterface {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Agent')).toBeInTheDocument();
      });
    });
  });

  describe('Call Lifecycle', () => {
    it('ends call and redirects to meeting details', async () => {
      render(<CallInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const endCallButton = screen.getByLabelText(/end call/i);
      fireEvent.click(endCallButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/meetings/test-meeting-123');
      });
    });

    it('stops all media tracks when ending call', async () => {
      render(<CallInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const endCallButton = screen.getByLabelText(/end call/i);
      fireEvent.click(endCallButton);

      await waitFor(() => {
        expect(mockVideoTrack.stop).toHaveBeenCalled();
        expect(mockAudioTrack.stop).toHaveBeenCalled();
      });
    });

    it('disconnects AI agent on unmount', async () => {
      const { unmount } = render(<CallInterface {...defaultProps} />);

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalled();
      });

      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });
});
