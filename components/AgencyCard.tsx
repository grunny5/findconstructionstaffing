"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, 
  Users,
  Phone, 
  Mail, 
  DollarSign,
  Building2,
  Star,
  ArrowUpRight
} from 'lucide-react';

interface AgencyCardProps {
  agency: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    website?: string;
    phone?: string;
    email?: string;
    is_claimed: boolean;
    offers_per_diem: boolean;
    is_union: boolean;
    trades?: string[];
    regions?: string[];
    rating?: number;
    reviewCount?: number;
    projectCount?: number;
    founded_year?: number;
    employee_count?: string;
    headquarters?: string;
    verified?: boolean;
    featured?: boolean;
  };
}

// Gradient color classes for agency logos
const gradientColors = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500', 
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-red-500',
  'from-indigo-500 to-purple-500',
  'from-amber-500 to-orange-500'
];

export default function AgencyCard({ agency }: AgencyCardProps) {
  const [imageError, setImageError] = useState(false);
  
  // Get a consistent gradient color based on agency name
  const gradientIndex = agency.name.length % gradientColors.length;
  const gradientClass = gradientColors[gradientIndex];

  // Generate agency initials for logo fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // Mock contact info for display
  const displayPhone = agency.phone || "(303) 555-0123";
  const displayEmail = agency.email || "contact@" + agency.name.toLowerCase().replace(/\s+/g, '') + ".com";

  return (
    <Card className="group hover:shadow-2xl hover:shadow-slate-900/10 transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm hover:-translate-y-1">
      <CardContent className="p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Modern Logo */}
          <div className="flex-shrink-0">
            {agency.logo_url && !imageError ? (
              <div className="w-20 h-20 relative rounded-3xl overflow-hidden shadow-lg shadow-slate-900/20 group-hover:scale-105 transition-transform duration-300">
                <Image
                  src={agency.logo_url}
                  alt={`${agency.name} logo`}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className={`w-20 h-20 bg-gradient-to-br ${gradientClass} rounded-3xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-slate-900/20 group-hover:scale-105 transition-transform duration-300`}>
                {getInitials(agency.name)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1">
                {/* Header with name, verification, and rating */}
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                    <Link 
                      href={`/recruiters/${agency.slug}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {agency.name}
                    </Link>
                  </h3>
                  
                  {/* Verification Badge */}
                  {agency.verified && (
                    <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Verified
                    </div>
                  )}
                  
                  {/* Rating Badge */}
                  {agency.rating && (
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-full">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold">{agency.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {agency.description && (
                  <p className="text-slate-600 mb-6 text-lg leading-relaxed">
                    {agency.description}
                  </p>
                )}

                {/* Company Stats Grid - Simplified */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {agency.headquarters && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{agency.headquarters}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-slate-600">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{agency.employee_count || '500+'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-600">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Phone className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{displayPhone}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-600">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="font-medium truncate">{displayEmail}</span>
                  </div>
                </div>

                {/* Specialties - Clean Badge Layout */}
                {agency.trades && agency.trades.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {agency.trades.slice(0, 3).map((trade, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1 rounded-lg font-medium"
                      >
                        {trade}
                      </Badge>
                    ))}
                    {agency.trades.length > 3 && (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-medium">
                        +{agency.trades.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Modern Action Buttons */}
              <div className="flex flex-col gap-3 lg:flex-shrink-0">
                <Button
                  variant="outline"
                  className="bg-white/80 text-slate-700 border-slate-300/60 hover:bg-white backdrop-blur-sm rounded-xl w-full lg:w-40 group"
                  asChild
                >
                  <Link href={`/recruiters/${agency.slug}`}>
                    View Profile
                    <ArrowUpRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </Button>
                <Button 
                  className="bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white rounded-xl w-full lg:w-40 shadow-lg shadow-slate-900/25"
                  asChild
                >
                  <Link href={`/request-labor?agency=${agency.slug}`}>
                    Contact Now
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}