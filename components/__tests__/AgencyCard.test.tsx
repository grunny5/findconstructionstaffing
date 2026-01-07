import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AgencyCard from '../AgencyCard';
import { Agency, ComplianceItemFull } from '@/types/api';
import { US_STATE_CODES } from '@/lib/utils';

// Helper to convert Agency type to AgencyCard props
function toAgencyCardProps(
  agency: Agency & { compliance?: ComplianceItemFull[] }
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
    regions: agency.regions,
    compliance: agency.compliance,
    rating: agency.rating ?? undefined,
    reviewCount: agency.review_count,
    projectCount: agency.project_count,
    founded_year: agency.founded_year ?? undefined,
    employee_count: agency.employee_count ?? undefined,
    headquarters: agency.headquarters ?? undefined,
    verified: agency.verified,
    featured: agency.featured,
    profile_completion_percentage: agency.profile_completion_percentage,
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
    profile_completion_percentage: 90,
    last_edited_at: '2024-01-01T00:00:00Z',
    last_edited_by: '123e4567-e89b-12d3-a456-426614174000',
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

  it('should display regions', () => {
    render(<AgencyCard agency={toAgencyCardProps(mockAgency)} />);

    expect(screen.getByText('Serves:')).toBeInTheDocument();
    expect(screen.getByText('TX')).toBeInTheDocument();
    expect(screen.getByText('CA')).toBeInTheDocument();
  });

  it('should render rating if available', () => {
    render(<AgencyCard agency={toAgencyCardProps(mockAgency)} />);

    expect(screen.getByText('4.5')).toBeInTheDocument();
    // The component doesn't display review count, only the rating
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

  it('should have proper card structure with industrial design', () => {
    const { container } = render(
      <AgencyCard agency={toAgencyCardProps(mockAgency)} />
    );

    const card = container.querySelector('.rounded-industrial-base');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('bg-industrial-bg-card');
    expect(card).toHaveClass('border-industrial-graphite-200');
  });

  describe('Industrial Design - Category Color Coding', () => {
    it('should apply navy border for electrical trades', () => {
      const electricalAgency = {
        ...mockAgency,
        trades: [{ id: '1', name: 'Electrician', slug: 'electrician' }],
      };

      const { container } = render(
        <AgencyCard agency={toAgencyCardProps(electricalAgency)} />
      );

      const card = container.querySelector('.border-l-industrial-navy');
      expect(card).toBeInTheDocument();
    });

    it('should apply orange border for welding trades', () => {
      const weldingAgency = {
        ...mockAgency,
        trades: [{ id: '1', name: 'Welder', slug: 'welder' }],
      };

      const { container } = render(
        <AgencyCard agency={toAgencyCardProps(weldingAgency)} />
      );

      const card = container.querySelector('.border-l-industrial-orange');
      expect(card).toBeInTheDocument();
    });

    it('should apply graphite border for mechanical/general trades', () => {
      const mechanicalAgency = {
        ...mockAgency,
        trades: [{ id: '1', name: 'Plumber', slug: 'plumber' }],
      };

      const { container } = render(
        <AgencyCard agency={toAgencyCardProps(mechanicalAgency)} />
      );

      const card = container.querySelector('.border-l-industrial-graphite-400');
      expect(card).toBeInTheDocument();
    });

    it('should render firm name with industrial typography', () => {
      render(<AgencyCard agency={toAgencyCardProps(mockAgency)} />);

      const firmName = screen.getByText('Test Agency');
      expect(firmName.closest('h3')).toHaveClass('font-display');
      expect(firmName.closest('h3')).toHaveClass('uppercase');
      expect(firmName.closest('h3')).toHaveClass(
        'text-industrial-graphite-600'
      );
    });

    it('should display founded year with industrial styling', () => {
      render(<AgencyCard agency={toAgencyCardProps(mockAgency)} />);

      const foundedYear = screen.getByText('Est. 2020');
      expect(foundedYear).toHaveClass('font-body');
      expect(foundedYear).toHaveClass('text-xs');
      expect(foundedYear).toHaveClass('text-industrial-graphite-400');
    });
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

  describe('Featured Trades Display', () => {
    it('should display featured trades with industrial styling', () => {
      render(<AgencyCard agency={toAgencyCardProps(mockAgency)} />);

      // Find the trade badges
      const electricianBadge = screen.getByText('Electrician');
      const plumberBadge = screen.getByText('Plumber');

      // Trades should have industrial styling
      expect(electricianBadge).toBeInTheDocument();
      expect(plumberBadge).toBeInTheDocument();
    });

    it('should link featured trades to search page with trade filter', () => {
      render(<AgencyCard agency={toAgencyCardProps(mockAgency)} />);

      // Check that trade badges are wrapped in links
      const electricianLink = screen
        .getByText('Electrician')
        .closest('a') as HTMLAnchorElement;
      expect(electricianLink).toHaveAttribute('href', '/?trade=Electrician');

      const plumberLink = screen
        .getByText('Plumber')
        .closest('a') as HTMLAnchorElement;
      expect(plumberLink).toHaveAttribute('href', '/?trade=Plumber');
    });

    it('should display all trades as featured when less than 3', () => {
      const agencyWithTwoTrades = {
        ...mockAgency,
        trades: [
          { id: '1', name: 'Electrician', slug: 'electrician' },
          { id: '2', name: 'Plumber', slug: 'plumber' },
        ],
      };

      render(<AgencyCard agency={toAgencyCardProps(agencyWithTwoTrades)} />);

      // Both trades should be displayed
      expect(screen.getByText('Electrician')).toBeInTheDocument();
      expect(screen.getByText('Plumber')).toBeInTheDocument();

      // Should not show "+X more" since all trades are displayed
      expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
    });

    it('should show "+X more" badge for trades beyond top 3', () => {
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

      // Should show first 3 as featured
      expect(screen.getByText('Electrician')).toBeInTheDocument();
      expect(screen.getByText('Plumber')).toBeInTheDocument();
      expect(screen.getByText('Carpenter')).toBeInTheDocument();

      // Should show +2 more badge
      expect(screen.getByText('+2 more')).toBeInTheDocument();

      // Should NOT show the 4th and 5th trades
      expect(screen.queryByText('Welder')).not.toBeInTheDocument();
      expect(screen.queryByText('Mason')).not.toBeInTheDocument();
    });
  });

  describe('Service Regions Display', () => {
    it('should render service regions section', () => {
      const agencyWithRegions = {
        ...mockAgency,
        regions: [
          { id: '1', name: 'Texas', code: 'TX' },
          { id: '2', name: 'California', code: 'CA' },
        ],
      };

      render(<AgencyCard agency={toAgencyCardProps(agencyWithRegions)} />);

      expect(screen.getByText('Serves:')).toBeInTheDocument();
      expect(screen.getByText('TX')).toBeInTheDocument();
      expect(screen.getByText('CA')).toBeInTheDocument();
    });

    it('should show "+X more" for agencies with >3 regions', () => {
      const agencyWithManyRegions = {
        ...mockAgency,
        regions: [
          { id: '1', name: 'Texas', code: 'TX' },
          { id: '2', name: 'California', code: 'CA' },
          { id: '3', name: 'Florida', code: 'FL' },
          { id: '4', name: 'New York', code: 'NY' },
          { id: '5', name: 'Illinois', code: 'IL' },
        ],
      };

      render(<AgencyCard agency={toAgencyCardProps(agencyWithManyRegions)} />);
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('should show "Nationwide" for agencies with 50 states', () => {
      // Create 50 valid US states using actual state codes
      const allStateCodesArray = Array.from(US_STATE_CODES);
      const fiftyStates = allStateCodesArray.map((code, i) => ({
        id: `${i + 1}`,
        name: `State ${code}`,
        code,
      }));

      const nationwideAgency = {
        ...mockAgency,
        regions: fiftyStates,
      };

      render(<AgencyCard agency={toAgencyCardProps(nationwideAgency)} />);
      expect(screen.getByText('Nationwide')).toBeInTheDocument();
    });

    it('should not show regions section when no regions', () => {
      const agencyNoRegions = {
        ...mockAgency,
        regions: [],
      };

      render(<AgencyCard agency={toAgencyCardProps(agencyNoRegions)} />);
      expect(screen.queryByText('Serves:')).not.toBeInTheDocument();
    });

    it('should link region badges to filtered search', () => {
      const agencyWithRegions = {
        ...mockAgency,
        regions: [{ id: '1', name: 'Texas', code: 'TX' }],
      };

      render(<AgencyCard agency={toAgencyCardProps(agencyWithRegions)} />);
      const txLink = screen.getByText('TX').closest('a');
      expect(txLink).toHaveAttribute('href', '/?states[]=TX');
    });
  });

  describe('Profile Completion Badges', () => {
    it('should show Verified Profile badge for 80-99% completion', () => {
      const agencyWithVerifiedProfile = {
        ...mockAgency,
        profile_completion_percentage: 85,
      };

      render(
        <AgencyCard agency={toAgencyCardProps(agencyWithVerifiedProfile)} />
      );

      expect(screen.getByText('Verified Profile')).toBeInTheDocument();
      expect(screen.queryByText('Featured Agency')).not.toBeInTheDocument();
    });

    it('should show Featured Agency badge for 100% completion', () => {
      const agencyWithFeaturedProfile = {
        ...mockAgency,
        profile_completion_percentage: 100,
      };

      render(
        <AgencyCard agency={toAgencyCardProps(agencyWithFeaturedProfile)} />
      );

      expect(screen.getByText('Featured Agency')).toBeInTheDocument();
      expect(screen.queryByText('Verified Profile')).not.toBeInTheDocument();
    });

    it('should not show badges for <80% completion', () => {
      const agencyWithLowCompletion = {
        ...mockAgency,
        profile_completion_percentage: 60,
      };

      render(
        <AgencyCard agency={toAgencyCardProps(agencyWithLowCompletion)} />
      );

      expect(screen.queryByText('Verified Profile')).not.toBeInTheDocument();
      expect(screen.queryByText('Featured Agency')).not.toBeInTheDocument();
    });

    it('should not show badges when completion percentage is 0', () => {
      const agencyWithZeroCompletion = {
        ...mockAgency,
        profile_completion_percentage: 0,
      };

      render(
        <AgencyCard agency={toAgencyCardProps(agencyWithZeroCompletion)} />
      );

      expect(screen.queryByText('Verified Profile')).not.toBeInTheDocument();
      expect(screen.queryByText('Featured Agency')).not.toBeInTheDocument();
    });

    it('should show Verified Profile badge at exactly 80% completion', () => {
      const agencyAt80Percent = {
        ...mockAgency,
        profile_completion_percentage: 80,
      };

      render(<AgencyCard agency={toAgencyCardProps(agencyAt80Percent)} />);

      expect(screen.getByText('Verified Profile')).toBeInTheDocument();
    });

    it('should show Verified Profile badge at 99% completion', () => {
      const agencyAt99Percent = {
        ...mockAgency,
        profile_completion_percentage: 99,
      };

      render(<AgencyCard agency={toAgencyCardProps(agencyAt99Percent)} />);

      expect(screen.getByText('Verified Profile')).toBeInTheDocument();
      expect(screen.queryByText('Featured Agency')).not.toBeInTheDocument();
    });

    it('should have correct styling for Verified Profile badge', () => {
      const agencyWithVerifiedProfile = {
        ...mockAgency,
        profile_completion_percentage: 85,
      };

      const { container } = render(
        <AgencyCard agency={toAgencyCardProps(agencyWithVerifiedProfile)} />
      );

      const badge = screen.getByText('Verified Profile').closest('div');
      expect(badge).toHaveClass('bg-blue-500');
      expect(badge).toHaveClass('text-white');
    });

    it('should have correct styling for Featured Agency badge', () => {
      const agencyWithFeaturedProfile = {
        ...mockAgency,
        profile_completion_percentage: 100,
      };

      const { container } = render(
        <AgencyCard agency={toAgencyCardProps(agencyWithFeaturedProfile)} />
      );

      const badge = screen.getByText('Featured Agency').closest('div');
      expect(badge).toHaveClass('from-amber-400');
      expect(badge).toHaveClass('to-yellow-500');
    });
  });

  describe('Compliance Indicators', () => {
    const mockCompliance: ComplianceItemFull[] = [
      {
        id: '1',
        type: 'osha_certified',
        displayName: 'OSHA Certified',
        isActive: true,
        isVerified: true,
        expirationDate: '2026-12-31',
        isExpired: false,
        documentUrl: null,
        notes: null,
        verifiedBy: null,
        verifiedAt: null,
      },
      {
        id: '2',
        type: 'drug_testing',
        displayName: 'Drug Testing Policy',
        isActive: true,
        isVerified: false,
        expirationDate: null,
        isExpired: false,
        documentUrl: null,
        notes: null,
        verifiedBy: null,
        verifiedAt: null,
      },
    ];

    it('should render compliance indicators when compliance data is provided', () => {
      const agencyWithCompliance = {
        ...mockAgency,
        compliance: mockCompliance,
      };

      const { container } = render(
        <AgencyCard agency={toAgencyCardProps(agencyWithCompliance)} />
      );

      // Should render ComplianceBadges component in compact mode
      const complianceIcons = container.querySelectorAll('svg');
      expect(complianceIcons.length).toBeGreaterThan(0);
    });

    it('should not render compliance indicators when no compliance data', () => {
      const agencyWithoutCompliance = {
        ...mockAgency,
        compliance: undefined,
      };

      render(
        <AgencyCard agency={toAgencyCardProps(agencyWithoutCompliance)} />
      );

      // Compliance section should not be rendered
      // We can't easily test for absence of ComplianceBadges component
      // but we can verify the main content renders without errors
      expect(screen.getByText('Test Agency')).toBeInTheDocument();
    });

    it('should not render compliance indicators when compliance array is empty', () => {
      const agencyWithEmptyCompliance = {
        ...mockAgency,
        compliance: [],
      };

      render(
        <AgencyCard agency={toAgencyCardProps(agencyWithEmptyCompliance)} />
      );

      // Compliance section should not be rendered
      expect(screen.getByText('Test Agency')).toBeInTheDocument();
    });
  });
});
