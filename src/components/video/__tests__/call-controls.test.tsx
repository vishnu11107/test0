import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CallControls } from '../call-controls';

describe('CallControls', () => {
  const defaultProps = {
    isCameraOn: true,
    isMicOn: true,
    onToggleCamera: vi.fn(),
    onToggleMic: vi.fn(),
    onEndCall: vi.fn(),
  };

  it('renders all control buttons', () => {
    render(<CallControls {...defaultProps} />);

    expect(screen.getByLabelText(/turn camera off/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mute microphone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end call/i)).toBeInTheDocument();
  });

  it('calls onToggleCamera when camera button is clicked', () => {
    render(<CallControls {...defaultProps} />);

    const cameraButton = screen.getByLabelText(/turn camera off/i);
    fireEvent.click(cameraButton);

    expect(defaultProps.onToggleCamera).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleMic when microphone button is clicked', () => {
    render(<CallControls {...defaultProps} />);

    const micButton = screen.getByLabelText(/mute microphone/i);
    fireEvent.click(micButton);

    expect(defaultProps.onToggleMic).toHaveBeenCalledTimes(1);
  });

  it('calls onEndCall when end call button is clicked', () => {
    render(<CallControls {...defaultProps} />);

    const endCallButton = screen.getByLabelText(/end call/i);
    fireEvent.click(endCallButton);

    expect(defaultProps.onEndCall).toHaveBeenCalledTimes(1);
  });

  it('shows correct camera icon when camera is on', () => {
    render(<CallControls {...defaultProps} isCameraOn={true} />);

    expect(screen.getByLabelText(/turn camera off/i)).toBeInTheDocument();
  });

  it('shows correct camera icon when camera is off', () => {
    render(<CallControls {...defaultProps} isCameraOn={false} />);

    expect(screen.getByLabelText(/turn camera on/i)).toBeInTheDocument();
  });

  it('shows correct microphone icon when mic is on', () => {
    render(<CallControls {...defaultProps} isMicOn={true} />);

    expect(screen.getByLabelText(/mute microphone/i)).toBeInTheDocument();
  });

  it('shows correct microphone icon when mic is off', () => {
    render(<CallControls {...defaultProps} isMicOn={false} />);

    expect(screen.getByLabelText(/unmute microphone/i)).toBeInTheDocument();
  });

  it('disables all buttons when disabled prop is true', () => {
    render(<CallControls {...defaultProps} disabled={true} />);

    const cameraButton = screen.getByLabelText(/turn camera off/i);
    const micButton = screen.getByLabelText(/mute microphone/i);
    const endCallButton = screen.getByLabelText(/end call/i);

    expect(cameraButton).toBeDisabled();
    expect(micButton).toBeDisabled();
    expect(endCallButton).toBeDisabled();
  });
});
