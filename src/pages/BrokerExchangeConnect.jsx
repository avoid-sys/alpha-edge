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
            const clientId = import.meta.env.VITE_CTRADER_CLIENT_ID;

            // URLs зашиты в конфиге brokerIntegrationService, здесь проверяем только clientId
            if (!clientId) {
              alert(
                `${platform.name} OAuth is not fully configured. Please set VITE_CTRADER_CLIENT_ID in your .env.`
              );
              return;
            }

            // Use production redirect_uri or localhost for development
            // IMPORTANT: This redirect_uri MUST exactly match the one registered in cTrader app settings
            // Check: https://connect.spotware.com/apps - your app - Redirect URLs section
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const redirectUri = isLocalhost
              ? `${window.location.origin}/auth/ctrader/callback`
              : (oauth.redirectUri || 'https://alphaedge.vc/auth/ctrader/callback');

            // Log redirect_uri for debugging - must match exactly in cTrader app settings
            console.log('cTrader OAuth - Redirect URI:', redirectUri);
            console.log('⚠️  Make sure this EXACT URI is registered in cTrader app settings:');
            console.log('   https://connect.spotware.com/apps → Your App → Redirect URLs');
            console.log('   Expected: https://alphaedge.vc/auth/ctrader/callback');

            // cTrader authorization URL - must NOT have trailing slash
            let authUrl = (oauth.authUrl || 'https://id.ctrader.com/my/settings/openapi/grantingaccess').replace(/\/$/, '');
            const rawScope = oauth.scope || 'accounts trading';

            const state = `${id}-${Date.now()}`;
            
            // Build URL with proper encoding - each parameter encoded separately
            const params = new URLSearchParams({
              client_id: clientId,
              redirect_uri: redirectUri,
              scope: rawScope, // URLSearchParams will encode this properly
              product: 'web',
              state: state
            });
            
            const url = `${authUrl}?${params.toString()}`;

            // Log full authorization URL for debugging
            console.log('cTrader OAuth - Full Authorization URL:', url);
            console.log('cTrader OAuth - Parameters:', {
              client_id: clientId,
              redirect_uri: redirectUri,
              encoded_redirect_uri: encodedRedirectUri,
              scope: rawScope,
              product: 'web',
              state: state,
              encoded_state: encodedState
            });
            console.log('✅ About to redirect to cTrader. After authorization, you will be redirected back with code parameter.');

            // Сохраняем state для проверки в колбэке
            localStorage.setItem('ctrader_state', encodedState);
            console.log('💾 Saved state to localStorage:', encodedState.substring(0, 20) + '...');

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
