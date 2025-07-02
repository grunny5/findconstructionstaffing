import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <section className="construction-hero py-16 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Premium Features
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Coming soon: Enhanced listing features for agencies
            </p>
          </div>
        </div>
      </section>
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-gray-600">
              This page is currently under development. Check back soon for our
              premium pricing options.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
