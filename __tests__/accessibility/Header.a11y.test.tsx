/**
 * Accessibility Tests for Header Component
 *
 * Tests navigation accessibility, keyboard support, and ARIA attributes.
 */

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Header from '@/components/Header';

expect.extend(toHaveNoViolations);

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Mock auth context
jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    agencySlug: null,
    signOut: jest.fn(),
  }),
}));

// Mock unread count hook
jest.mock('@/hooks/useUnreadCount', () => ({
  useUnreadCount: () => ({
    unreadCount: 0,
  }),
}));

describe('Header Accessibility', () => {
  it('should have no axe violations', async () => {
    const { container } = render(<Header />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have semantic header landmark', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
  });

  it('should have accessible navigation with aria-label', () => {
    const { container } = render(<Header />);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAttribute('aria-label');
  });

  it('should have accessible logo link', () => {
    render(<Header />);
    const logoLink = screen.getByRole('link', { name: /find construction staffing/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('should have keyboard accessible navigation links', () => {
    render(<Header />);

    // Check for main navigation links
    const browseLink = screen.getByRole('link', { name: /browse directory/i });
    const requestLink = screen.getByRole('link', { name: /request labor/i });
    const resourcesLink = screen.getByRole('link', { name: /resources/i });

    [browseLink, requestLink, resourcesLink].forEach((link) => {
      expect(link).toBeInTheDocument();
      expect(link.tabIndex).toBeGreaterThanOrEqual(0);
    });
  });

  it('should have accessible theme toggle button', () => {
    render(<Header />);

    // Theme toggle should be accessible
    const buttons = screen.getAllByRole('button');
    const themeToggle = buttons.find(btn =>
      btn.getAttribute('aria-label')?.includes('mode') ||
      btn.textContent?.includes('Toggle theme')
    );

    expect(themeToggle).toBeDefined();
  });

  it('should have accessible mobile menu', () => {
    const { container } = render(<Header />);

    // Mobile menu button should be accessible
    const menuButton = container.querySelector('[aria-label*="menu" i], [aria-label*="navigation" i]');
    if (menuButton) {
      expect(menuButton).toBeInTheDocument();
    }
  });
});
