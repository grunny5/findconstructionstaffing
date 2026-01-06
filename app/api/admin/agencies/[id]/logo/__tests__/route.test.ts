/**
 * @jest-environment node
 */
/**
 * Tests for Admin Agency Logo API Endpoint
 */

// Polyfill File for Node.js environment (not available in node test environment)
if (typeof File === 'undefined') {
  global.File = class File extends Blob {
    name: string;
    lastModified: number;

    constructor(chunks: BlobPart[], name: string, options?: FilePropertyBag) {
      super(chunks, options);
      this.name = name;
      this.lastModified = options?.lastModified ?? Date.now();
    }
  } as unknown as typeof File;
}

import { NextRequest } from 'next/server';

// Mock Supabase client
const mockAuthGetUser = jest.fn();
const mockProfileSelect = jest.fn();
const mockAgencySelect = jest.fn();
const mockAgencyUpdate = jest.fn();
const mockStorageUpload = jest.fn();
const mockStorageRemove = jest.fn();
const mockStorageGetPublicUrl = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockAuthGetUser,
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: mockProfileSelect,
              }),
            }),
          };
        }
        if (table === 'agencies') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: mockAgencySelect,
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: mockAgencyUpdate,
            }),
          };
        }
        return {};
      }),
      storage: {
        from: jest.fn(() => ({
          upload: mockStorageUpload,
          remove: mockStorageRemove,
          getPublicUrl: mockStorageGetPublicUrl,
        })),
      },
    })
  ),
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  ...jest.requireActual('next/server'),
  NextResponse: {
    json: jest.fn((data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: async () => data,
      headers: new Headers(init?.headers),
    })),
  },
}));

// Mock Sharp
jest.mock('sharp', () => {
  return jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image')),
  }));
});

// Import route AFTER mocks are set up
import { POST, DELETE } from '../route';

// Helper to create a mock file
function createMockFile(name: string, size: number, type: string): File {
  const content = new Array(size).fill('a').join('');
  return new File([content], name, { type });
}

// Helper to create FormData with file
function createFormData(file: File): FormData {
  const formData = new FormData();
  formData.append('file', file);
  return formData;
}

// Helper to create mock request
function createMockRequest(formData: FormData): NextRequest {
  return {
    formData: jest.fn().mockResolvedValue(formData),
  } as unknown as NextRequest;
}

// Valid UUID for testing
const VALID_UUID = 'a0000000-0000-0000-0000-000000000001';
const VALID_USER_ID = 'b0000000-0000-0000-0000-000000000001';

