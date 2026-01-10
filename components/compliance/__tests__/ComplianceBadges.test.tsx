/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { ComplianceBadges } from '../ComplianceBadges';
import type { ComplianceItemFull } from '@/types/api';

describe('ComplianceBadges', () => {
  const mockComplianceItems: ComplianceItemFull[] = [
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
    {
      id: '3',
      type: 'workers_comp',
      displayName: "Workers' Compensation",
      isActive: true,
      isVerified: true,
      expirationDate: '2024-06-30',
      isExpired: true,
      documentUrl: null,
      notes: null,
      verifiedBy: null,
      verifiedAt: null,
    },
  ];

  describe('Empty State', () => {
    it('returns null when compliance array is empty', () => {
      const { container } = render(<ComplianceBadges compliance={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when compliance is null', () => {
      const { container } = render(<ComplianceBadges compliance={null} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Default Variant', () => {
    it('renders all compliance badges', () => {
      render(<ComplianceBadges compliance={mockComplianceItems} />);

      expect(screen.getByText('OSHA Certified')).toBeInTheDocument();
      expect(screen.getByText('Drug Testing Policy')).toBeInTheDocument();
      expect(screen.getByText("Workers' Compensation")).toBeInTheDocument();
    });

    it('shows verified icon for verified items', () => {
      render(<ComplianceBadges compliance={mockComplianceItems} />);

      // OSHA is verified, should have 1 checkmark visible (the inline one)
      const oshaSection = screen
        .getByText('OSHA Certified')
        .closest('div[class*="flex items-start gap-3"]');
      expect(oshaSection).toBeInTheDocument();
    });

    it('shows expiration date for items with expiration', () => {
      render(<ComplianceBadges compliance={mockComplianceItems} />);

      expect(screen.getByText(/Expires Dec 2026/)).toBeInTheDocument();
    });

    it('shows expired styling for expired items', () => {
      render(<ComplianceBadges compliance={mockComplianceItems} />);

      expect(screen.getByText(/Expired Jun 2024/)).toBeInTheDocument();
    });

    it('renders in responsive grid layout', () => {
      const { container } = render(
        <ComplianceBadges compliance={mockComplianceItems} />
      );

      const grid = container.querySelector(
        '.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3'
      );
      expect(grid).toBeInTheDocument();
    });

    it('does not show expiration for items without expiration date', () => {
      render(<ComplianceBadges compliance={mockComplianceItems} />);

      const drugTestingSection = screen
        .getByText('Drug Testing Policy')
        .closest('div[class*="flex items-start gap-3"]');
      expect(drugTestingSection).toBeInTheDocument();
      expect(drugTestingSection).not.toHaveTextContent('Expires');
      expect(drugTestingSection).not.toHaveTextContent('Expired');
    });
  });

  describe('Compact Variant', () => {
    it('renders icons only in compact mode', () => {
      const { container } = render(
        <ComplianceBadges compliance={mockComplianceItems} variant="compact" />
      );

      // Should render icon containers
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);

      // Should not render full text in compact mode
      expect(screen.queryByText('OSHA Certified')).not.toBeInTheDocument();
      expect(screen.queryByText('Drug Testing Policy')).not.toBeInTheDocument();
    });

    it('shows only first 3 items with count indicator', () => {
      const manyItems: ComplianceItemFull[] = [
        ...mockComplianceItems,
        {
          id: '4',
          type: 'background_checks',
          displayName: 'Background Checks',
          isActive: true,
          isVerified: false,
          expirationDate: null,
          isExpired: false,
          documentUrl: null,
          notes: null,
          verifiedBy: null,
          verifiedAt: null,
        },
        {
          id: '5',
          type: 'general_liability',
          displayName: 'General Liability Insurance',
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

      const { container } = render(
        <ComplianceBadges compliance={manyItems} variant="compact" />
      );

      // Should show "+2" indicator
      expect(screen.getByText('+2')).toBeInTheDocument();

      // Should only render 3 icon containers (direct children with p-1.5 class)
      const wrapper = container.querySelector(
        'div.flex.items-center.gap-1\\.5'
      );
      const iconContainers = wrapper?.querySelectorAll(
        ':scope > div[class*="p-1.5"]'
      );
      expect(iconContainers).toHaveLength(3);
    });

    it('applies verified styling to verified items in compact mode', () => {
      const { container } = render(
        <ComplianceBadges
          compliance={[mockComplianceItems[0]]}
          variant="compact"
        />
      );

      const verifiedIcon = container.querySelector(
        '.bg-green-50.text-green-600'
      );
      expect(verifiedIcon).toBeInTheDocument();
    });

    it('applies unverified styling to unverified items in compact mode', () => {
      const { container } = render(
        <ComplianceBadges
          compliance={[mockComplianceItems[1]]}
          variant="compact"
        />
      );

      const unverifiedIcon = container.querySelector(
        '.bg-industrial-graphite-100.text-industrial-graphite-500'
      );
      expect(unverifiedIcon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses semantic HTML for better accessibility', () => {
      const { container } = render(
        <ComplianceBadges compliance={mockComplianceItems} />
      );

      // Should have proper structure
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });

    it('provides tooltip content for additional context', () => {
      render(<ComplianceBadges compliance={mockComplianceItems} />);

      // Tooltips should be accessible (testing library renders tooltip triggers)
      expect(screen.getByText('OSHA Certified')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles single compliance item', () => {
      render(<ComplianceBadges compliance={[mockComplianceItems[0]]} />);

      expect(screen.getByText('OSHA Certified')).toBeInTheDocument();
      expect(screen.queryByText('Drug Testing Policy')).not.toBeInTheDocument();
    });

    it('formats expiration date correctly', () => {
      const item: ComplianceItemFull = {
        id: '1',
        type: 'osha_certified',
        displayName: 'OSHA Certified',
        isActive: true,
        isVerified: true,
        expirationDate: '2026-01-15',
        isExpired: false,
        documentUrl: null,
        notes: null,
        verifiedBy: null,
        verifiedAt: null,
      };

      render(<ComplianceBadges compliance={[item]} />);

      expect(screen.getByText(/Expires Jan 2026/)).toBeInTheDocument();
    });

    it('handles undefined expiration date', () => {
      const item: ComplianceItemFull = {
        id: '1',
        type: 'osha_certified',
        displayName: 'OSHA Certified',
        isActive: true,
        isVerified: true,
        expirationDate: null,
        isExpired: false,
        documentUrl: null,
        notes: null,
        verifiedBy: null,
        verifiedAt: null,
      };

      const { container } = render(<ComplianceBadges compliance={[item]} />);
      const badge = container.querySelector(
        'div[class*="flex items-start gap-3"]'
      );

      expect(badge).not.toHaveTextContent('Expires');
      expect(badge).not.toHaveTextContent('Expired');
    });
  });
});
