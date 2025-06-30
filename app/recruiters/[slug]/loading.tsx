import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProfileSkeleton from '@/components/ProfileSkeleton';

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ProfileSkeleton />
      <Footer />
    </div>
  );
}