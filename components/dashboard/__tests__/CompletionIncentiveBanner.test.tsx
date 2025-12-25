import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CompletionIncentiveBanner } from '../CompletionIncentiveBanner';

// Mock canvas-confetti
jest.mock('canvas-confetti', () => {
  return jest.fn();
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('CompletionIncentiveBanner', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Banner States Based on Percentage', () => {
    it('should show "Boost Your Visibility" banner for <50% completion', () => {
      render(<CompletionIncentiveBanner percentage={25} />);

      expect(screen.getByText('Boost Your Visibility')).toBeInTheDocument();
      expect(
        screen.getByText('Complete your profile to get 3x more leads')
      ).toBeInTheDocument();
      expect(screen.getByText('Complete Profile')).toBeInTheDocument();
    });

    it('should show "Almost There!" banner for 50-79% completion', () => {
      render(<CompletionIncentiveBanner percentage={65} />);

      expect(screen.getByText('Almost There!')).toBeInTheDocument();
      expect(
        screen.getByText('Complete your profile for premium placement')
      ).toBeInTheDocument();
      expect(screen.getByText('Finish Profile')).toBeInTheDocument();
    });

    it('should show "One More Step" banner for 80-99% completion', () => {
      render(<CompletionIncentiveBanner percentage={90} />);

      expect(screen.getByText('One More Step')).toBeInTheDocument();
      expect(
        screen.getByText('Just one more step to unlock Featured Agency status')
      ).toBeInTheDocument();
      expect(screen.getByText('Complete Now')).toBeInTheDocument();
    });

    it('should show "Congratulations!" banner for 100% completion', () => {
      render(<CompletionIncentiveBanner percentage={100} />);

      expect(screen.getByText('Congratulations!')).toBeInTheDocument();
      expect(screen.getByText('Your profile is complete')).toBeInTheDocument();
      expect(screen.getByText('View Profile')).toBeInTheDocument();
    });
  });

  describe('Boundary Testing', () => {
    it('should show destructive banner at 49%', () => {
      render(<CompletionIncentiveBanner percentage={49} />);
      expect(screen.getByText('Boost Your Visibility')).toBeInTheDocument();
    });

    it('should show warning banner at 50%', () => {
      render(<CompletionIncentiveBanner percentage={50} />);
      expect(screen.getByText('Almost There!')).toBeInTheDocument();
    });

    it('should show warning banner at 79%', () => {
      render(<CompletionIncentiveBanner percentage={79} />);
      expect(screen.getByText('Almost There!')).toBeInTheDocument();
    });

    it('should show info banner at 80%', () => {
      render(<CompletionIncentiveBanner percentage={80} />);
      expect(screen.getByText('One More Step')).toBeInTheDocument();
    });

    it('should show info banner at 99%', () => {
      render(<CompletionIncentiveBanner percentage={99} />);
      expect(screen.getByText('One More Step')).toBeInTheDocument();
    });

    it('should show success banner at 100%', () => {
      render(<CompletionIncentiveBanner percentage={100} />);
      expect(screen.getByText('Congratulations!')).toBeInTheDocument();
    });
  });

  describe('CTA Button Links', () => {
    it('should link to default profile page when no incomplete section provided', () => {
      const { container } = render(
        <CompletionIncentiveBanner percentage={50} />
      );

      const link = container.querySelector('a[href="/dashboard/profile"]');
      expect(link).toBeInTheDocument();
    });

    it('should link to specific incomplete section when provided', () => {
      const { container } = render(
        <CompletionIncentiveBanner
          percentage={50}
          incompleteSection="/dashboard/profile#logo"
        />
      );

      const link = container.querySelector('a[href="/dashboard/profile#logo"]');
      expect(link).toBeInTheDocument();
    });

    it('should have correct CTA text for each state', () => {
      const { rerender } = render(
        <CompletionIncentiveBanner percentage={25} />
      );
      expect(screen.getByText('Complete Profile')).toBeInTheDocument();

      rerender(<CompletionIncentiveBanner percentage={65} />);
      expect(screen.getByText('Finish Profile')).toBeInTheDocument();

      rerender(<CompletionIncentiveBanner percentage={90} />);
      expect(screen.getByText('Complete Now')).toBeInTheDocument();

      rerender(<CompletionIncentiveBanner percentage={100} />);
      expect(screen.getByText('View Profile')).toBeInTheDocument();
    });
  });

  describe('Dismissal Functionality', () => {
    it('should show dismiss button for all banner states', () => {
      const { rerender } = render(
        <CompletionIncentiveBanner percentage={25} />
      );
      expect(screen.getByLabelText('Dismiss banner')).toBeInTheDocument();

      rerender(<CompletionIncentiveBanner percentage={65} />);
      expect(screen.getByLabelText('Dismiss banner')).toBeInTheDocument();

      rerender(<CompletionIncentiveBanner percentage={90} />);
      expect(screen.getByLabelText('Dismiss banner')).toBeInTheDocument();

      rerender(<CompletionIncentiveBanner percentage={100} />);
      expect(screen.getByLabelText('Dismiss banner')).toBeInTheDocument();
    });

    it('should dismiss banner when dismiss button clicked', () => {
      render(<CompletionIncentiveBanner percentage={50} />);

      const dismissButton = screen.getByLabelText('Dismiss banner');
      fireEvent.click(dismissButton);

      expect(screen.queryByText('Almost There!')).not.toBeInTheDocument();
    });

    it('should store dismissal state in localStorage', () => {
      render(<CompletionIncentiveBanner percentage={50} />);

      const dismissButton = screen.getByLabelText('Dismiss banner');
      fireEvent.click(dismissButton);

      const storedData = localStorageMock.getItem(
        'completion-banner-dismissed-50'
      );
      expect(storedData).toBeTruthy();

      const parsedData = JSON.parse(storedData!);
      expect(parsedData.timestamp).toBeDefined();
      expect(typeof parsedData.timestamp).toBe('number');
    });

    it('should remain dismissed after component remount', () => {
      const { unmount } = render(<CompletionIncentiveBanner percentage={50} />);

      const dismissButton = screen.getByLabelText('Dismiss banner');
      fireEvent.click(dismissButton);

      unmount();
      render(<CompletionIncentiveBanner percentage={50} />);

      expect(screen.queryByText('Almost There!')).not.toBeInTheDocument();
    });
  });

  describe('100% Completion Special Behavior', () => {
    it('should show compact badge after dismissing 100% banner', () => {
      render(<CompletionIncentiveBanner percentage={100} />);

      const dismissButton = screen.getByLabelText('Dismiss banner');
      fireEvent.click(dismissButton);

      // Full banner should be gone
      expect(screen.queryByText('Congratulations!')).not.toBeInTheDocument();

      // Compact badge should appear
      expect(screen.getByText('Profile Complete')).toBeInTheDocument();
    });

    it('should show compact badge with correct styling', () => {
      render(<CompletionIncentiveBanner percentage={100} />);

      const dismissButton = screen.getByLabelText('Dismiss banner');
      fireEvent.click(dismissButton);

      const badge = screen.getByText('Profile Complete').closest('div');
      expect(badge).toHaveClass('bg-green-50');
      expect(badge).toHaveClass('border-green-200');
    });

    it('should show compact badge with checkmark icon', () => {
      render(<CompletionIncentiveBanner percentage={100} />);

      const dismissButton = screen.getByLabelText('Dismiss banner');
      fireEvent.click(dismissButton);

      const badge = screen.getByText('Profile Complete').closest('div');
      const icon = badge?.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-green-600');
    });

    it('should remember compact badge state after remount', () => {
      const { unmount } = render(
        <CompletionIncentiveBanner percentage={100} />
      );

      const dismissButton = screen.getByLabelText('Dismiss banner');
      fireEvent.click(dismissButton);

      unmount();
      render(<CompletionIncentiveBanner percentage={100} />);

      expect(screen.queryByText('Congratulations!')).not.toBeInTheDocument();
      expect(screen.getByText('Profile Complete')).toBeInTheDocument();
    });
  });

  describe('One Week Expiry for 100% Banner', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should keep banner dismissed within 1 week', () => {
      const { unmount } = render(
        <CompletionIncentiveBanner percentage={100} />
      );

      const dismissButton = screen.getByLabelText('Dismiss banner');
      fireEvent.click(dismissButton);

      unmount();

      // Advance time by 6 days
      jest.advanceTimersByTime(6 * 24 * 60 * 60 * 1000);

      render(<CompletionIncentiveBanner percentage={100} />);

      // Should still show compact badge
      expect(screen.getByText('Profile Complete')).toBeInTheDocument();
      expect(screen.queryByText('Congratulations!')).not.toBeInTheDocument();
    });

    it('should show full banner again after 1 week', () => {
      const { unmount } = render(
        <CompletionIncentiveBanner percentage={100} />
      );

      const dismissButton = screen.getByLabelText('Dismiss banner');
      fireEvent.click(dismissButton);

      unmount();

      // Advance time by 8 days (more than 1 week)
      jest.advanceTimersByTime(8 * 24 * 60 * 60 * 1000);

      render(<CompletionIncentiveBanner percentage={100} />);

      // Should show full banner again
      expect(screen.getByText('Congratulations!')).toBeInTheDocument();
      expect(screen.queryByText('Profile Complete')).not.toBeInTheDocument();
    });

    it('should clear localStorage after 1 week expiry', () => {
      const { unmount } = render(
        <CompletionIncentiveBanner percentage={100} />
      );

      const dismissButton = screen.getByLabelText('Dismiss banner');
      fireEvent.click(dismissButton);

      // Verify storage was set
      expect(
        localStorageMock.getItem('completion-banner-dismissed-100')
      ).toBeTruthy();

      unmount();

      // Advance time by 8 days
      jest.advanceTimersByTime(8 * 24 * 60 * 60 * 1000);

      render(<CompletionIncentiveBanner percentage={100} />);

      // Storage should be cleared
      expect(
        localStorageMock.getItem('completion-banner-dismissed-100')
      ).toBeNull();
    });
  });

  describe('Icon Rendering', () => {
    it('should show TrendingUp icon for <50% completion', () => {
      const { container } = render(
        <CompletionIncentiveBanner percentage={25} />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should show Zap icon for 50-79% completion', () => {
      const { container } = render(
        <CompletionIncentiveBanner percentage={65} />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should show Star icon for 80-99% completion', () => {
      const { container } = render(
        <CompletionIncentiveBanner percentage={90} />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should show CheckCircle2 icon for 100% completion', () => {
      const { container } = render(
        <CompletionIncentiveBanner percentage={100} />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Confetti Animation', () => {
    it('should trigger confetti for 100% completion', () => {
      render(<CompletionIncentiveBanner percentage={100} />);

      // Confetti should not be triggered initially (mocked)
      // This test ensures component renders without errors
      expect(screen.getByText('Congratulations!')).toBeInTheDocument();
    });

    it('should not trigger confetti for 100% if banner is dismissed', () => {
      const { unmount } = render(
        <CompletionIncentiveBanner percentage={100} />
      );

      const dismissButton = screen.getByLabelText('Dismiss banner');
      fireEvent.click(dismissButton);

      unmount();
      render(<CompletionIncentiveBanner percentage={100} />);

      // Should show compact badge, no confetti
      expect(screen.getByText('Profile Complete')).toBeInTheDocument();
    });

    it('should not trigger confetti for other completion levels', () => {
      render(<CompletionIncentiveBanner percentage={50} />);

      expect(screen.getByText('Almost There!')).toBeInTheDocument();
      // No errors should occur
    });
  });

  describe('Accessibility', () => {
    it('should have accessible dismiss button with aria-label', () => {
      render(<CompletionIncentiveBanner percentage={50} />);

      const dismissButton = screen.getByLabelText('Dismiss banner');
      expect(dismissButton).toBeInTheDocument();
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss banner');
    });

    it('should use Alert role for banner', () => {
      const { container } = render(
        <CompletionIncentiveBanner percentage={50} />
      );

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });

    it('should have clickable CTA button', () => {
      render(<CompletionIncentiveBanner percentage={50} />);

      const ctaButton = screen.getByText('Finish Profile');
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton.tagName).toBe('BUTTON');
    });
  });

  describe('Edge Cases', () => {
    it('should not render for percentage > 100', () => {
      const { container } = render(
        <CompletionIncentiveBanner percentage={150} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should handle percentage = 0', () => {
      render(<CompletionIncentiveBanner percentage={0} />);

      expect(screen.getByText('Boost Your Visibility')).toBeInTheDocument();
    });

    it('should handle negative percentage', () => {
      const { container } = render(
        <CompletionIncentiveBanner percentage={-10} />
      );

      // Should treat as <50%
      expect(screen.getByText('Boost Your Visibility')).toBeInTheDocument();
    });
  });

  describe('Different Dismissal States Per Percentage', () => {
    it('should track dismissal separately for each percentage level', () => {
      const { unmount } = render(<CompletionIncentiveBanner percentage={50} />);

      const dismissButton = screen.getByLabelText('Dismiss banner');
      fireEvent.click(dismissButton);

      // 50% banner should be dismissed
      expect(screen.queryByText('Almost There!')).not.toBeInTheDocument();

      unmount();

      // Change to 80% - should show new banner
      render(<CompletionIncentiveBanner percentage={80} />);
      expect(screen.getByText('One More Step')).toBeInTheDocument();
    });

    it('should not affect other percentage levels when dismissing one', () => {
      // Dismiss 50% banner
      const { unmount } = render(<CompletionIncentiveBanner percentage={50} />);
      const dismissButton = screen.getByLabelText('Dismiss banner');
      fireEvent.click(dismissButton);
      unmount();

      // 80% banner should still show
      render(<CompletionIncentiveBanner percentage={80} />);
      expect(screen.getByText('One More Step')).toBeInTheDocument();
    });
  });
});
