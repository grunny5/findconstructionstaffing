# FindConstructionStaffing - Authentication System Documentation

**Last Updated:** December 12, 2025
**Branch:** feat/011-auth-cleanup
**Status:** 🟡 Partially Implemented - Requires Email Verification Setup

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication Flows](#authentication-flows)
4. [Configuration](#configuration)
5. [Database Schema](#database-schema)
6. [Implementation Details](#implementation-details)
7. [Known Issues & Gaps](#known-issues--gaps)
8. [Environment Setup](#environment-setup)
9. [Testing](#testing)
10. [Roadmap](#roadmap)

---

## Overview

FindConstructionStaffing uses Supabase for authentication with a custom React Context implementation for client-side state management and Next.js Server Components for server-side auth checks.

### Current Status

**✅ Working:**

- Email/password signup and login
- Session persistence (cookie-based)
- Automatic profile creation
- Role-based access control (user, agency_owner, admin)
- Server-side route protection
- Comprehensive test coverage

**🚧 Partially Implemented:**

- ⚠️ **Email verification** - Config enabled (Task 1.1.1 ✅), template & routes pending

**❌ Not Implemented:**

- Password reset flow
- Role assignment UI
- Account settings/profile management
- OAuth/social authentication
- Route middleware protection

---

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js App Router                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Client Components              Server Components          │
│  ┌──────────────────┐          ┌─────────────────┐        │
│  │  AuthProvider    │          │  Admin Pages    │        │
│  │  (Context API)   │          │  (Role Check)   │        │
│  └────────┬─────────┘          └────────┬────────┘        │
│           │                              │                 │
│           ├──────────────────────────────┤                 │
│           │                              │                 │
│  ┌────────▼──────────┐        ┌─────────▼────────┐        │
│  │  Supabase Client  │        │  Supabase Server │        │
│  │  (@supabase/js)   │        │  (@supabase/ssr) │        │
│  └────────┬──────────┘        └─────────┬────────┘        │
└───────────┼─────────────────────────────┼─────────────────┘
            │                             │
            └─────────────┬───────────────┘
                          │
                 ┌────────▼─────────┐
                 │  Supabase Cloud  │
                 │                  │
                 │  ┌────────────┐  │
                 │  │ Auth API   │  │
                 │  ├────────────┤  │
                 │  │ PostgreSQL │  │
                 │  │  profiles  │  │
                 │  └────────────┘  │
                 └──────────────────┘
```

### Key Components

| Component              | Location                                                         | Purpose                           |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------- |
| `AuthProvider`         | `lib/auth/auth-context.tsx`                                      | Client-side auth state management |
| `useAuth()`            | `lib/auth/auth-context.tsx`                                      | React hook for auth access        |
| Supabase Server Client | `lib/supabase/server.ts`                                         | Server-side auth for SSR          |
| Signup Page            | `app/signup/page.tsx`                                            | User registration form            |
| Login Page             | `app/login/page.tsx`                                             | User login form                   |
| Profile Migration      | `supabase/migrations/20251211_001_create_profiles_and_roles.sql` | Database schema                   |

---

## Authentication Flows

### 1. Signup Flow

```
User fills form → Validation (Zod) → signUp(email, password, fullName)
                                          ↓
                                  Supabase.auth.signUp()
                                          ↓
                              ┌───────────┴────────────┐
                              │                        │
                         SUCCESS                    ERROR
                              │                        │
                    Trigger: on_auth_user_created     │
                              ↓                        │
                    Create profile in DB               │
                    - role: 'user' (default)           │
                    - full_name from metadata          │
                              ↓                        │
                    ⚠️ NO EMAIL VERIFICATION          │
                              ↓                        │
                    Show success message               │
                    Wait 2 seconds                     │
                              ↓                        │
                    Redirect to home (/)               │
                              │                        │
                              └────────────────────────┴─→ Display error
```

**Status:** Email confirmations now enabled (`enable_confirmations = true`). Email verification callback route and UI updates still needed (Tasks 1.1.2-1.1.5).

### 2. Login Flow

```
User enters credentials → Validation → signIn(email, password)
                                            ↓
                                Supabase.auth.signInWithPassword()
                                            ↓
                                ┌───────────┴────────────┐
                                │                        │
                           SUCCESS                    ERROR
                                │                        │
                        Fetch profile from DB           │
                        Store in context                │
                                ↓                        │
                        Redirect to callback URL        │
                        (or home if no redirectTo)      │
                                │                        │
                                └────────────────────────┴─→ Display error
```

### 3. Session Management

```
App Mount → AuthProvider initialization
                ↓
    supabase.auth.getSession()
                ↓
        ┌───────┴────────┐
        │                │
   HAS SESSION      NO SESSION
        │                │
   Fetch profile    Set loading=false
   from profiles    user=null, profile=null
        │
   Store in context
        ↓
   Subscribe to auth changes:
   - onAuthStateChange()
        ↓
   Listen for:
   - SIGNED_IN → fetch profile
   - SIGNED_OUT → clear profile
   - TOKEN_REFRESHED → update session
        ↓
   Cleanup on unmount:
   - unsubscribe()
```

---

## Configuration

### Supabase Auth Settings

**File:** `supabase/config.toml`

#### Email Authentication (Lines 121-161)

```toml
[auth.email]
enable_signup = true                    # ✅ Signup enabled
enable_confirmations = true             # ✅ Email verification enabled (Task 1.1.1 complete)
double_confirm_changes = true           # ✅ Confirm email changes
secure_email_change_enabled = true      # ✅ Secure email updates
```

#### Password Requirements (Line 127)

```toml
min_password_length = 6                 # Minimum 6 characters
```

#### Session Tokens (Lines 114-119)

```toml
jwt_expiry = 3600                       # 1 hour
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10       # 10 seconds
```

#### Rate Limiting (Line 134)

```toml
max_frequency = "2h"                    # 2 emails per hour per user
```

#### Testing Infrastructure (Lines 80-88)

```toml
[inbucket]
enabled = true                          # Email testing server
port = 54324
smtp_port = 54325
pop3_port = 54326
```

**Note:** Inbucket is available for local email testing but currently unused since email confirmations are disabled.

---

## Database Schema

### Profiles Table

**Migration:** `supabase/migrations/20251211_001_create_profiles_and_roles.sql`

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'agency_owner', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can update own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

**Note:** No INSERT policy - profiles created only via trigger.

### Automatic Profile Creation

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'user'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Flow:**

1. User signs up via `supabase.auth.signUp()`
2. Supabase creates record in `auth.users`
3. Trigger `on_auth_user_created` fires
4. Function `handle_new_user()` creates matching profile
5. Profile gets `full_name` from signup metadata
6. Profile gets default role `'user'`

### Indexes

```sql
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
```

---

## Implementation Details

### Client-Side: AuthProvider

**File:** `lib/auth/auth-context.tsx`

#### Context Interface

```typescript
interface AuthContextType {
  user: User | null; // Supabase auth.users record
  profile: Profile | null; // Custom profiles record
  loading: boolean; // Initial load state
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean; // Computed: profile.role === 'admin'
  isAgencyOwner: boolean; // Computed: profile.role === 'agency_owner'
}
```

#### Authentication Methods

**Sign Up:**

```typescript
const signUp = async (email: string, password: string, fullName?: string) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName, // Stored in raw_user_meta_data
      },
    },
  });
  if (error) throw error;
};
```

**Sign In:**

```typescript
const signIn = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
};
```

**Sign Out:**

```typescript
const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
```

#### Session Initialization

```typescript
useEffect(() => {
  // Get initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null);
    if (session?.user) {
      fetchProfile(session.user.id);
    } else {
      setLoading(false);
    }
  });

  // Listen for auth state changes
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
    if (session?.user) {
      fetchProfile(session.user.id);
    } else {
      setProfile(null);
      setLoading(false);
    }
  });

  return () => subscription.unsubscribe();
}, []);
```

### Server-Side: Supabase SSR Client

**File:** `lib/supabase/server.ts`

```typescript
export const createClient = () => {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Server Component - can't set cookies
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Server Component - can't remove cookies
          }
        },
      },
    }
  );
};
```

**Usage in Protected Routes:**

```typescript
// Example: app/(app)/admin/integrations/page.tsx
export default async function AdminIntegrationsPage() {
  const supabase = createClient();

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    redirect('/login');
  }

  // Check if user has admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    redirect('/');
  }

  // Admin-only content...
}
```

### UI Components

#### Signup Page

**File:** `app/signup/page.tsx`

**Features:**

- React Hook Form with Zod validation
- Fields: Full Name, Email, Password, Confirm Password
- Client-side validation
- Loading state during submission
- Success message with auto-redirect
- Error display
- Link to login page

**Validation Schema:**

```typescript
const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
```

#### Login Page

**File:** `app/login/page.tsx`

**Features:**

- React Hook Form with Zod validation
- Fields: Email, Password
- Support for redirect URL (`?redirectTo=`)
- Loading state during submission
- Error display
- Link to signup page

**Redirect Logic:**

```typescript
const onSubmit = async (data: LoginFormData) => {
  try {
    setLoading(true);
    setError('');
    await signIn(data.email, data.password);

    // Redirect to callback URL or home
    const redirectTo = searchParams.get('redirectTo') || '/';
    router.push(redirectTo);
  } catch (err: any) {
    setError(err.message || 'Failed to sign in');
  } finally {
    setLoading(false);
  }
};
```

### Header Component

**File:** `components/Header.tsx`

**Auth Integration:**

```typescript
const { user, profile, signOut } = useAuth();

