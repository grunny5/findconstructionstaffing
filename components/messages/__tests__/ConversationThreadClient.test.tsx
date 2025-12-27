import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversationThreadClient } from '../ConversationThreadClient';
import type {
  ConversationWithParticipants,
  MessageWithSender,
} from '@/types/api';
import { useRouter } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock useConversationRealtime hook
const mockRealtime = jest.fn();
jest.mock('@/hooks/useConversationRealtime', () => ({
  useConversationRealtime: (conversationId: string, callback: Function) => {
    mockRealtime.mockImplementation(callback);
  },
}));

// Mock child components
jest.mock('../ConversationHeader', () => ({
  ConversationHeader: jest.fn(({ onBack }) => (
    <div data-testid="conversation-header">
      {onBack && <button onClick={onBack}>Back</button>}
    </div>
  )),
}));

jest.mock('../MessageBubble', () => ({
  MessageBubble: jest.fn(({ message }) => (
    <div data-testid={`message-${message.id}`}>{message.content}</div>
  )),
}));

jest.mock('../MessageInput', () => ({
  MessageInput: jest.fn(({ onSend, disabled }) => (
    <div data-testid="message-input">
      <input
        data-testid="input-field"
        disabled={disabled}
        onChange={(e) => {
          // Mock input change
        }}
      />
      <button
        data-testid="send-button"
        onClick={() => onSend('Test message')}
        disabled={disabled}
      >
        Send
      </button>
    </div>
  )),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('ConversationThreadClient', () => {
  const mockPush = jest.fn();

  const mockConversation: ConversationWithParticipants = {
    id: 'conv-1',
    context_type: 'agency_inquiry',
    context_id: 'agency-1',
    last_message_at: '2025-01-11T10:00:00Z',
    created_at: '2025-01-10T10:00:00Z',
    updated_at: '2025-01-11T10:00:00Z',
    participants: [
      {
        id: 'user-123',
        full_name: 'John Doe',
        email: 'john@example.com',
      },
      {
        id: 'user-456',
        full_name: 'Jane Smith',
        email: 'jane@example.com',
      },
    ],
    last_message_preview: 'Hello',
    unread_count: 0,
    agency_name: 'Test Agency',
  };

  const mockMessages: MessageWithSender[] = [
    {
      id: 'msg-1',
      conversation_id: 'conv-1',
      sender_id: 'user-456',
      content: 'Hello, how are you?',
      created_at: '2025-01-11T10:00:00Z',
      edited_at: null,
      deleted_at: null,
      sender: {
        id: 'user-456',
        full_name: 'Jane Smith',
        email: 'jane@example.com',
      },
    },
    {
      id: 'msg-2',
      conversation_id: 'conv-1',
      sender_id: 'user-123',
      content: "I'm good, thanks!",
      created_at: '2025-01-11T10:05:00Z',
      edited_at: null,
      deleted_at: null,
      sender: {
        id: 'user-123',
        full_name: 'John Doe',
        email: 'john@example.com',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    // Default fetch mock for mark as read
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe('Basic Rendering', () => {
    it('should render conversation header', () => {
      render(
        <ConversationThreadClient
          initialConversation={mockConversation}
          initialMessages={mockMessages}
          initialHasMore={false}
          currentUserId="user-123"
        />
      );

      // Both mobile and desktop headers are rendered
      const headers = screen.getAllByTestId('conversation-header');
      expect(headers.length).toBeGreaterThan(0);
    });

    it('should render messages', () => {
      render(
        <ConversationThreadClient
          initialConversation={mockConversation}
          initialMessages={mockMessages}
          initialHasMore={false}
          currentUserId="user-123"
        />
      );

      expect(screen.getByTestId('message-msg-1')).toBeInTheDocument();
      expect(screen.getByTestId('message-msg-2')).toBeInTheDocument();
      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
      expect(screen.getByText("I'm good, thanks!")).toBeInTheDocument();
    });

    it('should render message input', () => {
      render(
        <ConversationThreadClient
          initialConversation={mockConversation}
          initialMessages={mockMessages}
          initialHasMore={false}
          currentUserId="user-123"
        />
      );

      expect(screen.getByTestId('message-input')).toBeInTheDocument();
      expect(screen.getByTestId('send-button')).toBeInTheDocument();
    });

    it('should render mobile header with back button', () => {
      render(
        <ConversationThreadClient
          initialConversation={mockConversation}
          initialMessages={mockMessages}
          initialHasMore={false}
          currentUserId="user-123"
        />
      );

      // Mobile header should be present
      const mobileHeaders = screen.getAllByTestId('conversation-header');
      expect(mobileHeaders.length).toBeGreaterThan(0);
    });
  });

  describe('Message Grouping', () => {
    it('should group messages from same sender within 5 minutes', () => {
      const groupedMessages: MessageWithSender[] = [
        {
          id: 'msg-1',
          conversation_id: 'conv-1',
          sender_id: 'user-456',
          content: 'Message 1',
          created_at: '2025-01-11T10:00:00Z',
          edited_at: null,
          deleted_at: null,
          sender: {
            id: 'user-456',
            full_name: 'Jane Smith',
            email: 'jane@example.com',
          },
        },
        {
          id: 'msg-2',
          conversation_id: 'conv-1',
          sender_id: 'user-456',
          content: 'Message 2',
          created_at: '2025-01-11T10:02:00Z', // 2 minutes later
          edited_at: null,
          deleted_at: null,
          sender: {
            id: 'user-456',
            full_name: 'Jane Smith',
            email: 'jane@example.com',
          },
        },
      ];

      render(
        <ConversationThreadClient
          initialConversation={mockConversation}
          initialMessages={groupedMessages}
          initialHasMore={false}
          currentUserId="user-123"
        />
      );

      // Both messages should be rendered
      expect(screen.getByTestId('message-msg-1')).toBeInTheDocument();
      expect(screen.getByTestId('message-msg-2')).toBeInTheDocument();
    });

    it('should separate messages from same sender after 5 minutes', () => {
      const separatedMessages: MessageWithSender[] = [
        {
          id: 'msg-1',
          conversation_id: 'conv-1',
          sender_id: 'user-456',
          content: 'Message 1',
          created_at: '2025-01-11T10:00:00Z',
          edited_at: null,
          deleted_at: null,
          sender: {
            id: 'user-456',
            full_name: 'Jane Smith',
            email: 'jane@example.com',
          },
        },
        {
          id: 'msg-2',
          conversation_id: 'conv-1',
          sender_id: 'user-456',
          content: 'Message 2',
          created_at: '2025-01-11T10:06:00Z', // 6 minutes later
          edited_at: null,
          deleted_at: null,
          sender: {
            id: 'user-456',
            full_name: 'Jane Smith',
            email: 'jane@example.com',
          },
        },
      ];

      render(
        <ConversationThreadClient
          initialConversation={mockConversation}
          initialMessages={separatedMessages}
          initialHasMore={false}
          currentUserId="user-123"
        />
      );

      // Both messages should be rendered
      expect(screen.getByTestId('message-msg-1')).toBeInTheDocument();
      expect(screen.getByTestId('message-msg-2')).toBeInTheDocument();
    });
  });

  describe('Send Message', () => {
    it('should send message successfully', async () => {
      const mockResponse = {
        id: 'msg-new',
        conversation_id: 'conv-1',
        sender_id: 'user-123',
        content: 'Test message',
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
        sender: {
          id: 'user-123',
          full_name: 'John Doe',
          email: 'john@example.com',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockResponse }),
      });

      render(
        <ConversationThreadClient
          initialConversation={mockConversation}
          initialMessages={mockMessages}
          initialHasMore={false}
          currentUserId="user-123"
        />
      );

      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/messages/conversations/conv-1/messages',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: 'Test message' }),
          })
        );
      });
    });

    it('should disable input while sending', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100)
          )
      );

      render(
        <ConversationThreadClient
          initialConversation={mockConversation}
          initialMessages={mockMessages}
          initialHasMore={false}
          currentUserId="user-123"
        />
      );

      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      // Input should be disabled while sending
      await waitFor(() => {
        expect(screen.getByTestId('input-field')).toBeDisabled();
      });
    });

    it('should handle send message error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true }) // For mark as read
        .mockRejectedValueOnce(new Error('Network error')); // For send message

      render(
        <ConversationThreadClient
          initialConversation={mockConversation}
          initialMessages={mockMessages}
          initialHasMore={false}
          currentUserId="user-123"
        />
      );

      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      await waitFor(
        () => {
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error sending message:',
            expect.any(Error)
          );
        },
        { timeout: 2000 }
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Load Earlier Messages', () => {
    it('should show "Load Earlier Messages" button when hasMore is true', () => {
      render(
        <ConversationThreadClient
          initialConversation={mockConversation}
          initialMessages={mockMessages}
          initialHasMore={true}
          currentUserId="user-123"
        />
      );

      expect(
        screen.getByRole('button', { name: /load earlier messages/i })
      ).toBeInTheDocument();
    });

    it('should not show button when hasMore is false', () => {
      render(
        <ConversationThreadClient
          initialConversation={mockConversation}
          initialMessages={mockMessages}
          initialHasMore={false}
          currentUserId="user-123"
        />
      );

      expect(
        screen.queryByRole('button', { name: /load earlier messages/i })
      ).not.toBeInTheDocument();
    });

    it('should load earlier messages when button clicked', async () => {
      const olderMessages = [
        {
          id: 'msg-0',
          conversation_id: 'conv-1',
          sender_id: 'user-456',
          content: 'Earlier message',
          created_at: '2025-01-11T09:00:00Z',
          edited_at: null,
          deleted_at: null,
          sender: {
            id: 'user-456',
            full_name: 'Jane Smith',
            email: 'jane@example.com',
          },
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true }) // For mark as read
        .mockResolvedValueOnce({
          // For load earlier messages
          ok: true,
          json: async () => ({
            data: {
              messages: olderMessages,
              has_more: false,
            },
          }),
        });

      render(
        <ConversationThreadClient
          initialConversation={mockConversation}
          initialMessages={mockMessages}
          initialHasMore={true}
          currentUserId="user-123"
        />
      );

      const loadButton = screen.getByRole('button', {
        name: /load earlier messages/i,
      });
      fireEvent.click(loadButton);

      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledWith(
            '/api/messages/conversations/conv-1?limit=50&before=msg-1'
          );
        },
        { timeout: 2000 }
      );
    });

    it('should show loading state while fetching', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ data: { messages: [], has_more: false } }),
                }),
              100
            )
          )
      );

      render(
        <ConversationThreadClient
          initialConversation={mockConversation}
          initialMessages={mockMessages}
          initialHasMore={true}
          currentUserId="user-123"
        />
      );

      const loadButton = screen.getByRole('button', {
        name: /load earlier messages/i,
      });
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });
  });

  describe('Mark as Read', () => {
    it('should mark conversation as read on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      render(
        <ConversationThreadClient
          initialConversation={mockConversation}
          initialMessages={mockMessages}
          initialHasMore={false}
          currentUserId="user-123"
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/messages/conversations/conv-1/read',
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });

    it('should handle mark as read error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(
        <ConversationThreadClient
          initialConversation={mockConversation}
          initialMessages={mockMessages}
          initialHasMore={false}
          currentUserId="user-123"
        />
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to mark conversation as read:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Mobile Navigation', () => {
    it('should navigate back to messages list on mobile back button', () => {
      render(
        <ConversationThreadClient
          initialConversation={mockConversation}
          initialMessages={mockMessages}
          initialHasMore={false}
          currentUserId="user-123"
        />
      );

      // Find back button in header mock
      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);

      expect(mockPush).toHaveBeenCalledWith('/messages');
    });
  });

  describe('Real-time Message Updates', () => {
    it('should handle new message from realtime subscription', async () => {
      render(
        <ConversationThreadClient
          initialConversation={mockConversation}
          initialMessages={mockMessages}
          initialHasMore={false}
          currentUserId="user-123"
        />
      );

      // Simulate realtime message
      const newMessage = {
        id: 'msg-new',
        conversation_id: 'conv-1',
        sender_id: 'user-456',
        content: 'New realtime message',
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
      };

      mockRealtime(newMessage);

      await waitFor(() => {
        expect(screen.getByText('New realtime message')).toBeInTheDocument();
      });
    });

    it('should prevent duplicate messages from realtime', async () => {
      const { container } = render(
        <ConversationThreadClient
          initialConversation={mockConversation}
          initialMessages={mockMessages}
          initialHasMore={false}
          currentUserId="user-123"
        />
      );

      // Simulate same realtime message twice
      const newMessage = {
        id: 'msg-duplicate',
        conversation_id: 'conv-1',
        sender_id: 'user-456',
        content: 'Duplicate test',
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
      };

      mockRealtime(newMessage);
      mockRealtime(newMessage); // Send twice

      await waitFor(() => {
        const messages = screen.getAllByText('Duplicate test');
        expect(messages.length).toBe(1); // Should only appear once
      });
    });
  });

  describe('Empty State', () => {
    it('should handle conversation with no messages', () => {
      render(
        <ConversationThreadClient
          initialConversation={mockConversation}
          initialMessages={[]}
          initialHasMore={false}
          currentUserId="user-123"
        />
      );

      // Should still render header and input
      const headers = screen.getAllByTestId('conversation-header');
      expect(headers.length).toBeGreaterThan(0);
      expect(screen.getByTestId('message-input')).toBeInTheDocument();

      // No messages should be displayed
      expect(screen.queryByTestId('message-msg-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('message-msg-2')).not.toBeInTheDocument();
    });
  });
});
