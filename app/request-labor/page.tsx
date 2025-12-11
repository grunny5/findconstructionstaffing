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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CalendarDays,
  MapPin,
  Users,
  Briefcase,
  Phone,
  Mail,
  Building2,
} from 'lucide-react';
import { allTrades, allStates } from '@/lib/mock-data';
import { toast } from 'sonner';

const requestSchema = z.object({
  projectName: z.string().min(2, 'Project name must be at least 2 characters'),
  tradeNeeded: z.string().min(1, 'Please select a trade specialty'),
  headcount: z.coerce.number().min(1, 'Headcount must be at least 1'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  state: z.string().min(1, 'Please select a state'),
  startDate: z.string().min(1, 'Please select a start date'),
  duration: z.string().min(1, 'Please specify project duration'),
  contactName: z.string().min(2, 'Contact name must be at least 2 characters'),
  contactEmail: z.string().email('Please enter a valid email address'),
  contactPhone: z.string().min(10, 'Please enter a valid phone number'),
  additionalDetails: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

export default function RequestLaborPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
  });

  const onSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log('Labor request submitted:', data);
      setIsSubmitted(true);
      toast.success(
        'Labor request submitted successfully! Agencies will be notified within 24 hours.'
      );
    } catch (error) {
      toast.error('Failed to submit request. Please try again.');
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
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Request Submitted Successfully!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Your labor request has been sent to qualified staffing agencies.
              You should expect to receive responses within 24 hours.
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
                    Our system matches your requirements with the top 5
                    qualified agencies
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-blue-600">
                      2
                    </span>
                  </div>
                  <p className="text-gray-600">
                    Selected agencies receive your project details and contact
                    information
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-blue-600">
                      3
                    </span>
                  </div>
                  <p className="text-gray-600">
                    Agencies will contact you directly with proposals and
                    availability
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
              Request Skilled Labor
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Tell us about your project and we&apos;ll connect you with
              qualified staffing agencies
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
                <strong>How it works:</strong> Fill out this form and we&apos;ll
                automatically match you with the top 5 staffing agencies that
                specialize in your required trade and location. Agencies
                typically respond within 24 hours.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Project Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Briefcase className="h-5 w-5" />
                    <span>Project Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="projectName">Project Name *</Label>
                      <Input
                        id="projectName"
                        {...register('projectName')}
                        placeholder="e.g., Refinery Turnaround 2024"
                      />
                      {errors.projectName && (
                        <p className="text-sm text-red-600">
                          {errors.projectName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tradeNeeded">
                        Trade Specialty Needed *
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          setValue('tradeNeeded', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select trade specialty" />
                        </SelectTrigger>
                        <SelectContent>
                          {allTrades.map((trade) => (
                            <SelectItem key={trade} value={trade}>
                              {trade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.tradeNeeded && (
                        <p className="text-sm text-red-600">
                          {errors.tradeNeeded.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="headcount">
                        Number of Workers Needed *
                      </Label>
                      <Input
                        id="headcount"
                        type="number"
                        min="1"
                        {...register('headcount')}
                        placeholder="e.g., 15"
                      />
                      {errors.headcount && (
                        <p className="text-sm text-red-600">
                          {errors.headcount.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Project Duration *</Label>
                      <Input
                        id="duration"
                        {...register('duration')}
                        placeholder="e.g., 6 weeks, 3 months"
                      />
                      {errors.duration && (
                        <p className="text-sm text-red-600">
                          {errors.duration.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location & Timing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Location & Timing</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="location">
                        City / Project Location *
                      </Label>
                      <Input
                        id="location"
                        {...register('location')}
                        placeholder="e.g., Houston, TX"
                      />
                      {errors.location && (
                        <p className="text-sm text-red-600">
                          {errors.location.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Select
                        onValueChange={(value) => setValue('state', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {allStates.map((state) => (
                            <SelectItem key={state.code} value={state.name}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.state && (
                        <p className="text-sm text-red-600">
                          {errors.state.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        {...register('startDate')}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {errors.startDate && (
                        <p className="text-sm text-red-600">
                          {errors.startDate.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Contact Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contact Name *</Label>
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
                      <Label htmlFor="contactEmail">Email Address *</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        {...register('contactEmail')}
                        placeholder="your.email@company.com"
                      />
                      {errors.contactEmail && (
                        <p className="text-sm text-red-600">
                          {errors.contactEmail.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Phone Number *</Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        {...register('contactPhone')}
                        placeholder="(555) 123-4567"
                      />
                      {errors.contactPhone && (
                        <p className="text-sm text-red-600">
                          {errors.contactPhone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalDetails">
                      Additional Project Details
                    </Label>
                    <Textarea
                      id="additionalDetails"
                      {...register('additionalDetails')}
                      placeholder="Any specific requirements, certifications needed, or other details that would help agencies provide accurate proposals..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="flex justify-center">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="min-w-[200px]"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Labor Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
