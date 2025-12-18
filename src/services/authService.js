import { supabase, auth, db } from '@/utils/supabase';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.session = null;
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      const { session } = await auth.getSession();
      this.session = session;
      this.currentUser = session?.user || null;
      if (this.currentUser) {
        console.log('👤 User authenticated:', this.currentUser.email);
      }
    } catch (error) {
      console.error('❌ Auth init error:', error);
    }
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async signUp(email, password, fullName) {
    try {
      console.log('🔐 Starting signup for:', email);

      const emailStr = String(email).trim();
      const passwordStr = String(password);
      const fullNameStr = String(fullName || '').trim();

      const { data, error } = await auth.signUp({
        email: emailStr,
        password: passwordStr,
        options: {
          data: {
            full_name: fullNameStr,
            display_name: fullNameStr
          }
        }
      });

      if (error) {
        console.error('❌ Signup failed:', error.message);
        throw error;
      }

      if (data.user) {
        console.log('✅ Signup successful:', data.user.email);
        return { user: data.user, session: data.session, error: null };
      }

      throw new Error('Signup completed but no user data returned');
    } catch (error) {
      console.error('💥 Signup error:', error);
      return { user: null, session: null, error };
    }
  }

  async signIn(email, password) {
    try {
      console.log('🔑 Starting signin for:', email);

      const emailStr = String(email).trim();
      const passwordStr = String(password);

      const { data, error } = await auth.signIn({
        email: emailStr,
        password: passwordStr
      });

      if (error) {
        console.error('❌ Signin failed:', error.message);
        throw error;
      }

      if (data.user) {
        console.log('✅ Signin successful:', data.user.email);
        return { user: data.user, session: data.session, error: null };
      }

      throw new Error('Signin completed but no user data returned');
    } catch (error) {
      console.error('💥 Signin error:', error);
      return { user: null, session: null, error };
    }
  }

  async signOut() {
    try {
      const { error } = await auth.signOut();
      if (error) throw error;

      this.currentUser = null;
      this.session = null;

      console.log('👋 Signout successful');
      return { error: null };
    } catch (error) {
      console.error('💥 Signout error:', error);
      return { error };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();