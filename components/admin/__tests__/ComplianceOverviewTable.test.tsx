/**
 * Tests for ComplianceOverviewTable Component
 */

import { render, screen, fireEvent, within } from '@testing-library/react';
import { ComplianceOverviewTable } from '../ComplianceOverviewTable';
import { type ComplianceType } from '@/types/api';

// Helper to create mock compliance data row
function createMockRow(
  agencyName: string,
  complianceType: ComplianceType,
  daysUntilExpiration: number | null,
  isVerified = true,
  hasDocument = true
) {
  const today = new Date();
  const expirationDate =
    daysUntilExpiration !== null
      ? (() => {
          const date = new Date(today);
          date.setDate(today.getDate() + daysUntilExpiration);
          return date.toISOString().split('T')[0];
        })()
      : null;

  return {
    id: `${agencyName}-${complianceType}`,
    agency_id: `agency-${agencyName}`,
    compliance_type: complianceType,
    is_active: true,
    is_verified: isVerified,
    verified_by: isVerified ? 'admin-user-id' : null,
    verified_at: isVerified ? new Date().toISOString() : null,
    document_url: hasDocument ? 'https://example.com/doc.pdf' : null,
    expiration_date: expirationDate,
    notes: null,
    agencies: {
      id: `agency-${agencyName}`,
      name: agencyName,
      slug: agencyName.toLowerCase().replace(/\s+/g, '-'),
      is_active: true,
    },
  };
}

