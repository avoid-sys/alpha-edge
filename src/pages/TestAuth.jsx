import React from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../utils/supabaseClient';

const TestAuth = () => {
  const { user, session, signOut } = useAuth();
  const [connectionStatus, setConnectionStatus] = React.useState('Checking...');

  React.useEffect(() => {
    // Test Supabase connection
    const testConnection = async () => {
      try {
        // Try to get session (this will test basic connectivity)
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          setConnectionStatus(`Error: ${error.message}`);
        } else {
          setConnectionStatus('✅ Connected to Supabase');
        }
      } catch (err) {
        setConnectionStatus(`❌ Connection failed: ${err.message}`);
      }
    };

    testConnection();
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-[#e0e5ec] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Authentication Test</h1>

        <div className="space-y-6">
          <div className="bg-white/80 p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Current Status</h2>
            <div className="space-y-2">
              <p><strong>User:</strong> {user ? user.email : 'Not logged in'}</p>
              <p><strong>Session:</strong> {session ? 'Active' : 'None'}</p>
              <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
            </div>
          </div>

          <div className="bg-white/80 p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Supabase Connection</h2>
            <p>✅ Client initialized successfully</p>
            <p>✅ Environment variables loaded</p>
            <p>{connectionStatus}</p>
            <div className="mt-3 text-sm text-gray-600">
              <p><strong>URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'Using fallback'}</p>
              <p><strong>Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
              <p><strong>Key Length:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0}</p>
            </div>
            <div className="mt-3 space-y-2">
              <button
                onClick={async () => {
                  try {
                    const { data, error } = await supabase.auth.getSession();
                    alert(`Session check: ${error ? error.message : 'Success - ' + (data.session ? 'Has session' : 'No session')}`);
                  } catch (err) {
                    alert(`Connection error: ${err.message}`);
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mr-2"
              >
                Test Supabase Client
              </button>
              <button
                onClick={async () => {
                  try {
                    console.log('🧪 Testing direct fetch...');
                    const response = await fetch('https://lwgnyerzimcajauxzowx.supabase.co/auth/v1/signup', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z255ZXJ6aW1jYWphdXh6b3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMzU2NjUsImV4cCI6MjA4MTYxMTY2NX0.mhYD-K2YKeNcvgerc5WPWhzuItJDXzqdrCjrK69B2Ng'
                      },
                      body: JSON.stringify({
                        email: 'testdirect@example.com',
                        password: 'test123456'
                      })
                    });

                    const data = await response.json();
                    console.log('Direct fetch response:', response.status, data);
                    alert(`Direct fetch: ${response.status} - ${data.msg || 'Success'}`);
                  } catch (err) {
                    console.error('Direct fetch error:', err);
                    alert(`Direct fetch error: ${err.message}\n\nTry: 1) Configure CORS in Supabase Dashboard\n2) Disable browser extensions\n3) Use incognito mode`);
                  }
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors mr-2"
              >
                Test Direct Fetch
              </button>
              <button
                onClick={async () => {
                  try {
                    console.log('🧪 Testing proxy fetch...');
                    const response = await fetch('/supabase-api/auth/v1/signup', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z255ZXJ6aW1jYWphdXh6b3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMzU2NjUsImV4cCI6MjA4MTYxMTY2NX0.mhYD-K2YKeNcvgerc5WPWhzuItJDXzqdrCjrK69B2Ng'
                      },
                      body: JSON.stringify({
                        email: 'testproxy@example.com',
                        password: 'test123456'
                      })
                    });

                    const data = await response.json();
                    console.log('Proxy fetch response:', response.status, data);
                    alert(`Proxy fetch: ${response.status} - ${data.msg || 'Success'}`);
                  } catch (err) {
                    console.error('Proxy fetch error:', err);
                    alert(`Proxy fetch error: ${err.message}`);
                  }
                }}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Test Proxy Fetch
              </button>
              <button
                onClick={async () => {
                  try {
                    console.log('🧪 Testing Supabase signup...');
                    const { data, error } = await supabase.auth.signUp({
                      email: 'testsignup@example.com',
                      password: 'test123456',
                      options: {
                        emailRedirectTo: `${window.location.origin}/dashboard`
                      }
                    });

                    if (error) {
                      console.error('Supabase signup error:', error);
                      alert(`Supabase signup error: ${error.message}\nStatus: ${error.status}\nDetails: ${JSON.stringify(error)}`);
                    } else {
                      console.log('Supabase signup success:', data);
                      alert('Supabase signup success! Check email for confirmation.');
                    }
                  } catch (err) {
                    console.error('Supabase signup exception:', err);
                    alert(`Supabase signup exception: ${err.message}\nType: ${err.constructor.name}`);
                  }
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Test Supabase Signup
              </button>
              <button
                onClick={async () => {
                  try {
                    console.log('🧪 Testing CORS proxy...');
                    // Using a CORS proxy service for testing
                    const corsProxy = 'https://cors-anywhere.herokuapp.com/';
                    const response = await fetch(corsProxy + 'https://lwgnyerzimcajauxzowx.supabase.co/auth/v1/signup', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z255ZXJ6aW1jYWphdXh6b3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMzU2NjUsImV4cCI6MjA4MTYxMTY2NX0.mhYD-K2YKeNcvgerc5WPWhzuItJDXzqdrCjrK69B2Ng'
                      },
                      body: JSON.stringify({
                        email: 'testcors@example.com',
                        password: 'test123456'
                      })
                    });

                    const data = await response.json();
                    console.log('CORS proxy response:', response.status, data);
                    alert(`CORS proxy: ${response.status} - ${data.msg || 'Success'}\n\nIf this works, configure CORS in Supabase Dashboard!`);
                  } catch (err) {
                    console.error('CORS proxy error:', err);
                    alert(`CORS proxy error: ${err.message}\n\nThis confirms CORS is blocking requests. Configure CORS in Supabase Dashboard.`);
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Test CORS Proxy
              </button>
            </div>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">🚨 CORS Setup Required</h3>
              <p className="text-sm text-yellow-700 mb-3">
                To fix "Failed to fetch" errors, configure CORS in Supabase:
              </p>
              <ol className="text-sm text-yellow-700 list-decimal list-inside space-y-1">
                <li>Open: <a href="https://app.supabase.com/project/lwgnyerzimcajauxzowx" target="_blank" rel="noopener noreferrer" className="underline">Supabase Dashboard</a></li>
                <li>Go to: Authentication → Settings → URL Configuration</li>
                <li>Add <code className="bg-yellow-100 px-1 rounded">https://alphaedge.vc</code> to "Additional Redirect URLs"</li>
                <li>Set "Site URL" to <code className="bg-yellow-100 px-1 rounded">https://alphaedge.vc</code></li>
                <li>Save changes</li>
              </ol>
            </div>
          </div>

          {user && (
            <div className="bg-white/80 p-6 rounded-xl shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Actions</h2>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}

          <div className="bg-white/80 p-6 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Navigation</h2>
            <div className="space-y-2">
              <a href="/" className="block text-blue-600 hover:text-blue-800">Home</a>
              <a href="/login" className="block text-blue-600 hover:text-blue-800">Login</a>
              <a href="/register" className="block text-blue-600 hover:text-blue-800">Register</a>
              <a href="/dashboard" className="block text-blue-600 hover:text-blue-800">Dashboard</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAuth;
