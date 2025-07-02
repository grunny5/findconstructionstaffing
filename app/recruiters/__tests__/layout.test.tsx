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

  it('should render children directly without wrapper', () => {
    const { container } = render(<RecruiterLayout>{mockChildren}</RecruiterLayout>);

    // Since the layout returns children directly, the test content should be the first child
    const testContent = screen.getByTestId('child-content');
    expect(testContent).toBeInTheDocument();
    
    // The layout doesn't add any wrapper elements
    expect(container.firstChild).toBe(testContent);
  });

  it('should not interfere with child content', () => {
    const complexChildren = (
      <div data-testid="complex-wrapper">
        <h1>Heading</h1>
        <p>Paragraph</p>
        <button>Button</button>
      </div>
    );

    const { container } = render(<RecruiterLayout>{complexChildren}</RecruiterLayout>);

    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(screen.getByText('Paragraph')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
    
    // Verify the layout doesn't wrap the content
    expect(container.firstChild).toBe(screen.getByTestId('complex-wrapper'));
  });

  it('should be a minimal layout that only provides metadata', () => {
    // The RecruiterLayout component only exports metadata and returns children as-is
    // This test documents that behavior
    const { container } = render(
      <RecruiterLayout>
        <main data-testid="main-content">Main Content</main>
      </RecruiterLayout>
    );

    // Children should be rendered directly without any layout wrapper
    const mainContent = screen.getByTestId('main-content');
    expect(container.firstChild).toBe(mainContent);
    expect(container.children).toHaveLength(1);
  });
});