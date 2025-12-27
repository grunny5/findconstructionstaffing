/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageBubble, type MessageBubbleProps } from '../MessageBubble';

const mockMessage: MessageBubbleProps['message'] = {
  id: 'msg-1',
  content: 'Hello, this is a test message!',
  created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  edited_at: null,
  deleted_at: null,
};

const mockSender: MessageBubbleProps['sender'] = {
  id: 'user-1',
  name: 'John Doe',
  avatar_url: 'https://example.com/avatar.jpg',
};

describe('MessageBubble', () => {
  describe('Basic Rendering', () => {
    it('should render message content', () => {
      render(
        <MessageBubble
          message={mockMessage}
          sender={mockSender}
          isOwnMessage={false}
        />
      );

      expect(
        screen.getByText('Hello, this is a test message!')
      ).toBeInTheDocument();
    });

    it('should render sender name for other messages', () => {
      render(
        <MessageBubble
          message={mockMessage}
          sender={mockSender}
          isOwnMessage={false}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should not render sender name for own messages', () => {
      render(
        <MessageBubble
          message={mockMessage}
          sender={mockSender}
          isOwnMessage={true}
        />
      );

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should render avatar with fallback initials', () => {
      render(
        <MessageBubble
          message={mockMessage}
          sender={{ ...mockSender, avatar_url: null }}
          isOwnMessage={false}
        />
      );

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should render timestamp', () => {
      render(
        <MessageBubble
          message={mockMessage}
          sender={mockSender}
          isOwnMessage={false}
        />
      );

      // Should show "2 hours ago" or similar
      expect(screen.getByText(/ago/i)).toBeInTheDocument();
    });
  });

  describe('Own vs Other Messages', () => {
    it('should have correct styling for own messages', () => {
      const { container } = render(
        <MessageBubble
          message={mockMessage}
          sender={mockSender}
          isOwnMessage={true}
        />
      );

      const messageContainer = container.querySelector(
        '[data-testid="message-bubble"]'
      );
      expect(messageContainer).toHaveClass('flex-row-reverse');
    });

    it('should have correct styling for other messages', () => {
      const { container } = render(
        <MessageBubble
          message={mockMessage}
          sender={mockSender}
          isOwnMessage={false}
        />
      );

      const messageContainer = container.querySelector(
        '[data-testid="message-bubble"]'
      );
      expect(messageContainer).toHaveClass('flex-row');
    });
  });

  describe('Edited Messages', () => {
    it('should show (edited) label for edited messages', () => {
      const editedMessage = {
        ...mockMessage,
        edited_at: new Date().toISOString(),
      };

      render(
        <MessageBubble
          message={editedMessage}
          sender={mockSender}
          isOwnMessage={false}
        />
      );

      expect(screen.getByText('(edited)')).toBeInTheDocument();
    });

    it('should not show (edited) label for non-edited messages', () => {
      render(
        <MessageBubble
          message={mockMessage}
          sender={mockSender}
          isOwnMessage={false}
        />
      );

      expect(screen.queryByText('(edited)')).not.toBeInTheDocument();
    });
  });

  describe('Deleted Messages', () => {
    it('should show deleted message text', () => {
      const deletedMessage = {
        ...mockMessage,
        deleted_at: new Date().toISOString(),
      };

      render(
        <MessageBubble
          message={deletedMessage}
          sender={mockSender}
          isOwnMessage={false}
        />
      );

      expect(
        screen.getByText('(This message was deleted)')
      ).toBeInTheDocument();
    });

    it('should not show original content for deleted messages', () => {
      const deletedMessage = {
        ...mockMessage,
        deleted_at: new Date().toISOString(),
      };

      render(
        <MessageBubble
          message={deletedMessage}
          sender={mockSender}
          isOwnMessage={false}
        />
      );

      expect(
        screen.queryByText('Hello, this is a test message!')
      ).not.toBeInTheDocument();
    });

    it('should not show (edited) label for deleted messages', () => {
      const deletedMessage = {
        ...mockMessage,
        edited_at: new Date().toISOString(),
        deleted_at: new Date().toISOString(),
      };

      render(
        <MessageBubble
          message={deletedMessage}
          sender={mockSender}
          isOwnMessage={false}
        />
      );

      expect(screen.queryByText('(edited)')).not.toBeInTheDocument();
    });

    it('should not show actions for deleted messages', () => {
      const deletedMessage = {
        ...mockMessage,
        deleted_at: new Date().toISOString(),
      };

      render(
        <MessageBubble
          message={deletedMessage}
          sender={mockSender}
          isOwnMessage={true}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      expect(
        screen.queryByRole('button', { name: /message actions/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should show actions button for own messages when handlers provided', () => {
      render(
        <MessageBubble
          message={mockMessage}
          sender={mockSender}
          isOwnMessage={true}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      expect(
        screen.getByRole('button', { name: /message actions/i })
      ).toBeInTheDocument();
    });

    it('should not show actions button for other messages', () => {
      render(
        <MessageBubble
          message={mockMessage}
          sender={mockSender}
          isOwnMessage={false}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      expect(
        screen.queryByRole('button', { name: /message actions/i })
      ).not.toBeInTheDocument();
    });

    it('should call onEdit when edit action clicked', async () => {
      const user = userEvent.setup();
      const onEdit = jest.fn();

      // Recent message (within 5 minutes)
      const recentMessage = {
        ...mockMessage,
        created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
      };

      render(
        <MessageBubble
          message={recentMessage}
          sender={mockSender}
          isOwnMessage={true}
          onEdit={onEdit}
          onDelete={jest.fn()}
        />
      );

      const actionsButton = screen.getByRole('button', {
        name: /message actions/i,
      });
      await user.click(actionsButton);

      const editButton = screen.getByRole('menuitem', { name: /edit/i });
      await user.click(editButton);

      expect(onEdit).toHaveBeenCalledWith('msg-1');
    });

    it('should call onDelete when delete action clicked', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();

      render(
        <MessageBubble
          message={mockMessage}
          sender={mockSender}
          isOwnMessage={true}
          onEdit={jest.fn()}
          onDelete={onDelete}
        />
      );

      const actionsButton = screen.getByRole('button', {
        name: /message actions/i,
      });
      await user.click(actionsButton);

      const deleteButton = screen.getByRole('menuitem', { name: /delete/i });
      await user.click(deleteButton);

      expect(onDelete).toHaveBeenCalledWith('msg-1');
    });

    it('should show edit option only within 5 minutes', async () => {
      const user = userEvent.setup();

      // Recent message (within 5 minutes)
      const recentMessage = {
        ...mockMessage,
        created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3 minutes ago
      };

      render(
        <MessageBubble
          message={recentMessage}
          sender={mockSender}
          isOwnMessage={true}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const actionsButton = screen.getByRole('button', {
        name: /message actions/i,
      });
      await user.click(actionsButton);

      expect(
        screen.getByRole('menuitem', { name: /edit/i })
      ).toBeInTheDocument();
    });

    it('should not show edit option after 5 minutes', async () => {
      const user = userEvent.setup();

      // Old message (more than 5 minutes)
      const oldMessage = {
        ...mockMessage,
        created_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(), // 6 minutes ago
      };

      render(
        <MessageBubble
          message={oldMessage}
          sender={mockSender}
          isOwnMessage={true}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const actionsButton = screen.getByRole('button', {
        name: /message actions/i,
      });
      await user.click(actionsButton);

      expect(
        screen.queryByRole('menuitem', { name: /edit/i })
      ).not.toBeInTheDocument();
    });

    it('should always show delete option regardless of time', async () => {
      const user = userEvent.setup();

      // Old message
      const oldMessage = {
        ...mockMessage,
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      };

      render(
        <MessageBubble
          message={oldMessage}
          sender={mockSender}
          isOwnMessage={true}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      const actionsButton = screen.getByRole('button', {
        name: /message actions/i,
      });
      await user.click(actionsButton);

      expect(
        screen.getByRole('menuitem', { name: /delete/i })
      ).toBeInTheDocument();
    });
  });

  describe('Content Sanitization', () => {
    it('should sanitize HTML in message content', () => {
      const messageWithHtml = {
        ...mockMessage,
        content: '<script>alert("XSS")</script>Hello <b>World</b>!',
      };

      render(
        <MessageBubble
          message={messageWithHtml}
          sender={mockSender}
          isOwnMessage={false}
        />
      );

      // Should strip HTML tags
      expect(screen.queryByText(/<script>/)).not.toBeInTheDocument();
      expect(screen.queryByText(/<b>/)).not.toBeInTheDocument();
    });
  });

  describe('Initials Generation', () => {
    it('should generate correct initials for two-word names', () => {
      render(
        <MessageBubble
          message={mockMessage}
          sender={{ ...mockSender, name: 'Jane Smith', avatar_url: null }}
          isOwnMessage={false}
        />
      );

      expect(screen.getByText('JS')).toBeInTheDocument();
    });

    it('should generate correct initials for single-word names', () => {
      render(
        <MessageBubble
          message={mockMessage}
          sender={{ ...mockSender, name: 'Alice', avatar_url: null }}
          isOwnMessage={false}
        />
      );

      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('should handle names with multiple words', () => {
      render(
        <MessageBubble
          message={mockMessage}
          sender={{
            ...mockSender,
            name: 'Mary Jane Watson',
            avatar_url: null,
          }}
          isOwnMessage={false}
        />
      );

      // Should use first and last word
      expect(screen.getByText('MW')).toBeInTheDocument();
    });
  });
});
