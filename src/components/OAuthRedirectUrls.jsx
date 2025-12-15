import React, { useState } from 'react';
import { NeumorphicCard } from './NeumorphicUI';
import { brokerIntegrationService } from '../services/brokerIntegrationService';
import { ExternalLink, Copy, CheckCircle } from 'lucide-react';

export default function OAuthRedirectUrls() {
  const [copiedUrl, setCopiedUrl] = useState(null);

  const oauthUrls = brokerIntegrationService.getOAuthRedirectUrls();

  const copyToClipboard = async (url, type) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(`${type}-${url}`);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedUrl(`${type}-${url}`);
        setTimeout(() => setCopiedUrl(null), 2000);
      } catch (fallbackErr) {
        console.error('Failed to copy text: ', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  if (Object.keys(oauthUrls).length === 0) {
    return null;
  }

  return (
    <NeumorphicCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <ExternalLink size={24} className="text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-800">OAuth Redirect URLs</h3>
          <p className="text-sm text-gray-600">Configure these URLs in your OAuth applications</p>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(oauthUrls).map(([platformId, urls]) => (
          <div key={platformId} className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">{urls.name}</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Production URL
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono text-gray-800 break-all">
                    {urls.productionUrl}
                  </code>
                  <button
                    onClick={() => copyToClipboard(urls.productionUrl, 'prod')}
                    className={`p-2 rounded-lg transition-colors ${
                      copiedUrl === `prod-${urls.productionUrl}`
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                    title="Copy to clipboard"
                  >
                    {copiedUrl === `prod-${urls.productionUrl}` ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Development URL
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono text-gray-800 break-all">
                    {urls.developmentUrl}
                  </code>
                  <button
                    onClick={() => copyToClipboard(urls.developmentUrl, 'dev')}
                    className={`p-2 rounded-lg transition-colors ${
                      copiedUrl === `dev-${urls.developmentUrl}`
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                    title="Copy to clipboard"
                  >
                    {copiedUrl === `dev-${urls.developmentUrl}` ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                Configure this redirect URL in your {urls.name} OAuth application settings.
                The URL should be added to the "Authorized Redirect URIs" or equivalent field.
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">Setup Instructions:</h4>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
          <li>Create OAuth application in the broker's developer portal</li>
          <li>Add the appropriate redirect URL(s) to the application settings</li>
          <li>Obtain Client ID and Client Secret from the application</li>
          <li>Configure environment variables or secure storage for the credentials</li>
          <li>Implement OAuth callback handler on your server</li>
        </ol>
      </div>
    </NeumorphicCard>
  );
}