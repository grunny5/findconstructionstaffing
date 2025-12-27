/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ConversationListItem,
  type ConversationListItemProps,
} from '../ConversationListItem';

const mockConversation: ConversationListItemProps['conversation'] = {
  id: 'conv-1',
  context_type: 'general',
  last_message: {
    content: 'Hello, this is the last message in the conversation!',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  participants: [
    {
      user_id: 'user-1',
      user: {
        id: 'user-1',
        name: 'John Doe',
        avatar_url: 'https://example.com/john.jpg',
      },
    },
    {
      user_id: 'user-2',
      user: {
        id: 'user-2',
        name: 'Jane Smith',
        avatar_url: 'https://example.com/jane.jpg',
      },
    },
  ],
  unread_count: 0,
};

describe('ConversationListItem', () => {
  describe('Basic Rendering', () => {
    it('should render other participant name', () => {
      render(
        <ConversationListItem
          conversation={mockConversation}
          currentUserId="user-1"
          onClick={jest.fn()}
        />
      );

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should not render current user name', () => {
      render(
        <ConversationListItem
          conversation={mockConversation}
          currentUserId="user-1"
          onClick={jest.fn()}
        />
      );

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should render avatar with fallback initials', () => {
      const conversationWithoutAvatar = {
        ...mockConversation,
        participants: [
          {
            user_id: 'user-1',
            user: {
              id: 'user-1',
              name: 'John Doe',
              avatar_url: null,
            },
          },
          {
            user_id: 'user-2',
            user: {
              id: 'user-2',
              name: 'Jane Smith',
              avatar_url: null,
            },
          },
        ],
      };

      render(
        <ConversationListItem
          conversation={conversationWithoutAvatar}
          currentUserId="user-1"
          onClick={jest.fn()}
        />
      );

      expect(screen.getByText('JS')).toBeInTheDocument();
    });

    it('should render last message preview truncated to 60 chars', () => {
      render(
        <ConversationListItem
          conversation={mockConversation}
          currentUserId="user-1"
          onClick={jest.fn()}
        />
      );

      const preview = screen.getByText(/Hello, this is the last message/);
      expect(preview.textContent!.length).toBeLessThanOrEqual(63); // 60 + '...'
    });

    it('should show "No messages yet" when no last message', () => {
      const conversationWithoutMessages = {
        ...mockConversation,
        last_message: null,
      };

      render(
        <ConversationListItem
          conversation={conversationWithoutMessages}
          currentUserId="user-1"
          onClick={jest.fn()}
        />
      );

      expect(screen.getByText('No messages yet')).toBeInTheDocument();
    });

    it('should render timestamp', () => {
      render(
        <ConversationListItem
          conversation={mockConversation}
          currentUserId="user-1"
          onClick={jest.fn()}
        />
      );

      // Should show "2 hours ago" or similar
      expect(screen.getByText(/ago/i)).toBeInTheDocument();
    });

    it('should not render timestamp when no last message', () => {
      const conversationWithoutMessages = {
        ...mockConversation,
        last_message: null,
      };

      render(
        <ConversationListItem
          conversation={conversationWithoutMessages}
          currentUserId="user-1"
          onClick={jest.fn()}
        />
      );

      expect(screen.queryByText(/ago/i)).not.toBeInTheDocument();
    });
  });

  describe('Unread Badge', () => {
    it('should show unread badge when unread_count > 0', () => {
      const conversationWithUnread = {
        ...mockConversation,
        unread_count: 3,
      };

      render(
        <ConversationListItem
          conversation={conversationWithUnread}
          currentUserId="user-1"
          onClick={jest.fn()}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should not show unread badge when unread_count is 0', () => {
      render(
        <ConversationListItem
          conversation={mockConversation}
          currentUserId="user-1"
          onClick={jest.fn()}
        />
      );

      const badges = screen.queryAllByRole('status');
      expect(badges.length).toBe(0);
    });

    it('should show "9+" for unread count greater than 9', () => {
      const conversationWithManyUnread = {
        ...mockConversation,
        unread_count: 15,
      };

      render(
        <ConversationListItem
          conversation={conversationWithManyUnread}
          currentUserId="user-1"
          onClick={jest.fn()}
        />
      );

      expect(screen.getByText('9+')).toBeInTheDocument();
    });

    it('should apply different styling when unread', () => {
      const conversationWithUnread = {
        ...mockConversation,
        unread_count: 2,
      };

      const { container } = render(
        <ConversationListItem
          conversation={conversationWithUnread}
          currentUserId="user-1"
          onClick={jest.fn()}
        />
      );

      const item = container.querySelector(
        '[data-testid="conversation-list-item"]'
      );
      expect(item).toHaveClass('bg-muted');
    });
  });

  describe('Context Icon', () => {
    it('should show building icon for agency_inquiry context', () => {
      const agencyConversation = {
        ...mockConversation,
        context_type: 'agency_inquiry' as const,
      };

      render(
        <ConversationListItem
          conversation={agencyConversation}
          currentUserId="user-1"
          onClick={jest.fn()}
        />
      );

      expect(screen.getByLabelText('Agency inquiry')).toBeInTheDocument();
    });

    it('should not show building icon for general context', () => {
      render(
        <ConversationListItem
          conversation={mockConversation}
          currentUserId="user-1"
          onClick={jest.fn()}
        />
      );

      expect(screen.queryByLabelText('Agency inquiry')).not.toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('should apply active styling when isActive is true', () => {
      const { container } = render(
        <ConversationListItem
          conversation={mockConversation}
          currentUserId="user-1"
          isActive={true}
          onClick={jest.fn()}
        />
      );

      const item = container.querySelector(
        '[data-testid="conversation-list-item"]'
      );
      expect(item).toHaveClass('bg-accent');
    });

    it('should not apply active styling when isActive is false', () => {
      const { container } = render(
        <ConversationListItem
          conversation={mockConversation}
          currentUserId="user-1"
          isActive={false}
          onClick={jest.fn()}
        />
      );

      const item = container.querySelector(
        '[data-testid="conversation-list-item"]'
      );
      expect(item).not.toHaveClass('bg-accent');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();

      render(
        <ConversationListItem
          conversation={mockConversation}
          currentUserId="user-1"
          onClick={onClick}
        />
      );

      const item = screen.getByRole('button', {
        name: /conversation with jane smith/i,
      });
      await user.click(item);

      expect(onClick).toHaveBeenCalledWith('conv-1');
    });

    it('should call onClick when Enter key pressed', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();

      render(
        <ConversationListItem
          conversation={mockConversation}
          currentUserId="user-1"
          onClick={onClick}
        />
      );

      const item = screen.getByRole('button', {
        name: /conversation with jane smith/i,
      });
      item.focus();
      await user.keyboard('{Enter}');

      expect(onClick).toHaveBeenCalledWith('conv-1');
    });

    it('should call onClick when Space key pressed', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();

      render(
        <ConversationListItem
          conversation={mockConversation}
          currentUserId="user-1"
          onClick={onClick}
        />
      );

      const item = screen.getByRole('button', {
        name: /conversation with jane smith/i,
      });
      item.focus();
      await user.keyboard(' ');

      expect(onClick).toHaveBeenCalledWith('conv-1');
    });
  });

  describe('Accessibility', () => {
    it('should have role="button"', () => {
      render(
        <ConversationListItem
          conversation={mockConversation}
          currentUserId="user-1"
          onClick={jest.fn()}
        />
      );

      expect(
        screen.getByRole('button', { name: /conversation with jane smith/i })
      ).toBeInTheDocument();
    });

    it('should be keyboard focusable', () => {
      render(
        <ConversationListItem
          conversation={mockConversation}
          currentUserId="user-1"
          onClick={jest.fn()}
        />
      );

      const item = screen.getByRole('button', {
        name: /conversation with jane smith/i,
      });
      expect(item).toHaveAttribute('tabIndex', '0');
    });

    it('should include unread count in aria-label', () => {
      const conversationWithUnread = {
        ...mockConversation,
        unread_count: 5,
      };

      render(
        <ConversationListItem
          conversation={conversationWithUnread}
          currentUserId="user-1"
          onClick={jest.fn()}
        />
      );

      expect(
        screen.getByRole('button', {
          name: /conversation with jane smith, 5 unread/i,
        })
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should show first participant when current user not in list', () => {
      render(
        <ConversationListItem
          conversation={mockConversation}
          currentUserId="user-999"
          onClick={jest.fn()}
        />
      );

      // Should show the first participant (John Doe) as the "other" user
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should handle single-word names for initials', () => {
      const conversationWithSingleWordName = {
        ...mockConversation,
        participants: [
          {
            user_id: 'user-1',
            user: {
              id: 'user-1',
              name: 'John Doe',
              avatar_url: null,
            },
          },
          {
            user_id: 'user-2',
            user: {
              id: 'user-2',
              name: 'Alice',
              avatar_url: null,
            },
          },
        ],
      };

      render(
        <ConversationListItem
          conversation={conversationWithSingleWordName}
          currentUserId="user-1"
          onClick={jest.fn()}
        />
      );

      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('should sanitize HTML in last message preview', () => {
      const conversationWithHtml = {
        ...mockConversation,
        last_message: {
          content: '<script>alert("XSS")</script>Hello <b>World</b>!',
          created_at: new Date().toISOString(),
        },
      };

      render(
        <ConversationListItem
          conversation={conversationWithHtml}
          currentUserId="user-1"
          onClick={jest.fn()}
        />
      );

      // Should strip HTML tags
      expect(screen.queryByText(/<script>/)).not.toBeInTheDocument();
      expect(screen.queryByText(/<b>/)).not.toBeInTheDocument();
    });
  });
});
