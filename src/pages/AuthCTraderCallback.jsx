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

        // Optional: store access token locally for immediate use.
        // For production you may want to only keep it server-side.
        if (res.data?.access_token) {
          localStorage.setItem('ctrader_access_token', res.data.access_token);
          if (res.data?.refresh_token) {
            localStorage.setItem('ctrader_refresh_token', res.data.refresh_token);
          }
          if (res.data?.expires_in) {
            localStorage.setItem('ctrader_expires_in', res.data.expires_in);
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
        const apiMessage =
          err?.response?.data?.error ||
          err?.response?.data?.details ||
          err?.message ||
          'Failed to complete cTrader authorization.';
        setMessage(String(apiMessage));
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


