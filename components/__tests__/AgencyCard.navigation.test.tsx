/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AgencyCard from '../AgencyCard';
import { useRouter } from 'next/navigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, prefetch, ...props }: any) => {
    return <a href={href} data-prefetch={prefetch} {...props}>{children}</a>;
  };
});

const mockAgency = {
  id: '1',
  name: 'Elite Construction Staffing',
  slug: 'elite-construction-staffing',
  description: 'Premier construction staffing solutions',
  logo_url: 'https://example.com/logo.png',
  website: 'https://elitestaffing.com',
  phone: '555-0100',
  email: 'contact@elitestaffing.com',
  is_claimed: true,
  offers_per_diem: true,
  is_union: false,
  trades: ['Electrician', 'Plumber', 'Carpenter'],
  regions: ['Texas', 'California'],
  rating: 4.5,
  reviewCount: 25,
  projectCount: 150,
  founded_year: 2010,
  employee_count: '50-100',
  headquarters: 'Dallas, TX',
  verified: true,
  featured: true
};

describe('AgencyCard Navigation Tests', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    });
  });

  it('should have profile links with correct href', () => {
    render(<AgencyCard agency={mockAgency} />);

    // Check agency name link
    const nameLink = screen.getByRole('link', { name: /View Elite Construction Staffing profile/i });
    expect(nameLink).toHaveAttribute('href', '/recruiters/elite-construction-staffing');

    // Check View Profile button
    const profileButton = screen.getByRole('link', { name: /View Elite Construction Staffing full profile/i });
    expect(profileButton).toHaveAttribute('href', '/recruiters/elite-construction-staffing');
  });

  it('should use agency slug for profile URL', () => {
    const agencyWithDifferentSlug = {
      ...mockAgency,
      name: 'Test & Special Characters Agency!',
      slug: 'test-special-characters-agency'
    };

    render(<AgencyCard agency={agencyWithDifferentSlug} />);

    const links = screen.getAllByRole('link');
    const profileLinks = links.filter(link => 
      link.getAttribute('href')?.includes('/recruiters/')
    );

    profileLinks.forEach(link => {
      expect(link).toHaveAttribute('href', '/recruiters/test-special-characters-agency');
    });
  });

  it('should enable prefetch on profile links', () => {
    render(<AgencyCard agency={mockAgency} />);

    // Check that prefetch is enabled
    const nameLink = screen.getByRole('link', { name: /View Elite Construction Staffing profile/i });
    expect(nameLink).toHaveAttribute('data-prefetch', 'true');

    const profileButton = screen.getByRole('link', { name: /View Elite Construction Staffing full profile/i });
    expect(profileButton).toHaveAttribute('data-prefetch', 'true');
  });

  it('should have proper ARIA labels for accessibility', () => {
    render(<AgencyCard agency={mockAgency} />);

    // Name link should have descriptive ARIA label
    const nameLink = screen.getByRole('link', { name: /View Elite Construction Staffing profile/i });
    expect(nameLink).toHaveAttribute('aria-label', 'View Elite Construction Staffing profile');

    // Profile button should have descriptive ARIA label
    const profileButton = screen.getByRole('link', { name: /View Elite Construction Staffing full profile/i });
    expect(profileButton).toHaveAttribute('aria-label', 'View Elite Construction Staffing full profile');
  });

  it('should have Contact Now link with agency parameter', () => {
    render(<AgencyCard agency={mockAgency} />);

    const contactLink = screen.getByText('Contact Now').closest('a');
    expect(contactLink).toHaveAttribute('href', '/request-labor?agency=elite-construction-staffing');
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<AgencyCard agency={mockAgency} />);

    // Tab to agency name link
    await user.tab();
    const nameLink = screen.getByRole('link', { name: /View Elite Construction Staffing profile/i });
    expect(nameLink).toHaveFocus();

    // Tab to View Profile button
    await user.tab();
    const profileButton = screen.getByRole('link', { name: /View Elite Construction Staffing full profile/i });
    expect(profileButton).toHaveFocus();

    // Tab to Contact Now button
    await user.tab();
    const contactButton = screen.getByText('Contact Now').closest('a');
    expect(contactButton).toHaveFocus();
  });

  it('should work with agencies without slugs', () => {
    const agencyWithoutSlug = {
      ...mockAgency,
      slug: ''
    };

    render(<AgencyCard agency={agencyWithoutSlug} />);

    // Should still render but with empty slug
    const nameLink = screen.getByRole('link', { name: /View Elite Construction Staffing profile/i });
    expect(nameLink).toHaveAttribute('href', '/recruiters/');
  });

  it('should maintain navigation after hover states', async () => {
    const user = userEvent.setup();
    render(<AgencyCard agency={mockAgency} />);

    const profileButton = screen.getByRole('link', { name: /View Elite Construction Staffing full profile/i });
    
    // Hover and unhover
    await user.hover(profileButton);
    await user.unhover(profileButton);

    // Link should still be functional
    expect(profileButton).toHaveAttribute('href', '/recruiters/elite-construction-staffing');
  });
});