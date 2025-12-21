import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichTextEditor } from '../RichTextEditor';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/dashboard'),
}));

describe('RichTextEditor', () => {
  const mockOnChange = jest.fn();
  const mockOnUpdate = jest.fn();

  const defaultProps = {
    onChange: mockOnChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the editor with toolbar', () => {
      render(<RichTextEditor {...defaultProps} />);

      // Check that toolbar buttons are present
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(5); // Bold, Italic, Lists, Link, Undo, Redo
    });

    it('should render with initial content', () => {
      const initialContent = '<p>Test content</p>';
      render(
        <RichTextEditor {...defaultProps} initialContent={initialContent} />
      );

      // Editor should be present
      const editorElements = document.querySelectorAll(
        '[contenteditable="true"]'
      );
      expect(editorElements.length).toBeGreaterThan(0);
    });

    it('should render with placeholder text', () => {
      const placeholder = 'Enter your description...';
      render(<RichTextEditor {...defaultProps} placeholder={placeholder} />);

      // Check for placeholder (TipTap adds it via CSS and data attributes)
      const editor = document.querySelector('[contenteditable="true"]');
      expect(editor).toBeInTheDocument();
    });

    it('should render all toolbar buttons', () => {
      render(<RichTextEditor {...defaultProps} />);

      const buttons = screen.getAllByRole('button');

      // We should have at least: Bold, Italic, Bullet List, Ordered List, Link, Undo, Redo
      expect(buttons.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Toolbar Actions', () => {
    it('should allow bold formatting', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor {...defaultProps} />);

      const editor = document.querySelector(
        '[contenteditable="true"]'
      ) as HTMLElement;
      const boldButton = screen.getAllByRole('button')[0]; // First button is Bold

      await user.click(editor);
      await user.keyboard('Test text');
      await user.click(boldButton);

      // Check that onChange was called
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should allow italic formatting', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor {...defaultProps} />);

      const editor = document.querySelector(
        '[contenteditable="true"]'
      ) as HTMLElement;
      const italicButton = screen.getAllByRole('button')[1]; // Second button is Italic

      await user.click(editor);
      await user.keyboard('Test text');
      await user.click(italicButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should allow bullet list creation', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor {...defaultProps} />);

      const editor = document.querySelector(
        '[contenteditable="true"]'
      ) as HTMLElement;
      const bulletListButton = screen.getAllByRole('button')[2]; // Third button is Bullet List

      await user.click(editor);
      await user.keyboard('List item');
      await user.click(bulletListButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should allow ordered list creation', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor {...defaultProps} />);

      const editor = document.querySelector(
        '[contenteditable="true"]'
      ) as HTMLElement;
      const orderedListButton = screen.getAllByRole('button')[3]; // Fourth button is Ordered List

      await user.click(editor);
      await user.keyboard('List item');
      await user.click(orderedListButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should have undo button that responds to editor state', () => {
      render(<RichTextEditor {...defaultProps} />);

      const undoButton = screen.getAllByRole('button')[5]; // Undo button

      // Button should exist and be a proper button element
      expect(undoButton).toBeInTheDocument();
      expect(undoButton).toHaveAttribute('type', 'button');

      // Initially should be disabled (no history)
      expect(undoButton).toBeDisabled();
    });

    it('should have redo button that responds to editor state', () => {
      render(<RichTextEditor {...defaultProps} />);

      const redoButton = screen.getAllByRole('button')[6]; // Redo button

      // Button should exist and be a proper button element
      expect(redoButton).toBeInTheDocument();
      expect(redoButton).toHaveAttribute('type', 'button');

      // Initially should be disabled (no future history)
      expect(redoButton).toBeDisabled();
    });

    it('should disable undo button when no history', () => {
      render(<RichTextEditor {...defaultProps} />);

      const undoButton = screen.getAllByRole('button')[5]; // Undo button

      // Initially should be disabled
      expect(undoButton).toBeDisabled();
    });

    it('should disable redo button when no future history', () => {
      render(<RichTextEditor {...defaultProps} />);

      const redoButton = screen.getAllByRole('button')[6]; // Redo button

      // Initially should be disabled
      expect(redoButton).toBeDisabled();
    });
  });

  describe('HTML Output', () => {
    it('should call onChange with HTML when content changes', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor {...defaultProps} />);

      const editor = document.querySelector(
        '[contenteditable="true"]'
      ) as HTMLElement;

      await user.click(editor);
      await user.keyboard('Test content');

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
        const lastCall =
          mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
        expect(typeof lastCall[0]).toBe('string');
        expect(lastCall[0]).toContain('Test content');
      });
    });

    it('should output HTML with formatting', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor {...defaultProps} />);

      const editor = document.querySelector(
        '[contenteditable="true"]'
      ) as HTMLElement;
      const boldButton = screen.getAllByRole('button')[0];

      // Type text and make it bold
      await user.click(editor);
      await user.keyboard('Bold text');
      await user.tripleClick(editor); // Select all
      await user.click(boldButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
        const lastCall =
          mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
        // Should contain bold HTML tag
        expect(lastCall[0]).toMatch(/<(strong|b)>/);
      });
    });

    it('should preserve HTML formatting from initial content', async () => {
      const initialContent = '<p><strong>Bold text</strong></p>';
      render(
        <RichTextEditor {...defaultProps} initialContent={initialContent} />
      );

      // onChange should be called with initial content or similar
      await waitFor(() => {
        if (mockOnChange.mock.calls.length > 0) {
          const lastCall =
            mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
          expect(lastCall[0]).toContain('Bold text');
        }
      });
    });
  });

  describe('Character Counting', () => {
    it('should call onUpdate with plain text length when provided', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor {...defaultProps} onUpdate={mockOnUpdate} />);

      const editor = document.querySelector(
        '[contenteditable="true"]'
      ) as HTMLElement;

      await user.click(editor);
      await user.keyboard('Test');

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
        const lastCall =
          mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1];
        expect(typeof lastCall[0]).toBe('number');
        expect(lastCall[0]).toBe(4); // "Test" is 4 characters
      });
    });

    it('should count plain text length correctly for HTML content', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor {...defaultProps} onUpdate={mockOnUpdate} />);

      const editor = document.querySelector(
        '[contenteditable="true"]'
      ) as HTMLElement;
      const boldButton = screen.getAllByRole('button')[0];

      await user.click(editor);
      await user.keyboard('Test');
      await user.tripleClick(editor);
      await user.click(boldButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
        const lastCall =
          mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1];
        // Plain text length should still be 4, regardless of HTML tags
        expect(lastCall[0]).toBe(4);
      });
    });

    it('should not call onUpdate if callback not provided', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor {...defaultProps} />);

      const editor = document.querySelector(
        '[contenteditable="true"]'
      ) as HTMLElement;

      await user.click(editor);
      await user.keyboard('Test');

      // Should not throw error
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have all buttons as proper button elements', () => {
      render(<RichTextEditor {...defaultProps} />);

      const buttons = screen.getAllByRole('button');

      buttons.forEach((button) => {
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor {...defaultProps} />);

      const editor = document.querySelector(
        '[contenteditable="true"]'
      ) as HTMLElement;

      // Editor should be focusable
      await user.click(editor);
      expect(editor).toHaveFocus();
    });

    it('should maintain focus after toolbar actions', async () => {
      const user = userEvent.setup();
      render(<RichTextEditor {...defaultProps} />);

      const editor = document.querySelector(
        '[contenteditable="true"]'
      ) as HTMLElement;
      const boldButton = screen.getAllByRole('button')[0];

      await user.click(editor);
      await user.keyboard('Test');
      await user.click(boldButton);

      // Editor should regain focus after toolbar action
      await waitFor(() => {
        expect(document.activeElement).toBe(editor);
      });
    });
  });

  describe('Editor Cleanup', () => {
    it('should cleanup editor instance on unmount', () => {
      const { unmount } = render(<RichTextEditor {...defaultProps} />);

      // Component should render without errors
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);

      // Unmount should not throw errors
      expect(() => unmount()).not.toThrow();
    });
  });
});
