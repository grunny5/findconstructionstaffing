'use client';

import { createClient } from '@/lib/supabase/client';
import { redirect, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  FileCheck,
  Plug,
  ArrowLeft,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface Profile {
  role: string;
  email: string | null;
  full_name: string | null;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!user || authError) {
        redirect('/login');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, email, full_name')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData || profileData.role !== 'admin') {
        redirect('/');
        return;
      }

      setProfile(profileData);
      setLoading(false);
    }

    checkAuth();
  }, []);

  const navItems = [
    {
      href: '/admin',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/admin/agencies',
      label: 'Agencies',
      icon: Building2,
    },
    {
      href: '/admin/users',
      label: 'Users',
      icon: Users,
    },
    {
      href: '/admin/compliance',
      label: 'Compliance',
      icon: ShieldCheck,
    },
    {
      href: '/admin/claims',
      label: 'Claims',
      icon: FileCheck,
    },
    {
      href: '/admin/integrations',
      label: 'Integrations',
      icon: Plug,
    },
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-industrial-bg-primary flex items-center justify-center">
        <div className="font-body text-industrial-graphite-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-industrial-bg-primary">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-industrial-bg-card border-r-2 border-industrial-graphite-200 min-h-screen fixed relative">
          <div className="p-6 border-b-2 border-industrial-graphite-200">
            <h2 className="font-display text-2xl uppercase tracking-wide text-industrial-graphite-600">
              Admin Panel
            </h2>
            <p className="font-body text-sm text-industrial-graphite-500 mt-1">
              {profile?.full_name || profile?.email}
            </p>
          </div>
          <nav className="p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 font-body text-sm font-semibold uppercase tracking-wide rounded-industrial-sharp transition-all duration-200 ${
                        isActive
                          ? 'bg-industrial-graphite-100 text-industrial-graphite-600 border-l-4 border-l-industrial-orange -ml-[4px] pl-[calc(1rem+4px)]'
                          : 'text-industrial-graphite-500 hover:bg-industrial-graphite-100 hover:text-industrial-graphite-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="absolute bottom-0 w-64 p-4 border-t-2 border-industrial-graphite-200 bg-industrial-bg-card">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 font-body text-sm text-industrial-graphite-500 hover:text-industrial-orange transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Site
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64">{children}</main>
      </div>
    </div>
  );
}
