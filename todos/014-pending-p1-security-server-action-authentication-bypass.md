---
status: pending
priority: p1
issue_id: "014"
tags: [code-review, security, critical, authentication]
dependencies: ["011"]
---

# CRITICAL: Server Action Authentication Bypass Vulnerability

## Problem Statement

**CRITICAL SECURITY VULNERABILITY** (CVSS 9.1): The proposed Server Action accepts `userId` as a parameter from the client, allowing **complete authentication bypass** and **privilege escalation**.

**Vulnerable Code** (plan lines 365-369):
```typescript
export async function updateAgencyAction(
  agencyId: string,
  userId: string,  // ⚠️ CLIENT-CONTROLLED - ATTACKER CONTROLS THIS
  formData: any
) {
  // No authentication check
  // No admin role verification
  // Directly uses client-provided userId
}
```

**Attack Scenario**:
1. Attacker opens browser DevTools
2. Calls Server Action directly: `updateAgencyAction('any-id', 'admin-uuid', {verified: true})`
3. Bypasses all authentication
4. Can impersonate any user, including admins
5. Can verify any agency as any user

**Impact**:
- Complete authentication bypass
- Privilege escalation (non-admins perform admin actions)
- Verification badge manipulation
- Audit trail poisoning (fake admin actions)
- Data integrity violation

## Findings

**From Security Review**:
> CRIT-001: Server Action Missing Authentication/Authorization. Severity: 🔴 CRITICAL. CVSS Score: 9.1 (Critical). The proposed Server Action accepts userId as a parameter from the client, but does not independently verify authentication or admin role. This creates a critical authentication bypass vulnerability.

**From TypeScript Review**:
> The proposed `updateAgencyAction` Server Action uses `any` for formData parameter and accepts client-provided `userId` - both are TypeScript violations and security risks.

## Proposed Solutions

### Solution 1: Remove Server Action Entirely (Recommended)

**Approach**: Don't create Server Action, use existing API route

**Rationale**:
- API routes already have proper auth (lines 132-170 in route.ts)
- Server Actions don't exist in codebase (see todo #011)
- This entire vulnerability goes away

**Pros**: Eliminates entire vulnerability class
**Cons**: None
**Effort**: 0 (don't implement vulnerable code)
**Risk**: NONE

### Solution 2: Fix Server Action Authentication (If Server Actions Used)

**Implementation**:
```typescript
export async function updateAgencyAction(
  agencyId: string,
  formData: AgencyEditFormData  // ✅ Typed, not 'any'
  // ✅ NO userId parameter - server determines this
): Promise<UpdateAgencyResult> {
  'use server'

  const supabase = await createClient()

  // 1. ✅ AUTHENTICATE USER (NEVER trust client params)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    return { success: false, message: 'Authentication required' }
  }

  // 2. ✅ VERIFY ADMIN ROLE
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { success: false, message: 'Admin access required' }
  }

  // 3. ✅ NOW safe to use user.id (server-verified)
  const userId = user.id

  // Rest of implementation...
}
```

**Pros**: Secure Server Action implementation
**Cons**: Still introduces new pattern (see todo #011)
**Effort**: 30 minutes
**Risk**: MEDIUM (new pattern)

## Recommended Action

✅ **Use Solution 1: Remove Server Action entirely**

**This issue is RESOLVED by todo #011** - removing Server Actions from the plan.

**If Server Actions must be used** (against recommendation):
- Implement Solution 2 with full auth
- Add security tests
- Penetration test before production

## Technical Details

**Affected Files**:
- `plans/feat-admin-agency-edit-page.md` (lines 365-429) - DELETE entire section
- This vulnerability exists only in the PLAN, not in production code

**OWASP Category**: A07:2021 – Identification and Authentication Failures

**CWE**: CWE-306 (Missing Authentication for Critical Function)

**Attack Vectors**:
- Browser DevTools direct function call
- Malicious browser extension
- XSS payload calling Server Action
- CSRF if origin checks bypassed

## Acceptance Criteria

- [ ] Server Action removed from plan (todo #011 completed)
- [ ] OR Server Action implements Solution 2 authentication
- [ ] Security audit confirms no authentication bypass
- [ ] Penetration testing passes
- [ ] Admin-only actions require server-side role check

## Work Log

**2026-01-13**: Critical security vulnerability identified in code review by Security Sentinel agent.

## Resources

- **Security Review**: Full report from security-sentinel agent
- **OWASP Reference**: A07:2021 – Identification and Authentication Failures
- **Proper Auth Pattern**: `app/api/admin/agencies/[id]/route.ts:132-170`
- **Related Todo**: #011 (Remove Server Actions)
