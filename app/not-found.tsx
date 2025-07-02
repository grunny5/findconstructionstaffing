import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileQuestion, Home, Search } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-200px)]">
        <Card className="max-w-lg w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileQuestion className="h-10 w-10 text-gray-400" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">404</h1>

            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Page Not Found
            </h2>

            <p className="text-gray-600 mb-8">
              The page you're looking for doesn't exist or has been moved. Let's
              get you back on track.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="default" size="lg" asChild>
                <Link href="/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Go to Homepage
                </Link>
              </Button>

              <Button variant="outline" size="lg" asChild>
                <Link href="/#directory" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Browse Agencies
                </Link>
              </Button>
            </div>

            <div className="mt-12 pt-8 border-t">
              <p className="text-sm text-gray-500">
                Need help?{' '}
                <Link href="/contact" className="text-blue-600 hover:underline">
                  Contact us
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
