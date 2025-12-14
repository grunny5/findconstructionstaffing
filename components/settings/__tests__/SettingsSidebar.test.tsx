import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { SettingsSidebar } from '../SettingsSidebar';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

const mockedUsePathname = jest.mocked(usePathname);

describe('SettingsSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all navigation sections', () => {
    mockedUsePathname.mockReturnValue('/settings');

    render(<SettingsSidebar />);

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('should highlight active section', () => {
    mockedUsePathname.mockReturnValue('/settings');

    render(<SettingsSidebar />);

    const profileLink = screen.getByRole('link', { name: /profile/i });
    expect(profileLink).toHaveAttribute('aria-current', 'page');
  });

  it('should not highlight inactive sections', () => {
    mockedUsePathname.mockReturnValue('/settings');

    render(<SettingsSidebar />);

    const emailLink = screen.getByRole('link', { name: /email/i });
    expect(emailLink).not.toHaveAttribute('aria-current');
  });

  it('should render correct hrefs for all sections', () => {
    mockedUsePathname.mockReturnValue('/settings');

    render(<SettingsSidebar />);

    expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute(
      'href',
      '/settings'
    );
    expect(screen.getByRole('link', { name: /email/i })).toHaveAttribute(
      'href',
      '/settings/email'
    );
    expect(screen.getByRole('link', { name: /password/i })).toHaveAttribute(
      'href',
      '/settings/password'
    );
    expect(screen.getByRole('link', { name: /account/i })).toHaveAttribute(
      'href',
      '/settings/account'
    );
  });

  it('should apply danger styling to Account section', () => {
    mockedUsePathname.mockReturnValue('/settings');

    render(<SettingsSidebar />);

    const accountLink = screen.getByRole('link', { name: /account/i });
    expect(accountLink).toHaveClass('text-red-600');
  });

  it('should have accessible navigation label', () => {
    mockedUsePathname.mockReturnValue('/settings');

    render(<SettingsSidebar />);

    const nav = screen.getByRole('navigation', {
      name: /settings navigation/i,
    });
    expect(nav).toBeInTheDocument();
  });

  it('should highlight different sections based on pathname', () => {
    mockedUsePathname.mockReturnValue('/settings/email');

    render(<SettingsSidebar />);

    const emailLink = screen.getByRole('link', { name: /email/i });
    expect(emailLink).toHaveAttribute('aria-current', 'page');

    const profileLink = screen.getByRole('link', { name: /profile/i });
    expect(profileLink).not.toHaveAttribute('aria-current');
  });
});