describe('Admin Agency Logo API', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default successful mocks
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: VALID_USER_ID } },
      error: null,
    });

    mockProfileSelect.mockResolvedValue({
      data: { role: 'admin' },
      error: null,
    });

    mockAgencySelect.mockResolvedValue({
      data: { id: VALID_UUID, logo_url: null },
      error: null,
    });

    mockAgencyUpdate.mockResolvedValue({ error: null });

    mockStorageUpload.mockResolvedValue({ error: null });
    mockStorageRemove.mockResolvedValue({ error: null });
    mockStorageGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://storage.example.com/agency-logos/test.webp' },
    });
  });

  describe('POST /api/admin/agencies/[id]/logo', () => {
    const createContext = (id: string) => ({
      params: Promise.resolve({ id }),
    });

    describe('Authentication and Authorization', () => {
      it('returns 401 when not authenticated', async () => {
        mockAuthGetUser.mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        });

        const file = createMockFile('logo.png', 1024, 'image/png');
        const formData = createFormData(file);
        const request = createMockRequest(formData);

        const response = await POST(request, createContext(VALID_UUID));
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('UNAUTHORIZED');
      });

      it('returns 403 when user is not admin', async () => {
        mockProfileSelect.mockResolvedValue({
          data: { role: 'agency_owner' },
          error: null,
        });

        const file = createMockFile('logo.png', 1024, 'image/png');
        const formData = createFormData(file);
        const request = createMockRequest(formData);

        const response = await POST(request, createContext(VALID_UUID));
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('FORBIDDEN');
      });
    });

    describe('Validation', () => {
      it('returns 400 for invalid agency ID format', async () => {
        const file = createMockFile('logo.png', 1024, 'image/png');
        const formData = createFormData(file);
        const request = createMockRequest(formData);

        const response = await POST(request, createContext('invalid-id'));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toBe('Invalid agency ID format');
      });

      it('returns 404 when agency not found', async () => {
        mockAgencySelect.mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        });

        const file = createMockFile('logo.png', 1024, 'image/png');
        const formData = createFormData(file);
        const request = createMockRequest(formData);

        const response = await POST(request, createContext(VALID_UUID));
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body.success).toBe(false);
        expect(body.error.message).toBe('Agency not found');
      });

      it('returns 400 when no file provided', async () => {
        const formData = new FormData();
        const request = createMockRequest(formData);

        const response = await POST(request, createContext(VALID_UUID));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toBe('No file provided');
      });

      it('returns 400 for invalid file type', async () => {
        const file = createMockFile('logo.gif', 1024, 'image/gif');
        const formData = createFormData(file);
        const request = createMockRequest(formData);

        const response = await POST(request, createContext(VALID_UUID));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toBe(
          'Invalid file type. Accepted types: PNG, JPG, WebP'
        );
      });

      it('returns 400 for file too large', async () => {
        const file = createMockFile('logo.png', 6 * 1024 * 1024, 'image/png');
        const formData = createFormData(file);
        const request = createMockRequest(formData);

        const response = await POST(request, createContext(VALID_UUID));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toBe('File too large. Maximum size is 5MB');
      });
    });

    describe('Successful Upload', () => {
      it('uploads PNG file successfully', async () => {
        const file = createMockFile('logo.png', 1024, 'image/png');
        const formData = createFormData(file);
        const request = createMockRequest(formData);

        const response = await POST(request, createContext(VALID_UUID));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.logo_url).toBe(
          'https://storage.example.com/agency-logos/test.webp'
        );
      });

      it('uploads JPEG file successfully', async () => {
        const file = createMockFile('logo.jpg', 1024, 'image/jpeg');
        const formData = createFormData(file);
        const request = createMockRequest(formData);

        const response = await POST(request, createContext(VALID_UUID));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
      });

      it('uploads WebP file successfully', async () => {
        const file = createMockFile('logo.webp', 1024, 'image/webp');
        const formData = createFormData(file);
        const request = createMockRequest(formData);

        const response = await POST(request, createContext(VALID_UUID));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
      });

      it('deletes old logo before uploading new', async () => {
        mockAgencySelect.mockResolvedValue({
          data: {
            id: VALID_UUID,
            logo_url:
              'https://storage.example.com/agency-logos/a0000000-0000-0000-0000-000000000001/old.webp',
          },
          error: null,
        });

        const file = createMockFile('logo.png', 1024, 'image/png');
        const formData = createFormData(file);
        const request = createMockRequest(formData);

        await POST(request, createContext(VALID_UUID));

        expect(mockStorageRemove).toHaveBeenCalledWith([
          'a0000000-0000-0000-0000-000000000001/old.webp',
        ]);
      });

      it('updates agency with new logo URL', async () => {
        const file = createMockFile('logo.png', 1024, 'image/png');
        const formData = createFormData(file);
        const request = createMockRequest(formData);

        await POST(request, createContext(VALID_UUID));

        expect(mockAgencyUpdate).toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('returns 500 when storage upload fails', async () => {
        mockStorageUpload.mockResolvedValue({
          error: { message: 'Upload failed' },
        });

        const file = createMockFile('logo.png', 1024, 'image/png');
        const formData = createFormData(file);
        const request = createMockRequest(formData);

        const response = await POST(request, createContext(VALID_UUID));
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.success).toBe(false);
        expect(body.error.message).toBe('Failed to upload logo');
      });

      it('returns 500 when agency update fails', async () => {
        mockAgencyUpdate.mockResolvedValue({
          error: { message: 'Update failed' },
        });

        const file = createMockFile('logo.png', 1024, 'image/png');
        const formData = createFormData(file);
        const request = createMockRequest(formData);

        const response = await POST(request, createContext(VALID_UUID));
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.success).toBe(false);
        expect(body.error.message).toBe('Failed to update agency');
      });

      it('cleans up uploaded file when agency update fails', async () => {
        mockAgencyUpdate.mockResolvedValue({
          error: { message: 'Update failed' },
        });

        const file = createMockFile('logo.png', 1024, 'image/png');
        const formData = createFormData(file);
        const request = createMockRequest(formData);

        await POST(request, createContext(VALID_UUID));

        expect(mockStorageRemove).toHaveBeenCalled();
      });

      it('returns 400 when form data is invalid', async () => {
        const request = {
          formData: jest.fn().mockRejectedValue(new Error('Invalid form data')),
        } as unknown as NextRequest;

        const response = await POST(request, createContext(VALID_UUID));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toBe('Invalid form data');
      });
    });
  });

  describe('DELETE /api/admin/agencies/[id]/logo', () => {
    const createContext = (id: string) => ({
      params: Promise.resolve({ id }),
    });

    const createDeleteRequest = (): NextRequest => {
      return {} as NextRequest;
    };

    describe('Authentication and Authorization', () => {
      it('returns 401 when not authenticated', async () => {
        mockAuthGetUser.mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        });

        const response = await DELETE(
          createDeleteRequest(),
          createContext(VALID_UUID)
        );
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('UNAUTHORIZED');
      });

      it('returns 403 when user is not admin', async () => {
        mockProfileSelect.mockResolvedValue({
          data: { role: 'agency_owner' },
          error: null,
        });

        const response = await DELETE(
          createDeleteRequest(),
          createContext(VALID_UUID)
        );
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('FORBIDDEN');
      });
    });

    describe('Validation', () => {
      it('returns 400 for invalid agency ID format', async () => {
        const response = await DELETE(
          createDeleteRequest(),
          createContext('invalid-id')
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toBe('Invalid agency ID format');
      });

      it('returns 404 when agency not found', async () => {
        mockAgencySelect.mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        });

        const response = await DELETE(
          createDeleteRequest(),
          createContext(VALID_UUID)
        );
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body.success).toBe(false);
        expect(body.error.message).toBe('Agency not found');
      });
    });

    describe('Successful Delete', () => {
      it('deletes logo successfully', async () => {
        mockAgencySelect.mockResolvedValue({
          data: {
            id: VALID_UUID,
            logo_url:
              'https://storage.example.com/agency-logos/a0000000-0000-0000-0000-000000000001/logo.webp',
          },
          error: null,
        });

        const response = await DELETE(
          createDeleteRequest(),
          createContext(VALID_UUID)
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.logo_url).toBeNull();
      });

      it('removes file from storage', async () => {
        mockAgencySelect.mockResolvedValue({
          data: {
            id: VALID_UUID,
            logo_url:
              'https://storage.example.com/agency-logos/a0000000-0000-0000-0000-000000000001/logo.webp',
          },
          error: null,
        });

        await DELETE(createDeleteRequest(), createContext(VALID_UUID));

        expect(mockStorageRemove).toHaveBeenCalledWith([
          'a0000000-0000-0000-0000-000000000001/logo.webp',
        ]);
      });

      it('sets logo_url to null', async () => {
        mockAgencySelect.mockResolvedValue({
          data: {
            id: VALID_UUID,
            logo_url: 'https://storage.example.com/agency-logos/test.webp',
          },
          error: null,
        });

        await DELETE(createDeleteRequest(), createContext(VALID_UUID));

        expect(mockAgencyUpdate).toHaveBeenCalled();
      });

      it('succeeds even when no logo exists', async () => {
        mockAgencySelect.mockResolvedValue({
          data: { id: VALID_UUID, logo_url: null },
          error: null,
        });

        const response = await DELETE(
          createDeleteRequest(),
          createContext(VALID_UUID)
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(mockStorageRemove).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('continues even when storage delete fails', async () => {
        mockAgencySelect.mockResolvedValue({
          data: {
            id: VALID_UUID,
            logo_url: 'https://storage.example.com/agency-logos/test.webp',
          },
          error: null,
        });
        mockStorageRemove.mockResolvedValue({
          error: { message: 'Delete failed' },
        });

        const response = await DELETE(
          createDeleteRequest(),
          createContext(VALID_UUID)
        );
        const body = await response.json();

        // Should still succeed - we clear logo_url even if storage delete fails
        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
      });

      it('returns 500 when agency update fails', async () => {
        mockAgencySelect.mockResolvedValue({
          data: { id: VALID_UUID, logo_url: null },
          error: null,
        });
        mockAgencyUpdate.mockResolvedValue({
          error: { message: 'Update failed' },
        });

        const response = await DELETE(
          createDeleteRequest(),
          createContext(VALID_UUID)
        );
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.success).toBe(false);
        expect(body.error.message).toBe('Failed to update agency');
      });
    });
  });
});
