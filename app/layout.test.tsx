import React from 'react';
import { render } from '@testing-library/react';

// Mock CSS imports
jest.mock('./globals.css', () => ({}));

// Mock ui components
jest.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

import RootLayout from './layout';

// Mock the imported components to avoid issues
jest.mock('@/components/Header', () => {
  return function Header() {
    return <header>Header</header>;
  };
});

jest.mock('@/components/Footer', () => {
  return function Footer() {
    return <footer>Footer</footer>;
  };
});

// Mock next/font/google to return consistent class name
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: '__Inter_abc123', // Simulates the actual generated class pattern
  }),
}));

describe('RootLayout', () => {
  it('should render children within the layout', () => {
    const { getByText } = render(
      <RootLayout>
        <div>Test Child Content</div>
      </RootLayout>
    );

    expect(getByText('Test Child Content')).toBeInTheDocument();
  });

  it('should have correct html attributes', () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );

    const html = container.querySelector('html');
    expect(html).toHaveAttribute('lang', 'en');
  });

  it('should render toaster component', () => {
    const { getByTestId } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    expect(getByTestId('toaster')).toBeInTheDocument();
  });

  it('should apply correct body classes', () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );

    const body = container.querySelector('body');
    expect(body).toHaveClass('__Inter_abc123');
  });
});