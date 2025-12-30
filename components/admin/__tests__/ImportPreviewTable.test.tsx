import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportPreviewTable } from '../ImportPreviewTable';
import type {
  RowValidationResult,
  ValidationSummary,
} from '@/app/api/admin/agencies/bulk-import/preview/route';

const createMockRow = (
  overrides: Partial<RowValidationResult> = {}
): RowValidationResult => ({
  rowNumber: 2,
  valid: true,
  errors: [],
  warnings: [],
  data: {
    _rowNumber: 2,
    name: 'Test Agency',
    description: 'Test description',
    email: 'test@example.com',
    headquarters: 'New York',
    trades: ['Electrician', 'Plumber'],
  },
  ...overrides,
});

const createMockSummary = (
  overrides: Partial<ValidationSummary> = {}
): ValidationSummary => ({
  total: 5,
  valid: 3,
  invalid: 1,
  withWarnings: 1,
  ...overrides,
});

describe('ImportPreviewTable', () => {
  const defaultProps = {
    rows: [createMockRow()],
    summary: createMockSummary(),
    onBack: jest.fn(),
    onImport: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component with summary bar', () => {
      render(<ImportPreviewTable {...defaultProps} />);

      expect(screen.getByTestId('import-preview-table')).toBeInTheDocument();
      expect(screen.getByTestId('summary-bar')).toBeInTheDocument();
    });

    it('displays correct summary counts', () => {
      render(<ImportPreviewTable {...defaultProps} />);

      expect(screen.getByTestId('summary-total')).toHaveTextContent(
        '5 total rows'
      );
      expect(screen.getByTestId('summary-valid')).toHaveTextContent('3 valid');
      expect(screen.getByTestId('summary-invalid')).toHaveTextContent(
        '1 invalid'
      );
      expect(screen.getByTestId('summary-warnings')).toHaveTextContent(
        '1 with warnings'
      );
    });

    it('renders table headers', () => {
      render(<ImportPreviewTable {...defaultProps} />);

      expect(
        screen.getByRole('columnheader', { name: /row/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: /status/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: /name/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: /description/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: /email/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: /headquarters/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: /trades/i })
      ).toBeInTheDocument();
    });

    it('renders row data correctly', () => {
      const row = createMockRow({
        data: {
          _rowNumber: 2,
          name: 'ABC Construction',
          description: 'A great company',
          email: 'info@abc.com',
          headquarters: 'Los Angeles',
          trades: ['Carpenter', 'Mason'],
        },
      });

      render(<ImportPreviewTable {...defaultProps} rows={[row]} />);

      expect(screen.getByText('ABC Construction')).toBeInTheDocument();
      expect(screen.getByText('A great company')).toBeInTheDocument();
      expect(screen.getByText('info@abc.com')).toBeInTheDocument();
      expect(screen.getByText('Los Angeles')).toBeInTheDocument();
      expect(screen.getByText('Carpenter, Mason')).toBeInTheDocument();
    });

    it('shows em dash for missing optional fields', () => {
      const row = createMockRow({
        data: {
          _rowNumber: 2,
          name: 'Minimal Agency',
        },
      });

      render(<ImportPreviewTable {...defaultProps} rows={[row]} />);

      // Check that em dashes are rendered for missing fields
      const cells = screen.getAllByText('—');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('shows empty state when no rows', () => {
      render(
        <ImportPreviewTable
          {...defaultProps}
          rows={[]}
          summary={{ total: 0, valid: 0, invalid: 0, withWarnings: 0 }}
        />
      );

      expect(screen.getByText('No rows to preview')).toBeInTheDocument();
    });
  });

  describe('Status Icons', () => {
    it('shows green checkmark for valid rows', () => {
      const row = createMockRow({ valid: true, errors: [], warnings: [] });
      render(<ImportPreviewTable {...defaultProps} rows={[row]} />);

      expect(screen.getByTestId('status-icon-valid')).toBeInTheDocument();
    });

    it('shows red X for invalid rows', () => {
      const row = createMockRow({
        valid: false,
        errors: ['Name is required'],
      });
      render(<ImportPreviewTable {...defaultProps} rows={[row]} />);

      expect(screen.getByTestId('status-icon-invalid')).toBeInTheDocument();
    });

    it('shows yellow triangle for rows with warnings', () => {
      const row = createMockRow({
        valid: true,
        warnings: ['Unknown trade: Roofer'],
      });
      render(<ImportPreviewTable {...defaultProps} rows={[row]} />);

      expect(screen.getByTestId('status-icon-warning')).toBeInTheDocument();
    });
  });

  describe('Expandable Details', () => {
    it('shows expand button for rows with errors', () => {
      const row = createMockRow({
        rowNumber: 3,
        valid: false,
        errors: ['Name is required'],
      });
      render(<ImportPreviewTable {...defaultProps} rows={[row]} />);

      expect(screen.getByTestId('expand-button-3')).toBeInTheDocument();
    });

    it('shows expand button for rows with warnings', () => {
      const row = createMockRow({
        rowNumber: 4,
        valid: true,
        warnings: ['Unknown trade'],
      });
      render(<ImportPreviewTable {...defaultProps} rows={[row]} />);

      expect(screen.getByTestId('expand-button-4')).toBeInTheDocument();
    });

    it('does not show expand button for valid rows without warnings', () => {
      const row = createMockRow({
        rowNumber: 5,
        valid: true,
        errors: [],
        warnings: [],
      });
      render(<ImportPreviewTable {...defaultProps} rows={[row]} />);

      expect(screen.queryByTestId('expand-button-5')).not.toBeInTheDocument();
    });

    it('expands row to show errors when clicked', async () => {
      const user = userEvent.setup();
      const row = createMockRow({
        rowNumber: 6,
        valid: false,
        errors: ['Name is required', 'Email is invalid'],
      });
      render(<ImportPreviewTable {...defaultProps} rows={[row]} />);

      // Click expand button
      await user.click(screen.getByTestId('expand-button-6'));

      // Check details row is visible
      expect(screen.getByTestId('details-row-6')).toBeInTheDocument();
      expect(screen.getByTestId('errors-6')).toBeInTheDocument();
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is invalid')).toBeInTheDocument();
    });

    it('expands row to show warnings when clicked', async () => {
      const user = userEvent.setup();
      const row = createMockRow({
        rowNumber: 7,
        valid: true,
        warnings: ['Unknown trade: Roofer', 'Unknown region: ZZ'],
      });
      render(<ImportPreviewTable {...defaultProps} rows={[row]} />);

      await user.click(screen.getByTestId('expand-button-7'));

      expect(screen.getByTestId('details-row-7')).toBeInTheDocument();
      expect(screen.getByTestId('warnings-7')).toBeInTheDocument();
      expect(screen.getByText('Unknown trade: Roofer')).toBeInTheDocument();
      expect(screen.getByText('Unknown region: ZZ')).toBeInTheDocument();
    });

    it('collapses row when clicked again', async () => {
      const user = userEvent.setup();
      const row = createMockRow({
        rowNumber: 8,
        valid: false,
        errors: ['Name is required'],
      });
      render(<ImportPreviewTable {...defaultProps} rows={[row]} />);

      // Expand
      await user.click(screen.getByTestId('expand-button-8'));
      expect(screen.getByTestId('details-row-8')).toBeInTheDocument();

      // Collapse
      await user.click(screen.getByTestId('expand-button-8'));
      expect(screen.queryByTestId('details-row-8')).not.toBeInTheDocument();
    });

    it('expands row when clicking on the row itself', async () => {
      const user = userEvent.setup();
      const row = createMockRow({
        rowNumber: 9,
        valid: false,
        errors: ['Error message'],
      });
      render(<ImportPreviewTable {...defaultProps} rows={[row]} />);

      // Click the row
      await user.click(screen.getByTestId('preview-row-9'));
      expect(screen.getByTestId('details-row-9')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('renders back button', () => {
      render(<ImportPreviewTable {...defaultProps} />);

      expect(screen.getByTestId('back-button')).toBeInTheDocument();
      expect(screen.getByTestId('back-button')).toHaveTextContent('Back');
    });

    it('calls onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      const onBack = jest.fn();
      render(<ImportPreviewTable {...defaultProps} onBack={onBack} />);

      await user.click(screen.getByTestId('back-button'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('renders import button with valid row count', () => {
      render(
        <ImportPreviewTable
          {...defaultProps}
          summary={createMockSummary({ valid: 5 })}
        />
      );

      expect(screen.getByTestId('import-button')).toHaveTextContent(
        'Import 5 Valid Rows'
      );
    });

    it('uses singular "Row" when only one valid row', () => {
      render(
        <ImportPreviewTable
          {...defaultProps}
          summary={createMockSummary({ valid: 1 })}
        />
      );

      expect(screen.getByTestId('import-button')).toHaveTextContent(
        'Import 1 Valid Row'
      );
    });

    it('calls onImport when import button is clicked', async () => {
      const user = userEvent.setup();
      const onImport = jest.fn();
      render(<ImportPreviewTable {...defaultProps} onImport={onImport} />);

      await user.click(screen.getByTestId('import-button'));
      expect(onImport).toHaveBeenCalledTimes(1);
    });

    it('disables import button when no valid rows', () => {
      render(
        <ImportPreviewTable
          {...defaultProps}
          summary={createMockSummary({ valid: 0, invalid: 5 })}
        />
      );

      expect(screen.getByTestId('import-button')).toBeDisabled();
    });

    it('enables import button when there are valid rows', () => {
      render(
        <ImportPreviewTable
          {...defaultProps}
          summary={createMockSummary({ valid: 3 })}
        />
      );

      expect(screen.getByTestId('import-button')).not.toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('disables back button when importing', () => {
      render(<ImportPreviewTable {...defaultProps} isImporting={true} />);

      expect(screen.getByTestId('back-button')).toBeDisabled();
    });

    it('disables import button when importing', () => {
      render(<ImportPreviewTable {...defaultProps} isImporting={true} />);

      expect(screen.getByTestId('import-button')).toBeDisabled();
    });

    it('shows "Importing..." text when importing', () => {
      render(<ImportPreviewTable {...defaultProps} isImporting={true} />);

      expect(screen.getByTestId('import-button')).toHaveTextContent(
        'Importing...'
      );
    });
  });

  describe('Multiple Rows', () => {
    it('renders multiple rows correctly', () => {
      const rows = [
        createMockRow({
          rowNumber: 2,
          data: { _rowNumber: 2, name: 'Agency A' },
        }),
        createMockRow({
          rowNumber: 3,
          data: { _rowNumber: 3, name: 'Agency B' },
        }),
        createMockRow({
          rowNumber: 4,
          data: { _rowNumber: 4, name: 'Agency C' },
        }),
      ];

      render(
        <ImportPreviewTable
          {...defaultProps}
          rows={rows}
          summary={createMockSummary({ total: 3, valid: 3 })}
        />
      );

      expect(screen.getByText('Agency A')).toBeInTheDocument();
      expect(screen.getByText('Agency B')).toBeInTheDocument();
      expect(screen.getByText('Agency C')).toBeInTheDocument();
    });

    it('can expand multiple rows independently', async () => {
      const user = userEvent.setup();
      const rows = [
        createMockRow({
          rowNumber: 2,
          valid: false,
          errors: ['Error for row 2'],
          data: { _rowNumber: 2, name: 'Agency A' },
        }),
        createMockRow({
          rowNumber: 3,
          valid: false,
          errors: ['Error for row 3'],
          data: { _rowNumber: 3, name: 'Agency B' },
        }),
      ];

      render(<ImportPreviewTable {...defaultProps} rows={rows} />);

      // Expand first row
      await user.click(screen.getByTestId('expand-button-2'));
      expect(screen.getByTestId('details-row-2')).toBeInTheDocument();
      expect(screen.queryByTestId('details-row-3')).not.toBeInTheDocument();

      // Expand second row
      await user.click(screen.getByTestId('expand-button-3'));
      expect(screen.getByTestId('details-row-2')).toBeInTheDocument();
      expect(screen.getByTestId('details-row-3')).toBeInTheDocument();
    });
  });

  describe('Row Styling', () => {
    it('applies red background to invalid rows', () => {
      const row = createMockRow({
        rowNumber: 2,
        valid: false,
        errors: ['Error'],
      });
      render(<ImportPreviewTable {...defaultProps} rows={[row]} />);

      const previewRow = screen.getByTestId('preview-row-2');
      expect(previewRow).toHaveClass('bg-red-50/50');
    });

    it('applies yellow background to warning rows', () => {
      const row = createMockRow({
        rowNumber: 2,
        valid: true,
        warnings: ['Warning'],
      });
      render(<ImportPreviewTable {...defaultProps} rows={[row]} />);

      const previewRow = screen.getByTestId('preview-row-2');
      expect(previewRow).toHaveClass('bg-yellow-50/50');
    });

    it('does not apply colored background to valid rows without warnings', () => {
      const row = createMockRow({
        rowNumber: 2,
        valid: true,
        errors: [],
        warnings: [],
      });
      render(<ImportPreviewTable {...defaultProps} rows={[row]} />);

      const previewRow = screen.getByTestId('preview-row-2');
      expect(previewRow).not.toHaveClass('bg-red-50/50');
      expect(previewRow).not.toHaveClass('bg-yellow-50/50');
    });
  });

  describe('Tooltip', () => {
    it('shows valid tooltip on hover', async () => {
      const user = userEvent.setup();
      const row = createMockRow({ valid: true, errors: [], warnings: [] });
      render(<ImportPreviewTable {...defaultProps} rows={[row]} />);

      const statusIcon = screen.getByTestId('status-icon-valid');
      await user.hover(statusIcon);

      // Tooltip renders text in multiple elements (visual + a11y), so use findAllByText
      const tooltipTexts = await screen.findAllByText(
        'Valid - ready to import'
      );
      expect(tooltipTexts.length).toBeGreaterThan(0);
    });

    it('shows invalid tooltip with error count on hover', async () => {
      const user = userEvent.setup();
      const row = createMockRow({
        valid: false,
        errors: ['Error 1', 'Error 2'],
      });
      render(<ImportPreviewTable {...defaultProps} rows={[row]} />);

      const statusIcon = screen.getByTestId('status-icon-invalid');
      await user.hover(statusIcon);

      // Tooltip renders text in multiple elements (visual + a11y), so use findAllByText
      const tooltipTexts = await screen.findAllByText('Invalid - 2 error(s)');
      expect(tooltipTexts.length).toBeGreaterThan(0);
    });

    it('shows warning tooltip with warning count on hover', async () => {
      const user = userEvent.setup();
      const row = createMockRow({
        valid: true,
        warnings: ['Warning 1', 'Warning 2', 'Warning 3'],
      });
      render(<ImportPreviewTable {...defaultProps} rows={[row]} />);

      const statusIcon = screen.getByTestId('status-icon-warning');
      await user.hover(statusIcon);

      // Tooltip renders text in multiple elements (visual + a11y), so use findAllByText
      const tooltipTexts = await screen.findAllByText(
        'Valid with 3 warning(s)'
      );
      expect(tooltipTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Scroll Area', () => {
    it('renders scroll area for large datasets', () => {
      render(<ImportPreviewTable {...defaultProps} />);

      expect(screen.getByTestId('table-scroll-area')).toBeInTheDocument();
    });
  });

  describe('Performance with Large Datasets', () => {
    it('handles 500+ rows without crashing', () => {
      const rows: RowValidationResult[] = [];
      for (let i = 2; i <= 502; i++) {
        rows.push(
          createMockRow({
            rowNumber: i,
            data: { _rowNumber: i, name: `Agency ${i}` },
          })
        );
      }

      const summary = createMockSummary({ total: 500, valid: 500 });

      // Should not throw
      expect(() => {
        render(
          <ImportPreviewTable {...defaultProps} rows={rows} summary={summary} />
        );
      }).not.toThrow();

      // Verify summary displays correctly
      expect(screen.getByTestId('summary-total')).toHaveTextContent(
        '500 total rows'
      );
    });
  });
});
