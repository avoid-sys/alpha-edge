import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { NeumorphicButton } from '@/components/NeumorphicUI';
import { Upload, Zap, Settings, Trash2, TrendingUp, BarChart3 } from 'lucide-react';
import { getRedirectUri, generateState } from '../utils/cTraderUtils';

export default function Connect() {
  const navigate = useNavigate();
  const [selectedScope, setSelectedScope] = useState('accounts');
  const [accountType, setAccountType] = useState('live'); // 'live' or 'demo' - live recommended

  // Binance state
  const [binanceKey, setBinanceKey] = useState('');
  const [binanceSecret, setBinanceSecret] = useState('');
  const [binanceLoading, setBinanceLoading] = useState(false);
  const [skipBinanceValidation, setSkipBinanceValidation] = useState(false);

  // Bybit state
  const [bybitKey, setBybitKey] = useState('');
  const [bybitSecret, setBybitSecret] = useState('');
  const [bybitLoading, setBybitLoading] = useState(false);
  const [skipBybitValidation, setSkipBybitValidation] = useState(false);

  // Handle Binance connection
  const handleBinanceConnect = async () => {
    if (!skipBinanceValidation && (!binanceKey || !binanceSecret)) {
      alert('Please enter both API Key and Secret for Binance');
      return;
    }

    setBinanceLoading(true);
    try {
      let validationPassed = skipBinanceValidation;

      if (!skipBinanceValidation) {
        const response = await fetch('/api/binance/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: binanceKey, apiSecret: binanceSecret })
        });

        const data = await response.json();
        validationPassed = data.valid;
      }

      if (validationPassed) {
        localStorage.setItem('binance_credentials', JSON.stringify({
          apiKey: binanceKey,
          apiSecret: binanceSecret,
          connectedAt: Date.now(),
          skipValidation: skipBinanceValidation
        }));

        const message = skipBinanceValidation
          ? '✅ Binance connected with demo data!\n\nNote: API validation was skipped. Real trading data will not be loaded.'
          : '✅ Binance account connected successfully!';

        alert(message);
        navigate('/dashboard');
      } else {
        alert('❌ Invalid Binance credentials. Please check:\n\n1. API Key and Secret are correct\n2. API Key has "Enable Spot & Margin Trading" permission\n3. IP restrictions allow access from any IP or include your IP\n4. API Key is not expired\n\nTry creating new API keys in Binance API Management.\n\nOr check "Skip API validation" to use demo data.');
      }
    } catch (err) {
      console.error('Binance connection error:', err);
      alert('❌ Connection failed. Please check your internet connection and try again.');
    } finally {
      setBinanceLoading(false);
    }
  };

  // Handle Bybit connection
  const handleBybitConnect = async () => {
    if (!skipBybitValidation && (!bybitKey || !bybitSecret)) {
      alert('Please enter both API Key and Secret for Bybit');
      return;
    }

    setBybitLoading(true);
    try {
      let validationPassed = skipBybitValidation;

      if (!skipBybitValidation) {
        const response = await fetch('/api/bybit/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: bybitKey, apiSecret: bybitSecret })
        });

        const data = await response.json();
        validationPassed = data.valid;
      }

      if (validationPassed) {
        localStorage.setItem('bybit_credentials', JSON.stringify({
          apiKey: bybitKey,
          apiSecret: bybitSecret,
          connectedAt: Date.now(),
          skipValidation: skipBybitValidation
        }));

        const message = skipBybitValidation
          ? '✅ Bybit connected with demo data!\n\nNote: API validation was skipped. Real trading data will not be loaded.'
          : '✅ Bybit account connected successfully!';

        alert(message);
        navigate('/dashboard');
      } else {
        alert('❌ Invalid Bybit credentials. Please check:\n\n1. API Key and Secret are correct\n2. API Key has "Read" permissions enabled\n3. IP restrictions allow access from any IP\n4. API Key is not expired\n\nTry creating new API keys in Bybit account settings.\n\nOr check "Skip API validation" to use demo data.');
      }
    } catch (err) {
      console.error('Bybit connection error:', err);
      alert('❌ Connection failed. Please check your internet connection and try again.');
    } finally {
      setBybitLoading(false);
    }
  };

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

      {/* Binance Connection */}
      <div className="bg-white rounded-2xl p-6 shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <BarChart3 size={24} className="mr-2 text-orange-500" />
          Connect Binance
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={binanceKey}
              onChange={(e) => setBinanceKey(e.target.value)}
              placeholder="Enter your Binance API Key"
              className="w-full px-3 py-2 bg-[#e0e5ec] border-2 border-transparent rounded-xl focus:border-orange-500 focus:outline-none shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Secret
            </label>
            <input
              type="password"
              value={binanceSecret}
              onChange={(e) => setBinanceSecret(e.target.value)}
              placeholder="Enter your Binance API Secret"
              className="w-full px-3 py-2 bg-[#e0e5ec] border-2 border-transparent rounded-xl focus:border-orange-500 focus:outline-none shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all duration-200"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="skip-binance-validation"
              checked={skipBinanceValidation}
              onChange={(e) => setSkipBinanceValidation(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="skip-binance-validation" className="text-sm text-gray-600">
              Skip API validation (use demo data)
            </label>
          </div>

          <NeumorphicButton
            onClick={handleBinanceConnect}
            disabled={binanceLoading}
            className="w-full flex items-center justify-center bg-gradient-to-r from-orange-500 to-yellow-600 text-white border-0 disabled:opacity-50"
          >
            <BarChart3 size={20} className="mr-2" />
            {binanceLoading ? 'Connecting...' : 'Connect Binance'}
          </NeumorphicButton>

          <p className="text-xs text-gray-500 mt-1 text-center">
            Connect to your Binance Futures account for live trading data
          </p>
        </div>
      </div>

      {/* Bybit Connection */}
      <div className="bg-white rounded-2xl p-6 shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <TrendingUp size={24} className="mr-2 text-blue-500" />
          Connect Bybit
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={bybitKey}
              onChange={(e) => setBybitKey(e.target.value)}
              placeholder="Enter your Bybit API Key"
              className="w-full px-3 py-2 bg-[#e0e5ec] border-2 border-transparent rounded-xl focus:border-blue-500 focus:outline-none shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Secret
            </label>
            <input
              type="password"
              value={bybitSecret}
              onChange={(e) => setBybitSecret(e.target.value)}
              placeholder="Enter your Bybit API Secret"
              className="w-full px-3 py-2 bg-[#e0e5ec] border-2 border-transparent rounded-xl focus:border-blue-500 focus:outline-none shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all duration-200"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="skip-bybit-validation"
              checked={skipBybitValidation}
              onChange={(e) => setSkipBybitValidation(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="skip-bybit-validation" className="text-sm text-gray-600">
              Skip API validation (use demo data)
            </label>
          </div>

          <NeumorphicButton
            onClick={handleBybitConnect}
            disabled={bybitLoading}
            className="w-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 disabled:opacity-50"
          >
            <TrendingUp size={20} className="mr-2" />
            {bybitLoading ? 'Connecting...' : 'Connect Bybit'}
          </NeumorphicButton>

          <p className="text-xs text-gray-500 mt-1 text-center">
            Connect to your Bybit account for live trading data
          </p>
        </div>
      </div>

    </div>
  );
}
