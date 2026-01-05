'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setLoading(true);
      setSuccess(false);

      const redirectUrl = (
        process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      ).replace(/\/+$/, '');
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        data.email,
        {
          redirectTo: `${redirectUrl}/reset-password`,
        }
      );

      if (resetError) throw resetError;

      // Always show success message to prevent email enumeration
      setSuccess(true);
    } catch (err: unknown) {
      // Show generic success message even on error to prevent email enumeration
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-industrial-bg-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-2">
          <h1 className="font-display text-4xl uppercase tracking-wide text-industrial-graphite-600">
            Reset Your Password
          </h1>
          <p className="font-body text-base text-industrial-graphite-500">
            Enter your email address and we&apos;ll send you a link to reset
            your password
          </p>
        </div>

        {success ? (
          /* Success State */
          <Card className="bg-industrial-bg-card rounded-industrial-sharp border-2 border-industrial-graphite-200">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Orange circle with checkmark icon */}
                <div className="bg-industrial-orange-100 w-16 h-16 rounded-industrial-sharp flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-industrial-orange" />
                </div>

                <div className="space-y-2">
                  <h2 className="font-display text-2xl uppercase tracking-wide text-industrial-graphite-600">
                    Check Your Email
                  </h2>
                  <p className="font-body text-sm text-industrial-graphite-500">
                    If this email exists in our system, you will receive a
                    password reset link shortly.
                  </p>
                </div>

                <Link
                  href="/login"
                  className="font-body text-sm font-semibold text-industrial-orange hover:text-industrial-orange-dark transition-colors"
                >
                  Return to sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Form Card */
          <Card className="bg-industrial-bg-card rounded-industrial-sharp border-2 border-industrial-graphite-200">
            <CardHeader className="border-b border-industrial-graphite-200">
              <CardTitle className="font-display text-xl uppercase tracking-wide text-industrial-graphite-600">
                Password Reset
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="space-y-6"
              >
                {/* Email Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                  >
                    Email Address
                  </Label>
                  <Input
                    {...register('email')}
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email address"
                    className="font-body"
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {errors.email && (
                    <p
                      id="email-error"
                      role="alert"
                      className="font-body text-sm text-industrial-orange"
                    >
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full font-body text-sm uppercase font-semibold"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                {/* Back to Login Link */}
                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="font-body text-sm font-semibold text-industrial-orange hover:text-industrial-orange-dark transition-colors"
                  >
                    Remember your password? Sign in
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
