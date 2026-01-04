'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  agencySlug: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ session: any; user: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
  isAgencyOwner: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Create the Supabase client once using useMemo
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [agencySlug, setAgencySlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setAgencySlug(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);

      // If user is agency owner, fetch their claimed agency slug
      if (data?.role === 'agency_owner') {
        const { data: agency, error: agencyError } = await supabase
          .from('agencies')
          .select('slug')
          .eq('claimed_by', userId)
          .single();

        if (!agencyError && agency) {
          setAgencySlug(agency.slug);
        } else {
          setAgencySlug(null);
        }
      } else {
        setAgencySlug(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setAgencySlug(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      // Check if error is due to unverified email
      if (error.message.toLowerCase().includes('email not confirmed')) {
        const verificationError = new Error(
          'Please verify your email address before signing in.'
        );
        (verificationError as any).isEmailNotVerified = true;
        throw verificationError;
      }
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;

    // Return session data so caller can determine if email confirmation is needed
    // If session exists, user is auto-logged in (confirmations disabled)
    // If no session, user needs to verify email (confirmations enabled)
    return {
      session: data.session,
      user: data.user,
    };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchProfile depends on supabase which is stable

  const value = {
    user,
    profile,
    agencySlug,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    isAdmin: profile?.role === 'admin',
    isAgencyOwner: profile?.role === 'agency_owner',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
