/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComplianceFilters } from '../ComplianceFilters';
import { ComplianceType } from '@/types/api';

describe('ComplianceFilters', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all 6 compliance types', () => {
      render(<ComplianceFilters selectedFilters={[]} onChange={mockOnChange} />);

      expect(screen.getByText('OSHA Certified')).toBeInTheDocument();
      expect(screen.getByText('Drug Testing Policy')).toBeInTheDocument();
      expect(screen.getByText('Background Checks')).toBeInTheDocument();
      expect(screen.getByText("Workers' Compensation")).toBeInTheDocument();
      expect(screen.getByText('General Liability Insurance')).toBeInTheDocument();
      expect(screen.getByText('Bonding/Surety Bond')).toBeInTheDocument();
    });

    it('renders header', () => {
      render(<ComplianceFilters selectedFilters={[]} onChange={mockOnChange} />);

      expect(screen.getByText('Compliance Requirements')).toBeInTheDocument();
    });

    it('renders checkboxes for each compliance type', () => {
      render(<ComplianceFilters selectedFilters={[]} onChange={mockOnChange} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(6);
    });

    it('renders icons for each compliance type', () => {
      const { container } = render(
        <ComplianceFilters selectedFilters={[]} onChange={mockOnChange} />
      );

      const icons = container.querySelectorAll('svg');
      // Should have at least 6 icons (one per compliance type)
      expect(icons.length).toBeGreaterThanOrEqual(6);
    });

    it('renders descriptions for each compliance type', () => {
      render(<ComplianceFilters selectedFilters={[]} onChange={mockOnChange} />);

      expect(
        screen.getByText(/OSHA 10\/30 safety training certification/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Pre-employment and random drug testing program/)
      ).toBeInTheDocument();
    });

    it('does not render clear all button when no filters selected', () => {
      render(<ComplianceFilters selectedFilters={[]} onChange={mockOnChange} />);

      expect(screen.queryByText('Clear all')).not.toBeInTheDocument();
    });

    it('does not render selected count badge when no filters selected', () => {
      render(<ComplianceFilters selectedFilters={[]} onChange={mockOnChange} />);

      expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
    });

    it('does not render help text when no filters selected', () => {
      render(<ComplianceFilters selectedFilters={[]} onChange={mockOnChange} />);

      expect(
        screen.queryByText(/Showing agencies with all selected compliance/)
      ).not.toBeInTheDocument();
    });
  });

  describe('Selected State', () => {
    it('renders selected count badge when filters are selected', () => {
      render(
        <ComplianceFilters
          selectedFilters={['osha_certified', 'drug_testing']}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    it('renders clear all button when filters are selected', () => {
      render(
        <ComplianceFilters
          selectedFilters={['osha_certified']}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });

    it('renders help text when filters are selected', () => {
      render(
        <ComplianceFilters
          selectedFilters={['osha_certified']}
          onChange={mockOnChange}
        />
      );

      expect(
        screen.getByText(
          'Showing agencies with all selected compliance certifications'
        )
      ).toBeInTheDocument();
    });

    it('marks selected checkboxes as checked', () => {
      render(
        <ComplianceFilters
          selectedFilters={['osha_certified', 'drug_testing']}
          onChange={mockOnChange}
        />
      );

      const oshaCheckbox = screen.getByLabelText(/OSHA Certified/);
      const drugTestCheckbox = screen.getByLabelText(/Drug Testing Policy/);
      const backgroundCheckbox = screen.getByLabelText(/Background Checks/);

      expect(oshaCheckbox).toBeChecked();
      expect(drugTestCheckbox).toBeChecked();
      expect(backgroundCheckbox).not.toBeChecked();
    });
  });

  describe('User Interactions', () => {
    it('calls onChange when checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<ComplianceFilters selectedFilters={[]} onChange={mockOnChange} />);

      const oshaCheckbox = screen.getByLabelText(/OSHA Certified/);
      await user.click(oshaCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith(['osha_certified']);
    });

    it('adds compliance type when unchecked box is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ComplianceFilters
          selectedFilters={['osha_certified']}
          onChange={mockOnChange}
        />
      );

      const drugTestCheckbox = screen.getByLabelText(/Drug Testing Policy/);
      await user.click(drugTestCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith([
        'osha_certified',
        'drug_testing',
      ]);
    });

    it('removes compliance type when checked box is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ComplianceFilters
          selectedFilters={['osha_certified', 'drug_testing']}
          onChange={mockOnChange}
        />
      );

      const oshaCheckbox = screen.getByLabelText(/OSHA Certified/);
      await user.click(oshaCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith(['drug_testing']);
    });

    it('clears all filters when clear all button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ComplianceFilters
          selectedFilters={['osha_certified', 'drug_testing']}
          onChange={mockOnChange}
        />
      );

      const clearButton = screen.getByText('Clear all');
      await user.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    it('can select all compliance types', async () => {
      const user = userEvent.setup();
      const allTypes: ComplianceType[] = [
        'osha_certified',
        'drug_testing',
        'background_checks',
        'workers_comp',
        'general_liability',
        'bonding',
      ];

      const { rerender } = render(
        <ComplianceFilters selectedFilters={[]} onChange={mockOnChange} />
      );

      // Click each checkbox using specific label text
      await user.click(screen.getByLabelText(/OSHA Certified/));
      await user.click(screen.getByLabelText(/Drug Testing Policy/));
      await user.click(screen.getByLabelText(/Background Checks/));
      await user.click(screen.getByLabelText(/Workers' Compensation/));
      await user.click(screen.getByLabelText(/General Liability Insurance/));
      await user.click(screen.getByLabelText(/Bonding\/Surety Bond/));

      // Should have been called 6 times
      expect(mockOnChange).toHaveBeenCalledTimes(6);

      // Re-render with all selected
      rerender(
        <ComplianceFilters selectedFilters={allTypes} onChange={mockOnChange} />
      );

      expect(screen.getByText('6 selected')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('applies custom className to root element', () => {
      const { container } = render(
        <ComplianceFilters
          selectedFilters={[]}
          onChange={mockOnChange}
          className="custom-class"
        />
      );

      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement).toHaveClass('custom-class');
      expect(rootElement).toHaveClass('space-y-3');
    });
  });

  describe('Accessibility', () => {
    it('associates labels with checkboxes', () => {
      render(<ComplianceFilters selectedFilters={[]} onChange={mockOnChange} />);

      const oshaCheckbox = screen.getByLabelText(/OSHA Certified/);
      expect(oshaCheckbox).toBeInTheDocument();
      expect(oshaCheckbox).toHaveAttribute('role', 'checkbox');
    });

    it('renders clickable labels', async () => {
      const user = userEvent.setup();
      render(<ComplianceFilters selectedFilters={[]} onChange={mockOnChange} />);

      // Click the label text instead of checkbox
      const label = screen.getByText('OSHA Certified');
      await user.click(label);

      expect(mockOnChange).toHaveBeenCalledWith(['osha_certified']);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty selectedFilters array', () => {
      render(<ComplianceFilters selectedFilters={[]} onChange={mockOnChange} />);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });
    });

    it('handles all filters selected', () => {
      const allTypes: ComplianceType[] = [
        'osha_certified',
        'drug_testing',
        'background_checks',
        'workers_comp',
        'general_liability',
        'bonding',
      ];

      render(
        <ComplianceFilters selectedFilters={allTypes} onChange={mockOnChange} />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });

      expect(screen.getByText('6 selected')).toBeInTheDocument();
    });

    it('handles rapid toggling', async () => {
      const user = userEvent.setup();
      render(<ComplianceFilters selectedFilters={[]} onChange={mockOnChange} />);

      const oshaCheckbox = screen.getByLabelText(/OSHA Certified/);

      // Click multiple times rapidly
      await user.click(oshaCheckbox);
      await user.click(oshaCheckbox);
      await user.click(oshaCheckbox);

      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });
  });
});
