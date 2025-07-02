import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('Header', () => {
  it('should render the logo and brand name', () => {
    render(<Header />);

    expect(screen.getByText('Construction')).toBeInTheDocument();
    expect(screen.getByText('Recruiter Directory')).toBeInTheDocument();
  });

  it('should render desktop navigation links', () => {
    render(<Header />);

    expect(screen.getByRole('link', { name: /browse directory/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /request labor/i })).toHaveAttribute('href', '/request-labor');
    expect(screen.getByRole('link', { name: /resources/i })).toHaveAttribute('href', '/resources');
  });

  it('should render action buttons on desktop', () => {
    render(<Header />);

    expect(screen.getByRole('link', { name: /claim listing/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();
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

  it('should toggle mobile menu', () => {
    render(<Header />);

    const mobileMenuButton = screen.getByRole('button');
    
    // Open mobile menu
    fireEvent.click(mobileMenuButton);
    
    // Check if mobile menu content is visible
    // Note: Sheet component may require additional mocking for full testing
    expect(screen.getAllByText('Construction').length).toBeGreaterThan(1);
  });

  it('should have responsive container', () => {
    render(<Header />);

    const container = screen.getByText('Construction').closest('.max-w-7xl');
    expect(container).toHaveClass('mx-auto');
  });
});