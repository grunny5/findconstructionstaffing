import { render, screen } from '@testing-library/react';
import { AuthPageLayout } from '../AuthPageLayout';

describe('AuthPageLayout', () => {
  describe('Background Styling', () => {
    it('should render with cream background', () => {
      const { container } = render(
        <AuthPageLayout>
          <div>Test content</div>
        </AuthPageLayout>
      );

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('bg-industrial-bg-primary');
      expect(mainDiv).toHaveClass('min-h-screen');
    });
  });

  describe('Hero Section', () => {
    it('should not render hero section by default', () => {
      render(
        <AuthPageLayout>
          <div>Test content</div>
        </AuthPageLayout>
      );

      expect(
        screen.queryByRole('heading', { level: 1 })
      ).not.toBeInTheDocument();
    });

    it('should not render hero section when showHero is false', () => {
      render(
        <AuthPageLayout showHero={false} heroTitle="Test Title">
          <div>Test content</div>
        </AuthPageLayout>
      );

      expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
    });

    it('should render hero section when showHero is true and heroTitle provided', () => {
      render(
        <AuthPageLayout showHero heroTitle="CREATE YOUR ACCOUNT">
          <div>Test content</div>
        </AuthPageLayout>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('CREATE YOUR ACCOUNT');
    });

    it('should apply industrial styling to hero section', () => {
      const { container } = render(
        <AuthPageLayout showHero heroTitle="Test Title">
          <div>Test content</div>
        </AuthPageLayout>
      );

      const heroSection = container.querySelector('section');
      expect(heroSection).toHaveClass('bg-industrial-graphite-600');
      expect(heroSection).toHaveClass('border-b-4');
      expect(heroSection).toHaveClass('border-industrial-orange');
    });

    it('should apply display font and uppercase to hero title', () => {
      render(
        <AuthPageLayout showHero heroTitle="CREATE YOUR ACCOUNT">
          <div>Test content</div>
        </AuthPageLayout>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('font-display');
      expect(heading).toHaveClass('uppercase');
      expect(heading).toHaveClass('text-white');
      expect(heading).toHaveClass('tracking-wide');
    });

    it('should render hero subtitle when provided', () => {
      render(
        <AuthPageLayout
          showHero
          heroTitle="Test Title"
          heroSubtitle="Test Subtitle"
        >
          <div>Test content</div>
        </AuthPageLayout>
      );

      const subtitle = screen.getByText('Test Subtitle');
      expect(subtitle).toBeInTheDocument();
      expect(subtitle).toHaveClass('font-body');
      expect(subtitle).toHaveClass('text-industrial-graphite-200');
    });

    it('should not render hero subtitle when not provided', () => {
      render(
        <AuthPageLayout showHero heroTitle="Test Title">
          <div>Test content</div>
        </AuthPageLayout>
      );

      // Should only have heading, no subtitle paragraph
      const paragraphs = screen.queryAllByRole('paragraph');
      expect(paragraphs).toHaveLength(0);
    });

    it('should apply responsive padding to hero section', () => {
      const { container } = render(
        <AuthPageLayout showHero heroTitle="Test Title">
          <div>Test content</div>
        </AuthPageLayout>
      );

      const heroSection = container.querySelector('section');
      expect(heroSection).toHaveClass('py-12');
      expect(heroSection).toHaveClass('md:py-16');
    });
  });

  describe('Content Container', () => {
    it('should render children content', () => {
      render(
        <AuthPageLayout>
          <div data-testid="test-child">Test content</div>
        </AuthPageLayout>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should apply default max-width (md)', () => {
      const { container } = render(
        <AuthPageLayout>
          <div>Test content</div>
        </AuthPageLayout>
      );

      const contentContainer = container.querySelector('.max-w-md');
      expect(contentContainer).toBeInTheDocument();
    });

    it('should apply sm max-width when specified', () => {
      const { container } = render(
        <AuthPageLayout maxWidth="sm">
          <div>Test content</div>
        </AuthPageLayout>
      );

      const contentContainer = container.querySelector('.max-w-sm');
      expect(contentContainer).toBeInTheDocument();
      expect(container.querySelector('.max-w-md')).not.toBeInTheDocument();
    });

    it('should apply lg max-width when specified', () => {
      const { container } = render(
        <AuthPageLayout maxWidth="lg">
          <div>Test content</div>
        </AuthPageLayout>
      );

      const contentContainer = container.querySelector('.max-w-2xl');
      expect(contentContainer).toBeInTheDocument();
      expect(container.querySelector('.max-w-md')).not.toBeInTheDocument();
    });

    it('should center content with mx-auto', () => {
      const { container } = render(
        <AuthPageLayout>
          <div>Test content</div>
        </AuthPageLayout>
      );

      const contentWrapper = container.querySelector('.max-w-md');
      expect(contentWrapper).toHaveClass('mx-auto');
    });

    it('should apply responsive padding to content area', () => {
      const { container } = render(
        <AuthPageLayout>
          <div>Test content</div>
        </AuthPageLayout>
      );

      const contentArea = container.querySelector('.py-8');
      expect(contentArea).toBeInTheDocument();
      expect(contentArea).toHaveClass('md:py-12');
    });
  });

  describe('Combined Scenarios', () => {
    it('should render both hero and content together', () => {
      render(
        <AuthPageLayout
          showHero
          heroTitle="SIGN IN"
          heroSubtitle="Welcome back"
          maxWidth="sm"
        >
          <div data-testid="form-content">Form goes here</div>
        </AuthPageLayout>
      );

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'SIGN IN'
      );
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByTestId('form-content')).toBeInTheDocument();
    });

    it('should work without hero for minimal pages', () => {
      render(
        <AuthPageLayout maxWidth="md">
          <div data-testid="minimal-content">Minimal page</div>
        </AuthPageLayout>
      );

      expect(
        screen.queryByRole('heading', { level: 1 })
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('minimal-content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should use semantic HTML with proper heading hierarchy', () => {
      render(
        <AuthPageLayout showHero heroTitle="Test Title">
          <div>Content</div>
        </AuthPageLayout>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should maintain proper document structure', () => {
      const { container } = render(
        <AuthPageLayout showHero heroTitle="Test" heroSubtitle="Subtitle">
          <div>Content</div>
        </AuthPageLayout>
      );

      // Should have section for hero
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();

      // Should have proper container structure
      const containers = container.querySelectorAll('.container');
      expect(containers.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive text sizing to hero title', () => {
      render(
        <AuthPageLayout showHero heroTitle="Test">
          <div>Content</div>
        </AuthPageLayout>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-4xl');
      expect(heading).toHaveClass('md:text-5xl');
      expect(heading).toHaveClass('lg:text-6xl');
    });

    it('should apply responsive text sizing to hero subtitle', () => {
      render(
        <AuthPageLayout showHero heroTitle="Test" heroSubtitle="Subtitle">
          <div>Content</div>
        </AuthPageLayout>
      );

      const subtitle = screen.getByText('Subtitle');
      expect(subtitle).toHaveClass('text-xl');
      expect(subtitle).toHaveClass('md:text-2xl');
    });

    it('should apply responsive padding throughout', () => {
      const { container } = render(
        <AuthPageLayout showHero heroTitle="Test">
          <div>Content</div>
        </AuthPageLayout>
      );

      // Hero section responsive padding
      const section = container.querySelector('section');
      expect(section).toHaveClass('py-12');
      expect(section).toHaveClass('md:py-16');

      // Content area responsive padding
      const contentArea = container.querySelector('.py-8');
      expect(contentArea).toHaveClass('md:py-12');
    });
  });
});
