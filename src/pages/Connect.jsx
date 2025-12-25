import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { NeumorphicButton } from '@/components/NeumorphicUI';
import { Upload, Zap, Settings, Trash2 } from 'lucide-react';
import { getRedirectUri, generateState } from '../utils/cTraderUtils';

export default function Connect() {
  const [selectedScope, setSelectedScope] = useState('accounts');
  const [accountType, setAccountType] = useState('live'); // 'live' or 'demo' - live recommended

  // Test function for cTrader playground (temporary)
  const handleTestCTraderPlayground = () => {
    const state = generateState();
    localStorage.setItem('ctrader_state', state);

    // Use playground redirect URI for testing
    const redirectUri = 'https://connect.spotware.com/apps/19506/playground';

    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_CTRADER_CLIENT_ID,
      scope: selectedScope,
      redirect_uri: redirectUri,
      product: 'web',
      state: state
    });

    const authUrl = `https://id.ctrader.com/my/settings/openapi/grantingaccess?${params.toString()}`;
    console.log('🧪 Testing with playground redirect:', authUrl);
    window.location.href = authUrl;
  };

  const handleConnectCTrader = () => {
    // Check if we already have valid tokens
    const existingTokens = localStorage.getItem('ctrader_tokens');
    if (existingTokens) {
      try {
        const tokens = JSON.parse(existingTokens);
        if (tokens.expires_at && Date.now() < tokens.expires_at) {
          alert('✅ You are already connected to cTrader!\n\nYour tokens are still valid until ' + new Date(tokens.expires_at).toLocaleString() + '.\n\nIf you want to reconnect, first reset the connection using the "Reset cTrader Connection" button.');
          return;
        }
      } catch (e) {
        // Invalid token format, continue with connection
        console.warn('Invalid token format in localStorage, proceeding with connection');
      }
    }

    // Save account type preference
    localStorage.setItem('ctrader_account_type', accountType);

    const state = generateState();
    localStorage.setItem('ctrader_state', state);

    const redirectUri = getRedirectUri();

    const scope = selectedScope; // Use selected scope from UI

    // Check if environment variables are set
    const fullClientId = import.meta.env.VITE_CTRADER_FULL_CLIENT_ID;
    if (!fullClientId) {
      alert('❌ cTrader configuration error: VITE_CTRADER_FULL_CLIENT_ID is not set.\n\nPlease add this to your .env file or Vercel environment variables:\nVITE_CTRADER_FULL_CLIENT_ID=your_full_client_id_here');
      return;
    }

    console.log('🔗 cTrader OAuth URL generation:', {
      redirectUri,
      scope,
      state,
      clientId: fullClientId.substring(0, 10) + '...',
      fullClientId: fullClientId,
      allEnv: Object.keys(import.meta.env).filter(key => key.includes('CTRADER'))
    });

    // Use URLSearchParams for proper encoding
    const params = new URLSearchParams({
      client_id: fullClientId, // Use full Client ID for consistency
      scope: scope,
      redirect_uri: redirectUri, // URLSearchParams handles encoding
      product: 'web', // Required for cTrader OAuth
      state: state
    });

    const authUrl = `https://id.ctrader.com/my/settings/openapi/grantingaccess?${params.toString()}`;

    console.log('🚀 Redirecting to cTrader OAuth:', authUrl);
    window.location.href = authUrl;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="text-center mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-3">Upload Trading Files</h1>
        <p className="text-gray-500 text-sm sm:text-base">Upload your trading statements to start tracking your performance.</p>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div>
          <Link to={createPageUrl('ImportTrades')}>
            <NeumorphicButton className="w-full flex items-center justify-center bg-white">
              <Upload size={20} className="mr-2" />
              Import HTML Statement
            </NeumorphicButton>
          </Link>
          <p className="text-xs text-gray-500 mt-1 text-center">Upload trading statements from any broker</p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#e0e5ec] text-gray-500">or</span>
          </div>
        </div>

        {/* Account Type Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Type:
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="live"
                checked={accountType === 'live'}
                onChange={(e) => setAccountType(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">Live Account</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="demo"
                checked={accountType === 'demo'}
                onChange={(e) => setAccountType(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">Demo Account</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {accountType === 'live'
              ? 'Connect to your real trading account with live funds'
              : 'Connect to demo account for testing and practice'
            }
          </p>
        </div>

        <div>
          <NeumorphicButton onClick={handleConnectCTrader} className="w-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
            <Zap size={20} className="mr-2" />
            Connect cTrader {accountType === 'live' ? 'Live' : 'Demo'}
          </NeumorphicButton>
          <p className="text-xs text-gray-500 mt-1 text-center">Connect directly to your cTrader account</p>
        </div>

        {/* Scope selector for testing different permissions */}
        {import.meta.env.DEV && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              cTrader Scope (for testing):
            </label>
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="w-full px-3 py-2 bg-[#e0e5ec] border-2 border-transparent rounded-xl focus:border-blue-500 focus:outline-none shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all duration-200"
            >
              <option value="accounts">accounts</option>
              <option value="trading">trading</option>
              <option value="trading accounts">trading accounts</option>
            </select>
          </div>
        )}

        {/* Temporary test button for debugging */}
        {import.meta.env.DEV && (
          <div>
            <NeumorphicButton onClick={handleTestCTraderPlayground} className="w-full flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-600 text-white border-0">
              <Settings size={20} className="mr-2" />
              Test cTrader OAuth ({selectedScope})
            </NeumorphicButton>
            <p className="text-xs text-gray-500 mt-1 text-center">Test with playground redirect (dev only)</p>
          </div>
        )}

        {/* Reset cTrader state button */}
        <div>
          <NeumorphicButton
            onClick={() => {
              localStorage.removeItem('ctrader_tokens');
              localStorage.removeItem('ctrader_state');
              alert('cTrader state cleared. You can try connecting again.');
            }}
            className="w-full flex items-center justify-center bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0"
          >
            <Trash2 size={20} className="mr-2" />
            Reset cTrader Connection
          </NeumorphicButton>
          <p className="text-xs text-gray-500 mt-1 text-center">Clear stored tokens and try again</p>
        </div>
      </div>

    </div>
  );
}
