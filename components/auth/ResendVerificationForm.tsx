'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const resendSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ResendFormData = z.infer<typeof resendSchema>;

interface ResendVerificationFormProps {
  initialEmail?: string;
}

export function ResendVerificationForm({
  initialEmail = '',
}: ResendVerificationFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResendFormData>({
    resolver: zodResolver(resendSchema),
    defaultValues: {
      email: initialEmail,
    },
  });

  const onSubmit = async (data: ResendFormData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      if (response.status === 429) {
        setError('Please wait before requesting another email.');
      } else if (!response.ok) {
        setError('Something went wrong. Please try again.');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a new verification link to your email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Click the link in the email to verify your account. The link will
              expire in 1 hour.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-center text-xl">
          Resend Verification Email
        </CardTitle>
        <CardDescription className="text-center">
          Enter your email address to receive a new verification link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              aria-label="Email address"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
              disabled={loading}
            />
            {errors.email && (
              <p
                id="email-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            aria-label={
              loading ? 'Sending verification email' : 'Send verification email'
            }
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send verification email'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
