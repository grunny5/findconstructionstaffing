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

describe('POST /api/dashboard/compliance/document', () => {
  const mockUser = { id: 'user-123', email: 'owner@test.com' };
  const mockAgency = { id: 'agency-123' };

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

      const response = await POST(request);
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

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(json.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
    });

    it('returns 403 when user has no claimed agency', async () => {
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

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(json.error.code).toBe(ERROR_CODES.FORBIDDEN);
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
              data: { role: 'agency_owner' },
              error: null,
            }),
          };
        }
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockAgency,
              error: null,
            }),
          };
        }
        return {};
      });
    });

    it('returns 400 when no file provided', async () => {
      const formData = new FormData();
      formData.append('compliance_type', 'osha_certified');

      const request = createMockNextRequest({
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
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

      const response = await POST(request);
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

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(json.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
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

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(json.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(json.error.message).toContain('Invalid file type');
    });

    it('returns 400 when file is too large', async () => {
      const largeFile = new File(
        [new ArrayBuffer(11 * 1024 * 1024)],
        'test.pdf',
        {
          type: 'application/pdf',
        }
      );
      const formData = createFormData(largeFile, 'osha_certified');

      const request = createMockNextRequest({
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(json.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(json.error.message).toContain('File too large');
    });
  });

  describe('File Upload Success', () => {
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
              data: { role: 'agency_owner' },
              error: null,
            }),
          };
        }
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockAgency,
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
              error: null,
            }),
          };
        }
        return {};
      });

      mockStorageFrom.mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        remove: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/doc.pdf' },
        }),
      });
    });

    it('uploads PDF file successfully', async () => {
      const formData = createFormData(createPdfFile(), 'osha_certified');
      const request = createMockNextRequest({
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json.success).toBe(true);
      expect(json.data.document_url).toBe(
        'https://storage.example.com/doc.pdf'
      );
    });

    it('uploads image file successfully', async () => {
      const formData = createFormData(createImageFile(), 'workers_comp');
      const request = createMockNextRequest({
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json.success).toBe(true);
      expect(json.data.document_url).toBeDefined();
    });

    it('uploads to correct storage path', async () => {
      const formData = createFormData(createPdfFile(), 'drug_testing');
      const request = createMockNextRequest({
        method: 'POST',
        body: formData,
      });

      await POST(request);

      const storageFrom = mockStorageFrom;
      expect(storageFrom).toHaveBeenCalledWith('compliance-documents');
    });

    it('deletes old document when replacing', async () => {
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
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockAgency,
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
                document_url:
                  'https://storage.example.com/compliance-documents/old.pdf',
              },
              error: null,
            }),
            upsert: jest.fn().mockResolvedValue({
              data: null,
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

      await POST(request);

      const storageFrom = mockStorageFrom;
      const mockStorage = storageFrom();
      expect(mockStorage.remove).toHaveBeenCalledWith(['old.pdf']);
    });
  });

  describe('File Upload Error Handling', () => {
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
              data: { role: 'agency_owner' },
              error: null,
            }),
          };
        }
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockAgency,
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
              error: null,
            }),
          };
        }
        return {};
      });
    });

    it('returns 500 when storage upload fails', async () => {
      mockStorageFrom.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          error: { message: 'Storage error' },
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/doc.pdf' },
        }),
      });

      const formData = createFormData(createPdfFile(), 'osha_certified');
      const request = createMockNextRequest({
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(json.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
    });

    it('returns 500 when compliance upsert fails', async () => {
      mockStorageFrom.mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        remove: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/doc.pdf' },
        }),
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
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockAgency,
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

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(json.error.code).toBe(ERROR_CODES.DATABASE_ERROR);

      const storageFrom = mockStorageFrom;
      const mockStorage = storageFrom();
      expect(mockStorage.remove).toHaveBeenCalled();
    });
  });
});

