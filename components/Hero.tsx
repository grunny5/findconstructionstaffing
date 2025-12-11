import React from 'react';

interface HeroProps {
  /**
   * Main title text displayed in the hero section
   */
  title: string;
  /**
   * Subtitle or description text below the title (optional)
   */
  subtitle?: string;
  /**
   * Additional CSS classes to apply to the hero section
   * @default 'construction-hero'
   */
  className?: string;
  /**
   * Child elements to render below the title and subtitle
   */
  children?: React.ReactNode;
}

/**
 * Reusable Hero component for page headers with construction-industry themed styling
 *
 * @example
 * ```tsx
 * <Hero
 *   title="Contact Us"
 *   subtitle="Get in touch with our team"
 * />
 * ```
 */
export default function Hero({
  title,
  subtitle,
  className = 'construction-hero',
  children,
}: HeroProps) {
  return (
    <section className={`${className} py-16 text-white`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl md:text-2xl text-slate-200 max-w-2xl mx-auto mb-8">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}
