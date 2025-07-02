import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AgencyCard from '../AgencyCard';
import { Agency } from '@/types/api';

// Helper to convert Agency type to AgencyCard props
function toAgencyCardProps(
  agency: Agency
): Parameters<typeof AgencyCard>[0]['agency'] {
  return {
    id: agency.id,
    name: agency.name,
    slug: agency.slug,
    description: agency.description ?? undefined,
    logo_url: agency.logo_url ?? undefined,
    website: agency.website ?? undefined,
    phone: agency.phone ?? undefined,
    email: agency.email ?? undefined,
    is_claimed: agency.is_claimed,
    offers_per_diem: agency.offers_per_diem,
    is_union: agency.is_union,
    trades: agency.trades.map((t) => t.name),
    regions: agency.regions.map((r) => r.code),
    rating: agency.rating ?? undefined,
    reviewCount: agency.review_count,
    projectCount: agency.project_count,
    founded_year: agency.founded_year ?? undefined,
    employee_count: agency.employee_count ?? undefined,
    headquarters: agency.headquarters ?? undefined,
    verified: agency.verified,
    featured: agency.featured,
  };
}

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('AgencyCard', () => {
  const mockAgency: Agency = {
    id: '1',
    name: 'Test Agency',
    slug: 'test-agency',
    description: 'A test staffing agency',
    logo_url: 'https://example.com/logo.png',
    website: 'https://example.com',
    phone: '(555) 123-4567',
    email: 'test@example.com',
    is_claimed: true,
    offers_per_diem: true,
    is_union: false,
    founded_year: 2020,
    employee_count: '10-50',
    headquarters: 'Austin, TX',
    rating: 4.5,
    review_count: 25,
    project_count: 100,
    verified: true,
    featured: false,
    trades: [
      { id: '1', name: 'Electrician', slug: 'electrician' },
      { id: '2', name: 'Plumber', slug: 'plumber' },
    ],
    regions: [
      { id: '1', name: 'Texas', code: 'TX' },
      { id: '2', name: 'California', code: 'CA' },
    ],
  };

  it('should render agency information', () => {
    render(<AgencyCard agency={toAgencyCardProps(mockAgency)} />);

    expect(screen.getByText('Test Agency')).toBeInTheDocument();
    expect(screen.getByText('A test staffing agency')).toBeInTheDocument();
  });

  it('should render agency headquarters', () => {
    render(<AgencyCard agency={toAgencyCardProps(mockAgency)} />);

    expect(screen.getByText('Austin, TX')).toBeInTheDocument();
  });

  it('should render agency trades', () => {
    render(<AgencyCard agency={toAgencyCardProps(mockAgency)} />);

    expect(screen.getByText('Electrician')).toBeInTheDocument();
    expect(screen.getByText('Plumber')).toBeInTheDocument();
  });

  it('should render agency regions', () => {
    render(<AgencyCard agency={toAgencyCardProps(mockAgency)} />);

    expect(screen.getByText('TX')).toBeInTheDocument();
    expect(screen.getByText('CA')).toBeInTheDocument();
  });

  it('should render rating if available', () => {
    render(<AgencyCard agency={toAgencyCardProps(mockAgency)} />);

    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(25 reviews)')).toBeInTheDocument();
  });

  it('should not render rating if not available', () => {
    const agencyWithoutRating = {
      ...mockAgency,
      rating: null,
      review_count: 0,
    };
    render(<AgencyCard agency={toAgencyCardProps(agencyWithoutRating)} />);

    expect(screen.queryByText('4.5')).not.toBeInTheDocument();
    expect(screen.queryByText('reviews')).not.toBeInTheDocument();
  });

  it('should render phone number', () => {
    render(<AgencyCard agency={toAgencyCardProps(mockAgency)} />);

    expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
  });

  it('should render email', () => {
    render(<AgencyCard agency={toAgencyCardProps(mockAgency)} />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should link to agency profile', () => {
    render(<AgencyCard agency={toAgencyCardProps(mockAgency)} />);

    const profileLink = screen.getByRole('link', { name: /view profile/i });
    expect(profileLink).toHaveAttribute('href', '/recruiters/test-agency');
  });

  it('should have proper card structure', () => {
    const { container } = render(
      <AgencyCard agency={toAgencyCardProps(mockAgency)} />
    );

    const card = container.querySelector('.rounded-lg.border');
    expect(card).toBeInTheDocument();
  });

  it('should limit displayed trades', () => {
    const agencyWithManyTrades = {
      ...mockAgency,
      trades: [
        { id: '1', name: 'Electrician', slug: 'electrician' },
        { id: '2', name: 'Plumber', slug: 'plumber' },
        { id: '3', name: 'Carpenter', slug: 'carpenter' },
        { id: '4', name: 'Welder', slug: 'welder' },
        { id: '5', name: 'Mason', slug: 'mason' },
      ],
    };

    render(<AgencyCard agency={toAgencyCardProps(agencyWithManyTrades)} />);

    // Should show first 3 trades
    expect(screen.getByText('Electrician')).toBeInTheDocument();
    expect(screen.getByText('Plumber')).toBeInTheDocument();
    expect(screen.getByText('Carpenter')).toBeInTheDocument();

    // Should show +2 more indicator
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('should render logo if available', () => {
    render(<AgencyCard agency={toAgencyCardProps(mockAgency)} />);

    const logo = screen.getByAltText('Test Agency logo');
    expect(logo).toBeInTheDocument();
  });

  it('should render initials placeholder when no logo', () => {
    const agencyWithoutLogo = { ...mockAgency, logo_url: null };
    render(<AgencyCard agency={toAgencyCardProps(agencyWithoutLogo)} />);

    // Should not render the logo image
    expect(screen.queryByAltText('Test Agency logo')).not.toBeInTheDocument();

    // Should render initials (first letters of agency name)
    // "Test Agency" should show "TA"
    expect(screen.getByText('TA')).toBeInTheDocument();
  });

  it('should handle logo loading errors gracefully', () => {
    render(<AgencyCard agency={toAgencyCardProps(mockAgency)} />);

    const logo = screen.getByAltText('Test Agency logo');

    // Simulate image load error
    fireEvent.error(logo);

    // After error, should show initials instead
    expect(screen.getByText('TA')).toBeInTheDocument();
  });
});
