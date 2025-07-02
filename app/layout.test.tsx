import React from 'react';
import { render } from '@testing-library/react';
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

// Mock next/font/google
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-font',
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

  it('should render header and footer', () => {
    const { getByText } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    expect(getByText('Header')).toBeInTheDocument();
    expect(getByText('Footer')).toBeInTheDocument();
  });

  it('should apply correct body classes', () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );

    const body = container.querySelector('body');
    expect(body).toHaveClass('inter-font');
  });
});