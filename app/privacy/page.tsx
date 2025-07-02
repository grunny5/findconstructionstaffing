import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <section className="construction-hero py-16 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              How we protect your information
            </p>
          </div>
        </div>
      </section>
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-semibold mb-4">Privacy Policy</h2>
              <p className="text-gray-600 mb-4">
                Last updated: {new Date().toLocaleDateString()}
              </p>
              <p className="text-gray-600 mb-4">
                FindConstructionStaffing ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website.
              </p>
              <h3 className="text-xl font-semibold mb-3 mt-6">Information We Collect</h3>
              <p className="text-gray-600 mb-4">
                We may collect information about you in a variety of ways. The information we may collect on the Site includes personal data you provide to us, such as your name, email address, and company information when you claim a listing or submit a contact form.
              </p>
              <h3 className="text-xl font-semibold mb-3 mt-6">Use of Your Information</h3>
              <p className="text-gray-600 mb-4">
                We use the information we collect to operate and maintain our website, improve user experience, and communicate with you about your listing or inquiries.
              </p>
              <h3 className="text-xl font-semibold mb-3 mt-6">Contact Us</h3>
              <p className="text-gray-600">
                If you have questions about this Privacy Policy, please contact us at privacy@findconstructionstaffing.com
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}