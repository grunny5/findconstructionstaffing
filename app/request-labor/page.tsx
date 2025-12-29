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
import { MapPin, Users, Briefcase, Building2 } from 'lucide-react';
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
      <div className="min-h-screen bg-industrial-bg-primary">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-industrial-orange-100 w-16 h-16 rounded-industrial-sharp flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-8 w-8 text-industrial-orange" />
            </div>
            <h1 className="font-display text-3xl lg:text-4xl text-industrial-graphite-600 uppercase tracking-wide mb-4">
              Request Submitted Successfully!
            </h1>
            <p className="font-body text-lg text-industrial-graphite-500 mb-8">
              Your labor request has been sent to qualified staffing agencies.
              You should expect to receive responses within 24 hours.
            </p>
            <div className="bg-industrial-bg-card rounded-industrial-sharp p-6 border border-industrial-graphite-200">
              <h3 className="font-display text-xl uppercase text-industrial-graphite-600 mb-4">
                What happens next?
              </h3>
              <div className="text-left space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="bg-industrial-orange-100 w-6 h-6 rounded-industrial-sharp flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-industrial-orange">
                      1
                    </span>
                  </div>
                  <p className="font-body text-industrial-graphite-500">
                    Our system matches your requirements with the top 5
                    qualified agencies
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-industrial-orange-100 w-6 h-6 rounded-industrial-sharp flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-industrial-orange">
                      2
                    </span>
                  </div>
                  <p className="font-body text-industrial-graphite-500">
                    Selected agencies receive your project details and contact
                    information
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-industrial-orange-100 w-6 h-6 rounded-industrial-sharp flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-industrial-orange">
                      3
                    </span>
                  </div>
                  <p className="font-body text-industrial-graphite-500">
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
    <div className="min-h-screen bg-industrial-bg-primary">
      <Header />

      {/* Hero Section */}
      <section className="bg-industrial-graphite-600 py-16 border-b-4 border-industrial-orange">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1
              className="font-display text-white uppercase tracking-wide mb-6"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
            >
              Request Skilled Labor
            </h1>
            <p className="font-body text-xl md:text-2xl mb-8 text-industrial-graphite-200">
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
            <div className="mb-8 bg-industrial-graphite-100 border border-industrial-graphite-200 rounded-industrial-sharp p-4">
              <div className="flex items-start space-x-3">
                <Building2 className="h-5 w-5 text-industrial-orange flex-shrink-0 mt-0.5" />
                <p className="font-body text-sm text-industrial-graphite-600">
                  <span className="font-semibold">How it works:</span> Fill out
                  this form and we&apos;ll automatically match you with the top
                  5 staffing agencies that specialize in your required trade and
                  location. Agencies typically respond within 24 hours.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Project Details */}
              <Card className="bg-industrial-bg-card rounded-industrial-sharp border-industrial-graphite-200">
                <CardHeader className="border-b border-industrial-graphite-200">
                  <CardTitle className="flex items-center space-x-2 font-display text-xl uppercase text-industrial-graphite-600">
                    <Briefcase className="h-5 w-5 text-industrial-orange" />
                    <span>Project Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="projectName"
                        className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                      >
                        Project Name{' '}
                        <span className="text-industrial-orange">*</span>
                      </Label>
                      <Input
                        id="projectName"
                        {...register('projectName')}
                        placeholder="e.g., Refinery Turnaround 2024"
                      />
                      {errors.projectName && (
                        <p className="font-body text-sm text-industrial-orange">
                          {errors.projectName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="tradeNeeded"
                        className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                      >
                        Trade Specialty Needed{' '}
                        <span className="text-industrial-orange">*</span>
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
                        <p className="font-body text-sm text-industrial-orange">
                          {errors.tradeNeeded.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="headcount"
                        className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                      >
                        Number of Workers Needed{' '}
                        <span className="text-industrial-orange">*</span>
                      </Label>
                      <Input
                        id="headcount"
                        type="number"
                        min="1"
                        {...register('headcount')}
                        placeholder="e.g., 15"
                      />
                      {errors.headcount && (
                        <p className="font-body text-sm text-industrial-orange">
                          {errors.headcount.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="duration"
                        className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                      >
                        Project Duration{' '}
                        <span className="text-industrial-orange">*</span>
                      </Label>
                      <Input
                        id="duration"
                        {...register('duration')}
                        placeholder="e.g., 6 weeks, 3 months"
                      />
                      {errors.duration && (
                        <p className="font-body text-sm text-industrial-orange">
                          {errors.duration.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location & Timing */}
              <Card className="bg-industrial-bg-card rounded-industrial-sharp border-industrial-graphite-200">
                <CardHeader className="border-b border-industrial-graphite-200">
                  <CardTitle className="flex items-center space-x-2 font-display text-xl uppercase text-industrial-graphite-600">
                    <MapPin className="h-5 w-5 text-industrial-orange" />
                    <span>Location & Timing</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="location"
                        className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                      >
                        City / Project Location{' '}
                        <span className="text-industrial-orange">*</span>
                      </Label>
                      <Input
                        id="location"
                        {...register('location')}
                        placeholder="e.g., Houston, TX"
                      />
                      {errors.location && (
                        <p className="font-body text-sm text-industrial-orange">
                          {errors.location.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="state"
                        className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                      >
                        State <span className="text-industrial-orange">*</span>
                      </Label>
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
                        <p className="font-body text-sm text-industrial-orange">
                          {errors.state.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="startDate"
                        className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                      >
                        Start Date{' '}
                        <span className="text-industrial-orange">*</span>
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        {...register('startDate')}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {errors.startDate && (
                        <p className="font-body text-sm text-industrial-orange">
                          {errors.startDate.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="bg-industrial-bg-card rounded-industrial-sharp border-industrial-graphite-200">
                <CardHeader className="border-b border-industrial-graphite-200">
                  <CardTitle className="flex items-center space-x-2 font-display text-xl uppercase text-industrial-graphite-600">
                    <Users className="h-5 w-5 text-industrial-orange" />
                    <span>Contact Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="contactName"
                        className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                      >
                        Contact Name{' '}
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
                        htmlFor="contactEmail"
                        className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                      >
                        Email Address{' '}
                        <span className="text-industrial-orange">*</span>
                      </Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        {...register('contactEmail')}
                        placeholder="your.email@company.com"
                      />
                      {errors.contactEmail && (
                        <p className="font-body text-sm text-industrial-orange">
                          {errors.contactEmail.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="contactPhone"
                        className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                      >
                        Phone Number{' '}
                        <span className="text-industrial-orange">*</span>
                      </Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        {...register('contactPhone')}
                        placeholder="(555) 123-4567"
                      />
                      {errors.contactPhone && (
                        <p className="font-body text-sm text-industrial-orange">
                          {errors.contactPhone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="additionalDetails"
                      className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                    >
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
