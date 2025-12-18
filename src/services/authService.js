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

      const { data, error } = await auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            display_name: fullName
          }
        }
      });

      if (error) {
        securityService.logSecurityEvent('signup_failed', { email, error: error.message });
        throw error;
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
      return { user: null, session: null, error };
    }
  }

  // Sign in with email and password
  async signIn(email, password) {
    try {
      securityService.logSecurityEvent('signin_attempted', { email });

      const { data, error } = await auth.signIn({
        email,
        password
      });

      if (error) {
        securityService.logSecurityEvent('signin_failed', { email, error: error.message });
        throw error;
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
      } else {
        console.log('Profile created/updated:', data);
      }

      return { data, error };
    } catch (error) {
      console.error('Error in createOrUpdateProfile:', error);
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
