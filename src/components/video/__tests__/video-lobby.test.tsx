import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VideoLobby } from '../video-lobby';

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
      getUserMedia: mockGetUserMedia,
    },
    writable: true,
  });
});

describe('VideoLobby', () => {
  const defaultProps = {
    onJoinCall: vi.fn(),
    userName: 'Test User',
    agentName: 'Test Agent',
  };

  it('renders lobby with agent name', () => {
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [],
    });

    render(<VideoLobby {...defaultProps} />);

    expect(screen.getByText(/ready to join/i)).toBeInTheDocument();
    expect(screen.getByText(/test agent/i)).toBeInTheDocument();
  });

  it('requests camera and microphone access on mount', async () => {
    const mockStream = {
      getTracks: () => [],
      getVideoTracks: () => [{ enabled: true }],
      getAudioTracks: () => [{ enabled: true }],
    };

    mockGetUserMedia.mockResolvedValue(mockStream);

    render(<VideoLobby {...defaultProps} />);

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: true,
        audio: true,
      });
    });
  });

  it('displays error message when media access fails', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

    render(<VideoLobby {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByText(/unable to access camera or microphone/i)
      ).toBeInTheDocument();
    });
  });

  it('toggles camera on and off', async () => {
    const mockVideoTrack = { enabled: true };
    const mockStream = {
      getTracks: () => [mockVideoTrack],
      getVideoTracks: () => [mockVideoTrack],
      getAudioTracks: () => [{ enabled: true }],
    };

    mockGetUserMedia.mockResolvedValue(mockStream);

    render(<VideoLobby {...defaultProps} />);

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalled();
    });

    const cameraButton = screen.getByRole('button', { name: '' });
    fireEvent.click(cameraButton);

    expect(mockVideoTrack.enabled).toBe(false);
  });

  it('calls onJoinCall when join button is clicked', async () => {
    const mockStream = {
      getTracks: () => [],
      getVideoTracks: () => [{ enabled: true }],
      getAudioTracks: () => [{ enabled: true }],
    };

    mockGetUserMedia.mockResolvedValue(mockStream);

    render(<VideoLobby {...defaultProps} />);

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalled();
    });

    const joinButton = screen.getByRole('button', { name: /join call/i });
    fireEvent.click(joinButton);

    expect(defaultProps.onJoinCall).toHaveBeenCalledTimes(1);
  });

  it('disables join button when media access fails', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

    render(<VideoLobby {...defaultProps} />);

    await waitFor(() => {
      const joinButton = screen.getByRole('button', { name: /join call/i });
      expect(joinButton).toBeDisabled();
    });
  });

  it('displays user initial when camera is off', async () => {
    const mockVideoTrack = { enabled: false };
    const mockStream = {
      getTracks: () => [mockVideoTrack],
      getVideoTracks: () => [mockVideoTrack],
      getAudioTracks: () => [{ enabled: true }],
    };

    mockGetUserMedia.mockResolvedValue(mockStream);

    render(<VideoLobby {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('T')).toBeInTheDocument();
      expect(screen.getByText(/camera is off/i)).toBeInTheDocument();
    });
  });

  it('uses default name when userName is null', () => {
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [],
    });

    render(<VideoLobby {...defaultProps} userName={null} />);

    expect(screen.getByText(/ready to join/i)).toBeInTheDocument();
  });
});
