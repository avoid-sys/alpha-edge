import React, { useEffect, useState } from 'react';
import { localDataService } from '../services/localDataService';
import { NeumorphicCard } from '../components/NeumorphicUI';
import { Trophy, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Leaderboard() {
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTraders = async () => {
      try {
        // Only show live connected accounts on leaderboard
        const allProfiles = await localDataService.entities.TraderProfile.list('-trader_score', 100);
        const liveAccounts = allProfiles.filter(profile => profile.is_live_account === true);
        setTraders(liveAccounts.slice(0, 50)); // Limit to top 50
      } catch (error) {
        console.error('Error fetching traders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTraders();
  }, []);

  const TopTraderPodium = ({ trader, rank }) => {
    if (!trader) return null;
    const height = rank === 1 ? 'h-48' : rank === 2 ? 'h-40' : 'h-32';
    const color = rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : 'text-orange-400';
    
    return (
      <div 
        className="flex flex-col items-center justify-end cursor-pointer transition-transform hover:-translate-y-2 duration-300"
        onClick={() => navigate(createPageUrl(`Dashboard?profileId=${trader.id}`))}
      >
        <div className="mb-4 relative">
          <div className={`w-20 h-20 rounded-full p-1 bg-[#e0e5ec] shadow-[-5px_-5px_10px_#ffffff,5px_5px_10px_#a3b1c6] z-10 relative`}>
             <img src={trader.avatar_url} className="w-full h-full rounded-full object-cover" alt={trader.nickname} />
          </div>
          <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#e0e5ec] flex items-center justify-center text-xs font-bold shadow-[2px_2px_4px_#a3b1c6,-2px_-2px_4px_#ffffff] ${color}`}>
            {rank}
          </div>
        </div>
        <div className="mb-2 text-center">
           <p className="font-bold text-gray-700">{trader.nickname}</p>
           <div className="flex flex-col items-center">
             <p className="text-blue-600 font-bold text-xl">{trader.trader_score}</p>
             <p className="text-green-500 font-bold text-xs">+{trader.profit_percentage}% Profit</p>
           </div>
           </div>
        <div className={`${height} w-24 bg-[#e0e5ec] rounded-t-2xl shadow-[-5px_-5px_10px_#ffffff,5px_5px_10px_#a3b1c6] mx-2 flex items-end justify-center pb-4`}>
           <Trophy className={`${color}`} size={24} />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Global Leaderboard</h1>
        <p className="text-gray-500">Top performing traders ranked by profitability</p>
      </div>

      {/* Podium for Top 3 */}
      {!loading && traders.length >= 3 && (
        <div className="flex justify-center items-end gap-4 mb-16">
          <TopTraderPodium trader={traders[1]} rank={2} />
          <TopTraderPodium trader={traders[0]} rank={1} />
          <TopTraderPodium trader={traders[2]} rank={3} />
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {/* Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
          <div className="col-span-1">Rank</div>
          <div className="col-span-3">Trader</div>
          <div className="col-span-2 text-right">Score</div>
          <div className="col-span-2 text-right">Profit</div>
          <div className="col-span-2 text-right">Win Rate</div>
          <div className="col-span-2 text-right">Trades</div>
          </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading leaderboard...</div>
        ) : (
          traders.map((trader, index) => (
            <NeumorphicCard 
              key={trader.id} 
              className="grid grid-cols-2 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:scale-[1.01] transition-transform cursor-pointer"
              onClick={() => navigate(createPageUrl(`Dashboard?profileId=${trader.id}`))}
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
              <div className="col-span-2 md:col-span-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shadow-inner flex-shrink-0">
                  <img src={trader.avatar_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-gray-700">{trader.nickname}</p>
                  <p className="text-xs text-gray-400 md:hidden">#{index + 1} • {trader.broker}</p>
                </div>
              </div>

              {/* Score */}
              <div className="col-span-1 md:col-span-2 text-right">
                 <div className="flex flex-col items-end">
                    <span className="font-bold text-lg text-blue-600">
                      {trader.trader_score}
                    </span>
                    <span className="text-xs text-gray-400 block md:hidden">Score</span>
                 </div>
              </div>

              {/* Profit */}
              <div className="hidden md:block col-span-2 text-right">
                 <span className={`font-bold ${trader.profit_percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                   {trader.profit_percentage > 0 ? '+' : ''}{trader.profit_percentage}%
                 </span>
              </div>

              {/* Win Rate */}
              <div className="hidden md:block col-span-2 text-right">
                <span className="font-medium text-gray-600">{trader.win_rate}%</span>
              </div>

              {/* Total Trades */}
              <div className="hidden md:block col-span-2 text-right">
                <span className="font-medium text-gray-600">{trader.total_trades}</span>
              </div>

              {/* Streak (Removed to fit columns, or just hidden) */}
              {/* 
              <div className="hidden md:block col-span-2 text-right">
                 ...
              </div> 
              */}
            </NeumorphicCard>
          ))
        )}
      </div>
    </div>
  );
}