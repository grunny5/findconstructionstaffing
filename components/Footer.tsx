import Link from 'next/link';
import { Building2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-industrial-bg-dark border-t-[3px] border-industrial-orange text-white py-20 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-industrial-orange rounded-industrial-sharp flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-display text-2xl uppercase tracking-wide text-white">
                  Find Construction
                </span>
                <div className="font-body text-xs uppercase tracking-widest text-industrial-graphite-300">
                  Staffing
                </div>
              </div>
            </div>
            <p className="font-body text-industrial-graphite-300 text-base leading-relaxed max-w-md">
              The premier directory connecting construction professionals with
              elite staffing firms across North America.
            </p>
            {/* Barcode decoration */}
            <div className="mt-6">
              <span className="font-barcode text-2xl text-industrial-graphite-400">
                *FCS2025*
              </span>
            </div>
          </div>

          {/* For Companies */}
          <div>
            <h3 className="font-display text-lg uppercase tracking-wide mb-6">
              For Companies
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/claim-listing"
                  className="font-body text-industrial-graphite-300 hover:text-industrial-orange transition-colors duration-200"
                >
                  Add Your Listing
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="font-body text-industrial-graphite-300 hover:text-industrial-orange transition-colors duration-200"
                >
                  Premium Features
                </Link>
              </li>
              <li>
                <Link
                  href="/success-stories"
                  className="font-body text-industrial-graphite-300 hover:text-industrial-orange transition-colors duration-200"
                >
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-display text-lg uppercase tracking-wide mb-6">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/help"
                  className="font-body text-industrial-graphite-300 hover:text-industrial-orange transition-colors duration-200"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="font-body text-industrial-graphite-300 hover:text-industrial-orange transition-colors duration-200"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="font-body text-industrial-graphite-300 hover:text-industrial-orange transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t-2 border-industrial-graphite-500 mt-16 pt-8 text-center">
          <p className="font-body text-sm text-industrial-graphite-400">
            &copy; {new Date().getFullYear()} Find Construction Staffing. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
