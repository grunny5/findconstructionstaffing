/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminMessagesClient } from '../AdminMessagesClient';

// Mock date-fns to have consistent dates
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 hours ago'),
}));

describe('AdminMessagesClient', () => {
  const mockConversations = [
    {
      id: 'conv-1',
      context_type: 'agency_inquiry',
      context_agency: {
        id: 'agency-1',
        name: 'ABC Staffing',
        slug: 'abc-staffing',
      },
      participants: [
        {
          id: 'user-1',
          full_name: 'John Contractor',
          email: 'john@example.com',
          role: 'user',
        },
        {
          id: 'user-2',
          full_name: 'Jane Owner',
          email: 'jane@agency.com',
          role: 'agency_owner',
        },
      ],
      total_messages: 5,
      recent_messages_24h: 3,
      last_message_preview: 'Hello, I need some workers...',
      last_message_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      is_high_volume: false,
    },
    {
      id: 'conv-2',
      context_type: 'general',
      context_agency: null,
      participants: [
        {
          id: 'user-3',
          full_name: 'Bob User',
          email: 'bob@example.com',
          role: 'user',
        },
        {
          id: 'user-4',
          full_name: 'Alice Admin',
          email: 'alice@example.com',
          role: 'admin',
        },
      ],
      total_messages: 15,
      recent_messages_24h: 12,
      last_message_preview: 'Thanks for your help!',
      last_message_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      is_high_volume: true,
    },
  ];

  describe('Rendering', () => {
    it('should render admin banner', () => {
      render(<AdminMessagesClient conversations={mockConversations} />);

      expect(
        screen.getByText(/You are viewing conversations as an administrator/)
      ).toBeInTheDocument();
    });

    it('should render page title and description', () => {
      render(<AdminMessagesClient conversations={mockConversations} />);

      expect(screen.getByText('Message Moderation')).toBeInTheDocument();
      expect(
        screen.getByText(/View and moderate all platform conversations/)
      ).toBeInTheDocument();
    });

    it('should render all conversations in table', () => {
      render(<AdminMessagesClient conversations={mockConversations} />);

      expect(screen.getByText('John Contractor')).toBeInTheDocument();
      expect(screen.getByText('Jane Owner')).toBeInTheDocument();
      expect(screen.getByText('Bob User')).toBeInTheDocument();
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    });

    it('should show agency context for agency inquiries', () => {
      render(<AdminMessagesClient conversations={mockConversations} />);

      expect(screen.getByText('ABC Staffing')).toBeInTheDocument();
    });

    it('should show "General" for non-agency conversations', () => {
      render(<AdminMessagesClient conversations={mockConversations} />);

      expect(screen.getByText('General')).toBeInTheDocument();
    });

    it('should display message counts', () => {
      render(<AdminMessagesClient conversations={mockConversations} />);

      // Total messages badges
      const messageBadges = screen.getAllByText(/^[0-9]+$/);
      expect(messageBadges.length).toBeGreaterThan(0);
    });

    it('should highlight high volume conversations', () => {
      render(<AdminMessagesClient conversations={mockConversations} />);

      // Check for high volume badge (recent_messages_24h >= 10)
      const highVolumeBadge = screen.getByText('12');
      expect(highVolumeBadge).toHaveClass('bg-destructive');
    });

    it('should show last message preview', () => {
      render(<AdminMessagesClient conversations={mockConversations} />);

      expect(
        screen.getByText('Hello, I need some workers...')
      ).toBeInTheDocument();
      expect(screen.getByText('Thanks for your help!')).toBeInTheDocument();
    });

    it('should show View button for each conversation', () => {
      render(<AdminMessagesClient conversations={mockConversations} />);

      const viewButtons = screen.getAllByText('View');
      expect(viewButtons).toHaveLength(2);
    });
  });

  describe('Filter Tabs', () => {
    it('should show correct counts in tabs', () => {
      render(<AdminMessagesClient conversations={mockConversations} />);

      expect(screen.getByText('All (2)')).toBeInTheDocument();
      expect(screen.getByText('High Volume (1)')).toBeInTheDocument();
      expect(screen.getByText('Flagged (0)')).toBeInTheDocument();
    });

    it('should filter to high volume conversations', async () => {
      const user = userEvent.setup();
      render(<AdminMessagesClient conversations={mockConversations} />);

      const highVolumeTab = screen.getByText('High Volume (1)');
      await user.click(highVolumeTab);

      // Should only show high volume conversation (conv-2)
      expect(screen.getByText('Bob User')).toBeInTheDocument();
      expect(screen.queryByText('John Contractor')).not.toBeInTheDocument();
    });

    it('should show all conversations on All tab', async () => {
      const user = userEvent.setup();
      render(<AdminMessagesClient conversations={mockConversations} />);

      // First click High Volume
      await user.click(screen.getByText('High Volume (1)'));

      // Then click All
      await user.click(screen.getByText('All (2)'));

      // Both conversations should be visible
      expect(screen.getByText('John Contractor')).toBeInTheDocument();
      expect(screen.getByText('Bob User')).toBeInTheDocument();
    });

    it('should disable Flagged tab', () => {
      render(<AdminMessagesClient conversations={mockConversations} />);

      const flaggedTab = screen.getByText('Flagged (0)');
      expect(flaggedTab.closest('button')).toBeDisabled();
    });
  });

  describe('Search Functionality', () => {
    it('should render search input', () => {
      render(<AdminMessagesClient conversations={mockConversations} />);

      const searchInput = screen.getByPlaceholderText(
        /Search by participant name or email/
      );
      expect(searchInput).toBeInTheDocument();
    });

    it('should filter conversations by participant name', async () => {
      const user = userEvent.setup();
      render(<AdminMessagesClient conversations={mockConversations} />);

      const searchInput = screen.getByPlaceholderText(
        /Search by participant name or email/
      );
      await user.type(searchInput, 'John');

      // Should show only conv-1 with John Contractor
      expect(screen.getByText('John Contractor')).toBeInTheDocument();
      expect(screen.queryByText('Bob User')).not.toBeInTheDocument();
    });

    it('should filter conversations by participant email', async () => {
      const user = userEvent.setup();
      render(<AdminMessagesClient conversations={mockConversations} />);

      const searchInput = screen.getByPlaceholderText(
        /Search by participant name or email/
      );
      await user.type(searchInput, 'jane@agency.com');

      // Should show conv-1 with Jane Owner
      expect(screen.getByText('Jane Owner')).toBeInTheDocument();
      expect(screen.queryByText('Bob User')).not.toBeInTheDocument();
    });

    it('should be case-insensitive', async () => {
      const user = userEvent.setup();
      render(<AdminMessagesClient conversations={mockConversations} />);

      const searchInput = screen.getByPlaceholderText(
        /Search by participant name or email/
      );
      await user.type(searchInput, 'JOHN');

      expect(screen.getByText('John Contractor')).toBeInTheDocument();
    });

    it('should show no results message when no matches', async () => {
      const user = userEvent.setup();
      render(<AdminMessagesClient conversations={mockConversations} />);

      const searchInput = screen.getByPlaceholderText(
        /Search by participant name or email/
      );
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText('No conversations found')).toBeInTheDocument();
      expect(
        screen.getByText('Try adjusting your search query')
      ).toBeInTheDocument();
    });

    it('should clear results when search is cleared', async () => {
      const user = userEvent.setup();
      render(<AdminMessagesClient conversations={mockConversations} />);

      const searchInput = screen.getByPlaceholderText(
        /Search by participant name or email/
      ) as HTMLInputElement;

      // Type search
      await user.type(searchInput, 'John');
      expect(screen.queryByText('Bob User')).not.toBeInTheDocument();

      // Clear search
      await user.clear(searchInput);

      // All conversations should be visible again
      expect(screen.getByText('John Contractor')).toBeInTheDocument();
      expect(screen.getByText('Bob User')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no conversations', () => {
      render(<AdminMessagesClient conversations={[]} />);

      expect(screen.getByText('No conversations found')).toBeInTheDocument();
      expect(
        screen.getByText('No conversations to display')
      ).toBeInTheDocument();
    });

    it('should show empty state for high volume filter', async () => {
      const user = userEvent.setup();
      const lowVolumeConversations = [
        {
          ...mockConversations[0],
          is_high_volume: false,
          recent_messages_24h: 2,
        },
      ];

      render(<AdminMessagesClient conversations={lowVolumeConversations} />);

      await user.click(screen.getByText('High Volume (0)'));

      expect(screen.getByText('No conversations found')).toBeInTheDocument();
      expect(
        screen.getByText('No high-volume conversations at this time')
      ).toBeInTheDocument();
    });
  });

  describe('Statistics Display', () => {
    it('should show footer stats', () => {
      render(<AdminMessagesClient conversations={mockConversations} />);

      expect(
        screen.getByText('Showing 2 of 2 conversations')
      ).toBeInTheDocument();
      expect(
        screen.getByText('High volume: 1 conversations')
      ).toBeInTheDocument();
    });

    it('should update stats after filtering', async () => {
      const user = userEvent.setup();
      render(<AdminMessagesClient conversations={mockConversations} />);

      await user.click(screen.getByText('High Volume (1)'));

      expect(
        screen.getByText('Showing 1 of 2 conversations')
      ).toBeInTheDocument();
    });
  });

  describe('Participant Roles', () => {
    it('should display role badges for participants', () => {
      render(<AdminMessagesClient conversations={mockConversations} />);

      // Check that role badges are present (may be multiple instances)
      expect(screen.getAllByText('user').length).toBeGreaterThan(0);
      expect(screen.getAllByText('agency_owner').length).toBeGreaterThan(0);
      expect(screen.getAllByText('admin').length).toBeGreaterThan(0);
    });
  });

  describe('Links', () => {
    it('should link to conversation detail page', () => {
      render(<AdminMessagesClient conversations={mockConversations} />);

      const viewButtons = screen.getAllByText('View');
      const firstLink = viewButtons[0].closest('a');

      expect(firstLink).toHaveAttribute(
        'href',
        '/messages/conversations/conv-1'
      );
    });
  });
});
