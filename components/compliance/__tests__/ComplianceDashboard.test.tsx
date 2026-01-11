/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComplianceDashboard } from '../ComplianceDashboard';
import { type ComplianceItemFull } from '@/types/api';

// Mock dependencies
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock fetch
const mockFetch = jest.fn();
const originalFetch = global.fetch;
global.fetch = mockFetch;

describe('ComplianceDashboard', () => {
  const mockAgencyId = 'agency-123';

  const mockComplianceData: ComplianceItemFull[] = [
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('Rendering', () => {
    it('renders ComplianceSettings component with initial data', () => {
      render(
        <ComplianceDashboard
          agencyId={mockAgencyId}
          initialData={mockComplianceData}
        />
      );

      expect(
        screen.getByText('Compliance & Certifications')
      ).toBeInTheDocument();
    });

    it('displays initial data correctly with active items checked', () => {
      render(
        <ComplianceDashboard
          agencyId={mockAgencyId}
          initialData={mockComplianceData}
        />
      );

      // OSHA should be toggled on (based on initial data isActive: true)
      const oshaSwitch = screen.getByRole('switch', {
        name: /OSHA Certified/i,
      });
      expect(oshaSwitch).toHaveAttribute('data-state', 'checked');
    });

    it('renders all 6 compliance types', () => {
      render(<ComplianceDashboard agencyId={mockAgencyId} initialData={[]} />);

      const switches = screen.getAllByRole('switch');
      expect(switches).toHaveLength(6);
    });
  });

  describe('Save Functionality', () => {
    it('calls API on save and shows success toast', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
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
          ],
        }),
      });

      render(<ComplianceDashboard agencyId={mockAgencyId} initialData={[]} />);

      // Turn on OSHA switch
      const oshaSwitch = screen.getByRole('switch', {
        name: /OSHA Certified/i,
      });
      await user.click(oshaSwitch);

      // Click save
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/dashboard/compliance', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.any(String),
        });
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Changes saved',
          description: 'Your compliance settings have been updated.',
        });
      });
    });

    it('shows error toast on API failure', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () =>
          JSON.stringify({ error: { message: 'Failed to update' } }),
      });

      render(<ComplianceDashboard agencyId={mockAgencyId} initialData={[]} />);

      // Turn on OSHA switch
      const oshaSwitch = screen.getByRole('switch', {
        name: /OSHA Certified/i,
      });
      await user.click(oshaSwitch);

      // Click save
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to update',
          variant: 'destructive',
        });
      });
    });

    it('handles network error', async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<ComplianceDashboard agencyId={mockAgencyId} initialData={[]} />);

      // Turn on OSHA switch
      const oshaSwitch = screen.getByRole('switch', {
        name: /OSHA Certified/i,
      });
      await user.click(oshaSwitch);

      // Click save
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Network error',
          variant: 'destructive',
        });
      });
    });

    it('sends correct data format to API', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      render(<ComplianceDashboard agencyId={mockAgencyId} initialData={[]} />);

      // Turn on OSHA switch
      const oshaSwitch = screen.getByRole('switch', {
        name: /OSHA Certified/i,
      });
      await user.click(oshaSwitch);

      // Click save
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(body.items).toBeDefined();
      expect(Array.isArray(body.items)).toBe(true);
      expect(body.items).toContainEqual(
        expect.objectContaining({
          type: 'osha_certified',
          isActive: true,
        })
      );
    });
  });

  describe('Loading State', () => {
    it('disables controls during save', async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      const promise = new Promise<Response>((resolve) => {
        resolvePromise = () =>
          resolve({
            ok: true,
            json: async () => ({ data: [] }),
            text: async () => JSON.stringify({ data: [] }),
          } as Response);
      });
      mockFetch.mockReturnValueOnce(promise);

      render(<ComplianceDashboard agencyId={mockAgencyId} initialData={[]} />);

      // Turn on OSHA switch
      const oshaSwitch = screen.getByRole('switch', {
        name: /OSHA Certified/i,
      });
      await user.click(oshaSwitch);

      // Click save
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
  });

  describe('Empty State', () => {
    it('handles empty initial data', () => {
      render(<ComplianceDashboard agencyId={mockAgencyId} initialData={[]} />);

      // All switches should be unchecked
      const switches = screen.getAllByRole('switch');
      for (const switchEl of switches) {
        expect(switchEl).toHaveAttribute('data-state', 'unchecked');
      }
    });
  });
});
