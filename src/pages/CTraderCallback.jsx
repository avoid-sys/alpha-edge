import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getRedirectUri } from '../utils/cTraderUtils';

const CTraderCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // For implicit flow, access_token comes in URL hash fragment
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);

    const accessToken = hashParams.get('access_token');
    const tokenType = hashParams.get('token_type');
    const expiresIn = hashParams.get('expires_in');
    const state = hashParams.get('state');
    const error = hashParams.get('error');

    if (error) {
      console.error('cTrader OAuth error:', error);
      alert('cTrader connection failed: ' + error);
      navigate('/connect');
      return;
    }

    const storedState = localStorage.getItem('ctrader_state');
    if (state !== storedState || !accessToken) {
      alert('Invalid state or no access token received from cTrader');
      navigate('/connect');
      return;
    }

    // Store tokens (implicit flow gives access_token directly)
    const tokens = {
      access_token: accessToken,
      token_type: tokenType || 'Bearer',
      expires_in: parseInt(expiresIn) || 3600,
      expires_at: Date.now() + (parseInt(expiresIn) || 3600) * 1000
    };

    localStorage.setItem('ctrader_tokens', JSON.stringify(tokens));
    console.log('cTrader access token stored successfully via implicit flow');

    // Clear state and hash from URL
    localStorage.removeItem('ctrader_state');
    window.history.replaceState(null, null, window.location.pathname);

    // Navigate to dashboard
    navigate('/dashboard');
  }, [navigate]);

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
