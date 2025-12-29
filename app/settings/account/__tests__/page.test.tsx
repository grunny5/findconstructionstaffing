/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import SettingsAccountPage from '../page';

describe('SettingsAccountPage', () => {
  it('should render page header with industrial styling', () => {
    render(<SettingsAccountPage />);

    const header = screen.getByText('ACCOUNT SETTINGS');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('font-display');
    expect(header).toHaveClass('text-2xl');
    expect(header).toHaveClass('text-industrial-graphite-600');
  });

  it('should render page description', () => {
    render(<SettingsAccountPage />);

    expect(
      screen.getByText('Manage your account and danger zone actions')
    ).toBeInTheDocument();
  });

  it('should render Danger Zone card with industrial orange styling', () => {
    const { container } = render(<SettingsAccountPage />);

    // Check for the danger zone title
    const dangerZoneTitle = screen.getByText('DANGER ZONE');
    expect(dangerZoneTitle).toBeInTheDocument();
    expect(dangerZoneTitle).toHaveClass('font-display');
    expect(dangerZoneTitle).toHaveClass('text-industrial-orange');

    // Check for the card with orange border
    const card = container.querySelector('.border-industrial-orange');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('border-2');
    expect(card).toHaveClass('rounded-industrial-sharp');
  });

  it('should render Danger Zone description', () => {
    render(<SettingsAccountPage />);

    expect(
      screen.getByText('Irreversible actions that affect your account')
    ).toBeInTheDocument();
  });

  it('should render placeholder content for future implementation', () => {
    render(<SettingsAccountPage />);

    expect(
      screen.getByText(
        /Account deletion and other critical actions will be implemented/i
      )
    ).toBeInTheDocument();
  });

  it('should have industrial design tokens applied', () => {
    const { container } = render(<SettingsAccountPage />);

    // Check for industrial background on placeholder
    const placeholder = container.querySelector('.bg-industrial-orange-100');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveClass('rounded-industrial-sharp');

    // Check for industrial card background
    const card = container.querySelector('.bg-industrial-bg-card');
    expect(card).toBeInTheDocument();
  });

  it('should use Barlow font for body text', () => {
    render(<SettingsAccountPage />);

    const description = screen.getByText(
      'Manage your account and danger zone actions'
    );
    expect(description).toHaveClass('font-body');
    expect(description).toHaveClass('text-sm');
    expect(description).toHaveClass('text-industrial-graphite-400');
  });
});
