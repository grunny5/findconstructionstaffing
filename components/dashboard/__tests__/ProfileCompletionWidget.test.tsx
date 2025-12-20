import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProfileCompletionWidget } from '../ProfileCompletionWidget';

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

    it('should show "Good Progress" for percentage 50-74', () => {
      render(<ProfileCompletionWidget percentage={60} />);

      expect(screen.getByText('Good Progress')).toBeInTheDocument();
    });

    it('should show "Almost There" for percentage 75-99', () => {
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

  describe('Missing Fields', () => {
    it('should not show missing fields section when array is empty', () => {
      render(<ProfileCompletionWidget percentage={50} missingFields={[]} />);

      expect(
        screen.queryByText('Complete your profile:')
      ).not.toBeInTheDocument();
    });

    it('should show missing fields when provided', () => {
      const missingFields = ['Add logo', 'Add description', 'Add phone number'];

      render(
        <ProfileCompletionWidget
          percentage={50}
          missingFields={missingFields}
        />
      );

      expect(screen.getByText('Complete your profile:')).toBeInTheDocument();
      expect(screen.getByText('Add logo')).toBeInTheDocument();
      expect(screen.getByText('Add description')).toBeInTheDocument();
      expect(screen.getByText('Add phone number')).toBeInTheDocument();
    });

    it('should show only first 3 missing fields', () => {
      const missingFields = [
        'Field 1',
        'Field 2',
        'Field 3',
        'Field 4',
        'Field 5',
      ];

      render(
        <ProfileCompletionWidget
          percentage={30}
          missingFields={missingFields}
        />
      );

      expect(screen.getByText('Field 1')).toBeInTheDocument();
      expect(screen.getByText('Field 2')).toBeInTheDocument();
      expect(screen.getByText('Field 3')).toBeInTheDocument();
      expect(screen.queryByText('Field 4')).not.toBeInTheDocument();
      expect(screen.queryByText('Field 5')).not.toBeInTheDocument();
    });

    it('should show count of additional fields when more than 3', () => {
      const missingFields = ['Field 1', 'Field 2', 'Field 3', 'Field 4'];

      render(
        <ProfileCompletionWidget
          percentage={30}
          missingFields={missingFields}
        />
      );

      expect(screen.getByText('+1 more')).toBeInTheDocument();
    });

    it('should show correct count for many additional fields', () => {
      const missingFields = Array.from({ length: 10 }, (_, i) => `Field ${i}`);

      render(
        <ProfileCompletionWidget
          percentage={20}
          missingFields={missingFields}
        />
      );

      expect(screen.getByText('+7 more')).toBeInTheDocument();
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

    it('should render Circle icons for missing fields', () => {
      const { container } = render(
        <ProfileCompletionWidget
          percentage={50}
          missingFields={['Field 1', 'Field 2']}
        />
      );

      const circleIcons = container.querySelectorAll('svg.h-3.w-3');
      expect(circleIcons.length).toBeGreaterThan(0);
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

    it('should handle percentage at boundary 74', () => {
      render(<ProfileCompletionWidget percentage={74} />);

      expect(screen.getByText('Good Progress')).toBeInTheDocument();
    });

    it('should handle percentage at boundary 75', () => {
      render(<ProfileCompletionWidget percentage={75} />);

      expect(screen.getByText('Almost There')).toBeInTheDocument();
    });

    it('should handle percentage at boundary 99', () => {
      render(<ProfileCompletionWidget percentage={99} />);

      expect(screen.getByText('Almost There')).toBeInTheDocument();
      expect(screen.queryByText('Profile Complete')).not.toBeInTheDocument();
    });

    it('should handle empty missing fields array', () => {
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
});
