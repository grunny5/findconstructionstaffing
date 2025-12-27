import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessagesInboxClient } from '../MessagesInboxClient';
import type { ConversationWithParticipants } from '@/types/api';
import { useRouter } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock conversation data (API response format)
const mockConversations: ConversationWithParticipants[] = [
  {
    id: 'conv-1',
    context_type: 'agency_inquiry',
    context_id: 'agency-1',
    last_message_at: '2025-01-11T10:00:00Z',
    created_at: '2025-01-10T10:00:00Z',
    updated_at: '2025-01-11T10:00:00Z',
    participants: [
      {
        id: 'user-1',
        full_name: 'John Doe',
        email: 'john@example.com',
      },
      {
        id: 'user-2',
        full_name: 'Jane Smith',
        email: 'jane@example.com',
      },
    ],
    last_message_preview: 'Hello, how are you?',
    unread_count: 2,
    agency_name: 'Test Agency',
  },
  {
    id: 'conv-2',
    context_type: 'general',
    context_id: null,
    last_message_at: '2025-01-09T10:00:00Z',
    created_at: '2025-01-09T10:00:00Z',
    updated_at: '2025-01-09T10:00:00Z',
    participants: [
      {
        id: 'user-1',
        full_name: 'John Doe',
        email: 'john@example.com',
      },
      {
        id: 'user-3',
        full_name: 'Bob Johnson',
        email: 'bob@example.com',
      },
    ],
    last_message_preview: 'Thanks for the info',
    unread_count: 0,
    agency_name: null,
  },
];

// Mock getInitials utility
jest.mock('@/lib/utils/getInitials', () => ({
  getInitials: (name: string) => {
    if (!name || name.trim() === '') return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  },
}));

// Mock sanitize utility
jest.mock('@/lib/utils/sanitize', () => ({
  sanitizeMessagePreview: (content: string) => content,
}));

