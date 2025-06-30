import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AgencyNotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-200px)]">
        <Card className="max-w-lg w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-10 w-10 text-gray-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Agency Not Found
            </h1>
            
            <p className="text-gray-600 mb-8">
              We couldn't find the staffing agency you're looking for. It may have been removed or the link might be incorrect.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="default"
                asChild
              >
                <Link href="/" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Browse All Agencies
                </Link>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Try searching for the agency by name or browse our directory to find similar staffing partners.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}