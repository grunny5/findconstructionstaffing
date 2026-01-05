'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

type TokenState = 'loading' | 'valid' | 'missing' | 'expired' | 'error';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [tokenState, setTokenState] = useState<TokenState>('loading');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const isMountedRef = useRef(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Track mount status to prevent state updates on unmounted component
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Validate session on mount (supports both PKCE callback flow and legacy hash flow)
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First, check if we have an existing session (from /auth/callback PKCE flow)
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (session && !sessionError) {
          // Valid session exists - user came from callback or is already authenticated
          if (!isMountedRef.current) return;
          setTokenState('valid');
          return;
        }

        // Fallback: Check for legacy hash fragment flow (access_token in URL)
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get('access_token');

        if (accessToken) {
          // Legacy flow - token in hash, Supabase client should have processed it
          // Re-check session after a brief delay for client to process
          await new Promise((resolve) => setTimeout(resolve, 100));
          if (!isMountedRef.current) return;
          const { data: retrySession } = await supabase.auth.getSession();
          if (!isMountedRef.current) return;
          if (retrySession.session) {
            setTokenState('valid');
            return;
          }
          if (!isMountedRef.current) return;
          setTokenState('expired');
          return;
        }

        // No session and no token - invalid access
        if (!isMountedRef.current) return;
        setTokenState('missing');
      } catch (err: unknown) {
        console.error('Session validation error:', err);
        if (!isMountedRef.current) return;
        setTokenState('error');
      }
    };

    checkSession();
  }, []);

  // Auto-redirect to login after successful password reset
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (success) {
      timeoutId = setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [success, router]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setLoading(true);
      setError('');

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) throw updateError;

      if (!isMountedRef.current) return;
      setSuccess(true);
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      let errorMessage = 'Failed to update password';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = (err as { message: string }).message;
      }
      setError(errorMessage);
    } finally {
      if (!isMountedRef.current) return;
      setLoading(false);
    }
  };

  // Loading state
  if (tokenState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-industrial-bg-primary">
        <div className="font-body text-lg text-industrial-graphite-500">
          Loading...
        </div>
      </div>
    );
  }

  // Missing token error
  if (tokenState === 'missing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-industrial-bg-primary py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-display text-4xl uppercase tracking-wide text-industrial-graphite-600">
              Invalid Reset Link
            </h1>
            <p className="font-body text-base text-industrial-graphite-500">
              This password reset link is invalid or missing.
            </p>
          </div>

          {/* Error Card */}
          <Card className="bg-industrial-bg-card rounded-industrial-sharp border-2 border-industrial-graphite-200">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Orange circle with X icon */}
                <div className="bg-industrial-orange-100 w-16 h-16 rounded-industrial-sharp flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-industrial-orange" />
                </div>

                <p className="font-body text-sm text-industrial-graphite-500">
                  The reset link is invalid or missing. Please request a new
                  password reset link.
                </p>

                <Link
                  href="/forgot-password"
                  className="font-body text-sm font-semibold text-industrial-orange hover:text-industrial-orange-dark transition-colors"
                >
                  Request new reset link
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Expired token error
  if (tokenState === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-industrial-bg-primary py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-display text-4xl uppercase tracking-wide text-industrial-graphite-600">
              Link Expired
            </h1>
            <p className="font-body text-base text-industrial-graphite-500">
              This password reset link has expired.
            </p>
          </div>

          {/* Error Card */}
          <Card className="bg-industrial-bg-card rounded-industrial-sharp border-2 border-industrial-graphite-200">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Orange circle with AlertTriangle icon */}
                <div className="bg-industrial-orange-100 w-16 h-16 rounded-industrial-sharp flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-industrial-orange" />
                </div>

                <p className="font-body text-sm text-industrial-graphite-500">
                  This link has expired. Password reset links are valid for 1
                  hour. Please request a new one.
                </p>

                <Link
                  href="/forgot-password"
                  className="font-body text-sm font-semibold text-industrial-orange hover:text-industrial-orange-dark transition-colors"
                >
                  Request new reset link
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // General error
  if (tokenState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-industrial-bg-primary py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-display text-4xl uppercase tracking-wide text-industrial-graphite-600">
              Error
            </h1>
            <p className="font-body text-base text-industrial-graphite-500">
              Something went wrong.
            </p>
          </div>

          {/* Error Card */}
          <Card className="bg-industrial-bg-card rounded-industrial-sharp border-2 border-industrial-graphite-200">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Orange circle with XCircle icon */}
                <div className="bg-industrial-orange-100 w-16 h-16 rounded-industrial-sharp flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-industrial-orange" />
                </div>

                <p className="font-body text-sm text-industrial-graphite-500">
                  An error occurred while validating your reset link. Please try
                  again.
                </p>

                <Link
                  href="/forgot-password"
                  className="font-body text-sm font-semibold text-industrial-orange hover:text-industrial-orange-dark transition-colors"
                >
                  Request new reset link
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-industrial-bg-primary py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-display text-4xl uppercase tracking-wide text-industrial-graphite-600">
              Password Updated
            </h1>
          </div>

          {/* Success Card */}
          <Card className="bg-industrial-bg-card rounded-industrial-sharp border-2 border-industrial-graphite-200">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Orange circle with checkmark icon */}
                <div className="bg-industrial-orange-100 w-16 h-16 rounded-industrial-sharp flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-industrial-orange" />
                </div>

                <div className="space-y-2">
                  <h2 className="font-display text-2xl uppercase tracking-wide text-industrial-graphite-600">
                    Password Updated Successfully
                  </h2>
                  <p className="font-body text-sm text-industrial-graphite-500">
                    Your password has been updated. You will be redirected to
                    the login page in a few seconds...
                  </p>
                </div>

                <Link
                  href="/login"
                  className="font-body text-sm font-semibold text-industrial-orange hover:text-industrial-orange-dark transition-colors"
                >
                  Go to login now
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Valid token - show form
  return (
    <div className="min-h-screen flex items-center justify-center bg-industrial-bg-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-2">
          <h1 className="font-display text-4xl uppercase tracking-wide text-industrial-graphite-600">
            Reset Your Password
          </h1>
          <p className="font-body text-base text-industrial-graphite-500">
            Enter your new password below
          </p>
        </div>

        {/* Form Card */}
        <Card className="bg-industrial-bg-card rounded-industrial-sharp border-2 border-industrial-graphite-200">
          <CardHeader className="border-b border-industrial-graphite-200">
            <CardTitle className="font-display text-xl uppercase tracking-wide text-industrial-graphite-600">
              New Password
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-6"
            >
              {/* Error Alert */}
              {error && (
                <div className="bg-industrial-orange-100 border-l-4 border-industrial-orange p-4 rounded-industrial-sharp">
                  <p className="font-body text-sm text-industrial-graphite-600">
                    {error}
                  </p>
                </div>
              )}

              {/* Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                >
                  New Password
                </Label>
                <Input
                  {...register('password')}
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="New Password"
                  className="font-body"
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={
                    errors.password ? 'password-error' : undefined
                  }
                />
                {errors.password && (
                  <p
                    id="password-error"
                    role="alert"
                    className="font-body text-sm text-industrial-orange"
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                >
                  Confirm Password
                </Label>
                <Input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm Password"
                  className="font-body"
                  aria-invalid={errors.confirmPassword ? true : undefined}
                  aria-describedby={
                    errors.confirmPassword ? 'confirmPassword-error' : undefined
                  }
                />
                {errors.confirmPassword && (
                  <p
                    id="confirmPassword-error"
                    role="alert"
                    className="font-body text-sm text-industrial-orange"
                  >
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full font-body text-sm uppercase font-semibold"
              >
                {loading ? 'Updating password...' : 'Reset password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
