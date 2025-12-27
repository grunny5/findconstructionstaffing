/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { UnreadBadge } from '../UnreadBadge';

describe('UnreadBadge', () => {
  describe('Display Logic', () => {
    it('should return null when count is 0', () => {
      const { container } = render(<UnreadBadge count={0} />);
      expect(container.firstChild).toBeNull();
    });

    it('should show count when count is 1', () => {
      render(<UnreadBadge count={1} />);
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should show count when count is between 1 and max', () => {
      render(<UnreadBadge count={5} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should show count when count equals max', () => {
      render(<UnreadBadge count={9} />);
      expect(screen.getByText('9')).toBeInTheDocument();
    });

    it('should show "9+" when count is 10 (default max 9)', () => {
      render(<UnreadBadge count={10} />);
      expect(screen.getByText('9+')).toBeInTheDocument();
    });

    it('should show "9+" when count is greater than default max', () => {
      render(<UnreadBadge count={50} />);
      expect(screen.getByText('9+')).toBeInTheDocument();
    });
  });

  describe('Custom Max', () => {
    it('should show count when count is below custom max', () => {
      render(<UnreadBadge count={50} max={99} />);
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('should show "99+" when count exceeds custom max of 99', () => {
      render(<UnreadBadge count={100} max={99} />);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('should show "99+" when count is much greater than custom max', () => {
      render(<UnreadBadge count={500} max={99} />);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('should work with custom max of 5', () => {
      render(<UnreadBadge count={4} max={5} />);
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should show "5+" when count exceeds custom max of 5', () => {
      render(<UnreadBadge count={6} max={5} />);
      expect(screen.getByText('5+')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-label for single unread', () => {
      render(<UnreadBadge count={1} />);
      expect(screen.getByLabelText('1 unread message')).toBeInTheDocument();
    });

    it('should have correct aria-label for multiple unread', () => {
      render(<UnreadBadge count={5} />);
      expect(screen.getByLabelText('5 unread messages')).toBeInTheDocument();
    });

    it('should have correct aria-label when showing "9+"', () => {
      render(<UnreadBadge count={15} />);
      expect(screen.getByLabelText('15 unread messages')).toBeInTheDocument();
    });

    it('should have correct aria-label for high counts', () => {
      render(<UnreadBadge count={100} max={99} />);
      expect(screen.getByLabelText('100 unread messages')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should use destructive variant (red background)', () => {
      const { container } = render(<UnreadBadge count={5} />);
      const badge = container.querySelector('[aria-label]');
      expect(badge).toHaveClass('bg-destructive');
    });

    it('should be circular with proper padding', () => {
      const { container } = render(<UnreadBadge count={5} />);
      const badge = container.querySelector('[aria-label]');
      expect(badge).toHaveClass('rounded-full');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large counts', () => {
      render(<UnreadBadge count={9999} />);
      expect(screen.getByText('9+')).toBeInTheDocument();
    });

    it('should handle negative counts as 0 (not shown)', () => {
      const { container } = render(<UnreadBadge count={-5} />);
      expect(container.firstChild).toBeNull();
    });

    it('should handle max of 1', () => {
      render(<UnreadBadge count={1} max={1} />);
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should show "1+" when count is 2 and max is 1', () => {
      render(<UnreadBadge count={2} max={1} />);
      expect(screen.getByText('1+')).toBeInTheDocument();
    });
  });
});
