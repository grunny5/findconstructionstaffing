import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';

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

// Mock Radix UI Sheet component for better mobile menu testing
jest.mock('@/components/ui/sheet', () => ({
  Sheet: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (
    <div data-testid="sheet" data-open={open}>
      {children}
    </div>
  ),
  SheetContent: ({
    children,
    side,
  }: {
    children: React.ReactNode;
    side?: string;
  }) => (
    <div data-testid="sheet-content" data-side={side}>
      {children}
    </div>
  ),
  SheetTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) =>
    asChild ? (
      children
    ) : (
      <button data-testid="sheet-trigger">{children}</button>
    ),
}));

describe('Header', () => {
  it('should render the logo and brand name', () => {
    render(<Header />);

    // There are multiple instances of these texts (desktop and mobile)
    expect(screen.getAllByText('Construction')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Recruiter Directory')[0]).toBeInTheDocument();
  });

  it('should render desktop navigation links', () => {
    render(<Header />);

    const browseLinks = screen.getAllByRole('link', {
      name: /browse directory/i,
    });
    const requestLinks = screen.getAllByRole('link', {
      name: /request labor/i,
    });
    const resourceLinks = screen.getAllByRole('link', { name: /resources/i });

    // Check desktop links (usually the first occurrence)
    expect(browseLinks[0]).toHaveAttribute('href', '/');
    expect(requestLinks[0]).toHaveAttribute('href', '/request-labor');
    expect(resourceLinks[0]).toHaveAttribute('href', '/resources');
  });

  it('should render action buttons on desktop', () => {
    render(<Header />);

    const claimLinks = screen.getAllByRole('link', { name: /claim listing/i });
    const getStartedLinks = screen.getAllByRole('link', {
      name: /get started/i,
    });

    // Check that these links exist (at least one for desktop)
    expect(claimLinks.length).toBeGreaterThan(0);
    expect(getStartedLinks.length).toBeGreaterThan(0);
  });

  it('should have proper header styling', () => {
    render(<Header />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('glass-header');
    expect(header).toHaveClass('sticky');
    expect(header).toHaveClass('top-0');
    expect(header).toHaveClass('z-50');
  });

  it('should have navigation element', () => {
    render(<Header />);

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass('hidden');
    expect(nav).toHaveClass('md:flex');
  });

  it('should render mobile menu trigger', () => {
    render(<Header />);

    // Mobile menu button (Sheet trigger)
    const mobileMenuButton = screen.getByRole('button');
    expect(mobileMenuButton).toBeInTheDocument();
  });

  it('should render mobile menu components', () => {
    render(<Header />);

    // Verify Sheet components are rendered with proper structure
    expect(screen.getByTestId('sheet')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-content')).toBeInTheDocument();

    // Verify mobile menu button exists
    const mobileMenuButton = screen.getByRole('button');
    expect(mobileMenuButton).toBeInTheDocument();
  });

  it('should render mobile navigation links in sheet content', () => {
    render(<Header />);

    // The mobile menu should contain the same navigation items
    const sheetContent = screen.getByTestId('sheet-content');
    expect(sheetContent).toBeInTheDocument();

    // Mobile menu should have navigation links (multiple instances due to desktop + mobile)
    expect(screen.getAllByText('Browse Directory').length).toBeGreaterThan(1);
    expect(screen.getAllByText('Request Labor').length).toBeGreaterThan(1);
    expect(screen.getAllByText('Resources').length).toBeGreaterThan(1);
  });

  it('should render action buttons in mobile menu', () => {
    render(<Header />);

    // Mobile menu should contain action buttons (multiple instances due to desktop + mobile)
    expect(screen.getAllByText('Claim Listing').length).toBeGreaterThan(1);
    expect(screen.getAllByText('Get Started').length).toBeGreaterThan(1);
  });

  it('should have responsive container', () => {
    render(<Header />);

    const container = screen
      .getAllByText('Construction')[0]
      .closest('.max-w-7xl');
    expect(container).toHaveClass('mx-auto');
  });
});
