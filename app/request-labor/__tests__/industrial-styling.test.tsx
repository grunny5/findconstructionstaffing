/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import RequestLaborPage from '../page';

// Mock Header and Footer
jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <header data-testid="header">Header</header>;
  };
});

jest.mock('@/components/Footer', () => {
  return function MockFooter() {
    return <footer data-testid="footer">Footer</footer>;
  };
});

// Mock mock-data
jest.mock('@/lib/mock-data', () => ({
  allTrades: ['Electrician', 'Plumber', 'Welder'],
  allStates: [
    { code: 'TX', name: 'Texas' },
    { code: 'CA', name: 'California' },
  ],
}));

describe('RequestLaborPage Industrial Design Styling', () => {
  describe('Page Background', () => {
    it('should use industrial warm cream background', () => {
      const { container } = render(<RequestLaborPage />);
      const pageWrapper = container.querySelector('.min-h-screen');
      expect(pageWrapper).toHaveClass('bg-industrial-bg-primary');
    });
  });

  describe('Hero Section', () => {
    it('should use industrial graphite background', () => {
      const { container } = render(<RequestLaborPage />);
      const heroSection = container.querySelector('section');
      expect(heroSection).toHaveClass('bg-industrial-graphite-600');
    });

    it('should have orange accent border on hero', () => {
      const { container } = render(<RequestLaborPage />);
      const heroSection = container.querySelector('section');
      expect(heroSection).toHaveClass('border-b-4');
      expect(heroSection).toHaveClass('border-industrial-orange');
    });

    it('should use font-display for hero heading', () => {
      render(<RequestLaborPage />);
      const heading = screen.getByRole('heading', {
        name: /request skilled labor/i,
      });
      expect(heading).toHaveClass('font-display');
      expect(heading).toHaveClass('uppercase');
    });

    it('should use font-body for hero description', () => {
      render(<RequestLaborPage />);
      const description = screen.getByText(
        /tell us about your project and we'll connect you/i
      );
      expect(description).toHaveClass('font-body');
    });
  });

  describe('Card Styling', () => {
    it('should use industrial card styling for all form cards', () => {
      const { container } = render(<RequestLaborPage />);

      // Find cards with industrial styling
      const industrialCards = container.querySelectorAll(
        '.bg-industrial-bg-card.rounded-industrial-sharp.border-industrial-graphite-200'
      );
      // Should have 3 cards (Project Details, Location & Timing, Contact Information)
      expect(industrialCards.length).toBe(3);
    });

    it('should have white background on cards', () => {
      const { container } = render(<RequestLaborPage />);

      const cards = container.querySelectorAll('.bg-industrial-bg-card');
      // At least 3 cards for the form sections
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });

    it('should have sharp corners on cards', () => {
      const { container } = render(<RequestLaborPage />);

      const cards = container.querySelectorAll('.rounded-industrial-sharp');
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Card Headers', () => {
    it('should use font-display uppercase for card titles', () => {
      const { container } = render(<RequestLaborPage />);
      // The h3 (CardTitle) should have industrial styling
      const cardTitles = container.querySelectorAll('h3');
      // There should be 3 card titles
      expect(cardTitles.length).toBe(3);
      // Check all card titles have industrial styling
      cardTitles.forEach((title) => {
        expect(title).toHaveClass('font-display');
        expect(title).toHaveClass('uppercase');
        expect(title).toHaveClass('text-industrial-graphite-600');
      });
    });

    it('should use industrial orange for card icons', () => {
      const { container } = render(<RequestLaborPage />);
      // Find SVG icons with industrial orange color
      const orangeIcons = container.querySelectorAll(
        'svg.text-industrial-orange'
      );
      // Should have at least 3 icons (one per card header, plus info box)
      expect(orangeIcons.length).toBeGreaterThanOrEqual(3);
    });

    it('should have bottom border on card headers', () => {
      const { container } = render(<RequestLaborPage />);
      // Find divs with both border-b and border-industrial-graphite-200
      const borderedHeaders = container.querySelectorAll(
        '.border-b.border-industrial-graphite-200'
      );
      expect(borderedHeaders.length).toBe(3);
    });
  });

  describe('Form Labels', () => {
    it('should use industrial label styling for required fields', () => {
      const { container } = render(<RequestLaborPage />);
      // Find the label element for projectName
      const projectLabel = container.querySelector('label[for="projectName"]');
      expect(projectLabel).toHaveClass('font-body');
      expect(projectLabel).toHaveClass('text-xs');
      expect(projectLabel).toHaveClass('uppercase');
      expect(projectLabel).toHaveClass('font-semibold');
      expect(projectLabel).toHaveClass('text-industrial-graphite-400');
      expect(projectLabel).toHaveClass('tracking-wide');
    });

    it('should use industrial orange for required asterisks', () => {
      render(<RequestLaborPage />);
      const requiredAsterisks = screen.getAllByText('*');
      requiredAsterisks.forEach((asterisk) => {
        expect(asterisk).toHaveClass('text-industrial-orange');
      });
    });

    it('should have all required field labels with industrial styling', () => {
      const { container } = render(<RequestLaborPage />);
      const labelIds = [
        'projectName',
        'location',
        'contactName',
        'contactEmail',
        'contactPhone',
        'duration',
        'startDate',
      ];

      labelIds.forEach((id) => {
        const label = container.querySelector(`label[for="${id}"]`);
        expect(label).toHaveClass('font-body');
        expect(label).toHaveClass('text-xs');
        expect(label).toHaveClass('uppercase');
      });
    });
  });

  describe('Alert/Info Box Styling', () => {
    it('should use industrial styling for info box', () => {
      const { container } = render(<RequestLaborPage />);
      // Find the how it works info box
      const infoBox = container.querySelector(
        '.bg-industrial-graphite-100.border-industrial-graphite-200'
      );
      expect(infoBox).toBeInTheDocument();
    });

    it('should have industrial orange icon in info box', () => {
      const { container } = render(<RequestLaborPage />);
      // Find the info box icon
      const infoBoxIcon = container.querySelector(
        '.bg-industrial-graphite-100 svg.text-industrial-orange'
      );
      expect(infoBoxIcon).toBeInTheDocument();
    });

    it('should have sharp corners on info box', () => {
      const { container } = render(<RequestLaborPage />);
      const infoBox = container.querySelector(
        '.bg-industrial-graphite-100.rounded-industrial-sharp'
      );
      expect(infoBox).toBeInTheDocument();
    });
  });

  describe('Form Section Validation', () => {
    it('should have Project Details section', () => {
      render(<RequestLaborPage />);
      expect(screen.getByText('Project Details')).toBeInTheDocument();
    });

    it('should have Location & Timing section', () => {
      render(<RequestLaborPage />);
      expect(screen.getByText('Location & Timing')).toBeInTheDocument();
    });

    it('should have Contact Information section', () => {
      render(<RequestLaborPage />);
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
    });
  });
});
