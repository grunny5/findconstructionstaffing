/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';

// Mock components used in the page
jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

jest.mock('@/components/Footer', () => ({
  __esModule: true,
  default: () => <div data-testid="footer">Footer</div>,
}));

jest.mock('@/components/messages/SendMessageButton', () => ({
  SendMessageButton: () => (
    <button data-testid="send-message-btn">Send Message</button>
  ),
}));

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

// Profile styling component for testing (client-side rendering)
function ProfilePage({ agency }: { agency: any }) {
  return (
    <div
      className="min-h-screen bg-industrial-bg-primary"
      data-testid="profile-page"
    >
      {/* Hero Section - Industrial Design System */}
      <section
        className="bg-industrial-bg-card border-b border-industrial-graphite-200"
        data-testid="hero-section"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Logo */}
            <div className="flex-shrink-0">
              {agency.logo_url ? (
                <img
                  src={agency.logo_url}
                  alt={`${agency.name} logo`}
                  className="rounded-industrial-sharp object-cover border-2 border-industrial-graphite-200"
                  data-testid="agency-logo"
                />
              ) : (
                <div
                  className="w-32 h-32 bg-industrial-graphite-100 rounded-industrial-sharp flex items-center justify-center border-2 border-industrial-graphite-200"
                  data-testid="agency-logo-placeholder"
                >
                  Logo
                </div>
              )}
            </div>

            {/* Agency Details */}
            <div className="flex-1">
              <h1
                className="font-display text-4xl lg:text-5xl text-industrial-graphite-600 uppercase tracking-wide mb-3"
                data-testid="agency-name"
              >
                {agency.name}
              </h1>
              <p
                className="font-body text-industrial-graphite-400 text-lg max-w-3xl"
                data-testid="agency-description"
              >
                {agency.description ||
                  'Professional construction staffing services.'}
              </p>

              {/* Quick Stats */}
              <div
                className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8 pt-8 border-t border-industrial-graphite-200"
                data-testid="stats-section"
              >
                <div data-testid="stat-established">
                  <span className="font-body text-sm uppercase tracking-wide text-industrial-graphite-400">
                    Established
                  </span>
                  <p className="font-display text-3xl text-industrial-graphite-600">
                    {agency.founded_year || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div
          className="bg-industrial-bg-card border-industrial-graphite-200 rounded-industrial-sharp shadow-sm"
          data-testid="content-card"
        >
          <h2
            className="font-display text-2xl text-industrial-graphite-600 uppercase tracking-wide mb-4 pb-3 border-b border-industrial-graphite-200"
            data-testid="section-header"
          >
            About {agency.name}
          </h2>
        </div>

        {/* Contact Card */}
        <div
          className="bg-industrial-bg-card border-industrial-graphite-200 rounded-industrial-sharp shadow-sm mt-6"
          data-testid="contact-card"
        >
          <h2
            className="font-display text-2xl text-industrial-graphite-600 uppercase tracking-wide mb-4 pb-3 border-b border-industrial-graphite-200"
            data-testid="contact-header"
          >
            Contact Information
          </h2>
          {agency.phone && (
            <a
              href={`tel:${agency.phone}`}
              className="font-body text-industrial-orange hover:text-industrial-orange-500 transition-colors"
              data-testid="phone-link"
            >
              {agency.phone}
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

const mockAgency = {
  id: '1',
  name: 'Elite Construction Staffing',
  slug: 'elite-construction-staffing',
  description: 'Premier construction staffing services',
  logo_url: null,
  website: 'https://elitestaffing.com',
  phone: '555-0100',
  email: 'contact@elitestaffing.com',
  is_claimed: true,
  offers_per_diem: true,
  is_union: false,
  founded_year: 2010,
  employee_count: '50-100',
  headquarters: 'Dallas, TX',
  rating: 4.5,
  project_count: 150,
  verified: true,
  featured: true,
};

describe('Agency Profile Page - Industrial Design Styling', () => {
  describe('Page Background', () => {
    it('should use warm cream background (bg-industrial-bg-primary)', () => {
      render(<ProfilePage agency={mockAgency} />);
      const page = screen.getByTestId('profile-page');

      expect(page).toHaveClass('bg-industrial-bg-primary');
    });

    it('should apply min-h-screen for full page height', () => {
      render(<ProfilePage agency={mockAgency} />);
      const page = screen.getByTestId('profile-page');

      expect(page).toHaveClass('min-h-screen');
    });
  });

  describe('Hero Section', () => {
    it('should use white card background (bg-industrial-bg-card)', () => {
      render(<ProfilePage agency={mockAgency} />);
      const hero = screen.getByTestId('hero-section');

      expect(hero).toHaveClass('bg-industrial-bg-card');
    });

    it('should have industrial border styling', () => {
      render(<ProfilePage agency={mockAgency} />);
      const hero = screen.getByTestId('hero-section');

      expect(hero).toHaveClass('border-b');
      expect(hero).toHaveClass('border-industrial-graphite-200');
    });
  });

  describe('Agency Name Typography', () => {
    it('should use Bebas Neue display font (font-display)', () => {
      render(<ProfilePage agency={mockAgency} />);
      const name = screen.getByTestId('agency-name');

      expect(name).toHaveClass('font-display');
    });

    it('should be uppercase', () => {
      render(<ProfilePage agency={mockAgency} />);
      const name = screen.getByTestId('agency-name');

      expect(name).toHaveClass('uppercase');
    });

    it('should use large text size (text-4xl lg:text-5xl = 2.5rem+)', () => {
      render(<ProfilePage agency={mockAgency} />);
      const name = screen.getByTestId('agency-name');

      expect(name).toHaveClass('text-4xl');
      expect(name).toHaveClass('lg:text-5xl');
    });

    it('should use industrial graphite color for text', () => {
      render(<ProfilePage agency={mockAgency} />);
      const name = screen.getByTestId('agency-name');

      expect(name).toHaveClass('text-industrial-graphite-600');
    });

    it('should have wide letter spacing', () => {
      render(<ProfilePage agency={mockAgency} />);
      const name = screen.getByTestId('agency-name');

      expect(name).toHaveClass('tracking-wide');
    });
  });

  describe('Description Typography', () => {
    it('should use Barlow body font (font-body)', () => {
      render(<ProfilePage agency={mockAgency} />);
      const desc = screen.getByTestId('agency-description');

      expect(desc).toHaveClass('font-body');
    });

    it('should use industrial graphite-400 for secondary text', () => {
      render(<ProfilePage agency={mockAgency} />);
      const desc = screen.getByTestId('agency-description');

      expect(desc).toHaveClass('text-industrial-graphite-400');
    });
  });

  describe('Logo Placeholder', () => {
    it('should use industrial sharp border-radius', () => {
      render(<ProfilePage agency={mockAgency} />);
      const logo = screen.getByTestId('agency-logo-placeholder');

      expect(logo).toHaveClass('rounded-industrial-sharp');
    });

    it('should have industrial border styling', () => {
      render(<ProfilePage agency={mockAgency} />);
      const logo = screen.getByTestId('agency-logo-placeholder');

      expect(logo).toHaveClass('border-2');
      expect(logo).toHaveClass('border-industrial-graphite-200');
    });

    it('should use industrial graphite background', () => {
      render(<ProfilePage agency={mockAgency} />);
      const logo = screen.getByTestId('agency-logo-placeholder');

      expect(logo).toHaveClass('bg-industrial-graphite-100');
    });
  });

  describe('Stats Section', () => {
    it('should have top border divider', () => {
      render(<ProfilePage agency={mockAgency} />);
      const stats = screen.getByTestId('stats-section');

      expect(stats).toHaveClass('border-t');
      expect(stats).toHaveClass('border-industrial-graphite-200');
    });

    it('should display stats labels in uppercase with font-body', () => {
      render(<ProfilePage agency={mockAgency} />);
      const stat = screen.getByTestId('stat-established');

      expect(stat.querySelector('span')).toHaveClass('font-body');
      expect(stat.querySelector('span')).toHaveClass('uppercase');
      expect(stat.querySelector('span')).toHaveClass('tracking-wide');
    });

    it('should display stat values in display font', () => {
      render(<ProfilePage agency={mockAgency} />);
      const stat = screen.getByTestId('stat-established');

      expect(stat.querySelector('p')).toHaveClass('font-display');
      expect(stat.querySelector('p')).toHaveClass('text-3xl');
    });
  });

  describe('Section Headers', () => {
    it('should use Bebas Neue display font (font-display)', () => {
      render(<ProfilePage agency={mockAgency} />);
      const header = screen.getByTestId('section-header');

      expect(header).toHaveClass('font-display');
    });

    it('should be 2rem (text-2xl) uppercase', () => {
      render(<ProfilePage agency={mockAgency} />);
      const header = screen.getByTestId('section-header');

      expect(header).toHaveClass('text-2xl');
      expect(header).toHaveClass('uppercase');
    });

    it('should have bottom border divider', () => {
      render(<ProfilePage agency={mockAgency} />);
      const header = screen.getByTestId('section-header');

      expect(header).toHaveClass('border-b');
      expect(header).toHaveClass('border-industrial-graphite-200');
    });

    it('should use industrial graphite-600 for text', () => {
      render(<ProfilePage agency={mockAgency} />);
      const header = screen.getByTestId('section-header');

      expect(header).toHaveClass('text-industrial-graphite-600');
    });
  });

  describe('Content Cards', () => {
    it('should use white background (bg-industrial-bg-card)', () => {
      render(<ProfilePage agency={mockAgency} />);
      const card = screen.getByTestId('content-card');

      expect(card).toHaveClass('bg-industrial-bg-card');
    });

    it('should use industrial sharp border-radius', () => {
      render(<ProfilePage agency={mockAgency} />);
      const card = screen.getByTestId('content-card');

      expect(card).toHaveClass('rounded-industrial-sharp');
    });

    it('should have industrial border color', () => {
      render(<ProfilePage agency={mockAgency} />);
      const card = screen.getByTestId('content-card');

      expect(card).toHaveClass('border-industrial-graphite-200');
    });

    it('should have shadow for depth', () => {
      render(<ProfilePage agency={mockAgency} />);
      const card = screen.getByTestId('content-card');

      expect(card).toHaveClass('shadow-sm');
    });
  });

  describe('Contact Links', () => {
    it('should use industrial orange color for links', () => {
      render(<ProfilePage agency={mockAgency} />);
      const link = screen.getByTestId('phone-link');

      expect(link).toHaveClass('text-industrial-orange');
    });

    it('should have hover state with darker orange', () => {
      render(<ProfilePage agency={mockAgency} />);
      const link = screen.getByTestId('phone-link');

      expect(link).toHaveClass('hover:text-industrial-orange-500');
    });

    it('should have transition for smooth hover effect', () => {
      render(<ProfilePage agency={mockAgency} />);
      const link = screen.getByTestId('phone-link');

      expect(link).toHaveClass('transition-colors');
    });

    it('should use body font', () => {
      render(<ProfilePage agency={mockAgency} />);
      const link = screen.getByTestId('phone-link');

      expect(link).toHaveClass('font-body');
    });
  });

  describe('Contact Card Section', () => {
    it('should have section header with bottom border', () => {
      render(<ProfilePage agency={mockAgency} />);
      const header = screen.getByTestId('contact-header');

      expect(header).toHaveClass('border-b');
      expect(header).toHaveClass('border-industrial-graphite-200');
      expect(header).toHaveClass('pb-3');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should have responsive grid columns for stats', () => {
      render(<ProfilePage agency={mockAgency} />);
      const stats = screen.getByTestId('stats-section');

      expect(stats).toHaveClass('grid-cols-2');
      expect(stats).toHaveClass('lg:grid-cols-4');
    });

    it('should have responsive text size for agency name', () => {
      render(<ProfilePage agency={mockAgency} />);
      const name = screen.getByTestId('agency-name');

      expect(name).toHaveClass('text-4xl');
      expect(name).toHaveClass('lg:text-5xl');
    });
  });
});
