import { createClient } from '@/lib/supabase/server';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { notFound } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: { slug: string };
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const supabase = await createClient();

  // Fetch agency data to get the name for the sidebar
  const { data: agency, error } = await supabase
    .from('agencies')
    .select('id, name, slug')
    .eq('slug', params.slug)
    .single();

  if (error || !agency) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar agencySlug={agency.slug} agencyName={agency.name} />
      <main className="lg:pl-64">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
