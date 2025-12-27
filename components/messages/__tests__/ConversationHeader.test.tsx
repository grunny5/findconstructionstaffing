/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ConversationHeader,
  type ConversationHeaderProps,
} from '../ConversationHeader';

const mockConversation: ConversationHeaderProps['conversation'] = {
  id: 'conv-1',
  context_type: 'general',
  context_agency: null,
  participants: [
    {
      user_id: 'user-1',
      user: {
        id: 'user-1',
        name: 'John Doe',
        avatar_url: 'https://example.com/john.jpg',
        role: 'General Contractor',
      },
    },
    {
      user_id: 'user-2',
      user: {
        id: 'user-2',
        name: 'Jane Smith',
        avatar_url: 'https://example.com/jane.jpg',
        role: 'Recruiter',
      },
    },
  ],
  created_at: '2025-12-20T10:00:00Z',
};

describe('ConversationHeader', () => {
  describe('Basic Rendering', () => {
    it('should render other participant name', () => {
      render(
        <ConversationHeader
          conversation={mockConversation}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should not render current user name', () => {
      render(
        <ConversationHeader
          conversation={mockConversation}
          currentUserId="user-1"
        />
      );

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should render other participant role', () => {
      render(
        <ConversationHeader
          conversation={mockConversation}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('Recruiter')).toBeInTheDocument();
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
              role: null,
            },
          },
          {
            user_id: 'user-2',
            user: {
              id: 'user-2',
              name: 'Jane Smith',
              avatar_url: null,
              role: null,
            },
          },
        ],
      };

      render(
        <ConversationHeader
          conversation={conversationWithoutAvatar}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('JS')).toBeInTheDocument();
    });

    it('should render start date', () => {
      render(
        <ConversationHeader
          conversation={mockConversation}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText(/Started Dec 20, 2025/)).toBeInTheDocument();
    });
  });

  describe('Agency Inquiry Context', () => {
    it('should show context banner for agency inquiry', () => {
      const agencyConversation = {
        ...mockConversation,
        context_type: 'agency_inquiry' as const,
        context_agency: {
          id: 'agency-1',
          name: 'Smith Construction Staffing',
          slug: 'smith-construction-staffing',
        },
      };

      render(
        <ConversationHeader
          conversation={agencyConversation}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText(/Inquiry about/)).toBeInTheDocument();
      expect(
        screen.getByText('Smith Construction Staffing')
      ).toBeInTheDocument();
    });

    it('should show "View Profile" link for agency inquiry', () => {
      const agencyConversation = {
        ...mockConversation,
        context_type: 'agency_inquiry' as const,
        context_agency: {
          id: 'agency-1',
          name: 'Smith Construction Staffing',
          slug: 'smith-construction-staffing',
        },
      };

      render(
        <ConversationHeader
          conversation={agencyConversation}
          currentUserId="user-1"
        />
      );

      const link = screen.getByRole('link', { name: /view profile/i });
      expect(link).toHaveAttribute(
        'href',
        '/recruiters/smith-construction-staffing'
      );
    });

    it('should not show context banner for general conversation', () => {
      render(
        <ConversationHeader
          conversation={mockConversation}
          currentUserId="user-1"
        />
      );

      expect(screen.queryByText(/Inquiry about/)).not.toBeInTheDocument();
    });

    it('should not show context banner if context_agency is null', () => {
      const conversationWithoutAgency = {
        ...mockConversation,
        context_type: 'agency_inquiry' as const,
        context_agency: null,
      };

      render(
        <ConversationHeader
          conversation={conversationWithoutAgency}
          currentUserId="user-1"
        />
      );

      expect(screen.queryByText(/Inquiry about/)).not.toBeInTheDocument();
    });
  });

  describe('Back Button', () => {
    it('should show back button when onBack is provided', () => {
      render(
        <ConversationHeader
          conversation={mockConversation}
          currentUserId="user-1"
          onBack={jest.fn()}
        />
      );

      expect(
        screen.getByRole('button', { name: /back to conversations/i })
      ).toBeInTheDocument();
    });

    it('should not show back button when onBack is not provided', () => {
      render(
        <ConversationHeader
          conversation={mockConversation}
          currentUserId="user-1"
        />
      );

      expect(
        screen.queryByRole('button', { name: /back to conversations/i })
      ).not.toBeInTheDocument();
    });

    it('should call onBack when back button clicked', async () => {
      const user = userEvent.setup();
      const onBack = jest.fn();

      render(
        <ConversationHeader
          conversation={mockConversation}
          currentUserId="user-1"
          onBack={onBack}
        />
      );

      const backButton = screen.getByRole('button', {
        name: /back to conversations/i,
      });
      await user.click(backButton);

      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should show first participant when current user not in list', () => {
      render(
        <ConversationHeader
          conversation={mockConversation}
          currentUserId="user-999"
        />
      );

      // Should show the first participant (John Doe)
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should handle participant without role', () => {
      const conversationWithoutRole = {
        ...mockConversation,
        participants: [
          {
            user_id: 'user-1',
            user: {
              id: 'user-1',
              name: 'John Doe',
              avatar_url: null,
              role: null,
            },
          },
          {
            user_id: 'user-2',
            user: {
              id: 'user-2',
              name: 'Jane Smith',
              avatar_url: null,
              role: null,
            },
          },
        ],
      };

      render(
        <ConversationHeader
          conversation={conversationWithoutRole}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('Recruiter')).not.toBeInTheDocument();
    });
  });
});
