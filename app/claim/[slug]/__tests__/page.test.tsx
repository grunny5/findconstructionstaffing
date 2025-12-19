/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { redirect, notFound } from 'next/navigation';
import ClaimAgencyPage from '../page';

// Mock Next.js components and navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  notFound: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />;
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
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

describe('Claim Agency Page', () => {
  const mockCreateClient = require('@/lib/supabase/server').createClient;
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

  it('should redirect to login if user is not authenticated', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });

    await ClaimAgencyPage({ params: { slug: 'test-agency' } });

    expect(redirect).toHaveBeenCalledWith(
      '/login?redirectTo=/claim/test-agency'
    );
  });

  it('should redirect to login if auth error occurs', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Auth error' },
        }),
      },
    });

    await ClaimAgencyPage({ params: { slug: 'test-agency' } });

    expect(redirect).toHaveBeenCalledWith(
      '/login?redirectTo=/claim/test-agency'
    );
  });

  it('should call notFound if agency does not exist', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    });

    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    await ClaimAgencyPage({ params: { slug: 'non-existent' } });

    expect(notFound).toHaveBeenCalled();
  });

  it('should display "Already Claimed" alert for claimed agencies', async () => {
    const claimedAgency = {
      id: '1',
      name: 'Claimed Agency',
      slug: 'claimed-agency',
      description: 'Test description',
      logo_url: null,
      website: 'https://claimedagency.com',
      phone: null,
      email: null,
      is_claimed: true,
      offers_per_diem: null,
      is_union: null,
      founded_year: null,
      employee_count: null,
      headquarters: 'Test City, TX',
      rating: null,
      review_count: 0,
      project_count: 0,
      verified: false,
      featured: false,
      trades: [],
      regions: [],
    };

    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: claimedAgency }),
    });

    const component = await ClaimAgencyPage({
      params: { slug: 'claimed-agency' },
    });
    render(component as React.ReactElement);

    expect(screen.getByText('Agency Already Claimed')).toBeInTheDocument();
    expect(
      screen.getByText(/This agency profile has already been claimed/)
    ).toBeInTheDocument();
    expect(screen.getByText('View Agency Profile')).toBeInTheDocument();
  });

  it('should display claim form placeholder for unclaimed agencies', async () => {
    const unclaimedAgency = {
      id: '2',
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
      headquarters: 'Test City, CA',
      rating: null,
      review_count: 0,
      project_count: 0,
      verified: false,
      featured: false,
      trades: [],
      regions: [],
    };

    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: unclaimedAgency }),
    });

    const component = await ClaimAgencyPage({
      params: { slug: 'unclaimed-agency' },
    });
    render(component as React.ReactElement);

    expect(screen.getByText('Claim Request Form')).toBeInTheDocument();
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    expect(
      screen.getByText(/The claim request form will be available/)
    ).toBeInTheDocument();
  });

  it('should display agency information correctly', async () => {
    const agency = {
      id: '3',
      name: 'Test Agency Inc.',
      slug: 'test-agency-inc',
      description: 'Professional staffing',
      logo_url: 'https://example.com/logo.png',
      website: 'https://testagency.com',
      phone: '555-0100',
      email: 'contact@testagency.com',
      is_claimed: false,
      offers_per_diem: false,
      is_union: false,
      founded_year: 2020,
      employee_count: '10-50',
      headquarters: 'Dallas, TX',
      rating: null,
      review_count: 0,
      project_count: 0,
      verified: false,
      featured: false,
      trades: [],
      regions: [],
    };

    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: agency }),
    });

    const component = await ClaimAgencyPage({
      params: { slug: 'test-agency-inc' },
    });
    render(component as React.ReactElement);

    expect(screen.getByText('Test Agency Inc.')).toBeInTheDocument();
    expect(screen.getByText('Dallas, TX')).toBeInTheDocument();
    expect(screen.getByText("Agency You're Claiming")).toBeInTheDocument();
  });

  it('should display page title and description', async () => {
    const agency = {
      id: '4',
      name: 'Test Agency',
      slug: 'test-agency',
      description: 'Test',
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

    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: agency }),
    });

    const component = await ClaimAgencyPage({
      params: { slug: 'test-agency' },
    });
    render(component as React.ReactElement);

    expect(screen.getByText('Claim Agency Profile')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Submit a request to claim and manage this agency profile/
      )
    ).toBeInTheDocument();
  });
});
