import React, { useEffect, useState } from 'react';
import { localDataService } from '@/services/localDataService';
import { securityService } from '@/services/securityService';
import { brokerIntegrationService } from '@/services/brokerIntegrationService';
import { getBybitAccountData } from '@/services/bybitApi';
import { createPageUrl } from '@/utils';
import { Link, useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Award,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  HelpCircle,
  X,
  Edit2,
  Check,
  Bitcoin
} from 'lucide-react';
import { NeumorphicCard, StatBox, NeumorphicButton } from '@/components/NeumorphicUI';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Legend
} from 'recharts';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [trades, setTrades] = useState([]);
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('1W'); // '1W', '1M', 'ALL'
  const [dataVersion, setDataVersion] = useState(0); // Force refresh counter
  const [helpPopup, setHelpPopup] = useState(null); // Current help popup
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [connectedBrokers, setConnectedBrokers] = useState([]);
  const [connectedExchanges, setConnectedExchanges] = useState([]);
  const [bybitAccount, setBybitAccount] = useState(null);
  const [bybitLoading, setBybitLoading] = useState(false);
  const [bybitError, setBybitError] = useState(null);

  const [searchParams] = useSearchParams();
  const profileId = searchParams.get('profileId');
  const refreshParam = searchParams.get('refresh');

  // Check if user is viewing their own profile or someone else's
  const isOwnProfile = !profileId; // No profileId means viewing own profile

  // Force data refresh when refresh parameter is detected
  useEffect(() => {
    if (refreshParam) {
      setDataVersion(prev => prev + 1);
    }
  }, [refreshParam]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let fetchedProfile = null;
        let fetchedTrades = [];

        if (profileId) {
          fetchedProfile = await localDataService.entities.TraderProfile.get(profileId);
          fetchedTrades = await localDataService.entities.Trade.filter({ trader_profile_id: profileId });
        } else {
          try {
            const user = await localDataService.getCurrentUser();
            if (user) {
              const profiles = await localDataService.entities.TraderProfile.filter({
                created_by: user.email
              });
              if (profiles.length > 0) {
                // Prefer a live account profile if available
                const liveProfile = profiles.find(p => p.is_live_account);
                fetchedProfile = liveProfile || profiles[0];
                fetchedTrades = await localDataService.entities.Trade.filter({ trader_profile_id: fetchedProfile.id });
              }
            }
          } catch (e) {
            // Not logged in or no profile
          }
        }

        // If no profile exists yet but there are connected platforms (broker or exchange),
        // automatically create a live account profile so the dashboard doesn't stay empty.
        if (!fetchedProfile) {
          const liveBrokers = brokerIntegrationService.getConnectedBrokers().map(b => ({ ...b, _type: 'broker' }));
          const liveExchanges = brokerIntegrationService.getConnectedExchanges().map(e => ({ ...e, _type: 'exchange' }));
          const livePlatforms = [...liveBrokers, ...liveExchanges];

          if (livePlatforms.length > 0) {
            const primary = livePlatforms[0];

            // Ensure we have a current user (reuse logic from ImportTrades)
            let user = await localDataService.getCurrentUser();
            if (!user) {
              user = {
                email: securityService.sanitizeInput('local@alphaedge.com', 'email'),
                full_name: securityService.sanitizeInput('Live Trader', 'text')
              };
              await localDataService.setCurrentUser(user);
            }

            const nickname = securityService.sanitizeInput(
              `${primary.name || 'Live Account'}`,
              'text'
            );

            const newProfile = await localDataService.entities.TraderProfile.create({
              nickname,
              broker: primary.name || 'Live Account',
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}-${primary.id}`,
              created_by: user.email,
              is_live_account: true,
              external_platform_id: primary.id,
              external_platform_type: primary._type
            });

            fetchedProfile = newProfile;
            fetchedTrades = [];
          }
        }

        // Calculate rank based on trader score - only for live connected accounts
        if (fetchedProfile && fetchedProfile.is_live_account) {
          const allProfiles = await localDataService.entities.TraderProfile.list('-trader_score');
          // Filter to only live accounts
          const liveProfiles = allProfiles.filter(p => p.is_live_account);
          const userRank = liveProfiles.findIndex(p => p.id === fetchedProfile.id) + 1;
          setRank(userRank);
        } else {
          setRank(null); // No rank for demo/file-only accounts
        }

        if (fetchedProfile) {
          // Use real data from uploaded files (if any) or show live profile with placeholder stats
          setProfile(fetchedProfile);
          setTrades(fetchedTrades || []);
        } else {
          // Show empty state - no profile and no connections
          setProfile(null);
          setTrades([]);
        }
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profileId, dataVersion]);

  // Initialize security and load connected platforms on component mount
  useEffect(() => {
    securityService.startSession();
    securityService.logSecurityEvent('dashboard_accessed', { profileId });

    // Load connected platforms
    setConnectedBrokers(brokerIntegrationService.getConnectedBrokers());
    setConnectedExchanges(brokerIntegrationService.getConnectedExchanges());
  }, []);

  // Handle name editing
  const handleEditName = () => {
    setEditedName(profile.nickname);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) return;

    try {
      const oldName = profile.nickname;
      await localDataService.entities.TraderProfile.update(profile.id, {
        nickname: editedName.trim()
      });
      setProfile({ ...profile, nickname: editedName.trim() });
      setIsEditingName(false);

      // Persist an account event so the system remembers this change
      try {
        const user = await localDataService.getCurrentUser();
        await localDataService.entities.AccountEvent.create({
          type: 'PROFILE_NAME_UPDATED',
          user_email: user?.email || null,
          profile_id: profile.id,
          description: 'Trader nickname updated',
          metadata: {
            old_nickname: oldName,
            new_nickname: editedName.trim()
          }
        });
      } catch (e) {
        // Non‑critical; don't block UI if logging fails
        console.warn('Failed to record account event for name change', e);
      }
    } catch (error) {
      console.error('Error updating name:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  // Optional: on-demand Bybit sync using user-supplied keys (kept only in memory)
  const handleSyncBybit = async () => {
    const bybit = connectedExchanges.find((ex) => ex.id === 'bybit');
    if (!bybit) {
      alert('Bybit exchange is not connected. Please connect it in Connect Platforms.');
      return;
    }

    setBybitLoading(true);
    setBybitError(null);

    try {
      // Example: unified account wallet balance
      const data = await getBybitAccountData('/v5/account/wallet-balance', {
        accountType: 'UNIFIED'
      });

      // Try to normalize a small summary for display
      const rawList = data?.result?.list || data?.result?.balances || [];
      const first = Array.isArray(rawList) && rawList.length > 0 ? rawList[0] : null;

      const summary = {
        raw: data,
        totalEquity: first?.totalEquity || first?.equity || null,
        accountType: first?.accountType || 'UNIFIED',
        coin: first?.coin?.[0]?.coin || first?.coin || null
      };

      setBybitAccount(summary);
    } catch (err) {
      console.error('Failed to load Bybit account data', err);
      setBybitError(err?.message || 'Failed to load Bybit account data');
      setBybitAccount(null);
    } finally {
      setBybitLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-[50vh] text-gray-400">Loading statistics...</div>;

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="w-24 h-24 bg-[#e0e5ec] rounded-full shadow-[-8px_-8px_16px_#ffffff,8px_8px_16px_#a3b1c6] flex items-center justify-center mb-8">
          <Activity size={40} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">{profileId ? 'Trader Not Found' : 'No Trading Account Found'}</h2>
        <p className="text-gray-500 mb-8">{profileId ? 'The requested trader profile does not exist.' : 'Connect your live trading account to view your dashboard.'}</p>
        {!profileId && (
          <Link to={createPageUrl('Connect')}>
            <NeumorphicButton variant="action">Connect Account</NeumorphicButton>
          </Link>
        )}
        {profileId && (
          <Link to={createPageUrl('Leaderboard')}>
             <NeumorphicButton>Back to Leaderboard</NeumorphicButton>
          </Link>
        )}
      </div>
    );
  }


  // Get current balance from last trade or account data
  const getCurrentBalance = (tradeList) => {
    if (tradeList.length > 0) {
      // Sort trades by date and get the latest balance
      const sortedTrades = [...tradeList].sort((a, b) => new Date(b.close_time) - new Date(a.close_time));
      const latestTrade = sortedTrades[0];
      return parseFloat(latestTrade.balance || 0).toFixed(2);
    }
    return '0.00'; // No trades yet
  };

  // Calculate equity curve data as percentages from initial balance
  const getEquityData = () => {
    if (trades.length === 0) return [];

    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => new Date(a.close_time) - new Date(b.close_time));

    // Calculate initial balance
    let initialBalance = 10000; // Default
    if (sortedTrades.length > 0 && sortedTrades[0].balance) {
      // Use actual balance data if available
      initialBalance = sortedTrades[0].balance - sortedTrades[0].net_profit;
    }

    const equityPoints = sortedTrades.map((trade) => ({
      name: new Date(trade.close_time).toLocaleDateString(),
      value: initialBalance > 0 ? ((parseFloat(trade.balance || 0) - initialBalance) / initialBalance) * 100 : 0
    }));

    // Filter based on selected period
    let filteredPoints = equityPoints;
    const now = new Date();

    switch (chartPeriod) {
      case '1W':
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredPoints = equityPoints.filter(point => {
          const pointDate = new Date(point.name);
          return pointDate >= oneWeekAgo;
        });
        break;
      case '1M':
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredPoints = equityPoints.filter(point => {
          const pointDate = new Date(point.name);
          return pointDate >= oneMonthAgo;
        });
        break;
      case 'ALL':
        // Keep all points
        break;
      default:
        filteredPoints = equityPoints.slice(-7);
    }

    return filteredPoints;
  };

  const equityData = profile ? getEquityData() : [];

  // Help content for each metric
  const helpContent = {
    performance: {
      title: "Performance Score",
      description: "Overall performance rating combining annualized return, win rate, risk/reward ratio, and expectancy. Higher scores indicate better trading performance.",
      metrics: {
        "Ann. Return": "Annualized return percentage based on total profit over trading period",
        "Win Rate": "Percentage of profitable trades out of total trades",
        "R/R": "Risk/Reward ratio - average profit divided by average loss",
        "Expectancy": "Average profit per trade in account currency"
      }
    },
    risk: {
      title: "Risk Control Score",
      description: "Risk management effectiveness combining maximum drawdown, volatility, and risk per trade. Higher scores indicate better risk control.",
      metrics: {
        "Max DD": "Maximum Drawdown - largest peak-to-trough decline in account equity",
        "Volatility": "Standard deviation of returns - measures return variability",
        "Risk/Trade": "Average risk exposure per trade as percentage of account"
      }
    },
    consistency: {
      title: "Consistency Score",
      description: "Trading consistency measuring equity curve smoothness, monthly profitability, and trade frequency stability. Higher scores indicate more consistent performance.",
      metrics: {
        "Roughness": "Measure of equity curve smoothness (1 - R²)",
        "Positive Mos": "Monthly positive ratio - percentage of profitable months",
        "Freq Std": "Trade frequency standard deviation - consistency of trading activity"
      }
    },
    health: {
      title: "Account Health Score",
      description: "Overall account status considering violations, leverage usage, and risk limit breaches. Higher scores indicate healthier account management.",
      metrics: {
        "Violations": "Number of trading rule violations",
        "Leverage": "Excessive leverage usage incidents",
        "Risk Limit": "Number of risk limit breaches"
      }
    }
  };

  // Help popup component
  const HelpPopup = ({ metric, onClose }) => {
    if (!helpContent[metric]) return null;

    const content = helpContent[metric];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-lg p-6 max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">{content.title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">{content.description}</p>

          {content.metrics && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Component Metrics:</h4>
              <div className="space-y-2">
                {Object.entries(content.metrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start text-sm">
                    <span className="font-medium text-gray-700 min-w-0 flex-1">{key}:</span>
                    <span className="text-gray-600 ml-2 flex-1">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#e0e5ec] p-1 shadow-[-6px_-6px_12px_#ffffff,6px_6px_12px_#a3b1c6] mx-auto sm:mx-0">
            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
          </div>
          <div className="text-center sm:text-left">
            {isEditingName ? (
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-xl sm:text-3xl font-bold text-gray-800 bg-[#e0e5ec] rounded-lg px-3 py-1 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] w-full max-w-xs"
                  placeholder="Enter your name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <button
                  onClick={handleSaveName}
                  className="p-2 bg-green-100 rounded-lg text-green-600 hover:bg-green-200 transition-colors"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 bg-red-100 rounded-lg text-red-600 hover:bg-red-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <h1 className="text-xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left">{profile.nickname}</h1>
                {isOwnProfile && (
                  <button
                    onClick={handleEditName}
                    className="p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
                    title="Edit name"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-gray-500">
              <span className="flex items-center gap-1"><Target size={14} /> {profile.broker}</span>
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span className="flex items-center gap-1 text-orange-600 font-medium">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                File Imported
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <NeumorphicCard className="px-6 py-3 flex items-center gap-3">
             <div className="p-2 bg-gray-200 rounded-lg text-gray-700">
                <Award size={20} />
             </div>
             <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Rank</p>
                <p className="text-lg font-bold text-gray-800">#{rank || 'N/A'}</p>
             </div>
          </NeumorphicCard>

          {isOwnProfile && (
            <NeumorphicCard className="px-6 py-3 flex items-center gap-3">
               <div className="p-2 bg-green-100 rounded-lg text-green-700">
                  <TrendingUp size={20} />
               </div>
               <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Balance</p>
                  <p className="text-lg font-bold text-gray-800">${getCurrentBalance(trades)}</p>
               </div>
            </NeumorphicCard>
          )}

          <NeumorphicCard className="px-6 py-3 flex items-center gap-3">
             <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
                <Award size={20} />
             </div>
             <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Trader ELO</p>
                <p className="text-lg font-bold text-gray-800">{profile.trader_score}</p>
             </div>
          </NeumorphicCard>
        </div>
      </div>

      {/* Connected Platforms */}
      {(connectedBrokers.length > 0 || connectedExchanges.length > 0) && (
        <div className="mb-6 space-y-3">
          <NeumorphicCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Connected Platforms</h3>
              <Link to={createPageUrl('broker-exchange-connect')}>
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Manage
                </button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {connectedBrokers.map(broker => (
                <div key={broker.id} className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-xs">
                  <TrendingUp size={12} className="text-blue-600" />
                  <span className="text-blue-700 font-medium">{broker.name}</span>
                </div>
              ))}
              {connectedExchanges.map(exchange => (
                <div key={exchange.id} className="flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full text-xs">
                  <Bitcoin size={12} className="text-orange-600" />
                  <span className="text-orange-700 font-medium">{exchange.name}</span>
                </div>
              ))}
            </div>
          </NeumorphicCard>

          {/* Optional Bybit quick account summary */}
          {connectedExchanges.some(ex => ex.id === 'bybit') && (
            <NeumorphicCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Bybit Account
                  </p>
                  <p className="text-sm text-gray-600">
                    Load live balance from Bybit (API keys used only in your browser, not stored).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSyncBybit}
                  className="px-3 py-2 text-xs rounded-lg bg-[#e0e5ec] border border-white/60 shadow-[-3px_-3px_6px_#ffffff,3px_3px_6px_#aeaec040] hover:shadow-[-1px_-1px_3px_#ffffff,1px_1px_3px_#aeaec040] text-gray-700 font-medium transition-all"
                  disabled={bybitLoading}
                >
                  {bybitLoading ? 'Syncing…' : 'Sync Bybit Data'}
                </button>
              </div>

              {bybitError && (
                <p className="text-xs text-red-500">
                  {bybitError}
                </p>
              )}

              {bybitAccount && (
                <div className="mt-1 text-xs text-gray-700">
                  <p>
                    <span className="font-semibold">Account Type:</span> {bybitAccount.accountType}
                  </p>
                  {bybitAccount.totalEquity && (
                    <p>
                      <span className="font-semibold">Total Equity:</span>{' '}
                      {bybitAccount.totalEquity} {bybitAccount.coin || ''}
                    </p>
                  )}
                </div>
              )}
            </NeumorphicCard>
          )}
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6">
          <StatBox 
          title="Total Profit"
            value={`${profile.profit_percentage}%`}
            trend={profile.profit_percentage}
          />

          <StatBox 
          title="Win Rate"
            value={`${profile.win_rate}%`}
          subValue={`${profile.profitable_trades_count}/${profile.total_trades} trades`}
          />

          <StatBox 
          title="Profit Factor"
            value={profile.profit_factor}
          trend={profile.profit_factor > 1.5 ? 12 : -5}
          />

          <StatBox 
          title="Active Days"
            value={profile.trading_days}
          trend={null}
        />

        <StatBox
          title="Sharpe Ratio"
          value={profile.sharpe_ratio}
          trend={null}
        />

        {isOwnProfile ? (
          <StatBox
            title="Expectancy"
            value={`$${profile.expectancy}`}
            trend={null}
          />
        ) : (
          <StatBox 
            title="Total Trades"
            value={profile.total_trades}
            trend={null}
          />
        )}
      </div>

      {/* Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-8">

        {/* Left Column: Chart & Detailed Stats */}
        <div className="lg:col-span-3 space-y-4 lg:space-y-8">
          {/* Chart Section */}
          <NeumorphicCard className="p-6 min-h-[350px]">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-gray-700">Equity Curve</h3>
                <div className="flex gap-2">
                   <button
                     onClick={() => setChartPeriod('1W')}
                     className={`px-4 py-1 rounded-lg text-xs font-bold shadow-inner transition-colors ${
                       chartPeriod === '1W'
                         ? 'bg-blue-500 text-white'
                         : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                     }`}
                   >
                     1W
                   </button>
                   <button
                     onClick={() => setChartPeriod('1M')}
                     className={`px-4 py-1 rounded-lg text-xs font-bold shadow-inner transition-colors ${
                       chartPeriod === '1M'
                         ? 'bg-blue-500 text-white'
                         : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                     }`}
                   >
                     1M
                   </button>
                   <button
                     onClick={() => setChartPeriod('ALL')}
                     className={`px-4 py-1 rounded-lg text-xs font-bold shadow-inner transition-colors ${
                       chartPeriod === 'ALL'
                         ? 'bg-blue-500 text-white'
                         : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                     }`}
                   >
                     ALL
                   </button>
                </div>
             </div>
             
             <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" opacity={0.5} />
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '5px 5px 10px #d1d9e6, -5px -5px 10px #ffffff' }}
                      formatter={(value) => [`${value.toFixed(2)}%`, 'Return']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </NeumorphicCard>

          {/* Detailed Streaks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <NeumorphicCard className="p-6">
                <h4 className="text-gray-500 font-bold text-sm uppercase mb-4 tracking-wider">Winning Streaks</h4>
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-[#e0e5ec] p-3 rounded-xl shadow-inner border border-white/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Daily Streak</p>
                      <p className="text-lg font-bold text-green-600">+{profile.max_win_streak}</p>
                      <p className="text-[10px] text-gray-400">trades</p>
                   </div>
                   <div className="bg-[#e0e5ec] p-3 rounded-xl shadow-inner border border-white/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Current Streak</p>
                      <p className="text-lg font-bold text-green-600">+{profile.current_win_streak}</p>
                      <p className="text-[10px] text-gray-400">trades</p>
                   </div>
                </div>
             </NeumorphicCard>

             <NeumorphicCard className="p-6">
                <h4 className="text-gray-500 font-bold text-sm uppercase mb-4 tracking-wider">Losing Streaks</h4>
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-[#e0e5ec] p-3 rounded-xl shadow-inner border border-white/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Max Streak</p>
                      <p className="text-lg font-bold text-red-500">-{profile.max_loss_streak}</p>
                      <p className="text-[10px] text-gray-400">trades</p>
                   </div>
                   <div className="bg-[#e0e5ec] p-3 rounded-xl shadow-inner border border-white/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Current Streak</p>
                      <p className="text-lg font-bold text-red-500">-{profile.current_loss_streak}</p>
                      <p className="text-[10px] text-gray-400">trades</p>
                   </div>
                </div>
             </NeumorphicCard>
          </div>

        </div>

        {/* Right Column: Score Analysis */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
           <NeumorphicCard className="p-6 min-h-[500px] flex flex-col">
              <h3 className="text-xl font-bold text-gray-700 mb-6">Score Analysis</h3>

              <div className="flex-1 flex flex-col justify-center gap-8">
                 <div className="space-y-6">
                   {/* Performance */}
                   <div>
                       <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Performance</p>
                             <button
                               onClick={() => setHelpPopup('performance')}
                               className="text-gray-400 hover:text-gray-600 transition-colors"
                             >
                               <HelpCircle size={12} />
                             </button>
                          </div>
                          <span className="text-sm font-bold text-blue-600">{profile.performance_score}</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${profile.performance_score}%` }}></div>
                       </div>
                       <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-gray-500">
                          <div className="flex justify-between"><span>Ann. Return:</span> <span className="font-medium text-gray-700">{profile.annualized_return}%</span></div>
                          <div className="flex justify-between"><span>Win Rate:</span> <span className="font-medium text-gray-700">{profile.win_rate}%</span></div>
                          <div className="flex justify-between"><span>R/R:</span> <span className="font-medium text-gray-700">{profile.rr_average}</span></div>
                          <div className="flex justify-between"><span>Expectancy:</span> <span className="font-medium text-gray-700">{profile.expectancy}</span></div>
                       </div>
                   </div>

                   {/* Risk Control */}
                   <div>
                       <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Risk Control</p>
                             <button
                               onClick={() => setHelpPopup('risk')}
                               className="text-gray-400 hover:text-gray-600 transition-colors"
                             >
                               <HelpCircle size={12} />
                             </button>
                          </div>
                          <span className="text-sm font-bold text-blue-600">{profile.risk_score}</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${profile.risk_score}%` }}></div>
                       </div>
                       <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-gray-500">
                          <div className="flex justify-between"><span>Max DD:</span> <span className="font-medium text-gray-700">{profile.max_drawdown}%</span></div>
                          <div className="flex justify-between"><span>Volatility:</span> <span className="font-medium text-gray-700">{profile.volatility}</span></div>
                          <div className="flex justify-between"><span>Risk/Trade:</span> <span className="font-medium text-gray-700">{profile.risk_per_trade}%</span></div>
                       </div>
                   </div>

                   {/* Consistency */}
                   <div>
                       <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Consistency</p>
                             <button
                               onClick={() => setHelpPopup('consistency')}
                               className="text-gray-400 hover:text-gray-600 transition-colors"
                             >
                               <HelpCircle size={12} />
                             </button>
                          </div>
                          <span className="text-sm font-bold text-blue-600">{profile.consistency_score}</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${profile.consistency_score}%` }}></div>
                       </div>
                       <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-gray-500">
                          <div className="flex justify-between"><span>Roughness:</span> <span className="font-medium text-gray-700">{profile.roughness}</span></div>
                          <div className="flex justify-between"><span>Positive Mos:</span> <span className="font-medium text-gray-700">{profile.monthly_positive_ratio}</span></div>
                          <div className="flex justify-between"><span>Freq Std:</span> <span className="font-medium text-gray-700">{profile.trade_frequency_std}</span></div>
                       </div>
                   </div>

                   {/* Account Health */}
                   <div>
                       <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account Health</p>
                             <button
                               onClick={() => setHelpPopup('health')}
                               className="text-gray-400 hover:text-gray-600 transition-colors"
                             >
                               <HelpCircle size={12} />
                             </button>
                          </div>
                          <span className="text-sm font-bold text-blue-600">{profile.account_health_score}</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${profile.account_health_score}%` }}></div>
                       </div>
                       <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-gray-500">
                          <div className="flex justify-between"><span>Violations:</span> <span className="font-medium text-gray-700">{profile.violations_sl}</span></div>
                          <div className="flex justify-between"><span>Leverage:</span> <span className="font-medium text-gray-700">{profile.leverage_overuse}</span></div>
                          <div className="flex justify-between"><span>Risk Limit:</span> <span className="font-medium text-gray-700">{profile.risklimit_breach}</span></div>
                       </div>
                   </div>
                 </div>

                 {/* Advanced Stats */}
                 <div className="grid grid-cols-2 gap-y-6 gap-x-4 pt-6 border-t border-gray-300/50">
                    <div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Sharpe Ratio</p>
                        <p className="text-lg font-bold text-gray-800">{profile.sharpe_ratio || '-'}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Sortino</p>
                        <p className="text-lg font-bold text-gray-800">{profile.sortino_ratio || '-'}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Max Drawdown</p>
                        <p className="text-lg font-bold text-red-500">{profile.max_drawdown ? `-${profile.max_drawdown}%` : '-'}</p>
                    </div>
                     <div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Avg Duration</p>
                        <p className="text-lg font-bold text-gray-800">
                          {profile.avg_trade_duration 
                            ? `${Math.floor(profile.avg_trade_duration / 60)}h ${profile.avg_trade_duration % 60}m` 
                            : '-'}
                        </p>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-gray-300/50 space-y-4">
                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-2">Volume Breakdown</p>
                        <div className="flex justify-between items-baseline mb-1">
                           <span className="text-2xl font-bold text-gray-800">{profile.total_trades} <span className="text-sm font-normal text-gray-500">trades</span></span>
                        </div>
                        <div className="flex gap-4 text-xs font-bold text-gray-500 uppercase tracking-wide">
                           <span className="flex items-center gap-1 text-green-600"><ArrowUpRight size={14} /> {profile.profitable_trades_count} Won</span>
                           <span className="flex items-center gap-1 text-red-500"><ArrowDownRight size={14} /> {profile.losing_trades_count} Lost</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-[#e0e5ec] p-3 rounded-xl shadow-inner border border-white/50">
                           <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Buy Orders</p>
                           <p className="text-lg font-bold text-green-600">{trades.filter(t => t.direction === 'Buy').length}</p>
                           <p className="text-[10px] text-gray-400">trades</p>
                           <div className="mt-2 space-y-1">
                              <div className="flex justify-between text-[9px]">
                                 <span className="text-green-600">Won:</span>
                                 <span className="font-semibold text-green-600">{trades.filter(t => t.direction === 'Buy' && parseFloat(t.net_profit) > 0).length}</span>
                              </div>
                              <div className="flex justify-between text-[9px]">
                                 <span className="text-red-500">Lost:</span>
                                 <span className="font-semibold text-red-500">{trades.filter(t => t.direction === 'Buy' && parseFloat(t.net_profit) <= 0).length}</span>
                              </div>
                              <div className="flex justify-between text-[9px] pt-1 border-t border-gray-200">
                                 <span>Win Rate:</span>
                                 <span className="font-semibold">{trades.filter(t => t.direction === 'Buy').length > 0 ? ((trades.filter(t => t.direction === 'Buy' && parseFloat(t.net_profit) > 0).length / trades.filter(t => t.direction === 'Buy').length) * 100).toFixed(1) : 0}%</span>
                              </div>
                           </div>
                        </div>
                        <div className="bg-[#e0e5ec] p-3 rounded-xl shadow-inner border border-white/50">
                           <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Sell Orders</p>
                           <p className="text-lg font-bold text-red-600">{trades.filter(t => t.direction === 'Sell').length}</p>
                           <p className="text-[10px] text-gray-400">trades</p>
                           <div className="mt-2 space-y-1">
                              <div className="flex justify-between text-[9px]">
                                 <span className="text-green-600">Won:</span>
                                 <span className="font-semibold text-green-600">{trades.filter(t => t.direction === 'Sell' && parseFloat(t.net_profit) > 0).length}</span>
                              </div>
                              <div className="flex justify-between text-[9px]">
                                 <span className="text-red-500">Lost:</span>
                                 <span className="font-semibold text-red-500">{trades.filter(t => t.direction === 'Sell' && parseFloat(t.net_profit) <= 0).length}</span>
                              </div>
                              <div className="flex justify-between text-[9px] pt-1 border-t border-gray-200">
                                 <span>Win Rate:</span>
                                 <span className="font-semibold">{trades.filter(t => t.direction === 'Sell').length > 0 ? ((trades.filter(t => t.direction === 'Sell' && parseFloat(t.net_profit) > 0).length / trades.filter(t => t.direction === 'Sell').length) * 100).toFixed(1) : 0}%</span>
                              </div>
                           </div>
                        </div>
                        {isOwnProfile && (
                          <div className="bg-[#e0e5ec] p-3 rounded-xl shadow-inner border border-white/50">
                             <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Total Volume</p>
                             <p className="text-lg font-bold text-blue-600">{trades.reduce((sum, t) => sum + (parseFloat(t.volume) || 0), 0).toFixed(2)}</p>
                             <p className="text-[10px] text-gray-400">lots</p>
                          </div>
                        )}
                    </div>
                 </div>
              </div>
           </NeumorphicCard>

        </div>

      </div>

      {/* Help Popup */}
      {helpPopup && <HelpPopup metric={helpPopup} onClose={() => setHelpPopup(null)} />}
    </div>
  );
}