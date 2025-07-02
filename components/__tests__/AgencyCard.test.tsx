import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AgencyCard from '../AgencyCard';
import { Agency } from '@/types/api';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
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
    address: '123 Main St',
    city: 'Austin',
    state: 'TX',
    zip_code: '78701',
    trades: [
      { id: 1, name: 'Electrician' },
      { id: 2, name: 'Plumber' },
    ],
    regions: [
      { id: 1, name: 'TX', type: 'state' },
      { id: 2, name: 'CA', type: 'state' },
    ],
    specialties: [],
    certifications: [],
    rating: 4.5,
    reviews_count: 25,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  it('should render agency information', () => {
    render(<AgencyCard agency={mockAgency} />);

    expect(screen.getByText('Test Agency')).toBeInTheDocument();
    expect(screen.getByText('A test staffing agency')).toBeInTheDocument();
  });

  it('should render agency location', () => {
    render(<AgencyCard agency={mockAgency} />);

    expect(screen.getByText('Austin, TX')).toBeInTheDocument();
  });

  it('should render agency trades', () => {
    render(<AgencyCard agency={mockAgency} />);

    expect(screen.getByText('Electrician')).toBeInTheDocument();
    expect(screen.getByText('Plumber')).toBeInTheDocument();
  });

  it('should render agency regions', () => {
    render(<AgencyCard agency={mockAgency} />);

    expect(screen.getByText('TX')).toBeInTheDocument();
    expect(screen.getByText('CA')).toBeInTheDocument();
  });

  it('should render rating if available', () => {
    render(<AgencyCard agency={mockAgency} />);

    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(25 reviews)')).toBeInTheDocument();
  });

  it('should not render rating if not available', () => {
    const agencyWithoutRating = { ...mockAgency, rating: null, reviews_count: 0 };
    render(<AgencyCard agency={agencyWithoutRating} />);

    expect(screen.queryByText('4.5')).not.toBeInTheDocument();
    expect(screen.queryByText('reviews')).not.toBeInTheDocument();
  });

  it('should render phone number', () => {
    render(<AgencyCard agency={mockAgency} />);

    expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
  });

  it('should render email', () => {
    render(<AgencyCard agency={mockAgency} />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should link to agency profile', () => {
    render(<AgencyCard agency={mockAgency} />);

    const profileLink = screen.getByRole('link', { name: /view profile/i });
    expect(profileLink).toHaveAttribute('href', '/recruiters/test-agency');
  });

  it('should have proper card structure', () => {
    const { container } = render(<AgencyCard agency={mockAgency} />);

    const card = container.querySelector('.rounded-lg.border');
    expect(card).toBeInTheDocument();
  });

  it('should limit displayed trades', () => {
    const agencyWithManyTrades = {
      ...mockAgency,
      trades: [
        { id: 1, name: 'Electrician' },
        { id: 2, name: 'Plumber' },
        { id: 3, name: 'Carpenter' },
        { id: 4, name: 'Welder' },
        { id: 5, name: 'Mason' },
      ],
    };
    
    render(<AgencyCard agency={agencyWithManyTrades} />);

    // Should show first 3 trades
    expect(screen.getByText('Electrician')).toBeInTheDocument();
    expect(screen.getByText('Plumber')).toBeInTheDocument();
    expect(screen.getByText('Carpenter')).toBeInTheDocument();
    
    // Should show +2 more indicator
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('should render logo if available', () => {
    render(<AgencyCard agency={mockAgency} />);

    const logo = screen.getByAltText('Test Agency logo');
    expect(logo).toBeInTheDocument();
  });

  it('should render initials placeholder when no logo', () => {
    const agencyWithoutLogo = { ...mockAgency, logo_url: null };
    render(<AgencyCard agency={agencyWithoutLogo} />);

    // Should not render the logo image
    expect(screen.queryByAltText('Test Agency logo')).not.toBeInTheDocument();
    
    // Should render initials (first letters of agency name)
    // "Test Agency" should show "TA"
    expect(screen.getByText('TA')).toBeInTheDocument();
  });

  it('should handle logo loading errors gracefully', () => {
    render(<AgencyCard agency={mockAgency} />);

    const logo = screen.getByAltText('Test Agency logo');
    
    // Simulate image load error
    fireEvent.error(logo);
    
    // After error, should show initials instead
    expect(screen.getByText('TA')).toBeInTheDocument();
  });
});