describe('ComplianceOverviewTable', () => {
  describe('Rendering', () => {
    it('should render empty state when no data', () => {
      render(<ComplianceOverviewTable complianceData={[]} />);

      expect(screen.getByText('No Compliance Issues')).toBeInTheDocument();
      expect(
        screen.getByText('All agencies are in good compliance standing.')
      ).toBeInTheDocument();
    });

    it('should render table with compliance data', () => {
      const data = [
        createMockRow('ABC Staffing', 'osha_certified', 15),
        createMockRow('XYZ Recruiting', 'workers_comp', 5),
      ];

      render(<ComplianceOverviewTable complianceData={data} />);

      expect(screen.getByText('ABC Staffing')).toBeInTheDocument();
      expect(screen.getByText('XYZ Recruiting')).toBeInTheDocument();
      expect(screen.getByText('OSHA Certified')).toBeInTheDocument();
      expect(screen.getByText("Workers' Compensation")).toBeInTheDocument();
    });

    it('should render table headers correctly', () => {
      const data = [createMockRow('ABC Staffing', 'osha_certified', 15)];

      render(<ComplianceOverviewTable complianceData={data} />);

      expect(screen.getByText('Agency')).toBeInTheDocument();
      expect(screen.getByText('Compliance Type')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Expiration Date')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should show results summary', () => {
      const data = [
        createMockRow('ABC Staffing', 'osha_certified', 15),
        createMockRow('XYZ Recruiting', 'workers_comp', 5),
        createMockRow('Best Agency', 'drug_testing', -5),
      ];

      render(<ComplianceOverviewTable complianceData={data} />);

      expect(
        screen.getByText('Showing 3 of 3 compliance issues')
      ).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('should display "Expired" badge for expired items', () => {
      const data = [createMockRow('ABC Staffing', 'osha_certified', -10)];

      render(<ComplianceOverviewTable complianceData={data} />);

      expect(screen.getByText('Expired')).toBeInTheDocument();
      expect(screen.getByText('10 days ago')).toBeInTheDocument();
    });

    it('should display "Expiring Soon" badge for items expiring within 30 days', () => {
      const data = [createMockRow('ABC Staffing', 'osha_certified', 15)];

      render(<ComplianceOverviewTable complianceData={data} />);

      expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
      expect(screen.getByText('15 days remaining')).toBeInTheDocument();
    });

    it('should display "Pending Verification" badge for unverified items with documents', () => {
      const data = [
        createMockRow('ABC Staffing', 'osha_certified', 15, false, true),
      ];

      render(<ComplianceOverviewTable complianceData={data} />);

      expect(screen.getByText('Pending Verification')).toBeInTheDocument();
      // Should not show days remaining for pending verification
      expect(screen.queryByText('15 days remaining')).not.toBeInTheDocument();
    });

    it('should format expiration date correctly', () => {
      const data = [createMockRow('ABC Staffing', 'osha_certified', 15)];

      render(<ComplianceOverviewTable complianceData={data} />);

      // The date should be formatted as "MMM DD, YYYY"
      const table = screen.getByRole('table');
      expect(table).toHaveTextContent(/[A-Z][a-z]{2} \d{1,2}, \d{4}/);
    });

    it('should show N/A for items without expiration date', () => {
      const data = [createMockRow('ABC Staffing', 'osha_certified', null)];

      render(<ComplianceOverviewTable complianceData={data} />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter by agency name', () => {
      const data = [
        createMockRow('ABC Staffing', 'osha_certified', 15),
        createMockRow('XYZ Recruiting', 'workers_comp', 5),
        createMockRow('Best Agency', 'drug_testing', -5),
      ];

      render(<ComplianceOverviewTable complianceData={data} />);

      const searchInput = screen.getByPlaceholderText(
        'Search by agency or compliance type...'
      );
      fireEvent.change(searchInput, { target: { value: 'ABC' } });

      expect(screen.getByText('ABC Staffing')).toBeInTheDocument();
      expect(screen.queryByText('XYZ Recruiting')).not.toBeInTheDocument();
      expect(screen.queryByText('Best Agency')).not.toBeInTheDocument();
      expect(
        screen.getByText('Showing 1 of 3 compliance issues')
      ).toBeInTheDocument();
    });

    it('should filter by compliance type', () => {
      const data = [
        createMockRow('ABC Staffing', 'osha_certified', 15),
        createMockRow('XYZ Recruiting', 'workers_comp', 5),
        createMockRow('Best Agency', 'drug_testing', -5),
      ];

      render(<ComplianceOverviewTable complianceData={data} />);

      const searchInput = screen.getByPlaceholderText(
        'Search by agency or compliance type...'
      );
      fireEvent.change(searchInput, { target: { value: 'Workers' } });

      expect(screen.getByText('XYZ Recruiting')).toBeInTheDocument();
      expect(screen.queryByText('ABC Staffing')).not.toBeInTheDocument();
      expect(screen.queryByText('Best Agency')).not.toBeInTheDocument();
    });

    it('should be case insensitive', () => {
      const data = [createMockRow('ABC Staffing', 'osha_certified', 15)];

      render(<ComplianceOverviewTable complianceData={data} />);

      const searchInput = screen.getByPlaceholderText(
        'Search by agency or compliance type...'
      );
      fireEvent.change(searchInput, { target: { value: 'abc' } });

      expect(screen.getByText('ABC Staffing')).toBeInTheDocument();
    });

    it('should show empty state when search has no matches', () => {
      const data = [createMockRow('ABC Staffing', 'osha_certified', 15)];

      render(<ComplianceOverviewTable complianceData={data} />);

      const searchInput = screen.getByPlaceholderText(
        'Search by agency or compliance type...'
      );
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

      // When statusFilter is "all" (default), empty state shows "No Compliance Issues"
      expect(screen.getByText('No Compliance Issues')).toBeInTheDocument();
      expect(
        screen.getByText('All agencies are in good compliance standing.')
      ).toBeInTheDocument();
    });
  });

  describe('Status Filter', () => {
    it('should show all items by default', () => {
      const data = [
        createMockRow('ABC Staffing', 'osha_certified', -10), // Expired
        createMockRow('XYZ Recruiting', 'workers_comp', 5), // Expiring soon
        createMockRow('Best Agency', 'drug_testing', 15, false, true), // Pending
      ];

      render(<ComplianceOverviewTable complianceData={data} />);

      expect(screen.getByText('ABC Staffing')).toBeInTheDocument();
      expect(screen.getByText('XYZ Recruiting')).toBeInTheDocument();
      expect(screen.getByText('Best Agency')).toBeInTheDocument();
    });

    it('should filter to show only expired items', () => {
      const data = [
        createMockRow('ABC Staffing', 'osha_certified', -10), // Expired
        createMockRow('XYZ Recruiting', 'workers_comp', 5), // Expiring soon
        createMockRow('Best Agency', 'drug_testing', 15, false, true), // Pending
      ];

      render(<ComplianceOverviewTable complianceData={data} />);

      const filterSelect = screen.getByRole('combobox');
      fireEvent.click(filterSelect);

      const expiredOption = screen.getByRole('option', {
        name: /Expired \(1\)/,
      });
      fireEvent.click(expiredOption);

      expect(screen.getByText('ABC Staffing')).toBeInTheDocument();
      expect(screen.queryByText('XYZ Recruiting')).not.toBeInTheDocument();
      expect(screen.queryByText('Best Agency')).not.toBeInTheDocument();
    });

    it('should filter to show only expiring soon items', () => {
      const data = [
        createMockRow('ABC Staffing', 'osha_certified', -10), // Expired
        createMockRow('XYZ Recruiting', 'workers_comp', 5), // Expiring soon
        createMockRow('Best Agency', 'drug_testing', 15, false, true), // Pending
      ];

      render(<ComplianceOverviewTable complianceData={data} />);

      const filterSelect = screen.getByRole('combobox');
      fireEvent.click(filterSelect);

      const expiringSoonOption = screen.getByRole('option', {
        name: /Expiring Soon \(1\)/,
      });
      fireEvent.click(expiringSoonOption);

      expect(screen.getByText('XYZ Recruiting')).toBeInTheDocument();
      expect(screen.queryByText('ABC Staffing')).not.toBeInTheDocument();
      expect(screen.queryByText('Best Agency')).not.toBeInTheDocument();
    });

    it('should filter to show only pending verification items', () => {
      const data = [
        createMockRow('ABC Staffing', 'osha_certified', -10), // Expired
        createMockRow('XYZ Recruiting', 'workers_comp', 5), // Expiring soon
        createMockRow('Best Agency', 'drug_testing', 15, false, true), // Pending
      ];

      render(<ComplianceOverviewTable complianceData={data} />);

      const filterSelect = screen.getByRole('combobox');
      fireEvent.click(filterSelect);

      const pendingOption = screen.getByRole('option', {
        name: /Pending Verification \(1\)/,
      });
      fireEvent.click(pendingOption);

      expect(screen.getByText('Best Agency')).toBeInTheDocument();
      expect(screen.queryByText('ABC Staffing')).not.toBeInTheDocument();
      expect(screen.queryByText('XYZ Recruiting')).not.toBeInTheDocument();
    });

    it('should display correct status counts in filter dropdown', () => {
      const data = [
        createMockRow('ABC1', 'osha_certified', -10), // Expired
        createMockRow('ABC2', 'workers_comp', -5), // Expired
        createMockRow('XYZ1', 'drug_testing', 5), // Expiring soon
        createMockRow('XYZ2', 'background_checks', 20), // Expiring soon
        createMockRow('Best1', 'general_liability', 15, false, true), // Pending
        createMockRow('Best2', 'bonding', 25, false, true), // Pending
      ];

      render(<ComplianceOverviewTable complianceData={data} />);

      const filterSelect = screen.getByRole('combobox');
      fireEvent.click(filterSelect);

      expect(
        screen.getByRole('option', { name: /All Issues \(6\)/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: /Expired \(2\)/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: /Expiring Soon \(2\)/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: /Pending Verification \(2\)/ })
      ).toBeInTheDocument();
    });
  });

  describe('Combined Search and Filter', () => {
    it('should apply both search and status filter together', () => {
      const data = [
        createMockRow('ABC Staffing', 'osha_certified', -10), // Expired
        createMockRow('ABC Recruiting', 'workers_comp', 5), // Expiring soon
        createMockRow('XYZ Agency', 'drug_testing', -5), // Expired
      ];

      render(<ComplianceOverviewTable complianceData={data} />);

      // Apply search filter
      const searchInput = screen.getByPlaceholderText(
        'Search by agency or compliance type...'
      );
      fireEvent.change(searchInput, { target: { value: 'ABC' } });

      // Apply status filter
      const filterSelect = screen.getByRole('combobox');
      fireEvent.click(filterSelect);
      const expiredOption = screen.getByRole('option', { name: /Expired/ });
      fireEvent.click(expiredOption);

      // Should only show ABC Staffing (has "ABC" and is expired)
      expect(screen.getByText('ABC Staffing')).toBeInTheDocument();
      expect(screen.queryByText('ABC Recruiting')).not.toBeInTheDocument();
      expect(screen.queryByText('XYZ Agency')).not.toBeInTheDocument();
      expect(
        screen.getByText('Showing 1 of 3 compliance issues')
      ).toBeInTheDocument();
    });
  });

  describe('View Agency Button', () => {
    it('should render link to agency detail page', () => {
      const data = [createMockRow('ABC Staffing', 'osha_certified', 15)];

      render(<ComplianceOverviewTable complianceData={data} />);

      const viewButton = screen.getByRole('button', { name: 'View Agency' });
      const link = viewButton.closest('a');
      expect(link).toHaveAttribute(
        'href',
        '/admin/agencies/agency-ABC Staffing'
      );
    });

    it('should render view button for each row', () => {
      const data = [
        createMockRow('ABC Staffing', 'osha_certified', 15),
        createMockRow('XYZ Recruiting', 'workers_comp', 5),
      ];

      render(<ComplianceOverviewTable complianceData={data} />);

      const viewButtons = screen.getAllByRole('button', {
        name: 'View Agency',
      });
      expect(viewButtons).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle items expiring in exactly 30 days', () => {
      const data = [createMockRow('ABC Staffing', 'osha_certified', 30)];

      render(<ComplianceOverviewTable complianceData={data} />);

      expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
      expect(screen.getByText('30 days remaining')).toBeInTheDocument();
    });

    it('should handle items expiring in 1 day', () => {
      const data = [createMockRow('ABC Staffing', 'osha_certified', 1)];

      render(<ComplianceOverviewTable complianceData={data} />);

      expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
      expect(screen.getByText('1 day remaining')).toBeInTheDocument();
    });

    it('should handle items expiring today (0 days)', () => {
      const data = [createMockRow('ABC Staffing', 'osha_certified', 0)];

      render(<ComplianceOverviewTable complianceData={data} />);

      expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
      expect(screen.getByText('0 days remaining')).toBeInTheDocument();
    });

    it('should handle items expired exactly 1 day ago', () => {
      const data = [createMockRow('ABC Staffing', 'osha_certified', -1)];

      render(<ComplianceOverviewTable complianceData={data} />);

      expect(screen.getByText('Expired')).toBeInTheDocument();
      expect(screen.getByText('1 day ago')).toBeInTheDocument();
    });

    it('should handle unverified items without documents', () => {
      const data = [
        createMockRow('ABC Staffing', 'osha_certified', 15, false, false),
      ];

      render(<ComplianceOverviewTable complianceData={data} />);

      // Should be expiring soon (not pending verification, since no document)
      expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
      expect(
        screen.queryByText('Pending Verification')
      ).not.toBeInTheDocument();
    });
  });
});
