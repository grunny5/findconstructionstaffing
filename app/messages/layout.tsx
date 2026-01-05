/**
 * Messages Layout
 *
 * Simple wrapper layout for messages routes.
 * Authentication is handled server-side in page.tsx using Supabase cookies.
 */

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
