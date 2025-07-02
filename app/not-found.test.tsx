import React from 'react';
import { render, screen } from '@testing-library/react';
import NotFound from './not-found';

// Mock Link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock Header and Footer components to focus on NotFound content
jest.mock('@/components/Header', () => {
  return function Header() {
    return <header data-testid="header">Header</header>;
  };
});

jest.mock('@/components/Footer', () => {
  return function Footer() {
    return <footer data-testid="footer">Footer</footer>;
  };
});

describe('NotFound Page', () => {
  it('should render 404 heading', () => {
    render(<NotFound />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('404');
  });

  it('should render page not found heading', () => {
    render(<NotFound />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Page Not Found');
  });

  it('should render helpful explanation text', () => {
    render(<NotFound />);

    expect(
      screen.getByText(
        /The page you're looking for doesn't exist or has been moved/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Let's get you back on track/i)
    ).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    render(<NotFound />);

    const homeLink = screen.getByRole('link', { name: /go to homepage/i });
    expect(homeLink).toHaveAttribute('href', '/');

    const browseLink = screen.getByRole('link', { name: /browse agencies/i });
    expect(browseLink).toHaveAttribute('href', '/#directory');
  });

  it('should render contact help link', () => {
    render(<NotFound />);

    expect(screen.getByText(/need help\?/i)).toBeInTheDocument();
    const contactLink = screen.getByRole('link', { name: /contact us/i });
    expect(contactLink).toHaveAttribute('href', '/contact');
  });

  it('should render FileQuestion icon', () => {
    const { container } = render(<NotFound />);

    // Look for the Lucide icon by its SVG structure
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should include header and footer components', () => {
    render(<NotFound />);

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should have accessible structure', () => {
    render(<NotFound />);

    // Check for proper heading hierarchy
    const h1 = screen.getByRole('heading', { level: 1 });
    const h2 = screen.getByRole('heading', { level: 2 });

    expect(h1).toBeInTheDocument();
    expect(h2).toBeInTheDocument();

    // Check for multiple actionable links
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(3); // Home, Browse, Contact
  });
});
