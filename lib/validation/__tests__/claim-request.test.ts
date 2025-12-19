/**
 * @jest-environment node
 */

import { z } from 'zod';
import {
  ClaimRequestSchema,
  VerificationMethodEnum,
  ClaimRequestResponseSchema,
} from '../claim-request';

describe('VerificationMethodEnum', () => {
  it('should accept valid verification methods', () => {
    expect(VerificationMethodEnum.parse('email')).toBe('email');
    expect(VerificationMethodEnum.parse('phone')).toBe('phone');
    expect(VerificationMethodEnum.parse('manual')).toBe('manual');
  });

  it('should reject invalid verification methods', () => {
    expect(() => VerificationMethodEnum.parse('invalid')).toThrow();
    expect(() => VerificationMethodEnum.parse('EMAIL')).toThrow();
    expect(() => VerificationMethodEnum.parse('')).toThrow();
    expect(() => VerificationMethodEnum.parse(null)).toThrow();
  });
});

describe('ClaimRequestSchema', () => {
  const validClaimRequest = {
    agency_id: '123e4567-e89b-12d3-a456-426614174000',
    business_email: 'john@acmestaffing.com',
    phone_number: '+1-555-123-4567',
    position_title: 'CEO',
    verification_method: 'email' as const,
    additional_notes: 'I am the owner of this agency',
  };

  describe('agency_id validation', () => {
    it('should accept valid UUID', () => {
      const result = ClaimRequestSchema.parse(validClaimRequest);
      expect(result.agency_id).toBe(validClaimRequest.agency_id);
    });

    it('should reject invalid UUID format', () => {
      expect(() =>
        ClaimRequestSchema.parse({
          ...validClaimRequest,
          agency_id: 'not-a-uuid',
        })
      ).toThrow();

      expect(() =>
        ClaimRequestSchema.parse({
          ...validClaimRequest,
          agency_id: '12345',
        })
      ).toThrow();
    });

    it('should reject empty agency_id', () => {
      expect(() =>
        ClaimRequestSchema.parse({
          ...validClaimRequest,
          agency_id: '',
        })
      ).toThrow();
    });
  });

  describe('business_email validation', () => {
    it('should accept valid email addresses', () => {
      const emails = [
        'user@example.com',
        'john.doe@acmestaffing.com',
        'admin+tag@example.co.uk',
      ];

      emails.forEach((email) => {
        const result = ClaimRequestSchema.parse({
          ...validClaimRequest,
          business_email: email,
        });
        expect(result.business_email).toBe(email.toLowerCase());
      });
    });

    it('should convert email to lowercase', () => {
      const result = ClaimRequestSchema.parse({
        ...validClaimRequest,
        business_email: 'JOHN@EXAMPLE.COM',
      });
      expect(result.business_email).toBe('john@example.com');
    });

    it('should trim whitespace from email', () => {
      const result = ClaimRequestSchema.parse({
        ...validClaimRequest,
        business_email: '  john@example.com  ',
      });
      expect(result.business_email).toBe('john@example.com');
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        'user@',
        '@example.com',
        'user @example.com',
        'user@domain',
        '',
      ];

      invalidEmails.forEach((email) => {
        expect(() =>
          ClaimRequestSchema.parse({
            ...validClaimRequest,
            business_email: email,
          })
        ).toThrow();
      });
    });

    it('should reject emails that are too short', () => {
      expect(() =>
        ClaimRequestSchema.parse({
          ...validClaimRequest,
          business_email: 'a@b.c',
        })
      ).toThrow();
    });

    it('should reject emails that are too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(() =>
        ClaimRequestSchema.parse({
          ...validClaimRequest,
          business_email: longEmail,
        })
      ).toThrow();
    });
  });

  describe('phone_number validation', () => {
    it('should accept valid phone number formats', () => {
      const validPhones = [
        '+1-555-123-4567',
        '+44 20 1234 5678',
        '+1 (555) 123-4567',
        '+15551234567',
        '+1.555.123.4567',
      ];

      validPhones.forEach((phone) => {
        const result = ClaimRequestSchema.parse({
          ...validClaimRequest,
          phone_number: phone,
        });
        expect(result.phone_number).toBeTruthy();
      });
    });

    it('should trim whitespace from phone number', () => {
      const result = ClaimRequestSchema.parse({
        ...validClaimRequest,
        phone_number: '  +1-555-123-4567  ',
      });
      expect(result.phone_number).toBe('+1-555-123-4567');
    });

    it('should reject phone numbers that are too short', () => {
      expect(() =>
        ClaimRequestSchema.parse({
          ...validClaimRequest,
          phone_number: '+1234',
        })
      ).toThrow();
    });

    it('should reject phone numbers that are too long', () => {
      const longPhone = '+1' + '5'.repeat(20);
      expect(() =>
        ClaimRequestSchema.parse({
          ...validClaimRequest,
          phone_number: longPhone,
        })
      ).toThrow();
    });

    it('should reject invalid phone number formats', () => {
      const invalidPhones = ['not-a-phone', '123abc456', '', 'phone number'];

      invalidPhones.forEach((phone) => {
        expect(() =>
          ClaimRequestSchema.parse({
            ...validClaimRequest,
            phone_number: phone,
          })
        ).toThrow();
      });
    });
  });

  describe('position_title validation', () => {
    it('should accept valid position titles', () => {
      const titles = ['CEO', 'Chief Executive Officer', 'VP of Operations'];

      titles.forEach((title) => {
        const result = ClaimRequestSchema.parse({
          ...validClaimRequest,
          position_title: title,
        });
        expect(result.position_title).toBe(title);
      });
    });

    it('should trim whitespace from position title', () => {
      const result = ClaimRequestSchema.parse({
        ...validClaimRequest,
        position_title: '  CEO  ',
      });
      expect(result.position_title).toBe('CEO');
    });

    it('should reject position titles that are too short', () => {
      expect(() =>
        ClaimRequestSchema.parse({
          ...validClaimRequest,
          position_title: 'A',
        })
      ).toThrow();
    });

    it('should reject position titles that are too long', () => {
      const longTitle = 'A'.repeat(101);
      expect(() =>
        ClaimRequestSchema.parse({
          ...validClaimRequest,
          position_title: longTitle,
        })
      ).toThrow();
    });

    it('should reject empty position titles', () => {
      expect(() =>
        ClaimRequestSchema.parse({
          ...validClaimRequest,
          position_title: '',
        })
      ).toThrow();
    });
  });

  describe('verification_method validation', () => {
    it('should accept all valid verification methods', () => {
      ['email', 'phone', 'manual'].forEach((method) => {
        const result = ClaimRequestSchema.parse({
          ...validClaimRequest,
          verification_method: method,
        });
        expect(result.verification_method).toBe(method);
      });
    });

    it('should reject invalid verification methods', () => {
      const invalidMethods = ['sms', 'EMAIL', 'invalid', ''];

      invalidMethods.forEach((method) => {
        expect(() =>
          ClaimRequestSchema.parse({
            ...validClaimRequest,
            verification_method: method,
          })
        ).toThrow();
      });
    });
  });

  describe('additional_notes validation', () => {
    it('should accept valid additional notes', () => {
      const notes = [
        'I am the owner',
        'This is a longer note with more details',
        undefined,
      ];

      notes.forEach((note) => {
        const result = ClaimRequestSchema.parse({
          ...validClaimRequest,
          additional_notes: note,
        });
        expect(result.additional_notes).toBe(note);
      });
    });

    it('should trim whitespace from notes', () => {
      const result = ClaimRequestSchema.parse({
        ...validClaimRequest,
        additional_notes: '  Some notes  ',
      });
      expect(result.additional_notes).toBe('Some notes');
    });

    it('should transform empty string to undefined', () => {
      const result = ClaimRequestSchema.parse({
        ...validClaimRequest,
        additional_notes: '',
      });
      expect(result.additional_notes).toBeUndefined();
    });

    it('should be optional (can be omitted)', () => {
      const { additional_notes, ...requestWithoutNotes } = validClaimRequest;
      const result = ClaimRequestSchema.parse(requestWithoutNotes);
      expect(result.additional_notes).toBeUndefined();
    });

    it('should reject notes that are too long', () => {
      const longNotes = 'A'.repeat(1001);
      expect(() =>
        ClaimRequestSchema.parse({
          ...validClaimRequest,
          additional_notes: longNotes,
        })
      ).toThrow();
    });
  });

  describe('Complete validation', () => {
    it('should accept a complete valid request', () => {
      const result = ClaimRequestSchema.parse(validClaimRequest);
      expect(result).toMatchObject({
        agency_id: validClaimRequest.agency_id,
        business_email: validClaimRequest.business_email.toLowerCase(),
        phone_number: validClaimRequest.phone_number,
        position_title: validClaimRequest.position_title,
        verification_method: validClaimRequest.verification_method,
        additional_notes: validClaimRequest.additional_notes,
      });
    });

    it('should reject request with missing required fields', () => {
      const requiredFields = [
        'agency_id',
        'business_email',
        'phone_number',
        'position_title',
        'verification_method',
      ];

      requiredFields.forEach((field) => {
        const { [field]: omitted, ...incompleteRequest } =
          validClaimRequest as any;
        expect(() => ClaimRequestSchema.parse(incompleteRequest)).toThrow();
      });
    });

    it('should strip unknown fields', () => {
      const requestWithExtra = {
        ...validClaimRequest,
        unknownField: 'should be stripped',
        anotherUnknown: 123,
      };

      const result = ClaimRequestSchema.parse(requestWithExtra);
      expect(result).not.toHaveProperty('unknownField');
      expect(result).not.toHaveProperty('anotherUnknown');
    });
  });
});

