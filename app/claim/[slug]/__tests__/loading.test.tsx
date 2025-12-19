/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import ClaimLoading from '../loading';

// Mock components
jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

jest.mock('@/components/Footer', () => ({
  __esModule: true,
  default: () => <div data-testid="footer">Footer</div>,
}));

describe('Claim Loading Skeleton', () => {
  it('should render header and footer', () => {
    render(<ClaimLoading />);

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should render title and subtitle skeletons', () => {
    render(<ClaimLoading />);

    expect(screen.getByTestId('title-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('subtitle-skeleton')).toBeInTheDocument();
  });

  it('should render agency card skeleton', () => {
    render(<ClaimLoading />);

    expect(screen.getByTestId('agency-card-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('card-title-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('logo-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('agency-name-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('agency-location-skeleton')).toBeInTheDocument();
  });

  it('should render form card skeleton', () => {
    render(<ClaimLoading />);

    expect(screen.getByTestId('form-card-skeleton')).toBeInTheDocument();
  });

  it('should render 4 form field skeletons', () => {
    render(<ClaimLoading />);

    const formFields = screen.getAllByTestId('form-field-skeleton');
    expect(formFields).toHaveLength(4);
  });
});
