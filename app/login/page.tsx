'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ResendVerificationForm } from '@/components/auth/ResendVerificationForm';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isFeatureEnabled } from '@/lib/feature-flags';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEmailNotVerified, setIsEmailNotVerified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError('');
      setIsEmailNotVerified(false);
      setUnverifiedEmail('');
      await signIn(data.email, data.password);

      // Redirect to callback URL or home
      const redirectTo = searchParams.get('redirectTo') || '/';
      router.push(redirectTo);
    } catch (err: any) {
      // Check if error is due to unverified email
      if (err.isEmailNotVerified) {
        setIsEmailNotVerified(true);
        setUnverifiedEmail(data.email);
        setError(err.message || 'Please verify your email address');
      } else {
        setError(err.message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout maxWidth="md">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="text-center">
          <h1 className="font-display text-4xl md:text-5xl uppercase tracking-wide text-industrial-graphite-600 mb-4">
            Sign In
          </h1>
          <p className="font-body text-lg text-industrial-graphite-500">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-semibold text-industrial-orange hover:text-industrial-orange-500 underline underline-offset-4"
            >
              Create one here
            </Link>
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-industrial-bg-card rounded-industrial-sharp border-2 border-industrial-graphite-200">
          <CardHeader className="border-b border-industrial-graphite-200">
            <CardTitle className="font-display text-xl uppercase text-industrial-graphite-600">
              Sign in to your account
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="font-body text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                >
                  Email Address <span className="text-industrial-orange">*</span>
                </Label>
                <Input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="your.email@example.com"
                  className={errors.email ? 'border-industrial-orange' : ''}
                />
                {errors.email && (
                  <p className="font-body text-sm text-industrial-orange">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                >
                  Password <span className="text-industrial-orange">*</span>
                </Label>
                <Input
                  {...register('password')}
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={errors.password ? 'border-industrial-orange' : ''}
                />
                {errors.password && (
                  <p className="font-body text-sm text-industrial-orange">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              {/* Forgot Password Link */}
              <div className="text-center pt-2">
                <Link
                  href="/forgot-password"
                  className="font-body text-sm font-semibold text-industrial-orange hover:text-industrial-orange-500 underline underline-offset-4"
                >
                  Forgot your password?
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Resend Verification Form */}
        {isEmailNotVerified &&
          unverifiedEmail &&
          isFeatureEnabled('resendVerification') && (
            <div className="mt-6">
              <ResendVerificationForm initialEmail={unverifiedEmail} />
            </div>
          )}
      </div>
    </AuthPageLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthPageLayout maxWidth="md">
          <div className="text-center">
            <p className="font-body text-lg text-industrial-graphite-400">Loading...</p>
          </div>
        </AuthPageLayout>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
