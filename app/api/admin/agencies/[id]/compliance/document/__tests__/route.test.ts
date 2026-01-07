/**
 * @jest-environment node
 */

import { createMockNextRequest } from '@/__tests__/utils/api-mocks';
import { HTTP_STATUS, ERROR_CODES } from '@/types/api';
import { POST, DELETE } from '../route';

const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockStorageFrom = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
    storage: {
      from: mockStorageFrom,
    },
  })),
}));

describe('POST /api/admin/agencies/[id]/compliance/document', () => {
  const mockUser = { id: 'admin-123', email: 'admin@test.com' };
  const mockAgencyId = 'agency-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createFormData = (file: File, complianceType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('compliance_type', complianceType);
    return formData;
  };

  const createPdfFile = () => {
    return new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
  };

  const createImageFile = () => {
    return new File(['image content'], 'test.png', { type: 'image/png' });
  };

  const createLargeFile = () => {
    const size = 11 * 1024 * 1024; // 11MB
    const buffer = new ArrayBuffer(size);
    return new File([buffer], 'large.pdf', { type: 'application/pdf' });
  };

  describe('Authentication and Authorization', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const formData = createFormData(createPdfFile(), 'osha_certified');
      const request = createMockNextRequest({
        method: 'POST',
        body: formData,
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(json.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('returns 500 when profile fetch fails', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          };
        }
        return {};
      });

      const formData = createFormData(createPdfFile(), 'osha_certified');
      const request = createMockNextRequest({
        method: 'POST',
        body: formData,
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(json.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
    });

    it('returns 403 when user is not admin', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'agency_owner' }, // Not admin
              error: null,
            }),
          };
        }
        return {};
      });

      const formData = createFormData(createPdfFile(), 'osha_certified');
      const request = createMockNextRequest({
        method: 'POST',
        body: formData,
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(json.error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(json.error.message).toBe('Admin access required');
    });

    it('returns 404 when agency not found', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          };
        }
        return {};
      });

      const formData = createFormData(createPdfFile(), 'osha_certified');
      const request = createMockNextRequest({
        method: 'POST',
        body: formData,
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(json.error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(json.error.message).toBe('Agency not found');
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockAgencyId },
              error: null,
            }),
          };
        }
        return {};
      });
    });

    it('returns 400 when form data is invalid', async () => {
      const request = createMockNextRequest({
        method: 'POST',
        body: 'not form data',
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(json.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      // Note: In test environment, invalid form data results in empty FormData,
      // which then fails the file validation
      expect(json.error.message).toMatch(/file|form data/i);
    });

    it('returns 400 when file is missing', async () => {
      const formData = new FormData();
      formData.append('compliance_type', 'osha_certified');

      const request = createMockNextRequest({
        method: 'POST',
        body: formData,
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(json.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(json.error.message).toBe('No file provided');
    });

    it('returns 400 when compliance_type is missing', async () => {
      const formData = new FormData();
      formData.append('file', createPdfFile());

      const request = createMockNextRequest({
        method: 'POST',
        body: formData,
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(json.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(json.error.message).toBe('Invalid or missing compliance_type');
    });

    it('returns 400 when compliance_type is invalid', async () => {
      const formData = createFormData(createPdfFile(), 'invalid_type');

      const request = createMockNextRequest({
        method: 'POST',
        body: formData,
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(json.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(json.error.message).toBe('Invalid or missing compliance_type');
    });

    it('returns 400 when file type is invalid', async () => {
      const invalidFile = new File(['content'], 'test.txt', {
        type: 'text/plain',
      });
      const formData = createFormData(invalidFile, 'osha_certified');

      const request = createMockNextRequest({
        method: 'POST',
        body: formData,
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(json.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(json.error.message).toBe(
        'Invalid file type. Accepted types: PDF, PNG, JPG'
      );
    });

    it('returns 400 when file size exceeds limit', async () => {
      const largeFile = createLargeFile();
      const formData = createFormData(largeFile, 'osha_certified');

      const request = createMockNextRequest({
        method: 'POST',
        body: formData,
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(json.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(json.error.message).toBe('File too large. Maximum size is 10MB');
    });
  });

  describe('Successful Upload', () => {
    const mockPublicUrl =
      'https://storage.example.com/compliance-documents/agency-456/osha_certified/123456.pdf';

    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockAgencyId },
              error: null,
            }),
          };
        }
        if (table === 'agency_compliance') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // No existing compliance
            }),
            upsert: jest.fn().mockResolvedValue({
              data: {},
              error: null,
            }),
          };
        }
        return {};
      });

      mockStorageFrom.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: mockPublicUrl },
        }),
        remove: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });
    });

    it('uploads PDF file successfully', async () => {
      const formData = createFormData(createPdfFile(), 'osha_certified');
      const request = createMockNextRequest({
        method: 'POST',
        body: formData,
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json.success).toBe(true);
      expect(json.data.document_url).toBe(mockPublicUrl);
    });

    it('uploads image file successfully', async () => {
      const formData = createFormData(createImageFile(), 'drug_testing');
      const request = createMockNextRequest({
        method: 'POST',
        body: formData,
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json.success).toBe(true);
      expect(json.data.document_url).toBe(mockPublicUrl);
    });

    it('replaces existing document when uploading new one', async () => {
      const oldDocumentUrl =
        'https://storage.example.com/compliance-documents/agency-456/osha_certified/old.pdf';

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockAgencyId },
              error: null,
            }),
          };
        }
        if (table === 'agency_compliance') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                document_url: oldDocumentUrl,
                is_active: true,
              },
              error: null,
            }),
            upsert: jest.fn().mockResolvedValue({
              data: {},
              error: null,
            }),
          };
        }
        return {};
      });

      const mockRemove = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockStorageFrom.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: mockPublicUrl },
        }),
        remove: mockRemove,
      });

      const formData = createFormData(createPdfFile(), 'osha_certified');
      const request = createMockNextRequest({
        method: 'POST',
        body: formData,
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json.success).toBe(true);
      expect(mockRemove).toHaveBeenCalled();
    });
  });

  describe('Upload Errors', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockAgencyId },
              error: null,
            }),
          };
        }
        if (table === 'agency_compliance') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          };
        }
        return {};
      });
    });

    it('returns 500 when storage upload fails', async () => {
      mockStorageFrom.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Storage error' },
        }),
      });

      const formData = createFormData(createPdfFile(), 'osha_certified');
      const request = createMockNextRequest({
        method: 'POST',
        body: formData,
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(json.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(json.error.message).toBe('Failed to upload document');
    });

    it('returns 500 when compliance record update fails', async () => {
      mockStorageFrom.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://test.com/doc.pdf' },
        }),
        remove: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockAgencyId },
              error: null,
            }),
          };
        }
        if (table === 'agency_compliance') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
            upsert: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Update failed' },
            }),
          };
        }
        return {};
      });

      const formData = createFormData(createPdfFile(), 'osha_certified');
      const request = createMockNextRequest({
        method: 'POST',
        body: formData,
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(json.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(json.error.message).toBe('Failed to update compliance record');
    });
  });
});

