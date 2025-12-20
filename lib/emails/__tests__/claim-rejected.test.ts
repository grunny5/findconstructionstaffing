/**
 * Tests for claim rejection email templates
 */

import {
  generateClaimRejectedHTML,
  generateClaimRejectedText,
} from '../claim-rejected';

describe('Claim Rejected Email Templates', () => {
  const mockParams = {
    recipientEmail: 'john.doe@example.com',
    recipientName: 'John Doe',
    agencyName: 'Test Construction Staffing',
    agencySlug: 'test-construction-staffing',
    rejectionReason:
      'We were unable to verify your employment at the specified agency. Please provide additional documentation such as a business email from the agency domain or official employment verification.',
    siteUrl: 'https://findconstructionstaffing.com',
  };

  describe('generateClaimRejectedHTML', () => {
    it('should generate valid HTML email', () => {
      const html = generateClaimRejectedHTML(mockParams);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
      expect(html).not.toContain('undefined');
    });

    it('should include recipient name in greeting when provided', () => {
      const html = generateClaimRejectedHTML(mockParams);

      expect(html).toContain('Hi John Doe,');
    });

    it('should use generic greeting when recipient name not provided', () => {
      const paramsWithoutName = { ...mockParams, recipientName: undefined };
      const html = generateClaimRejectedHTML(paramsWithoutName);

      expect(html).toContain('Hello,');
      expect(html).not.toContain('Hi ');
    });

    it('should include "Claim Request Update" heading', () => {
      const html = generateClaimRejectedHTML(mockParams);

      expect(html).toContain('Claim Request Update');
    });

    it('should include agency name', () => {
      const html = generateClaimRejectedHTML(mockParams);

      expect(html).toContain('Test Construction Staffing');
      expect(html).toContain('<strong>Test Construction Staffing</strong>');
    });

    it('should include rejection reason in styled box', () => {
      const html = generateClaimRejectedHTML(mockParams);

      expect(html).toContain('Reason for Denial');
      expect(html).toContain(mockParams.rejectionReason);
      expect(html).toContain('#fef2f2'); // Red background
      expect(html).toContain('#fecaca'); // Red border
    });

    it('should use red/error color scheme for rejection reason', () => {
      const html = generateClaimRejectedHTML(mockParams);

      expect(html).toContain('#fef2f2'); // Light red background
      expect(html).toContain('#fecaca'); // Red border
      expect(html).toContain('#991b1b'); // Dark red heading
      expect(html).toContain('#7f1d1d'); // Dark red text
    });

    it('should include "What You Can Do" section', () => {
      const html = generateClaimRejectedHTML(mockParams);

      expect(html).toContain('What You Can Do');
      expect(html).toContain('Review the reason for denial above');
      expect(html).toContain('Gather any additional verification documents');
      expect(html).toContain(
        'Submit a new claim request with updated information'
      );
    });

    it('should include "Resubmit Claim Request" CTA button with claim link', () => {
      const html = generateClaimRejectedHTML(mockParams);
      const expectedResubmitUrl = `${mockParams.siteUrl}/claim/${mockParams.agencySlug}`;

      expect(html).toContain('Resubmit Claim Request');
      expect(html).toContain(`href="${expectedResubmitUrl}"`);
      expect(html).toContain('background-color: #2563eb'); // Blue button
    });

    it('should include "Need Help?" section with support contact', () => {
      const html = generateClaimRejectedHTML(mockParams);

      expect(html).toContain('Need Help?');
      expect(html).toContain('support@findconstructionstaffing.com');
      expect(html).toContain(
        'href="mailto:support@findconstructionstaffing.com"'
      );
    });

    it('should use blue color scheme for help section', () => {
      const html = generateClaimRejectedHTML(mockParams);

      expect(html).toContain('#eff6ff'); // Light blue background
      expect(html).toContain('#1e40af'); // Blue heading
      expect(html).toContain('#1e3a8a'); // Blue text
    });

    it('should include professional closing message', () => {
      const html = generateClaimRejectedHTML(mockParams);

      expect(html).toContain(
        'We appreciate your understanding and look forward to potentially working with you in the future'
      );
      expect(html).toContain('Best regards,');
      expect(html).toContain('The FindConstructionStaffing Team');
    });

    it('should include footer with copyright', () => {
      const html = generateClaimRejectedHTML(mockParams);
      const currentYear = new Date().getFullYear();

      expect(html).toContain(`© ${currentYear} FindConstructionStaffing`);
      expect(html).toContain('All rights reserved');
    });

    it('should include site URL in footer', () => {
      const html = generateClaimRejectedHTML(mockParams);

      expect(html).toContain('Visit our website');
      expect(html).toContain(`href="${mockParams.siteUrl}"`);
    });

    it('should include FindConstructionStaffing branding in header', () => {
      const html = generateClaimRejectedHTML(mockParams);

      expect(html).toContain('<h1');
      expect(html).toContain('FindConstructionStaffing</h1>');
    });

    it('should use proper email styling (inline styles)', () => {
      const html = generateClaimRejectedHTML(mockParams);

      expect(html).toContain('style=');
      expect(html).toContain('font-family:');
      expect(html).toContain('color:');
    });

    it('should include table-based layout for email compatibility', () => {
      const html = generateClaimRejectedHTML(mockParams);

      expect(html).toContain('<table role="presentation"');
      expect(html).toContain('cellpadding="0"');
      expect(html).toContain('cellspacing="0"');
    });

    it('should preserve rejection reason whitespace and line breaks', () => {
      const paramsWithMultilineReason = {
        ...mockParams,
        rejectionReason:
          'Reason 1: Missing documentation\nReason 2: Invalid business email',
      };
      const html = generateClaimRejectedHTML(paramsWithMultilineReason);

      expect(html).toContain('white-space: pre-wrap');
      expect(html).toContain(paramsWithMultilineReason.rejectionReason);
    });

    it('should have polite and professional tone throughout', () => {
      const html = generateClaimRejectedHTML(mockParams);

      // Check for polite language
      expect(html).toContain('Thank you for your interest');
      expect(html).toContain('unable to approve it at this time');
      expect(html).toContain('If you believe this decision was made in error');
      expect(html).toContain('our support team is here to help');
      expect(html).toContain('We appreciate your understanding');
    });
  });

  describe('generateClaimRejectedText', () => {
    it('should generate plain text email', () => {
      const text = generateClaimRejectedText(mockParams);

      expect(text).not.toContain('<');
      expect(text).not.toContain('>');
      expect(text).not.toContain('undefined');
    });

    it('should include recipient name in greeting when provided', () => {
      const text = generateClaimRejectedText(mockParams);

      expect(text).toContain('Hi John Doe,');
    });

    it('should use generic greeting when recipient name not provided', () => {
      const paramsWithoutName = { ...mockParams, recipientName: undefined };
      const text = generateClaimRejectedText(paramsWithoutName);

      expect(text).toContain('Hello,');
      expect(text).not.toContain('Hi John Doe');
    });

    it('should include "Claim Request Update" heading', () => {
      const text = generateClaimRejectedText(mockParams);

      expect(text).toContain('Claim Request Update');
    });

    it('should include agency name', () => {
      const text = generateClaimRejectedText(mockParams);

      expect(text).toContain('Test Construction Staffing');
    });

    it('should include rejection reason section', () => {
      const text = generateClaimRejectedText(mockParams);

      expect(text).toContain('REASON FOR DENIAL');
      expect(text).toContain('------------------');
      expect(text).toContain(mockParams.rejectionReason);
    });

    it('should include "What You Can Do" section with bullet points', () => {
      const text = generateClaimRejectedText(mockParams);

      expect(text).toContain('WHAT YOU CAN DO');
      expect(text).toContain('----------------');
      expect(text).toContain('* Review the reason for denial above');
      expect(text).toContain('* Gather any additional verification documents');
      expect(text).toContain(
        '* Submit a new claim request with updated information'
      );
    });

    it('should include resubmit claim link', () => {
      const text = generateClaimRejectedText(mockParams);
      const expectedResubmitUrl = `${mockParams.siteUrl}/claim/${mockParams.agencySlug}`;

      expect(text).toContain('Resubmit your claim:');
      expect(text).toContain(expectedResubmitUrl);
    });

    it('should include "Need Help?" section with support contact', () => {
      const text = generateClaimRejectedText(mockParams);

      expect(text).toContain('NEED HELP?');
      expect(text).toContain('-----------');
      expect(text).toContain('support@findconstructionstaffing.com');
    });

    it('should include professional closing message', () => {
      const text = generateClaimRejectedText(mockParams);

      expect(text).toContain(
        'We appreciate your understanding and look forward to potentially working with you in the future'
      );
      expect(text).toContain('Best regards,');
      expect(text).toContain('The FindConstructionStaffing Team');
    });

    it('should include footer with copyright', () => {
      const text = generateClaimRejectedText(mockParams);
      const currentYear = new Date().getFullYear();

      expect(text).toContain(`© ${currentYear} FindConstructionStaffing`);
      expect(text).toContain('All rights reserved');
    });

    it('should include site URL in footer', () => {
      const text = generateClaimRejectedText(mockParams);

      expect(text).toContain(`Visit our website: ${mockParams.siteUrl}`);
    });

    it('should include FindConstructionStaffing branding', () => {
      const text = generateClaimRejectedText(mockParams);

      expect(text).toContain('FINDCONSTRUCTIONSTAFFING');
    });

    it('should use text-based section separators', () => {
      const text = generateClaimRejectedText(mockParams);

      expect(text).toContain('------------------'); // Under Reason for Denial
      expect(text).toContain('----------------'); // Under What You Can Do
      expect(text).toContain('-----------'); // Under Need Help
      expect(text).toContain('---'); // Footer separator
    });

    it('should be properly formatted for plain text', () => {
      const text = generateClaimRejectedText(mockParams);

      // Check for line breaks and structure
      const lines = text.split('\n');
      expect(lines.length).toBeGreaterThan(10);

      // Check that it starts with branding
      expect(lines[0]).toContain('FINDCONSTRUCTIONSTAFFING');
    });
  });

  describe('Email Content Consistency', () => {
    it('should include same core content in both HTML and text versions', () => {
      const html = generateClaimRejectedHTML(mockParams);
      const text = generateClaimRejectedText(mockParams);

      // Core content that should appear in both
      const coreContent = [
        'Test Construction Staffing',
        mockParams.rejectionReason,
        'Review the reason for denial above',
        'support@findconstructionstaffing.com',
        `/claim/${mockParams.agencySlug}`,
        'We appreciate your understanding',
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

      const html = generateClaimRejectedHTML(paramsWithSpecialChars);
      const text = generateClaimRejectedText(paramsWithSpecialChars);

      // HTML should include escaped entities
      expect(html).toContain(
        'Test &amp; Construction &lt;Special&gt; Staffing'
      );
      // Plain text should NOT escape - display as-is
      expect(text).toContain('Test & Construction <Special> Staffing');
    });

    it('should handle special characters in rejection reason', () => {
      const paramsWithSpecialChars = {
        ...mockParams,
        rejectionReason:
          'Your email domain "example.com" doesn\'t match agency website & documentation shows <different> ownership',
      };

      const html = generateClaimRejectedHTML(paramsWithSpecialChars);
      const text = generateClaimRejectedText(paramsWithSpecialChars);

      // HTML should include escaped entities
      const escapedReason =
        'Your email domain &quot;example.com&quot; doesn&#039;t match agency website &amp; documentation shows &lt;different&gt; ownership';
      expect(html).toContain(escapedReason);
      // Plain text should NOT escape - display as-is
      expect(text).toContain(paramsWithSpecialChars.rejectionReason);
    });

    it('should handle different site URLs correctly', () => {
      const paramsWithLocalhost = {
        ...mockParams,
        siteUrl: 'http://localhost:3000',
      };

      const html = generateClaimRejectedHTML(paramsWithLocalhost);
      const text = generateClaimRejectedText(paramsWithLocalhost);

      const expectedResubmitUrl = `http://localhost:3000/claim/${mockParams.agencySlug}`;

      expect(html).toContain(expectedResubmitUrl);
      expect(text).toContain(expectedResubmitUrl);
    });

    it('should handle agency slugs with hyphens', () => {
      const paramsWithHyphenatedSlug = {
        ...mockParams,
        agencySlug: 'super-long-agency-name-with-hyphens',
      };

      const html = generateClaimRejectedHTML(paramsWithHyphenatedSlug);
      const text = generateClaimRejectedText(paramsWithHyphenatedSlug);

      const expectedResubmitUrl = `${mockParams.siteUrl}/claim/super-long-agency-name-with-hyphens`;

      expect(html).toContain(expectedResubmitUrl);
      expect(text).toContain(expectedResubmitUrl);
    });

    it('should handle multiline rejection reasons in both formats', () => {
      const paramsWithMultilineReason = {
        ...mockParams,
        rejectionReason:
          'Multiple issues found:\n\n1. Business email domain does not match\n2. Missing employment verification\n3. Invalid phone number format',
      };

      const html = generateClaimRejectedHTML(paramsWithMultilineReason);
      const text = generateClaimRejectedText(paramsWithMultilineReason);

      expect(html).toContain(paramsWithMultilineReason.rejectionReason);
      expect(text).toContain(paramsWithMultilineReason.rejectionReason);
    });
  });

  describe('Tone and Professionalism', () => {
    it('should maintain respectful tone without being discouraging', () => {
      const html = generateClaimRejectedHTML(mockParams);

      // Should NOT contain harsh language
      expect(html).not.toContain('denied');
      expect(html).not.toContain('failed');
      expect(html).not.toContain('rejected'); // Uses "unable to approve" instead

      // Should contain encouraging language
      expect(html).toContain('Thank you for your interest');
      expect(html).toContain('If you believe this decision was made in error');
      expect(html).toContain('you may resubmit your claim');
    });

    it('should provide clear actionable next steps', () => {
      const text = generateClaimRejectedText(mockParams);

      expect(text).toContain('WHAT YOU CAN DO');
      expect(text).toContain('Review the reason');
      expect(text).toContain('Gather any additional verification');
      expect(text).toContain('Submit a new claim request');
    });

    it('should offer support and assistance', () => {
      const html = generateClaimRejectedHTML(mockParams);

      expect(html).toContain('Need Help?');
      expect(html).toContain('our support team is here to help');
      expect(html).toContain('support@findconstructionstaffing.com');
    });
  });
});
