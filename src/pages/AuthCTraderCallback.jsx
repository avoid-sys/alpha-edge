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
        const currentRedirectUri = `${window.location.origin}/auth/ctrader/callback`;
        
        // Log request body for debugging (without sensitive data)
        const requestBody = { 
          code, 
          state,
          redirect_uri: currentRedirectUri
        };
        console.log('cTrader Token Request - Body:', { 
          ...requestBody, 
          code: code ? `${code.substring(0, 10)}...` : null // Only log first 10 chars of code
        });
        
        // Exchange code for tokens via backend (keeps client_secret on server)
        const res = await axios.post('/api/ctraderAuth', requestBody);

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
        let errorMessage = 'Failed to complete cTrader authorization.';

        if (err?.response?.data) {
          const errorData = err.response.data;
          
          // Direct cTrader API errors (from openapi.ctrader.com)
          // These come directly in errorData, not wrapped in "details"
          if (errorData.error_description) {
            errorMessage = errorData.error_description;
          } else if (errorData.error) {
            errorMessage = `cTrader Error: ${errorData.error}`;
            if (errorData.error_description) {
              errorMessage += ` - ${errorData.error_description}`;
            }
          } else {
            // Backend-wrapped errors (from our api/ctraderAuth.js)
            // Separate object and string details so we don't lose string messages
            const rawDetails = errorData.details;
            const detailsObject =
              rawDetails && typeof rawDetails === 'object' ? rawDetails : undefined;
            const detailsString =
              rawDetails && typeof rawDetails === 'string' ? rawDetails : undefined;

            const innerDescription = detailsObject?.error_description;
            const innerError = detailsObject?.error;

            if (innerDescription) {
              errorMessage = innerDescription;
            } else if (innerError || errorData.error) {
              const baseError = innerError || errorData.error;
              errorMessage = `cTrader Error: ${baseError}`;

              // Preserve string details if they exist (was previously appended)
              if (detailsString) {
                errorMessage += ` - ${detailsString}`;
              }
            } else if (detailsString) {
              // Only string details are available
              errorMessage = detailsString;
            } else {
              // Fallback: stringify any remaining structure safely
              errorMessage =
                typeof errorData === 'string'
                  ? errorData
                  : JSON.stringify(errorData, null, 2);
            }
          }
        } else if (err?.message) {
          errorMessage = err.message;
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


