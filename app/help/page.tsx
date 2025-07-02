import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <section className="construction-hero py-16 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Help Center
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Get answers to your questions
            </p>
          </div>
        </div>
      </section>
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-gray-600">
              Our help documentation is being prepared. For immediate assistance, please contact us directly.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}