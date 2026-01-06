import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkImportModal } from '../BulkImportModal';
import * as csvParser from '@/lib/utils/csv-parser';

// Mock the csv-parser module
jest.mock('@/lib/utils/csv-parser', () => ({
  parseFile: jest.fn(),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
  MockLink.displayName = 'Link';
  return MockLink;
});

const mockParseFile = csvParser.parseFile as jest.MockedFunction<
  typeof csvParser.parseFile
>;

// Helper to create mock validation response
const createMockPreviewResponse = (overrides = {}) => ({
  rows: [
    {
      rowNumber: 2,
      valid: true,
      errors: [],
      warnings: [],
      data: { _rowNumber: 2, name: 'Test Agency' },
    },
  ],
  summary: { total: 1, valid: 1, invalid: 0, withWarnings: 0 },
  ...overrides,
});

describe('BulkImportModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    mockParseFile.mockResolvedValue({
      success: true,
      data: [{ _rowNumber: 2, name: 'Test Agency' }],
      errors: [],
      warnings: [],
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createMockPreviewResponse()),
    });
  });

  describe('Rendering', () => {
    it('renders modal when isOpen is true', () => {
      render(<BulkImportModal {...defaultProps} />);

      expect(screen.getByTestId('bulk-import-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Bulk Import Agencies'
      );
    });

    it('does not render modal when isOpen is false', () => {
      render(<BulkImportModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('bulk-import-modal')).not.toBeInTheDocument();
    });

    it('renders upload step by default', () => {
      render(<BulkImportModal {...defaultProps} />);

      expect(screen.getByTestId('drop-zone')).toBeInTheDocument();
      expect(screen.getByTestId('browse-button')).toBeInTheDocument();
      expect(
        screen.getByTestId('bulk-import-cancel-button')
      ).toBeInTheDocument();
      expect(screen.getByTestId('next-button')).toBeInTheDocument();
    });

    it('renders file input with correct accept attribute', () => {
      render(<BulkImportModal {...defaultProps} />);

      const fileInput = screen.getByTestId('file-input');
      expect(fileInput).toHaveAttribute('accept', '.csv,.xlsx');
    });

    it('renders Next button as disabled when no file is selected', () => {
      render(<BulkImportModal {...defaultProps} />);

      expect(screen.getByTestId('next-button')).toBeDisabled();
    });
  });

  describe('File Selection via Input', () => {
    it('shows selected file info when a valid CSV file is selected', async () => {
      render(<BulkImportModal {...defaultProps} />);

      const file = new File(['name,description\nTest,Test Desc'], 'test.csv', {
        type: 'text/csv',
      });

      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);

      expect(screen.getByTestId('selected-file-name')).toHaveTextContent(
        'test.csv'
      );
      expect(screen.getByTestId('selected-file-size')).toBeInTheDocument();
    });

    it('shows selected file info when a valid XLSX file is selected', async () => {
      render(<BulkImportModal {...defaultProps} />);

      const file = new File(['mock xlsx content'], 'agencies.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);

      expect(screen.getByTestId('selected-file-name')).toHaveTextContent(
        'agencies.xlsx'
      );
    });

    it('enables Next button when a valid file is selected', async () => {
      render(<BulkImportModal {...defaultProps} />);

      const file = new File(['name,description'], 'test.csv', {
        type: 'text/csv',
      });

      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);

      expect(screen.getByTestId('next-button')).not.toBeDisabled();
    });

    it('shows remove button when file is selected', async () => {
      render(<BulkImportModal {...defaultProps} />);

      const file = new File(['content'], 'test.csv', { type: 'text/csv' });
      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);

      expect(screen.getByTestId('remove-file-button')).toBeInTheDocument();
    });
  });

  describe('File Type Validation', () => {
    it('shows error for invalid file type', async () => {
      render(<BulkImportModal {...defaultProps} />);

      const file = new File(['content'], 'test.pdf', {
        type: 'application/pdf',
      });

      const fileInput = screen.getByTestId('file-input');

      // Use fireEvent for more control over the change event
      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByTestId('file-error')).toHaveTextContent(
        'Invalid file type'
      );
    });

    it('shows error for file that exceeds size limit', () => {
      render(<BulkImportModal {...defaultProps} />);

      // Create a file larger than 10MB by mocking size
      const file = new File(['content'], 'large.csv', { type: 'text/csv' });
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });

      const fileInput = screen.getByTestId('file-input');
      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByTestId('file-error')).toHaveTextContent(
        'File too large'
      );
    });

    it('accepts CSV files by extension when MIME type is missing', async () => {
      render(<BulkImportModal {...defaultProps} />);

      // Some browsers don't set MIME type correctly
      const file = new File(['name,description'], 'data.csv', { type: '' });

      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);

      expect(screen.getByTestId('selected-file-name')).toHaveTextContent(
        'data.csv'
      );
      expect(screen.queryByTestId('file-error')).not.toBeInTheDocument();
    });
  });

  describe('File Removal', () => {
    it('clears selected file when remove button is clicked', async () => {
      render(<BulkImportModal {...defaultProps} />);

      const file = new File(['content'], 'test.csv', { type: 'text/csv' });
      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);

      expect(screen.getByTestId('selected-file-name')).toBeInTheDocument();

      await userEvent.click(screen.getByTestId('remove-file-button'));

      expect(
        screen.queryByTestId('selected-file-name')
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('next-button')).toBeDisabled();
    });
  });

  describe('Drag and Drop', () => {
    it('highlights drop zone when dragging over', () => {
      render(<BulkImportModal {...defaultProps} />);

      const dropZone = screen.getByTestId('drop-zone');

      fireEvent.dragEnter(dropZone, {
        dataTransfer: { files: [] },
      });

      expect(dropZone).toHaveClass('border-primary');
    });

    it('removes highlight when dragging leaves', () => {
      render(<BulkImportModal {...defaultProps} />);

      const dropZone = screen.getByTestId('drop-zone');

      fireEvent.dragEnter(dropZone, {
        dataTransfer: { files: [] },
      });
      fireEvent.dragLeave(dropZone, {
        dataTransfer: { files: [] },
      });

      expect(dropZone).not.toHaveClass('border-primary');
    });

    it('accepts dropped CSV file', () => {
      render(<BulkImportModal {...defaultProps} />);

      const dropZone = screen.getByTestId('drop-zone');
      const file = new File(['content'], 'dropped.csv', { type: 'text/csv' });

      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(screen.getByTestId('selected-file-name')).toHaveTextContent(
        'dropped.csv'
      );
    });

    it('rejects dropped file with invalid type', () => {
      render(<BulkImportModal {...defaultProps} />);

      const dropZone = screen.getByTestId('drop-zone');
      const file = new File(['content'], 'dropped.txt', { type: 'text/plain' });

      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(screen.getByTestId('file-error')).toHaveTextContent(
        'Invalid file type'
      );
    });
  });

  describe('Cancel Button', () => {
    it('calls onClose when cancel button is clicked', async () => {
      const onClose = jest.fn();
      render(<BulkImportModal {...defaultProps} onClose={onClose} />);

      await userEvent.click(screen.getByTestId('bulk-import-cancel-button'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('clears selected file when cancel is clicked', async () => {
      const { rerender } = render(<BulkImportModal {...defaultProps} />);

      const file = new File(['content'], 'test.csv', { type: 'text/csv' });
      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);

      expect(screen.getByTestId('selected-file-name')).toBeInTheDocument();

      await userEvent.click(screen.getByTestId('bulk-import-cancel-button'));

      // Re-open the same modal instance to verify state was reset
      rerender(<BulkImportModal {...defaultProps} isOpen={true} />);
      expect(
        screen.queryByTestId('selected-file-name')
      ).not.toBeInTheDocument();
    });
  });

  describe('Next Button Navigation', () => {
    it('moves to preview step when Next is clicked with valid file', async () => {
      render(<BulkImportModal {...defaultProps} />);

      const file = new File(['name,description'], 'test.csv', {
        type: 'text/csv',
      });
      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);

      await userEvent.click(screen.getByTestId('next-button'));

      // Wait for async operations to complete
      await waitFor(() => {
        expect(screen.getByTestId('back-button')).toBeInTheDocument();
      });
    });

    it('shows Back button in preview step', async () => {
      render(<BulkImportModal {...defaultProps} />);

      const file = new File(['name,description'], 'test.csv', {
        type: 'text/csv',
      });
      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);

      await userEvent.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('back-button')).toHaveTextContent('Back');
      });
    });

    it('returns to upload step when Back is clicked', async () => {
      render(<BulkImportModal {...defaultProps} />);

      const file = new File(['name,description'], 'test.csv', {
        type: 'text/csv',
      });
      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);

      await userEvent.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('back-button')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId('back-button'));

      expect(screen.getByTestId('drop-zone')).toBeInTheDocument();
    });

    it('shows loading state while processing file', async () => {
      // Make parseFile take some time
      mockParseFile.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  data: [{ _rowNumber: 2, name: 'Test' }],
                  errors: [],
                  warnings: [],
                }),
              100
            )
          )
      );

      render(<BulkImportModal {...defaultProps} />);

      const file = new File(['name'], 'test.csv', { type: 'text/csv' });
      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);

      await userEvent.click(screen.getByTestId('next-button'));

      // Should show loading state
      expect(screen.getByTestId('next-button')).toHaveTextContent(
        'Processing...'
      );
    });

    it('shows error when file parsing fails', async () => {
      mockParseFile.mockResolvedValue({
        success: false,
        data: [],
        errors: [{ type: 'file', message: 'Failed to parse file' }],
        warnings: [],
      });

      render(<BulkImportModal {...defaultProps} />);

      const file = new File(['bad content'], 'test.csv', { type: 'text/csv' });
      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);

      await userEvent.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('file-error')).toHaveTextContent(
          'Failed to parse file'
        );
      });
    });

    it('shows error when preview API fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({ error: { message: 'Server error occurred' } }),
      });

      render(<BulkImportModal {...defaultProps} />);

      const file = new File(['name'], 'test.csv', { type: 'text/csv' });
      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);

      await userEvent.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('file-error')).toHaveTextContent(
          'Server error occurred'
        );
      });
    });

    it('displays ImportPreviewTable in preview step', async () => {
      render(<BulkImportModal {...defaultProps} />);

      const file = new File(['name'], 'test.csv', { type: 'text/csv' });
      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);

      await userEvent.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('import-preview-table')).toBeInTheDocument();
      });
    });
  });

  describe('File Size Formatting', () => {
    it('formats bytes correctly', async () => {
      render(<BulkImportModal {...defaultProps} />);

      const file = new File(['x'.repeat(500)], 'small.csv', {
        type: 'text/csv',
      });
      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);

      expect(screen.getByTestId('selected-file-size')).toHaveTextContent('B');
    });

    it('formats kilobytes correctly', async () => {
      render(<BulkImportModal {...defaultProps} />);

      const file = new File(['x'.repeat(2048)], 'medium.csv', {
        type: 'text/csv',
      });
      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);

      expect(screen.getByTestId('selected-file-size')).toHaveTextContent('KB');
    });
  });

  describe('Browse Button', () => {
    it('triggers file input when browse button is clicked', async () => {
      render(<BulkImportModal {...defaultProps} />);

      const fileInput = screen.getByTestId('file-input');
      const clickSpy = jest.spyOn(fileInput, 'click');

      await userEvent.click(screen.getByTestId('browse-button'));

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('Import Execution and Results', () => {
    beforeEach(() => {
      mockParseFile.mockResolvedValue({
        success: true,
        data: [
          { _rowNumber: 2, name: 'Agency A' },
          { _rowNumber: 3, name: 'Agency B' },
        ],
        errors: [],
        warnings: [],
      });
    });

    it('shows results step after successful import', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              rows: [
                {
                  rowNumber: 2,
                  valid: true,
                  errors: [],
                  warnings: [],
                  data: { _rowNumber: 2, name: 'Agency A' },
                },
              ],
              summary: { total: 1, valid: 1, invalid: 0, withWarnings: 0 },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [
                {
                  rowNumber: 2,
                  status: 'created',
                  agencyId: 'agency-1',
                  agencyName: 'Agency A',
                },
              ],
              summary: { total: 1, created: 1, skipped: 0, failed: 0 },
            }),
        });

      const { container } = render(<BulkImportModal {...defaultProps} />);

      const file = new File(['name'], 'test.csv', { type: 'text/csv' });
      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);
      await userEvent.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('import-preview-table')).toBeInTheDocument();
      });

      const importButton = screen.getByTestId('import-button');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByTestId('import-results')).toBeInTheDocument();
      });
      expect(screen.getByText('Import Complete')).toBeInTheDocument();
      expect(screen.getByText(/Created: 1/)).toBeInTheDocument();
    });

    it('displays skipped agencies in results', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              rows: [
                {
                  rowNumber: 2,
                  valid: true,
                  errors: [],
                  warnings: [],
                  data: { _rowNumber: 2, name: 'Agency A' },
                },
                {
                  rowNumber: 3,
                  valid: true,
                  errors: [],
                  warnings: [],
                  data: { _rowNumber: 3, name: 'Agency B' },
                },
              ],
              summary: { total: 2, valid: 2, invalid: 0, withWarnings: 0 },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [
                {
                  rowNumber: 2,
                  status: 'created',
                  agencyId: 'agency-1',
                  agencyName: 'Agency A',
                },
                {
                  rowNumber: 3,
                  status: 'skipped',
                  agencyName: 'Agency B',
                  reason: 'Agency with this name already exists',
                },
              ],
              summary: { total: 2, created: 1, skipped: 1, failed: 0 },
            }),
        });

      const { container } = render(<BulkImportModal {...defaultProps} />);

      const file = new File(['name'], 'test.csv', { type: 'text/csv' });
      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);
      await userEvent.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('import-preview-table')).toBeInTheDocument();
      });

      const importButton = screen.getByTestId('import-button');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByTestId('import-results')).toBeInTheDocument();
      });

      expect(screen.getByText(/Skipped Agencies \(1\)/)).toBeInTheDocument();
      expect(screen.getByTestId('skipped-row-3')).toBeInTheDocument();
      expect(screen.getByText('Agency B')).toBeInTheDocument();
      expect(
        screen.getByText('Agency with this name already exists')
      ).toBeInTheDocument();
    });

    it('displays failed agencies in results', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              rows: [
                {
                  rowNumber: 2,
                  valid: true,
                  errors: [],
                  warnings: [],
                  data: { _rowNumber: 2, name: 'Agency A' },
                },
              ],
              summary: { total: 1, valid: 1, invalid: 0, withWarnings: 0 },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [
                {
                  rowNumber: 2,
                  status: 'failed',
                  agencyName: 'Agency A',
                  reason: 'Failed to create agency',
                },
              ],
              summary: { total: 1, created: 0, skipped: 0, failed: 1 },
            }),
        });

      const { container } = render(<BulkImportModal {...defaultProps} />);

      const file = new File(['name'], 'test.csv', { type: 'text/csv' });
      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);
      await userEvent.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('import-preview-table')).toBeInTheDocument();
      });

      const importButton = screen.getByTestId('import-button');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByTestId('import-results')).toBeInTheDocument();
      });

      expect(screen.getByText(/Failed Agencies \(1\)/)).toBeInTheDocument();
      expect(screen.getByTestId('failed-row-2')).toBeInTheDocument();
      expect(screen.getByText('Agency A')).toBeInTheDocument();
      expect(screen.getByText('Failed to create agency')).toBeInTheDocument();
    });

    it('shows action buttons in results step', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              rows: [
                {
                  rowNumber: 2,
                  valid: true,
                  errors: [],
                  warnings: [],
                  data: { _rowNumber: 2, name: 'Agency A' },
                },
              ],
              summary: { total: 1, valid: 1, invalid: 0, withWarnings: 0 },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [
                {
                  rowNumber: 2,
                  status: 'created',
                  agencyId: 'agency-1',
                  agencyName: 'Agency A',
                },
              ],
              summary: { total: 1, created: 1, skipped: 0, failed: 0 },
            }),
        });

      const { container } = render(<BulkImportModal {...defaultProps} />);

      const file = new File(['name'], 'test.csv', { type: 'text/csv' });
      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);
      await userEvent.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('import-preview-table')).toBeInTheDocument();
      });

      const importButton = screen.getByTestId('import-button');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByTestId('import-results')).toBeInTheDocument();
      });

      expect(screen.getByTestId('close-button')).toBeInTheDocument();
      expect(screen.getByTestId('import-more-button')).toBeInTheDocument();
      expect(screen.getByTestId('view-agencies-button')).toBeInTheDocument();
    });

    it('resets wizard when Import More is clicked', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              rows: [
                {
                  rowNumber: 2,
                  valid: true,
                  errors: [],
                  warnings: [],
                  data: { _rowNumber: 2, name: 'Agency A' },
                },
              ],
              summary: { total: 1, valid: 1, invalid: 0, withWarnings: 0 },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [
                {
                  rowNumber: 2,
                  status: 'created',
                  agencyId: 'agency-1',
                  agencyName: 'Agency A',
                },
              ],
              summary: { total: 1, created: 1, skipped: 0, failed: 0 },
            }),
        });

      const { container } = render(<BulkImportModal {...defaultProps} />);

      const file = new File(['name'], 'test.csv', { type: 'text/csv' });
      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);
      await userEvent.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('import-preview-table')).toBeInTheDocument();
      });

      const importButton = screen.getByTestId('import-button');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByTestId('import-results')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('import-more-button'));

      expect(screen.getByTestId('drop-zone')).toBeInTheDocument();
      expect(screen.queryByTestId('import-results')).not.toBeInTheDocument();
    });

    it('calls onSuccess callback after successful import', async () => {
      const onSuccess = jest.fn();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              rows: [
                {
                  rowNumber: 2,
                  valid: true,
                  errors: [],
                  warnings: [],
                  data: { _rowNumber: 2, name: 'Agency A' },
                },
              ],
              summary: { total: 1, valid: 1, invalid: 0, withWarnings: 0 },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [
                {
                  rowNumber: 2,
                  status: 'created',
                  agencyId: 'agency-1',
                  agencyName: 'Agency A',
                },
              ],
              summary: { total: 1, created: 1, skipped: 0, failed: 0 },
            }),
        });

      const { container } = render(
        <BulkImportModal {...defaultProps} onSuccess={onSuccess} />
      );

      const file = new File(['name'], 'test.csv', { type: 'text/csv' });
      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);
      await userEvent.click(screen.getByTestId('next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('import-preview-table')).toBeInTheDocument();
      });

      const importButton = screen.getByTestId('import-button');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByTestId('import-results')).toBeInTheDocument();
      });

      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
