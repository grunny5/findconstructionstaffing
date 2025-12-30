import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminAgenciesActions } from '../AdminAgenciesActions';

describe('AdminAgenciesActions', () => {
  it('renders all action buttons', () => {
    render(<AdminAgenciesActions />);

    expect(screen.getByTestId('download-template-button')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-import-button')).toBeInTheDocument();
    expect(screen.getByTestId('create-agency-button')).toBeInTheDocument();
  });

  it('renders Download Template button with correct link', () => {
    render(<AdminAgenciesActions />);

    const downloadButton = screen.getByTestId('download-template-button');
    expect(downloadButton).toHaveAttribute(
      'href',
      '/api/admin/agencies/template'
    );
  });

  it('Bulk Import button is enabled', () => {
    render(<AdminAgenciesActions />);

    expect(screen.getByTestId('bulk-import-button')).not.toBeDisabled();
  });

  it('Create Agency button is disabled (pending implementation)', () => {
    render(<AdminAgenciesActions />);

    expect(screen.getByTestId('create-agency-button')).toBeDisabled();
  });

  it('opens BulkImportModal when Bulk Import button is clicked', async () => {
    render(<AdminAgenciesActions />);

    await userEvent.click(screen.getByTestId('bulk-import-button'));

    expect(screen.getByTestId('bulk-import-modal')).toBeInTheDocument();
  });

  it('closes BulkImportModal when cancel is clicked', async () => {
    render(<AdminAgenciesActions />);

    await userEvent.click(screen.getByTestId('bulk-import-button'));
    expect(screen.getByTestId('bulk-import-modal')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('cancel-button'));
    expect(screen.queryByTestId('bulk-import-modal')).not.toBeInTheDocument();
  });
});
