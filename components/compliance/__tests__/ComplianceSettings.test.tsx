/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComplianceSettings, ComplianceFormData } from '../ComplianceSettings';
import {
  COMPLIANCE_TYPES,
  COMPLIANCE_DISPLAY_NAMES,
  type ComplianceItemFull,
} from '@/types/api';

describe('ComplianceSettings', () => {
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all 6 compliance types', () => {
      render(<ComplianceSettings onSave={mockOnSave} />);

      for (const type of COMPLIANCE_TYPES) {
        expect(
          screen.getByText(COMPLIANCE_DISPLAY_NAMES[type])
        ).toBeInTheDocument();
      }
    });

    it('renders page header with industrial styling', () => {
      render(<ComplianceSettings onSave={mockOnSave} />);

      const header = screen.getByText('Compliance & Certifications');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('font-display');
      expect(header).toHaveClass('uppercase');
    });

    it('renders description text', () => {
      render(<ComplianceSettings onSave={mockOnSave} />);

      expect(
        screen.getByText(
          /Toggle the compliance certifications your agency maintains/
        )
      ).toBeInTheDocument();
    });

    it('renders a switch for each compliance type', () => {
      render(<ComplianceSettings onSave={mockOnSave} />);

      const switches = screen.getAllByRole('switch');
      expect(switches).toHaveLength(6);
    });

    it('renders save button', () => {
      render(<ComplianceSettings onSave={mockOnSave} />);

      expect(
        screen.getByRole('button', { name: /save changes/i })
      ).toBeInTheDocument();
    });

    it('save button is disabled initially (no changes)', () => {
      render(<ComplianceSettings onSave={mockOnSave} />);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Initial Data', () => {
    const initialData: ComplianceItemFull[] = [
      {
        id: '1',
        type: 'osha_certified',
        displayName: 'OSHA Certified',
        isActive: true,
        isVerified: true,
        expirationDate: '2026-12-31',
        isExpired: false,
        documentUrl: null,
        notes: null,
        verifiedBy: null,
        verifiedAt: null,
      },
      {
        id: '2',
        type: 'drug_testing',
        displayName: 'Drug Testing Policy',
        isActive: true,
        isVerified: false,
        expirationDate: null,
        isExpired: false,
        documentUrl: null,
        notes: null,
        verifiedBy: null,
        verifiedAt: null,
      },
    ];

    it('pre-populates switches from initial data', () => {
      render(
        <ComplianceSettings initialData={initialData} onSave={mockOnSave} />
      );

      const switches = screen.getAllByRole('switch');
      // OSHA and Drug Testing should be checked
      expect(switches[0]).toHaveAttribute('data-state', 'checked');
      expect(switches[1]).toHaveAttribute('data-state', 'checked');
      // Others should be unchecked
      expect(switches[2]).toHaveAttribute('data-state', 'unchecked');
    });

    it('shows verified badge for verified items', () => {
      render(
        <ComplianceSettings initialData={initialData} onSave={mockOnSave} />
      );

      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('shows expiration date input for active items', () => {
      render(
        <ComplianceSettings initialData={initialData} onSave={mockOnSave} />
      );

      // Should have date inputs for the 2 active items
      const dateInputs = screen.getAllByLabelText(/expiration date/i);
      expect(dateInputs).toHaveLength(2);
    });

    it('pre-populates expiration date value', () => {
      render(
        <ComplianceSettings initialData={initialData} onSave={mockOnSave} />
      );

      const dateInputs = screen.getAllByLabelText(/expiration date/i);
      expect(dateInputs[0]).toHaveValue('2026-12-31');
    });
  });

  describe('Expired Items', () => {
    const expiredData: ComplianceItemFull[] = [
      {
        id: '1',
        type: 'osha_certified',
        displayName: 'OSHA Certified',
        isActive: true,
        isVerified: true,
        expirationDate: '2024-01-01',
        isExpired: true,
        documentUrl: null,
        notes: null,
        verifiedBy: null,
        verifiedAt: null,
      },
    ];

    it('shows expired badge for expired items', () => {
      render(
        <ComplianceSettings initialData={expiredData} onSave={mockOnSave} />
      );

      expect(screen.getByText('Expired')).toBeInTheDocument();
    });
  });

  describe('Toggle Interactions', () => {
    it('toggles switch on click', async () => {
      const user = userEvent.setup();
      render(<ComplianceSettings onSave={mockOnSave} />);

      const switches = screen.getAllByRole('switch');
      const oshaSwitch = switches[0];

      expect(oshaSwitch).toHaveAttribute('data-state', 'unchecked');

      await user.click(oshaSwitch);

      expect(oshaSwitch).toHaveAttribute('data-state', 'checked');
    });

    it('shows expiration date input when switch is turned on', async () => {
      const user = userEvent.setup();
      render(<ComplianceSettings onSave={mockOnSave} />);

      // Initially no date inputs (all switches off)
      expect(screen.queryAllByLabelText(/expiration date/i)).toHaveLength(0);

      // Turn on OSHA
      const switches = screen.getAllByRole('switch');
      await user.click(switches[0]);

      // Now should have one date input
      expect(screen.getAllByLabelText(/expiration date/i)).toHaveLength(1);
    });

    it('hides expiration date input when switch is turned off', async () => {
      const user = userEvent.setup();
      const initialData: ComplianceItemFull[] = [
        {
          id: '1',
          type: 'osha_certified',
          displayName: 'OSHA Certified',
          isActive: true,
          isVerified: false,
          expirationDate: '2026-12-31',
          isExpired: false,
          documentUrl: null,
          notes: null,
          verifiedBy: null,
          verifiedAt: null,
        },
      ];

      render(
        <ComplianceSettings initialData={initialData} onSave={mockOnSave} />
      );

      // Initially one date input
      expect(screen.getAllByLabelText(/expiration date/i)).toHaveLength(1);

      // Turn off OSHA
      const switches = screen.getAllByRole('switch');
      await user.click(switches[0]);

      // Now no date inputs
      expect(screen.queryAllByLabelText(/expiration date/i)).toHaveLength(0);
    });

    it('enables save button after toggle change', async () => {
      const user = userEvent.setup();
      render(<ComplianceSettings onSave={mockOnSave} />);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();

      const switches = screen.getAllByRole('switch');
      await user.click(switches[0]);

      expect(saveButton).not.toBeDisabled();
    });

    it('shows Active/Inactive text based on switch state', async () => {
      const user = userEvent.setup();
      render(<ComplianceSettings onSave={mockOnSave} />);

      // All should show "Inactive" initially
      expect(screen.getAllByText('Inactive')).toHaveLength(6);
      expect(screen.queryByText('Active')).not.toBeInTheDocument();

      // Turn on first switch
      const switches = screen.getAllByRole('switch');
      await user.click(switches[0]);

      expect(screen.getAllByText('Inactive')).toHaveLength(5);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Date Input Interactions', () => {
    it('updates expiration date on change', async () => {
      const user = userEvent.setup();
      const initialData: ComplianceItemFull[] = [
        {
          id: '1',
          type: 'osha_certified',
          displayName: 'OSHA Certified',
          isActive: true,
          isVerified: false,
          expirationDate: null,
          isExpired: false,
          documentUrl: null,
          notes: null,
          verifiedBy: null,
          verifiedAt: null,
        },
      ];

      render(
        <ComplianceSettings initialData={initialData} onSave={mockOnSave} />
      );

      const dateInput = screen.getByLabelText(/expiration date/i);
      await user.clear(dateInput);
      await user.type(dateInput, '2027-06-15');

      expect(dateInput).toHaveValue('2027-06-15');
    });

    it('enables save button after date change', async () => {
      const user = userEvent.setup();
      const initialData: ComplianceItemFull[] = [
        {
          id: '1',
          type: 'osha_certified',
          displayName: 'OSHA Certified',
          isActive: true,
          isVerified: false,
          expirationDate: '2026-12-31',
          isExpired: false,
          documentUrl: null,
          notes: null,
          verifiedBy: null,
          verifiedAt: null,
        },
      ];

      render(
        <ComplianceSettings initialData={initialData} onSave={mockOnSave} />
      );

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();

      const dateInput = screen.getByLabelText(/expiration date/i);
      await user.clear(dateInput);
      await user.type(dateInput, '2027-01-01');

      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('calls onSave with form data on submit', async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);

      render(<ComplianceSettings onSave={mockOnSave} />);

      // Turn on OSHA
      const switches = screen.getAllByRole('switch');
      await user.click(switches[0]);

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      });

      const callArg = mockOnSave.mock.calls[0][0] as ComplianceFormData[];
      expect(callArg).toHaveLength(6);

      const oshaItem = callArg.find((item) => item.type === 'osha_certified');
      expect(oshaItem?.isActive).toBe(true);
    });

    it('shows saving state during submission', async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      mockOnSave.mockReturnValue(promise);

      render(<ComplianceSettings onSave={mockOnSave} />);

      // Turn on a switch
      const switches = screen.getAllByRole('switch');
      await user.click(switches[0]);

      // Submit
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Should show saving state
      expect(screen.getByText('Saving...')).toBeInTheDocument();

      // Resolve the promise
      resolvePromise!();

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });
    });

    it('disables form controls during submission', async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      mockOnSave.mockReturnValue(promise);

      const initialData: ComplianceItemFull[] = [
        {
          id: '1',
          type: 'osha_certified',
          displayName: 'OSHA Certified',
          isActive: true,
          isVerified: false,
          expirationDate: null,
          isExpired: false,
          documentUrl: null,
          notes: null,
          verifiedBy: null,
          verifiedAt: null,
        },
      ];

      render(
        <ComplianceSettings initialData={initialData} onSave={mockOnSave} />
      );

      // Make a change to enable save button
      const dateInput = screen.getByLabelText(/expiration date/i);
      await user.type(dateInput, '2027-01-01');

      // Submit
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Switches should be disabled
      const switches = screen.getAllByRole('switch');
      for (const switchEl of switches) {
        expect(switchEl).toBeDisabled();
      }

      // Resolve
      resolvePromise!();

      await waitFor(() => {
        expect(switches[0]).not.toBeDisabled();
      });
    });

    it('resets dirty state after successful save', async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);

      render(<ComplianceSettings onSave={mockOnSave} />);

      // Turn on a switch
      const switches = screen.getAllByRole('switch');
      await user.click(switches[0]);

      // Save button should be enabled
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).not.toBeDisabled();

      // Submit
      await user.click(saveButton);

      await waitFor(() => {
        // Save button should be disabled again (no dirty changes)
        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe('Loading State', () => {
    it('disables all controls when isLoading is true', () => {
      render(<ComplianceSettings onSave={mockOnSave} isLoading={true} />);

      const switches = screen.getAllByRole('switch');
      for (const switchEl of switches) {
        expect(switchEl).toBeDisabled();
      }

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Admin Mode', () => {
    it('does not show agency owner note when isAdmin is true', () => {
      render(<ComplianceSettings onSave={mockOnSave} isAdmin={true} />);

      expect(
        screen.queryByText(/Compliance items can be verified by our team/)
      ).not.toBeInTheDocument();
    });

    it('shows agency owner note when isAdmin is false', () => {
      render(<ComplianceSettings onSave={mockOnSave} isAdmin={false} />);

      expect(
        screen.getByText(/Compliance items can be verified by our team/)
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible labels for all switches', () => {
      render(<ComplianceSettings onSave={mockOnSave} />);

      for (const type of COMPLIANCE_TYPES) {
        const label = COMPLIANCE_DISPLAY_NAMES[type];
        expect(screen.getByLabelText(`Toggle ${label}`)).toBeInTheDocument();
      }
    });

    it('has proper form structure', () => {
      render(<ComplianceSettings onSave={mockOnSave} />);

      expect(
        screen.getByRole('button', { name: /save changes/i })
      ).toHaveAttribute('type', 'submit');
    });

    it('date inputs have proper labels', () => {
      const initialData: ComplianceItemFull[] = [
        {
          id: '1',
          type: 'osha_certified',
          displayName: 'OSHA Certified',
          isActive: true,
          isVerified: false,
          expirationDate: null,
          isExpired: false,
          documentUrl: null,
          notes: null,
          verifiedBy: null,
          verifiedAt: null,
        },
      ];

      render(
        <ComplianceSettings initialData={initialData} onSave={mockOnSave} />
      );

      const dateLabel = screen.getByText(/expiration date/i);
      expect(dateLabel).toBeInTheDocument();
      expect(dateLabel.tagName.toLowerCase()).toBe('label');
    });
  });

  describe('Industrial Design Styling', () => {
    it('uses industrial typography classes', () => {
      render(<ComplianceSettings onSave={mockOnSave} />);

      const header = screen.getByText('Compliance & Certifications');
      expect(header).toHaveClass('font-display');
    });

    it('save button has industrial styling', () => {
      const initialData: ComplianceItemFull[] = [
        {
          id: '1',
          type: 'osha_certified',
          displayName: 'OSHA Certified',
          isActive: true,
          isVerified: false,
          expirationDate: null,
          isExpired: false,
          documentUrl: null,
          notes: null,
          verifiedBy: null,
          verifiedAt: null,
        },
      ];

      render(
        <ComplianceSettings initialData={initialData} onSave={mockOnSave} />
      );

      // Make a change to enable button
      fireEvent.click(screen.getAllByRole('switch')[0]);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toHaveClass('bg-industrial-orange');
      expect(saveButton).toHaveClass('uppercase');
    });
  });
});
