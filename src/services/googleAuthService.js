// Google Authentication Service for Alpha Edge Platform
import { localDataService } from './localDataService';

class GoogleAuthService {
  constructor() {
    this.CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-dev-client-id.apps.googleusercontent.com';
    this.SCOPES = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
    this.isInitialized = false;
  }

  // Initialize Google API
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load Google API script if not loaded
      if (!window.gapi) {
        await this.loadGoogleAPIScript();
      }

      // Initialize Google API
      await new Promise((resolve, reject) => {
        window.gapi.load('auth2', {
          callback: () => {
            window.gapi.auth2.init({
              client_id: this.CLIENT_ID,
              scope: this.SCOPES
            }).then(() => {
              this.isInitialized = true;
              resolve();
            }).catch(reject);
          },
          onerror: reject
        });
      });

      console.log('Google Auth initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
      throw error;
    }
  }

  // Load Google API script dynamically
  loadGoogleAPIScript() {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Sign in with Google
  async signIn() {
    try {
      await this.initialize();

      const authInstance = window.gapi.auth2.getAuthInstance();
      const googleUser = await authInstance.signIn();

      if (googleUser) {
        const profile = googleUser.getBasicProfile();
        const userData = {
          email: profile.getEmail(),
          full_name: profile.getName(),
          google_id: profile.getId(),
          avatar_url: profile.getImageUrl(),
          auth_provider: 'google'
        };

        // Save user data
        await localDataService.setCurrentUser(userData);

        console.log('Google sign-in successful:', userData);
        return userData;
      }
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw error;
    }
  }

  // Sign out from Google
  async signOut() {
    try {
      if (window.gapi && window.gapi.auth2) {
        const authInstance = window.gapi.auth2.getAuthInstance();
        if (authInstance) {
          await authInstance.signOut();
        }
      }
    } catch (error) {
      console.error('Google sign-out error:', error);
    }
  }

  // Check if user is signed in with Google
  isSignedIn() {
    try {
      if (window.gapi && window.gapi.auth2) {
        const authInstance = window.gapi.auth2.getAuthInstance();
        return authInstance && authInstance.isSignedIn.get();
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // Get current Google user
  getCurrentUser() {
    try {
      if (this.isSignedIn()) {
        const authInstance = window.gapi.auth2.getAuthInstance();
        const googleUser = authInstance.currentUser.get();
        if (googleUser) {
          const profile = googleUser.getBasicProfile();
          return {
            email: profile.getEmail(),
            full_name: profile.getName(),
            google_id: profile.getId(),
            avatar_url: profile.getImageUrl(),
            auth_provider: 'google'
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting current Google user:', error);
      return null;
    }
  }
}

// Create singleton instance
export const googleAuthService = new GoogleAuthService();
