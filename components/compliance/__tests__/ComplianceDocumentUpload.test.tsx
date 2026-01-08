/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComplianceDocumentUpload } from '../ComplianceDocumentUpload';

describe('ComplianceDocumentUpload', () => {
  const mockOnUpload = jest.fn();
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  const createPdfFile = () => {
    return new File(['pdf content'], 'test.pdf', {
      type: 'application/pdf',
    });
  };

  const createImageFile = () => {
    return new File(['image content'], 'test.png', {
      type: 'image/png',
    });
  };

  const createLargeFile = () => {
    const size = 11 * 1024 * 1024;
    const buffer = new ArrayBuffer(size);
    return new File([buffer], 'large.pdf', {
      type: 'application/pdf',
    });
  };

  const createInvalidFile = () => {
    return new File(['text content'], 'test.txt', {
      type: 'text/plain',
    });
  };

  describe('Rendering', () => {
    it('renders upload zone when no document', () => {
      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Supporting Documentation')).toBeInTheDocument();
      expect(screen.getByText('Drag and drop a document')).toBeInTheDocument();
      expect(
        screen.getByText('PDF, PNG, or JPEG (max 10MB)')
      ).toBeInTheDocument();
    });

    it('renders with test id based on compliance type', () => {
      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      expect(
        screen.getByTestId('document-upload-osha_certified')
      ).toBeInTheDocument();
    });

    it('shows current PDF document with view button', () => {
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation();

      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          currentUrl="https://example.com/doc.pdf"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByTestId('document-filename')).toBeInTheDocument();
      expect(screen.getByTestId('view-document-button')).toBeInTheDocument();

      windowOpenSpy.mockRestore();
    });

    it('shows current image document with preview', () => {
      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          currentUrl="https://example.com/image.png"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByTestId('document-preview-image')).toBeInTheDocument();
    });
  });

  describe('File Selection via Click', () => {
    it('allows selecting a PDF file', async () => {
      const user = userEvent.setup();
      const pdfFile = createPdfFile();

      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      const input = screen.getByTestId('document-file-input');
      await user.upload(input, pdfFile);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(pdfFile);
      });
    });

    it('allows selecting an image file', async () => {
      const user = userEvent.setup();
      const imageFile = createImageFile();

      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      const input = screen.getByTestId('document-file-input');
      await user.upload(input, imageFile);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(imageFile);
      });
    });

    it('triggers file input when clicking upload zone', async () => {
      const user = userEvent.setup();

      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      const zone = screen.getByTestId('document-upload-zone');
      const input = screen.getByTestId('document-file-input');

      const inputClickSpy = jest.spyOn(input, 'click');

      await user.click(zone);

      expect(inputClickSpy).toHaveBeenCalled();
    });
  });

  describe('File Validation', () => {
    it('rejects files that are too large', async () => {
      const user = userEvent.setup();
      const largeFile = createLargeFile();

      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      const input = screen.getByTestId('document-file-input');
      await user.upload(input, largeFile);

      await waitFor(() => {
        expect(
          screen.getByTestId('document-error-message')
        ).toBeInTheDocument();
        expect(
          screen.getByText(/File too large. Maximum size is 10MB/)
        ).toBeInTheDocument();
      });

      expect(mockOnUpload).not.toHaveBeenCalled();
    });

    it('rejects invalid file types', async () => {
      const invalidFile = createInvalidFile();

      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      const input = screen.getByTestId(
        'document-file-input'
      ) as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [invalidFile],
        configurable: true,
      });

      act(() => {
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });

      await waitFor(() => {
        expect(
          screen.getByTestId('document-error-message')
        ).toBeInTheDocument();
      });

      expect(screen.getByText(/Invalid file type/)).toBeInTheDocument();

      expect(mockOnUpload).not.toHaveBeenCalled();
    });

    it('accepts PDF files', async () => {
      const user = userEvent.setup();
      const pdfFile = createPdfFile();

      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      const input = screen.getByTestId('document-file-input');
      await user.upload(input, pdfFile);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(pdfFile);
      });

      expect(
        screen.queryByTestId('document-error-message')
      ).not.toBeInTheDocument();
    });

    it('accepts PNG files', async () => {
      const user = userEvent.setup();
      const pngFile = createImageFile();

      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      const input = screen.getByTestId('document-file-input');
      await user.upload(input, pngFile);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(pngFile);
      });

      expect(
        screen.queryByTestId('document-error-message')
      ).not.toBeInTheDocument();
    });

    it('accepts JPG files', async () => {
      const user = userEvent.setup();
      const jpgFile = new File(['image content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      const input = screen.getByTestId('document-file-input');
      await user.upload(input, jpgFile);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(jpgFile);
      });

      expect(
        screen.queryByTestId('document-error-message')
      ).not.toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('shows drag state when dragging over zone', () => {
      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      const zone = screen.getByTestId('document-upload-zone');

      act(() => {
        const dragEnterEvent = new Event('dragenter', { bubbles: true });
        Object.defineProperty(dragEnterEvent, 'dataTransfer', {
          value: { files: [] },
        });

        zone.dispatchEvent(dragEnterEvent);
      });

      expect(screen.getByText('Drop document here')).toBeInTheDocument();
    });

    it('handles file drop', async () => {
      const pdfFile = createPdfFile();

      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      const zone = screen.getByTestId('document-upload-zone');

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [pdfFile],
        },
      });

      zone.dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(pdfFile);
      });
    });
  });

  describe('Remove Functionality', () => {
    it('calls onRemove when remove button clicked', async () => {
      const user = userEvent.setup();

      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          currentUrl="https://example.com/doc.pdf"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      const removeButton = screen.getByTestId('document-remove-button');
      await user.click(removeButton);

      await waitFor(() => {
        expect(mockOnRemove).toHaveBeenCalled();
      });
    });

    it('clears selected file and preview when removing', async () => {
      const user = userEvent.setup();
      const imageFile = createImageFile();

      const { rerender } = render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      const input = screen.getByTestId('document-file-input');
      await user.upload(input, imageFile);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(imageFile);
      });

      const removeButton = screen.getByTestId('document-remove-button');
      await user.click(removeButton);

      rerender(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          currentUrl={null}
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText('Drag and drop a document')
        ).toBeInTheDocument();
      });
    });

    it('revokes object URL when removing', async () => {
      const user = userEvent.setup();
      const imageFile = createImageFile();

      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      const input = screen.getByTestId('document-file-input');
      await user.upload(input, imageFile);

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalled();
      });

      const removeButton = screen.getByTestId('document-remove-button');
      await user.click(removeButton);

      await waitFor(() => {
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(
          'blob:mock-url'
        );
      });
    });
  });

  describe('View Document', () => {
    it('opens document in new tab when view button clicked', async () => {
      const user = userEvent.setup();
      const windowOpenSpy = jest
        .spyOn(window, 'open')
        .mockImplementation(() => null);

      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          currentUrl="https://example.com/doc.pdf"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      const viewButton = screen.getByTestId('view-document-button');
      await user.click(viewButton);

      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://example.com/doc.pdf',
        '_blank'
      );

      windowOpenSpy.mockRestore();
    });
  });

  describe('Loading State', () => {
    it('shows spinner when uploading', () => {
      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
          isUploading={true}
        />
      );

      expect(screen.getByTestId('document-upload-spinner')).toBeInTheDocument();
    });

    it('disables interaction when uploading', async () => {
      const user = userEvent.setup();

      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
          isUploading={true}
        />
      );

      const zone = screen.getByTestId('document-upload-zone');
      await user.click(zone);

      expect(mockOnUpload).not.toHaveBeenCalled();
    });

    it('hides remove button when uploading', () => {
      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          currentUrl="https://example.com/doc.pdf"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
          isUploading={true}
        />
      );

      expect(
        screen.queryByTestId('document-remove-button')
      ).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('prevents interaction when disabled', async () => {
      const user = userEvent.setup();

      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
          disabled={true}
        />
      );

      const zone = screen.getByTestId('document-upload-zone');
      await user.click(zone);

      expect(mockOnUpload).not.toHaveBeenCalled();
    });

    it('hides remove button when disabled', () => {
      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          currentUrl="https://example.com/doc.pdf"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
          disabled={true}
        />
      );

      expect(
        screen.queryByTestId('document-remove-button')
      ).not.toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('displays external error message', () => {
      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
          error="Upload failed"
        />
      );

      expect(screen.getByTestId('document-error-message')).toBeInTheDocument();
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });
  });

  describe('PDF vs Image Display', () => {
    it('shows PDF icon for PDF files', async () => {
      const user = userEvent.setup();
      const pdfFile = createPdfFile();

      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      const input = screen.getByTestId('document-file-input');
      await user.upload(input, pdfFile);

      await waitFor(() => {
        expect(screen.getByTestId('document-filename')).toBeInTheDocument();
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
    });

    it('shows image preview for image files', async () => {
      const user = userEvent.setup();
      const imageFile = createImageFile();

      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      const input = screen.getByTestId('document-file-input');
      await user.upload(input, imageFile);

      await waitFor(() => {
        expect(
          screen.getByTestId('document-preview-image')
        ).toBeInTheDocument();
      });
    });
  });

  describe('File Info Display', () => {
    it('shows file name and size after selection', async () => {
      const user = userEvent.setup();
      const pdfFile = createPdfFile();

      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      const input = screen.getByTestId('document-file-input');
      await user.upload(input, pdfFile);

      await waitFor(() => {
        expect(screen.getByTestId('document-file-info')).toBeInTheDocument();
        expect(screen.getByText(/Selected: test.pdf/)).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Accessibility', () => {
    it('can be triggered with Enter key', async () => {
      const user = userEvent.setup();

      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      const zone = screen.getByTestId('document-upload-zone');
      const input = screen.getByTestId('document-file-input');

      const inputClickSpy = jest.spyOn(input, 'click');

      zone.focus();
      await user.keyboard('{Enter}');

      expect(inputClickSpy).toHaveBeenCalled();
    });

    it('can be triggered with Space key', async () => {
      const user = userEvent.setup();

      render(
        <ComplianceDocumentUpload
          complianceType="osha_certified"
          onUpload={mockOnUpload}
          onRemove={mockOnRemove}
        />
      );

      const zone = screen.getByTestId('document-upload-zone');
      const input = screen.getByTestId('document-file-input');

      const inputClickSpy = jest.spyOn(input, 'click');

      zone.focus();
      await user.keyboard(' ');

      expect(inputClickSpy).toHaveBeenCalled();
    });
  });
});
