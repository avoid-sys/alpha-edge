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

    console.log('🔄 cTrader OAuth callback received:', {
      code: code ? 'present' : 'missing',
      state: state ? 'present' : 'missing',
      error: error || 'none',
      url: window.location.href
    });

    if (error) {
      console.error('cTrader OAuth error:', error);
      alert('cTrader connection failed: ' + error);
      navigate('/connect');
      return;
    }

    const storedState = localStorage.getItem('ctrader_state');
    if (state !== storedState || !code) {
      console.error('State validation failed:', {
        received: state,
        stored: storedState,
        hasCode: !!code
      });
      alert('Invalid state or no authorization code received from cTrader');
      navigate('/connect');
      return;
    }

    // Exchange authorization code for access token via serverless API
    const redirectUri = getRedirectUri();
    console.log('🔑 Starting server-side token exchange with redirectUri:', redirectUri);

    console.log('📡 Making request to: /api/ctrader/token-exchange');

    fetch('/api/ctrader/token-exchange', {
      method: 'POST', // Explicit POST to avoid 405 errors
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        redirect_uri: redirectUri // Must match exactly
      })
    })
      .then(res => {
        console.log('📡 Server response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('📡 Server response data:', data); // Log full response for debugging

        if (data.error) {
          console.error('❌ Token exchange error from server:', data);
          throw new Error(data.message || data.details?.error_description || data.error);
        }

        // Store tokens (already includes expires_at from server)
        localStorage.setItem('ctrader_tokens', JSON.stringify(data));
        console.log('✅ cTrader tokens stored successfully via serverless API');

        // Clear state
        localStorage.removeItem('ctrader_state');

        // Navigate to dashboard
        navigate('/dashboard');
      })
      .catch(err => {
        console.error('❌ cTrader token exchange error:', err);
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
