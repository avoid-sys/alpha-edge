import { supabase, auth, db } from '@/utils/supabase';
import { securityService } from './securityService';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.session = null;

    // Listen to auth state changes
    auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      this.session = session;
      this.currentUser = session?.user || null;

      if (event === 'SIGNED_IN' && session?.user) {
        // Create/update user profile when user signs in
        await this.createOrUpdateProfile(session.user);
        securityService.logSecurityEvent('user_signed_in', { userId: session.user.id });
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.session = null;
        securityService.logSecurityEvent('user_signed_out');
      }
    });

    // Initialize on startup
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      const { session } = await auth.getSession();
      this.session = session;
      this.currentUser = session?.user || null;

      if (this.currentUser) {
        console.log('User already authenticated:', this.currentUser.email);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get user profile
  async getCurrentUserProfile() {
    if (!this.currentUser) return null;

    try {
      const { data, error } = await db.users.getProfile(this.currentUser.id);
      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error fetching user profile:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error in getCurrentUserProfile:', error);
      return null;
    }
  }

  // Sign up with email and password
  async signUp(email, password, fullName) {
    try {
      securityService.logSecurityEvent('signup_attempted', { email });

      // Check if Supabase is accessible
      let isSupabaseAvailable = true;
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) {
          isSupabaseAvailable = false;
          console.warn('Supabase database not available:', error.message);
        }
      } catch (connectionError) {
        isSupabaseAvailable = false;
        console.warn('Supabase connection issue:', connectionError);
      }

      if (!isSupabaseAvailable) {
        console.log('Using local storage fallback for signup');

        // Create a local user object for demo purposes
        const demoUser = {
          id: `demo-${Date.now()}`,
          email: email,
          user_metadata: {
            full_name: fullName,
            display_name: fullName
          },
          created_at: new Date().toISOString(),
          isDemo: true // Mark as demo user
        };

        // Store in localStorage for persistence
        const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
        users.push(demoUser);
        localStorage.setItem('demo_users', JSON.stringify(users));
        localStorage.setItem('current_user', JSON.stringify(demoUser));

        return { user: demoUser, session: { user: demoUser }, error: null };
      }

      // 🔍 CRITICAL CHECK: Ensure email is string before Supabase call
      console.log('🔍 AUTH SERVICE: Before Supabase call');
      console.log('- email:', email, 'type:', typeof email);
      console.log('- password length:', password.length, 'type:', typeof password);
      console.log('- fullName:', fullName, 'type:', typeof fullName);

      // Force string conversion one more time
      const emailStr = String(email).trim();
      const passwordStr = String(password);
      const fullNameStr = String(fullName || '').trim();

      console.log('🔍 AFTER String() conversion:');
      console.log('- emailStr:', emailStr, 'type:', typeof emailStr);

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
        securityService.logSecurityEvent('signup_failed', { email, error: error.message });

        // Provide more user-friendly error messages
        let errorMessage = error.message;
        if (error.message.includes('already registered')) {
          errorMessage = 'An account with this email already exists. Please try signing in instead.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('Password')) {
          errorMessage = 'Password must be at least 6 characters long.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network connection error. Please check your internet connection.';
        }

        const customError = new Error(errorMessage);
        customError.originalError = error;
        throw customError;
      }

      if (data.user) {
        securityService.logSecurityEvent('signup_successful', {
          userId: data.user.id,
          email: data.user.email
        });
      }

      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('Sign up error:', error);

      // If it's a network error, provide a helpful message
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return {
          user: null,
          session: null,
          error: new Error('Network connection error. Please check your internet connection and try again.')
        };
      }

      return { user: null, session: null, error };
    }
  }

  // Sign in with email and password
  async signIn(email, password) {
    try {
      securityService.logSecurityEvent('signin_attempted', { email });

      // Check if Supabase is accessible
      let isSupabaseAvailable = true;
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) {
          isSupabaseAvailable = false;
          console.warn('Supabase database not available, checking local storage:', error.message);
        }
      } catch (connectionError) {
        isSupabaseAvailable = false;
        console.warn('Supabase connection issue:', connectionError);
      }

      if (!isSupabaseAvailable) {
        console.log('Using local storage fallback for signin');

        // Check local storage for demo user
        const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
        const user = users.find(u => u.email === email);

        if (user) {
          // Simulate successful signin
          localStorage.setItem('current_user', JSON.stringify(user));
          this.currentUser = user;
          this.session = { user };

          return { user, session: { user }, error: null };
        } else {
          throw new Error('Invalid email or password. Please check your credentials.');
        }
      }

      const { data, error } = await auth.signIn({
        email,
        password
      });

      if (error) {
        securityService.logSecurityEvent('signin_failed', { email, error: error.message });

        // Provide more user-friendly error messages
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network connection error. Please check your internet connection.';
        }

        const customError = new Error(errorMessage);
        customError.originalError = error;
        throw customError;
      }

      if (data.user) {
        securityService.logSecurityEvent('signin_successful', {
          userId: data.user.id,
          email: data.user.email
        });
      }

      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('Sign in error:', error);

      // If it's a network error, provide a helpful message
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return {
          user: null,
          session: null,
          error: new Error('Network connection error. Please check your internet connection and try again.')
        };
      }

      return { user: null, session: null, error };
    }
  }

  // Sign out
  async signOut() {
    try {
      const { error } = await auth.signOut();

      if (error) {
        console.error('Sign out error:', error);
        return { error };
      }

      // Clear local state
      this.currentUser = null;
      this.session = null;

      securityService.logSecurityEvent('signout_successful');
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  }

  // Create or update user profile
  async createOrUpdateProfile(user) {
    try {
      const profileData = {
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.display_name || '',
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: user.created_at,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await db.users.upsertProfile(user.id, profileData);

      if (error) {
        console.error('Error creating/updating profile:', error);
        // Don't throw error here - profile creation failure shouldn't prevent signup
        // Just log it and continue
      } else {
        console.log('Profile created/updated:', data);
      }

      return { data, error };
    } catch (error) {
      console.error('Error in createOrUpdateProfile:', error);
      // Don't throw error here - profile creation failure shouldn't prevent signup
      return { data: null, error };
    }
  }

  // Update user profile
  async updateProfile(updates) {
    if (!this.currentUser) {
      return { data: null, error: new Error('No authenticated user') };
    }

    try {
      const { data, error } = await db.users.updateProfile(this.currentUser.id, updates);
      return { data, error };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw error;
      }

      securityService.logSecurityEvent('password_reset_requested', { email });
      return { error: null };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error };
    }
  }

  // Update password
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      securityService.logSecurityEvent('password_updated');
      return { error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { error };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
