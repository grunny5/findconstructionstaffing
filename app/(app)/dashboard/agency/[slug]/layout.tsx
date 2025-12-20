import { createClient } from '@/lib/supabase/server';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { notFound } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: { slug: string };
}

/**
 * Renders the agency dashboard layout: loads the agency by slug and displays a sidebar plus the main content area.
 *
 * @param children - Content to render inside the dashboard's main area.
 * @param params - Route parameters.
 * @param params.slug - The agency slug used to load the agency record for the sidebar.
 * @returns The dashboard layout element containing the agency sidebar and the provided children.
 */
export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const supabase = createClient();

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