import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkImportModal } from '../BulkImportModal';

describe('BulkImportModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
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
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
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

      await userEvent.click(screen.getByTestId('cancel-button'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('clears selected file when cancel is clicked', async () => {
      render(<BulkImportModal {...defaultProps} />);

      const file = new File(['content'], 'test.csv', { type: 'text/csv' });
      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);

      expect(screen.getByTestId('selected-file-name')).toBeInTheDocument();

      await userEvent.click(screen.getByTestId('cancel-button'));

      // Re-open modal to verify state was reset
      render(<BulkImportModal {...defaultProps} />);
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

      // Preview step shows back button
      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });

    it('shows Back button in preview step', async () => {
      render(<BulkImportModal {...defaultProps} />);

      const file = new File(['name,description'], 'test.csv', {
        type: 'text/csv',
      });
      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);

      await userEvent.click(screen.getByTestId('next-button'));

      expect(screen.getByTestId('back-button')).toHaveTextContent('Back');
    });

    it('returns to upload step when Back is clicked', async () => {
      render(<BulkImportModal {...defaultProps} />);

      const file = new File(['name,description'], 'test.csv', {
        type: 'text/csv',
      });
      const fileInput = screen.getByTestId('file-input');
      await userEvent.upload(fileInput, file);

      await userEvent.click(screen.getByTestId('next-button'));
      await userEvent.click(screen.getByTestId('back-button'));

      expect(screen.getByTestId('drop-zone')).toBeInTheDocument();
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
});
