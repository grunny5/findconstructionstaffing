import { createClient } from '@/lib/supabase/server';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { notFound } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: { slug: string };
}

/**
 * Render the agency dashboard layout including a populated sidebar and main content.
 *
 * Fetches the agency by `params.slug`; if no agency is found, calls `notFound()` to render a 404.
 *
 * @param params - Route parameters; must contain `slug`, the agency's slug.
 * @returns The React element for the agency dashboard layout with a sidebar showing the agency name and the provided `children` rendered in the main content area.
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