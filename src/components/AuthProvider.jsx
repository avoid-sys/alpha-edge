import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    console.log('🚀 AuthProvider initializing...');

    // Check what's in localStorage
    if (typeof window !== 'undefined') {
      const authKeys = Object.keys(localStorage).filter(key => key.includes('supabase'));
      console.log('🔍 Supabase localStorage keys:', authKeys);
      authKeys.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`📦 ${key}:`, value ? `${value.substring(0, 50)}...` : 'empty');
      });
    }

    // Check active sessions and loads the localStorage information
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('🔐 Initial session check:', session ? `authenticated as ${session.user.email}` : 'not authenticated');
      if (error) {
        console.error('❌ Session error:', error);
      }
      if (session) {
        console.log('✅ Session details:', {
          user_id: session.user.id,
          email: session.user.email,
          expires_at: new Date(session.expires_at * 1000).toLocaleString(),
          provider: session.user.app_metadata?.provider
        });
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(error => {
      console.error('❌ Failed to get session:', error);
      setLoading(false);
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session ? `session for ${session.user.email}` : 'no session');

      // Handle token refresh
      if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed, session updated');
      }

      // Handle sign out
      if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
