# Admin Edit Interface Best Practices Research

## Research Date: 2026-01-13

> **⚠️ IMPORTANT NOTE**: This document contains general Next.js 13+ best practices research from external sources. **This repository has chosen to prefer API Routes over Server Actions** for consistency with the existing codebase architecture. See todos [#011](/todos/011-pending-p1-remove-server-actions-use-api-routes.md), [#014](/todos/014-pending-p1-security-server-action-authentication-bypass.md), and [#016](/todos/016-pending-p1-cache-revalidation-apis-not-implemented.md) for architectural decisions.
>
> **Project Standard**: Use `fetch()` to call PATCH `/api/admin/agencies/[id]` instead of Server Actions. All examples referencing Server Actions should be adapted to use API routes following the patterns in `components/admin/AgencyFormModal.tsx`.

This document compiles best practices for building an admin agency edit page where admins can modify all agency information including manually setting verified status.

---

## Table of Contents

1. [Next.js 13+ App Router Admin Panel Best Practices](#1-nextjs-13-app-router-admin-panel-best-practices)
2. [Form Handling and Validation Patterns](#2-form-handling-and-validation-patterns)
3. [Role-Based Access Control (RBAC)](#3-role-based-access-control-rbac)
4. [Audit Logging for Admin Changes](#4-audit-logging-for-admin-changes)
5. [UX Patterns: Bulk and Inline Editing](#5-ux-patterns-bulk-and-inline-editing)
6. [Error Handling and Success Feedback](#6-error-handling-and-success-feedback)
7. [Optimistic UI Updates](#7-optimistic-ui-updates)
8. [Cache Invalidation and Revalidation](#8-cache-invalidation-and-revalidation)
9. [Complete Implementation Example](#9-complete-implementation-example)

---

## 1. Next.js 13+ App Router Admin Panel Best Practices

### Key Architecture Principles

**Server Actions Over API Routes** (General Best Practice)
- Use Server Actions for CRUD operations in admin interfaces (external recommendation)
- They provide direct access to request context including authentication and cookies
- Simpler than API routes for form mutations

> **⚠️ THIS PROJECT USES API ROUTES INSTEAD**: For consistency with our existing architecture, we use `fetch()` calls to API routes. See example:
> ```typescript
> // components/admin/AgencyFormModal.tsx pattern
> const response = await fetch(`/api/admin/agencies/${agency.id}`, {
>   method: 'PATCH',
>   headers: { 'Content-Type': 'application/json' },
>   body: JSON.stringify(formData),
> })
> ```
> This maintains consistency across all 31 existing API routes in the codebase.

**Folder Structure** ([Source](https://www.anshgupta.in/blog/nextjs-app-router-best-practices-2025))

> **⚠️ PROJECT DIFFERENCE**: This example shows `app/admin/actions/` for Server Actions, but our project uses `app/api/admin/` for API routes instead.

```plaintext
app/
├── admin/
│   ├── layout.tsx              # Admin layout with auth check
│   ├── agencies/
│   │   ├── page.tsx            # Agency list
│   │   └── [id]/
│   │       ├── page.tsx        # Agency detail
│   │       └── edit/
│   │           └── page.tsx    # Edit form
│   └── actions/
│       └── agencies.ts         # Server actions (general pattern)
├── api/
│   └── admin/
│       └── agencies/
│           └── [id]/
│               └── route.ts    # ← THIS PROJECT USES API ROUTES
components/
├── admin/
│   ├── AgencyEditForm.tsx      # Client component
│   └── AuditLog.tsx
lib/
├── auth/
│   ├── session.ts              # Session utilities
│   └── rbac.ts                 # Role checks
└── validations/
    └── agency.ts               # Zod schemas
```

### Security First ([Source](https://medium.com/@GoutamSingha/next-js-best-practices-in-2025-build-faster-cleaner-scalable-apps-7efbad2c3820))

> "Server Actions represent the most critical security surface in App Router applications, with every Server Action needing to begin with authentication verification and input validation before performing any operations."

**Every Server Action Must:**
1. Verify authentication
2. Validate authorization (role check)
3. Validate input data
4. Handle errors gracefully

---

## 2. Form Handling and Validation Patterns

### React Hook Form + Zod Integration

**Installation:**
```bash
npm install react-hook-form @hookform/resolvers zod
```

**Validation Schema** ([Context7: Zod Documentation](https://github.com/colinhacks/zod))

```typescript
// lib/validations/agency.ts
import { z } from "zod"

export const agencyEditSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().min(10, "Description must be at least 10 characters"),

  // Address as nested object
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  }).optional(),

  // Array of trade IDs
  trades: z.array(z.string().uuid()).min(1, "Select at least one trade"),

  // Array of region IDs
  regions: z.array(z.string().uuid()).min(1, "Select at least one region"),

  // Admin-only fields
  isVerified: z.boolean(),
  verifiedAt: z.date().nullable(),
  verificationNotes: z.string().optional(),

  // Complex nested array validation
  certifications: z.array(z.object({
    name: z.string(),
    issuedBy: z.string(),
    expiresAt: z.date().optional(),
  })).optional(),
})

export type AgencyEditInput = z.infer<typeof agencyEditSchema>
```

**Form Component** ([Context7: React Hook Form Documentation](https://github.com/react-hook-form/documentation))

```typescript
// components/admin/AgencyEditForm.tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { agencyEditSchema, type AgencyEditInput } from "@/lib/validations/agency"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { updateAgencyAction } from "@/app/admin/actions/agencies"

interface AgencyEditFormProps {
  agency: AgencyEditInput & { id: string }
}

export function AgencyEditForm({ agency }: AgencyEditFormProps) {
  const { toast } = useToast()

  const form = useForm<AgencyEditInput>({
    resolver: zodResolver(agencyEditSchema),
    defaultValues: {
      name: agency.name,
      email: agency.email,
      phone: agency.phone || "",
      website: agency.website || "",
      description: agency.description,
      trades: agency.trades,
      regions: agency.regions,
      isVerified: agency.isVerified,
      verificationNotes: agency.verificationNotes || "",
    },
  })

  async function onSubmit(data: AgencyEditInput) {
    const result = await updateAgencyAction(agency.id, data)

    if (result.success) {
      toast({
        title: "Success",
        description: "Agency updated successfully",
      })
    } else {
      // Handle field-level errors
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, message]) => {
          form.setError(field as any, { message })
        })
      }

      toast({
        title: "Error",
        description: result.error || "Failed to update agency",
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agency Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Admin-only verification field */}
        <FormField
          control={form.control}
          name="isVerified"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>Verified Agency</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="verificationNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Notes (Admin Only)</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  )
}
```

---

## 3. Role-Based Access Control (RBAC)

### Session Verification Pattern ([Context7: Next.js Documentation](https://github.com/vercel/next.js))

```typescript
// lib/auth/session.ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function verifySession() {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  // Get user metadata or custom claims
  const { data: user } = await supabase.auth.getUser()

  return {
    user: {
      id: user.user!.id,
      email: user.user!.email!,
      role: user.user!.user_metadata?.role || 'user',
      name: user.user!.user_metadata?.name,
    },
    role: user.user!.user_metadata?.role || 'user',
  }
}
```

### Protecting Admin Pages ([Context7: Next.js Documentation](https://github.com/vercel/next.js))

```typescript
// app/admin/agencies/[id]/edit/page.tsx
import { verifySession } from '@/lib/auth/session'
import { forbidden } from 'next/navigation'
import { AgencyEditForm } from '@/components/admin/AgencyEditForm'
import { getAgencyById } from '@/lib/supabase/queries'

export default async function AdminAgencyEditPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await verifySession()

  // Check if the user has the 'admin' role
  if (session?.role !== 'admin') {
    forbidden() // Returns 403 page
  }

  const agency = await getAgencyById(params.id)

  if (!agency) {
    notFound()
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Agency</h1>
      <AgencyEditForm agency={agency} />
    </div>
  )
}
```

### Protecting Server Actions ([Context7: Next.js Documentation](https://github.com/vercel/next.js))

```typescript
// app/admin/actions/agencies.ts
'use server'

import { verifySession } from '@/lib/auth/session'
import { forbidden } from 'next/navigation'
import { agencyEditSchema, type AgencyEditInput } from '@/lib/validations/agency'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath, revalidateTag } from 'next/cache'
import { logAuditEvent } from '@/lib/audit'

type ActionResult =
  | { success: true; data: any }
  | { success: false; error: string; errors?: Record<string, string> }

export async function updateAgencyAction(
  agencyId: string,
  formData: AgencyEditInput
): Promise<ActionResult> {
  // 1. Authentication check
  const session = await verifySession()

  if (!session) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Authorization check
  if (session.role !== 'admin') {
    return { success: false, error: 'Insufficient permissions' }
  }

  // 3. Input validation
  const validation = agencyEditSchema.safeParse(formData)

  if (!validation.success) {
    const fieldErrors: Record<string, string> = {}
    validation.error.errors.forEach((err) => {
      if (err.path.length > 0) {
        fieldErrors[err.path.join('.')] = err.message
      }
    })

    return {
      success: false,
      error: 'Validation failed',
      errors: fieldErrors,
    }
  }

  // 4. Database operation
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for admin
      {
        cookies: {
          getAll() {
            return cookies().getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookies().set(name, value, options)
            })
          },
        },
      }
    )

    const { data, error } = await supabase
      .from('agencies')
      .update({
        name: validation.data.name,
        email: validation.data.email,
        phone: validation.data.phone,
        website: validation.data.website,
        description: validation.data.description,
        is_verified: validation.data.isVerified,
        verified_at: validation.data.isVerified ? new Date().toISOString() : null,
        verification_notes: validation.data.verificationNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agencyId)
      .select()
      .single()

    if (error) throw error

    // Update relationships (trades, regions)
    await updateAgencyRelationships(supabase, agencyId, validation.data)

    // 5. Audit logging
    await logAuditEvent({
      action: 'agency_updated',
      resource_type: 'agency',
      resource_id: agencyId,
      admin_id: session.user.id,
      admin_email: session.user.email,
      changes: validation.data,
      timestamp: new Date(),
    })

    // 6. Cache invalidation
    revalidatePath(`/recruiters/${data.slug}`)
    revalidateTag('agencies')

    return { success: true, data }

  } catch (error) {
    console.error('Update agency error:', error)
    return {
      success: false,
      error: 'Failed to update agency. Please try again.',
    }
  }
}

async function updateAgencyRelationships(
  supabase: any,
  agencyId: string,
  data: AgencyEditInput
) {
  // Update trades
  await supabase
    .from('agency_trades')
    .delete()
    .eq('agency_id', agencyId)

  if (data.trades.length > 0) {
    await supabase
      .from('agency_trades')
      .insert(data.trades.map(tradeId => ({ agency_id: agencyId, trade_id: tradeId })))
  }

  // Update regions
  await supabase
    .from('agency_regions')
    .delete()
    .eq('agency_id', agencyId)

  if (data.regions.length > 0) {
    await supabase
      .from('agency_regions')
      .insert(data.regions.map(regionId => ({ agency_id: agencyId, region_id: regionId })))
  }
}
```

### Middleware for Route Protection ([Context7: Supabase SSR Documentation](https://github.com/supabase/ssr))

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session
  const { data: { session } } = await supabase.auth.getSession()

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: { user } } = await supabase.auth.getUser()
    const userRole = user?.user_metadata?.role

    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/forbidden', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

## 4. Audit Logging for Admin Changes

### Database Schema ([Source](https://supabase.com/blog/postgres-audit))

```sql
-- Create audit log table
CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Who performed the action
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  admin_email TEXT NOT NULL,

  -- What was done
  action TEXT NOT NULL, -- 'agency_created', 'agency_updated', 'agency_deleted', etc.
  resource_type TEXT NOT NULL, -- 'agency', 'user', etc.
  resource_id UUID NOT NULL,

  -- Changes made (JSONB for flexibility)
  old_values JSONB,
  new_values JSONB,
  changes JSONB,

  -- Additional context
  ip_address INET,
  user_agent TEXT,
  notes TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
  );
```

### Supabase Trigger-Based Audit ([Source](https://github.com/supabase/supa_audit))

For automatic audit logging, you can use Supabase's `supa_audit` extension:

```sql
-- Enable the extension
CREATE EXTENSION IF NOT EXISTS supa_audit;

-- Enable auditing for agencies table
SELECT enable_tracking('public.agencies'::regclass);
```

### Application-Level Audit Logging

```typescript
// lib/audit.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface AuditLogInput {
  action: string
  resource_type: string
  resource_id: string
  admin_id: string
  admin_email: string
  changes?: any
  old_values?: any
  new_values?: any
  notes?: string
}

export async function logAuditEvent(input: AuditLogInput) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookies().getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookies().set(name, value, options)
          })
        },
      },
    }
  )

  try {
    await supabase.from('audit_logs').insert({
      action: input.action,
      resource_type: input.resource_type,
      resource_id: input.resource_id,
      admin_id: input.admin_id,
      admin_email: input.admin_email,
      changes: input.changes || null,
      old_values: input.old_values || null,
      new_values: input.new_values || null,
      notes: input.notes || null,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to log audit event:', error)
    // Don't throw - audit logging should not break the main operation
  }
}

// Usage in Server Action
export async function updateAgencyAction(agencyId: string, data: any) {
  // ... authentication and validation ...

  // Fetch old values before update
  const { data: oldAgency } = await supabase
    .from('agencies')
    .select()
    .eq('id', agencyId)
    .single()

  // Perform update
  const { data: newAgency } = await supabase
    .from('agencies')
    .update(data)
    .eq('id', agencyId)
    .select()
    .single()

  // Log the change
  await logAuditEvent({
    action: 'agency_updated',
    resource_type: 'agency',
    resource_id: agencyId,
    admin_id: session.user.id,
    admin_email: session.user.email,
    old_values: oldAgency,
    new_values: newAgency,
    changes: data, // Only the fields that were changed
  })
}
```

### Displaying Audit Logs

```typescript
// components/admin/AuditLog.tsx
'use client'

import { formatDistanceToNow } from 'date-fns'

interface AuditLogEntry {
  id: string
  action: string
  admin_email: string
  created_at: string
  changes: any
}

interface AuditLogProps {
  entries: AuditLogEntry[]
}

export function AuditLog({ entries }: AuditLogProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Change History</h3>

      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="border rounded-lg p-4 space-y-2"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{formatAction(entry.action)}</p>
                <p className="text-sm text-muted-foreground">
                  by {entry.admin_email}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
              </p>
            </div>

            {entry.changes && (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground">
                  View changes
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                  {JSON.stringify(entry.changes, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
}
```

### Best Practices for Audit Logging ([Source](https://www.leanware.co/insights/supabase-best-practices))

1. **Selective Logging**: Don't log every database event - only what's necessary
2. **Retention Policies**: Set up automatic cleanup of old audit logs
3. **Performance**: Use JSONB for flexible storage, but index commonly queried fields
4. **Privacy**: Redact sensitive information (passwords, API keys) before logging
5. **Immutability**: Audit logs should never be editable, only insertable

---

## 5. UX Patterns: Bulk and Inline Editing

### Bulk Actions Best Practices ([Source](https://www.eleken.co/blog-posts/bulk-actions-ux))

**Key Principles:**
1. Provide inline bulk edits for routine changes
2. Use wizard flows for complex actions with dependencies
3. Allow undo immediately after bulk actions
4. Show clear feedback on what items were affected
5. Handle partial failures gracefully

**Bulk Action UI Pattern:**

```typescript
// components/admin/AgencyList.tsx
'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { bulkUpdateAgenciesAction } from '@/app/admin/actions/agencies'

interface Agency {
  id: string
  name: string
  isVerified: boolean
}

export function AgencyList({ agencies }: { agencies: Agency[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(agencies.map(a => a.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleBulkVerify = async () => {
    const result = await bulkUpdateAgenciesAction(
      Array.from(selectedIds),
      { isVerified: true }
    )

    if (result.success) {
      toast({
        title: "Success",
        description: `${result.updated} agencies verified`,
        action: (
          <Button variant="outline" onClick={() => handleUndo(result.undoToken)}>
            Undo
          </Button>
        ),
      })
      setSelectedIds(new Set())
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  return (
    <div>
      {/* Bulk action bar - appears when items are selected */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 bg-primary text-primary-foreground p-4 rounded-lg mb-4 flex items-center justify-between">
          <span>{selectedIds.size} agencies selected</span>
          <div className="space-x-2">
            <Button onClick={handleBulkVerify} variant="secondary">
              Verify Selected
            </Button>
            <Button onClick={() => setSelectedIds(new Set())} variant="outline">
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            checked={selectedIds.size === agencies.length}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm font-medium">Select All</span>
        </div>

        {agencies.map(agency => (
          <div key={agency.id} className="flex items-center space-x-4 p-4 border rounded">
            <Checkbox
              checked={selectedIds.has(agency.id)}
              onCheckedChange={(checked) => {
                const newSet = new Set(selectedIds)
                if (checked) {
                  newSet.add(agency.id)
                } else {
                  newSet.delete(agency.id)
                }
                setSelectedIds(newSet)
              }}
            />
            <div className="flex-1">
              <h3 className="font-medium">{agency.name}</h3>
              <p className="text-sm text-muted-foreground">
                {agency.isVerified ? 'Verified' : 'Not verified'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Inline Editing Best Practices ([Source](https://uxdworld.com/inline-editing-in-tables-design/))

**Key Principles:**
1. Allow edits inline for least friction
2. Provide clear indication of editable fields
3. Confirm changes explicitly (Save button or click-out)
4. Show validation errors immediately
5. Support keyboard navigation (Tab, Enter, Escape)

**Inline Edit Component:**

```typescript
// components/admin/InlineEditField.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X, Pencil } from 'lucide-react'

interface InlineEditFieldProps {
  value: string
  onSave: (value: string) => Promise<boolean>
  placeholder?: string
}

export function InlineEditField({ value, onSave, placeholder }: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    const success = await onSave(editValue)
    setIsSaving(false)

    if (success) {
      setIsEditing(false)
    } else {
      // Reset on error
      setEditValue(value)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (!isEditing) {
    return (
      <div
        className="group flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
        onClick={() => setIsEditing(true)}
      >
        <span>{value || placeholder}</span>
        <Pencil className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className="flex-1"
      />
      <Button
        size="sm"
        onClick={handleSave}
        disabled={isSaving}
      >
        <Check className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleCancel}
        disabled={isSaving}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}
```

---

## 6. Error Handling and Success Feedback

### Server Action Error Pattern ([Source](https://medium.com/@pawantripathi648/next-js-server-actions-error-handling-the-pattern-i-wish-i-knew-earlier-e717f28f2f75))

**Return Errors as Data (Not Thrown):**

```typescript
// app/admin/actions/agencies.ts
'use server'

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; errors?: Record<string, string> }

export async function updateAgencyAction(
  agencyId: string,
  formData: any
): Promise<ActionResult<Agency>> {
  try {
    // Validation
    const validation = agencyEditSchema.safeParse(formData)

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      validation.error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path.join('.')] = err.message
        }
      })

      return {
        success: false,
        error: 'Validation failed',
        errors: fieldErrors,
      }
    }

    // Database operation
    const { data, error } = await supabase
      .from('agencies')
      .update(validation.data)
      .eq('id', agencyId)
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: 'Failed to update agency',
      }
    }

    return { success: true, data }

  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
```

### Toast Notifications ([Source](https://blog.logrocket.com/react-toastify-guide/))

**Using Shadcn Toast:**

```typescript
// components/admin/AgencyEditForm.tsx
"use client"

import { useToast } from "@/hooks/use-toast"

export function AgencyEditForm({ agency }: Props) {
  const { toast } = useToast()

  async function onSubmit(data: AgencyEditInput) {
    try {
      const result = await updateAgencyAction(agency.id, data)

      if (result.success) {
        toast({
          title: "Success",
          description: "Agency updated successfully",
        })
      } else {
        // Handle validation errors
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, message]) => {
            form.setError(field as any, { message })
          })
        }

        toast({
          title: "Error",
          description: result.error || "Failed to update agency",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  )
}
```

**Alternative: React Hot Toast** ([Source](https://refine.dev/blog/react-hot-toast/))

```bash
npm install react-hot-toast
```

```typescript
import { toast } from 'react-hot-toast'

// Success
toast.success('Agency updated successfully')

// Error
toast.error('Failed to update agency')

// Promise-based
toast.promise(
  updateAgencyAction(id, data),
  {
    loading: 'Saving...',
    success: 'Saved!',
    error: 'Could not save',
  }
)
```

---

## 7. Optimistic UI Updates

### Using React's useOptimistic Hook

```typescript
// components/admin/AgencyVerificationToggle.tsx
'use client'

import { experimental_useOptimistic as useOptimistic } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toggleAgencyVerificationAction } from '@/app/admin/actions/agencies'

interface Props {
  agencyId: string
  initialIsVerified: boolean
}

export function AgencyVerificationToggle({ agencyId, initialIsVerified }: Props) {
  const [optimisticIsVerified, setOptimisticIsVerified] = useOptimistic(
    initialIsVerified,
    (state, newState: boolean) => newState
  )

  async function handleToggle(checked: boolean) {
    // Optimistically update the UI
    setOptimisticIsVerified(checked)

    // Perform the actual update
    const result = await toggleAgencyVerificationAction(agencyId, checked)

    if (!result.success) {
      // Revert on error (component will re-render with original state)
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="verified"
        checked={optimisticIsVerified}
        onCheckedChange={handleToggle}
      />
      <Label htmlFor="verified">
        {optimisticIsVerified ? 'Verified' : 'Not Verified'}
      </Label>
    </div>
  )
}
```

### Optimistic Updates with Form Submission

```typescript
// app/admin/agencies/[id]/edit/page.tsx
'use client'

import { useOptimistic, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Agency {
  id: string
  name: string
  isVerified: boolean
}

export function AgencyEditPage({ agency }: { agency: Agency }) {
  const router = useRouter()
  const [optimisticAgency, setOptimisticAgency] = useOptimistic(
    agency,
    (state, newData: Partial<Agency>) => ({ ...state, ...newData })
  )

  async function handleSubmit(formData: FormData) {
    const updates = {
      name: formData.get('name') as string,
      isVerified: formData.get('isVerified') === 'on',
    }

    // Optimistically update
    setOptimisticAgency(updates)

    // Submit to server
    const result = await updateAgencyAction(agency.id, updates)

    if (result.success) {
      router.refresh() // Refresh server component data
    }
  }

  return (
    <div>
      <h1>{optimisticAgency.name}</h1>
      <form action={handleSubmit}>
        {/* Form fields */}
      </form>
    </div>
  )
}
```

---

## 8. Cache Invalidation and Revalidation

### Modern Revalidation Patterns ([Source](https://nextjs.org/docs/app/api-reference/functions/revalidateTag))

**Tag-Based Revalidation (Recommended):**

```typescript
// app/admin/actions/agencies.ts
'use server'

import { revalidateTag } from 'next/cache'

export async function updateAgencyAction(agencyId: string, data: any) {
  // ... authentication, validation, update ...

  // Revalidate all pages that use 'agencies' tag
  revalidateTag('agencies')

  // Revalidate specific agency
  revalidateTag(`agency-${agencyId}`)

  return { success: true }
}

// In your data fetching
export async function getAgencies() {
  const res = await fetch('...', {
    next: { tags: ['agencies'] }
  })
  return res.json()
}

export async function getAgency(id: string) {
  const res = await fetch(`.../${id}`, {
    next: { tags: ['agencies', `agency-${id}`] }
  })
  return res.json()
}
```

**Path-Based Revalidation:**

```typescript
import { revalidatePath } from 'next/cache'

export async function updateAgencyAction(agencyId: string, data: any) {
  // ... update logic ...

  // Revalidate specific page
  revalidatePath(`/recruiters/${data.slug}`)

  // Revalidate all agency pages
  revalidatePath('/recruiters', 'page') // Single page
  revalidatePath('/admin/agencies', 'layout') // All pages in layout

  return { success: true }
}
```

**Combined Client-Server Pattern** ([Source](https://medium.com/@riccardo.carretta/nextjs-15-4-cache-revalidation-guide-client-server-side-7f3fe8fe6b3f))

```typescript
// lib/cache-tags.ts
export enum CacheTags {
  AGENCIES = 'agencies',
  AGENCY_DETAIL = 'agency-detail',
  TRADES = 'trades',
}

// Server-side revalidation
import { revalidateTag } from 'next/cache'
import { CacheTags } from '@/lib/cache-tags'

revalidateTag(CacheTags.AGENCIES)

// Client-side with React Query
import { useQueryClient } from '@tanstack/react-query'
import { CacheTags } from '@/lib/cache-tags'

const queryClient = useQueryClient()
queryClient.invalidateQueries({ queryKey: [CacheTags.AGENCIES] })
```

---

## 9. Complete Implementation Example

### Complete Admin Edit Page

```typescript
// app/admin/agencies/[id]/edit/page.tsx
import { verifySession } from '@/lib/auth/session'
import { forbidden, notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { AgencyEditForm } from '@/components/admin/AgencyEditForm'
import { AuditLog } from '@/components/admin/AuditLog'

async function getAgency(id: string) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookies().getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookies().set(name, value, options)
          })
        },
      },
    }
  )

  const { data, error } = await supabase
    .from('agencies')
    .select(`
      *,
      trades:agency_trades(trade:trades(*)),
      regions:agency_regions(region:regions(*))
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

async function getAuditLogs(agencyId: string) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookies().getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookies().set(name, value, options)
          })
        },
      },
    }
  )

  const { data } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('resource_type', 'agency')
    .eq('resource_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(20)

  return data || []
}

export default async function AdminAgencyEditPage({
  params,
}: {
  params: { id: string }
}) {
  // 1. Authentication check
  const session = await verifySession()

  if (!session) {
    redirect('/login')
  }

  // 2. Authorization check
  if (session.role !== 'admin') {
    forbidden()
  }

  // 3. Fetch data
  const [agency, auditLogs] = await Promise.all([
    getAgency(params.id),
    getAuditLogs(params.id),
  ])

  if (!agency) {
    notFound()
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Agency</h1>
        <p className="text-muted-foreground">
          Update agency information and verification status
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AgencyEditForm agency={agency} />
        </div>

        <div>
          <AuditLog entries={auditLogs} />
        </div>
      </div>
    </div>
  )
}
```

### Complete Server Action with All Best Practices

```typescript
// app/admin/actions/agencies.ts
'use server'

import { verifySession } from '@/lib/auth/session'
import { agencyEditSchema, type AgencyEditInput } from '@/lib/validations/agency'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath, revalidateTag } from 'next/cache'
import { logAuditEvent } from '@/lib/audit'
import { redirect } from 'next/navigation'

type ActionResult<T = any> =
  | { success: true; data: T }
  | { success: false; error: string; errors?: Record<string, string> }

export async function updateAgencyAction(
  agencyId: string,
  formData: AgencyEditInput
): Promise<ActionResult> {
  // 1. Authentication
  const session = await verifySession()

  if (!session) {
    redirect('/login')
  }

  // 2. Authorization
  if (session.role !== 'admin') {
    return {
      success: false,
      error: 'Insufficient permissions. Admin access required.',
    }
  }

  // 3. Input Validation
  const validation = agencyEditSchema.safeParse(formData)

  if (!validation.success) {
    const fieldErrors: Record<string, string> = {}

    validation.error.errors.forEach((err) => {
      const path = err.path.join('.')
      if (path) {
        fieldErrors[path] = err.message
      }
    })

    return {
      success: false,
      error: 'Validation failed. Please check the form fields.',
      errors: fieldErrors,
    }
  }

  // 4. Database Operation
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookies().getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookies().set(name, value, options)
            })
          },
        },
      }
    )

    // Fetch old values for audit
    const { data: oldAgency } = await supabase
      .from('agencies')
      .select('*')
      .eq('id', agencyId)
      .single()

    if (!oldAgency) {
      return {
        success: false,
        error: 'Agency not found',
      }
    }

    // Update agency
    const { data: updatedAgency, error: updateError } = await supabase
      .from('agencies')
      .update({
        name: validation.data.name,
        email: validation.data.email,
        phone: validation.data.phone,
        website: validation.data.website,
        description: validation.data.description,
        is_verified: validation.data.isVerified,
        verified_at: validation.data.isVerified
          ? (oldAgency.is_verified ? oldAgency.verified_at : new Date().toISOString())
          : null,
        verification_notes: validation.data.verificationNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agencyId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return {
        success: false,
        error: 'Failed to update agency. Please try again.',
      }
    }

    // Update relationships
    await updateAgencyRelationships(supabase, agencyId, validation.data)

    // 5. Audit Logging
    await logAuditEvent({
      action: 'agency_updated',
      resource_type: 'agency',
      resource_id: agencyId,
      admin_id: session.user.id,
      admin_email: session.user.email,
      old_values: oldAgency,
      new_values: updatedAgency,
      changes: validation.data,
    })

    // 6. Cache Invalidation
    revalidateTag('agencies')
    revalidateTag(`agency-${agencyId}`)
    revalidatePath(`/recruiters/${updatedAgency.slug}`)
    revalidatePath('/admin/agencies')

    return {
      success: true,
      data: updatedAgency,
    }

  } catch (error) {
    console.error('Unexpected error in updateAgencyAction:', error)

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again or contact support.',
    }
  }
}

async function updateAgencyRelationships(
  supabase: any,
  agencyId: string,
  data: AgencyEditInput
) {
  // Update trades
  await supabase
    .from('agency_trades')
    .delete()
    .eq('agency_id', agencyId)

  if (data.trades.length > 0) {
    const { error: tradesError } = await supabase
      .from('agency_trades')
      .insert(
        data.trades.map(tradeId => ({
          agency_id: agencyId,
          trade_id: tradeId,
        }))
      )

    if (tradesError) throw tradesError
  }

  // Update regions
  await supabase
    .from('agency_regions')
    .delete()
    .eq('agency_id', agencyId)

  if (data.regions.length > 0) {
    const { error: regionsError } = await supabase
      .from('agency_regions')
      .insert(
        data.regions.map(regionId => ({
          agency_id: agencyId,
          region_id: regionId,
        }))
      )

    if (regionsError) throw regionsError
  }
}

// Bulk update action
export async function bulkUpdateAgenciesAction(
  agencyIds: string[],
  updates: Partial<AgencyEditInput>
): Promise<ActionResult<{ updated: number; failed: string[] }>> {
  const session = await verifySession()

  if (!session || session.role !== 'admin') {
    return {
      success: false,
      error: 'Unauthorized',
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookies().getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookies().set(name, value, options)
          })
        },
      },
    }
  )

  const results = await Promise.allSettled(
    agencyIds.map(async (id) => {
      const { error } = await supabase
        .from('agencies')
        .update(updates)
        .eq('id', id)

      if (error) throw new Error(id)

      await logAuditEvent({
        action: 'agency_bulk_updated',
        resource_type: 'agency',
        resource_id: id,
        admin_id: session.user.id,
        admin_email: session.user.email,
        changes: updates,
      })
    })
  )

  const failed = results
    .filter((r) => r.status === 'rejected')
    .map((r) => (r as PromiseRejectedResult).reason.message)

  const updated = results.filter((r) => r.status === 'fulfilled').length

  revalidateTag('agencies')

  return {
    success: true,
    data: { updated, failed },
  }
}
```

---

## Summary of Key Recommendations

### Architecture
1. Use Next.js 13+ App Router with Server Actions
2. Implement proper folder structure separating admin routes
3. Use TypeScript strict mode throughout

### Security
1. Every admin route must verify authentication AND authorization
2. Protect Server Actions with role checks
3. Use Supabase Row Level Security as additional layer
4. Implement middleware for session management

### Forms & Validation
1. Use React Hook Form with Zod for type-safe validation
2. Return errors as data, not thrown exceptions
3. Provide field-level error feedback
4. Use Shadcn/ui form components for consistency

### Audit Logging
1. Log all admin actions to audit table
2. Store old and new values for comparison
3. Include admin identity and timestamp
4. Set retention policies for old logs

### UX
1. Provide inline editing for quick changes
2. Support bulk actions with clear feedback
3. Allow undo immediately after bulk operations
4. Show loading states during async operations

### Performance
1. Use tag-based cache invalidation
2. Implement optimistic UI updates
3. Revalidate only affected paths/tags
4. Use proper Next.js caching strategies

---

## Sources

### Official Documentation
- [Next.js App Router Authentication](https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/authentication.mdx)
- [Next.js Server Actions](https://nextjs.org/docs/13/app/building-your-application/data-fetching/server-actions-and-mutations)
- [React Hook Form Documentation](https://github.com/react-hook-form/documentation)
- [Zod Documentation](https://github.com/colinhacks/zod)
- [Supabase SSR Documentation](https://github.com/supabase/ssr)
- [Next.js Cache Revalidation](https://nextjs.org/docs/app/getting-started/caching-and-revalidating)

### Best Practices Articles (2025)
- [Next.js Best Practices in 2025](https://medium.com/@GoutamSingha/next-js-best-practices-in-2025-build-faster-cleaner-scalable-apps-7efbad2c3820)
- [Next.js App Router Best Practices](https://www.anshgupta.in/blog/nextjs-app-router-best-practices-2025)
- [Next.js Server Actions Error Handling](https://medium.com/@pawantripathi648/next-js-server-actions-error-handling-the-pattern-i-wish-i-knew-earlier-e717f28f2f75)
- [Type Safe Server Actions](https://next-safe-action.dev/)

### Audit Logging
- [Postgres Auditing in 150 Lines of SQL](https://supabase.com/blog/postgres-audit)
- [PGAudit Extension](https://supabase.com/docs/guides/database/extensions/pgaudit)
- [Supabase Audit Logs](https://supabase.com/docs/guides/auth/audit-logs)
- [Generic Table Auditing](https://github.com/supabase/supa_audit)

### UX Patterns
- [Bulk Action UX Guidelines](https://www.eleken.co/blog-posts/bulk-actions-ux)
- [Inline Editing Best Practices](https://uxdworld.com/inline-editing-in-tables-design/)
- [Bulk Editing Pattern](https://design.basis.com/patterns/bulk-editing)

### Error Handling & Feedback
- [React-Toastify Guide 2025](https://blog.logrocket.com/react-toastify-guide/)
- [React Hot Toast](https://refine.dev/blog/react-hot-toast/)
- [React Server Actions with Toast](https://www.robinwieruch.de/react-server-actions-toast/)

### Shadcn UI
- [Shadcn Admin Templates](https://github.com/satnaing/shadcn-admin)
- [Shadcn UI Admin Kit](https://github.com/marmelab/shadcn-admin-kit)
- [Next.js Shadcn Dashboard Starter](https://github.com/Kiranism/next-shadcn-dashboard-starter)
