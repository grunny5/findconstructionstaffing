import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer', () => {
  it('should render copyright text with current year', () => {
    render(<Footer />);

    const currentYear = new Date().getFullYear();
    const copyrightText = screen.getByText(
      new RegExp(`© ${currentYear} Construction Recruiter Directory`, 'i')
    );
    expect(copyrightText).toBeInTheDocument();
  });

  it('should render brand section with logo and description', () => {
    render(<Footer />);

    expect(screen.getByText('Construction')).toBeInTheDocument();
    expect(screen.getByText('Recruiter Directory')).toBeInTheDocument();
    expect(
      screen.getByText(
        /The premier directory connecting construction professionals/i
      )
    ).toBeInTheDocument();
  });

  it('should render "For Companies" section with links', () => {
    render(<Footer />);

    expect(screen.getByText('For Companies')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /add your listing/i })
    ).toHaveAttribute('href', '/claim-listing');
    expect(
      screen.getByRole('link', { name: /premium features/i })
    ).toHaveAttribute('href', '/pricing');
    expect(
      screen.getByRole('link', { name: /success stories/i })
    ).toHaveAttribute('href', '/success-stories');
  });

  it('should render "Support" section with links', () => {
    render(<Footer />);

    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /help center/i })).toHaveAttribute(
      'href',
      '/help'
    );
    expect(screen.getByRole('link', { name: /contact us/i })).toHaveAttribute(
      'href',
      '/contact'
    );
    expect(
      screen.getByRole('link', { name: /privacy policy/i })
    ).toHaveAttribute('href', '/privacy');
  });

  it('should have proper footer structure with industrial design', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo');
    // Industrial design: dark background with orange top border
    expect(footer).toHaveClass('bg-industrial-bg-dark');
    expect(footer).toHaveClass('border-t-[3px]');
    expect(footer).toHaveClass('border-industrial-orange');
    expect(footer).toHaveClass('text-white');
  });

  it('should have responsive grid layout', () => {
    render(<Footer />);

    const gridContainer = screen.getByText('Construction').closest('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1');
    expect(gridContainer).toHaveClass('md:grid-cols-4');
  });

  it('should have all expected links', () => {
    render(<Footer />);

    const links = screen.getAllByRole('link');
    // 6 links in For Companies and Support sections
    expect(links.length).toBeGreaterThanOrEqual(6);
  });

  describe('Industrial Design Styling', () => {
    it('should render logo with Bebas Neue (font-display) styling', () => {
      render(<Footer />);

      const logoText = screen.getByText('Construction');
      expect(logoText).toHaveClass('font-display');
      expect(logoText).toHaveClass('uppercase');
      expect(logoText).toHaveClass('text-2xl');
      expect(logoText).toHaveClass('text-white');
    });

    it('should render section headings with industrial styling', () => {
      render(<Footer />);

      const forCompaniesHeading = screen.getByText('For Companies');
      expect(forCompaniesHeading).toHaveClass('font-display');
      expect(forCompaniesHeading).toHaveClass('uppercase');

      const supportHeading = screen.getByText('Support');
      expect(supportHeading).toHaveClass('font-display');
      expect(supportHeading).toHaveClass('uppercase');
    });

    it('should have sharp-cornered orange logo icon container', () => {
      render(<Footer />);

      const logoContainer = screen
        .getByText('Construction')
        .closest('.flex')
        ?.querySelector('.rounded-industrial-sharp');
      expect(logoContainer).toBeInTheDocument();
      expect(logoContainer).toHaveClass('bg-industrial-orange');
    });

    it('should render barcode decoration element', () => {
      render(<Footer />);

      const barcode = screen.getByText('*FCS2025*');
      expect(barcode).toBeInTheDocument();
      expect(barcode).toHaveClass('font-barcode');
    });
  });
});
