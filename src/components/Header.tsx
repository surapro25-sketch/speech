import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Sliders,
  Dna,
  Languages,
  Subtitles,
  Sparkles,
  Crown,
  User as UserIcon,
  LogOut,
  Shield,
  ChevronDown,
  History as HistoryIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';
import { getRandomAnimeAvatar } from '../utils/animeAvatars';

export type TabType = 'tts' | 'daw' | 'clone' | 'dubbing' | 'subtitles';

interface HeaderProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenExportModal: () => void;
  hasAudioContent: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
}) => {
  const { user, isAuthenticated, isAdmin, setIsAuthModalOpen, setIsAdminModalOpen, logout } = useAuth();
  const { historyItems, setIsHistoryModalOpen } = useHistory();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabs = [
    {
      id: 'daw' as TabType,
      label: 'DAW Editor',
      icon: Sliders,
      activeColor: 'text-cyan-400',
    },
    {
      id: 'clone' as TabType,
      label: 'AI Cloning',
      icon: Dna,
      activeColor: 'text-purple-400',
    },
    {
      id: 'dubbing' as TabType,
      label: 'Voice Dubbing',
      icon: Languages,
      activeColor: 'text-sky-400',
    },
    {
      id: 'subtitles' as TabType,
      label: 'Subtitles',
      icon: Subtitles,
      activeColor: 'text-blue-400',
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-blue-900/40 bg-[#020617]/85 backdrop-blur-xl transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-lg shadow-amber-500/30 ring-1 ring-amber-300/40">
            <div className="flex items-center gap-0.5">
              <span className="h-3 w-1 rounded-full bg-zinc-950" />
              <span className="h-5 w-1 rounded-full bg-zinc-950" />
              <span className="h-4 w-1 rounded-full bg-zinc-950" />
              <span className="h-6 w-1 rounded-full bg-zinc-950" />
              <span className="h-3 w-1 rounded-full bg-zinc-950" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#020617] shadow-sm">
              <Mic className="h-2.5 w-2.5 text-zinc-950 stroke-[3]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white sm:text-lg">
                <span>Amharic AI Voice &amp; Speech </span>
                <span className="text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">Studio</span>
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs italic font-medium tracking-wide text-cyan-300/90 flex items-center gap-1">
              <span>Turn Your Words Into Real Voice</span>
              <Sparkles className="h-3 w-3 text-cyan-300" />
            </p>
          </div>
        </div>

        {/* Desktop Controls Row */}
        <div className="hidden lg:flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-[#0a0f29]/90 px-3.5 py-1.5 text-xs font-semibold text-amber-300 shadow-inner">
            <Crown className="h-3.5 w-3.5 text-amber-400 fill-amber-400/30" />
            <span>100% Free • 30-Min Master</span>
          </div>

          <button
            onClick={() => onTabChange('tts')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md cursor-pointer ${
              currentTab === 'tts'
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.5)] ring-1 ring-amber-300'
                : 'border border-blue-900/60 bg-[#061033]/80 text-zinc-300 hover:text-white hover:border-blue-500/50'
            }`}
          >
            <Mic className="h-4 w-4 fill-current" />
            <span>Voice Studio</span>
          </button>

          <nav className="flex items-center gap-1 rounded-xl bg-[#050c26]/90 p-1 border border-blue-900/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/40 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,240,255,0.3)] font-semibold'
                      : 'text-zinc-300 hover:text-white hover:bg-blue-950/50'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${tab.activeColor}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {!isAuthenticated ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-cyan-400/60 bg-gradient-to-r from-blue-700/80 to-cyan-600/80 hover:brightness-110 text-white font-bold px-4 py-2 text-xs shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all cursor-pointer"
            >
              <UserIcon className="h-4 w-4 text-cyan-200" />
              <span>Sign In / Sign Up</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5 relative" ref={userMenuRef}>
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-gradient-to-r from-[#07133d]/90 to-[#0c1e56]/90 hover:border-cyan-400/80 hover:from-blue-900/80 hover:to-cyan-950/80 px-3 py-1.5 text-xs text-cyan-300 transition-all duration-200 cursor-pointer shadow-md hover:shadow-[0_0_15px_rgba(0,229,255,0.25)] active:scale-[0.98]"
                title="View your account past actions and generated speech"
              >
                <HistoryIcon className="h-3.5 w-3.5 text-cyan-400" />
                <span className="font-semibold text-cyan-200">History</span>
                <span className="rounded-full bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 text-[10px] font-mono border border-cyan-500/40 font-bold">
                  {historyItems.length}
                </span>
              </button>

              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`group flex items-center gap-2.5 rounded-xl border px-3.5 py-1.5 text-xs text-white transition-all duration-200 cursor-pointer ${
                  isUserMenuOpen
                    ? 'border-cyan-400 bg-gradient-to-r from-blue-900/90 via-[#0c2262]/95 to-cyan-950/90 shadow-[0_0_20px_rgba(0,229,255,0.4)] ring-2 ring-cyan-400/40'
                    : 'border-cyan-500/40 bg-gradient-to-r from-[#0a184a]/90 via-[#07133d]/95 to-[#0e245c]/90 hover:from-[#0d2266] hover:to-[#12317c] hover:border-cyan-300/80 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-[0.98]'
                }`}
                title="Account Settings & Profile"
              >
                <div className="h-7 w-7 rounded-full overflow-hidden border-2 border-cyan-400/90 shadow-[0_0_10px_rgba(0,229,255,0.5)] ring-2 ring-cyan-500/25 bg-blue-950/80 shrink-0">
                  <img
                    src={user?.avatarUrl || getRandomAnimeAvatar(user?.username)}
                    alt={user?.username || 'User Avatar'}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <span className="font-bold text-white text-xs max-w-[110px] truncate tracking-wide group-hover:text-cyan-200 transition-colors drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                  {user?.username}
                </span>

                {isAdmin ? (
                  <span className="rounded-full bg-gradient-to-r from-amber-500/25 to-yellow-500/25 border border-amber-400/70 text-amber-300 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                    <Crown className="h-3 w-3 text-amber-300 fill-amber-400/30" />
                    <span>Admin</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 px-2 py-0.5 text-[10px] font-semibold shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                    User
                  </span>
                )}

                <ChevronDown
                  className={`h-3.5 w-3.5 text-cyan-300/80 transition-transform duration-200 ${
                    isUserMenuOpen ? 'rotate-180 text-cyan-200' : 'group-hover:text-cyan-300'
                  }`}
                />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border-2 border-cyan-500/40 bg-[#030822]/98 backdrop-blur-xl shadow-[0_0_35px_rgba(0,180,255,0.35)] p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2.5 border-b border-blue-900/60 mb-1">
                    <p className="font-bold text-white text-sm truncate">{user?.name || user?.username}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{user?.email}</p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-cyan-300">
                      <span>Role:</span>
                      <span className={`font-bold uppercase ${isAdmin ? 'text-amber-300' : 'text-cyan-300'}`}>
                        {user?.role}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsHistoryModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-cyan-300 hover:bg-cyan-500/10 font-bold transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <HistoryIcon className="h-4 w-4 text-cyan-400" />
                      <span>Action History</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                      {historyItems.length}
                    </span>
                  </button>

                  {/* ONLY rendered for verified Administrator */}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsAdminModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-amber-300 hover:bg-amber-500/10 font-bold transition-colors cursor-pointer text-left"
                    >
                      <Shield className="h-4 w-4 text-amber-400" />
                      <span>Admin Dashboard</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer text-left border-t border-blue-900/40 mt-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Quick Action */}
        <div className="flex lg:hidden items-center gap-2">
          {!isAuthenticated ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1 rounded-xl border border-cyan-500/50 bg-gradient-to-r from-blue-700 to-cyan-600 px-3 py-1.5 text-xs font-bold text-white shadow-md cursor-pointer"
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="flex items-center gap-1 rounded-xl border border-cyan-500/40 bg-[#061445] px-2 py-1 text-xs text-cyan-300 cursor-pointer"
                title="Past Actions History"
              >
                <HistoryIcon className="h-3.5 w-3.5 text-cyan-400" />
                <span className="font-mono text-[10px]">{historyItems.length}</span>
              </button>
              <button
                onClick={() => {
                  if (isAdmin) setIsAdminModalOpen(true);
                  else logout();
                }}
                className="flex items-center gap-1.5 rounded-xl border border-blue-500/50 bg-[#07133d] px-2.5 py-1 text-xs text-white cursor-pointer"
                title={isAdmin ? 'Admin Dashboard' : 'Logged in user'}
              >
                <img
                  src={user?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}`}
                  alt="user"
                  className="h-5 w-5 rounded-full border border-cyan-400"
                />
                <span className="max-w-[70px] truncate font-bold text-[11px]">{user?.username}</span>
                {isAdmin && <Crown className="h-3 w-3 text-amber-400" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="grid grid-cols-5 lg:hidden border-t border-blue-950/80 bg-[#010414]/90 px-1 py-1 gap-1 text-center">
        <button
          onClick={() => onTabChange('tts')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-medium transition-all ${
            currentTab === 'tts'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Mic className="h-3.5 w-3.5 text-amber-400 mb-0.5" />
          <span className="truncate w-full">Studio</span>
        </button>
        <button
          onClick={() => onTabChange('daw')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-medium transition-all ${
            currentTab === 'daw'
              ? 'bg-blue-900/60 text-cyan-300 border border-cyan-400/40'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="h-3.5 w-3.5 text-cyan-400 mb-0.5" />
          <span className="truncate w-full">DAW</span>
        </button>
        <button
          onClick={() => onTabChange('clone')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-medium transition-all ${
            currentTab === 'clone'
              ? 'bg-purple-900/60 text-purple-300 border border-purple-400/40'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Dna className="h-3.5 w-3.5 text-purple-400 mb-0.5" />
          <span className="truncate w-full">Cloning</span>
        </button>
        <button
          onClick={() => onTabChange('dubbing')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-medium transition-all ${
            currentTab === 'dubbing'
              ? 'bg-sky-900/60 text-sky-300 border border-sky-400/40'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Languages className="h-3.5 w-3.5 text-sky-400 mb-0.5" />
          <span className="truncate w-full">Dubbing</span>
        </button>
        {isAuthenticated ? (
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-medium text-cyan-300 hover:text-white cursor-pointer"
          >
            <HistoryIcon className="h-3.5 w-3.5 text-cyan-400 mb-0.5" />
            <span className="truncate w-full">History</span>
          </button>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-medium text-cyan-300 hover:text-white cursor-pointer"
          >
            <UserIcon className="h-3.5 w-3.5 text-cyan-300 mb-0.5" />
            <span className="truncate w-full">Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
