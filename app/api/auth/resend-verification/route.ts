import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  email: z.string().email('Invalid email format'),
});

interface ResendVerificationRequest {
  email: string;
}

interface ResendVerificationResponse {
  message: string;
}

interface RateLimitError {
  message: string;
  retryAfter: number;
}

// In-memory rate limit store (for development)
// In production, use Redis or database
interface RateLimitEntry {
  count: number;
  firstRequestAt: number;
  windowEndsAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 2;

function checkRateLimit(email: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(email);

  // No previous requests or window expired
  if (!entry || now > entry.windowEndsAt) {
    rateLimitStore.set(email, {
      count: 1,
      firstRequestAt: now,
      windowEndsAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  // Within window, check count
  if (entry.count < MAX_REQUESTS_PER_WINDOW) {
    entry.count += 1;
    rateLimitStore.set(email, entry);
    return { allowed: true };
  }

  // Rate limit exceeded
  const retryAfter = Math.ceil((entry.windowEndsAt - now) / 1000); // seconds
  return { allowed: false, retryAfter };
}

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Test-only helper to clear rate limits between tests
export function __TEST__clearRateLimits(): void {
  if (process.env.NODE_ENV === 'test') {
    rateLimitStore.clear();
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ResendVerificationResponse | RateLimitError>> {
  try {
    // Parse and validate request body
    const body =
      (await request.json()) as unknown as ResendVerificationRequest;

    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      // Return generic message even for validation errors to prevent email enumeration
      return NextResponse.json(
        {
          message:
            'If this email exists, we sent a verification link. Please check your inbox.',
        },
        { status: 200 }
      );
    }

    const { email } = validationResult.data;

    // Check rate limit
    const rateLimitCheck = checkRateLimit(email);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          message: 'Please wait before requesting another verification email.',
          retryAfter: rateLimitCheck.retryAfter!,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitCheck.retryAfter),
          },
        }
      );
    }

    // Create admin client for resending verification
    const supabaseAdmin = createAdminClient();

    // Resend verification email
    const { error } = await supabaseAdmin.auth.resend({
      type: 'signup',
      email,
    });

    // Log errors for debugging but don't expose to user
    if (error) {
      console.error('Resend verification error:', error);
    }

    // Always return success message to prevent email enumeration
    return NextResponse.json(
      {
        message:
          'If this email exists, we sent a verification link. Please check your inbox.',
      },
      { status: 200 }
    );
  } catch (error) {
    // Log unexpected errors
    console.error('Unexpected error in resend verification:', error);

    // Return generic success message to prevent information leakage
    return NextResponse.json(
      {
        message:
          'If this email exists, we sent a verification link. Please check your inbox.',
      },
      { status: 200 }
    );
  }
}
