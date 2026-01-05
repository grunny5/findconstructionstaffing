import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Users,
  FileCheck,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    redirect('/');
  }

  // Fetch dashboard stats
  const [agenciesResult, usersResult, claimsResult] = await Promise.all([
    supabase
      .from('agencies')
      .select('id, is_active, is_claimed', { count: 'exact' }),
    supabase.from('profiles').select('id, role', { count: 'exact' }),
    supabase.from('agency_claims').select('id, status', { count: 'exact' }),
  ]);

  const totalAgencies = agenciesResult.count || 0;
  const activeAgencies =
    agenciesResult.data?.filter((a) => a.is_active).length || 0;
  const claimedAgencies =
    agenciesResult.data?.filter((a) => a.is_claimed).length || 0;

  const totalUsers = usersResult.count || 0;
  const adminUsers =
    usersResult.data?.filter((u) => u.role === 'admin').length || 0;

  const totalClaims = claimsResult.count || 0;
  const pendingClaims =
    claimsResult.data?.filter((c) => c.status === 'pending').length || 0;
  const approvedClaims =
    claimsResult.data?.filter((c) => c.status === 'approved').length || 0;
  const rejectedClaims =
    claimsResult.data?.filter((c) => c.status === 'rejected').length || 0;

  const stats = [
    {
      title: 'Total Agencies',
      value: totalAgencies,
      icon: Building2,
      color: 'bg-blue-500',
      link: '/admin/agencies',
      details: [
        { label: 'Active', value: activeAgencies },
        { label: 'Claimed', value: claimedAgencies },
      ],
    },
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      color: 'bg-green-500',
      link: '/admin/users',
      details: [{ label: 'Admins', value: adminUsers }],
    },
    {
      title: 'Agency Claims',
      value: totalClaims,
      icon: FileCheck,
      color: 'bg-purple-500',
      link: '/admin/claims',
      details: [
        { label: 'Pending', value: pendingClaims },
        { label: 'Approved', value: approvedClaims },
        { label: 'Rejected', value: rejectedClaims },
      ],
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-2">
          Welcome to the admin dashboard. Manage your platform from here.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              href={stat.link}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-bold text-gray-900">
                  {stat.value}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {stat.title}
              </h3>
              <div className="space-y-1">
                {stat.details.map((detail) => (
                  <div
                    key={detail.label}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-gray-600">{detail.label}:</span>
                    <span className="font-medium text-gray-900">
                      {detail.value}
                    </span>
                  </div>
                ))}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Claims */}
      {pendingClaims > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Pending Claims Require Attention
            </h2>
            <Link
              href="/admin/claims"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Clock className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800">
              You have <strong>{pendingClaims}</strong> pending claim
              {pendingClaims !== 1 ? 's' : ''} waiting for review.
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/agencies"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <Building2 className="w-5 h-5 text-gray-600" />
            <span className="font-medium">Manage Agencies</span>
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <Users className="w-5 h-5 text-gray-600" />
            <span className="font-medium">Manage Users</span>
          </Link>
          <Link
            href="/admin/claims"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <FileCheck className="w-5 h-5 text-gray-600" />
            <span className="font-medium">Review Claims</span>
          </Link>
          <Link
            href="/admin/integrations"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <CheckCircle2 className="w-5 h-5 text-gray-600" />
            <span className="font-medium">Integrations</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
