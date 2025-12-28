import React, { useEffect, useState, useCallback } from 'react';
import { NeumorphicCard } from '@/components/NeumorphicUI';
import { Trophy, TrendingUp, Users, Award, RefreshCw, X, Eye, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { localDataService } from '@/services/localDataService';
import { useAuth } from '@/components/AuthProvider';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchLeaderboard = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setRefreshing(true);

      // Get all trader profiles sorted by elo_score (ELO rating)
      const allProfiles = await localDataService.entities.TraderProfile.list('-elo_score');

      // Transform to leaderboard format
      const leaderboardData = allProfiles
        .filter(profile => profile.trader_score || profile.elo_score) // Accept either field
        .map((profile, index) => ({
          traderId: profile.id,
          traderName: profile.nickname || profile.id,
          tradingType: getTradingType(profile),
          winRate: profile.win_rate || profile.winRate || 0,
          elo: {
            eloScore: profile.elo_score || profile.trader_score || 1000,
            rawScore: profile.elo_score || profile.trader_score || 1000,
            reliability: {
              totalTrades: profile.total_trades || profile.totalTrades || 0,
              confidenceCoefficient: 0.8,
              dataCoverage: 0.9,
              reliabilityMultiplier: 1.0
            },
            category: getELOCategory(profile.elo_score || profile.trader_score || 1000),
            tradingType: getTradingType(profile),
            calculatedAt: profile.updated_at || new Date()
          }
        }));

      setLeaderboard(leaderboardData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Fallback to empty leaderboard
      setLeaderboard([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load and auto-refresh every 30 seconds
  useEffect(() => {
    fetchLeaderboard();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchLeaderboard(false); // Don't show loading for auto-refresh
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  // Helper function to determine ELO category
  const getELOCategory = (eloScore) => {
    if (eloScore >= 3500) return 'Elite';
    if (eloScore >= 3000) return 'Professional';
    if (eloScore >= 2500) return 'Consistent';
    if (eloScore >= 2200) return 'Unstable';
    if (eloScore >= 1800) return 'Developing';
    if (eloScore >= 1400) return 'Intermediate';
    return 'Beginner';
  };

  // Helper function to determine trading type
  const getTradingType = (profile) => {
    // Check if profile already has trading_type saved
    if (profile.trading_type) {
      return profile.trading_type;
    }

    // Check if this is a crypto exchange connection
    if (profile.broker === 'Binance' || profile.broker === 'Bybit') {
      return 'Crypto';
    }

    // Check if this is a live cTrader account
    if (profile.is_live_account === true) {
      return 'Forex';
    }

    // For imported files without explicit trading_type, default to Forex
    if (profile.broker === 'Imported') {
      return 'Forex';
    }

    // Default fallback
    return 'Forex';
  };

  // Function to open profile modal
  const openProfileModal = async (traderId) => {
    try {
      // Find the profile in leaderboard data
      const profile = leaderboard.find(p => p.traderId === traderId);
      if (profile) {
        // Load trades for this profile to get full metrics
        const trades = await localDataService.entities.Trade.filter({ trader_profile_id: traderId });
        setSelectedProfile({ ...profile, trades });
        setProfileModalOpen(true);
      }
    } catch (error) {
      console.error('Error loading profile for modal:', error);
    }
  };

  // Function to close profile modal
  const closeProfileModal = () => {
    setSelectedProfile(null);
    setProfileModalOpen(false);
  };

  const TopTraderPodium = ({ traderData, rank }) => {
    if (!traderData) return null;
    const { traderId, traderName, elo } = traderData;

    const height = rank === 1 ? 'h-48' : rank === 2 ? 'h-40' : 'h-32';
    const color = rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : 'text-orange-400';

    return (
      <div
        className="flex flex-col items-center justify-end cursor-pointer transition-transform hover:-translate-y-2 duration-300"
        onClick={() => openProfileModal(traderId)}
      >
        <div className="mb-4 relative">
          <div className={`w-20 h-20 rounded-full p-1 bg-[#e0e5ec] shadow-[-5px_-5px_10px_#ffffff,5px_5px_10px_#a3b1c6] z-10 relative`}>
             <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center">
               <Users size={24} className="text-gray-600" />
             </div>
          </div>
          <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#e0e5ec] flex items-center justify-center text-xs font-bold shadow-[2px_2px_4px_#a3b1c6,-2px_-2px_4px_#ffffff] ${color}`}>
            {rank}
          </div>
        </div>
        <div className="mb-2 text-center">
           <p className="font-bold text-gray-700">{traderName || traderId}</p>
           <div className="flex flex-col items-center">
             <div className="flex items-center gap-1">
               <Award size={16} style={{ color: getELOColor(elo.eloScore) }} />
               <p className="font-bold text-xl" style={{ color: getELOColor(elo.eloScore) }}>
                 {elo.eloScore.toFixed(1)}
               </p>
             </div>
             <p className="text-xs text-gray-600">{elo.category} • {tradingType}</p>
           </div>
           </div>
        <div className={`${height} w-24 bg-[#e0e5ec] rounded-t-2xl shadow-[-5px_-5px_10px_#ffffff,5px_5px_10px_#a3b1c6] mx-2 flex items-end justify-center pb-4`}>
           <Trophy className={`${color}`} size={24} />
        </div>
      </div>
    );
  };

  // Helper function to get ELO color
  const getELOColor = (score) => {
    if (score >= 3500) return '#FFD700'; // Gold
    if (score >= 3000) return '#C0C0C0'; // Silver
    if (score >= 2500) return '#CD7F32'; // Bronze
    if (score >= 2200) return '#EF4444'; // Red
    if (score >= 1800) return '#06B6D4'; // Cyan
    if (score >= 1400) return '#3B82F6'; // Blue
    return '#6B7280'; // Gray
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-4xl font-bold text-gray-800">Global ELO Leaderboard</h1>
          <button
            onClick={() => fetchLeaderboard()}
            disabled={refreshing}
            className="p-2 rounded-full bg-[#e0e5ec] shadow-[-3px_-3px_6px_#ffffff,3px_3px_6px_#a3b1c6] hover:shadow-[-1px_-1px_2px_#ffffff,1px_1px_2px_#a3b1c6] transition-all disabled:opacity-50"
            title="Refresh Leaderboard"
          >
            <RefreshCw size={20} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-gray-500 mb-2">Top performing traders ranked by Trader ELO score</p>
        {lastUpdated && (
          <p className="text-xs text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Podium for Top 3 */}
      {!loading && leaderboard.length >= 3 && (
        <div className="flex justify-center items-end gap-4 mb-16">
          <TopTraderPodium traderData={leaderboard[1]} rank={2} />
          <TopTraderPodium traderData={leaderboard[0]} rank={1} />
          <TopTraderPodium traderData={leaderboard[2]} rank={3} />
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {/* Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
          <div className="col-span-1">Rank</div>
          <div className="col-span-4">Trader</div>
          <div className="col-span-2 text-right">ELO Score</div>
          <div className="col-span-1 text-right">Type</div>
          <div className="col-span-2 text-right">WinRate</div>
          <div className="col-span-2 text-right">Trades</div>
          </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading leaderboard...</div>
        ) : (
          leaderboard.map((item, index) => {
            const { traderId, traderName, elo, tradingType } = item;
            return (
            <NeumorphicCard
                key={traderId}
              className="grid grid-cols-2 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:scale-[1.01] transition-transform cursor-pointer"
                onClick={() => openProfileModal(traderId)}
            >
              {/* Rank */}
              <div className="col-span-1 hidden md:block">
                <span className={`
                  font-bold text-lg
                  ${index < 3 ? 'text-gray-800' : 'text-gray-500'}
                `}>
                  #{index + 1}
                </span>
              </div>

              {/* Trader Info */}
              <div className="col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shadow-inner flex-shrink-0 flex items-center justify-center">
                    <Users size={20} className="text-gray-500" />
                </div>
                <div>
                    <p className="font-bold text-gray-700">{traderName || traderId}</p>
                    <p className="text-xs text-gray-400 md:hidden">#{index + 1}</p>
                </div>
              </div>

                {/* ELO Score */}
              <div className="col-span-2 text-right">
                 <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1">
                        <Award size={14} style={{ color: getELOColor(elo.eloScore) }} />
                        <span className="font-bold text-lg" style={{ color: getELOColor(elo.eloScore) }}>
                          {elo.eloScore.toFixed(1)}
                    </span>
                      </div>
                      <span className="text-xs text-gray-400 block md:hidden">ELO</span>
                 </div>
              </div>

              {/* Trading Type */}
              <div className="hidden md:block col-span-1 text-right">
                   <span className="text-sm font-medium" style={{
                     color: tradingType === 'Crypto' ? '#f97316' : '#3b82f6'
                   }}>
                     {tradingType}
                   </span>
              </div>

                {/* WinRate */}
              <div className="hidden md:block col-span-2 text-right">
                  <span className="font-medium text-gray-600">{item.winRate ? item.winRate.toFixed(1) + '%' : '0.0%'}</span>
              </div>

              {/* Total Trades */}
              <div className="hidden md:block col-span-2 text-right">
                  <span className="font-medium text-gray-600">{elo.reliability.totalTrades || 0}</span>
              </div>
            </NeumorphicCard>
            );
          })
        )}
      </div>

      {/* Profile Modal */}
      {profileModalOpen && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#e0e5ec] p-1 shadow-[-6px_-6px_12px_#ffffff,6px_6px_12px_#a3b1c6]">
                  <img src={selectedProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedProfile.traderId}`} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedProfile.traderName || selectedProfile.traderId}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedProfile.tradingType === 'Crypto'
                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {selectedProfile.tradingType === 'Crypto' ? (
                        <>
                          <BarChart3 size={12} className="mr-1" />
                          Crypto Trading
                        </>
                      ) : (
                        <>
                          <TrendingUp size={12} className="mr-1" />
                          Forex Trading
                        </>
                      )}
                    </div>
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                      <Eye size={12} className="mr-1" />
                      Public View
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={closeProfileModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* ELO Score */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                  <Award size={20} style={{ color: getELOColor(selectedProfile.elo.eloScore) }} />
                  <span className="text-2xl font-bold" style={{ color: getELOColor(selectedProfile.elo.eloScore) }}>
                    {selectedProfile.elo.eloScore.toFixed(1)}
                  </span>
                  <span className="text-gray-600">ELO</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{selectedProfile.elo.category}</p>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-blue-700">{selectedProfile.elo.performance_score || 0}</div>
                  <div className="text-sm text-blue-600">Performance</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-green-700">{selectedProfile.elo.risk_score || 0}</div>
                  <div className="text-sm text-green-600">Risk Control</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-yellow-700">{selectedProfile.elo.consistency_score || 0}</div>
                  <div className="text-sm text-yellow-600">Consistency</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-purple-700">{selectedProfile.elo.account_health_score || 0}</div>
                  <div className="text-sm text-purple-600">Health</div>
                </div>
              </div>

              {/* Trading Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                  <div className="text-xl font-bold text-gray-800">{selectedProfile.winRate ? selectedProfile.winRate.toFixed(1) + '%' : '0.0%'}</div>
                  <div className="text-sm text-gray-600">Win Rate</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                  <div className="text-xl font-bold text-gray-800">{selectedProfile.elo.totalTrades || 0}</div>
                  <div className="text-sm text-gray-600">Total Trades</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                  <div className="text-xl font-bold text-gray-800">{selectedProfile.profit_percentage ? selectedProfile.profit_percentage.toFixed(2) + '%' : '0.00%'}</div>
                  <div className="text-sm text-gray-600">Total Return</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                  <div className="text-xl font-bold text-gray-800">{selectedProfile.annualized_return ? selectedProfile.annualized_return.toFixed(2) + '%' : '0.00%'}</div>
                  <div className="text-sm text-gray-600">Annual Return</div>
                </div>
              </div>

              {/* Rank Info */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl text-center">
                <div className="text-lg font-semibold text-gray-800">
                  Global Rank: #{leaderboard.findIndex(p => p.traderId === selectedProfile.traderId) + 1}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Out of {leaderboard.length} traders
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}