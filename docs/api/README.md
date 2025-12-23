# Agencies API Documentation

## Overview

This directory contains API documentation for the Find Construction Staffing agencies endpoint.

## OpenAPI Specification

The API is documented using OpenAPI 3.0 specification:

- [`openapi-agencies.yaml`](./openapi-agencies.yaml) - Complete API specification

## Authentication

The Find Construction Staffing API uses **Supabase Auth** for authentication with JWT (JSON Web Token) tokens. Endpoints are categorized by access level:

### Access Levels

1. **Public Endpoints** (No authentication required)
   - `GET /api/agencies` - Agency directory listing
   - Public agency profile pages

2. **Authenticated Endpoints** (Requires valid JWT token)
   - `POST /api/claims/request` - Submit agency claim request
   - `GET /api/claims/my-requests` - View user's own claim requests

3. **Owner-Only Endpoints** (Requires agency ownership)
   - `GET /api/agencies/[slug]/dashboard` - Agency dashboard data
   - `PUT /api/agencies/[slug]/profile` - Update agency profile
   - `PUT /api/agencies/[slug]/trades` - Update agency trades
   - `PUT /api/agencies/[slug]/regions` - Update agency regions

4. **Admin-Only Endpoints** (Requires admin role)
   - `GET /api/admin/claims` - List all claim requests
   - `POST /api/admin/claims/[claimId]/approve` - Approve claim
   - `POST /api/admin/claims/[claimId]/reject` - Reject claim

### Obtaining Authentication Token

Users authenticate through Supabase Auth and receive a JWT token. The token is automatically managed by the Supabase client library.

**Login Example:**
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password'
})

// JWT token is automatically included in subsequent requests
```

### Using Authentication in API Requests

For authenticated endpoints, the JWT token must be included in the request. The Supabase client automatically includes the token in the `Authorization` header.

**Authenticated Request Example:**
```bash
curl -X POST https://api.findconstructionstaffing.com/api/claims/request \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agency_id": "123e4567-e89b-12d3-a456-426614174000"}'
```

### Role-Based Access Control

The API uses three user roles:

- **user** - Standard authenticated user (default)
- **agency_owner** - User who has claimed an agency
- **admin** - Platform administrator with full access

Role verification is performed server-side on every request. Ownership is verified by checking the `claimed_by` field in the `agencies` table.

### Error Codes

Authentication-related error responses:

- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Valid token but insufficient permissions (e.g., not agency owner)
- `404 Not Found` - Resource does not exist or user lacks permission to view

## Viewing the Documentation

### Option 1: Swagger UI (Recommended)

You can view the API documentation using Swagger UI:

1. Visit [Swagger Editor](https://editor.swagger.io/)
2. Copy the contents of `openapi-agencies.yaml`
3. Paste into the editor to see interactive documentation

### Option 2: ReDoc

For a cleaner documentation view:

1. Install ReDoc CLI: `npm install -g @redocly/cli`
2. Run: `redocly preview-docs openapi-agencies.yaml`
3. Open browser to the provided URL

### Option 3: VS Code Extension

Install the "OpenAPI (Swagger) Editor" extension in VS Code for inline preview.

## API Endpoints

### GET /api/agencies

Retrieves a list of active construction staffing agencies with optional filtering.

#### Features:

- 🔍 **Search**: Full-text search across name and description
- 🏗️ **Trade Filtering**: Filter by construction trade specialties
- 📍 **State Filtering**: Filter by US state codes
- 📄 **Pagination**: Efficient page-based results
- ⚡ **Caching**: HTTP caching with ETags

#### Query Parameters:

- `search` - Search term (optional)
- `trades[]` - Array of trade slugs (optional)
- `states[]` - Array of 2-letter state codes (optional)
- `limit` - Results per page, 1-100 (default: 20)
- `offset` - Starting position (default: 0)

#### Example Requests:

```bash
# Basic request
curl https://api.findconstructionstaffing.com/api/agencies

# Search with filters
curl "https://api.findconstructionstaffing.com/api/agencies?search=construction&trades[]=electricians&states[]=TX&limit=10"

