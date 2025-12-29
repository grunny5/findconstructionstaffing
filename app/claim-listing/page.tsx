'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Search,
  Mail,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { mockAgencies } from '@/lib/mock-data';
import { toast } from 'sonner';

// Type for mock agency data
type MockAgency = (typeof mockAgencies)[number];

const claimSchema = z.object({
  agencyName: z.string().min(2, 'Agency name must be at least 2 characters'),
  contactEmail: z.string().email('Please enter a valid email address'),
  contactName: z.string().min(2, 'Contact name must be at least 2 characters'),
  jobTitle: z.string().min(2, 'Job title must be at least 2 characters'),
  verificationDetails: z
    .string()
    .min(10, 'Please provide verification details'),
});

type ClaimFormData = z.infer<typeof claimSchema>;

export default function ClaimListingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgency, setSelectedAgency] = useState<MockAgency | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ClaimFormData>({
    resolver: zodResolver(claimSchema),
  });

  // Filter agencies based on search
  const filteredAgencies = mockAgencies
    .filter((agency) =>
      agency.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 10);

  const selectAgency = (agency: MockAgency) => {
    setSelectedAgency(agency);
    setValue('agencyName', agency.name);
  };

  const onSubmit = async (data: ClaimFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log('Claim request submitted:', data);
      setIsSubmitted(true);
      toast.success(
        'Claim request submitted! We will review and contact you within 2 business days.'
      );
    } catch (error) {
      toast.error('Failed to submit claim request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-industrial-bg-primary">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-industrial-orange-100 w-16 h-16 rounded-industrial-sharp flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-industrial-orange" />
            </div>
            <h1 className="font-display text-3xl lg:text-4xl text-industrial-graphite-600 uppercase tracking-wide mb-4">
              Claim Request Submitted!
            </h1>
            <p className="font-body text-lg text-industrial-graphite-500 mb-8">
              Your claim request has been received and is under review.
              We&apos;ll contact you within 2 business days to verify your
              ownership.
            </p>
            <div className="bg-industrial-bg-card rounded-industrial-sharp p-6 border border-industrial-graphite-200">
              <h2 className="font-display text-xl uppercase text-industrial-graphite-600 mb-4">
                What happens next?
              </h2>
              <div className="text-left space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="bg-industrial-orange-100 w-6 h-6 rounded-industrial-sharp flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-industrial-orange">
                      1
                    </span>
                  </div>
                  <p className="font-body text-industrial-graphite-500">
                    Our team will verify your email domain matches the agency
                    website
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-industrial-orange-100 w-6 h-6 rounded-industrial-sharp flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-industrial-orange">
                      2
                    </span>
                  </div>
                  <p className="font-body text-industrial-graphite-500">
                    We&apos;ll contact you via email to confirm your identity
                    and role
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-industrial-orange-100 w-6 h-6 rounded-industrial-sharp flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-industrial-orange">
                      3
                    </span>
                  </div>
                  <p className="font-body text-industrial-graphite-500">
                    Once verified, you&apos;ll receive login credentials to
                    manage your listing
                  </p>
                </div>
              </div>
            </div>
            <Button className="mt-8" asChild>
              <a href="/">Return to Directory</a>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-industrial-bg-primary">
      <Header />

      {/* Hero Section - Industrial Design */}
      <section className="bg-industrial-graphite-600 py-16 border-b-4 border-industrial-orange">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1
              className="font-display text-white uppercase tracking-wide mb-6"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
            >
              Claim Your Agency Listing
            </h1>
            <p className="font-body text-xl md:text-2xl text-industrial-graphite-200">
              Take control of your profile and start receiving qualified leads
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Alert className="mb-8 border-industrial-graphite-200 bg-industrial-bg-card">
              <Building2 className="h-4 w-4 text-industrial-orange" />
              <AlertDescription className="font-body text-industrial-graphite-500">
                <strong className="text-industrial-graphite-600">
                  Free to claim:
                </strong>{' '}
                All agency listings are free. Once verified, you&apos;ll be able
                to edit your profile, manage leads, and enhance your visibility
                to potential clients.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Agency Search */}
              <Card className="bg-industrial-bg-card rounded-industrial-sharp border-industrial-graphite-200">
                <CardHeader className="border-b border-industrial-graphite-200">
                  <CardTitle className="flex items-center space-x-2 font-display text-xl uppercase text-industrial-graphite-600">
                    <Search className="h-5 w-5 text-industrial-orange" />
                    <span>Find Your Agency</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="search"
                      className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                    >
                      Search for your agency
                    </Label>
                    <Input
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Type your agency name..."
                    />
                  </div>

                  {searchTerm && (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredAgencies.length > 0 ? (
                        filteredAgencies.map((agency, index) => (
                          <div
                            key={index}
                            className={`p-4 border-2 rounded-industrial-sharp cursor-pointer transition-colors ${
                              selectedAgency?.name === agency.name
                                ? 'border-industrial-orange bg-industrial-orange-100'
                                : 'border-industrial-graphite-200 hover:border-industrial-graphite-300'
                            }`}
                            onClick={() => selectAgency(agency)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-display text-lg uppercase text-industrial-graphite-600">
                                  {agency.name}
                                </h4>
                                <p className="font-body text-sm text-industrial-graphite-400 mt-1">
                                  {agency.regions.join(', ')}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {agency.trades.slice(0, 3).map((trade, i) => (
                                    <Badge
                                      key={i}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {trade}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                Unclaimed
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-industrial-graphite-400">
                          <Building2 className="h-8 w-8 mx-auto mb-2 text-industrial-graphite-300" />
                          <p className="font-body">
                            No agencies found matching &quot;{searchTerm}&quot;
                          </p>
                          <p className="font-body text-sm mt-1">
                            Can&apos;t find your agency? Contact us to get it
                            added.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {!searchTerm && (
                    <div className="text-center py-8 text-industrial-graphite-400">
                      <Search className="h-8 w-8 mx-auto mb-2 text-industrial-graphite-300" />
                      <p className="font-body">
                        Start typing to search for your agency
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Claim Form */}
              <Card className="bg-industrial-bg-card rounded-industrial-sharp border-industrial-graphite-200">
                <CardHeader className="border-b border-industrial-graphite-200">
                  <CardTitle className="flex items-center space-x-2 font-display text-xl uppercase text-industrial-graphite-600">
                    <Mail className="h-5 w-5 text-industrial-orange" />
                    <span>Claim Request</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="agencyName"
                        className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                      >
                        Agency Name{' '}
                        <span className="text-industrial-orange">*</span>
                      </Label>
                      <Input
                        id="agencyName"
                        {...register('agencyName')}
                        placeholder="Your agency name"
                        readOnly={!!selectedAgency}
                        className={
                          selectedAgency ? 'bg-industrial-graphite-100' : ''
                        }
                      />
                      {errors.agencyName && (
                        <p className="font-body text-sm text-industrial-orange">
                          {errors.agencyName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="contactName"
                        className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                      >
                        Your Name{' '}
                        <span className="text-industrial-orange">*</span>
                      </Label>
                      <Input
                        id="contactName"
                        {...register('contactName')}
                        placeholder="Your full name"
                      />
                      {errors.contactName && (
                        <p className="font-body text-sm text-industrial-orange">
                          {errors.contactName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="jobTitle"
                        className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                      >
                        Job Title{' '}
                        <span className="text-industrial-orange">*</span>
                      </Label>
                      <Input
                        id="jobTitle"
                        {...register('jobTitle')}
                        placeholder="e.g., Owner, President, HR Director"
                      />
                      {errors.jobTitle && (
                        <p className="font-body text-sm text-industrial-orange">
                          {errors.jobTitle.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="contactEmail"
                        className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                      >
                        Business Email Address{' '}
                        <span className="text-industrial-orange">*</span>
                      </Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        {...register('contactEmail')}
                        placeholder="your.email@yourcompany.com"
                      />
                      {errors.contactEmail && (
                        <p className="font-body text-sm text-industrial-orange">
                          {errors.contactEmail.message}
                        </p>
                      )}
                      <p className="font-body text-xs text-industrial-graphite-400">
                        Email domain should match your agency website for faster
                        verification
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="verificationDetails"
                        className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                      >
                        Verification Details{' '}
                        <span className="text-industrial-orange">*</span>
                      </Label>
                      <Textarea
                        id="verificationDetails"
                        {...register('verificationDetails')}
                        placeholder="Please provide details to help us verify your ownership (e.g., your role at the company, website admin access, etc.)"
                        rows={4}
                      />
                      {errors.verificationDetails && (
                        <p className="font-body text-sm text-industrial-orange">
                          {errors.verificationDetails.message}
                        </p>
                      )}
                    </div>

                    <Alert className="border-industrial-graphite-200 bg-industrial-graphite-100">
                      <AlertCircle className="h-4 w-4 text-industrial-graphite-500" />
                      <AlertDescription className="font-body text-industrial-graphite-500">
                        We&apos;ll verify your claim within 2 business days. If
                        your email domain matches the agency website,
                        verification will be automatic. Otherwise, we may
                        request additional documentation.
                      </AlertDescription>
                    </Alert>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting || !selectedAgency}
                    >
                      {isSubmitting
                        ? 'Submitting Claim...'
                        : 'Submit Claim Request'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
