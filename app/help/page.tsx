import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  Building2,
  FileText,
  HelpCircle,
  BookOpen,
} from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Hero
        title="Help Center"
        subtitle="Find answers and learn how to make the most of FindConstructionStaffing"
      />
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Quick Links */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>Finding Agencies</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Learn how to search and filter construction staffing
                    agencies by trade, location, and specialty.
                  </p>
                  <a
                    href="/"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Start searching →
                  </a>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <Building2 className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>Request Labor</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Submit your staffing needs and get connected with qualified
                    agencies that match your requirements.
                  </p>
                  <a
                    href="/request-labor"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Request labor →
                  </a>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>List Your Agency</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Construction staffing agency? Learn how to claim your
                    listing and reach more clients.
                  </p>
                  <a
                    href="/claim-listing"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Claim listing →
                  </a>
                </CardContent>
              </Card>
            </div>

            {/* FAQs */}
            <div className="bg-white rounded-xl p-8 shadow-sm mb-16">
              <div className="flex items-center gap-3 mb-6">
                <HelpCircle className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    For Construction Companies
                  </h3>
                  <div className="space-y-4 ml-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        How do I search for agencies by trade?
                      </p>
                      <p className="text-gray-600 mt-1">
                        Use the filters on the homepage to select specific
                        trades like electricians, plumbers, or carpenters. You
                        can select multiple trades at once.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        What information do I need to request labor?
                      </p>
                      <p className="text-gray-600 mt-1">
                        You&apos;ll need your company details, project location,
                        required trades, number of workers, and project
                        timeline. This helps us match you with the right
                        agencies.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Are verified agencies more reliable?
                      </p>
                      <p className="text-gray-600 mt-1">
                        Verified agencies have completed our vetting process,
                        including license verification and reference checks.
                        While all listed agencies are legitimate, verified
                        status provides additional assurance.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    For Staffing Agencies
                  </h3>
                  <div className="space-y-4 ml-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        How do I get listed on the platform?
                      </p>
                      <p className="text-gray-600 mt-1">
                        Complete the{' '}
                        <a
                          href="/claim-listing"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          claim listing form
                        </a>{' '}
                        with your agency information. We&apos;ll review and
                        publish your listing within 24-48 hours.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        What&apos;s the difference between free and premium
                        listings?
                      </p>
                      <p className="text-gray-600 mt-1">
                        Free listings include basic information. Premium
                        listings get enhanced visibility, featured placement,
                        and access to labor request leads. Visit our{' '}
                        <a
                          href="/pricing"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          pricing page
                        </a>{' '}
                        for details.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        How do I become verified?
                      </p>
                      <p className="text-gray-600 mt-1">
                        After claiming your listing, provide your business
                        license, insurance certificates, and professional
                        references. Our team will verify the information and add
                        the verified badge to your profile.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-gray-600" />
                  Additional Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Understanding Trade Specialties
                    </h4>
                    <p className="text-gray-600">
                      Learn about the 48+ construction trades we cover, from
                      electricians and plumbers to specialized roles like crane
                      operators and scaffolders.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Regional Coverage
                    </h4>
                    <p className="text-gray-600">
                      We connect you with agencies across North America.
                      Agencies specify their service areas to help you find
                      local staffing solutions.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Contact Support
                    </h4>
                    <p className="text-gray-600">
                      Still have questions? Visit our{' '}
                      <a
                        href="/contact"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        contact page
                      </a>{' '}
                      or email{' '}
                      <a
                        href="mailto:info@findconstructionstaffing.com"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        info@findconstructionstaffing.com
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