describe('DELETE /api/admin/agencies/[id]/compliance/document', () => {
  const mockUser = { id: 'admin-123', email: 'admin@test.com' };
  const mockAgencyId = 'agency-456';
  const mockDocumentUrl =
    'https://storage.example.com/compliance-documents/agency-456/osha_certified/123456.pdf';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication and Authorization', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = createMockNextRequest({
        method: 'DELETE',
        searchParams: { compliance_type: 'osha_certified' },
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(json.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('returns 403 when user is not admin', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'agency_owner' },
              error: null,
            }),
          };
        }
        return {};
      });

      const request = createMockNextRequest({
        method: 'DELETE',
        searchParams: { compliance_type: 'osha_certified' },
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(json.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });

    it('returns 404 when agency not found', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          };
        }
        return {};
      });

      const request = createMockNextRequest({
        method: 'DELETE',
        searchParams: { compliance_type: 'osha_certified' },
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(json.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockAgencyId },
              error: null,
            }),
          };
        }
        return {};
      });
    });

    it('returns 400 when compliance_type is missing', async () => {
      const request = createMockNextRequest({
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(json.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('returns 400 when compliance_type is invalid', async () => {
      const request = createMockNextRequest({
        method: 'DELETE',
        searchParams: { compliance_type: 'invalid_type' },
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(json.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('Successful Deletion', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockAgencyId },
              error: null,
            }),
          };
        }
        if (table === 'agency_compliance') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                document_url: mockDocumentUrl,
              },
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          };
        }
        return {};
      });

      mockStorageFrom.mockReturnValue({
        remove: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });
    });

    it('deletes document successfully', async () => {
      const request = createMockNextRequest({
        method: 'DELETE',
        searchParams: { compliance_type: 'osha_certified' },
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json.success).toBe(true);
      expect(json.data.document_url).toBe(null);
    });

    it('handles deletion when no document exists', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          };
        }
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockAgencyId },
              error: null,
            }),
          };
        }
        if (table === 'agency_compliance') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                document_url: null,
              },
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          };
        }
        return {};
      });

      const request = createMockNextRequest({
        method: 'DELETE',
        searchParams: { compliance_type: 'osha_certified' },
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockAgencyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json.success).toBe(true);
    });
  });
});
