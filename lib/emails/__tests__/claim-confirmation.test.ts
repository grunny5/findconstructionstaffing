/**
 * Tests for claim confirmation email templates
 */

import {
  generateClaimConfirmationHTML,
  generateClaimConfirmationText,
} from '../claim-confirmation';

describe('Claim Confirmation Email Templates', () => {
  const mockParams = {
    recipientEmail: 'john.doe@example.com',
    recipientName: 'John Doe',
    agencyName: 'Test Construction Staffing',
    claimId: '550e8400-e29b-41d4-a716-446655440000',
    siteUrl: 'https://findconstructionstaffing.com',
  };

  describe('generateClaimConfirmationHTML', () => {
    it('should generate valid HTML email', () => {
      const html = generateClaimConfirmationHTML(mockParams);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
      expect(html).not.toContain('undefined');
    });

    it('should include recipient name in greeting when provided', () => {
      const html = generateClaimConfirmationHTML(mockParams);

      expect(html).toContain('Hi John Doe,');
    });

    it('should use generic greeting when recipient name not provided', () => {
      const paramsWithoutName = { ...mockParams, recipientName: undefined };
      const html = generateClaimConfirmationHTML(paramsWithoutName);

      expect(html).toContain('Hello,');
      expect(html).not.toContain('Hi ');
    });

    it('should include agency name', () => {
      const html = generateClaimConfirmationHTML(mockParams);

      expect(html).toContain('Test Construction Staffing');
      expect(html).toContain(
        '<strong>Test Construction Staffing</strong>'
      );
    });

    it('should include claim ID in monospace code block', () => {
      const html = generateClaimConfirmationHTML(mockParams);

      expect(html).toContain('Claim ID');
      expect(html).toContain('550e8400-e29b-41d4-a716-446655440000');
      expect(html).toContain('<code');
    });

    it('should include status as "Pending Review"', () => {
      const html = generateClaimConfirmationHTML(mockParams);

      expect(html).toContain('Pending Review');
      expect(html).toContain('Status');
    });

    it('should mention 2 business days review time', () => {
      const html = generateClaimConfirmationHTML(mockParams);

      expect(html).toContain('2 business days');
      expect(html).toContain('<strong>2 business days</strong>');
    });

    it('should include "What Happens Next" section with list items', () => {
      const html = generateClaimConfirmationHTML(mockParams);

      expect(html).toContain('What Happens Next?');
      expect(html).toContain('<ul');
      expect(html).toContain('<li>Our team will verify your information</li>');
      expect(html).toContain(
        '<li>You\'ll receive an email with our decision</li>'
      );
      expect(html).toContain(
        '<li>If approved, you\'ll be able to manage the agency profile</li>'
      );
    });

    it('should include CTA button to view claim status', () => {
      const html = generateClaimConfirmationHTML(mockParams);

      expect(html).toContain('View Claim Status');
      expect(html).toContain(
        `href="${mockParams.siteUrl}/settings/claims"`
      );
    });

    it('should include support contact email', () => {
      const html = generateClaimConfirmationHTML(mockParams);

      expect(html).toContain('support@findconstructionstaffing.com');
      expect(html).toContain('href="mailto:support@findconstructionstaffing.com"');
    });

    it('should include footer with copyright', () => {
      const html = generateClaimConfirmationHTML(mockParams);
      const currentYear = new Date().getFullYear();

      expect(html).toContain(`© ${currentYear} FindConstructionStaffing`);
      expect(html).toContain('All rights reserved');
    });

    it('should include site URL in footer', () => {
      const html = generateClaimConfirmationHTML(mockParams);

      expect(html).toContain('Visit our website');
      expect(html).toContain(`href="${mockParams.siteUrl}"`);
    });

    it('should include FindConstructionStaffing branding in header', () => {
      const html = generateClaimConfirmationHTML(mockParams);

      expect(html).toContain('<h1');
      expect(html).toContain('FindConstructionStaffing</h1>');
    });

    it('should use proper email styling (inline styles)', () => {
      const html = generateClaimConfirmationHTML(mockParams);

      expect(html).toContain('style=');
      expect(html).toContain('font-family:');
      expect(html).toContain('color:');
    });

    it('should include table-based layout for email compatibility', () => {
      const html = generateClaimConfirmationHTML(mockParams);

      expect(html).toContain('<table role="presentation"');
      expect(html).toContain('cellpadding="0"');
      expect(html).toContain('cellspacing="0"');
    });
  });

  describe('generateClaimConfirmationText', () => {
    it('should generate plain text email', () => {
      const text = generateClaimConfirmationText(mockParams);

      expect(text).not.toContain('<');
      expect(text).not.toContain('>');
      expect(text).not.toContain('undefined');
    });

    it('should include recipient name in greeting when provided', () => {
      const text = generateClaimConfirmationText(mockParams);

      expect(text).toContain('Hi John Doe,');
    });

    it('should use generic greeting when recipient name not provided', () => {
      const paramsWithoutName = { ...mockParams, recipientName: undefined };
      const text = generateClaimConfirmationText(paramsWithoutName);

      expect(text).toContain('Hello,');
      expect(text).not.toContain('Hi John Doe');
    });

    it('should include agency name', () => {
      const text = generateClaimConfirmationText(mockParams);

      expect(text).toContain('Test Construction Staffing');
    });

    it('should include claim ID in plain text format', () => {
      const text = generateClaimConfirmationText(mockParams);

      expect(text).toContain('CLAIM DETAILS');
      expect(text).toContain('Claim ID: 550e8400-e29b-41d4-a716-446655440000');
    });

    it('should include status as "Pending Review"', () => {
      const text = generateClaimConfirmationText(mockParams);

      expect(text).toContain('Status: Pending Review');
    });

    it('should mention 2 business days review time', () => {
      const text = generateClaimConfirmationText(mockParams);

      expect(text).toContain('2 business days');
    });

    it('should include "What Happens Next" section with bullet points', () => {
      const text = generateClaimConfirmationText(mockParams);

      expect(text).toContain('WHAT HAPPENS NEXT?');
      expect(text).toContain('* Our team will verify your information');
      expect(text).toContain('* You\'ll receive an email with our decision');
      expect(text).toContain(
        '* If approved, you\'ll be able to manage the agency profile'
      );
    });

    it('should include link to view claim status', () => {
      const text = generateClaimConfirmationText(mockParams);

      expect(text).toContain('View your claim status:');
      expect(text).toContain(
        `${mockParams.siteUrl}/settings/claims`
      );
    });

    it('should include support contact email', () => {
      const text = generateClaimConfirmationText(mockParams);

      expect(text).toContain('support@findconstructionstaffing.com');
    });

    it('should include footer with copyright', () => {
      const text = generateClaimConfirmationText(mockParams);
      const currentYear = new Date().getFullYear();

      expect(text).toContain(`© ${currentYear} FindConstructionStaffing`);
      expect(text).toContain('All rights reserved');
    });

    it('should include site URL in footer', () => {
      const text = generateClaimConfirmationText(mockParams);

      expect(text).toContain(`Visit our website: ${mockParams.siteUrl}`);
    });

    it('should include FindConstructionStaffing branding', () => {
      const text = generateClaimConfirmationText(mockParams);

      expect(text).toContain('FINDCONSTRUCTIONSTAFFING');
      expect(text).toContain('Claim Request Submitted');
    });

    it('should use text-based section separators', () => {
      const text = generateClaimConfirmationText(mockParams);

      expect(text).toContain('--------------'); // Under Claim Details
      expect(text).toContain('-------------------'); // Under What Happens Next
      expect(text).toContain('---'); // Footer separator
    });

    it('should be properly formatted for plain text', () => {
      const text = generateClaimConfirmationText(mockParams);

      // Check for line breaks and structure
      const lines = text.split('\n');
      expect(lines.length).toBeGreaterThan(10);

      // Check that it starts with branding
      expect(lines[0]).toContain('FINDCONSTRUCTIONSTAFFING');
    });
  });

  describe('Email Content Consistency', () => {
    it('should include same core content in both HTML and text versions', () => {
      const html = generateClaimConfirmationHTML(mockParams);
      const text = generateClaimConfirmationText(mockParams);

      // Core content that should appear in both
      const coreContent = [
        'Test Construction Staffing',
        '550e8400-e29b-41d4-a716-446655440000',
        'Pending Review',
        '2 business days',
        'Our team will verify your information',
        'support@findconstructionstaffing.com',
        '/settings/claims',
      ];

      coreContent.forEach((content) => {
        expect(html).toContain(content);
        expect(text).toContain(content);
      });
    });

    it('should handle special characters in agency name', () => {
      const paramsWithSpecialChars = {
        ...mockParams,
        agencyName: 'Test & Construction <Special> Staffing',
      };

      const html = generateClaimConfirmationHTML(paramsWithSpecialChars);
      const text = generateClaimConfirmationText(paramsWithSpecialChars);

      // HTML should still be valid and include the content
      expect(html).toContain('Test & Construction <Special> Staffing');
      expect(text).toContain('Test & Construction <Special> Staffing');
    });

    it('should handle different site URLs correctly', () => {
      const paramsWithLocalhost = {
        ...mockParams,
        siteUrl: 'http://localhost:3000',
      };

      const html = generateClaimConfirmationHTML(paramsWithLocalhost);
      const text = generateClaimConfirmationText(paramsWithLocalhost);

      expect(html).toContain('http://localhost:3000/settings/claims');
      expect(text).toContain('http://localhost:3000/settings/claims');
    });
  });
});
