import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { NeumorphicCard, NeumorphicButton } from '@/components/NeumorphicUI';
import { Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function AuthCTraderCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending'); // 'pending' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const run = async () => {
      // Log full URL and location for debugging
      console.log('cTrader Callback - Full URL:', window.location.href);
      console.log('cTrader Callback - Query Params:', location.search);
      console.log('cTrader Callback - Hash:', location.hash);
      console.log('cTrader Callback - Pathname:', location.pathname);
      
      // Try both query params and hash (some OAuth providers use hash)
      const queryParams = new URLSearchParams(location.search);
      const hashParams = new URLSearchParams(location.hash.substring(1)); // Remove #
      
      const code = queryParams.get('code') || hashParams.get('code');
      const error = queryParams.get('error') || hashParams.get('error');
      const errorDescription = queryParams.get('error_description') || hashParams.get('error_description');
      const state = queryParams.get('state') || hashParams.get('state');
      const savedState = localStorage.getItem('ctrader_state');
      
      console.log('cTrader Callback - Extracted params:', { 
        hasCode: !!code, 
        code: code ? `${code.substring(0, 10)}...` : null,
        error, 
        errorDescription, 
        hasState: !!state,
        state: state ? `${state.substring(0, 20)}...` : null,
        hasSavedState: !!savedState,
        savedState: savedState ? `${savedState.substring(0, 20)}...` : null
      });

      if (error) {
        setStatus('error');
        setMessage(errorDescription || `cTrader authorization failed: ${error}`);
        return;
      }

      if (!code) {
        setStatus('error');
        const errorMsg = error 
          ? `cTrader authorization failed: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`
          : `Missing authorization code from cTrader. 

This usually means:
1. You accessed this page directly (not from cTrader redirect)
2. The authorization URL was incorrect
3. Redirect URI mismatch in cTrader app settings

Please go back to "Connect Platforms" and click "Connect" on cTrader again.`;
        setMessage(errorMsg);
        console.error('cTrader Callback Error - No code received:', {
          fullUrl: window.location.href,
          search: location.search,
          hash: location.hash,
          error,
          errorDescription,
          savedState: savedState ? 'exists' : 'missing'
        });
        console.error('⚠️  Did you access this URL directly? You must go through the OAuth flow from "Connect Platforms" page.');
        return;
      }

      if (!state || !savedState || state !== savedState) {
        setStatus('error');
        setMessage('Invalid cTrader authorization state. Please start the connection again.');
        return;
      }

      try {
        // Determine redirect_uri based on current origin (for localhost support)
        // IMPORTANT: This MUST exactly match the redirect_uri used in authorization URL
        // and the one registered in cTrader app settings
        const currentRedirectUri = `${window.location.origin}/auth/ctrader/callback`;
        
        console.log('cTrader Callback - Using redirect_uri:', currentRedirectUri);
        console.log('⚠️  This must match the redirect_uri from authorization URL and cTrader app settings');
        
        // SECURITY WARNING: Using client_secret on frontend is NOT recommended for production
        // This exposes the secret in browser network logs and JavaScript code
        // For production, use the backend proxy (/api/ctraderAuth) instead
        const clientId = import.meta.env.VITE_CTRADER_CLIENT_ID || '19506_ZNLG80oi7Bj6mt9wi4g9KYgRh3OcEbHele1YzBfeOFvKL0A0nF';
        const clientSecret = import.meta.env.VITE_CTRADER_CLIENT_SECRET || 'Pr937hf9OaHKwv1xqbDc0u0clPtJAohDqOZA6UABPC7JikagPe';
        
        // IMPORTANT: redirect_uri must EXACTLY match the one registered in cTrader app settings
        // Check: https://connect.spotware.com/apps → Your App → Redirect URLs
        // Current redirect_uri: https://alphaedge.vc/auth/ctrader/callback
        const redirectUriForToken = 'https://alphaedge.vc/auth/ctrader/callback';
        
        // Log request params for debugging (without sensitive data)
        console.log('cTrader Token Request - Params:', { 
          grant_type: 'authorization_code',
          code: code ? `${code.substring(0, 10)}...` : null, // Only log first 10 chars
          redirect_uri: redirectUriForToken,
          client_id: clientId ? `${clientId.substring(0, 10)}...` : null,
          has_client_secret: !!clientSecret
        });
        console.log('⚠️  redirect_uri must match:', redirectUriForToken);
        console.log('⚠️  Verify this URI is registered in cTrader app settings');
        
        // cTrader Open API requires GET request with parameters in query string
        // Endpoint: https://openapi.ctrader.com/apps/token
        // Note: This differs from standard OAuth 2.0 (which uses POST), but cTrader uses GET
        let res;
        try {
          // Primary: Direct GET to cTrader API with query parameters
          res = await axios.get('https://openapi.ctrader.com/apps/token', {
            params: {
              grant_type: 'authorization_code',
              code,
              redirect_uri: redirectUriForToken, // Must match registered URI exactly
              client_id: clientId,
              client_secret: clientSecret,
            },
            headers: {
              'Accept': 'application/json',
            },
          });
          console.log('✅ Token exchange successful via direct GET');
        } catch (getError) {
          // Fallback: Try POST via backend proxy (keeps client_secret on server)
          console.warn('Direct GET failed, falling back to backend proxy:', getError);
          const requestBody = { 
            code, 
            state,
            redirect_uri: redirectUriForToken
          };
          res = await axios.post('/api/ctraderAuth', requestBody);
          console.log('✅ Token exchange successful via backend proxy');
        }

        // Store tokens securely for future API calls
        if (res.data?.access_token) {
          localStorage.setItem('ctrader_access_token', res.data.access_token);
          if (res.data?.refresh_token) {
            localStorage.setItem('ctrader_refresh_token', res.data.refresh_token);
          }
          if (res.data?.expires_in) {
            // Calculate expiration timestamp
            const expiresAt = Date.now() + res.data.expires_in * 1000;
            localStorage.setItem('ctrader_expires_at', expiresAt.toString());
            localStorage.setItem('ctrader_expires_in', res.data.expires_in.toString());
          }
        }

        setStatus('success');
        setMessage('cTrader authorization successful. Redirecting you to your dashboard.');

        const timer = setTimeout(() => {
          navigate(createPageUrl('dashboard'));
        }, 2500);

        return () => clearTimeout(timer);
      } catch (err) {
        // Full error logging for debugging
        console.error('cTrader token exchange failed - Full Error:', err);
        console.error('cTrader token exchange failed - Response:', err?.response);
        console.error('cTrader token exchange failed - Response Data:', err?.response?.data);
        
        setStatus('error');

        // Extract detailed error message and avoid "[object Object]"
        // Improved error handling as per user requirements
        let errorMessage = 'Unknown error';
        
        if (err?.response?.data) {
          const errorData = err.response.data;
          // Priority: description > error_description > error > stringify data
          errorMessage = errorData.description || errorData.error_description || errorData.error || JSON.stringify(errorData);
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
        // Log full error for debugging
        console.error('cTrader token exchange failed - Full Error:', err);
        console.error('cTrader token exchange failed - Response:', err?.response);
        console.error('cTrader token exchange failed - Response Data:', err?.response?.data);
        
        // Format final error message
        if (!errorMessage.startsWith('cTrader Error:')) {
          errorMessage = `cTrader Error: ${errorMessage}`;
        }

        console.error('cTrader token exchange failed - Final Error Message:', errorMessage);
        setMessage(errorMessage);
      }
    };

    run();
  }, [location.search, navigate]);

  const isPending = status === 'pending';
  const isSuccess = status === 'success';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <NeumorphicCard className="max-w-md w-full p-6 text-center">
        <div className="flex flex-col items-center gap-3 mb-4">
          {isPending && (
            <>
              <Activity className="text-blue-500 animate-spin" size={32} />
              <h1 className="text-lg font-semibold text-gray-800">
                Completing cTrader Connection
              </h1>
              <p className="text-sm text-gray-600">
                Please wait while we finalize the connection to your cTrader account.
              </p>
            </>
          )}

          {isSuccess && (
            <>
              <CheckCircle className="text-green-500" size={32} />
              <h1 className="text-lg font-semibold text-gray-800">
                cTrader Connected
              </h1>
              <p className="text-sm text-gray-600">
                Your cTrader authorization was successful. Redirecting you to your dashboard.
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertTriangle className="text-red-500" size={32} />
              <h1 className="text-lg font-semibold text-gray-800">
                cTrader Authorization Error
              </h1>
              <div className="text-left space-y-3 mt-4">
                <p className="text-sm text-red-600 font-medium">
                  {message}
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
                  <p className="font-semibold mb-2">Troubleshooting Steps:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Open browser console (F12 → Console) to see detailed error logs</li>
                    <li>Verify redirect_uri is registered in cTrader app settings:
                      <br />
                      <code className="bg-red-100 px-1 rounded">https://alphaedge.vc/auth/ctrader/callback</code>
                    </li>
                    <li>Check that your cTrader app is approved (not pending)</li>
                    <li>Ensure redirect_uri matches exactly (no www, correct path)</li>
                    <li>Try clearing browser cache and retry</li>
                  </ol>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                  <p className="font-semibold mb-1">Common Errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>invalid_grant:</strong> Authorization code expired (try again quickly)</li>
                    <li><strong>invalid_client:</strong> Check Client ID and Secret</li>
                    <li><strong>redirect_uri_mismatch:</strong> URI doesn't match registered one</li>
                    <li><strong>access_denied:</strong> User denied authorization</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>

        {!isPending && (
          <NeumorphicButton
            onClick={() => navigate(createPageUrl('dashboard'))}
            className="mt-4 w-full"
          >
            Go to Dashboard
          </NeumorphicButton>
        )}
      </NeumorphicCard>
    </div>
  );
}


