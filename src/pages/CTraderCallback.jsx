import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getRedirectUri } from '../utils/cTraderUtils';
import { supabase } from '../utils/supabaseClient';

const CTraderCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeCallback = async () => {
      console.log('🔄 cTrader OAuth callback started');

      // Check if supabase client is available
      if (!supabase) {
        console.error('❌ Supabase client not available');
        alert('Application error. Please refresh the page.');
        navigate('/login');
        return;
      }

      console.log('✅ Supabase client available, checking session...');

      // First check if user is authenticated in Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('❌ Supabase session error:', sessionError);
        alert('Authentication error. Please log in again.');
        navigate('/login');
        return;
      }

      if (!session) {
        console.warn('⚠️ No Supabase session found, redirecting to login');
        alert('Please log in first before connecting cTrader.');
        navigate('/login');
        return;
      }

      console.log('✅ Supabase session verified, proceeding with cTrader OAuth');

      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      console.log('🔄 cTrader OAuth callback received:', {
        code: code ? 'present' : 'missing',
        state: state ? 'present' : 'missing',
        error: error || 'none',
        url: window.location.href
      });

      console.log('🔍 URL parameters check:', {
        fullUrl: window.location.href,
        searchParams: window.location.search,
        codeLength: code?.length,
        stateValue: state,
        errorValue: error
      });

      if (error) {
        console.error('❌ cTrader OAuth error from URL:', error);
        alert('cTrader connection failed: ' + error);
        console.log('🔄 Redirecting to /connect due to OAuth error');
        navigate('/connect');
        return;
      }

    const storedState = localStorage.getItem('ctrader_state');
    console.log('🔐 State validation:', {
      received: state,
      stored: storedState,
      match: state === storedState,
      hasCode: !!code
    });

    if (state !== storedState || !code) {
      console.error('❌ State validation failed:', {
        received: state,
        stored: storedState,
        hasCode: !!code
      });
      alert('Invalid state or no authorization code received from cTrader');
      console.log('🔄 Redirecting to /connect due to state validation failure');
      navigate('/connect');
      return;
    }

    // Exchange authorization code for access token via serverless API
    const redirectUri = getRedirectUri();
    console.log('🔑 Starting server-side token exchange with redirectUri:', redirectUri);
    console.log('📡 Preparing token exchange request...');

    console.log('📡 Making request to: /api/ctrader/token-exchange');

    // Get account type from localStorage (set during Connect.jsx)
    // Force live account as demo accounts don't support OpenAPI
    const accountType = 'live'; // localStorage.getItem('ctrader_account_type') || 'live';
    console.log('📡 Using account type for token exchange:', accountType);

    fetch('/api/ctrader/token-exchange', {
      method: 'POST', // Explicit POST to avoid 405 errors
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        redirect_uri: redirectUri, // Must match exactly
        account_type: accountType // 'live' or 'demo'
      })
    })
      .then(res => {
        console.log('📡 Server response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('📡 Server response data:', data); // Log full response for debugging

        // Check for errors first
        if (data.error || !data.access_token) {
          console.error('❌ Token exchange failed:', data);

          // Special handling for rate limiting
          if (data.spotware_status === 429 || data.error === 'Rate limited by Spotware') {
            const retryMinutes = Math.ceil((data.retry_after || 300) / 60);
            const message = `🚫 cTrader API Rate Limit Exceeded\n\n` +
              `Превышен лимит запросов к cTrader API.\n` +
              `Подождите ${retryMinutes} минут и попробуйте подключить аккаунт заново.\n\n` +
              `Если проблема persists, попробуйте:\n` +
              `1. Очистить состояние (кнопка "Reset cTrader Connection")\n` +
              `2. Подождать 15-30 минут\n` +
              `3. Попробовать в другое время`;

            alert(message);
            navigate('/connect');
            return;
          }

          // Handle malformed client_id or other Spotware errors
          const errorMessage = data.details?.description ||
                              data.details?.error_description ||
                              data.message ||
                              data.error ||
                              'Unknown error during token exchange';

          alert(`❌ Ошибка подключения cTrader:\n${errorMessage}\n\nПопробуйте переподключить аккаунт.`);
          navigate('/connect');
          return;
        }

        // Store tokens (already includes expires_at from server)
        localStorage.setItem('ctrader_tokens', JSON.stringify(data));
        console.log('✅ cTrader tokens stored successfully via serverless API');

        // Clear state
        localStorage.removeItem('ctrader_state');

        // Navigate to dashboard
        console.log('✅ cTrader connection complete, navigating to dashboard');
        navigate('/dashboard');
      })
      .catch(err => {
        console.error('❌ cTrader token exchange error:', err);
        alert('Error exchanging cTrader authorization code: ' + err.message);
        navigate('/connect');
      });
    };

    initializeCallback();
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