# Pagination
curl "https://api.findconstructionstaffing.com/api/agencies?offset=20&limit=20"
```

## Response Format

### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Elite Construction Staffing",
      "slug": "elite-construction-staffing",
      "description": "Premier construction staffing solutions",
      "trades": [
        {
          "id": "456e7890-e89b-12d3-a456-426614174001",
          "name": "Electricians",
          "slug": "electricians"
        }
      ],
      "regions": [
        {
          "id": "789e0123-e89b-12d3-a456-426614174002",
          "name": "Dallas-Fort Worth",
          "code": "TX"
        }
      ]
      // ... other fields
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Error Response (400/500)

```json
{
  "error": {
    "code": "INVALID_PARAMS",
    "message": "Invalid query parameters",
    "details": {
      "issues": [
        {
          "path": "limit",
          "message": "Number must be less than or equal to 100"
        }
      ]
    }
  }
}
```

## HTTP Headers

### Request Headers

- `If-None-Match` - ETag value for conditional requests

### Response Headers

- `Cache-Control` - Caching directives (max-age=300 for success)
- `ETag` - Entity tag for response content
- `Vary` - Accept-Encoding

## Status Codes

- `200 OK` - Successful response with data
- `304 Not Modified` - Content hasn't changed (ETag match)
- `400 Bad Request` - Invalid query parameters
- `500 Internal Server Error` - Server or database error

## Rate Limiting

Currently no rate limiting is implemented. Future versions may include:

- Request limits per IP
- API key-based quotas
- Burst protection

## Authentication

The agencies endpoint is currently public and requires no authentication.

## Versioning

The API is currently at version 1.0.0. Future versions will be indicated in the URL path or headers.

## SDK Support

While no official SDK exists yet, the OpenAPI specification can be used to generate clients:

```bash
# Generate TypeScript client
npx @openapitools/openapi-generator-cli generate \
  -i openapi-agencies.yaml \
  -g typescript-axios \
  -o ./generated/api-client
```

## Testing

### Using cURL

```bash
# Test basic endpoint
curl -i http://localhost:3000/api/agencies

# Test with all filters
curl -i "http://localhost:3000/api/agencies?search=elite&trades[]=electricians&trades[]=plumbers&states[]=TX&states[]=CA&limit=5"

# Test conditional request
curl -i -H "If-None-Match: \"abc123\"" http://localhost:3000/api/agencies
```

### Using Postman

Import the OpenAPI specification into Postman to get a complete collection with examples.

## Performance

- Average response time: < 100ms
- Maximum response size: ~2MB (at limit=100)
- Cache duration: 5 minutes
- Database indexes optimize all filter operations

## Support

For API issues or questions:

- GitHub Issues: [Report an issue](https://github.com/findconstructionstaffing/api/issues)
- Email: api-support@findconstructionstaffing.com

---

# Agency Claim and Profile Management API

This section documents the API endpoints for Feature 008 - Agency Claim and Profile Management, which provides a complete workflow for claiming agencies, admin approval, and profile editing.

## Claims API

### POST /api/claims/request

Submit a request to claim ownership of an agency.

**Authentication:** Required (authenticated user)

**Request Body:**
```json
{
  "agency_id": "123e4567-e89b-12d3-a456-426614174000",
  "business_email": "owner@agencyname.com",
  "business_phone": "+1-555-123-4567",
  "verification_notes": "I am the owner of this agency"
}
```

**Validation Rules:**
- `agency_id`: Required, valid UUID
- `business_email`: Required, valid email format
- `business_phone`: Required, E.164 format (+1-XXX-XXX-XXXX)
- `verification_notes`: Optional, max 500 characters

**Success Response (201 Created):**
```json
{
  "data": {
    "claim_request": {
      "id": "789e0123-e89b-12d3-a456-426614174002",
      "agency_id": "123e4567-e89b-12d3-a456-426614174000",
      "user_id": "456e7890-e89b-12d3-a456-426614174001",
      "business_email": "owner@agencyname.com",
      "business_phone": "+1-555-123-4567",
      "verification_notes": "I am the owner of this agency",
      "status": "pending",
      "created_at": "2025-12-23T10:30:00Z"
    }
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Not logged in
- `400 Bad Request` - Validation failed
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Validation failed",
      "details": {
        "business_email": { "_errors": ["Invalid email"] }
      }
    }
  }
  ```
- `409 Conflict` - Agency already claimed or pending claim exists
  ```json
  {
    "error": {
      "code": "AGENCY_ALREADY_CLAIMED",
      "message": "This agency has already been claimed"
    }
  }
  ```

**Side Effects:**
- Creates record in `agency_claim_requests` table
- Sends confirmation email to business_email
- Creates audit log entry

**Example Request:**
```bash
curl -X POST https://api.findconstructionstaffing.com/api/claims/request \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agency_id": "123e4567-e89b-12d3-a456-426614174000",
    "business_email": "owner@agencyname.com",
    "business_phone": "+1-555-123-4567",
    "verification_notes": "I am the owner"
  }'
