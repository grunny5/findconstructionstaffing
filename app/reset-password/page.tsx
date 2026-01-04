'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

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
          const { data: retrySession } = await supabase.auth.getSession();
          if (retrySession.session) {
            setTokenState('valid');
            return;
          }
          setTokenState('expired');
          return;
        }

        // No session and no token - invalid access
        setTokenState('missing');
      } catch (err: unknown) {
        console.error('Session validation error:', err);
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

      setSuccess(true);
    } catch (err: unknown) {
      let errorMessage = 'Failed to update password';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = (err as { message: string }).message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (tokenState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Missing token error
  if (tokenState === 'missing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              This password reset link is invalid or missing.
            </p>
          </div>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">
              The reset link is invalid or missing. Please request a new
              password reset link.
            </p>
          </div>
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Request new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Expired token error
  if (tokenState === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Link Expired
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              This password reset link has expired.
            </p>
          </div>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">
              This link has expired. Password reset links are valid for 1 hour.
              Please request a new one.
            </p>
          </div>
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Request new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // General error
  if (tokenState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Error
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Something went wrong.
            </p>
          </div>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">
              An error occurred while validating your reset link. Please try
              again.
            </p>
          </div>
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Request new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Password Updated
            </h2>
          </div>
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Password updated successfully
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    Your password has been updated. You will be redirected to
                    the login page in a few seconds...
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Go to login now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Valid token - show form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        <form
          className="mt-8 space-y-6"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">
                New Password
              </label>
              <input
                {...register('password')}
                id="password"
                type="password"
                autoComplete="new-password"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="New Password"
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={
                  errors.password ? 'password-error' : undefined
                }
              />
              {errors.password && (
                <p
                  id="password-error"
                  role="alert"
                  className="mt-1 text-sm text-red-600"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword')}
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                aria-invalid={errors.confirmPassword ? true : undefined}
                aria-describedby={
                  errors.confirmPassword ? 'confirmPassword-error' : undefined
                }
              />
              {errors.confirmPassword && (
                <p
                  id="confirmPassword-error"
                  role="alert"
                  className="mt-1 text-sm text-red-600"
                >
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Updating password...' : 'Reset password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
