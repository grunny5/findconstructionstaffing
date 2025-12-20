import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatsCard } from '../StatsCard';
import { TrendingUp, Users } from 'lucide-react';

describe('StatsCard', () => {
  describe('Basic Rendering', () => {
    it('should render title and value', () => {
      render(<StatsCard title="Total Users" value={150} />);

      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('should render string values', () => {
      render(<StatsCard title="Status" value="Active" />);

      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should render numeric values', () => {
      render(<StatsCard title="Count" value={0} />);

      expect(screen.getByText('Count')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Optional Props', () => {
    it('should render description when provided', () => {
      render(
        <StatsCard
          title="Profile Views"
          value={1234}
          description="Last 30 days"
        />
      );

      expect(screen.getByText('Last 30 days')).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      render(<StatsCard title="Profile Views" value={1234} />);

      expect(screen.queryByText('Last 30 days')).not.toBeInTheDocument();
    });

    it('should render icon when provided', () => {
      const { container } = render(
        <StatsCard title="Users" value={100} icon={Users} />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('h-4');
      expect(icon).toHaveClass('w-4');
      expect(icon).toHaveClass('text-muted-foreground');
    });

    it('should not render icon when not provided', () => {
      const { container } = render(<StatsCard title="Users" value={100} />);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBe(0);
    });
  });

  describe('Trend Display', () => {
    it('should render positive trend with green color', () => {
      render(
        <StatsCard
          title="Revenue"
          value="$50,000"
          trend={{
            value: 12,
            label: 'from last month',
            isPositive: true,
          }}
        />
      );

      const trendValue = screen.getByText('+12%');
      expect(trendValue).toBeInTheDocument();
      expect(trendValue).toHaveClass('text-green-600');
      expect(screen.getByText('from last month')).toBeInTheDocument();
    });

    it('should render negative trend with red color', () => {
      render(
        <StatsCard
          title="Sales"
          value={100}
          trend={{
            value: -5,
            label: 'from last month',
            isPositive: false,
          }}
        />
      );

      const trendValue = screen.getByText('-5%');
      expect(trendValue).toBeInTheDocument();
      expect(trendValue).toHaveClass('text-red-600');
      expect(screen.getByText('from last month')).toBeInTheDocument();
    });

    it('should not render trend when not provided', () => {
      render(<StatsCard title="Revenue" value="$50,000" />);

      expect(screen.queryByText(/from last month/)).not.toBeInTheDocument();
    });

    it('should format positive trend with plus sign', () => {
      render(
        <StatsCard
          title="Growth"
          value={100}
          trend={{
            value: 20,
            label: 'increase',
            isPositive: true,
          }}
        />
      );

      expect(screen.getByText('+20%')).toBeInTheDocument();
    });

    it('should format negative trend without plus sign', () => {
      render(
        <StatsCard
          title="Decline"
          value={100}
          trend={{
            value: -10,
            label: 'decrease',
            isPositive: false,
          }}
        />
      );

      expect(screen.getByText('-10%')).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('should render all props together', () => {
      const { container } = render(
        <StatsCard
          title="Profile Completion"
          value="85%"
          description="Looking good!"
          icon={TrendingUp}
          trend={{
            value: 15,
            label: 'from last week',
            isPositive: true,
          }}
        />
      );

      expect(screen.getByText('Profile Completion')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('Looking good!')).toBeInTheDocument();
      expect(screen.getByText('+15%')).toBeInTheDocument();
      expect(screen.getByText('from last week')).toBeInTheDocument();

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply correct text styles to title', () => {
      render(<StatsCard title="Test Title" value={100} />);

      const title = screen.getByText('Test Title');
      expect(title).toHaveClass('text-sm');
      expect(title).toHaveClass('font-medium');
    });

    it('should apply correct text styles to value', () => {
      render(<StatsCard title="Test" value={100} />);

      const value = screen.getByText('100');
      expect(value).toHaveClass('text-2xl');
      expect(value).toHaveClass('font-bold');
    });

    it('should apply correct text styles to description', () => {
      render(
        <StatsCard title="Test" value={100} description="Test description" />
      );

      const description = screen.getByText('Test description');
      expect(description).toHaveClass('text-xs');
      expect(description).toHaveClass('text-muted-foreground');
    });
  });

  describe('Accessibility', () => {
    it('should use semantic heading for title', () => {
      render(<StatsCard title="Accessible Title" value={100} />);

      const title = screen.getByText('Accessible Title');
      expect(title.tagName).toBe('H3');
    });

    it('should be contained within a card structure', () => {
      const { container } = render(<StatsCard title="Test" value={100} />);

      const card = container.querySelector('.rounded-lg.border');
      expect(card).toBeInTheDocument();
    });
  });
});
