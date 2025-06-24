import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Construction Staffing Agency Profiles | Construction Recruiter Directory',
  description: 'Detailed profiles of construction staffing agencies specializing in trades, industrial work, and specialized labor.',
};

export default function RecruitersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}