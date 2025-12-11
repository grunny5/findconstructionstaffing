import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Hero from '../Hero';

describe('Hero Component', () => {
  describe('Rendering', () => {
    it('renders with required title prop', () => {
      render(<Hero title="Test Title" />);

      expect(
        screen.getByRole('heading', { level: 1, name: 'Test Title' }),
      ).toBeInTheDocument();
    });

    it('renders subtitle when provided', () => {
      render(<Hero title="Test Title" subtitle="Test Subtitle" />);

      expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
      expect(screen.getByText('Test Subtitle')).toHaveClass('text-slate-200');
    });

    it('does not render subtitle when not provided', () => {
      render(<Hero title="Test Title" />);

      expect(
        screen.queryByText('text-slate-200', { exact: false }),
      ).not.toBeInTheDocument();
    });

    it('renders children when provided', () => {
      render(
        <Hero title="Test Title">
          <div data-testid="child-element">Child Content</div>
        </Hero>,
      );

      expect(screen.getByTestId('child-element')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('does not render children when not provided', () => {
      const { container } = render(<Hero title="Test Title" />);

      const section = container.querySelector('section');
      const innerDiv = section?.querySelector('.max-w-4xl');

      // Should only have h1 and no other content
      expect(innerDiv?.children.length).toBe(1);
    });
  });

  describe('CSS Classes', () => {
    it('applies default construction-hero className', () => {
      const { container } = render(<Hero title="Test Title" />);

      const section = container.querySelector('section');
      expect(section).toHaveClass('construction-hero');
      expect(section).toHaveClass('py-16');
      expect(section).toHaveClass('text-white');
    });

    it('respects custom className override', () => {
      const { container } = render(
        <Hero title="Test Title" className="custom-hero" />,
      );

      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-hero');
      expect(section).toHaveClass('py-16');
      expect(section).toHaveClass('text-white');
      expect(section).not.toHaveClass('construction-hero');
    });

    it('applies correct container classes', () => {
      const { container } = render(<Hero title="Test Title" />);

      const containerDiv = container.querySelector('.container');
      expect(containerDiv).toHaveClass('mx-auto');
      expect(containerDiv).toHaveClass('px-4');
      expect(containerDiv).toHaveClass('sm:px-6');
      expect(containerDiv).toHaveClass('lg:px-8');
    });

    it('applies correct inner wrapper classes', () => {
      const { container } = render(<Hero title="Test Title" />);

      const innerDiv = container.querySelector('.max-w-4xl');
      expect(innerDiv).toHaveClass('mx-auto');
      expect(innerDiv).toHaveClass('text-center');
      expect(innerDiv).toHaveClass('relative');
      expect(innerDiv).toHaveClass('z-10');
    });

    it('applies correct heading classes', () => {
      render(<Hero title="Test Title" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-4xl');
      expect(heading).toHaveClass('md:text-5xl');
      expect(heading).toHaveClass('lg:text-6xl');
      expect(heading).toHaveClass('font-bold');
      expect(heading).toHaveClass('mb-6');
    });
  });

  describe('Structure', () => {
    it('renders with correct semantic HTML structure', () => {
      const { container } = render(<Hero title="Test Title" />);

      const section = container.querySelector('section');
      expect(section?.tagName).toBe('SECTION');

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.tagName).toBe('H1');
    });

    it('renders subtitle with correct HTML element', () => {
      render(<Hero title="Test Title" subtitle="Test Subtitle" />);

      const subtitle = screen.getByText('Test Subtitle');
      expect(subtitle.tagName).toBe('P');
    });
  });

  describe('Props Combinations', () => {
    it('renders with all props provided', () => {
      const { container } = render(
        <Hero
          title="Full Test"
          subtitle="Full Subtitle"
          className="custom-class"
        >
          <button>Click me</button>
        </Hero>,
      );

      expect(
        screen.getByRole('heading', { level: 1, name: 'Full Test' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Full Subtitle')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();

      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });

    it('renders with minimal props (only title)', () => {
      render(<Hero title="Minimal Test" />);

      expect(
        screen.getByRole('heading', { level: 1, name: 'Minimal Test' }),
      ).toBeInTheDocument();
    });

    it('renders with title and subtitle only', () => {
      render(<Hero title="Title Only" subtitle="With Subtitle" />);

      expect(
        screen.getByRole('heading', { level: 1, name: 'Title Only' }),
      ).toBeInTheDocument();
      expect(screen.getByText('With Subtitle')).toBeInTheDocument();
    });

    it('renders with title and children only', () => {
      render(
        <Hero title="Title with Children">
          <span>Child element</span>
        </Hero>,
      );

      expect(
        screen.getByRole('heading', { level: 1, name: 'Title with Children' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Child element')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible heading hierarchy', () => {
      render(<Hero title="Accessible Title" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('renders semantic section element', () => {
      const { container } = render(<Hero title="Test" />);

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });
  });
});
