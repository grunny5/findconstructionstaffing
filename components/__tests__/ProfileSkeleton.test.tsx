import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfileSkeleton from '../ProfileSkeleton';

describe('ProfileSkeleton', () => {
  it('should render all skeleton elements', () => {
    render(<ProfileSkeleton />);

    // Check for skeleton elements by their test ids
    expect(screen.getByTestId('logo-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('name-skeleton')).toBeInTheDocument();
    expect(screen.getAllByTestId('badge-skeleton')).toHaveLength(3);
  });

  it('should have proper structure for profile page', () => {
    render(<ProfileSkeleton />);

    // Logo skeleton
    const logoSkeleton = screen.getByTestId('logo-skeleton');
    expect(logoSkeleton).toHaveClass('w-32', 'h-32');

    // Name skeleton
    const nameSkeleton = screen.getByTestId('name-skeleton');
    expect(nameSkeleton).toHaveClass('h-9', 'w-80');

    // CTA buttons
    const ctaButtons = screen.getAllByTestId('cta-button-skeleton');
    expect(ctaButtons).toHaveLength(2);

    // Stats grid
    const statsGrid = screen.getByTestId('stats-grid');
    expect(statsGrid).toBeInTheDocument();
    
    const statItems = screen.getAllByTestId('stat-item');
    expect(statItems).toHaveLength(4);
  });

  it('should render tab skeleton section', () => {
    render(<ProfileSkeleton />);

    const tabContainer = screen.getByTestId('tab-skeleton-container');
    expect(tabContainer).toBeInTheDocument();
    
    const tabs = screen.getAllByTestId('tab-skeleton');
    expect(tabs).toHaveLength(3);
  });

  it('should render contact section skeleton', () => {
    render(<ProfileSkeleton />);

    const contactTitle = screen.getByTestId('contact-title-skeleton');
    expect(contactTitle).toBeInTheDocument();
    expect(contactTitle).toHaveClass('h-6', 'w-40');
  });

  it('should render back link skeleton', () => {
    render(<ProfileSkeleton />);

    const backLink = screen.getByTestId('back-link-skeleton');
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveClass('h-5', 'w-32');
  });

  it('should have responsive grid layout', () => {
    render(<ProfileSkeleton />);

    // Main content grid
    const mainGrid = screen.getByText('', { selector: '.grid.grid-cols-1.lg\\:grid-cols-3' });
    expect(mainGrid).toBeInTheDocument();
  });

  it('should use Card components for structure', () => {
    render(<ProfileSkeleton />);

    // Card components should be present
    const cards = document.querySelectorAll('[class*="rounded-lg"][class*="border"]');
    expect(cards.length).toBeGreaterThan(0);
  });
});