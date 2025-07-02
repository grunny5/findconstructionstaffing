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

    expect(screen.getByText('Construction')).toBeInTheDocument();
    expect(screen.getByText('Recruiter Directory')).toBeInTheDocument();
  });

  it('should render desktop navigation links', () => {
    render(<Header />);

    expect(
      screen.getByRole('link', { name: /browse directory/i })
    ).toHaveAttribute('href', '/');
    expect(
      screen.getByRole('link', { name: /request labor/i })
    ).toHaveAttribute('href', '/request-labor');
    expect(screen.getByRole('link', { name: /resources/i })).toHaveAttribute(
      'href',
      '/resources'
    );
  });

  it('should render action buttons on desktop', () => {
    render(<Header />);

    expect(
      screen.getByRole('link', { name: /claim listing/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /get started/i })
    ).toBeInTheDocument();
  });

  it('should have proper header styling', () => {
    render(<Header />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('glass-header', 'sticky', 'top-0', 'z-50');
  });

  it('should have navigation element', () => {
    render(<Header />);

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass('hidden', 'md:flex');
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

    const container = screen.getByText('Construction').closest('.max-w-7xl');
    expect(container).toHaveClass('mx-auto');
  });
});
