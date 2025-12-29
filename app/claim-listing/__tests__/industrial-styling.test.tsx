/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClaimListingPage from '../page';

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
  mockAgencies: [
    {
      name: 'Test Agency',
      regions: ['Texas'],
      trades: ['Electrician', 'Plumber'],
    },
  ],
}));

describe('ClaimListingPage Industrial Design Styling', () => {
  describe('Page Background', () => {
    it('should use industrial warm cream background', () => {
      const { container } = render(<ClaimListingPage />);
      const pageWrapper = container.querySelector('.min-h-screen');
      expect(pageWrapper).toHaveClass('bg-industrial-bg-primary');
    });
  });

  describe('Hero Section', () => {
    it('should use industrial graphite background', () => {
      const { container } = render(<ClaimListingPage />);
      const heroSection = container.querySelector('section');
      expect(heroSection).toHaveClass('bg-industrial-graphite-600');
    });

    it('should have orange accent border on hero', () => {
      const { container } = render(<ClaimListingPage />);
      const heroSection = container.querySelector('section');
      expect(heroSection).toHaveClass('border-b-4');
      expect(heroSection).toHaveClass('border-industrial-orange');
    });

    it('should use font-display for hero heading', () => {
      render(<ClaimListingPage />);
      const heading = screen.getByRole('heading', {
        name: /claim your agency listing/i,
      });
      expect(heading).toHaveClass('font-display');
      expect(heading).toHaveClass('uppercase');
    });

    it('should use font-body for hero description', () => {
      render(<ClaimListingPage />);
      const description = screen.getByText(
        /take control of your profile and start receiving qualified leads/i
      );
      expect(description).toHaveClass('font-body');
    });
  });

  describe('Card Styling', () => {
    it('should use industrial card styling for cards', () => {
      const { container } = render(<ClaimListingPage />);

      // Find cards with industrial styling
      const industrialCards = container.querySelectorAll(
        '.bg-industrial-bg-card.rounded-industrial-sharp.border-industrial-graphite-200'
      );
      // Should have at least 2 cards (search and claim form)
      expect(industrialCards.length).toBeGreaterThanOrEqual(2);
    });

    it('should have white background on cards', () => {
      const { container } = render(<ClaimListingPage />);

      const cards = container.querySelectorAll('.bg-industrial-bg-card');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should have sharp corners on cards', () => {
      const { container } = render(<ClaimListingPage />);

      const cards = container.querySelectorAll('.rounded-industrial-sharp');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Card Headers', () => {
    it('should use font-display uppercase for card titles', () => {
      const { container } = render(<ClaimListingPage />);
      // The h3 (CardTitle) should have industrial styling
      const cardTitles = container.querySelectorAll('h3');
      // There should be at least 2 card titles (Find Your Agency, Claim Request)
      expect(cardTitles.length).toBeGreaterThanOrEqual(2);
      // Check first card title has industrial styling
      expect(cardTitles[0]).toHaveClass('font-display');
      expect(cardTitles[0]).toHaveClass('uppercase');
      expect(cardTitles[0]).toHaveClass('text-industrial-graphite-600');
    });

    it('should use industrial orange for card icons', () => {
      const { container } = render(<ClaimListingPage />);
      // Find SVG icons with industrial orange color
      const orangeIcons = container.querySelectorAll(
        'svg.text-industrial-orange'
      );
      expect(orangeIcons.length).toBeGreaterThan(0);
    });

    it('should have bottom border on card headers', () => {
      const { container } = render(<ClaimListingPage />);
      // Find divs with both border-b and border-industrial-graphite-200
      const borderedHeaders = container.querySelectorAll(
        '.border-b.border-industrial-graphite-200'
      );
      expect(borderedHeaders.length).toBeGreaterThan(0);
    });
  });

  describe('Form Labels', () => {
    it('should use industrial label styling', () => {
      const { container } = render(<ClaimListingPage />);
      // Find the label element directly
      const searchLabel = container.querySelector('label[for="search"]');
      expect(searchLabel).toHaveClass('font-body');
      expect(searchLabel).toHaveClass('text-xs');
      expect(searchLabel).toHaveClass('uppercase');
      expect(searchLabel).toHaveClass('font-semibold');
      expect(searchLabel).toHaveClass('text-industrial-graphite-400');
      expect(searchLabel).toHaveClass('tracking-wide');
    });

    it('should use industrial orange for required asterisks', () => {
      render(<ClaimListingPage />);
      const requiredAsterisks = screen.getAllByText('*');
      requiredAsterisks.forEach((asterisk) => {
        expect(asterisk).toHaveClass('text-industrial-orange');
      });
    });
  });

  describe('Agency Selection Cards', () => {
    it('should use industrial styling for agency cards', async () => {
      const user = userEvent.setup();
      const { container } = render(<ClaimListingPage />);

      const searchInput = container.querySelector('input#search');
      expect(searchInput).toBeInTheDocument();
      await user.type(searchInput!, 'Test');

      // Find the card by looking for border-2 and rounded-industrial-sharp
      const agencyCard = container.querySelector(
        '.border-2.rounded-industrial-sharp'
      );
      expect(agencyCard).toBeInTheDocument();
    });

    it('should use orange border when agency is selected', async () => {
      const user = userEvent.setup();
      const { container } = render(<ClaimListingPage />);

      const searchInput = container.querySelector('input#search');
      expect(searchInput).toBeInTheDocument();
      await user.type(searchInput!, 'Test');

      // Find the clickable card
      const agencyCard = container.querySelector('.cursor-pointer.border-2');
      expect(agencyCard).toBeInTheDocument();
      await user.click(agencyCard!);

      // After clicking, verify styling changed - check for the orange styling
      expect(agencyCard).toHaveClass('border-industrial-orange');
      expect(agencyCard).toHaveClass('bg-industrial-orange-100');
    });

    it('should use font-display for agency names in results', async () => {
      const user = userEvent.setup();
      const { container } = render(<ClaimListingPage />);

      const searchInput = container.querySelector('input#search');
      expect(searchInput).toBeInTheDocument();
      await user.type(searchInput!, 'Test');

      // The h4 element should have font-display
      const agencyName = screen.getByRole('heading', { level: 4 });
      expect(agencyName).toHaveClass('font-display');
      expect(agencyName).toHaveClass('uppercase');
    });
  });

  describe('Alert Styling', () => {
    it('should use industrial styling for info alert', () => {
      const { container } = render(<ClaimListingPage />);
      // Find alert by role or the surrounding div structure
      const alertElements = container.querySelectorAll('[role="alert"]');
      // First alert should have industrial styling
      const firstAlert = alertElements[0]?.closest(
        'div.border-industrial-graphite-200'
      );
      expect(firstAlert).toBeInTheDocument();
    });

    it('should use industrial styling for verification notice', () => {
      const { container } = render(<ClaimListingPage />);
      // Find the verification alert by its classes
      const verificationAlert = container.querySelector(
        '.bg-industrial-graphite-100.border-industrial-graphite-200'
      );
      expect(verificationAlert).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should use industrial graphite for empty state text', () => {
      render(<ClaimListingPage />);
      const emptyStateText = screen.getByText(
        /start typing to search for your agency/i
      );
      expect(emptyStateText).toHaveClass('font-body');
    });

    it('should use industrial graphite for empty state icons', () => {
      const { container } = render(<ClaimListingPage />);
      const emptyStateIcon = container.querySelector(
        '.text-industrial-graphite-300'
      );
      expect(emptyStateIcon).toBeInTheDocument();
    });
  });
});
