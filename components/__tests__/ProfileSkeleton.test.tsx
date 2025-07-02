import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfileSkeleton from '../ProfileSkeleton';

describe('ProfileSkeleton', () => {
  it('should render loading skeleton for agency profile', () => {
    render(<ProfileSkeleton />);

    // Verify main skeleton elements that represent the profile structure
    expect(screen.getByTestId('logo-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('name-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('contact-title-skeleton')).toBeInTheDocument();
  });

  it('should display skeleton placeholders for agency badges', () => {
    render(<ProfileSkeleton />);

    // Agency profiles typically show multiple badges (verified, premium, etc.)
    const badgeSkeletons = screen.getAllByTestId('badge-skeleton');
    expect(badgeSkeletons.length).toBeGreaterThanOrEqual(3);
  });

  it('should show skeleton for call-to-action buttons', () => {
    render(<ProfileSkeleton />);

    // Agency profiles have CTA buttons (contact, view details, etc.)
    const ctaButtons = screen.getAllByTestId('cta-button-skeleton');
    expect(ctaButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('should display skeleton for agency statistics', () => {
    render(<ProfileSkeleton />);

    // Agency profiles show stats like employee count, years in business, etc.
    const statsGrid = screen.getByTestId('stats-grid');
    expect(statsGrid).toBeInTheDocument();
    
    const statItems = screen.getAllByTestId('stat-item');
    expect(statItems.length).toBeGreaterThanOrEqual(4);
  });

  it('should render skeleton for navigation tabs', () => {
    render(<ProfileSkeleton />);

    // Profile pages typically have tabs for different sections
    const tabContainer = screen.getByTestId('tab-skeleton-container');
    expect(tabContainer).toBeInTheDocument();
    
    const tabs = screen.getAllByTestId('tab-skeleton');
    expect(tabs.length).toBeGreaterThanOrEqual(3);
  });

  it('should show skeleton for contact information section', () => {
    render(<ProfileSkeleton />);

    // Contact section is a key part of agency profiles
    const contactTitle = screen.getByTestId('contact-title-skeleton');
    expect(contactTitle).toBeInTheDocument();
  });

  it('should display skeleton for back navigation', () => {
    render(<ProfileSkeleton />);

    // Users need to navigate back to the directory
    const backLink = screen.getByTestId('back-link-skeleton');
    expect(backLink).toBeInTheDocument();
  });

  it('should provide semantic structure while loading', () => {
    render(<ProfileSkeleton />);

    // Verify the skeleton maintains a logical structure
    // Check for the main grid container that holds the layout
    const mainGrid = screen.getByTestId('main-grid-container');
    expect(mainGrid).toBeInTheDocument();
    expect(mainGrid).toHaveClass('grid', 'grid-cols-1', 'lg:grid-cols-3');
    
    // Verify all card containers are present
    expect(screen.getByTestId('main-content-skeleton-card')).toBeInTheDocument();
    expect(screen.getByTestId('contact-skeleton-card')).toBeInTheDocument();
    expect(screen.getByTestId('back-link-skeleton-card')).toBeInTheDocument();
  });

  it('should indicate loading state with skeleton elements', () => {
    render(<ProfileSkeleton />);

    // Verify key skeleton elements are present to indicate loading state
    expect(screen.getByTestId('logo-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('name-skeleton')).toBeInTheDocument();
    expect(screen.getAllByTestId('badge-skeleton')).toHaveLength(3);
    
    // These skeleton elements typically have animation classes applied by the Skeleton component
    const logoSkeleton = screen.getByTestId('logo-skeleton');
    expect(logoSkeleton.className).toContain('rounded-lg');
  });
});