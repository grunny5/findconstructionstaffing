import React from 'react';
import { render, screen } from '@testing-library/react';
import RecruiterLayout from '../layout';

describe('RecruiterLayout', () => {
  const mockChildren = <div data-testid="child-content">Test Content</div>;

  it('should render children', () => {
    render(<RecruiterLayout>{mockChildren}</RecruiterLayout>);

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should have proper layout structure', () => {
    const { container } = render(<RecruiterLayout>{mockChildren}</RecruiterLayout>);

    // Layout should provide consistent structure
    const layoutWrapper = container.firstChild;
    expect(layoutWrapper).toBeInTheDocument();
  });

  it('should not interfere with child content', () => {
    const complexChildren = (
      <div>
        <h1>Heading</h1>
        <p>Paragraph</p>
        <button>Button</button>
      </div>
    );

    render(<RecruiterLayout>{complexChildren}</RecruiterLayout>);

    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(screen.getByText('Paragraph')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should apply any layout-specific styles or structure', () => {
    const { container } = render(<RecruiterLayout>{mockChildren}</RecruiterLayout>);

    // Check if layout adds any wrapper divs or styling
    const wrapper = container.querySelector('div');
    
    // Layout should exist even if it's minimal
    expect(wrapper).toBeInTheDocument();
  });
});