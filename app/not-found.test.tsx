import React from 'react';
import { render, screen } from '@testing-library/react';
import NotFound from './not-found';

// Mock Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('NotFound Page', () => {
  it('should render 404 heading', () => {
    render(<NotFound />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('404');
  });

  it('should render not found message', () => {
    render(<NotFound />);
    
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });

  it('should render explanation text', () => {
    render(<NotFound />);
    
    expect(screen.getByText(/The page you are looking for/i)).toBeInTheDocument();
  });

  it('should render link to home page', () => {
    render(<NotFound />);
    
    const homeLink = screen.getByRole('link', { name: /go back home/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should have proper layout structure', () => {
    const { container } = render(<NotFound />);
    
    const mainSection = container.querySelector('.min-h-screen');
    expect(mainSection).toBeInTheDocument();
  });

  it('should center content', () => {
    const { container } = render(<NotFound />);
    
    const centerDiv = container.querySelector('.flex.items-center.justify-center');
    expect(centerDiv).toBeInTheDocument();
  });
});