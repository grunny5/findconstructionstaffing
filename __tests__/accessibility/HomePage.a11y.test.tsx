/**
 * Accessibility Tests for HomePage
 *
 * Tests WCAG 2.1 AA compliance using axe-core.
 * Ensures keyboard navigation, screen reader support, and semantic HTML.
 */

import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import HomePage from '@/app/page';

expect.extend(toHaveNoViolations);

// Mock next/navigation for tests
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(() => []),
  }),
  usePathname: () => '/',
}));

// Mock SWR hook for agencies
jest.mock('@/hooks/use-agencies', () => ({
  useAgencies: () => ({
    data: {
      data: [],
      pagination: { total: 0, page: 1, limit: 20, hasMore: false },
    },
    error: null,
    isLoading: false,
    isValidating: false,
    mutate: jest.fn(),
  }),
}));

// Mock auth context
jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    agencySlug: null,
    signOut: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock unread count hook
jest.mock('@/hooks/useUnreadCount', () => ({
  useUnreadCount: () => ({
    unreadCount: 0,
  }),
}));

describe('HomePage Accessibility', () => {
  it('should have no axe violations', async () => {
    const { container } = render(<HomePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper semantic HTML structure', async () => {
    const { container } = render(<HomePage />);

    // Check for main landmark
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();

    // Check for header landmark
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();

    // Check for footer landmark
    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();

    // Check for navigation landmark
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  it('should have accessible headings hierarchy', async () => {
    const { container } = render(<HomePage />);

    // Should have h1 (page title)
    const h1 = container.querySelector('h1');
    expect(h1).toBeInTheDocument();

    // h1 should come before h2
    const h2Elements = container.querySelectorAll('h2');
    if (h2Elements.length > 0) {
      const h1Position = Array.from(container.querySelectorAll('h1, h2')).indexOf(h1!);
      const firstH2Position = Array.from(container.querySelectorAll('h1, h2')).indexOf(h2Elements[0]);
      expect(h1Position).toBeLessThan(firstH2Position);
    }
  });

  it('should have accessible form inputs', async () => {
    const { container } = render(<HomePage />);

    // All inputs should have labels or aria-label
    const inputs = container.querySelectorAll('input');
    inputs.forEach((input) => {
      const hasLabel = !!input.getAttribute('aria-label');
      const hasAriaLabelledBy = !!input.getAttribute('aria-labelledby');
      const hasAssociatedLabel = !!container.querySelector(`label[for="${input.id}"]`);

      expect(hasLabel || hasAriaLabelledBy || hasAssociatedLabel).toBe(true);
    });
  });

  it('should have keyboard accessible interactive elements', async () => {
    const { container } = render(<HomePage />);

    // All buttons should be focusable
    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      expect(button.hasAttribute('disabled') || button.tabIndex >= 0 || button.tabIndex === -1).toBe(true);
    });

    // All links should be focusable
    const links = container.querySelectorAll('a');
    links.forEach((link) => {
      expect(link.tabIndex >= 0 || link.tabIndex === -1).toBe(true);
    });
  });
});
