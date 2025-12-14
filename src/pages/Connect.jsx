import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { NeumorphicCard, NeumorphicButton } from '../components/NeumorphicUI';
import { ShieldCheck, Server, AlertCircle, Upload, Zap } from 'lucide-react';

export default function Connect() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    broker: 'MetaTrader 5',
    accountId: '',
    password: ''
  });

  console.log('Connect component rendering');

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="text-center mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-3">Connect Account</h1>
        <p className="text-gray-500 text-sm sm:text-base">Link your trading account to start tracking your performance.</p>
      </div>

      <div className="w-full max-w-md mb-4 sm:mb-6 space-y-4">
        <div>
          <Link to={createPageUrl('broker-exchange-connect')}>
            <NeumorphicButton className="w-full flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
              <Zap size={20} className="mr-2 text-blue-600" />
              Connect Brokers & Exchanges
            </NeumorphicButton>
          </Link>
          <p className="text-xs text-gray-500 mt-1 text-center">API integration with 14+ platforms</p>
        </div>

        <div className="flex items-center gap-4 my-4">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <div>
          <Link to={createPageUrl('ImportTrades')}>
            <NeumorphicButton className="w-full flex items-center justify-center bg-white">
              <Upload size={20} className="mr-2" />
              Import HTML Statement
            </NeumorphicButton>
          </Link>
          <p className="text-xs text-gray-500 mt-1 text-center">Upload trading statements from any broker</p>
        </div>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 mb-2">Manual Account Connection</p>
          <p className="text-xs text-gray-500">Connect directly to your trading platform</p>
        </div>
      </div>

      <NeumorphicCard className="w-full max-w-md p-4 sm:p-8">
        <div className="flex items-center gap-3 mb-8 p-4 bg-yellow-50/50 rounded-xl border border-yellow-100 text-yellow-700 text-sm">
          <AlertCircle size={20} />
          <p>Only a connected live account is qualified for the global leaderboard. Uploaded files or demo accounts are not eligible for the global leaderboard, will be visible only to the account owner, and will not be used as a performance metric for trader selection.</p>
        </div>

        <form className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 ml-1">Trading Platform</label>
            <div className="relative">
              <select
                className="w-full bg-[#e0e5ec] rounded-xl px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] text-gray-700 appearance-none cursor-pointer"
                value={formData.broker}
                onChange={e => setFormData({...formData, broker: e.target.value})}
              >
                <option>MetaTrader 4</option>
                <option>MetaTrader 5</option>
                <option>cTrader</option>
                <option>TradeLocker</option>
              </select>
              <Server className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 ml-1">Account Login ID</label>
            <input
              type="text"
              className="w-full bg-[#e0e5ec] rounded-xl px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] text-gray-700 placeholder-gray-400"
              placeholder="e.g. 8839201"
              value={formData.accountId}
              onChange={e => setFormData({...formData, accountId: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 ml-1">Read-Only Password</label>
            <input
              type="password"
              className="w-full bg-[#e0e5ec] rounded-xl px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] text-gray-700 placeholder-gray-400"
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div className="pt-4">
            <NeumorphicButton variant="action" className="w-full flex items-center justify-center" disabled={loading}>
              {loading ? (
                <span className="animate-pulse">Connecting...</span>
              ) : (
                <>
                  <ShieldCheck size={20} className="mr-2" />
                  Connect Account
                </>
              )}
            </NeumorphicButton>
          </div>
        </form>
      </NeumorphicCard>

      <p className="mt-8 text-xs text-gray-400">
        By connecting your account, you agree to our Terms of Service.
        We only require read-only access to verify your trade history.
      </p>
    </div>
  );
}
