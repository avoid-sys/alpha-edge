import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getRedirectUri } from '../utils/cTraderUtils';

const CTraderCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('cTrader OAuth error:', error);
      alert('cTrader connection failed: ' + error);
      navigate('/connect');
      return;
    }

    const storedState = localStorage.getItem('ctrader_state');
    if (state !== storedState || !code) {
      alert('Invalid state or no authorization code received from cTrader');
      navigate('/connect');
      return;
    }

    // Exchange authorization code for access token
    const redirectUri = getRedirectUri();
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri, // Must match exactly
      client_id: import.meta.env.VITE_CTRADER_CLIENT_ID,
      client_secret: import.meta.env.VITE_CTRADER_CLIENT_SECRET
    });

    fetch('https://openapi.ctrader.com/apps/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          throw new Error(data.error_description || data.error);
        }

        // Store tokens with expiration time
        data.expires_at = Date.now() + (data.expires_in * 1000);
        localStorage.setItem('ctrader_tokens', JSON.stringify(data));
        console.log('cTrader tokens stored successfully');

        // Clear state
        localStorage.removeItem('ctrader_state');

        // Navigate to dashboard
        navigate('/dashboard');
      })
      .catch(err => {
        console.error('cTrader token exchange error:', err);
        alert('Error exchanging cTrader authorization code: ' + err.message);
        navigate('/connect');
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#e0e5ec] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#e0e5ec] rounded-full shadow-[-6px_-6px_12px_#ffffff,6px_6px_12px_#aeaec040] flex items-center justify-center mb-4 mx-auto">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Connecting to cTrader</h2>
        <p className="text-gray-500">Please wait while we establish the connection...</p>
      </div>
    </div>
  );
};

export default CTraderCallback;
