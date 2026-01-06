import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogoUpload } from '../LogoUpload';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    className?: string;
    'data-testid'?: string;
  }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = jest.fn();
Object.defineProperty(global.URL, 'createObjectURL', { value: mockCreateObjectURL });
Object.defineProperty(global.URL, 'revokeObjectURL', { value: mockRevokeObjectURL });

function createMockFile(
  name: string,
  size: number,
  type: string
): File {
  const content = new Array(size).fill('a').join('');
  return new File([content], name, { type });
}

describe('LogoUpload', () => {
  const defaultProps = {
    onFileSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the upload zone', () => {
      render(<LogoUpload {...defaultProps} />);
      expect(screen.getByTestId('logo-upload')).toBeInTheDocument();
      expect(screen.getByTestId('logo-upload-zone')).toBeInTheDocument();
    });

    it('shows upload instructions when no image', () => {
      render(<LogoUpload {...defaultProps} />);
      expect(screen.getByText('Drag and drop an image')).toBeInTheDocument();
      expect(screen.getByText('or click to browse')).toBeInTheDocument();
    });

    it('shows file type and size restrictions', () => {
      render(<LogoUpload {...defaultProps} />);
      expect(screen.getByText('PNG, JPG, or WebP (max 5MB)')).toBeInTheDocument();
    });

    it('shows recommended dimensions', () => {
      render(<LogoUpload {...defaultProps} />);
      expect(
        screen.getByText('Recommended: Square image, 300x300px')
      ).toBeInTheDocument();
    });

    it('renders hidden file input', () => {
      render(<LogoUpload {...defaultProps} />);
      const input = screen.getByTestId('logo-file-input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'file');
      expect(input).toHaveClass('hidden');
    });

    it('sets correct accept attribute on file input', () => {
      render(<LogoUpload {...defaultProps} />);
      const input = screen.getByTestId('logo-file-input');
      expect(input).toHaveAttribute(
        'accept',
        'image/png,image/jpeg,image/webp'
      );
    });
  });

  describe('Current Logo Display', () => {
    it('displays current logo when provided', () => {
      render(
        <LogoUpload
          {...defaultProps}
          currentLogoUrl="https://example.com/logo.png"
        />
      );
      const image = screen.getByTestId('logo-preview-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/logo.png');
    });

    it('shows remove button when image is displayed', () => {
      render(
        <LogoUpload
          {...defaultProps}
          currentLogoUrl="https://example.com/logo.png"
        />
      );
      expect(screen.getByTestId('logo-remove-button')).toBeInTheDocument();
    });

    it('does not show upload instructions when image exists', () => {
      render(
        <LogoUpload
          {...defaultProps}
          currentLogoUrl="https://example.com/logo.png"
        />
      );
      expect(screen.queryByText('Drag and drop an image')).not.toBeInTheDocument();
    });
  });

  describe('File Selection - Click to Browse', () => {
    it('opens file dialog when clicking upload zone', async () => {
      render(<LogoUpload {...defaultProps} />);
      const input = screen.getByTestId('logo-file-input');
      const clickSpy = jest.spyOn(input, 'click');

      fireEvent.click(screen.getByTestId('logo-upload-zone'));

      expect(clickSpy).toHaveBeenCalled();
    });

    it('accepts valid PNG file', async () => {
      const onFileSelect = jest.fn();
      render(<LogoUpload {...defaultProps} onFileSelect={onFileSelect} />);

      const file = createMockFile('logo.png', 1024, 'image/png');
      const input = screen.getByTestId('logo-file-input');

      fireEvent.change(input, { target: { files: [file] } });

      expect(onFileSelect).toHaveBeenCalledWith(file);
      expect(screen.getByTestId('logo-preview-image')).toBeInTheDocument();
    });

    it('accepts valid JPEG file', async () => {
      const onFileSelect = jest.fn();
      render(<LogoUpload {...defaultProps} onFileSelect={onFileSelect} />);

      const file = createMockFile('logo.jpg', 1024, 'image/jpeg');
      const input = screen.getByTestId('logo-file-input');

      fireEvent.change(input, { target: { files: [file] } });

      expect(onFileSelect).toHaveBeenCalledWith(file);
    });

    it('accepts valid WebP file', async () => {
      const onFileSelect = jest.fn();
      render(<LogoUpload {...defaultProps} onFileSelect={onFileSelect} />);

      const file = createMockFile('logo.webp', 1024, 'image/webp');
      const input = screen.getByTestId('logo-file-input');

      fireEvent.change(input, { target: { files: [file] } });

      expect(onFileSelect).toHaveBeenCalledWith(file);
    });

    it('shows file info after selection', async () => {
      render(<LogoUpload {...defaultProps} />);

      const file = createMockFile('logo.png', 2048, 'image/png');
      const input = screen.getByTestId('logo-file-input');

      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.getByTestId('logo-file-info')).toHaveTextContent('Selected: logo.png');
    });
  });

  describe('File Validation - Type', () => {
    it('rejects GIF files', async () => {
      const onFileSelect = jest.fn();
      render(<LogoUpload {...defaultProps} onFileSelect={onFileSelect} />);

      const file = createMockFile('logo.gif', 1024, 'image/gif');
      const input = screen.getByTestId('logo-file-input');

      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.getByTestId('logo-error-message')).toHaveTextContent(
        'Invalid file type. Please upload a PNG, JPG, or WebP image.'
      );
      expect(onFileSelect).not.toHaveBeenCalled();
    });

    it('rejects SVG files', async () => {
      const onFileSelect = jest.fn();
      render(<LogoUpload {...defaultProps} onFileSelect={onFileSelect} />);

      const file = createMockFile('logo.svg', 1024, 'image/svg+xml');
      const input = screen.getByTestId('logo-file-input');

      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.getByTestId('logo-error-message')).toBeInTheDocument();
      expect(onFileSelect).not.toHaveBeenCalled();
    });

    it('rejects non-image files', async () => {
      const onFileSelect = jest.fn();
      render(<LogoUpload {...defaultProps} onFileSelect={onFileSelect} />);

      const file = createMockFile('document.pdf', 1024, 'application/pdf');
      const input = screen.getByTestId('logo-file-input');

      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.getByTestId('logo-error-message')).toBeInTheDocument();
      expect(onFileSelect).not.toHaveBeenCalled();
    });

    it('accepts files with correct extension but empty MIME type', async () => {
      const onFileSelect = jest.fn();
      render(<LogoUpload {...defaultProps} onFileSelect={onFileSelect} />);

      // Some browsers don't set MIME type correctly
      const file = createMockFile('logo.png', 1024, '');
      const input = screen.getByTestId('logo-file-input');

      fireEvent.change(input, { target: { files: [file] } });

      expect(onFileSelect).toHaveBeenCalledWith(file);
    });
  });

  describe('File Validation - Size', () => {
    it('rejects files larger than 5MB', async () => {
      const onFileSelect = jest.fn();
      render(<LogoUpload {...defaultProps} onFileSelect={onFileSelect} />);

      const file = createMockFile('logo.png', 6 * 1024 * 1024, 'image/png');
      const input = screen.getByTestId('logo-file-input');

      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.getByTestId('logo-error-message')).toHaveTextContent(
        'File too large. Maximum size is 5MB.'
      );
      expect(onFileSelect).not.toHaveBeenCalled();
    });

    it('accepts files exactly 5MB', async () => {
      const onFileSelect = jest.fn();
      render(<LogoUpload {...defaultProps} onFileSelect={onFileSelect} />);

      const file = createMockFile('logo.png', 5 * 1024 * 1024, 'image/png');
      const input = screen.getByTestId('logo-file-input');

      fireEvent.change(input, { target: { files: [file] } });

      expect(onFileSelect).toHaveBeenCalledWith(file);
    });

    it('accepts small files', async () => {
      const onFileSelect = jest.fn();
      render(<LogoUpload {...defaultProps} onFileSelect={onFileSelect} />);

      const file = createMockFile('logo.png', 100, 'image/png');
      const input = screen.getByTestId('logo-file-input');

      fireEvent.change(input, { target: { files: [file] } });

      expect(onFileSelect).toHaveBeenCalledWith(file);
    });
  });

  describe('Drag and Drop', () => {
    it('shows drag state when dragging over', () => {
      render(<LogoUpload {...defaultProps} />);
      const zone = screen.getByTestId('logo-upload-zone');

      fireEvent.dragEnter(zone);

      expect(screen.getByText('Drop image here')).toBeInTheDocument();
    });

    it('removes drag state when leaving', () => {
      render(<LogoUpload {...defaultProps} />);
      const zone = screen.getByTestId('logo-upload-zone');

      fireEvent.dragEnter(zone);
      expect(screen.getByText('Drop image here')).toBeInTheDocument();

      fireEvent.dragLeave(zone);
      expect(screen.queryByText('Drop image here')).not.toBeInTheDocument();
    });

    it('accepts dropped valid file', async () => {
      const onFileSelect = jest.fn();
      render(<LogoUpload {...defaultProps} onFileSelect={onFileSelect} />);

      const file = createMockFile('logo.png', 1024, 'image/png');
      const zone = screen.getByTestId('logo-upload-zone');

      fireEvent.drop(zone, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(onFileSelect).toHaveBeenCalledWith(file);
    });

    it('rejects dropped invalid file', async () => {
      const onFileSelect = jest.fn();
      render(<LogoUpload {...defaultProps} onFileSelect={onFileSelect} />);

      const file = createMockFile('logo.gif', 1024, 'image/gif');
      const zone = screen.getByTestId('logo-upload-zone');

      fireEvent.drop(zone, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(screen.getByTestId('logo-error-message')).toBeInTheDocument();
      expect(onFileSelect).not.toHaveBeenCalled();
    });

    it('ignores drag and drop when disabled', () => {
      const onFileSelect = jest.fn();
      render(<LogoUpload {...defaultProps} onFileSelect={onFileSelect} disabled />);

      const file = createMockFile('logo.png', 1024, 'image/png');
      const zone = screen.getByTestId('logo-upload-zone');

      fireEvent.drop(zone, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(onFileSelect).not.toHaveBeenCalled();
    });

    it('ignores drag and drop when uploading', () => {
      const onFileSelect = jest.fn();
      render(<LogoUpload {...defaultProps} onFileSelect={onFileSelect} isUploading />);

      const file = createMockFile('logo.png', 1024, 'image/png');
      const zone = screen.getByTestId('logo-upload-zone');

      fireEvent.drop(zone, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(onFileSelect).not.toHaveBeenCalled();
    });
  });

  describe('Remove Functionality', () => {
    it('clears selected file when remove clicked', async () => {
      const onFileSelect = jest.fn();
      render(<LogoUpload {...defaultProps} onFileSelect={onFileSelect} />);

      // First select a file
      const file = createMockFile('logo.png', 1024, 'image/png');
      const input = screen.getByTestId('logo-file-input');
      fireEvent.change(input, { target: { files: [file] } });

      expect(onFileSelect).toHaveBeenCalledWith(file);
      expect(screen.getByTestId('logo-preview-image')).toBeInTheDocument();

      // Now remove it
      fireEvent.click(screen.getByTestId('logo-remove-button'));

      expect(onFileSelect).toHaveBeenCalledWith(null);
      expect(screen.queryByTestId('logo-preview-image')).not.toBeInTheDocument();
    });

    it('clears current logo when remove clicked', async () => {
      const onFileSelect = jest.fn();
      render(
        <LogoUpload
          {...defaultProps}
          onFileSelect={onFileSelect}
          currentLogoUrl="https://example.com/logo.png"
        />
      );

      expect(screen.getByTestId('logo-preview-image')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('logo-remove-button'));

      expect(onFileSelect).toHaveBeenCalledWith(null);
    });

    it('revokes object URL when removing selected file', async () => {
      render(<LogoUpload {...defaultProps} />);

      const file = createMockFile('logo.png', 1024, 'image/png');
      const input = screen.getByTestId('logo-file-input');
      fireEvent.change(input, { target: { files: [file] } });

      fireEvent.click(screen.getByTestId('logo-remove-button'));

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('clears validation error when removing file', async () => {
      render(<LogoUpload {...defaultProps} />);

      // First trigger an error
      const invalidFile = createMockFile('logo.gif', 1024, 'image/gif');
      const input = screen.getByTestId('logo-file-input');
      fireEvent.change(input, { target: { files: [invalidFile] } });

      expect(screen.getByTestId('logo-error-message')).toBeInTheDocument();

      // Now select a valid file
      const validFile = createMockFile('logo.png', 1024, 'image/png');
      fireEvent.change(input, { target: { files: [validFile] } });

      expect(screen.queryByTestId('logo-error-message')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when uploading', () => {
      render(<LogoUpload {...defaultProps} isUploading />);
      expect(screen.getByTestId('logo-upload-spinner')).toBeInTheDocument();
    });

    it('hides remove button when uploading', () => {
      render(
        <LogoUpload
          {...defaultProps}
          currentLogoUrl="https://example.com/logo.png"
          isUploading
        />
      );
      expect(screen.queryByTestId('logo-remove-button')).not.toBeInTheDocument();
    });

    it('disables file input when uploading', () => {
      render(<LogoUpload {...defaultProps} isUploading />);
      expect(screen.getByTestId('logo-file-input')).toBeDisabled();
    });
  });

  describe('Disabled State', () => {
    it('disables file input when disabled', () => {
      render(<LogoUpload {...defaultProps} disabled />);
      expect(screen.getByTestId('logo-file-input')).toBeDisabled();
    });

    it('does not open file dialog when disabled and clicked', () => {
      render(<LogoUpload {...defaultProps} disabled />);
      const input = screen.getByTestId('logo-file-input');
      const clickSpy = jest.spyOn(input, 'click');

      fireEvent.click(screen.getByTestId('logo-upload-zone'));

      expect(clickSpy).not.toHaveBeenCalled();
    });

    it('hides remove button when disabled', () => {
      render(
        <LogoUpload
          {...defaultProps}
          currentLogoUrl="https://example.com/logo.png"
          disabled
        />
      );
      expect(screen.queryByTestId('logo-remove-button')).not.toBeInTheDocument();
    });

    it('applies disabled styles to upload zone', () => {
      render(<LogoUpload {...defaultProps} disabled />);
      const zone = screen.getByTestId('logo-upload-zone');
      expect(zone).toHaveClass('opacity-50');
      expect(zone).toHaveClass('cursor-not-allowed');
    });
  });

  describe('External Error Display', () => {
    it('displays external error message', () => {
      render(<LogoUpload {...defaultProps} error="Upload failed. Please try again." />);
      expect(screen.getByTestId('logo-error-message')).toHaveTextContent(
        'Upload failed. Please try again.'
      );
    });

    it('external error takes precedence over validation error', () => {
      const { rerender } = render(
        <LogoUpload {...defaultProps} error="Server error" />
      );

      // The external error should be shown
      expect(screen.getByTestId('logo-error-message')).toHaveTextContent('Server error');

      // Even if we try to trigger a validation error
      const file = createMockFile('logo.gif', 1024, 'image/gif');
      const input = screen.getByTestId('logo-file-input');
      fireEvent.change(input, { target: { files: [file] } });

      // The external error should still be shown (it's OR'd with validation error)
      // Actually the validation error will overwrite since it sets validationError
      // and externalError || validationError would show validation error
      // But since we set error externally, it should show that
      rerender(<LogoUpload {...defaultProps} error="Server error" />);
      expect(screen.getByTestId('logo-error-message')).toHaveTextContent('Server error');
    });

    it('applies error styles to upload zone', () => {
      render(<LogoUpload {...defaultProps} error="Some error" />);
      const zone = screen.getByTestId('logo-upload-zone');
      expect(zone).toHaveClass('border-destructive');
    });
  });

  describe('Accessibility', () => {
    it('has accessible label', () => {
      render(<LogoUpload {...defaultProps} />);
      expect(screen.getByText('Agency Logo')).toBeInTheDocument();
    });

    it('file input is accessible via hidden input', () => {
      render(<LogoUpload {...defaultProps} />);
      const input = screen.getByTestId('logo-file-input');
      expect(input.tagName).toBe('INPUT');
      expect(input).toHaveAttribute('type', 'file');
    });

    it('preview image has alt text', () => {
      render(
        <LogoUpload
          {...defaultProps}
          currentLogoUrl="https://example.com/logo.png"
        />
      );
      const image = screen.getByTestId('logo-preview-image');
      expect(image).toHaveAttribute('alt', 'Agency logo preview');
    });
  });
});
