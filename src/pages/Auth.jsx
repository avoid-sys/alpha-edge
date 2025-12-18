import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { NeumorphicCard, NeumorphicButton } from '../components/NeumorphicUI';
import { Mail, Lock, UserPlus, LogIn, AlertCircle } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let res;
      if (isSignUp) {
        res = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: email.split('@')[0],
              full_name: email.split('@')[0]
            }
          }
        });

        // Profile is created automatically via database trigger
      } else {
        res = await supabase.auth.signInWithPassword({ email, password });
      }

      if (res.error) {
        setError(res.error.message);
      } else {
        // Success: Supabase stores session in localStorage automatically
        navigate(createPageUrl('dashboard'));
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="text-center mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-3">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="text-gray-500 text-sm sm:text-base">
          {isSignUp ? 'Join Alpha Edge trading community' : 'Sign in to your account'}
        </p>
      </div>

      <NeumorphicCard className="w-full max-w-md p-4 sm:p-8">
        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600 ml-1 flex items-center gap-2">
                <Mail size={16} />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#e0e5ec] rounded-xl px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] text-gray-700 placeholder-gray-400"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600 ml-1 flex items-center gap-2">
                <Lock size={16} />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#e0e5ec] rounded-xl px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] text-gray-700 placeholder-gray-400"
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <NeumorphicButton
              type="submit"
              variant="action"
              className="w-full flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                <>
                  {isSignUp ? <UserPlus size={20} className="mr-2" /> : <LogIn size={20} className="mr-2" />}
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </>
              )}
            </NeumorphicButton>

            <div className="text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>
        </form>
      </NeumorphicCard>

      <p className="mt-8 text-xs text-gray-400 text-center max-w-sm">
        By {isSignUp ? 'creating an account' : 'signing in'}, you agree to our Terms of Service.
        We use Supabase for secure authentication and data storage.
      </p>
    </div>
  );
}
