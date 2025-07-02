import Link from 'next/link';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="modern-footer-bg text-white py-20 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-white to-slate-300 rounded-2xl flex items-center justify-center">
                <Building2 className="h-5 w-5 text-slate-900" />
              </div>
              <div>
                <span className="text-xl font-bold">Construction</span>
                <div className="text-xs text-slate-400 font-medium">
                  Recruiter Directory
                </div>
              </div>
            </div>
            <p className="text-slate-300 text-lg leading-relaxed max-w-md">
              The premier directory connecting construction professionals with
              elite staffing firms across North America.
            </p>
          </div>

          {/* For Companies */}
          <div>
            <h3 className="font-semibold mb-6 text-lg">For Companies</h3>
            <ul className="space-y-3 text-slate-300">
              <li>
                <Link
                  href="/claim-listing"
                  className="hover:text-white transition-colors"
                >
                  Add Your Listing
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-white transition-colors"
                >
                  Premium Features
                </Link>
              </li>
              <li>
                <Link
                  href="/success-stories"
                  className="hover:text-white transition-colors"
                >
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-6 text-lg">Support</h3>
            <ul className="space-y-3 text-slate-300">
              <li>
                <Link
                  href="/help"
                  className="hover:text-white transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-16 pt-8 text-center text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} Construction Recruiter Directory. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
