/**
 * Tests for ComplianceVerifyDialog Component
 *
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComplianceVerifyDialog } from '../ComplianceVerifyDialog';
import type { ComplianceItemFull, ComplianceType } from '@/types/api';
import { toast } from 'sonner';

// Mock global fetch
global.fetch = jest.fn();

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    fill,
  }: {
    src: string;
    alt: string;
    fill?: boolean;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-fill={fill} />
  ),
}));

const mockComplianceItem: ComplianceItemFull = {
  id: 'comp-123',
  type: 'osha_certified' as ComplianceType,
  displayName: 'OSHA Certified',
  isActive: true,
  isVerified: false,
  expirationDate: '2025-12-31',
  isExpired: false,
  documentUrl: 'https://example.com/osha-cert.jpg',
  notes: null,
  verifiedBy: null,
  verifiedAt: null,
};

const mockComplianceItemPDF: ComplianceItemFull = {
  ...mockComplianceItem,
  id: 'comp-456',
  type: 'general_liability' as ComplianceType,
  displayName: 'General Liability Insurance',
  documentUrl: 'https://example.com/liability.pdf',
};

const mockComplianceItemNoDocument: ComplianceItemFull = {
  ...mockComplianceItem,
  id: 'comp-789',
  type: 'drug_testing' as ComplianceType,
  displayName: 'Drug Testing Policy',
  documentUrl: null,
};

const mockComplianceItemVerified: ComplianceItemFull = {
  ...mockComplianceItem,
  id: 'comp-verified',
  isVerified: true,
  verifiedBy: 'admin@example.com',
  verifiedAt: '2024-01-15T10:30:00Z',
  notes: 'Looks good, approved',
};

const mockComplianceItemExpired: ComplianceItemFull = {
  ...mockComplianceItem,
  id: 'comp-expired',
  expirationDate: '2023-01-01',
  isExpired: true,
};

describe('ComplianceVerifyDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnComplete = jest.fn();
  const agencyId = 'agency-123';
  const agencyName = 'Test Agency Inc.';

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Modal Visibility', () => {
    it('should not render when complianceItem is null', () => {
      const { container } = render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={null}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true and complianceItem is provided', () => {
      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      expect(
        screen.getByText('Compliance Document Review')
      ).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      const { container } = render(
        <ComplianceVerifyDialog
          isOpen={false}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      // Dialog should not be visible
      expect(
        screen.queryByText('Compliance Document Review')
      ).not.toBeInTheDocument();
    });
  });

  describe('Content Display', () => {
    it('should display agency name and compliance type', () => {
      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(agencyName)).toBeInTheDocument();
      expect(screen.getByText('OSHA Certified')).toBeInTheDocument();
      expect(
        screen.getByText('OSHA 10/30 safety training certification')
      ).toBeInTheDocument();
    });

    it('should display pending verification badge', () => {
      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Pending Verification')).toBeInTheDocument();
    });

    it('should display verified badge when already verified', () => {
      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItemVerified}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('should display expiration date', () => {
      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Expiration:')).toBeInTheDocument();
      // Expiration date is in format "December 31, 2025" - use getAllByText and check the first one
      const expirationElements = screen.getAllByText((content, element) => {
        return (element?.textContent?.includes('December') &&
          element?.textContent?.includes('2025') &&
          element?.className?.includes(
            'flex items-center gap-2 text-sm'
          )) as boolean;
      });
      expect(expirationElements.length).toBeGreaterThan(0);
    });

    it('should display expired status for expired documents', () => {
      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItemExpired}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/\(Expired\)/)).toBeInTheDocument();
    });

    it('should display verification information when verified', () => {
      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItemVerified}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Verified on/)).toBeInTheDocument();
      expect(
        screen.getByText(/Verified by: admin@example.com/)
      ).toBeInTheDocument();
    });

    it('should display existing admin notes', () => {
      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItemVerified}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Existing Admin Notes')).toBeInTheDocument();
      expect(screen.getByText('Looks good, approved')).toBeInTheDocument();
    });
  });

  describe('Document Display', () => {
    it('should display image preview for image files', () => {
      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      // Check for the image with the expected alt text
      const img = screen.getByAltText('OSHA Certified document');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', mockComplianceItem.documentUrl!);

      // Should not show PDF download link
      expect(
        screen.queryByText('Open Document in New Tab')
      ).not.toBeInTheDocument();
    });

    it('should display download link for PDF files', () => {
      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItemPDF}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('PDF or non-image file')).toBeInTheDocument();
      const link = screen.getByText('Open Document in New Tab');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute(
        'href',
        mockComplianceItemPDF.documentUrl ?? undefined
      );
    });

    it('should display warning when no document is uploaded', () => {
      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItemNoDocument}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('No Document Uploaded')).toBeInTheDocument();
      expect(
        screen.getByText(/has not uploaded a verification document/)
      ).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should allow entering admin notes', () => {
      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      const notesTextarea = screen.getByPlaceholderText(
        /Add any notes about this verification/
      );
      fireEvent.change(notesTextarea, {
        target: { value: 'Test admin notes' },
      });

      expect(notesTextarea).toHaveValue('Test admin notes');
    });

    it('should show reject reason field when Reject button is clicked', () => {
      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      const rejectButton = screen.getByRole('button', { name: /^Reject$/ });
      fireEvent.click(rejectButton);

      expect(screen.getByText('Rejection Reason *')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(
          /Explain why this document is being rejected/
        )
      ).toBeInTheDocument();
    });

    it('should allow canceling rejection', () => {
      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      // Click Reject to show reason field
      const rejectButton = screen.getByRole('button', { name: /^Reject$/ });
      fireEvent.click(rejectButton);

      // Click Cancel Rejection
      const cancelButton = screen.getByRole('button', {
        name: /Cancel Rejection/,
      });
      fireEvent.click(cancelButton);

      // Reason field should be hidden
      expect(
        screen.queryByPlaceholderText(
          /Explain why this document is being rejected/
        )
      ).not.toBeInTheDocument();
    });

    it('should disable Verify button when no document is uploaded', () => {
      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItemNoDocument}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      const verifyButton = screen.getByRole('button', {
        name: /Verify Document/,
      });
      expect(verifyButton).toBeDisabled();
    });

    it('should not show verify/reject buttons for already verified documents', () => {
      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItemVerified}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      expect(
        screen.queryByRole('button', { name: /Verify Document/ })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /^Reject$/ })
      ).not.toBeInTheDocument();
    });
  });

  describe('Verify Action', () => {
    it('should call verify API endpoint with correct data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      const verifyButton = screen.getByRole('button', {
        name: /Verify Document/,
      });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/admin/agencies/${agencyId}/compliance/verify`,
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              complianceType: mockComplianceItem.type,
              action: 'verify',
            }),
          })
        );
      });
    });

    it('should include admin notes in verify request when provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      // Enter admin notes
      const notesTextarea = screen.getByPlaceholderText(
        /Add any notes about this verification/
      );
      fireEvent.change(notesTextarea, {
        target: { value: 'Test admin notes' },
      });

      // Click Verify
      const verifyButton = screen.getByRole('button', {
        name: /Verify Document/,
      });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({
              complianceType: mockComplianceItem.type,
              action: 'verify',
              notes: 'Test admin notes',
            }),
          })
        );
      });
    });

    it('should show success toast on successful verification', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      const verifyButton = screen.getByRole('button', {
        name: /Verify Document/,
      });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Document Verified',
          expect.objectContaining({
            description: expect.stringContaining('has been verified'),
          })
        );
      });
    });

    it('should call onComplete and onClose on successful verification', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      const verifyButton = screen.getByRole('button', {
        name: /Verify Document/,
      });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show error toast on verification failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Verification failed' },
        }),
      });

      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      const verifyButton = screen.getByRole('button', {
        name: /Verify Document/,
      });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Verification Failed',
          expect.objectContaining({
            description: 'Verification failed',
          })
        );
      });
    });

    it('should show loading state during verification', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100)
          )
      );

      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      const verifyButton = screen.getByRole('button', {
        name: /Verify Document/,
      });
      fireEvent.click(verifyButton);

      // Should show loading state
      expect(screen.getByText('Verifying...')).toBeInTheDocument();
      expect(verifyButton).toBeDisabled();

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Reject Action', () => {
    it('should prevent rejection without reason', () => {
      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      // Click Reject to show reason field
      const rejectButton = screen.getByRole('button', { name: /^Reject$/ });
      fireEvent.click(rejectButton);

      // Confirm Rejection button should be disabled when no reason is provided
      const confirmButton = screen.getByRole('button', {
        name: /Confirm Rejection/,
      });
      expect(confirmButton).toBeDisabled();

      // Fetch should not be called because button is disabled
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should call reject API endpoint with correct data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      // Click Reject
      const rejectButton = screen.getByRole('button', { name: /^Reject$/ });
      fireEvent.click(rejectButton);

      // Enter reason
      const reasonTextarea = screen.getByPlaceholderText(
        /Explain why this document is being rejected/
      );
      fireEvent.change(reasonTextarea, {
        target: { value: 'Document is invalid' },
      });

      // Confirm rejection
      const confirmButton = screen.getByRole('button', {
        name: /Confirm Rejection/,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/admin/agencies/${agencyId}/compliance/verify`,
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              complianceType: mockComplianceItem.type,
              action: 'reject',
              reason: 'Document is invalid',
            }),
          })
        );
      });
    });

    it('should include admin notes in reject request when provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      // Enter admin notes
      const notesTextarea = screen.getByPlaceholderText(
        /Add any notes about this verification/
      );
      fireEvent.change(notesTextarea, {
        target: { value: 'Needs re-submission' },
      });

      // Click Reject
      const rejectButton = screen.getByRole('button', { name: /^Reject$/ });
      fireEvent.click(rejectButton);

      // Enter reason
      const reasonTextarea = screen.getByPlaceholderText(
        /Explain why this document is being rejected/
      );
      fireEvent.change(reasonTextarea, {
        target: { value: 'Document is invalid' },
      });

      // Confirm rejection
      const confirmButton = screen.getByRole('button', {
        name: /Confirm Rejection/,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({
              complianceType: mockComplianceItem.type,
              action: 'reject',
              reason: 'Document is invalid',
              notes: 'Needs re-submission',
            }),
          })
        );
      });
    });

    it('should show success toast on successful rejection', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      // Click Reject and provide reason
      const rejectButton = screen.getByRole('button', { name: /^Reject$/ });
      fireEvent.click(rejectButton);

      const reasonTextarea = screen.getByPlaceholderText(
        /Explain why this document is being rejected/
      );
      fireEvent.change(reasonTextarea, {
        target: { value: 'Document is invalid' },
      });

      const confirmButton = screen.getByRole('button', {
        name: /Confirm Rejection/,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Document Rejected',
          expect.objectContaining({
            description: expect.stringContaining('has been rejected'),
          })
        );
      });
    });

    it('should call onComplete and onClose on successful rejection', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      // Reject with reason
      const rejectButton = screen.getByRole('button', { name: /^Reject$/ });
      fireEvent.click(rejectButton);

      const reasonTextarea = screen.getByPlaceholderText(
        /Explain why this document is being rejected/
      );
      fireEvent.change(reasonTextarea, {
        target: { value: 'Document is invalid' },
      });

      const confirmButton = screen.getByRole('button', {
        name: /Confirm Rejection/,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show error toast on rejection failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Rejection failed' },
        }),
      });

      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      // Reject with reason
      const rejectButton = screen.getByRole('button', { name: /^Reject$/ });
      fireEvent.click(rejectButton);

      const reasonTextarea = screen.getByPlaceholderText(
        /Explain why this document is being rejected/
      );
      fireEvent.change(reasonTextarea, {
        target: { value: 'Document is invalid' },
      });

      const confirmButton = screen.getByRole('button', {
        name: /Confirm Rejection/,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Rejection Failed',
          expect.objectContaining({
            description: 'Rejection failed',
          })
        );
      });
    });

    it('should show loading state during rejection', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100)
          )
      );

      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      // Reject with reason
      const rejectButton = screen.getByRole('button', { name: /^Reject$/ });
      fireEvent.click(rejectButton);

      const reasonTextarea = screen.getByPlaceholderText(
        /Explain why this document is being rejected/
      );
      fireEvent.change(reasonTextarea, {
        target: { value: 'Document is invalid' },
      });

      const confirmButton = screen.getByRole('button', {
        name: /Confirm Rejection/,
      });
      fireEvent.click(confirmButton);

      // Should show loading state
      expect(screen.getByText('Rejecting...')).toBeInTheDocument();
      expect(confirmButton).toBeDisabled();

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });

    it('should disable Confirm Rejection button when reason is empty', () => {
      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      // Click Reject to show reason field
      const rejectButton = screen.getByRole('button', { name: /^Reject$/ });
      fireEvent.click(rejectButton);

      // Confirm button should be disabled without reason
      const confirmButton = screen.getByRole('button', {
        name: /Confirm Rejection/,
      });
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('Dialog Close', () => {
    it('should call onClose when Close button is clicked', () => {
      render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      // Get all buttons with "Close" text and find the one in DialogFooter
      const closeButtons = screen.getAllByRole('button', { name: /Close/i });
      const closeButton = closeButtons.find(
        (button) => button.textContent === 'Close'
      );
      expect(closeButton).toBeDefined();
      fireEvent.click(closeButton!);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset form state when closing', async () => {
      const { rerender } = render(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      // Enter admin notes
      const notesTextarea = screen.getByPlaceholderText(
        /Add any notes about this verification/
      );
      fireEvent.change(notesTextarea, {
        target: { value: 'Test notes' },
      });

      // Click Reject to show reason field
      const rejectButton = screen.getByRole('button', { name: /^Reject$/ });
      fireEvent.click(rejectButton);

      // Enter reason
      const reasonTextarea = screen.getByPlaceholderText(
        /Explain why this document is being rejected/
      );
      fireEvent.change(reasonTextarea, {
        target: { value: 'Test reason' },
      });

      // Close dialog
      const closeButtons = screen.getAllByRole('button', { name: /Close/i });
      const closeButton = closeButtons.find(
        (button) => button.textContent === 'Close'
      );
      expect(closeButton).toBeDefined();
      fireEvent.click(closeButton!);

      expect(mockOnClose).toHaveBeenCalled();

      // Reopen dialog to verify form state is reset
      rerender(
        <ComplianceVerifyDialog
          isOpen={true}
          complianceItem={mockComplianceItem}
          agencyId={agencyId}
          agencyName={agencyName}
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />
      );

      // Verify admin notes field is empty
      const reopenedNotesTextarea = screen.getByPlaceholderText(
        /Add any notes about this verification/
      );
      expect(reopenedNotesTextarea).toHaveValue('');

      // Verify reject reason field is not shown (showRejectReason is false)
      expect(
        screen.queryByPlaceholderText(
          /Explain why this document is being rejected/
        )
      ).not.toBeInTheDocument();

      // Verify Reject button is shown (not in rejection mode)
      expect(
        screen.getByRole('button', { name: /^Reject$/ })
      ).toBeInTheDocument();
    });
  });
});
