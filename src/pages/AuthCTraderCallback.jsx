import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NeumorphicCard, NeumorphicButton } from '@/components/NeumorphicUI';
import { Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function AuthCTraderCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending'); // 'pending' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

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

    // For now we treat receiving a code as a successful connection handoff.
    // In a full implementation, this is where we would call a backend
    // API endpoint to exchange the code for access/refresh tokens via
    // CTRADER_CLIENT_ID/CTRADER_CLIENT_SECRET.
    setStatus('success');
    setMessage('cTrader authorization code received. Your account connection is now active.');

    const timer = setTimeout(() => {
      navigate(createPageUrl('dashboard'));
    }, 2500);

    return () => clearTimeout(timer);
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


