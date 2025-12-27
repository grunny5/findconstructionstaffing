import { render, screen, waitFor, fireEvent } from '@/lib/test-utils';
import { SendMessageButton } from '../SendMessageButton';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock useAuth hook
jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

describe('SendMessageButton', () => {
  const mockPush = jest.fn();
  const mockFetch = global.fetch as jest.Mock;

  const defaultProps = {
    agencyId: 'agency-123',
    agencyName: 'Test Agency',
    agencySlug: 'test-agency',
    isClaimed: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
    });
  });

  describe('Visibility and Rendering', () => {
    it('should render button when agency is claimed', () => {
      render(<SendMessageButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /send message/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Send Message');
    });

    it('should not render button when agency is not claimed', () => {
      render(<SendMessageButton {...defaultProps} isClaimed={false} />);

      const button = screen.queryByRole('button', { name: /send message/i });
      expect(button).not.toBeInTheDocument();
    });

    it('should render button with message icon', () => {
      const { container } = render(<SendMessageButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /send message/i });
      expect(button).toBeInTheDocument();

      // Check for SVG icon (MessageCircle)
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Authentication Check', () => {
    it('should redirect to login when user is not authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null });

      render(<SendMessageButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/login?redirectTo=/recruiters/test-agency'
        );
      });
    });

    it('should not redirect when user is authenticated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      render(<SendMessageButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalledWith(
          expect.stringContaining('/login')
        );
      });
    });
  });

  describe('Existing Conversation Check', () => {
    it('should navigate to existing conversation if one exists', async () => {
      const existingConversation = {
        id: 'conv-123',
        context_type: 'agency_inquiry',
        context_id: 'agency-123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [existingConversation] }),
      });

      render(<SendMessageButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/messages/conversations/conv-123'
        );
      });
    });

    it('should show modal if no existing conversation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      render(<SendMessageButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', {
            name: /send a message to test agency/i,
          })
        ).toBeInTheDocument();
      });
    });

    it('should show modal if conversation check fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<SendMessageButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', {
            name: /send a message to test agency/i,
          })
        ).toBeInTheDocument();
      });
    });

    it('should ignore conversations with different context types', async () => {
      const otherConversation = {
        id: 'conv-456',
        context_type: 'general',
        context_id: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [otherConversation] }),
      });

      render(<SendMessageButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', {
            name: /send a message to test agency/i,
          })
        ).toBeInTheDocument();
      });
    });

    it('should ignore conversations with different agency IDs', async () => {
      const otherAgencyConversation = {
        id: 'conv-789',
        context_type: 'agency_inquiry',
        context_id: 'different-agency-id',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [otherAgencyConversation] }),
      });

      render(<SendMessageButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', {
            name: /send a message to test agency/i,
          })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Modal Behavior', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      render(<SendMessageButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', {
            name: /send a message to test agency/i,
          })
        ).toBeInTheDocument();
      });
    });

    it('should show modal with correct title', () => {
      expect(
        screen.getByRole('heading', { name: /send a message to test agency/i })
      ).toBeInTheDocument();
    });

    it('should show modal with correct description', () => {
      expect(
        screen.getByText(
          /compose your inquiry below\. the agency owner will be notified via email/i
        )
      ).toBeInTheDocument();
    });

    it('should show textarea with placeholder', () => {
      const textarea = screen.getByPlaceholderText(
        /ask test agency about their staffing services/i
      );
      expect(textarea).toBeInTheDocument();
    });

    it('should show character counter', () => {
      const counter = screen.getByText(/0 \/ 10,000/i);
      expect(counter).toBeInTheDocument();
    });

    it('should show send button', () => {
      const sendButton = screen.getByRole('button', {
        name: /send message/i,
      });
      expect(sendButton).toBeInTheDocument();
    });

    it('should show keyboard hint', () => {
      expect(screen.getByText(/press/i)).toBeInTheDocument();
      expect(screen.getByText(/enter/i)).toBeInTheDocument();
      expect(screen.getByText(/shift\+enter/i)).toBeInTheDocument();
    });

    it('should disable send button when textarea is empty', () => {
      const sendButton = screen.getByRole('button', {
        name: /send message/i,
      });
      expect(sendButton).toBeDisabled();
    });

    it('should enable send button when textarea has content', () => {
      const textarea = screen.getByPlaceholderText(
        /ask test agency about their staffing services/i
      );
      fireEvent.change(textarea, { target: { value: 'Hello, I need help' } });

      const sendButton = screen.getByRole('button', {
        name: /send message/i,
      });
      expect(sendButton).toBeEnabled();
    });

    it('should close modal when cancelled', async () => {
      const textarea = screen.getByPlaceholderText(
        /ask test agency about their staffing services/i
      );
      fireEvent.change(textarea, { target: { value: 'Test message' } });

      // Close modal by clicking outside or pressing Escape
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(
          screen.queryByRole('heading', {
            name: /send a message to test agency/i,
          })
        ).not.toBeInTheDocument();
      });
    });

    it('should reset form when modal is closed', async () => {
      const textarea = screen.getByPlaceholderText(
        /ask test agency about their staffing services/i
      );
      fireEvent.change(textarea, { target: { value: 'Test message' } });

      // Close modal
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(
          screen.queryByRole('heading', {
            name: /send a message to test agency/i,
          })
        ).not.toBeInTheDocument();
      });

      // Re-open modal
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const button = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(button);

      await waitFor(() => {
        const newTextarea = screen.getByPlaceholderText(
          /ask test agency about their staffing services/i
        );
        expect(newTextarea).toHaveValue('');
      });
    });
  });

  describe('Message Sending', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      render(<SendMessageButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', {
            name: /send a message to test agency/i,
          })
        ).toBeInTheDocument();
      });

      // Clear the initial fetch mock
      mockFetch.mockClear();
    });

    it('should send message with correct data when send button clicked', async () => {
      const textarea = screen.getByPlaceholderText(
        /ask test agency about their staffing services/i
      );
      fireEvent.change(textarea, {
        target: { value: 'I need electricians for a project' },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'new-conv-123' } }),
      });

      const sendButton = screen.getByRole('button', {
        name: /send message/i,
      });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/messages/conversations',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              context_type: 'agency_inquiry',
              context_id: 'agency-123',
              initial_message: 'I need electricians for a project',
            }),
          }
        );
      });
    });

    it('should navigate to new conversation after successful send', async () => {
      const textarea = screen.getByPlaceholderText(
        /ask test agency about their staffing services/i
      );
      fireEvent.change(textarea, { target: { value: 'Test message' } });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'new-conv-456' } }),
      });

      const sendButton = screen.getByRole('button', {
        name: /send message/i,
      });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/messages/conversations/new-conv-456'
        );
      });
    });

    it('should show loading state while sending', async () => {
      const textarea = screen.getByPlaceholderText(
        /ask test agency about their staffing services/i
      );
      fireEvent.change(textarea, { target: { value: 'Test message' } });

      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ ok: true, json: async () => ({ data: { id: 'new-conv' } }) }),
              100
            )
          )
      );

      const sendButton = screen.getByRole('button', {
        name: /send message/i,
      });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/sending.../i)).toBeInTheDocument();
      });
    });

    it('should disable textarea and send button while sending', async () => {
      const textarea = screen.getByPlaceholderText(
        /ask test agency about their staffing services/i
      );
      fireEvent.change(textarea, { target: { value: 'Test message' } });

      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ ok: true, json: async () => ({ data: { id: 'new-conv' } }) }),
              100
            )
          )
      );

      const sendButton = screen.getByRole('button', {
        name: /send message/i,
      });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(textarea).toBeDisabled();
        expect(sendButton).toBeDisabled();
      });
    });

    it('should show error when send fails', async () => {
      const textarea = screen.getByPlaceholderText(
        /ask test agency about their staffing services/i
      );
      fireEvent.change(textarea, { target: { value: 'Test message' } });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Failed to create conversation' },
        }),
      });

      const sendButton = screen.getByRole('button', {
        name: /send message/i,
      });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to create conversation/i)
        ).toBeInTheDocument();
      });
    });

    it('should show generic error when send throws exception', async () => {
      const textarea = screen.getByPlaceholderText(
        /ask test agency about their staffing services/i
      );
      fireEvent.change(textarea, { target: { value: 'Test message' } });

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const sendButton = screen.getByRole('button', {
        name: /send message/i,
      });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(
          screen.getByText(/an unexpected error occurred/i)
        ).toBeInTheDocument();
      });
    });

    it('should send message when Enter key is pressed', async () => {
      const textarea = screen.getByPlaceholderText(
        /ask test agency about their staffing services/i
      );
      fireEvent.change(textarea, { target: { value: 'Test message' } });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'new-conv-789' } }),
      });

      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/messages/conversations',
          expect.any(Object)
        );
      });
    });

    it('should not send message when Shift+Enter is pressed', async () => {
      const textarea = screen.getByPlaceholderText(
        /ask test agency about their staffing services/i
      );
      fireEvent.change(textarea, { target: { value: 'Test message' } });

      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

      await waitFor(() => {
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      render(<SendMessageButton {...defaultProps} />);

      const button = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', {
            name: /send a message to test agency/i,
          })
        ).toBeInTheDocument();
      });

      mockFetch.mockClear();
    });

    it('should trim whitespace from message before sending', async () => {
      const textarea = screen.getByPlaceholderText(
        /ask test agency about their staffing services/i
      );
      fireEvent.change(textarea, {
        target: { value: '  Test message with spaces  ' },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'new-conv' } }),
      });

      const sendButton = screen.getByRole('button', {
        name: /send message/i,
      });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/messages/conversations',
          expect.objectContaining({
            body: JSON.stringify({
              context_type: 'agency_inquiry',
              context_id: 'agency-123',
              initial_message: 'Test message with spaces',
            }),
          })
        );
      });
    });

    it('should disable send button when message is only whitespace', () => {
      const textarea = screen.getByPlaceholderText(
        /ask test agency about their staffing services/i
      );
      fireEvent.change(textarea, { target: { value: '   ' } });

      const sendButton = screen.getByRole('button', {
        name: /send message/i,
      });
      expect(sendButton).toBeDisabled();
    });

    it('should update character counter as user types', () => {
      const textarea = screen.getByPlaceholderText(
        /ask test agency about their staffing services/i
      );
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      expect(screen.getByText(/5 \/ 10,000/i)).toBeInTheDocument();
    });

    it('should show error styling when message exceeds max length', () => {
      const longMessage = 'a'.repeat(10001);
      const textarea = screen.getByPlaceholderText(
        /ask test agency about their staffing services/i
      );
      fireEvent.change(textarea, { target: { value: longMessage } });

      const counter = screen.getByText(/10,001 \/ 10,000/i);
      expect(counter).toHaveClass('text-destructive');
    });

    it('should disable send button when message exceeds max length', () => {
      const longMessage = 'a'.repeat(10001);
      const textarea = screen.getByPlaceholderText(
        /ask test agency about their staffing services/i
      );
      fireEvent.change(textarea, { target: { value: longMessage } });

      const sendButton = screen.getByRole('button', {
        name: /send message/i,
      });
      expect(sendButton).toBeDisabled();
    });
  });
});