describe('ClaimRequestResponseSchema', () => {
  const validResponse = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    agency_id: '123e4567-e89b-12d3-a456-426614174001',
    user_id: '123e4567-e89b-12d3-a456-426614174002',
    status: 'pending' as const,
    email_domain_verified: true,
    created_at: '2024-01-01T00:00:00Z',
  };

  it('should accept valid response', () => {
    const result = ClaimRequestResponseSchema.parse(validResponse);
    expect(result).toMatchObject(validResponse);
  });

  it('should accept all valid status values', () => {
    const statuses = ['pending', 'under_review', 'approved', 'rejected'];

    statuses.forEach((status) => {
      const result = ClaimRequestResponseSchema.parse({
        ...validResponse,
        status,
      });
      expect(result.status).toBe(status);
    });
  });

  it('should reject invalid status values', () => {
    expect(() =>
      ClaimRequestResponseSchema.parse({
        ...validResponse,
        status: 'invalid',
      })
    ).toThrow();
  });

  it('should reject invalid UUID formats', () => {
    expect(() =>
      ClaimRequestResponseSchema.parse({
        ...validResponse,
        id: 'not-a-uuid',
      })
    ).toThrow();
  });

  it('should reject non-boolean email_domain_verified', () => {
    expect(() =>
      ClaimRequestResponseSchema.parse({
        ...validResponse,
        email_domain_verified: 'true',
      })
    ).toThrow();
  });
});
