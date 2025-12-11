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

// Utility function for creating slugs
const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

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
  const [selectedAgency, setSelectedAgency] = useState<any>(null);
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

  const selectAgency = (agency: any) => {
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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Claim Request Submitted!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Your claim request has been received and is under review.
              We&apos;ll contact you within 2 business days to verify your
              ownership.
            </p>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="font-semibold text-lg mb-4">What happens next?</h3>
              <div className="text-left space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-blue-600">
                      1
                    </span>
                  </div>
                  <p className="text-gray-600">
                    Our team will verify your email domain matches the agency
                    website
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-blue-600">
                      2
                    </span>
                  </div>
                  <p className="text-gray-600">
                    We&apos;ll contact you via email to confirm your identity
                    and role
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-blue-600">
                      3
                    </span>
                  </div>
                  <p className="text-gray-600">
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
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="construction-hero py-16 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Claim Your Agency Listing
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Take control of your profile and start receiving qualified leads
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Alert className="mb-8">
              <Building2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Free to claim:</strong> All agency listings are free.
                Once verified, you&apos;ll be able to edit your profile, manage
                leads, and enhance your visibility to potential clients.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Agency Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="h-5 w-5" />
                    <span>Find Your Agency</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search for your agency</Label>
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
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedAgency?.name === agency.name
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => selectAgency(agency)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold">{agency.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {agency.regions.join(', ')}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {agency.trades.slice(0, 3).map((trade, i) => (
                                    <Badge
                                      key={i}
                                      variant="outline"
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
                        <div className="text-center py-8 text-gray-500">
                          <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>
                            No agencies found matching &quot;{searchTerm}&quot;
                          </p>
                          <p className="text-sm mt-1">
                            Can&apos;t find your agency? Contact us to get it
                            added.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {!searchTerm && (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>Start typing to search for your agency</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Claim Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Claim Request</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="agencyName">Agency Name *</Label>
                      <Input
                        id="agencyName"
                        {...register('agencyName')}
                        placeholder="Your agency name"
                        readOnly={!!selectedAgency}
                        className={selectedAgency ? 'bg-gray-50' : ''}
                      />
                      {errors.agencyName && (
                        <p className="text-sm text-red-600">
                          {errors.agencyName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactName">Your Name *</Label>
                      <Input
                        id="contactName"
                        {...register('contactName')}
                        placeholder="Your full name"
                      />
                      {errors.contactName && (
                        <p className="text-sm text-red-600">
                          {errors.contactName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title *</Label>
                      <Input
                        id="jobTitle"
                        {...register('jobTitle')}
                        placeholder="e.g., Owner, President, HR Director"
                      />
                      {errors.jobTitle && (
                        <p className="text-sm text-red-600">
                          {errors.jobTitle.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">
                        Business Email Address *
                      </Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        {...register('contactEmail')}
                        placeholder="your.email@yourcompany.com"
                      />
                      {errors.contactEmail && (
                        <p className="text-sm text-red-600">
                          {errors.contactEmail.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Email domain should match your agency website for faster
                        verification
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="verificationDetails">
                        Verification Details *
                      </Label>
                      <Textarea
                        id="verificationDetails"
                        {...register('verificationDetails')}
                        placeholder="Please provide details to help us verify your ownership (e.g., your role at the company, website admin access, etc.)"
                        rows={4}
                      />
                      {errors.verificationDetails && (
                        <p className="text-sm text-red-600">
                          {errors.verificationDetails.message}
                        </p>
                      )}
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
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
