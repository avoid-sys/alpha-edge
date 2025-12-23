import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { NeumorphicButton } from '@/components/NeumorphicUI';
import { Upload, Zap } from 'lucide-react';

export default function Connect() {

  const handleConnectCTrader = () => {
    const state = crypto.randomUUID(); // More secure than Math.random
    localStorage.setItem('ctrader_state', state);

    const redirectUri = window.location.protocol + '//' + window.location.host + '/auth/ctrader/callback';
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: import.meta.env.VITE_CTRADER_CLIENT_ID,
      redirect_uri: encodeURIComponent(redirectUri),
      scope: 'trading accounts', // Important: trading for deals access, accounts for account list
      state: state
    });

    // Updated auth URL
    const authUrl = `https://connect.spotware.com/apps/auth?${params.toString()}`;
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

        <div>
          <NeumorphicButton onClick={handleConnectCTrader} className="w-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
            <Zap size={20} className="mr-2" />
            Connect cTrader Live
          </NeumorphicButton>
          <p className="text-xs text-gray-500 mt-1 text-center">Connect directly to your cTrader account</p>
        </div>
      </div>

    </div>
  );
}
