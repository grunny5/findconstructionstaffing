import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MessageSquare, Phone, MapPin, Clock } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Hero
        title="Contact Us"
        subtitle="We're here to help connect you with the right staffing solutions"
      />
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Contact Methods Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>Email Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-3">
                    Get in touch via email for general inquiries
                  </p>
                  <a
                    href="mailto:info@findconstructionstaffing.com"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    info@findconstructionstaffing.com
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <Phone className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>Call Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-3">
                    Speak with our team directly
                  </p>
                  <p className="text-gray-900 font-medium">Coming soon</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Mon-Fri, 8am-6pm EST
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Live Chat</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-3">
                    Quick answers to your questions
                  </p>
                  <p className="text-gray-900 font-medium">Coming soon</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Available during business hours
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-xl p-8 shadow-sm mb-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    How do I list my staffing agency?
                  </h3>
                  <p className="text-gray-600">
                    Visit our{' '}
                    <a
                      href="/claim-listing"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Claim Listing
                    </a>{' '}
                    page to get started. Fill out the form with your agency
                    details and we&apos;ll verify and publish your listing
                    within 24-48 hours.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Is FindConstructionStaffing free to use?
                  </h3>
                  <p className="text-gray-600">
                    Yes! Searching for construction staffing agencies is
                    completely free for contractors and construction companies.
                    Agency listings have both free and premium options
                    available.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    How can I request labor for my project?
                  </h3>
                  <p className="text-gray-600">
                    Use our{' '}
                    <a
                      href="/request-labor"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Request Labor
                    </a>{' '}
                    form to submit your staffing needs. We&apos;ll connect you
                    with relevant agencies that match your trade and location
                    requirements.
                  </p>
                </div>
              </div>
            </div>

            {/* Office Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-600" />
                  Office Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Business Hours</p>
                    <p className="text-gray-600">
                      Monday - Friday: 8:00 AM - 6:00 PM EST
                    </p>
                    <p className="text-gray-600">Saturday - Sunday: Closed</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    We typically respond to all inquiries within 1 business day.
                    For urgent matters, please email us directly at{' '}
                    <a
                      href="mailto:info@findconstructionstaffing.com"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      info@findconstructionstaffing.com
                    </a>
                  </p>
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