// Conditional rendering based on auth state
{user ? (
  <DropdownMenu>
    <DropdownMenuTrigger>
      <Button variant="ghost">
        {profile?.full_name || user.email}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      {isAdmin && (
        <DropdownMenuItem>
          <Link href="/admin/integrations">Admin Dashboard</Link>
        </DropdownMenuItem>
      )}
      {isAgencyOwner && (
        <DropdownMenuItem>
          <Link href="/dashboard">Dashboard</Link>
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={handleSignOut}>
        Sign Out
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
) : (
  <>
    <Link href="/login">Sign In</Link>
    <Link href="/signup">Sign Up</Link>
  </>
)}
```

---

## Known Issues & Gaps

### 🔴 Critical Issues

#### 1. Email Verification Flow Incomplete

**Status:** ⚠️ IN PROGRESS (Task 1.1.1 Complete)
**Impact:** Email verification enabled but supporting infrastructure still needed

**Current State:**

- ✅ `enable_confirmations = true` in `supabase/config.toml` (Task 1.1.1)
- ❌ No email confirmation template (Task 1.1.2 pending)
- ❌ No verification callback route (Task 1.1.3 pending)
- ❌ Signup page doesn't show verification message (Task 1.1.4 pending)

**Risk:**

- Spam accounts
- Invalid email addresses in database
- No email ownership verification
- Potential for abuse

**Required Fix:**

1. Enable email confirmations in config
2. Set up email templates in Supabase Dashboard
3. Create email confirmation callback route
4. Handle confirmation errors
5. Update signup flow to show "check your email" message
6. Test with Inbucket locally

**Files to Modify:**

- `supabase/config.toml` - Enable confirmations
- `app/signup/page.tsx` - Update success message
- `app/auth/callback/route.ts` - Create callback handler (NEW FILE)

#### 2. No Password Reset Flow

**Status:** ⚠️ CRITICAL UX ISSUE
**Impact:** Users cannot recover forgotten passwords

**Missing:**

- "Forgot password" link on login page
- Password reset request page
- Email template for reset links
- Password reset callback handler
- New password submission form

**Required Implementation:**

1. Create `/app/forgot-password/page.tsx`
2. Create `/app/reset-password/page.tsx`
3. Add Supabase email template
4. Implement `supabase.auth.resetPasswordForEmail()`
5. Handle reset token validation
6. Add link to login page

### 🟡 Medium Priority Issues

#### 3. No Role Assignment Interface

**Status:** Manual database updates required
**Impact:** Cannot promote users to agency_owner or admin via UI

**Current Limitation:**

- All new users get role = 'user'
- Role changes require direct database access
- No admin panel for user management

**Workaround:**

```sql
-- Manual role update in database
UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE email = 'user@example.com';
```

**Required Features:**

1. Admin user management page
2. Role selection dropdown
3. RLS policy for admin role updates
4. Audit log for role changes

#### 4. No Account Settings Page

**Status:** Users cannot manage their account
**Impact:** Poor UX, no self-service options

**Missing:**

- Profile view/edit page
- Email change form
- Password change form
- Account deletion option

**Suggested Route:**

- `/app/settings/page.tsx` - Account settings
- `/app/settings/profile/page.tsx` - Edit profile
- `/app/settings/security/page.tsx` - Change password
- `/app/settings/delete/page.tsx` - Delete account

#### 5. No Route Middleware Protection

**Status:** Manual auth checks in each protected route
**Impact:** Code duplication, easy to forget auth check

**Current Pattern:**

```typescript
// Each protected route must do this:
const supabase = createClient();
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user) redirect('/login');
```

**Better Approach:**
Create Next.js middleware at `middleware.ts`:

```typescript
export async function middleware(request: NextRequest) {
  const supabase = createMiddlewareClient({ req: request });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  if (request.nextUrl.pathname.startsWith('/admin') && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
```

### 🟢 Low Priority / Future Enhancements

#### 6. OAuth / Social Authentication

**Status:** Not implemented
**Providers to consider:**

- Google
- GitHub
- Microsoft
- LinkedIn (relevant for construction industry)

**Implementation:**

- Enable providers in Supabase dashboard
- Add OAuth buttons to login/signup pages
- Handle OAuth callbacks
- Merge OAuth profiles with local profiles

#### 7. Two-Factor Authentication (2FA)

**Status:** Not implemented
**Consideration:** Optional 2FA for admin and agency_owner accounts

#### 8. Session Management UI

**Status:** No active sessions view
**Feature:** Show active sessions, allow user to revoke devices

#### 9. Email Change Verification

**Status:** Enabled in config but no UI
**Feature:** Form to change email with verification step

---

## Environment Setup

### Required Environment Variables

#### Public (Client & Server)

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Server-Only (Database Seeding)

```bash
# .env.local
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Local Development Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up Supabase project:**
   - Create account at https://supabase.com
   - Create new project
   - Copy project URL and anon key

3. **Configure environment:**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Run database migrations:**

   ```bash
   # If using Supabase CLI:
   supabase db push

   # Or manually via Supabase Dashboard > SQL Editor
   # Run: supabase/migrations/20251211_001_create_profiles_and_roles.sql
   ```

5. **Start development server:**

   ```bash
   npm run dev
   ```

6. **Test signup/login:**
   - Navigate to http://localhost:3000/signup
   - Create test account
   - Verify profile created in Supabase Dashboard

### Email Testing Setup (Local)

Supabase local development includes Inbucket for email testing:

1. **Start Supabase locally:**

   ```bash
   supabase start
   ```

2. **Access Inbucket:**
   - Web UI: http://localhost:54324
   - SMTP: localhost:54325
   - POP3: localhost:54326

3. **View test emails:**
   - Sign up with any email
   - Check Inbucket inbox at http://localhost:54324

**Note:** Email confirmations now enabled (`enable_confirmations = true`). Template and callback route implementation needed (Tasks 1.1.2-1.1.3).

---

## Testing

### Test Coverage

**Overall:** 808 tests passing, 85%+ coverage requirement met

**Auth-Specific Test Files:**

1. **Auth Context Tests:** `__tests__/auth-context.test.tsx` (712 lines, 20 tests)
   - Initialization and loading states
   - Sign in/up/out operations
   - Error handling
   - Role checks (isAdmin, isAgencyOwner)
   - Auth state change handling
   - Context API availability

2. **Login Page Tests:** `app/login/__tests__/page.test.tsx` (359 lines)
   - Form rendering
   - Validation errors
   - Successful login
   - Error handling
   - Redirect URL handling
   - Accessibility (labels, autocomplete)

3. **Signup Page Tests:** `app/signup/__tests__/page.test.tsx` (491 lines)
   - Form rendering
   - Validation (name, email, password match)
   - Successful signup
   - Loading state
   - Error handling
   - Success message and redirect
   - Accessibility

4. **Admin Protection Tests:** `app/(app)/admin/integrations/__tests__/page.test.tsx`
   - Unauthenticated redirect to login
   - Non-admin redirect to home
   - Admin access granted

### Running Tests

```bash
# All tests
npm test

# Auth tests only
npm test -- __tests__/auth-context.test.tsx
npm test -- app/login/__tests__
npm test -- app/signup/__tests__

# Coverage report
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Manual Testing Checklist

#### Signup Flow

- [ ] Navigate to /signup
- [ ] Fill form with valid data
- [ ] Submit form
- [ ] Verify success message appears
- [ ] Verify redirect to home after 2 seconds
- [ ] Check Supabase Dashboard for new user in auth.users
- [ ] Check Supabase Dashboard for new profile in profiles table
- [ ] Verify profile has correct email, full_name, role='user'

#### Login Flow

- [ ] Navigate to /login
- [ ] Enter credentials
- [ ] Submit form
- [ ] Verify redirect to home (or redirectTo URL)
- [ ] Verify header shows user dropdown
- [ ] Verify user dropdown shows full name or email

#### Session Persistence

- [ ] Login successfully
- [ ] Refresh page
- [ ] Verify still logged in (header shows user dropdown)
- [ ] Close tab and reopen
- [ ] Verify still logged in

#### Sign Out

- [ ] Click user dropdown
- [ ] Click "Sign Out"
- [ ] Verify redirect to home
- [ ] Verify header shows "Sign In" / "Sign Up" links
- [ ] Attempt to access /admin/integrations
- [ ] Verify redirect to /login

#### Error Handling

- [ ] Try signup with existing email
- [ ] Verify error message displayed
- [ ] Try login with wrong password
- [ ] Verify error message displayed
- [ ] Try login with non-existent email
- [ ] Verify error message displayed

---

## Roadmap

### Phase 1: Current State (✅ Complete)

- [x] Basic signup/login with email/password
- [x] Session management
- [x] Profile creation
- [x] Role-based access control
- [x] Protected routes
- [x] Test coverage

### Phase 2: Email Verification (🔴 URGENT)

- [ ] Enable email confirmations in config
- [ ] Set up email templates
- [ ] Create confirmation callback route
- [ ] Update signup flow messaging
- [ ] Test with local Inbucket
- [ ] Production email service configuration

### Phase 3: Password Management

- [ ] Forgot password page
- [ ] Reset password page
- [ ] Email template for reset links
- [ ] Token validation
- [ ] Test password reset flow

### Phase 4: Account Management

- [ ] Account settings page
- [ ] Edit profile form
- [ ] Change email form (with verification)
- [ ] Change password form
- [ ] Delete account flow

### Phase 5: Admin Features

- [ ] Admin dashboard
- [ ] User management interface
- [ ] Role assignment UI
- [ ] User search/filter
- [ ] Audit log for role changes

### Phase 6: Middleware & Security

- [ ] Next.js middleware for route protection
- [ ] Rate limiting for auth endpoints
- [ ] CSRF protection
- [ ] Session timeout configuration
- [ ] Suspicious activity detection

### Phase 7: OAuth Integration

- [ ] Google OAuth
- [ ] GitHub OAuth
- [ ] LinkedIn OAuth (industry-specific)
- [ ] OAuth profile merging

### Phase 8: Advanced Features

- [ ] Two-factor authentication (2FA)
- [ ] Active sessions management
- [ ] Device/session revocation
- [ ] Login history
- [ ] Security notifications

---

## Appendix

### TypeScript Types Reference

```typescript
// types/database.ts
export type UserRole = 'user' | 'agency_owner' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
}

// types/supabase.ts
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
    };
  };
}
```

### Useful Commands

```bash
# Authentication testing
npm test -- __tests__/auth-context.test.tsx

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Database migration
supabase db push

# View local Supabase logs
supabase status

# Reset local database
supabase db reset

# Seed database
npm run seed
```

### References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [@supabase/ssr Package](https://github.com/supabase/ssr)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

---

**Document Status:** 🟡 Living Document - Update as authentication system evolves

**Last Review:** December 12, 2025
**Next Review:** After email verification implementation
