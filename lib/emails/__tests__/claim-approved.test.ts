/**
 * Tests for claim approval email templates
 */

import {
  generateClaimApprovedHTML,
  generateClaimApprovedText,
} from '../claim-approved';

describe('Claim Approved Email Templates', () => {
  const mockParams = {
    recipientEmail: 'john.doe@example.com',
    recipientName: 'John Doe',
    agencyName: 'Test Construction Staffing',
    agencySlug: 'test-construction-staffing',
    siteUrl: 'https://findconstructionstaffing.com',
  };

  describe('generateClaimApprovedHTML', () => {
    it('should generate valid HTML email', () => {
      const html = generateClaimApprovedHTML(mockParams);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
      expect(html).not.toContain('undefined');
    });

    it('should include recipient name in greeting when provided', () => {
      const html = generateClaimApprovedHTML(mockParams);

      expect(html).toContain('Hi John Doe,');
    });

    it('should use generic greeting when recipient name not provided', () => {
      const paramsWithoutName = { ...mockParams, recipientName: undefined };
      const html = generateClaimApprovedHTML(paramsWithoutName);

      expect(html).toContain('Hello,');
      expect(html).not.toContain('Hi ');
    });

    it('should include congratulations heading', () => {
      const html = generateClaimApprovedHTML(mockParams);

      expect(html).toContain('Congratulations!');
      expect(html).toContain('Your Claim Has Been Approved');
    });

    it('should include agency name', () => {
      const html = generateClaimApprovedHTML(mockParams);

      expect(html).toContain('Test Construction Staffing');
      expect(html).toContain('<strong>Test Construction Staffing</strong>');
    });

    it('should include agency role as "Agency Owner"', () => {
      const html = generateClaimApprovedHTML(mockParams);

      expect(html).toContain('Agency Owner');
      expect(html).toContain('Your Role');
    });

    it('should include success icon with checkmark', () => {
      const html = generateClaimApprovedHTML(mockParams);

      expect(html).toContain('<svg');
      expect(html).toContain('viewBox="0 0 24 24"');
      expect(html).toContain('background-color: #d1fae5'); // Success background
    });

    it('should include "What You Can Do Now" section', () => {
      const html = generateClaimApprovedHTML(mockParams);

      expect(html).toContain('What You Can Do Now');
      expect(html).toContain('Update your agency profile');
      expect(html).toContain('Add or modify services');
      expect(html).toContain('Manage your agency');
      expect(html).toContain('Upload your agency logo');
      expect(html).toContain('Respond to inquiries');
    });

    it('should include "Get Started" CTA button with dashboard link', () => {
      const html = generateClaimApprovedHTML(mockParams);
      const expectedDashboardUrl = `${mockParams.siteUrl}/dashboard/agency/${mockParams.agencySlug}`;

      expect(html).toContain('Get Started');
      expect(html).toContain(`href="${expectedDashboardUrl}"`);
      expect(html).toContain('background-color: #059669'); // Green button
    });

    it('should include "Next Steps" section with numbered list', () => {
      const html = generateClaimApprovedHTML(mockParams);

      expect(html).toContain('Next Steps');
      expect(html).toContain('<ol');
      expect(html).toContain('Visit your agency dashboard');
      expect(html).toContain('Review and update your profile');
      expect(html).toContain('Add detailed service descriptions');
      expect(html).toContain('Start connecting with potential clients');
    });

    it('should include support contact email', () => {
      const html = generateClaimApprovedHTML(mockParams);

      expect(html).toContain('support@findconstructionstaffing.com');
      expect(html).toContain(
        'href="mailto:support@findconstructionstaffing.com"'
      );
    });

    it('should include welcome message at the end', () => {
      const html = generateClaimApprovedHTML(mockParams);

      expect(html).toContain('Welcome aboard,');
      expect(html).toContain('The FindConstructionStaffing Team');
    });

    it('should include footer with copyright', () => {
      const html = generateClaimApprovedHTML(mockParams);
      const currentYear = new Date().getFullYear();

      expect(html).toContain(`© ${currentYear} FindConstructionStaffing`);
      expect(html).toContain('All rights reserved');
    });

    it('should include site URL in footer', () => {
      const html = generateClaimApprovedHTML(mockParams);

      expect(html).toContain('Visit our website');
      expect(html).toContain(`href="${mockParams.siteUrl}"`);
    });

    it('should include FindConstructionStaffing branding in header', () => {
      const html = generateClaimApprovedHTML(mockParams);

      expect(html).toContain('<h1');
      expect(html).toContain('FindConstructionStaffing</h1>');
    });

    it('should use proper email styling (inline styles)', () => {
      const html = generateClaimApprovedHTML(mockParams);

      expect(html).toContain('style=');
      expect(html).toContain('font-family:');
      expect(html).toContain('color:');
    });

    it('should include table-based layout for email compatibility', () => {
      const html = generateClaimApprovedHTML(mockParams);

      expect(html).toContain('<table role="presentation"');
      expect(html).toContain('cellpadding="0"');
      expect(html).toContain('cellspacing="0"');
    });

    it('should use green color scheme for success', () => {
      const html = generateClaimApprovedHTML(mockParams);

      expect(html).toContain('#059669'); // Green button
      expect(html).toContain('#d1fae5'); // Light green background
      expect(html).toContain('#f0fdf4'); // Success box background
    });
  });

  describe('generateClaimApprovedText', () => {
    it('should generate plain text email', () => {
      const text = generateClaimApprovedText(mockParams);

      expect(text).not.toContain('<');
      expect(text).not.toContain('>');
      expect(text).not.toContain('undefined');
    });

    it('should include recipient name in greeting when provided', () => {
      const text = generateClaimApprovedText(mockParams);

      expect(text).toContain('Hi John Doe,');
    });

    it('should use generic greeting when recipient name not provided', () => {
      const paramsWithoutName = { ...mockParams, recipientName: undefined };
      const text = generateClaimApprovedText(paramsWithoutName);

      expect(text).toContain('Hello,');
      expect(text).not.toContain('Hi John Doe');
    });

    it('should include congratulations heading', () => {
      const text = generateClaimApprovedText(mockParams);

      expect(text).toContain('Congratulations!');
      expect(text).toContain('Your Claim Has Been Approved');
    });

    it('should include agency name', () => {
      const text = generateClaimApprovedText(mockParams);

      expect(text).toContain('Test Construction Staffing');
    });

    it('should include agency details section', () => {
      const text = generateClaimApprovedText(mockParams);

      expect(text).toContain('AGENCY DETAILS');
      expect(text).toContain('Agency: Test Construction Staffing');
      expect(text).toContain('Your Role: Agency Owner');
    });

    it('should include "What You Can Do Now" section with bullet points', () => {
      const text = generateClaimApprovedText(mockParams);

      expect(text).toContain('WHAT YOU CAN DO NOW');
      expect(text).toContain('* Update your agency profile');
      expect(text).toContain('* Add or modify services');
      expect(text).toContain('* Manage your agency');
      expect(text).toContain('* Upload your agency logo');
      expect(text).toContain('* Respond to inquiries');
    });

    it('should include dashboard link', () => {
      const text = generateClaimApprovedText(mockParams);
      const expectedDashboardUrl = `${mockParams.siteUrl}/dashboard/agency/${mockParams.agencySlug}`;

      expect(text).toContain('Get Started:');
      expect(text).toContain(expectedDashboardUrl);
    });

    it('should include "Next Steps" section with numbered list', () => {
      const text = generateClaimApprovedText(mockParams);

      expect(text).toContain('NEXT STEPS');
      expect(text).toContain('1. Visit your agency dashboard');
      expect(text).toContain('2. Review and update your profile');
      expect(text).toContain('3. Add detailed service descriptions');
      expect(text).toContain('4. Start connecting with potential clients');
    });

    it('should include support contact email', () => {
      const text = generateClaimApprovedText(mockParams);

      expect(text).toContain('support@findconstructionstaffing.com');
    });

    it('should include welcome message at the end', () => {
      const text = generateClaimApprovedText(mockParams);

      expect(text).toContain('Welcome aboard,');
      expect(text).toContain('The FindConstructionStaffing Team');
    });

    it('should include footer with copyright', () => {
      const text = generateClaimApprovedText(mockParams);
      const currentYear = new Date().getFullYear();

      expect(text).toContain(`© ${currentYear} FindConstructionStaffing`);
      expect(text).toContain('All rights reserved');
    });

    it('should include site URL in footer', () => {
      const text = generateClaimApprovedText(mockParams);

      expect(text).toContain(`Visit our website: ${mockParams.siteUrl}`);
    });

    it('should include FindConstructionStaffing branding', () => {
      const text = generateClaimApprovedText(mockParams);

      expect(text).toContain('FINDCONSTRUCTIONSTAFFING');
    });

    it('should use text-based section separators', () => {
      const text = generateClaimApprovedText(mockParams);

      expect(text).toContain('---------------'); // Under Agency Details
      expect(text).toContain('--------------------'); // Under What You Can Do Now
      expect(text).toContain('-----------'); // Under Next Steps
      expect(text).toContain('---'); // Footer separator
    });

    it('should be properly formatted for plain text', () => {
      const text = generateClaimApprovedText(mockParams);

      // Check for line breaks and structure
      const lines = text.split('\n');
      expect(lines.length).toBeGreaterThan(10);

      // Check that it starts with branding
      expect(lines[0]).toContain('FINDCONSTRUCTIONSTAFFING');
    });
  });

  describe('Email Content Consistency', () => {
    it('should include same core content in both HTML and text versions', () => {
      const html = generateClaimApprovedHTML(mockParams);
      const text = generateClaimApprovedText(mockParams);

      // Core content that should appear in both
      const coreContent = [
        'Test Construction Staffing',
        'Agency Owner',
        'Update your agency profile',
        'support@findconstructionstaffing.com',
        `/dashboard/agency/${mockParams.agencySlug}`,
        'Welcome aboard',
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

      const html = generateClaimApprovedHTML(paramsWithSpecialChars);
      const text = generateClaimApprovedText(paramsWithSpecialChars);

      // Both should include the content
      expect(html).toContain('Test & Construction <Special> Staffing');
      expect(text).toContain('Test & Construction <Special> Staffing');
    });

    it('should handle different site URLs correctly', () => {
      const paramsWithLocalhost = {
        ...mockParams,
        siteUrl: 'http://localhost:3000',
      };

      const html = generateClaimApprovedHTML(paramsWithLocalhost);
      const text = generateClaimApprovedText(paramsWithLocalhost);

      const expectedDashboardUrl = `http://localhost:3000/dashboard/agency/${mockParams.agencySlug}`;

      expect(html).toContain(expectedDashboardUrl);
      expect(text).toContain(expectedDashboardUrl);
    });

    it('should handle agency slugs with hyphens', () => {
      const paramsWithHyphenatedSlug = {
        ...mockParams,
        agencySlug: 'super-long-agency-name-with-hyphens',
      };

      const html = generateClaimApprovedHTML(paramsWithHyphenatedSlug);
      const text = generateClaimApprovedText(paramsWithHyphenatedSlug);

      const expectedDashboardUrl = `${mockParams.siteUrl}/dashboard/agency/super-long-agency-name-with-hyphens`;

      expect(html).toContain(expectedDashboardUrl);
      expect(text).toContain(expectedDashboardUrl);
    });
  });
});
