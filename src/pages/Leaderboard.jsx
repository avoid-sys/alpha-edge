import React, { useEffect, useState } from 'react';
import { NeumorphicCard } from '@/components/NeumorphicUI';
import { Trophy, TrendingUp, Users, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { localDataService } from '@/services/localDataService';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Get all trader profiles sorted by elo_score (ELO rating)
        const allProfiles = await localDataService.entities.TraderProfile.list('-elo_score');

        // Transform to leaderboard format
        const leaderboardData = allProfiles
          .filter(profile => profile.trader_score || profile.elo_score) // Accept either field
          .map((profile, index) => ({
            traderId: profile.id,
            traderName: profile.nickname || profile.id,
            tradingType: getTradingType(profile),
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
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        // Fallback to empty leaderboard
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

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
    // Check if this is a crypto exchange connection
    if (profile.broker === 'Binance' || profile.broker === 'Bybit') {
      return 'Crypto';
    }

    // Check if this is a live cTrader account
    if (profile.is_live_account === true) {
      return 'Forex';
    }

    // For imported files, try to determine from broker field or default to Forex
    if (profile.broker === 'Imported') {
      // Could be enhanced to detect from trade symbols or other data
      return 'Forex'; // Default for imported files
    }

    // Default fallback
    return 'Forex';
  };

  const TopTraderPodium = ({ traderData, rank }) => {
    if (!traderData) return null;
    const { traderId, traderName, elo } = traderData;

    const height = rank === 1 ? 'h-48' : rank === 2 ? 'h-40' : 'h-32';
    const color = rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : 'text-orange-400';

    return (
      <div
        className="flex flex-col items-center justify-end cursor-pointer transition-transform hover:-translate-y-2 duration-300"
        onClick={() => navigate(createPageUrl(`Dashboard?profileId=${traderId}`))}
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
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Global ELO Leaderboard</h1>
        <p className="text-gray-500">Top performing traders ranked by Trader ELO score</p>
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
          <div className="col-span-3">Trader</div>
          <div className="col-span-2 text-right">ELO Score</div>
          <div className="col-span-1 text-right">Category</div>
          <div className="col-span-1 text-right">Type</div>
          <div className="col-span-2 text-right">Confidence</div>
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
                onClick={() => navigate(createPageUrl(`Dashboard?profileId=${traderId}`))}
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
              <div className="col-span-3 flex items-center gap-3">
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

                {/* Category */}
              <div className="hidden md:block col-span-1 text-right">
                   <span className="font-medium text-gray-600">{elo.category}</span>
              </div>

              {/* Trading Type */}
              <div className="hidden md:block col-span-1 text-right">
                   <span className="text-sm font-medium" style={{
                     color: tradingType === 'Crypto' ? '#f97316' : '#3b82f6'
                   }}>
                     {tradingType}
                   </span>
              </div>

                {/* Confidence */}
              <div className="hidden md:block col-span-2 text-right">
                  <span className="font-medium text-gray-600">{((elo.reliability.confidenceCoefficient || 0.8) * 100).toFixed(1)}%</span>
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
    </div>
  );
}