```

### GET /api/claims/my-requests

Retrieve all claim requests submitted by the authenticated user.

**Authentication:** Required (authenticated user)

**Query Parameters:**
- None

**Success Response (200 OK):**
```json
{
  "data": {
    "claim_requests": [
      {
        "id": "789e0123-e89b-12d3-a456-426614174002",
        "agency": {
          "id": "123e4567-e89b-12d3-a456-426614174000",
          "name": "Elite Construction Staffing",
          "slug": "elite-construction-staffing"
        },
        "business_email": "owner@agencyname.com",
        "business_phone": "+1-555-123-4567",
        "status": "pending",
        "created_at": "2025-12-23T10:30:00Z",
        "reviewed_at": null,
        "reviewed_by": null,
        "rejection_reason": null
      }
    ]
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Not logged in
- `500 Internal Server Error` - Database error

**Example Request:**
```bash
curl https://api.findconstructionstaffing.com/api/claims/my-requests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Admin Claims API

### GET /api/admin/claims

List all agency claim requests (admin only).

**Authentication:** Required (admin role)

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `approved`, `rejected`)
- `limit` (optional): Results per page (1-100, default: 50)
- `offset` (optional): Starting position (default: 0)

**Success Response (200 OK):**
```json
{
  "data": {
    "claim_requests": [
      {
        "id": "789e0123-e89b-12d3-a456-426614174002",
        "agency": {
          "id": "123e4567-e89b-12d3-a456-426614174000",
          "name": "Elite Construction Staffing",
          "slug": "elite-construction-staffing",
          "claimed_by": null
        },
        "user": {
          "id": "456e7890-e89b-12d3-a456-426614174001",
          "email": "user@example.com",
          "full_name": "John Doe"
        },
        "business_email": "owner@agencyname.com",
        "business_phone": "+1-555-123-4567",
        "verification_notes": "I am the owner",
        "status": "pending",
        "created_at": "2025-12-23T10:30:00Z",
        "reviewed_at": null,
        "reviewed_by": null,
        "rejection_reason": null
      }
    ],
    "pagination": {
      "total": 42,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Not an admin user
- `400 Bad Request` - Invalid query parameters

**Example Request:**
```bash
curl "https://api.findconstructionstaffing.com/api/admin/claims?status=pending&limit=20" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### POST /api/admin/claims/[claimId]/approve

Approve an agency claim request (admin only).

**Authentication:** Required (admin role)

**URL Parameters:**
- `claimId`: UUID of the claim request

**Request Body:**
- None (empty body or no body required)

**Success Response (200 OK):**
```json
{
  "data": {
    "claim_request": {
      "id": "789e0123-e89b-12d3-a456-426614174002",
      "status": "approved",
      "reviewed_at": "2025-12-23T11:00:00Z",
      "reviewed_by": "admin-user-id"
    }
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Not an admin user
- `404 Not Found` - Claim request not found
- `409 Conflict` - Claim already reviewed or agency already claimed
  ```json
  {
    "error": {
      "code": "CLAIM_ALREADY_REVIEWED",
      "message": "This claim has already been reviewed"
    }
  }
  ```

**Side Effects:**
- Updates claim status to `approved`
- Sets `agencies.claimed_by` to the requesting user
- Sends approval email to user
- Creates audit log entry

**Example Request:**
```bash
curl -X POST "https://api.findconstructionstaffing.com/api/admin/claims/789e0123-e89b-12d3-a456-426614174002/approve" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### POST /api/admin/claims/[claimId]/reject

Reject an agency claim request (admin only).

**Authentication:** Required (admin role)

**URL Parameters:**
- `claimId`: UUID of the claim request

**Request Body:**
```json
{
  "rejection_reason": "Email domain does not match agency domain"
}
```

**Validation Rules:**
- `rejection_reason`: Required, 10-500 characters

**Success Response (200 OK):**
```json
{
  "data": {
    "claim_request": {
      "id": "789e0123-e89b-12d3-a456-426614174002",
      "status": "rejected",
      "reviewed_at": "2025-12-23T11:00:00Z",
      "reviewed_by": "admin-user-id",
      "rejection_reason": "Email domain does not match agency domain"
    }
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Not an admin user
- `404 Not Found` - Claim request not found
- `409 Conflict` - Claim already reviewed
- `400 Bad Request` - Missing or invalid rejection_reason

**Side Effects:**
- Updates claim status to `rejected`
- Stores rejection_reason
- Sends rejection email to user
- Creates audit log entry

**Example Request:**
```bash
curl -X POST "https://api.findconstructionstaffing.com/api/admin/claims/789e0123-e89b-12d3-a456-426614174002/reject" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rejection_reason": "Email domain does not match agency domain"}'
```

## Agency Dashboard API

### GET /api/agencies/[slug]/dashboard

Get comprehensive dashboard data for an agency (owner only).

**Authentication:** Required (agency owner)

**URL Parameters:**
- `slug`: Agency slug (e.g., "elite-construction-staffing")

**Success Response (200 OK):**
```json
{
  "data": {
    "agency": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Elite Construction Staffing",
      "slug": "elite-construction-staffing",
      "description": "Premier construction staffing solutions",
      "profile_completion_percentage": 85,
      "completion_email_sent": false,
      "claimed_by": "456e7890-e89b-12d3-a456-426614174001",
      "created_at": "2024-01-15T08:00:00Z",
      "last_edited_at": "2025-12-23T10:30:00Z"
    },
    "trades": [
      {
        "id": "trade-uuid-1",
        "name": "Electricians",
        "slug": "electricians",
        "description": "Licensed electrical contractors"
      }
    ],
    "regions": [
      {
        "id": "region-uuid-1",
        "name": "Texas",
        "state_code": "TX",
        "slug": "texas"
      }
    ],
    "contact": {
      "phone": "+1-555-123-4567",
      "email": "contact@elitestaffing.com",
      "website": "https://elitestaffing.com"
    },
    "profile_completion": {
      "percentage": 85,
      "missing_fields": ["website", "description"],
      "completed_sections": {
        "basic_info": true,
        "contact_info": true,
        "trades": true,
        "regions": true,
        "description": false
      }
    }
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Not the agency owner
- `404 Not Found` - Agency not found

**Example Request:**
```bash
curl https://api.findconstructionstaffing.com/api/agencies/elite-construction-staffing/dashboard \
  -H "Authorization: Bearer OWNER_JWT_TOKEN"
```

### PUT /api/agencies/[slug]/profile

Update agency profile information (owner only).

**Authentication:** Required (agency owner)

**URL Parameters:**
- `slug`: Agency slug

**Request Body:**
```json
{
  "name": "Elite Construction Staffing LLC",
  "description": "Updated agency description",
  "website": "https://elitestaffing.com",
  "phone": "+1-555-123-4567",
  "email": "contact@elitestaffing.com"
}
```

**Validation Rules:**
- `name`: Optional, 2-200 characters
- `description`: Optional, 10-2000 characters
- `website`: Optional, valid URL
- `phone`: Optional, E.164 format
- `email`: Optional, valid email format

**Success Response (200 OK):**
```json
{
  "data": {
    "agency": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Elite Construction Staffing LLC",
      "slug": "elite-construction-staffing",
      "description": "Updated agency description",
      "website": "https://elitestaffing.com",
      "phone": "+1-555-123-4567",
      "email": "contact@elitestaffing.com",
      "profile_completion_percentage": 95,
      "last_edited_at": "2025-12-23T12:00:00Z"
    }
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Not the agency owner
- `404 Not Found` - Agency not found
- `400 Bad Request` - Validation failed

**Side Effects:**
- Creates entry in `agency_profile_edits` table for audit trail
- Updates `last_edited_at` and `last_edited_by` fields
- May send profile completion email if reaches 100%

**Example Request:**
```bash
curl -X PUT https://api.findconstructionstaffing.com/api/agencies/elite-construction-staffing/profile \
  -H "Authorization: Bearer OWNER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Elite Construction Staffing LLC",
    "description": "Updated agency description",
    "website": "https://elitestaffing.com"
  }'
```

### PUT /api/agencies/[slug]/trades

Update agency trades/specializations (owner only).

**Authentication:** Required (agency owner)

**URL Parameters:**
- `slug`: Agency slug

**Request Body:**
```json
{
  "trade_ids": [
    "trade-uuid-1",
    "trade-uuid-2",
    "trade-uuid-3"
  ]
}
```

**Validation Rules:**
- `trade_ids`: Required array of valid trade UUIDs
- Minimum: 1 trade
- Maximum: 10 trades

**Success Response (200 OK):**
```json
{
  "data": {
    "trades": [
      {
        "id": "trade-uuid-1",
        "name": "Electricians",
        "slug": "electricians",
        "description": "Licensed electrical contractors"
      },
      {
        "id": "trade-uuid-2",
        "name": "Plumbers",
        "slug": "plumbers",
        "description": "Licensed plumbing professionals"
      }
    ]
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Not the agency owner
- `404 Not Found` - Agency not found
- `400 Bad Request` - Invalid trade IDs or validation failed
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid trade IDs provided",
      "details": {
        "invalid_trade_ids": ["invalid-uuid-1"]
      }
    }
  }
  ```

**Side Effects:**
- Upserts relationships in `agency_trades` table
- Deletes orphaned trade relationships
- Creates audit log entry
- Updates `last_edited_at` timestamp
- May send profile completion email if reaches 100%

**Example Request:**
```bash
curl -X PUT https://api.findconstructionstaffing.com/api/agencies/elite-construction-staffing/trades \
  -H "Authorization: Bearer OWNER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trade_ids": ["trade-uuid-1", "trade-uuid-2", "trade-uuid-3"]
  }'
```

### PUT /api/agencies/[slug]/regions

Update agency service regions (owner only).

**Authentication:** Required (agency owner)

**URL Parameters:**
- `slug`: Agency slug

**Request Body:**
```json
{
  "region_ids": [
    "region-uuid-1",
    "region-uuid-2"
  ]
}
```

**Validation Rules:**
- `region_ids`: Required array of valid region UUIDs
- Minimum: 1 region
- No maximum limit

**Success Response (200 OK):**
```json
{
  "data": {
    "regions": [
      {
        "id": "region-uuid-1",
        "name": "Texas",
        "state_code": "TX",
        "slug": "texas"
      },
      {
        "id": "region-uuid-2",
        "name": "California",
        "state_code": "CA",
        "slug": "california"
      }
    ]
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Not the agency owner
- `404 Not Found` - Agency not found
- `400 Bad Request` - Invalid region IDs or validation failed
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid region IDs provided",
      "details": {
        "invalid_region_ids": ["invalid-uuid-1"]
      }
    }
  }
  ```

**Side Effects:**
- Upserts relationships in `agency_regions` table
- Deletes orphaned region relationships
- Creates audit log entry
- Updates `last_edited_at` timestamp
- May send profile completion email if reaches 100%

**Example Request:**
```bash
curl -X PUT https://api.findconstructionstaffing.com/api/agencies/elite-construction-staffing/regions \
  -H "Authorization: Bearer OWNER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "region_ids": ["region-uuid-1", "region-uuid-2"]
  }'
```

## Common Error Codes

All endpoints use consistent error codes:

- `UNAUTHORIZED` - Authentication required or invalid token
- `FORBIDDEN` - Insufficient permissions for the resource
- `NOT_FOUND` - Resource does not exist
- `VALIDATION_ERROR` - Request validation failed (includes Zod error details)
- `DATABASE_ERROR` - Database operation failed
- `INTERNAL_ERROR` - Unexpected server error
- `AGENCY_ALREADY_CLAIMED` - Agency has already been claimed by another user
- `CLAIM_ALREADY_REVIEWED` - Claim request has already been approved or rejected
- `CLAIM_ALREADY_EXISTS` - User already has a pending claim for this agency

## Audit Trail

All profile changes and claim actions are logged in audit tables:

- **agency_profile_edits** - Tracks all profile field changes with old/new values
- **agency_claim_audit_log** - Tracks all claim-related actions (submit, approve, reject)

Each audit entry includes:
- User who performed the action
- Timestamp
- Field name or action type
- Old and new values (where applicable)

## Profile Completion Email

When an agency profile reaches 100% completion for the first time, the system automatically sends a congratulatory email to the agency owner. This email includes:

- Celebration of the milestone
- List of unlocked benefits (Featured Badge, Priority Placement)
- Link to public profile
- Tips for maintaining profile freshness

The email is sent only once per agency (tracked via `completion_email_sent` flag).