describe('MessagesInboxClient', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    // Mock window.innerWidth for mobile/desktop detection
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  describe('Basic Rendering', () => {
    it('should render inbox header', () => {
      render(
        <MessagesInboxClient
          initialConversations={mockConversations}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    it('should render All and Unread tabs', () => {
      render(
        <MessagesInboxClient
          initialConversations={mockConversations}
          currentUserId="user-1"
        />
      );

      expect(screen.getByRole('tab', { name: /all/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /unread/i })).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(
        <MessagesInboxClient
          initialConversations={mockConversations}
          currentUserId="user-1"
        />
      );

      expect(
        screen.getByPlaceholderText('Search conversations...')
      ).toBeInTheDocument();
    });

    it('should show conversation count in All tab', () => {
      render(
        <MessagesInboxClient
          initialConversations={mockConversations}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('(2)')).toBeInTheDocument();
    });

    it('should show unread badge in Unread tab', () => {
      render(
        <MessagesInboxClient
          initialConversations={mockConversations}
          currentUserId="user-1"
        />
      );

      const unreadTab = screen.getByRole('tab', { name: /unread/i });
      const badge = within(unreadTab).getByText('1');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Tab Switching', () => {
    it('should show all conversations by default', () => {
      render(
        <MessagesInboxClient
          initialConversations={mockConversations}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should show only unread conversations when Unread tab selected', async () => {
      const user = userEvent.setup();
      render(
        <MessagesInboxClient
          initialConversations={mockConversations}
          currentUserId="user-1"
        />
      );

      const unreadTab = screen.getByRole('tab', { name: /unread/i });

      // Click unread tab using userEvent
      await user.click(unreadTab);

      // Verify only unread conversations show
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      });
    });

    it('should switch back to All tab', () => {
      render(
        <MessagesInboxClient
          initialConversations={mockConversations}
          currentUserId="user-1"
        />
      );

      const unreadTab = screen.getByRole('tab', { name: /unread/i });
      fireEvent.click(unreadTab);

      const allTab = screen.getByRole('tab', { name: /all/i });
      fireEvent.click(allTab);

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter conversations by participant name', () => {
      render(
        <MessagesInboxClient
          initialConversations={mockConversations}
          currentUserId="user-1"
        />
      );

      const searchInput = screen.getByPlaceholderText(
        'Search conversations...'
      );
      fireEvent.change(searchInput, { target: { value: 'Jane' } });

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    });

    it('should be case-insensitive', () => {
      render(
        <MessagesInboxClient
          initialConversations={mockConversations}
          currentUserId="user-1"
        />
      );

      const searchInput = screen.getByPlaceholderText(
        'Search conversations...'
      );
      fireEvent.change(searchInput, { target: { value: 'JANE' } });

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should show "No conversations found" when search has no results', () => {
      render(
        <MessagesInboxClient
          initialConversations={mockConversations}
          currentUserId="user-1"
        />
      );

      const searchInput = screen.getByPlaceholderText(
        'Search conversations...'
      );
      fireEvent.change(searchInput, { target: { value: 'NonexistentName' } });

      expect(screen.getByText('No conversations found')).toBeInTheDocument();
    });

    it('should clear filter when search is cleared', () => {
      render(
        <MessagesInboxClient
          initialConversations={mockConversations}
          currentUserId="user-1"
        />
      );

      const searchInput = screen.getByPlaceholderText(
        'Search conversations...'
      );
      fireEvent.change(searchInput, { target: { value: 'Jane' } });
      fireEvent.change(searchInput, { target: { value: '' } });

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no conversations', () => {
      render(
        <MessagesInboxClient initialConversations={[]} currentUserId="user-1" />
      );

      expect(screen.getByText('No messages yet')).toBeInTheDocument();
      expect(
        screen.getByText('Visit an agency profile to start a conversation.')
      ).toBeInTheDocument();
    });

    it('should show empty state when no unread conversations', async () => {
      const user = userEvent.setup();
      const readConversations = mockConversations.map((c) => ({
        ...c,
        unread_count: 0,
      }));

      render(
        <MessagesInboxClient
          initialConversations={readConversations}
          currentUserId="user-1"
        />
      );

      const unreadTab = screen.getByRole('tab', { name: /unread/i });
      await user.click(unreadTab);

      await waitFor(() => {
        expect(screen.getByText('No unread messages')).toBeInTheDocument();
      });
    });
  });

  describe('Conversation Interaction', () => {
    it('should highlight conversation when clicked on desktop', () => {
      render(
        <MessagesInboxClient
          initialConversations={mockConversations}
          currentUserId="user-1"
        />
      );

      const conversation = screen
        .getByText('Jane Smith')
        .closest('[role="button"]');
      fireEvent.click(conversation!);

      expect(conversation).toHaveClass('bg-accent');
    });

    it('should navigate to conversation on mobile', () => {
      // Set mobile width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <MessagesInboxClient
          initialConversations={mockConversations}
          currentUserId="user-1"
        />
      );

      const conversation = screen
        .getByText('Jane Smith')
        .closest('[role="button"]');
      fireEvent.click(conversation!);

      expect(mockPush).toHaveBeenCalledWith('/messages/conversations/conv-1');
    });

    it('should not navigate on desktop', () => {
      render(
        <MessagesInboxClient
          initialConversations={mockConversations}
          currentUserId="user-1"
        />
      );

      const conversation = screen
        .getByText('Jane Smith')
        .closest('[role="button"]');
      fireEvent.click(conversation!);

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Desktop Layout', () => {
    it('should show main panel on desktop', () => {
      render(
        <MessagesInboxClient
          initialConversations={mockConversations}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('No conversation selected')).toBeInTheDocument();
    });

    it('should show selected conversation message in main panel', () => {
      render(
        <MessagesInboxClient
          initialConversations={mockConversations}
          currentUserId="user-1"
        />
      );

      const conversation = screen
        .getByText('Jane Smith')
        .closest('[role="button"]');
      fireEvent.click(conversation!);

      expect(
        screen.getByText('Conversation view coming soon')
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible search input', () => {
      render(
        <MessagesInboxClient
          initialConversations={mockConversations}
          currentUserId="user-1"
        />
      );

      const searchInput = screen.getByLabelText(
        'Search conversations by participant name'
      );
      expect(searchInput).toBeInTheDocument();
    });

    it('should have proper ARIA roles for tabs', () => {
      render(
        <MessagesInboxClient
          initialConversations={mockConversations}
          currentUserId="user-1"
        />
      );

      expect(screen.getByRole('tab', { name: /all/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /unread/i })).toBeInTheDocument();
    });

    it('should hide decorative icons from screen readers', () => {
      const { container } = render(
        <MessagesInboxClient
          initialConversations={mockConversations}
          currentUserId="user-1"
        />
      );

      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
