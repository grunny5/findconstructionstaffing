/**
 * Labor Request Types
 * Feature: 062-request-labor
 * Multi-craft labor request system with matching and notifications
 */

// =============================================================================
// DATABASE ENTITY TYPES (match Supabase schema exactly)
// =============================================================================

export type LaborRequestStatus = 'pending' | 'active' | 'fulfilled' | 'cancelled';

export type NotificationStatus =
  | 'pending'
  | 'sent'
  | 'failed'
  | 'new'
  | 'viewed'
  | 'responded'
  | 'archived';

export interface LaborRequest {
  id: string;
  project_name: string;
  company_name: string;
  contact_email: string;
  contact_phone: string;
  additional_details: string | null;
  status: LaborRequestStatus;
  confirmation_token: string | null;
  confirmation_token_expires: string | null; // ISO 8601 timestamp
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

export interface LaborRequestCraft {
  id: string;
  labor_request_id: string;
  trade_id: string;
  region_id: string;
  worker_count: number;
  start_date: string; // YYYY-MM-DD format
  duration_days: number;
  hours_per_week: number;
  notes: string | null;
  pay_rate_min: number | null; // Minimum hourly rate in USD
  pay_rate_max: number | null; // Maximum hourly rate in USD
  per_diem_rate: number | null; // Daily per diem in USD
  created_at: string; // ISO 8601 timestamp
}

export interface LaborRequestNotification {
  id: string;
  labor_request_id: string;
  labor_request_craft_id: string;
  agency_id: string;
  sent_at: string | null; // ISO 8601 timestamp
  status: NotificationStatus;
  delivery_error: string | null;
  responded_at: string | null; // ISO 8601 timestamp
  viewed_at: string | null; // ISO 8601 timestamp
  created_at: string; // ISO 8601 timestamp
}

// =============================================================================
// EXTENDED TYPES WITH RELATIONS (for API responses)
// =============================================================================

export interface LaborRequestCraftWithRelations extends LaborRequestCraft {
  trade?: {
    id: string;
    name: string;
    slug: string;
  };
  region?: {
    id: string;
    name: string;
    state_code: string;
  };
}

export interface LaborRequestWithCrafts extends LaborRequest {
  crafts: LaborRequestCraftWithRelations[];
}

export interface LaborRequestNotificationWithRelations
  extends LaborRequestNotification {
  agency?: {
    id: string;
    name: string;
    slug: string;
    email: string;
  };
  craft?: LaborRequestCraftWithRelations;
  labor_request?: LaborRequest;
}

// =============================================================================
// FORM-SPECIFIC TYPES (client-side form state)
// =============================================================================

export interface CraftFormData {
  tradeId: string;
  regionId: string;
  workerCount: number;
  startDate: string; // YYYY-MM-DD
  durationDays: number;
  hoursPerWeek: number;
  notes?: string;
  payRateMin?: number; // Minimum hourly rate in USD
  payRateMax?: number; // Maximum hourly rate in USD
  perDiemRate?: number; // Daily per diem in USD
}

export interface LaborRequestFormData {
  projectName: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  additionalDetails?: string;
  crafts: CraftFormData[];
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface SubmitLaborRequestResponse {
  success: boolean;
  requestId: string;
  matchCount: number;
  confirmationToken: string;
}

export interface AgencyMatch {
  agencyId: string;
  agencyName: string;
  agencySlug: string;
  matchScore: number;
}

export interface NotificationResult {
  sent: number;
  failed: number;
  errors: string[];
}

// =============================================================================
// MATCHING ALGORITHM TYPES
// =============================================================================

export interface CraftMatch {
  craftId: string;
  tradeId: string;
  tradeName: string;
  regionId: string;
  regionName: string;
  agency: {
    id: string;
    name: string;
    slug: string;
    email: string;
  };
}

// =============================================================================
// SUCCESS PAGE TYPES
// =============================================================================

export interface SuccessPageData {
  request: {
    id: string;
    projectName: string;
    companyName: string;
    status: string;
    createdAt: string;
  };
  crafts: Array<{
    id: string;
    worker_count: number;
    duration_days: number;
    hours_per_week: number;
    trade: { name: string };
    region: { name: string; state_code: string };
    notificationCount: number;
  }>;
}

// =============================================================================
// DASHBOARD TYPES (Agency Inbox)
// =============================================================================

export interface InboxNotification {
  id: string;
  status: NotificationStatus;
  sent_at: string;
  viewed_at: string | null;
  responded_at: string | null;
  created_at: string;
  labor_request: {
    id: string;
    project_name: string;
    company_name: string;
    contact_email: string;
    contact_phone: string;
    additional_details: string | null;
  };
  craft: {
    id: string;
    trade: { name: string };
    region: { name: string; state_code: string };
    worker_count: number;
    start_date: string;
    duration_days: number;
    hours_per_week: number;
    notes: string | null;
  };
}

export interface InboxFilters {
  status?: NotificationStatus;
  search?: string;
}
