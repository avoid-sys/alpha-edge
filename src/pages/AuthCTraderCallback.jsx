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
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const error = params.get('error');
      const errorDescription = params.get('error_description');
      const state = params.get('state');
      const savedState = localStorage.getItem('ctrader_state');

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
        
        // Exchange code for tokens via backend (keeps client_secret on server)
        const res = await axios.post('/api/ctraderAuth', { 
          code, 
          state,
          redirect_uri: currentRedirectUri
        });

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
        console.error('cTrader token exchange failed', err);
        setStatus('error');

        // Extract detailed error message and avoid "[object Object]"
        let errorMessage = 'Failed to complete cTrader authorization.';

        if (err?.response?.data) {
          const errorData = err.response.data;

          // If backend wrapped cTrader error inside "details"
          const details = errorData.details || errorData;
          const innerDescription = typeof details === 'object' ? details.error_description : undefined;
          const innerError = typeof details === 'object' ? details.error : undefined;

          if (errorData.error_description || innerDescription) {
            errorMessage = errorData.error_description || innerDescription;
          } else if (innerError || errorData.error) {
            const baseError = innerError || errorData.error;
            errorMessage = `cTrader Error: ${baseError}`;
          } else {
            // Fallback: stringify object safely
            errorMessage =
              typeof errorData === 'string'
                ? errorData
                : JSON.stringify(errorData, null, 2);
          }
        } else if (err?.message) {
          errorMessage = err.message;
        }

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


