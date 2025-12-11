# Agencies API Documentation

## Overview

This directory contains API documentation for the Find Construction Staffing agencies endpoint.

## OpenAPI Specification

The API is documented using OpenAPI 3.0 specification:

- [`openapi-agencies.yaml`](./openapi-agencies.yaml) - Complete API specification

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
