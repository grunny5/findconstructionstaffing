/**
 * Tests for ClaimVerificationChecklist Component
 *
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { ClaimVerificationChecklist } from '../ClaimVerificationChecklist';

describe('ClaimVerificationChecklist', () => {
  const mockBusinessEmail = 'john@acmestaffing.com';
  const mockAgencyWebsite = 'https://www.acmestaffing.com';

  describe('Verification Score Calculation', () => {
    it('should show 3/3 checks passed (100%) when all criteria are met', () => {
      render(
        <ClaimVerificationChecklist
          emailDomainVerified={true}
          phoneProvided={true}
          positionProvided={true}
          verificationMethod="email"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      expect(
        screen.getByText(/3\/3 checks passed \(100%\)/)
      ).toBeInTheDocument();
    });

    it('should show 2/3 checks passed (67%) when two criteria are met', () => {
      render(
        <ClaimVerificationChecklist
          emailDomainVerified={true}
          phoneProvided={true}
          positionProvided={false}
          verificationMethod="email"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      expect(
        screen.getByText(/2\/3 checks passed \(67%\)/)
      ).toBeInTheDocument();
    });

    it('should show 1/3 checks passed (33%) when one criterion is met', () => {
      render(
        <ClaimVerificationChecklist
          emailDomainVerified={false}
          phoneProvided={false}
          positionProvided={true}
          verificationMethod="manual"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      expect(
        screen.getByText(/1\/3 checks passed \(33%\)/)
      ).toBeInTheDocument();
    });

    it('should show 0/3 checks passed (0%) when no criteria are met', () => {
      render(
        <ClaimVerificationChecklist
          emailDomainVerified={false}
          phoneProvided={false}
          positionProvided={false}
          verificationMethod="phone"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      expect(screen.getByText(/0\/3 checks passed \(0%\)/)).toBeInTheDocument();
    });
  });

  describe('Verification Status Labels', () => {
    it('should display "Fully Verified" status when all checks pass (100%)', () => {
      render(
        <ClaimVerificationChecklist
          emailDomainVerified={true}
          phoneProvided={true}
          positionProvided={true}
          verificationMethod="email"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      expect(screen.getByText('Fully Verified')).toBeInTheDocument();
    });

    it('should display "Partially Verified" status when 2/3 checks pass (67%)', () => {
      render(
        <ClaimVerificationChecklist
          emailDomainVerified={true}
          phoneProvided={true}
          positionProvided={false}
          verificationMethod="email"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      expect(screen.getByText('Partially Verified')).toBeInTheDocument();
    });

    it('should display "Needs Review" status when less than 66% pass', () => {
      render(
        <ClaimVerificationChecklist
          emailDomainVerified={true}
          phoneProvided={false}
          positionProvided={false}
          verificationMethod="email"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      expect(screen.getByText('Needs Review')).toBeInTheDocument();
    });

    it('should display "Needs Review" status when no checks pass (0%)', () => {
      render(
        <ClaimVerificationChecklist
          emailDomainVerified={false}
          phoneProvided={false}
          positionProvided={false}
          verificationMethod="manual"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      expect(screen.getByText('Needs Review')).toBeInTheDocument();
    });
  });

  describe('Verification Method Display', () => {
    it('should display email verification method', () => {
      const { container } = render(
        <ClaimVerificationChecklist
          emailDomainVerified={true}
          phoneProvided={true}
          positionProvided={true}
          verificationMethod="email"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      expect(screen.getByText(/Verification Method:/)).toBeInTheDocument();
      // Check for capitalized "Email" in the verification method display
      const verificationText = container.textContent;
      expect(verificationText).toMatch(/Verification Method:.*email/i);
    });

    it('should display phone verification method', () => {
      const { container } = render(
        <ClaimVerificationChecklist
          emailDomainVerified={true}
          phoneProvided={true}
          positionProvided={true}
          verificationMethod="phone"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      const verificationText = container.textContent;
      expect(verificationText).toMatch(/Verification Method:.*phone/i);
    });

    it('should display manual verification method', () => {
      const { container } = render(
        <ClaimVerificationChecklist
          emailDomainVerified={true}
          phoneProvided={true}
          positionProvided={true}
          verificationMethod="manual"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      const verificationText = container.textContent;
      expect(verificationText).toMatch(/Verification Method:.*manual/i);
    });
  });

  describe('Email Domain Verification Checklist Item', () => {
    it('should show PASS when emailDomainVerified is true with matching domains', () => {
      render(
        <ClaimVerificationChecklist
          emailDomainVerified={true}
          phoneProvided={false}
          positionProvided={false}
          verificationMethod="email"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      expect(screen.getByText('Email Domain Verification')).toBeInTheDocument();
      expect(
        screen.getByText(
          /✓ Email domain \(acmestaffing.com\) matches agency website \(acmestaffing.com\)/
        )
      ).toBeInTheDocument();
      const passLabels = screen.getAllByText('PASS');
      expect(passLabels.length).toBeGreaterThan(0);
    });

    it('should show REVIEW when emailDomainVerified is false with orange warning', () => {
      render(
        <ClaimVerificationChecklist
          emailDomainVerified={false}
          phoneProvided={false}
          positionProvided={false}
          verificationMethod="email"
          businessEmail="john@gmail.com"
          agencyWebsite={mockAgencyWebsite}
        />
      );

      expect(screen.getByText('Email Domain Verification')).toBeInTheDocument();
      expect(
        screen.getByText(
          /Email domain \(gmail.com\) does not match website domain \(acmestaffing.com\)/
        )
      ).toBeInTheDocument();
      const reviewLabels = screen.getAllByText('REVIEW');
      expect(reviewLabels.length).toBeGreaterThan(0);
    });

    it('should show detailed domain information when domains do not match', () => {
      render(
        <ClaimVerificationChecklist
          emailDomainVerified={false}
          phoneProvided={false}
          positionProvided={false}
          verificationMethod="email"
          businessEmail="contact@differentdomain.com"
          agencyWebsite="https://acmestaffing.com"
        />
      );

      expect(
        screen.getByText(
          /Email domain \(differentdomain.com\) does not match website domain \(acmestaffing.com\)/
        )
      ).toBeInTheDocument();
    });

    it('should handle missing agency website', () => {
      render(
        <ClaimVerificationChecklist
          emailDomainVerified={false}
          phoneProvided={false}
          positionProvided={false}
          verificationMethod="manual"
          businessEmail={mockBusinessEmail}
          agencyWebsite={null}
        />
      );

      expect(
        screen.getByText(
          /No agency website available for domain verification. Manual review required./
        )
      ).toBeInTheDocument();
    });

    it('should display both domains for admin reference', () => {
      const { container } = render(
        <ClaimVerificationChecklist
          emailDomainVerified={true}
          phoneProvided={false}
          positionProvided={false}
          verificationMethod="email"
          businessEmail="admin@example.com"
          agencyWebsite="https://example.com"
        />
      );

      const text = container.textContent;
      expect(text).toContain('example.com');
    });
  });

  describe('Phone Number Provided Checklist Item', () => {
    it('should show PASS when phoneProvided is true', () => {
      render(
        <ClaimVerificationChecklist
          emailDomainVerified={false}
          phoneProvided={true}
          positionProvided={false}
          verificationMethod="phone"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      expect(screen.getByText('Phone Number Provided')).toBeInTheDocument();
      expect(
        screen.getByText('Contact phone number was provided')
      ).toBeInTheDocument();
      const passLabels = screen.getAllByText('PASS');
      expect(passLabels.length).toBeGreaterThan(0);
    });

    it('should show FAIL when phoneProvided is false', () => {
      render(
        <ClaimVerificationChecklist
          emailDomainVerified={false}
          phoneProvided={false}
          positionProvided={false}
          verificationMethod="email"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      expect(screen.getByText('Phone Number Provided')).toBeInTheDocument();
      expect(screen.getByText('No phone number provided')).toBeInTheDocument();
    });
  });

  describe('Position/Title Provided Checklist Item', () => {
    it('should show PASS when positionProvided is true', () => {
      render(
        <ClaimVerificationChecklist
          emailDomainVerified={false}
          phoneProvided={false}
          positionProvided={true}
          verificationMethod="manual"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      expect(screen.getByText('Position/Title Provided')).toBeInTheDocument();
      expect(
        screen.getByText('Professional position/title specified')
      ).toBeInTheDocument();
      const passLabels = screen.getAllByText('PASS');
      expect(passLabels.length).toBeGreaterThan(0);
    });

    it('should show FAIL when positionProvided is false', () => {
      render(
        <ClaimVerificationChecklist
          emailDomainVerified={false}
          phoneProvided={false}
          positionProvided={false}
          verificationMethod="email"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      expect(screen.getByText('Position/Title Provided')).toBeInTheDocument();
      expect(
        screen.getByText('No position or title provided')
      ).toBeInTheDocument();
    });
  });

  describe('Verification Guidance', () => {
    it('should show guidance recommendation when score is less than 100%', () => {
      render(
        <ClaimVerificationChecklist
          emailDomainVerified={true}
          phoneProvided={false}
          positionProvided={false}
          verificationMethod="email"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      expect(screen.getByText(/Recommendation:/)).toBeInTheDocument();
      expect(
        screen.getByText(
          /Claims with lower verification scores may require additional manual verification/
        )
      ).toBeInTheDocument();
    });

    it('should not show guidance recommendation when score is 100%', () => {
      render(
        <ClaimVerificationChecklist
          emailDomainVerified={true}
          phoneProvided={true}
          positionProvided={true}
          verificationMethod="email"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      expect(screen.queryByText(/Recommendation:/)).not.toBeInTheDocument();
    });
  });

  describe('Visual Indicators', () => {
    it('should render CheckCircle icons for passed checks', () => {
      const { container } = render(
        <ClaimVerificationChecklist
          emailDomainVerified={true}
          phoneProvided={true}
          positionProvided={true}
          verificationMethod="email"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      const greenIcons = container.querySelectorAll('.text-green-600');
      expect(greenIcons.length).toBeGreaterThan(0);
    });

    it('should render AlertTriangle icons for domain mismatch warnings', () => {
      const { container } = render(
        <ClaimVerificationChecklist
          emailDomainVerified={false}
          phoneProvided={false}
          positionProvided={false}
          verificationMethod="email"
          businessEmail="test@gmail.com"
          agencyWebsite={mockAgencyWebsite}
        />
      );

      const orangeIcons = container.querySelectorAll('.text-orange-600');
      expect(orangeIcons.length).toBeGreaterThan(0);
    });

    it('should render XCircle icons for failed checks without website', () => {
      const { container } = render(
        <ClaimVerificationChecklist
          emailDomainVerified={false}
          phoneProvided={false}
          positionProvided={false}
          verificationMethod="email"
          businessEmail={mockBusinessEmail}
          agencyWebsite={null}
        />
      );

      const redIcons = container.querySelectorAll('.text-red-600');
      expect(redIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Status Color Coding', () => {
    it('should apply green styling for Fully Verified status', () => {
      const { container } = render(
        <ClaimVerificationChecklist
          emailDomainVerified={true}
          phoneProvided={true}
          positionProvided={true}
          verificationMethod="email"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      expect(container.querySelector('.bg-green-50')).toBeInTheDocument();
      expect(container.querySelector('.border-green-200')).toBeInTheDocument();
      expect(container.querySelector('.text-green-700')).toBeInTheDocument();
    });

    it('should apply yellow styling for Partially Verified status', () => {
      const { container } = render(
        <ClaimVerificationChecklist
          emailDomainVerified={true}
          phoneProvided={true}
          positionProvided={false}
          verificationMethod="email"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      expect(container.querySelector('.bg-yellow-50')).toBeInTheDocument();
      expect(container.querySelector('.border-yellow-200')).toBeInTheDocument();
      expect(container.querySelector('.text-yellow-700')).toBeInTheDocument();
    });

    it('should apply red styling for Needs Review status', () => {
      const { container } = render(
        <ClaimVerificationChecklist
          emailDomainVerified={false}
          phoneProvided={false}
          positionProvided={false}
          verificationMethod="email"
          businessEmail={mockBusinessEmail}
          agencyWebsite={mockAgencyWebsite}
        />
      );

      expect(container.querySelector('.bg-red-50')).toBeInTheDocument();
      expect(container.querySelector('.border-red-200')).toBeInTheDocument();
      expect(container.querySelector('.text-red-700')).toBeInTheDocument();
    });
  });
});
