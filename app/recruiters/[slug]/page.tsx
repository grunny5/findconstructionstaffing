// app/recruiters/[slug]/page.tsx

import { notFound } from 'next/navigation';
import { mockAgencies } from '@/lib/mock-data';

const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export async function generateStaticParams() {
  return mockAgencies.map((agency) => ({
    slug: createSlug(agency.name),
  }));
}

interface PageProps {
  params: {
    slug: string;
  };
}

export default function AgencyProfilePage({ params }: PageProps) {
  const agency = mockAgencies.find(
    (agency) => createSlug(agency.name) === params.slug
  );

  if (!agency) {
    notFound();
  }

  return (
    <div>
      <h1>Agency Detail Page (Testing)</h1>
      <p>Slug: {params.slug}</p>
      <p>Agency Name: {agency?.name}</p>
    </div>
  );
}