describe('DELETE /api/dashboard/compliance/document', () => {
  const mockUser = { id: 'user-123', email: 'owner@test.com' };
  const mockAgency = { id: 'agency-123' };

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
        url: 'http://localhost:3000/api/dashboard/compliance/document?compliance_type=osha_certified',
      });

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(json.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('returns 403 when user has no claimed agency', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
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
        url: 'http://localhost:3000/api/dashboard/compliance/document?compliance_type=osha_certified',
      });

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(json.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockAgency,
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
        url: 'http://localhost:3000/api/dashboard/compliance/document',
      });

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(json.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('returns 400 when compliance_type is invalid', async () => {
      const request = createMockNextRequest({
        method: 'DELETE',
        url: 'http://localhost:3000/api/dashboard/compliance/document?compliance_type=invalid_type',
      });

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(json.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('Document Deletion Success', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockAgency,
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
                document_url:
                  'https://storage.example.com/compliance-documents/old.pdf',
              },
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          };
        }
        return {};
      });

      mockStorageFrom.mockReturnValue({
        remove: jest.fn().mockResolvedValue({ error: null }),
      });
    });

    it('deletes document successfully', async () => {
      const request = createMockNextRequest({
        method: 'DELETE',
        url: 'http://localhost:3000/api/dashboard/compliance/document?compliance_type=osha_certified',
      });

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json.success).toBe(true);
      expect(json.data.document_url).toBe(null);
    });

    it('removes file from storage', async () => {
      const request = createMockNextRequest({
        method: 'DELETE',
        url: 'http://localhost:3000/api/dashboard/compliance/document?compliance_type=workers_comp',
      });

      await DELETE(request);

      const storageFrom = mockStorageFrom;
      const mockStorage = storageFrom();
      expect(mockStorage.remove).toHaveBeenCalledWith(['old.pdf']);
    });

    it('updates compliance record to null document_url', async () => {
      const request = createMockNextRequest({
        method: 'DELETE',
        url: 'http://localhost:3000/api/dashboard/compliance/document?compliance_type=osha_certified',
      });

      await DELETE(request);

      const calls = mockFrom.mock.calls;
      const complianceCalls = calls.filter(
        (call) => call[0] === 'agency_compliance'
      );
      expect(complianceCalls.length).toBeGreaterThan(0);
    });

    it('succeeds even if document does not exist', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockAgency,
              error: null,
            }),
          };
        }
        if (table === 'agency_compliance') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { document_url: null },
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          };
        }
        return {};
      });

      const request = createMockNextRequest({
        method: 'DELETE',
        url: 'http://localhost:3000/api/dashboard/compliance/document?compliance_type=osha_certified',
      });

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json.success).toBe(true);
    });
  });

  describe('Document Deletion Error Handling', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockAgency,
              error: null,
            }),
          };
        }
        if (table === 'agency_compliance') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { document_url: 'https://storage.example.com/doc.pdf' },
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          };
        }
        return {};
      });

      mockStorageFrom.mockReturnValue({
        remove: jest.fn().mockResolvedValue({ error: null }),
      });
    });

    it('returns 500 when update fails', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockAgency,
              error: null,
            }),
          };
        }
        if (table === 'agency_compliance') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { document_url: 'https://storage.example.com/doc.pdf' },
              error: null,
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  error: { message: 'Update failed' },
                }),
              }),
            }),
          };
        }
        return {};
      });

      const request = createMockNextRequest({
        method: 'DELETE',
        url: 'http://localhost:3000/api/dashboard/compliance/document?compliance_type=osha_certified',
      });

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(json.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
    });

    it('continues if storage deletion fails', async () => {
      mockStorageFrom.mockReturnValue({
        remove: jest.fn().mockResolvedValue({
          error: { message: 'Storage error' },
        }),
      });

      const request = createMockNextRequest({
        method: 'DELETE',
        url: 'http://localhost:3000/api/dashboard/compliance/document?compliance_type=osha_certified',
      });

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json.success).toBe(true);
    });
  });
});
