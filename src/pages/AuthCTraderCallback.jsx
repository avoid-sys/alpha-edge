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
      // Log query params for debugging
      console.log('cTrader Callback - Query Params:', location.search);
      
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const error = params.get('error');
      const errorDescription = params.get('error_description');
      const state = params.get('state');
      const savedState = localStorage.getItem('ctrader_state');
      
      console.log('cTrader Callback - Extracted params:', { 
        hasCode: !!code, 
        error, 
        errorDescription, 
        hasState: !!state,
        hasSavedState: !!savedState 
      });

      if (error) {
        setStatus('error');
        setMessage(errorDescription || `cTrader authorization failed: ${error}`);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('Missing authorization code from cTrader. Please try connecting again.');
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
        const clientId = import.meta.env.VITE_CTRADER_CLIENT_ID || '1506_ZNLG807Bj6mt9w4g9KYgRhO3CeHeleYf2YfoFVKLOaQnF';
        const clientSecret = import.meta.env.VITE_CTRADER_CLIENT_SECRET || 'Pr937H9OaHKwviXgd0Uc0uPjAoHdOzQ6JAU8PC7jkJqPe';
        
        // Log request params for debugging (without sensitive data)
        console.log('cTrader Token Request - Params:', { 
          grant_type: 'authorization_code',
          code: code ? `${code.substring(0, 10)}...` : null, // Only log first 10 chars
          redirect_uri: currentRedirectUri,
          client_id: clientId ? `${clientId.substring(0, 10)}...` : null,
          has_client_secret: !!clientSecret
        });
        
        // Exchange code for tokens using GET request (as per user requirements)
        // NOTE: Most OAuth providers require POST, but cTrader may accept GET
        // If GET fails, fallback to POST via backend proxy
        let res;
        try {
          res = await axios.get('https://openapi.ctrader.com/apps/token', {
            params: {
              grant_type: 'authorization_code',
              code,
              redirect_uri: currentRedirectUri,
              client_id: clientId,
              client_secret: clientSecret,
            },
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          });
        } catch (getError) {
          // If GET fails (405 Method Not Allowed), fallback to POST via backend proxy
          console.warn('GET request failed, falling back to POST via backend:', getError);
          const requestBody = { 
            code, 
            state,
            redirect_uri: currentRedirectUri
          };
          res = await axios.post('/api/ctraderAuth', requestBody);
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
          // Priority: error_description > error > stringify data
          errorMessage = errorData.error_description || errorData.error || JSON.stringify(errorData);
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
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
              <p className="text-sm text-red-600">
                {message}
              </p>
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


