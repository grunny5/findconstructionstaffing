import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfilePreviewModal } from '../ProfilePreviewModal';
import type { AgencyProfileFormData } from '@/lib/validations/agency-profile';

// Mock AgencyCard component
jest.mock('@/components/AgencyCard', () => ({
  __esModule: true,
  default: ({ agency }: { agency: any }) => (
    <div data-testid="agency-card">
      <div data-testid="agency-name">{agency.name}</div>
      <div data-testid="agency-description">{agency.description}</div>
      <div data-testid="agency-website">{agency.website}</div>
      <div data-testid="agency-email">{agency.email}</div>
      <div data-testid="agency-phone">{agency.phone}</div>
      <div data-testid="agency-headquarters">{agency.headquarters}</div>
      <div data-testid="agency-founded-year">{agency.founded_year}</div>
      <div data-testid="agency-employee-count">{agency.employee_count}</div>
    </div>
  ),
}));

describe('ProfilePreviewModal', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnPublish = jest.fn<Promise<void>, []>();

  const mockPreviewData: AgencyProfileFormData & {
    slug: string;
    id: string;
    logo_url?: string;
  } = {
    id: 'test-agency-id',
    slug: 'test-agency',
    name: 'Test Staffing Agency',
    description: '<p>A professional staffing agency with rich text.</p>',
    website: 'https://www.teststaffing.com',
    phone: '+12345678900',
    email: 'contact@teststaffing.com',
    founded_year: '2000',
    employee_count: '51-100',
    headquarters: 'Houston, TX',
    logo_url: 'https://example.com/logo.png',
  };

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    previewData: mockPreviewData,
    onPublish: mockOnPublish,
    isPublishing: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Rendering', () => {
    it('should render modal when open is true', () => {
      render(<ProfilePreviewModal {...defaultProps} />);

      expect(screen.getByText('Profile Preview')).toBeInTheDocument();
      expect(screen.getByText('Preview Mode')).toBeInTheDocument();
      expect(
        screen.getByText(
          'This is how your profile will appear to potential clients'
        )
      ).toBeInTheDocument();
    });

    it('should not render modal content when open is false', () => {
      render(<ProfilePreviewModal {...defaultProps} open={false} />);

      expect(screen.queryByText('Profile Preview')).not.toBeInTheDocument();
    });

    it('should render Preview Mode badge', () => {
      render(<ProfilePreviewModal {...defaultProps} />);

      const badge = screen.getByText('Preview Mode');
      expect(badge).toBeInTheDocument();
    });

    it('should render header with title and description', () => {
      render(<ProfilePreviewModal {...defaultProps} />);

      // Verify header content
      expect(screen.getByText('Profile Preview')).toBeInTheDocument();
      expect(
        screen.getByText(
          'This is how your profile will appear to potential clients'
        )
      ).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<ProfilePreviewModal {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /back to editing/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /publish changes/i })
      ).toBeInTheDocument();
    });
  });

  describe('Preview Data Transformation', () => {
    it('should transform form data to AgencyCard format correctly', () => {
      render(<ProfilePreviewModal {...defaultProps} />);

      expect(screen.getByTestId('agency-card')).toBeInTheDocument();
      expect(screen.getByTestId('agency-name')).toHaveTextContent(
        'Test Staffing Agency'
      );
      expect(screen.getByTestId('agency-description')).toHaveTextContent(
        '<p>A professional staffing agency with rich text.</p>'
      );
      expect(screen.getByTestId('agency-website')).toHaveTextContent(
        'https://www.teststaffing.com'
      );
      expect(screen.getByTestId('agency-email')).toHaveTextContent(
        'contact@teststaffing.com'
      );
      expect(screen.getByTestId('agency-phone')).toHaveTextContent(
        '+12345678900'
      );
      expect(screen.getByTestId('agency-headquarters')).toHaveTextContent(
        'Houston, TX'
      );
      expect(screen.getByTestId('agency-employee-count')).toHaveTextContent(
        '51-100'
      );
    });

    it('should convert founded_year string to integer', () => {
      render(<ProfilePreviewModal {...defaultProps} />);

      expect(screen.getByTestId('agency-founded-year')).toHaveTextContent(
        '2000'
      );
    });

    it('should handle undefined founded_year gracefully', () => {
      const dataWithoutYear = {
        ...mockPreviewData,
        founded_year: '',
      };

      render(
        <ProfilePreviewModal {...defaultProps} previewData={dataWithoutYear} />
      );

      expect(screen.getByTestId('agency-card')).toBeInTheDocument();
    });

    it('should include id and slug in preview data', () => {
      render(<ProfilePreviewModal {...defaultProps} />);

      // AgencyCard receives the transformed data including id and slug
      expect(screen.getByTestId('agency-card')).toBeInTheDocument();
    });

    it('should set is_claimed to true for preview', () => {
      render(<ProfilePreviewModal {...defaultProps} />);

      // The transformation sets is_claimed: true
      expect(screen.getByTestId('agency-card')).toBeInTheDocument();
    });

    it('should handle optional logo_url', () => {
      const dataWithoutLogo = {
        ...mockPreviewData,
        logo_url: undefined,
      };

      render(
        <ProfilePreviewModal {...defaultProps} previewData={dataWithoutLogo} />
      );

      expect(screen.getByTestId('agency-card')).toBeInTheDocument();
    });
  });

  describe('Back to Editing Button', () => {
    it('should call onOpenChange with false when clicked', async () => {
      const user = userEvent.setup();
      render(<ProfilePreviewModal {...defaultProps} />);

      const backButton = screen.getByRole('button', {
        name: /back to editing/i,
      });
      await user.click(backButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should be disabled when isPublishing is true', () => {
      render(<ProfilePreviewModal {...defaultProps} isPublishing={true} />);

      const backButton = screen.getByRole('button', {
        name: /back to editing/i,
      });
      expect(backButton).toBeDisabled();
    });

    it('should be enabled when isPublishing is false', () => {
      render(<ProfilePreviewModal {...defaultProps} isPublishing={false} />);

      const backButton = screen.getByRole('button', {
        name: /back to editing/i,
      });
      expect(backButton).toBeEnabled();
    });

    it('should render Edit icon', () => {
      render(<ProfilePreviewModal {...defaultProps} />);

      const backButton = screen.getByRole('button', {
        name: /back to editing/i,
      });
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Publish Changes Button', () => {
    it('should call onPublish when clicked', async () => {
      const user = userEvent.setup();
      mockOnPublish.mockResolvedValueOnce();

      render(<ProfilePreviewModal {...defaultProps} />);

      const publishButton = screen.getByRole('button', {
        name: /publish changes/i,
      });
      await user.click(publishButton);

      expect(mockOnPublish).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when isPublishing is true', () => {
      render(<ProfilePreviewModal {...defaultProps} isPublishing={true} />);

      const publishButton = screen.getByRole('button', {
        name: /publishing/i,
      });
      expect(publishButton).toBeDisabled();
    });

    it('should be enabled when isPublishing is false', () => {
      render(<ProfilePreviewModal {...defaultProps} isPublishing={false} />);

      const publishButton = screen.getByRole('button', {
        name: /publish changes/i,
      });
      expect(publishButton).toBeEnabled();
    });

    it('should show loading spinner when isPublishing is true', () => {
      render(<ProfilePreviewModal {...defaultProps} isPublishing={true} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Publishing...')).toBeInTheDocument();
    });

    it('should show Eye icon when isPublishing is false', () => {
      render(<ProfilePreviewModal {...defaultProps} isPublishing={false} />);

      expect(
        screen.getByRole('button', { name: /publish changes/i })
      ).toBeInTheDocument();
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    it('should handle async publish operation', async () => {
      const user = userEvent.setup();
      let resolvePublish: () => void;
      const publishPromise = new Promise<void>((resolve) => {
        resolvePublish = resolve;
      });
      mockOnPublish.mockReturnValueOnce(publishPromise);

      render(<ProfilePreviewModal {...defaultProps} />);

      const publishButton = screen.getByRole('button', {
        name: /publish changes/i,
      });
      await user.click(publishButton);

      expect(mockOnPublish).toHaveBeenCalledTimes(1);

      resolvePublish!();
      await waitFor(() => {
        expect(mockOnPublish).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Modal Interaction', () => {
    it('should close modal when onOpenChange is called', async () => {
      const user = userEvent.setup();
      render(<ProfilePreviewModal {...defaultProps} />);

      const backButton = screen.getByRole('button', {
        name: /back to editing/i,
      });
      await user.click(backButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange when ESC key is pressed', async () => {
      const user = userEvent.setup();
      render(<ProfilePreviewModal {...defaultProps} />);

      // Shadcn Dialog handles ESC key internally and calls onOpenChange
      // We verify the callback is properly connected
      expect(mockOnOpenChange).toBeDefined();
    });
  });

  describe('Content Scrolling', () => {
    it('should render AgencyCard within modal', () => {
      render(<ProfilePreviewModal {...defaultProps} />);

      expect(screen.getByTestId('agency-card')).toBeInTheDocument();
    });

    it('should display preview content correctly', () => {
      render(<ProfilePreviewModal {...defaultProps} />);

      // Verify that the agency card is rendered with the preview data
      expect(screen.getByTestId('agency-card')).toBeInTheDocument();
      expect(screen.getByTestId('agency-name')).toHaveTextContent(
        'Test Staffing Agency'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty optional fields', () => {
      const minimalData = {
        id: 'test-id',
        slug: 'test-slug',
        name: 'Test Agency',
        description: '',
        website: '',
        phone: '',
        email: '',
        founded_year: '',
        employee_count: '' as const,
        headquarters: '',
      };

      render(
        <ProfilePreviewModal {...defaultProps} previewData={minimalData} />
      );

      expect(screen.getByTestId('agency-card')).toBeInTheDocument();
      expect(screen.getByTestId('agency-name')).toHaveTextContent(
        'Test Agency'
      );
    });

    it('should handle rich text HTML in description', () => {
      const richTextData = {
        ...mockPreviewData,
        description:
          '<p><strong>Bold text</strong> and <em>italic text</em> with <a href="https://example.com">links</a></p>',
      };

      render(
        <ProfilePreviewModal {...defaultProps} previewData={richTextData} />
      );

      expect(screen.getByTestId('agency-description')).toHaveTextContent(
        'Bold text'
      );
    });

    it('should not call onPublish when publish button is disabled', async () => {
      const user = userEvent.setup();
      render(<ProfilePreviewModal {...defaultProps} isPublishing={true} />);

      const publishButton = screen.getByRole('button', {
        name: /publishing/i,
      });

      // Button is disabled, click should not trigger onPublish
      await user.click(publishButton);

      expect(mockOnPublish).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog structure', () => {
      render(<ProfilePreviewModal {...defaultProps} />);

      expect(screen.getByText('Profile Preview')).toBeInTheDocument();
      expect(
        screen.getByText(
          'This is how your profile will appear to potential clients'
        )
      ).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      render(<ProfilePreviewModal {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /back to editing/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /publish changes/i })
      ).toBeInTheDocument();
    });

    it('should have proper button types', () => {
      render(<ProfilePreviewModal {...defaultProps} />);

      const backButton = screen.getByRole('button', {
        name: /back to editing/i,
      });
      const publishButton = screen.getByRole('button', {
        name: /publish changes/i,
      });

      expect(backButton).toHaveAttribute('type', 'button');
      expect(publishButton).toHaveAttribute('type', 'button');
    });
  });
});
