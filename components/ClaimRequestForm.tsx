'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ClaimRequestSchema,
  type ClaimRequestInput,
} from '@/lib/validation/claim-request';
import { verifyEmailDomain } from '@/lib/utils/email-domain-verification';

interface ClaimRequestFormProps {
  agencyId: string;
  agencyName: string;
  agencyWebsite?: string | null;
}

export function ClaimRequestForm({
  agencyId,
  agencyName,
  agencyWebsite,
}: ClaimRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [claimId, setClaimId] = useState('');
  const [error, setError] = useState('');
  const [emailDomainWarning, setEmailDomainWarning] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<ClaimRequestInput>({
    resolver: zodResolver(ClaimRequestSchema),
    defaultValues: {
      agency_id: agencyId,
      business_email: '',
      phone_number: '',
      position_title: '',
      verification_method: 'email',
      additional_notes: '',
    },
  });

  const watchEmail = watch('business_email');

  // Check email domain match when email changes
  useEffect(() => {
    if (watchEmail && agencyWebsite) {
      const isMatch = verifyEmailDomain(watchEmail, agencyWebsite);
      setEmailDomainWarning(!isMatch);
    } else {
      setEmailDomainWarning(false);
    }
  }, [watchEmail, agencyWebsite]);

  const onSubmit = async (data: ClaimRequestInput) => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      const response = await fetch('/api/claims/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error?.code === 'AGENCY_ALREADY_CLAIMED') {
          setError(
            'This agency has already been claimed. Please contact support if you believe this is an error.'
          );
        } else if (result.error?.code === 'PENDING_CLAIM_EXISTS') {
          setError(
            'You already have a pending claim request for this agency. Please wait for it to be reviewed.'
          );
        } else if (result.error?.code === 'VALIDATION_ERROR') {
          setError('Please check your form inputs and try again.');
        } else if (result.error?.code === 'UNAUTHORIZED') {
          setError('You must be logged in to submit a claim request.');
        } else {
          setError(
            result.error?.message ||
              'Failed to submit claim request. Please try again.'
          );
        }
        return;
      }

      setSuccess(true);
      setClaimId(result.data.id);
      reset();
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
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
          <CardTitle className="text-2xl">Claim Request Submitted</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Your claim request for <strong>{agencyName}</strong> has been
              successfully submitted. We&apos;ll review it within 2 business
              days.
            </AlertDescription>
          </Alert>

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Claim ID</p>
            <p className="font-mono text-sm">{claimId}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">What happens next?</p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Our team will verify your information</li>
              <li>You&apos;ll receive an email with the decision</li>
              <li>
                If approved, you&apos;ll be able to manage the agency profile
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" asChild className="flex-1">
              <a href={`/recruiters/${agencyId}`}>View Agency Profile</a>
            </Button>
            <Button asChild className="flex-1">
              <a href="/">Back to Directory</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Claim Request Form</CardTitle>
        <p className="text-sm text-muted-foreground">
          Submit a claim request for <strong>{agencyName}</strong>. Provide your
          business contact information to verify you represent this agency.
        </p>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          {/* Hidden agency_id field */}
          <input type="hidden" {...register('agency_id')} />

          {/* Agency Name (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="agency-name">Agency Name</Label>
            <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{agencyName}</span>
            </div>
          </div>

          {/* Business Email */}
          <div className="space-y-2">
            <Label htmlFor="business_email">
              Business Email <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="business_email"
                type="email"
                placeholder="you@company.com"
                className="pl-9"
                aria-label="Business email"
                aria-invalid={!!errors.business_email}
                aria-describedby={
                  errors.business_email
                    ? 'business-email-error'
                    : emailDomainWarning
                      ? 'email-domain-warning'
                      : undefined
                }
                {...register('business_email')}
                disabled={loading}
              />
            </div>
            {errors.business_email && (
              <p
                id="business-email-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.business_email.message}
              </p>
            )}
            {!errors.business_email && emailDomainWarning && agencyWebsite && (
              <Alert id="email-domain-warning" variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your email domain doesn&apos;t match the agency website (
                  {agencyWebsite}). This may require additional verification.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone_number">
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone_number"
                type="tel"
                placeholder="+1-555-123-4567"
                className="pl-9"
                aria-label="Phone number"
                aria-invalid={!!errors.phone_number}
                aria-describedby={
                  errors.phone_number ? 'phone-error' : 'phone-hint'
                }
                {...register('phone_number')}
                disabled={loading}
              />
            </div>
            {errors.phone_number && (
              <p
                id="phone-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.phone_number.message}
              </p>
            )}
            {!errors.phone_number && (
              <p id="phone-hint" className="text-sm text-muted-foreground">
                Use international format: +1-555-123-4567
              </p>
            )}
          </div>

          {/* Position/Title */}
          <div className="space-y-2">
            <Label htmlFor="position_title">
              Position/Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="position_title"
              type="text"
              placeholder="HR Manager, Owner, Director, etc."
              aria-label="Position or title"
              aria-invalid={!!errors.position_title}
              aria-describedby={
                errors.position_title ? 'position-error' : undefined
              }
              {...register('position_title')}
              disabled={loading}
            />
            {errors.position_title && (
              <p
                id="position-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.position_title.message}
              </p>
            )}
          </div>

          {/* Verification Method */}
          <div className="space-y-3">
            <Label>
              Preferred Verification Method{' '}
              <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="verification_method"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  aria-label="Verification method"
                  disabled={loading}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="verify-email" />
                    <Label htmlFor="verify-email" className="font-normal">
                      Email Domain Verification
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="phone" id="verify-phone" />
                    <Label htmlFor="verify-phone" className="font-normal">
                      Phone Verification
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="manual" id="verify-manual" />
                    <Label htmlFor="verify-manual" className="font-normal">
                      Manual Review
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />
            {errors.verification_method && (
              <p className="text-sm text-destructive" role="alert">
                {errors.verification_method.message}
              </p>
            )}
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="additional_notes">
              Additional Notes{' '}
              <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="additional_notes"
              placeholder="Provide any additional information that might help verify your claim..."
              rows={4}
              aria-label="Additional notes"
              aria-invalid={!!errors.additional_notes}
              aria-describedby={
                errors.additional_notes ? 'notes-error' : 'notes-hint'
              }
              {...register('additional_notes')}
              disabled={loading}
              maxLength={1000}
            />
            {errors.additional_notes && (
              <p
                id="notes-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.additional_notes.message}
              </p>
            )}
            {!errors.additional_notes && (
              <p id="notes-hint" className="text-sm text-muted-foreground">
                Max 1000 characters
              </p>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            aria-label={
              loading ? 'Submitting claim request' : 'Submit claim request'
            }
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Claim Request'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
