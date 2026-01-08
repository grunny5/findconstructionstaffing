/**
 * Tests for ComplianceExpirationAlert Component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComplianceExpirationAlert } from '../ComplianceExpirationAlert';
import { type ComplianceItemFull } from '@/types/api';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Helper to create mock compliance items
function createMockItem(
  type: string,
  daysUntilExpiration: number
): ComplianceItemFull {
  const today = new Date();
  const expirationDate = new Date(today);
  expirationDate.setDate(today.getDate() + daysUntilExpiration);

  return {
    id: `item-${type}-${daysUntilExpiration}`,
    type: type as any,
    isActive: true,
    isVerified: true,
    expirationDate: expirationDate.toISOString().split('T')[0],
    isExpired: daysUntilExpiration < 0,
    documentUrl: 'https://example.com/doc.pdf',
    notes: null,
    verifiedBy: null,
    verifiedAt: null,
  };
}

describe('ComplianceExpirationAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Rendering Logic', () => {
    it('should not render when no expiring items', () => {
      const { container } = render(
        <ComplianceExpirationAlert expiringItems={[]} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should not render when items are not expiring within 30 days', () => {
      const items = [
        createMockItem('osha_certified', 45), // 45 days away
        createMockItem('drug_testing', 100), // 100 days away
      ];

      const { container } = render(
        <ComplianceExpirationAlert expiringItems={items} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should not render when items have no expiration date', () => {
      const items: ComplianceItemFull[] = [
        {
          id: 'item-1',
          type: 'osha_certified',
          isActive: true,
          isVerified: true,
          expirationDate: null,
          isExpired: false,
          documentUrl: null,
          notes: null,
          verifiedBy: null,
          verifiedAt: null,
        },
      ];

      const { container } = render(
        <ComplianceExpirationAlert expiringItems={items} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render warning alert for items expiring in 8-30 days', () => {
      const items = [createMockItem('osha_certified', 15)];

      render(<ComplianceExpirationAlert expiringItems={items} />);

      expect(
        screen.getByText('Compliance Certifications Expiring in 30 Days')
      ).toBeInTheDocument();
      expect(screen.getByText(/Expiring within 30 days/)).toBeInTheDocument();
      expect(
        screen.getByText(/OSHA Certified - expires in 15 days/)
      ).toBeInTheDocument();
    });

    it('should render urgent alert for items expiring in 1-7 days', () => {
      const items = [createMockItem('workers_comp', 5)];

      render(<ComplianceExpirationAlert expiringItems={items} />);

      expect(
        screen.getByText('Urgent: Compliance Certifications Expiring Soon')
      ).toBeInTheDocument();
      expect(screen.getByText(/Expiring within 7 days/)).toBeInTheDocument();
      expect(
        screen.getByText(/Workers' Compensation - expires in 5 days/)
      ).toBeInTheDocument();
    });

    it('should render error alert for expired items', () => {
      const items = [createMockItem('drug_testing', -5)];

      render(<ComplianceExpirationAlert expiringItems={items} />);

      expect(
        screen.getByText('Compliance Certifications Expired')
      ).toBeInTheDocument();
      expect(screen.getByText(/Expired \(1\):/)).toBeInTheDocument();
      expect(
        screen.getByText(/Drug Testing Policy - expired 5 days ago/)
      ).toBeInTheDocument();
    });

    it('should display singular "day" for items expiring in 1 day', () => {
      const items = [createMockItem('osha_certified', 1)];

      render(<ComplianceExpirationAlert expiringItems={items} />);

      expect(
        screen.getByText(/OSHA Certified - expires in 1 day/)
      ).toBeInTheDocument();
    });
  });

  describe('Multiple Items Categorization', () => {
    it('should categorize and display items by severity', () => {
      const items = [
        createMockItem('osha_certified', -10), // Expired
        createMockItem('workers_comp', -2), // Expired
        createMockItem('drug_testing', 3), // Urgent (< 7 days)
        createMockItem('background_checks', 6), // Urgent (< 7 days)
        createMockItem('general_liability', 15), // Warning (< 30 days)
        createMockItem('bonding', 25), // Warning (< 30 days)
      ];

      render(<ComplianceExpirationAlert expiringItems={items} />);

      // Should show expired title (most severe)
      expect(
        screen.getByText('Compliance Certifications Expired')
      ).toBeInTheDocument();

      // Should show all three categories
      expect(screen.getByText(/Expired \(2\):/)).toBeInTheDocument();
      expect(
        screen.getByText(/Expiring within 7 days \(2\):/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Expiring within 30 days \(2\):/)
      ).toBeInTheDocument();

      // Verify specific items are listed
      expect(
        screen.getByText(/OSHA Certified - expired 10 days ago/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Drug Testing Policy - expires in 3 days/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/General Liability Insurance - expires in 15 days/)
      ).toBeInTheDocument();
    });

    it('should show urgent title when no expired but has urgent items', () => {
      const items = [
        createMockItem('drug_testing', 3), // Urgent
        createMockItem('osha_certified', 20), // Warning
      ];

      render(<ComplianceExpirationAlert expiringItems={items} />);

      expect(
        screen.getByText('Urgent: Compliance Certifications Expiring Soon')
      ).toBeInTheDocument();
    });
  });

  describe('Dismiss Functionality', () => {
    it('should hide alert when dismiss button is clicked', async () => {
      const items = [createMockItem('osha_certified', 15)];

      const { container } = render(
        <ComplianceExpirationAlert
          expiringItems={items}
          agencyId="test-agency"
        />
      );

      // Alert should be visible
      expect(container.firstChild).not.toBeNull();

      // Click dismiss button
      const dismissButton = screen.getByLabelText('Dismiss alert');
      fireEvent.click(dismissButton);

      // Alert should be hidden
      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('should store dismiss state in localStorage', () => {
      const items = [createMockItem('osha_certified', 15)];

      render(
        <ComplianceExpirationAlert
          expiringItems={items}
          agencyId="test-agency"
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss alert');
      fireEvent.click(dismissButton);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'compliance-alert-dismissed-test-agency',
        expect.any(String)
      );
    });

    it('should not render if previously dismissed', () => {
      const items = [createMockItem('osha_certified', 15)];

      // Set dismissed state
      localStorageMock.setItem(
        'compliance-alert-dismissed-test-agency',
        new Date().toISOString()
      );

      const { container } = render(
        <ComplianceExpirationAlert
          expiringItems={items}
          agencyId="test-agency"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should reset dismissed state after 24 hours', () => {
      const items = [createMockItem('osha_certified', 15)];

      // Set dismissed state to 25 hours ago
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 25);
      localStorageMock.setItem(
        'compliance-alert-dismissed-test-agency',
        oldDate.toISOString()
      );

      const { container } = render(
        <ComplianceExpirationAlert
          expiringItems={items}
          agencyId="test-agency"
        />
      );

      // Alert should be visible again
      expect(container.firstChild).not.toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'compliance-alert-dismissed-test-agency'
      );
    });
  });

  describe('Update Now Button', () => {
    it('should render Update Now button with default link', () => {
      const items = [createMockItem('osha_certified', 15)];

      render(<ComplianceExpirationAlert expiringItems={items} />);

      const button = screen.getByRole('button', { name: 'Update Now' });
      expect(button).toBeInTheDocument();
      expect(button.closest('a')).toHaveAttribute(
        'href',
        '/dashboard/compliance'
      );
    });

    it('should render Update Now button with custom link', () => {
      const items = [createMockItem('osha_certified', 15)];

      render(
        <ComplianceExpirationAlert
          expiringItems={items}
          complianceUrl="/custom/compliance"
        />
      );

      const button = screen.getByRole('button', { name: 'Update Now' });
      expect(button.closest('a')).toHaveAttribute('href', '/custom/compliance');
    });

    it('should use default variant for urgent/expired items', () => {
      const items = [createMockItem('osha_certified', 5)]; // Urgent

      render(<ComplianceExpirationAlert expiringItems={items} />);

      const button = screen.getByRole('button', { name: 'Update Now' });
      // Default variant doesn't have 'outline' class
      expect(button).not.toHaveClass('outline');
    });

    it('should use outline variant for warning items', () => {
      const items = [createMockItem('osha_certified', 20)]; // Warning

      render(<ComplianceExpirationAlert expiringItems={items} />);

      const button = screen.getByRole('button', { name: 'Update Now' });
      // Outline variant should be present
      expect(button.className).toContain('outline');
    });
  });

  describe('Agency ID Parameter', () => {
    it('should use default agency ID when not provided', () => {
      const items = [createMockItem('osha_certified', 15)];

      render(<ComplianceExpirationAlert expiringItems={items} />);

      const dismissButton = screen.getByLabelText('Dismiss alert');
      fireEvent.click(dismissButton);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'compliance-alert-dismissed-default',
        expect.any(String)
      );
    });

    it('should use provided agency ID for localStorage key', () => {
      const items = [createMockItem('osha_certified', 15)];

      render(
        <ComplianceExpirationAlert
          expiringItems={items}
          agencyId="agency-123"
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss alert');
      fireEvent.click(dismissButton);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'compliance-alert-dismissed-agency-123',
        expect.any(String)
      );
    });
  });
});
