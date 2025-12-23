import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProfileCompletionWidget } from '../ProfileCompletionWidget';

// Mock canvas-confetti to avoid canvas errors in jsdom
jest.mock('canvas-confetti', () => {
  return jest.fn();
});

describe('ProfileCompletionWidget', () => {
  describe('Basic Rendering', () => {
    it('should render the component title', () => {
      render(<ProfileCompletionWidget percentage={50} />);

      expect(screen.getByText('Profile Completion')).toBeInTheDocument();
    });

    it('should display the completion percentage', () => {
      render(<ProfileCompletionWidget percentage={65} />);

      expect(screen.getByText('65%')).toBeInTheDocument();
    });

    it('should display 0% completion', () => {
      render(<ProfileCompletionWidget percentage={0} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should display 100% completion', () => {
      render(<ProfileCompletionWidget percentage={100} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Completion Status', () => {
    it('should show "Getting Started" for percentage < 50', () => {
      render(<ProfileCompletionWidget percentage={25} />);

      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });

    it('should show "Good Progress" for percentage 50-79', () => {
      render(<ProfileCompletionWidget percentage={60} />);

      expect(screen.getByText('Good Progress')).toBeInTheDocument();
    });

    it('should show "Almost There" for percentage 80-99', () => {
      render(<ProfileCompletionWidget percentage={85} />);

      expect(screen.getByText('Almost There')).toBeInTheDocument();
    });

    it('should show "Complete" for percentage 100', () => {
      render(<ProfileCompletionWidget percentage={100} />);

      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
  });

  describe('Progress Messages', () => {
    it('should show remaining percentage when incomplete', () => {
      render(<ProfileCompletionWidget percentage={65} />);

      expect(screen.getByText('35% to go')).toBeInTheDocument();
    });

    it('should show completion message when 100%', () => {
      render(<ProfileCompletionWidget percentage={100} />);

      expect(screen.getByText('Your profile is complete!')).toBeInTheDocument();
    });

    it('should calculate remaining percentage correctly', () => {
      render(<ProfileCompletionWidget percentage={73} />);

      expect(screen.getByText('27% to go')).toBeInTheDocument();
    });
  });

  describe('Missing Fields (Deprecated - for backwards compatibility)', () => {
    it('should not show missing fields section when array is empty', () => {
      render(<ProfileCompletionWidget percentage={50} missingFields={[]} />);

      expect(
        screen.queryByText('Complete your profile:')
      ).not.toBeInTheDocument();
    });

    it('should handle undefined missing fields (default)', () => {
      render(<ProfileCompletionWidget percentage={50} />);

      expect(
        screen.queryByText('Complete your profile:')
      ).not.toBeInTheDocument();
    });
  });

  describe('Completion Badge', () => {
    it('should not show completion badge when incomplete', () => {
      render(<ProfileCompletionWidget percentage={75} />);

      expect(screen.queryByText('Profile Complete')).not.toBeInTheDocument();
    });

    it('should show completion badge when 100%', () => {
      render(<ProfileCompletionWidget percentage={100} />);

      expect(screen.getByText('Profile Complete')).toBeInTheDocument();
    });

    it('should show completion badge with correct styling', () => {
      const { container } = render(
        <ProfileCompletionWidget percentage={100} />
      );

      const badge = screen.getByText('Profile Complete').closest('div');
      expect(badge).toHaveClass('bg-green-50');
      expect(badge).toHaveClass('border-green-200');
    });

    it('should show checkmark icon in completion badge', () => {
      const { container } = render(
        <ProfileCompletionWidget percentage={100} />
      );

      const badge = screen.getByText('Profile Complete').closest('div');
      const icon = badge?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('should render circular progress visualization', () => {
      const { container } = render(<ProfileCompletionWidget percentage={50} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render progress bar', () => {
      const { container } = render(<ProfileCompletionWidget percentage={50} />);

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should use semantic heading for title', () => {
      render(<ProfileCompletionWidget percentage={50} />);

      const title = screen.getByText('Profile Completion');
      expect(title.tagName).toBe('H3');
    });

    it('should be contained within a card structure', () => {
      const { container } = render(<ProfileCompletionWidget percentage={50} />);

      const card = container.querySelector('.rounded-lg.border');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle percentage at boundary 49', () => {
      render(<ProfileCompletionWidget percentage={49} />);

      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });

    it('should handle percentage at boundary 50', () => {
      render(<ProfileCompletionWidget percentage={50} />);

      expect(screen.getByText('Good Progress')).toBeInTheDocument();
    });

    it('should handle percentage at boundary 79', () => {
      render(<ProfileCompletionWidget percentage={79} />);

      expect(screen.getByText('Good Progress')).toBeInTheDocument();
    });

    it('should handle percentage at boundary 80', () => {
      render(<ProfileCompletionWidget percentage={80} />);

      expect(screen.getByText('Almost There')).toBeInTheDocument();
    });

    it('should handle percentage at boundary 99', () => {
      render(<ProfileCompletionWidget percentage={99} />);

      expect(screen.getByText('Almost There')).toBeInTheDocument();
      expect(screen.queryByText('Profile Complete')).not.toBeInTheDocument();
    });

  });

  describe('Checklist Items', () => {
    it('should render checklist items when provided', () => {
      const checklistItems = [
        { id: 'logo', label: 'Add Logo', completed: false, link: '/dashboard/profile#logo' },
        { id: 'description', label: 'Complete Description', completed: true, link: '/dashboard/profile#description' },
      ];

      render(<ProfileCompletionWidget percentage={50} checklistItems={checklistItems} />);

      expect(screen.getByText('Add Logo')).toBeInTheDocument();
      expect(screen.getByText('Complete Description')).toBeInTheDocument();
    });

    it('should not render checklist when items array is empty', () => {
      render(<ProfileCompletionWidget percentage={50} checklistItems={[]} />);

      expect(screen.queryByText('Complete your profile:')).not.toBeInTheDocument();
    });
  });

  describe('CTA Button', () => {
    it('should show CTA button when percentage < 80% and checklist items exist', () => {
      const checklistItems = [
        { id: 'logo', label: 'Add Logo', completed: false, link: '/dashboard/profile#logo' },
      ];

      render(<ProfileCompletionWidget percentage={75} checklistItems={checklistItems} />);

      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
    });

    it('should not show CTA button when percentage >= 80%', () => {
      const checklistItems = [
        { id: 'logo', label: 'Add Logo', completed: false, link: '/dashboard/profile#logo' },
      ];

      render(<ProfileCompletionWidget percentage={80} checklistItems={checklistItems} />);

      expect(screen.queryByText('Complete Your Profile')).not.toBeInTheDocument();
    });

    it('should not show CTA button when no checklist items', () => {
      render(<ProfileCompletionWidget percentage={50} checklistItems={[]} />);

      expect(screen.queryByText('Complete Your Profile')).not.toBeInTheDocument();
    });

    it('should link to dashboard profile page', () => {
      const checklistItems = [
        { id: 'logo', label: 'Add Logo', completed: false, link: '/dashboard/profile#logo' },
      ];

      const { container } = render(<ProfileCompletionWidget percentage={50} checklistItems={checklistItems} />);

      const link = container.querySelector('a[href="/dashboard/profile"]');
      expect(link).toBeInTheDocument();
    });
  });

  describe('Confetti Animation', () => {
    it('should render without errors at 100% completion', () => {
      // Just ensure the component renders without crashing when confetti is triggered
      expect(() => {
        render(<ProfileCompletionWidget percentage={100} />);
      }).not.toThrow();
    });
  });
});
