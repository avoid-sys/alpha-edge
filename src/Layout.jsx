import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Trophy,
  LineChart,
  Settings,
  Wallet,
  LogOut,
  Menu,
  X,
  Globe
} from 'lucide-react';
import { createPageUrl } from './utils';
import { authService } from './services/authService';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await authService.signOut();
    setShowLogoutConfirm(false);
    // Redirect to home page
    navigate('/');
  };

  const NavItem = ({ icon: Icon, path, tooltip }) => (
    <Link
      to={createPageUrl(path)}
      className={`
        relative group flex items-center justify-center w-12 h-12 rounded-2xl mb-4 transition-all duration-300
        ${isActive(path) 
          ? 'bg-gray-800 text-white shadow-lg shadow-gray-400/50' 
          : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}
      `}
    >
      <Icon size={22} strokeWidth={1.5} />
      {/* Tooltip */}
      <span className="absolute left-16 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
        {tooltip}
      </span>
    </Link>
  );

  return (
    <div className="flex h-screen bg-[#e0e5ec] font-sans text-gray-700 overflow-hidden selection:bg-gray-300">
      
      {/* Floating Sidebar (Desktop) */}
      <div className="hidden md:flex flex-col items-center py-8 pl-6 pr-2 z-20">
        <div className="w-20 h-[92vh] bg-[#e0e5ec] rounded-[30px] shadow-[-10px_-10px_30px_#ffffff,10px_10px_30px_#aeaec040] flex flex-col items-center py-8 border border-white/40">
          <div className="mb-12">
            <Link to={createPageUrl('Dashboard')}>
              <div className="w-12 h-12 rounded-xl shadow-inner cursor-pointer hover:scale-105 transition-transform overflow-hidden">
                <img
                  src="/logo.png"
                  alt="Alpha Edge"
                  className="w-full h-full object-contain"
                />
              </div>
            </Link>
          </div>

          <div className="flex-1 w-full flex flex-col items-center">
            <NavItem icon={Globe} path="" tooltip="Home" />
            <NavItem icon={Trophy} path="Leaderboard" tooltip="Leaderboard" />
            <NavItem icon={LayoutDashboard} path="Dashboard" tooltip="My Dashboard" />
          </div>

          <div className="mt-auto">
             <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center justify-center w-12 h-12 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Sign Out"
             >
              <LogOut size={20} />
             </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#e0e5ec] z-50 flex items-center justify-between px-4 shadow-lg border-b border-white/20">
        <Link to={createPageUrl('Dashboard')} className="flex items-center">
          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-inner">
            <img
              src="/logo.png"
              alt="Alpha Edge"
              className="w-full h-full object-contain"
            />
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 mr-2">
            {location.pathname === '/' && 'Alpha Edge'}
            {location.pathname === '/dashboard' && 'Dashboard'}
            {location.pathname === '/leaderboard' && 'Leaderboard'}
            {location.pathname === '/connect' && 'Connect'}
            {location.pathname === '/importtrades' && 'Import'}
          </span>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-12 h-12 rounded-xl bg-[#e0e5ec] shadow-[-3px_-3px_6px_#ffffff,3px_3px_6px_#aeaec040] flex items-center justify-center hover:shadow-[-1px_-1px_3px_#ffffff,1px_1px_3px_#aeaec040] transition-all duration-200"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#e0e5ec]/95 backdrop-blur-sm z-40 flex flex-col items-center justify-center md:hidden">
          <div className="bg-white/80 rounded-3xl p-8 shadow-2xl border border-white/40 w-80 mx-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-gray-800">Navigation</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-10 h-10 rounded-xl bg-[#e0e5ec] shadow-[-3px_-3px_6px_#ffffff,3px_3px_6px_#aeaec040] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="space-y-4">
              <Link
                to={createPageUrl("")}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 ${
                  location.pathname === '/'
                    ? 'bg-gray-800 text-white shadow-lg'
                    : 'bg-[#e0e5ec] text-gray-700 hover:bg-white hover:shadow-md'
                }`}
              >
                <Globe size={24} />
                <span className="font-medium">Home</span>
              </Link>

              <Link
                to={createPageUrl("Dashboard")}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 ${
                  location.pathname === '/dashboard'
                    ? 'bg-gray-800 text-white shadow-lg'
                    : 'bg-[#e0e5ec] text-gray-700 hover:bg-white hover:shadow-md'
                }`}
              >
                <LayoutDashboard size={24} />
                <span className="font-medium">Dashboard</span>
              </Link>

              <Link
                to={createPageUrl("Leaderboard")}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 ${
                  location.pathname === '/leaderboard'
                    ? 'bg-gray-800 text-white shadow-lg'
                    : 'bg-[#e0e5ec] text-gray-700 hover:bg-white hover:shadow-md'
                }`}
              >
                <Trophy size={24} />
                <span className="font-medium">Leaderboard</span>
              </Link>


              <Link
                to={createPageUrl("Connect")}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 ${
                  location.pathname === '/connect'
                    ? 'bg-gray-800 text-white shadow-lg'
                    : 'bg-[#e0e5ec] text-gray-700 hover:bg-white hover:shadow-md'
                }`}
              >
                <Wallet size={24} />
                <span className="font-medium">Upload Files</span>
              </Link>
            </nav>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowLogoutConfirm(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-3 p-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className="p-4 md:p-10 max-w-[1600px] mx-auto min-h-screen pt-20 md:pt-6">
          {children}
        </div>
      </main>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={32} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign Out</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to sign out of your account?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}