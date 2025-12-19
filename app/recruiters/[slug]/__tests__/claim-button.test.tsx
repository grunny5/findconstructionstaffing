/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import AgencyProfilePage from '../page';

// Mock Next.js components and navigation
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />;
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock auth context
jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    profile: null,
    signOut: jest.fn(),
    loading: false,
    isAdmin: false,
    isAgencyOwner: false,
  })),
}));

// Mock components
jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => <div>Header</div>,
}));

jest.mock('@/components/Footer', () => ({
  __esModule: true,
  default: () => <div>Footer</div>,
}));

describe('Agency Profile Page - Claim Button', () => {
  const mockFetch = jest.fn();
  const originalFetch = global.fetch;

  beforeAll(() => {
    global.fetch = mockFetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display "Claim This Agency" button for unclaimed agencies', async () => {
    const unclaimedAgency = {
      id: '1',
      name: 'Test Agency',
      slug: 'test-agency',
      description: 'Test description',
      logo_url: null,
      website: 'https://testagency.com',
      phone: '555-0100',
      email: 'contact@testagency.com',
      is_claimed: false,
      offers_per_diem: false,
      is_union: false,
      founded_year: 2020,
      employee_count: '10-50',
      headquarters: 'Test City, TX',
      rating: null,
      review_count: 0,
      project_count: 0,
      verified: false,
      featured: false,
      trades: [],
      regions: [],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: unclaimedAgency }),
    });

    const component = await AgencyProfilePage({
      params: { slug: 'test-agency' },
    });
    render(component);

    const claimButton = screen.getByText('Claim This Agency');
    expect(claimButton).toBeInTheDocument();

    const claimLink = claimButton.closest('a');
    expect(claimLink).toHaveAttribute('href', '/claim/test-agency');
  });

  it('should NOT display "Claim This Agency" button for claimed agencies', async () => {
    const claimedAgency = {
      id: '2',
      name: 'Claimed Agency',
      slug: 'claimed-agency',
      description: 'Test description',
      logo_url: null,
      website: 'https://claimedagency.com',
      phone: '555-0200',
      email: 'contact@claimedagency.com',
      is_claimed: true,
      offers_per_diem: false,
      is_union: false,
      founded_year: 2015,
      employee_count: '50-100',
      headquarters: 'Test City, CA',
      rating: 4.5,
      review_count: 10,
      project_count: 50,
      verified: true,
      featured: false,
      trades: [],
      regions: [],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: claimedAgency }),
    });

    const component = await AgencyProfilePage({
      params: { slug: 'claimed-agency' },
    });
    render(component);

    const claimButton = screen.queryByText('Claim This Agency');
    expect(claimButton).not.toBeInTheDocument();
  });

  it('should display "Claimed" badge for claimed agencies', async () => {
    const claimedAgency = {
      id: '3',
      name: 'Claimed Agency',
      slug: 'claimed-agency-2',
      description: 'Test description',
      logo_url: null,
      website: null,
      phone: null,
      email: null,
      is_claimed: true,
      offers_per_diem: null,
      is_union: null,
      founded_year: null,
      employee_count: null,
      headquarters: null,
      rating: null,
      review_count: 0,
      project_count: 0,
      verified: false,
      featured: false,
      trades: [],
      regions: [],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: claimedAgency }),
    });

    const component = await AgencyProfilePage({
      params: { slug: 'claimed-agency-2' },
    });
    render(component);

    expect(screen.getByText('Claimed')).toBeInTheDocument();
    expect(screen.queryByText('Claim This Agency')).not.toBeInTheDocument();
  });

  it('should show claim button with correct styling and icon', async () => {
    const unclaimedAgency = {
      id: '4',
      name: 'Unclaimed Agency',
      slug: 'unclaimed-agency',
      description: 'Test description',
      logo_url: null,
      website: null,
      phone: null,
      email: null,
      is_claimed: false,
      offers_per_diem: null,
      is_union: null,
      founded_year: null,
      employee_count: null,
      headquarters: null,
      rating: null,
      review_count: 0,
      project_count: 0,
      verified: false,
      featured: false,
      trades: [],
      regions: [],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: unclaimedAgency }),
    });

    const component = await AgencyProfilePage({
      params: { slug: 'unclaimed-agency' },
    });
    render(component);

    const claimButton = screen.getByText('Claim This Agency');
    expect(claimButton).toBeInTheDocument();

    // Check that the button has the Shield icon (rendered as SVG)
    const claimLink = claimButton.closest('a');
    expect(claimLink).toBeInTheDocument();
    const svg = claimLink?.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
