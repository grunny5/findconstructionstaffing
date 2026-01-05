'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';

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

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      setLoading(true);
      setError('');
      const result = await signUp(data.email, data.password, data.fullName);

      // If session exists, user is auto-logged in (email confirmations disabled)
      // Redirect to home page
      if (result?.session) {
        router.push('/');
        return;
      }

      // No session means email confirmation is required
      setSubmittedEmail(data.email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // Success State - Email Verification Required
  if (success) {
    return (
      <AuthPageLayout maxWidth="md">
        <div className="text-center space-y-8">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="bg-industrial-orange-100 w-20 h-20 rounded-industrial-sharp flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-industrial-orange" />
            </div>
          </div>

          {/* Success Card */}
          <Card className="bg-industrial-bg-card rounded-industrial-sharp border-2 border-industrial-graphite-200">
            <CardHeader className="border-b border-industrial-graphite-200">
              <CardTitle className="font-display text-2xl uppercase text-industrial-graphite-600">
                Check Your Email
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Email Sent Message */}
              <p className="font-body text-lg text-industrial-graphite-500">
                We&apos;ve sent a verification link to{' '}
                <span className="font-semibold text-industrial-graphite-600">
                  {submittedEmail}
                </span>
              </p>

              {/* Instructions Alert */}
              <Alert>
                <AlertDescription className="font-body text-sm">
                  Click the link in the email to verify your account and
                  complete the signup process.
                </AlertDescription>
              </Alert>

              {/* Expiration Warning */}
              <div className="rounded-industrial-sharp bg-industrial-orange-100 border-2 border-industrial-orange p-4">
                <p className="font-body text-sm text-industrial-graphite-600">
                  <strong className="font-semibold">Note:</strong> The
                  verification link will expire in 1 hour.
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-4 pt-2">
                <p className="font-body text-sm text-industrial-graphite-400 text-center">
                  Didn&apos;t receive the email?
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/signup">Resend Verification Email</Link>
                </Button>
              </div>

              {/* Return Home Link */}
              <div className="text-center pt-2">
                <Link
                  href="/"
                  className="font-body text-sm font-semibold text-industrial-orange hover:text-industrial-orange-500 underline underline-offset-4"
                >
                  Return to home
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthPageLayout>
    );
  }

  // Form State - Create Account
  return (
    <AuthPageLayout
      showHero
      heroTitle="CREATE YOUR ACCOUNT"
      heroSubtitle="Join the FindConstructionStaffing network and connect with top staffing agencies"
      maxWidth="md"
    >
      <div className="space-y-8">
        {/* Page Header */}
        <div className="text-center">
          <p className="font-body text-lg text-industrial-graphite-500">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-industrial-orange hover:text-industrial-orange-500 underline underline-offset-4"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Signup Card */}
        <Card className="bg-industrial-bg-card rounded-industrial-sharp border-2 border-industrial-graphite-200">
          <CardHeader className="border-b border-industrial-graphite-200">
            <CardTitle className="font-display text-xl uppercase text-industrial-graphite-600">
              Create your account
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
                <Alert variant="destructive">
                  <AlertDescription className="font-body text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Full Name Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="fullName"
                  className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                >
                  Full Name <span className="text-industrial-orange">*</span>
                </Label>
                <Input
                  {...register('fullName')}
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe"
                  className={errors.fullName ? 'border-industrial-orange' : ''}
                />
                {errors.fullName && (
                  <p className="font-body text-sm text-industrial-orange">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                >
                  Email Address{' '}
                  <span className="text-industrial-orange">*</span>
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
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={errors.password ? 'border-industrial-orange' : ''}
                />
                {errors.password && (
                  <p className="font-body text-sm text-industrial-orange">
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
                  Confirm Password{' '}
                  <span className="text-industrial-orange">*</span>
                </Label>
                <Input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={
                    errors.confirmPassword ? 'border-industrial-orange' : ''
                  }
                />
                {errors.confirmPassword && (
                  <p className="font-body text-sm text-industrial-orange">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthPageLayout>
  );
}
