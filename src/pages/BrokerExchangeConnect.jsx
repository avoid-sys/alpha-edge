import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeumorphicCard, NeumorphicButton } from '@/components/NeumorphicUI';
import { brokerIntegrationService } from '@/services/brokerIntegrationService';
import {
  TrendingUp,
  Bitcoin,
  Shield,
  CheckCircle,
  AlertCircle,
  Settings,
  ExternalLink,
  Key,
  Users,
  Globe,
  Zap
} from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function BrokerExchangeConnect() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('brokers'); // 'brokers' or 'exchanges'
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [connectedBrokers, setConnectedBrokers] = useState([]);
  const [connectedExchanges, setConnectedExchanges] = useState([]);
  const [authForm, setAuthForm] = useState({
    apiKey: '',
    apiSecret: '',
    passphrase: '',
    brokerServer: '',
    accountNumber: '',
    password: ''
  });

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = () => {
    setConnectedBrokers(brokerIntegrationService.getConnectedBrokers());
    setConnectedExchanges(brokerIntegrationService.getConnectedExchanges());
  };

  const supportedBrokers = brokerIntegrationService.getSupportedBrokers();
  const supportedExchanges = brokerIntegrationService.getSupportedExchanges();

  const handlePlatformSelect = (platformId, type) => {
    setSelectedPlatform({ id: platformId, type });
    setAuthForm({
      apiKey: '',
      apiSecret: '',
      passphrase: '',
      brokerServer: '',
      accountNumber: '',
      password: ''
    });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlatform) return;

    setConnecting(true);
    try {
      const { id, type } = selectedPlatform;

      if (type === 'broker') {
        const platform = supportedBrokers[id];
        let credentials = {};

        switch (platform.authType) {
          case 'api-key':
            credentials = {
              apiKey: authForm.apiKey,
              apiSecret: authForm.apiSecret,
              passphrase: authForm.passphrase || undefined
            };
            break;
          case 'broker-api':
            credentials = {
              brokerServer: authForm.brokerServer,
              accountNumber: authForm.accountNumber,
              password: authForm.password
            };
            break;
          case 'oauth': {
            // Real OAuth redirect for cTrader (and any future OAuth brokers)
            const oauth = platform.oauth || {};
            const clientId = import.meta.env.VITE_CTRADER_CLIENT_ID || '19506_ZNLG80oi7Bj6mt9wi4g9KYgRh3OcEbHele1YzBfeOFvKL0A0nF';

            // EMERGENCY MANUAL TEST - if all automated attempts fail
            const manualTest = confirm(
              '🚨 cTrader OAuth Debug Mode 🚨\n\n' +
              'Click OK to see manual test URLs in console.\n' +
              'Click Cancel to proceed with automated redirect.\n\n' +
              'If automated redirect fails with 400, use manual URLs from console!'
            );

            if (manualTest) {
              const testUrls = [
                `https://id.ctrader.com/my/settings/openapi/grantingaccess?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/ctrader/callback')}&scope=accounts&response_type=code&product=web&state=test123`,
                `https://connect.spotware.com/apps/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/ctrader/callback')}&scope=trading%20accounts&response_type=code&state=test123`,
                `https://id.ctrader.com/connect/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/ctrader/callback')}&scope=openid%20profile&response_type=code&state=test123`
              ];

              console.log('🚨 MANUAL TEST URLs (copy and paste in new tab):');
              testUrls.forEach((testUrl, index) => {
                console.log(`${index + 1}. ${testUrl}`);
              });

              alert('Manual URLs logged to console. Copy one and paste in new tab to test.');
              return;
            }

            // Debug logging
            console.log('=== cTrader OAuth Debug ===');
            console.log('cTrader OAuth - Client ID:', clientId ? `${clientId.substring(0, 10)}...` : 'MISSING');
            console.log('cTrader OAuth - From env:', import.meta.env.VITE_CTRADER_CLIENT_ID ? 'YES' : 'NO (using fallback)');
            console.log('cTrader OAuth - All env vars:', Object.keys(import.meta.env).filter(key => key.includes('CTRADER')));

            // Use production redirect_uri or localhost for development
            // CRITICAL: This redirect_uri MUST exactly match the one registered in cTrader app settings
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const redirectUri = isLocalhost
              ? `${window.location.origin}/auth/ctrader/callback`
              : (oauth.redirectUri || 'https://alphaedge.vc/auth/ctrader/callback');

            console.log('cTrader OAuth - Redirect URI check:');
            console.log('  - Current:', redirectUri);
            console.log('  - Is localhost:', isLocalhost);
            console.log('  - Expected in cTrader app settings:');
            console.log('    For localhost:', `${window.location.origin}/auth/ctrader/callback`);
            console.log('    For production:', 'https://alphaedge.vc/auth/ctrader/callback');
            console.log('  ⚠️  MUST MATCH EXACTLY in https://connect.spotware.com/apps');

            // Log redirect_uri for debugging - must match exactly in cTrader app settings
            console.log('cTrader OAuth - Redirect URI:', redirectUri);
            console.log('⚠️  Make sure this EXACT URI is registered in cTrader app settings:');
            console.log('   https://connect.spotware.com/apps → Your App → Redirect URLs');
            console.log('   Expected: https://alphaedge.vc/auth/ctrader/callback');

            // cTrader authorization URL - official format from cTrader documentation
            // URL: https://id.ctrader.com/my/settings/openapi/grantingaccess
            // NO trailing slash - this causes 400 error
            // Try different auth URLs and parameters - cTrader has multiple possible endpoints
            const authUrls = [
              'https://connect.spotware.com/apps/authorize',
              'https://id.ctrader.com/connect/authorize',
              'https://id.ctrader.com/my/settings/openapi/grantingaccess'
            ];

            const scopes = [
              'trading accounts',    // User's suggested scope
              'accounts trading',    // Previous attempt
              'accounts',           // Minimal scope
              'trading',           // Alternative
              'openid profile',    // Standard OAuth scopes
              'accounts read',     // Read-only accounts
              'trading read'       // Read-only trading
            ];

            const rawScope = oauth.scope || 'trading accounts';
            const state = `${id}-${Date.now()}`;

            // MANUAL ENCODING - cTrader may reject URLSearchParams encoding
            // Replace + with %20 manually for scope (critical for cTrader)
            const encodedClientId = encodeURIComponent(clientId);
            const encodedRedirectUri = encodeURIComponent(redirectUri);
            const encodedScope = encodeURIComponent(rawScope).replace(/\+/g, '%20'); // FORCE %20 instead of +
            const encodedState = encodeURIComponent(state);

            // Try different parameter combinations and orders
            const urlVariations = [
              // Standard OAuth2 with product=web (cTrader specific)
              `${authUrls[2]}?client_id=${encodedClientId}&redirect_uri=${encodedRedirectUri}&scope=${encodedScope}&response_type=code&product=web&state=${encodedState}`,
              // Minimal parameters
              `${authUrls[2]}?client_id=${encodedClientId}&redirect_uri=${encodedRedirectUri}&scope=${encodedScope}&response_type=code&state=${encodedState}`,
              // Different auth URL
              `${authUrls[0]}?client_id=${encodedClientId}&redirect_uri=${encodedRedirectUri}&scope=${encodedScope}&response_type=code&state=${encodedState}`,
              // With different scope
              `${authUrls[2]}?client_id=${encodedClientId}&redirect_uri=${encodedRedirectUri}&scope=accounts&response_type=code&state=${encodedState}`,
              // With trading scope only
              `${authUrls[2]}?client_id=${encodedClientId}&redirect_uri=${encodedRedirectUri}&scope=trading&response_type=code&state=${encodedState}`,
              // OpenID connect style
              `${authUrls[1]}?client_id=${encodedClientId}&redirect_uri=${encodedRedirectUri}&scope=openid%20profile&response_type=code&state=${encodedState}`
            ];

            // Try the most likely working URL first
            const url = urlVariations[0]; // With product=web parameter
            
            // Log everything for debugging
            console.log('=== cTrader URL Variations Debug ===');
            console.log('1. Parameters:', {
              client_id: clientId,
              redirect_uri: redirectUri,
              scope: rawScope,
              response_type: 'code',
              product: 'web',
              state: state
            });
            console.log('2. Encoded parameters:', {
              encodedClientId: encodedClientId,
              encodedRedirectUri: encodedRedirectUri,
              encodedScope: encodedScope,
              encodedState: encodedState
            });
            console.log('3. Current URL (trying first):', url);
            console.log('4. All URL variations tried:');
            urlVariations.forEach((variation, index) => {
              console.log(`   ${index + 1}. ${variation}`);
            });

            // Check for common cTrader 400 causes
            console.log('5. 400 Error Troubleshooting:');
            console.log('   - Scope encoding:', encodedScope.includes('%20') ? '✓ %20 (good)' : '✗ + (bad)');
            console.log('   - Client ID format:', clientId.includes('_') ? '✓ Has underscore (good)' : '✗ No underscore (may be bad)');
            console.log('   - Redirect URI:', redirectUri.startsWith('http') ? '✓ HTTP(S) (good)' : '✗ Not HTTP (bad)');
            console.log('   - Product param:', url.includes('product=web') ? '✓ Has product=web' : '✗ Missing product=web');
            console.log('   - URL length:', url.length, url.length > 2000 ? '(WARNING: Too long!)' : '(OK)');

            console.log('6. If 400 persists, try these manual URLs:');
            console.log('   Manual URL 1:', `https://id.ctrader.com/my/settings/openapi/grantingaccess?client_id=${encodedClientId}&redirect_uri=${encodedRedirectUri}&scope=accounts&response_type=code&state=${encodedState}`);
            console.log('   Manual URL 2:', `https://connect.spotware.com/apps/authorize?client_id=${encodedClientId}&redirect_uri=${encodedRedirectUri}&scope=trading%20accounts&response_type=code&state=${encodedState}`);
            console.log('4. URL Length:', url.length);
            console.log('5. Redirect URI Check:');
            console.log('   - Current redirect_uri:', redirectUri);
            console.log('   - Must match EXACTLY in cTrader app settings');
            console.log('   - Check: https://connect.spotware.com/apps → Your App → Redirect URLs');
            console.log('   - For localhost:', 'http://localhost:3000/auth/ctrader/callback');
            console.log('   - For production:', 'https://alphaedge.vc/auth/ctrader/callback');
            console.log('6. Client ID Check:');
            console.log('   - Client ID:', clientId ? `${clientId.substring(0, 20)}...` : 'MISSING');
            console.log('   - Must match cTrader app settings');
            console.log('7. ULTIMATE 400 FIX CHECKLIST:');
            console.log('   ✓ Manual %20 encoding (not URLSearchParams)');
            console.log('   ✓ Added product=web parameter');
            console.log('   ✓ Tried multiple auth URLs');
            console.log('   ✓ Checked all scope variations');
            console.log('   → If still 400, the problem is likely:');
            console.log('     1. Wrong redirect_uri in cTrader app settings');
            console.log('     2. App not "Active" in cTrader portal');
            console.log('     3. Wrong client_id');
            console.log('     4. cTrader API changed their requirements');
            console.log('   → MANUAL TEST: Copy this URL and paste in new browser tab:');
            console.log('     ', url);

            console.log('✅ About to redirect to cTrader...');

            // Сохраняем state для проверки в колбэке (reuse encodedState from above)
            localStorage.setItem('ctrader_state', encodedState);
            console.log('💾 Saved state to localStorage:', state.substring(0, 20) + '...');

            // Small delay to ensure logs are visible
            setTimeout(() => {
              window.location.href = url;
            }, 100);
            return;
          }
        }

        await brokerIntegrationService.connectBroker(id, credentials);
      } else {
        const platform = supportedExchanges[id];
        const credentials = {
          apiKey: authForm.apiKey,
          apiSecret: authForm.apiSecret,
          passphrase: authForm.passphrase || undefined
        };

        await brokerIntegrationService.connectExchange(id, credentials);
      }

      loadConnections();
      setSelectedPlatform(null);
      alert('Successfully connected!');

    } catch (error) {
      alert('Connection failed: ' + error.message);
    } finally {
      setConnecting(false);
    }
  };

  const renderPlatformCard = (platformId, platform, type) => {
    const isConnected = type === 'broker'
      ? connectedBrokers.some(b => b.id === platformId)
      : connectedExchanges.some(e => e.id === platformId);

    return (
      <NeumorphicCard
        key={platformId}
        className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
          selectedPlatform?.id === platformId && selectedPlatform?.type === type
            ? 'ring-2 ring-blue-400 shadow-lg'
            : ''
        }`}
        onClick={() => !isConnected && handlePlatformSelect(platformId, type)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              type === 'broker' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
            }`}>
              {type === 'broker' ? <TrendingUp size={20} /> : <Bitcoin size={20} />}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{platform.name}</h3>
              <p className="text-sm text-gray-500">{platform.authType.replace('-', ' ').toUpperCase()}</p>
            </div>
          </div>
          {isConnected && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle size={16} />
              <span className="text-sm font-medium">Connected</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {platform.supportedAssets.slice(0, 3).map(asset => (
              <span key={asset} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                {asset}
              </span>
            ))}
            {platform.supportedAssets.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                +{platform.supportedAssets.length - 3} more
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1">
            {platform.features.slice(0, 2).map(feature => (
              <span key={feature} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
                {feature}
              </span>
            ))}
          </div>
        </div>

        {!isConnected && (
          <button className="w-full mt-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
            Connect
          </button>
        )}
      </NeumorphicCard>
    );
  };

  const renderAuthForm = () => {
    if (!selectedPlatform) return null;

    const { id, type } = selectedPlatform;
    const platform = type === 'broker' ? supportedBrokers[id] : supportedExchanges[id];

    return (
      <div className="mt-6">
        <NeumorphicCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                type === 'broker' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
              }`}>
                {type === 'broker' ? <TrendingUp size={24} /> : <Bitcoin size={24} />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Connect {platform.name}</h2>
                <p className="text-sm text-gray-600">{platform.authType.replace('-', ' ').toUpperCase()} Authentication</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedPlatform(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {platform.authType === 'api-key' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={authForm.apiKey}
                    onChange={(e) => setAuthForm({...authForm, apiKey: e.target.value})}
                    className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                    placeholder="Enter your API Key"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Secret
                  </label>
                  <input
                    type="password"
                    value={authForm.apiSecret}
                    onChange={(e) => setAuthForm({...authForm, apiSecret: e.target.value})}
                    className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                    placeholder="Enter your API Secret"
                    required
                  />
                </div>

                {(platform.name === 'Coinbase Pro' || platform.name === 'KuCoin' || platform.name === 'OKX') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passphrase
                    </label>
                    <input
                      type="password"
                      value={authForm.passphrase}
                      onChange={(e) => setAuthForm({...authForm, passphrase: e.target.value})}
                      className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                      placeholder="Enter your passphrase"
                    />
                  </div>
                )}
              </>
            )}

            {platform.authType === 'broker-api' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Broker Server
                  </label>
                  <input
                    type="text"
                    value={authForm.brokerServer}
                    onChange={(e) => setAuthForm({...authForm, brokerServer: e.target.value})}
                    className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                    placeholder="e.g., broker.metatrader.com:443"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={authForm.accountNumber}
                    onChange={(e) => setAuthForm({...authForm, accountNumber: e.target.value})}
                    className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                    placeholder="Enter your account number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                    className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </>
            )}

            {platform.authType === 'oauth' && (
              <div className="text-center py-8">
                <div className="mb-4">
                  <ExternalLink size={48} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">OAuth Authentication Required</h3>
                  <p className="text-gray-600 mb-4">
                    You'll be redirected to {platform.name} to authorize access to your account.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setSelectedPlatform(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                disabled={connecting}
              >
                Cancel
              </button>
              <NeumorphicButton
                type="submit"
                variant="action"
                className="flex-1"
                disabled={connecting}
              >
                {connecting ? (
                  <span className="animate-pulse">Connecting...</span>
                ) : (
                  <>
                    <Shield size={18} className="mr-2" />
                    {platform.authType === 'oauth' ? 'Authorize' : 'Connect'}
                  </>
                )}
              </NeumorphicButton>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Security Notice</p>
                <p>Your credentials are encrypted and stored locally. For production use, consider using our secure server-side storage.</p>
              </div>
            </div>
          </div>
        </NeumorphicCard>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Connect Trading Platforms</h1>
        <p className="text-gray-600 mb-8">Link your broker accounts and cryptocurrency exchanges for automatic data synchronization</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-[#e0e5ec] p-1 rounded-xl shadow-inner">
          <button
            onClick={() => setActiveTab('brokers')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'brokers'
                ? 'bg-white shadow-lg text-gray-800'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={18} />
              Brokers
            </div>
          </button>
          <button
            onClick={() => setActiveTab('exchanges')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'exchanges'
                ? 'bg-white shadow-lg text-gray-800'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bitcoin size={18} />
              Crypto Exchanges
            </div>
          </button>
        </div>
      </div>

      {/* Platform Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTab === 'brokers' ? (
          Object.entries(supportedBrokers).map(([id, broker]) =>
            renderPlatformCard(id, broker, 'broker')
          )
        ) : (
          Object.entries(supportedExchanges).map(([id, exchange]) =>
            renderPlatformCard(id, exchange, 'exchange')
          )
        )}
      </div>

      {/* Authentication Form */}
      {renderAuthForm()}

      {/* Connected Platforms Summary */}
      {(connectedBrokers.length > 0 || connectedExchanges.length > 0) && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Connected Platforms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connectedBrokers.map(broker => (
              <NeumorphicCard key={broker.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TrendingUp size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{broker.name}</h3>
                      <p className="text-sm text-gray-500">Broker</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <button
                      onClick={() => {
                        brokerIntegrationService.disconnectBroker(broker.id);
                        loadConnections();
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              </NeumorphicCard>
            ))}

            {connectedExchanges.map(exchange => (
              <NeumorphicCard key={exchange.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Bitcoin size={20} className="text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{exchange.name}</h3>
                      <p className="text-sm text-gray-500">Exchange</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <button
                      onClick={() => {
                        brokerIntegrationService.disconnectExchange(exchange.id);
                        loadConnections();
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              </NeumorphicCard>
            ))}
          </div>
        </div>
      )}

      {/* API Requirements Info */}
      <div className="mt-8">
        <NeumorphicCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings size={24} className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">API Integration Requirements</h3>
          </div>
          <p className="text-gray-600 mb-4">
            For production deployment, additional setup is required for each platform:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Brokers:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• OAuth app registration (Interactive Brokers, Schwab)</li>
                <li>• API key generation (Alpaca, Robinhood)</li>
                <li>• Broker server access (MetaTrader)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Crypto Exchanges:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• API key creation with trading permissions</li>
                <li>• IP whitelist configuration (recommended)</li>
                <li>• 2FA setup for account security</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Current implementation uses local credential storage. For production,
              implement server-side secure storage and API proxying.
            </p>
          </div>
        </NeumorphicCard>
      </div>
    </div>
  );
}
