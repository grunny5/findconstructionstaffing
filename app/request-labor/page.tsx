'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  MapPin,
  Users,
  Briefcase,
  Building2,
  Plus,
  Trash2,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  laborRequestFormDataSchema,
  type LaborRequestFormData,
} from '@/lib/validations/labor-request';
import type { Trade, Region } from '@/types/supabase';

export default function RequestLaborPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
    watch,
  } = useForm<LaborRequestFormData>({
    resolver: zodResolver(laborRequestFormDataSchema),
    defaultValues: {
      projectName: '',
      companyName: '',
      contactEmail: '',
      contactPhone: '',
      additionalDetails: '',
      crafts: [
        {
          tradeId: '',
          experienceLevel: 'Journeyman' as const,
          regionId: '',
          workerCount: 1,
          startDate: '',
          durationDays: 30,
          hoursPerWeek: 40,
          notes: '',
          payRateMin: undefined,
          payRateMax: undefined,
          perDiemRate: undefined,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'crafts',
  });

  // Fetch trades and regions on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tradesRes, regionsRes] = await Promise.all([
          fetch('/api/trades'),
          fetch('/api/regions'),
        ]);

        if (!tradesRes.ok || !regionsRes.ok) {
          throw new Error('Failed to fetch form data');
        }

        const tradesData = await tradesRes.json();
        const regionsData = await regionsRes.json();

        setTrades(tradesData.trades || []);
        setRegions(regionsData.regions || []);
      } catch (error) {
        console.error('Error fetching form data:', error);
        toast.error('Failed to load form data. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const onSubmit = async (data: LaborRequestFormData) => {
    setIsSubmitting(true);
    try {
      // TODO: Replace with actual API call in Phase 3
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

  const addCraft = () => {
    append({
      tradeId: '',
      experienceLevel: 'Journeyman' as const,
      regionId: '',
      workerCount: 1,
      startDate: '',
      durationDays: 30,
      hoursPerWeek: 40,
      notes: '',
      payRateMin: undefined,
      payRateMax: undefined,
      perDiemRate: undefined,
    });
  };

  const removeCraft = (index: number) => {
    if (fields.length > 1) {
      remove(index);
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
                    qualified agencies for each craft
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-industrial-bg-primary">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <p className="font-body text-lg text-industrial-graphite-500">
              Loading form...
            </p>
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
                  5 staffing agencies for each trade specialty and location.
                  You can request multiple crafts in a single submission.
                  Agencies typically respond within 24 hours.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Project & Company Details */}
              <Card className="bg-industrial-bg-card rounded-industrial-sharp border-industrial-graphite-200">
                <CardHeader className="border-b border-industrial-graphite-200">
                  <CardTitle className="flex items-center space-x-2 font-display text-xl uppercase text-industrial-graphite-600">
                    <Briefcase className="h-5 w-5 text-industrial-orange" />
                    <span>Project & Company Details</span>
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
                        htmlFor="companyName"
                        className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                      >
                        Company Name{' '}
                        <span className="text-industrial-orange">*</span>
                      </Label>
                      <Input
                        id="companyName"
                        {...register('companyName')}
                        placeholder="e.g., Acme Construction Inc."
                      />
                      {errors.companyName && (
                        <p className="font-body text-sm text-industrial-orange">
                          {errors.companyName.message}
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
                    {errors.additionalDetails && (
                      <p className="font-body text-sm text-industrial-orange">
                        {errors.additionalDetails.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Craft Requirements */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl uppercase text-industrial-graphite-600 flex items-center space-x-2">
                    <Wrench className="h-6 w-6 text-industrial-orange" />
                    <span>Craft Requirements</span>
                  </h2>
                  <Button
                    type="button"
                    onClick={addCraft}
                    variant="outline"
                    size="sm"
                    disabled={fields.length >= 10}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Craft</span>
                  </Button>
                </div>

                {errors.crafts?.message && (
                  <p className="font-body text-sm text-industrial-orange">
                    {errors.crafts.message}
                  </p>
                )}

                {fields.map((field, index) => (
                  <Card
                    key={field.id}
                    className="bg-industrial-bg-card rounded-industrial-sharp border-industrial-graphite-200"
                  >
                    <CardHeader className="border-b border-industrial-graphite-200">
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-display text-lg uppercase text-industrial-graphite-600">
                          Craft #{index + 1}
                        </CardTitle>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeCraft(index)}
                            variant="ghost"
                            size="sm"
                            className="text-industrial-orange hover:text-industrial-orange-dark"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Trade Selection */}
                        <div className="space-y-2">
                          <Label
                            htmlFor={`crafts.${index}.tradeId`}
                            className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                          >
                            Trade Specialty{' '}
                            <span className="text-industrial-orange">*</span>
                          </Label>
                          <Select
                            onValueChange={(value) =>
                              setValue(`crafts.${index}.tradeId`, value)
                            }
                            defaultValue={watch(`crafts.${index}.tradeId`)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select trade specialty" />
                            </SelectTrigger>
                            <SelectContent>
                              {trades.map((trade) => (
                                <SelectItem key={trade.id} value={trade.id}>
                                  {trade.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.crafts?.[index]?.tradeId && (
                            <p className="font-body text-sm text-industrial-orange">
                              {errors.crafts[index]?.tradeId?.message}
                            </p>
                          )}
                        </div>

                        {/* Experience Level */}
                        <div className="space-y-2">
                          <Label
                            htmlFor={`crafts.${index}.experienceLevel`}
                            className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                          >
                            Experience Level{' '}
                            <span className="text-industrial-orange">*</span>
                          </Label>
                          <Select
                            onValueChange={(value) =>
                              setValue(`crafts.${index}.experienceLevel`, value as any)
                            }
                            defaultValue={watch(`crafts.${index}.experienceLevel`)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select experience level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Helper">Helper</SelectItem>
                              <SelectItem value="Apprentice">Apprentice</SelectItem>
                              <SelectItem value="Journeyman">Journeyman</SelectItem>
                              <SelectItem value="Foreman">Foreman</SelectItem>
                              <SelectItem value="General Foreman">General Foreman</SelectItem>
                              <SelectItem value="Superintendent">Superintendent</SelectItem>
                              <SelectItem value="Project Manager">Project Manager</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.crafts?.[index]?.experienceLevel && (
                            <p className="font-body text-sm text-industrial-orange">
                              {errors.crafts[index]?.experienceLevel?.message}
                            </p>
                          )}
                        </div>

                        {/* Region Selection */}
                        <div className="space-y-2">
                          <Label
                            htmlFor={`crafts.${index}.regionId`}
                            className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                          >
                            Location / State{' '}
                            <span className="text-industrial-orange">*</span>
                          </Label>
                          <Select
                            onValueChange={(value) =>
                              setValue(`crafts.${index}.regionId`, value)
                            }
                            defaultValue={watch(`crafts.${index}.regionId`)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              {regions.map((region) => (
                                <SelectItem key={region.id} value={region.id}>
                                  {region.name} ({region.state_code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.crafts?.[index]?.regionId && (
                            <p className="font-body text-sm text-industrial-orange">
                              {errors.crafts[index]?.regionId?.message}
                            </p>
                          )}
                        </div>

                        {/* Worker Count */}
                        <div className="space-y-2">
                          <Label
                            htmlFor={`crafts.${index}.workerCount`}
                            className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                          >
                            Number of Workers{' '}
                            <span className="text-industrial-orange">*</span>
                          </Label>
                          <Input
                            id={`crafts.${index}.workerCount`}
                            type="number"
                            min="1"
                            max="500"
                            {...register(`crafts.${index}.workerCount`, {
                              valueAsNumber: true,
                            })}
                            placeholder="e.g., 15"
                          />
                          {errors.crafts?.[index]?.workerCount && (
                            <p className="font-body text-sm text-industrial-orange">
                              {errors.crafts[index]?.workerCount?.message}
                            </p>
                          )}
                        </div>

                        {/* Start Date */}
                        <div className="space-y-2">
                          <Label
                            htmlFor={`crafts.${index}.startDate`}
                            className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                          >
                            Start Date{' '}
                            <span className="text-industrial-orange">*</span>
                          </Label>
                          <Input
                            id={`crafts.${index}.startDate`}
                            type="date"
                            {...register(`crafts.${index}.startDate`)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                          {errors.crafts?.[index]?.startDate && (
                            <p className="font-body text-sm text-industrial-orange">
                              {errors.crafts[index]?.startDate?.message}
                            </p>
                          )}
                        </div>

                        {/* Duration */}
                        <div className="space-y-2">
                          <Label
                            htmlFor={`crafts.${index}.durationDays`}
                            className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                          >
                            Duration (Days){' '}
                            <span className="text-industrial-orange">*</span>
                          </Label>
                          <Input
                            id={`crafts.${index}.durationDays`}
                            type="number"
                            min="1"
                            max="365"
                            {...register(`crafts.${index}.durationDays`, {
                              valueAsNumber: true,
                            })}
                            placeholder="e.g., 30"
                          />
                          {errors.crafts?.[index]?.durationDays && (
                            <p className="font-body text-sm text-industrial-orange">
                              {errors.crafts[index]?.durationDays?.message}
                            </p>
                          )}
                        </div>

                        {/* Hours Per Week */}
                        <div className="space-y-2">
                          <Label
                            htmlFor={`crafts.${index}.hoursPerWeek`}
                            className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                          >
                            Hours Per Week{' '}
                            <span className="text-industrial-orange">*</span>
                          </Label>
                          <Input
                            id={`crafts.${index}.hoursPerWeek`}
                            type="number"
                            min="1"
                            max="168"
                            {...register(`crafts.${index}.hoursPerWeek`, {
                              valueAsNumber: true,
                            })}
                            placeholder="e.g., 40"
                          />
                          {errors.crafts?.[index]?.hoursPerWeek && (
                            <p className="font-body text-sm text-industrial-orange">
                              {errors.crafts[index]?.hoursPerWeek?.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Pay Rates Section */}
                      <div className="border-t border-industrial-graphite-200 pt-6 mt-6">
                        <h4 className="font-body text-sm font-semibold text-industrial-graphite-600 mb-4 uppercase tracking-wide">
                          Compensation (Optional)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Pay Rate Min */}
                          <div className="space-y-2">
                            <Label
                              htmlFor={`crafts.${index}.payRateMin`}
                              className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                            >
                              Min Hourly Rate ($)
                            </Label>
                            <Input
                              id={`crafts.${index}.payRateMin`}
                              type="number"
                              min="0"
                              step="0.01"
                              {...register(`crafts.${index}.payRateMin`, {
                                valueAsNumber: true,
                                setValueAs: (v) =>
                                  v === '' ? undefined : parseFloat(v),
                              })}
                              placeholder="e.g., 25.00"
                            />
                            {errors.crafts?.[index]?.payRateMin && (
                              <p className="font-body text-sm text-industrial-orange">
                                {errors.crafts[index]?.payRateMin?.message}
                              </p>
                            )}
                          </div>

                          {/* Pay Rate Max */}
                          <div className="space-y-2">
                            <Label
                              htmlFor={`crafts.${index}.payRateMax`}
                              className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                            >
                              Max Hourly Rate ($)
                            </Label>
                            <Input
                              id={`crafts.${index}.payRateMax`}
                              type="number"
                              min="0"
                              step="0.01"
                              {...register(`crafts.${index}.payRateMax`, {
                                valueAsNumber: true,
                                setValueAs: (v) =>
                                  v === '' ? undefined : parseFloat(v),
                              })}
                              placeholder="e.g., 35.00"
                            />
                            {errors.crafts?.[index]?.payRateMax && (
                              <p className="font-body text-sm text-industrial-orange">
                                {errors.crafts[index]?.payRateMax?.message}
                              </p>
                            )}
                          </div>

                          {/* Per Diem Rate */}
                          <div className="space-y-2">
                            <Label
                              htmlFor={`crafts.${index}.perDiemRate`}
                              className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                            >
                              Per Diem Rate ($)
                            </Label>
                            <Input
                              id={`crafts.${index}.perDiemRate`}
                              type="number"
                              min="0"
                              step="0.01"
                              {...register(`crafts.${index}.perDiemRate`, {
                                valueAsNumber: true,
                                setValueAs: (v) =>
                                  v === '' ? undefined : parseFloat(v),
                              })}
                              placeholder="e.g., 50.00"
                            />
                            {errors.crafts?.[index]?.perDiemRate && (
                              <p className="font-body text-sm text-industrial-orange">
                                {errors.crafts[index]?.perDiemRate?.message}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="font-body text-xs text-industrial-graphite-400 mt-2">
                          Specify established rates if you have ongoing project rates that staffing firms need to work with. Both min and max must be provided together.
                        </p>
                      </div>

                      {/* Craft Notes */}
                      <div className="space-y-2">
                        <Label
                          htmlFor={`crafts.${index}.notes`}
                          className="font-body text-xs uppercase font-semibold text-industrial-graphite-400 tracking-wide"
                        >
                          Additional Notes for This Craft
                        </Label>
                        <Textarea
                          id={`crafts.${index}.notes`}
                          {...register(`crafts.${index}.notes`)}
                          placeholder="Specific certifications, experience level, or other requirements for this craft..."
                          rows={2}
                        />
                        {errors.crafts?.[index]?.notes && (
                          <p className="font-body text-sm text-industrial-orange">
                            {errors.crafts[index]?.notes?.message}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Contact Information */}
              <Card className="bg-industrial-bg-card rounded-industrial-sharp border-industrial-graphite-200">
                <CardHeader className="border-b border-industrial-graphite-200">
                  <CardTitle className="flex items-center space-x-2 font-display text-xl uppercase text-industrial-graphite-600">
                    <Users className="h-5 w-5 text-industrial-orange" />
                    <span>Contact Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
