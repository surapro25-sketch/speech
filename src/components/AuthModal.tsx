import React, { useState } from 'react';
import {
  X,
  Lock,
  User as UserIcon,
  Mail,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Globe,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    isAuthenticated,
    login,
    signup,
    loginWithGoogle,
    deviceAccounts,
    continueWithDeviceAccount,
    removeDeviceAccount
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & error states
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [showGoogleInput, setShowGoogleInput] = useState(false);
  const [googleAccountNotice, setGoogleAccountNotice] = useState<{ email: string; name: string } | null>(null);

  if (!isAuthModalOpen) return null;

  const resetForm = () => {
    setError(null);
    setIdentifier('');
    setPassword('');
    setName('');
    setUsername('');
    setEmail('');
    setConfirmPassword('');
    setShowGoogleInput(false);
    setGoogleAccountNotice(null);
  };

  const handleClose = () => {
    if (!isAuthenticated) return;
    resetForm();
    setIsAuthModalOpen(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError('Please provide your username/email and password.');
      return;
    }
    setLoading(true);
    const result = await login(identifier.trim(), password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to sign in');
    } else {
      resetForm();
      setIsAuthModalOpen(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername) {
      setError('Please choose a Username for your account.');
      return;
    }
    if (cleanUsername.includes('@')) {
      setError('Username must not contain @ character.');
      return;
    }
    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }
    if (!cleanEmail) {
      setError('Please provide your Email address.');
      return;
    }
    if (!password) {
      setError('Please create a Password for your account.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 5) {
      setError('Password must be at least 5 characters long.');
      return;
    }

    setLoading(true);
    let result;
    if (googleAccountNotice && cleanEmail.toLowerCase() === googleAccountNotice.email.toLowerCase()) {
      result = await loginWithGoogle(
        googleAccountNotice.email,
        name.trim() || googleAccountNotice.name,
        undefined,
        undefined,
        cleanUsername,
        password
      );
    } else {
      result = await signup(cleanUsername, cleanEmail, name.trim(), password);
    }
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Failed to create account');
    } else {
      resetForm();
      setIsAuthModalOpen(false);
    }
  };

  const handleGoogleSignIn = async (customEmail?: string, customName?: string) => {
    setError(null);
    setLoading(true);

    // If client Google Identity Services is available, attempt real credential flow
    const googleClient = (window as any).google?.accounts?.id;
    if (googleClient && !customEmail) {
      try {
        googleClient.initialize({
          client_id: 'dummy-client-id.apps.googleusercontent.com',
          callback: async (response: any) => {
            if (response.credential) {
              const res = await loginWithGoogle(undefined, undefined, undefined, response.credential);
              setLoading(false);
              if (res.success) {
                resetForm();
                setIsAuthModalOpen(false);
              } else if (res.notRegistered) {
                setMode('signup');
                setEmail(res.email || '');
                setName(res.name || '');
                setGoogleAccountNotice({ email: res.email || '', name: res.name || '' });
              } else {
                setError(res.error || 'Google login failed');
              }
            }
          },
        });
      } catch (e) {
        console.warn('GSI init notice:', e);
      }
    }

    const targetEmail = (customEmail || 'surapro25@gmail.com').trim().toLowerCase();
    const targetName = customName || (targetEmail.startsWith('surapro') ? 'Sura Pro' : targetEmail.split('@')[0]);
    const result = await loginWithGoogle(targetEmail, targetName);
    setLoading(false);

    if (result.notRegistered) {
      setMode('signup');
      setEmail(result.email || targetEmail);
      setName(result.name || targetName);
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setGoogleAccountNotice({
        email: result.email || targetEmail,
        name: result.name || targetName,
      });
      return;
    }
    if (!result.success) {
      setError(result.error || 'Google login failed');
    } else {
      resetForm();
      setIsAuthModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border-2 border-cyan-500/50 bg-[#030822] p-6 sm:p-8 shadow-[0_0_50px_rgba(0,180,255,0.3)] space-y-5 text-zinc-100 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-blue-900/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>{mode === 'signin' ? 'Sign In to Studio' : 'Create Your Account'}</span>
              </h3>
              <p className="text-xs text-cyan-300 font-medium font-ethiopic">
                {mode === 'signin' ? 'ወደ መለያዎ ይግቡ' : 'አዲስ መለያ ይፍጠሩ'}
              </p>
            </div>
          </div>
          {isAuthenticated && (
            <button
              onClick={handleClose}
              className="rounded-xl p-1.5 text-zinc-400 hover:text-white hover:bg-blue-900/50 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 rounded-xl bg-[#061239] p-1 border border-blue-900/60 text-xs font-bold">
          <button
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/30'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-md shadow-amber-500/30'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Saved device accounts if any */}
        {deviceAccounts.length >= 1 && (
          <div className="p-3 rounded-2xl bg-[#040e33]/90 border border-cyan-500/40 space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-xs font-bold text-white">Saved Accounts ({deviceAccounts.length})</span>
              </div>
              <span className="text-[10px] text-cyan-300 font-mono">Select to continue</span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {deviceAccounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => continueWithDeviceAccount(account)}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#061445] hover:bg-[#091b5c] border border-blue-900/60 hover:border-cyan-400/60 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="h-8 w-8 rounded-full overflow-hidden border border-cyan-400/80 ring-1 ring-cyan-500/30 shrink-0">
                      <img src={account.avatarUrl} alt={account.username} className="h-full w-full object-cover" />
                    </div>
                    <div className="truncate text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {account.name || account.username}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">@{account.username}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate">{account.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        continueWithDeviceAccount(account);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-zinc-950 text-[11px] font-bold transition-all cursor-pointer"
                    >
                      Continue &rarr;
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDeviceAccount(account.id);
                      }}
                      className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remove from device"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Google Authentication Button */}
        <div className="space-y-2">
          <button
            onClick={() => handleGoogleSignIn()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-zinc-700 bg-white hover:bg-zinc-100 text-zinc-900 font-bold py-2.5 px-4 text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{mode === 'signin' ? 'Continue with Google' : 'Sign up with Google'}</span>
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowGoogleInput(!showGoogleInput)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              {showGoogleInput ? 'Hide Google email input' : 'Or enter custom Google account'}
            </button>
          </div>

          {showGoogleInput && (
            <div className="flex gap-2 p-2 rounded-xl bg-[#061239] border border-blue-900/60">
              <input
                type="email"
                placeholder="e.g. user@gmail.com"
                value={googleCustomEmail}
                onChange={(e) => setGoogleCustomEmail(e.target.value)}
                className="flex-1 bg-transparent px-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleGoogleSignIn(googleCustomEmail)}
                className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold px-3 py-1 rounded-lg text-xs cursor-pointer"
              >
                Continue
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-blue-900/60 w-full" />
          <span className="bg-[#030822] px-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Or with credentials
          </span>
          <div className="border-t border-blue-900/60 w-full" />
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Sign In Form */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 text-left">
                Username or Email
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-cyan-400" />
                <input
                  type="text"
                  required
                  placeholder="Enter username or email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-xl border border-blue-900/80 bg-[#061239] pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 text-left">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-cyan-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-blue-900/80 bg-[#061239] pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-zinc-950 font-extrabold py-3 px-4 text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50 mt-4"
            >
              <span>{loading ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Sign Up Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            {googleAccountNotice && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-[#03243f]/90 to-blue-950/80 border border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.2)] space-y-1 text-left">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Google Account Connected ({googleAccountNotice.email})</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Full Name (<strong>{name || googleAccountNotice.name}</strong>) and Email (<strong>{googleAccountNotice.email}</strong>) have been automatically copied from your Google account. Please choose your <strong>Username</strong> and <strong>Password</strong> below to finish registration as a standard user.
                </p>
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Username
                </label>
                {googleAccountNotice && (
                  <span className="text-[10px] text-amber-300 font-medium">Choose your username</span>
                )}
              </div>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-cyan-400" />
                <input
                  type="text"
                  required
                  autoFocus={!!googleAccountNotice}
                  placeholder="e.g. solomon_audio"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-blue-900/80 bg-[#061239] pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Email Address
                </label>
                {googleAccountNotice && (
                  <span className="text-[10px] text-emerald-300 font-medium">From Google Account</span>
                )}
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-cyan-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. solomon@example.com"
                  value={email}
                  readOnly={!!googleAccountNotice}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded-xl border border-blue-900/80 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none ${
                    googleAccountNotice ? 'bg-[#041a38] text-emerald-200 border-emerald-500/40' : 'bg-[#061239]'
                  }`}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 text-left">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Solomon Girma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full rounded-xl border border-blue-900/80 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none ${
                  googleAccountNotice ? 'bg-[#041a38] text-emerald-200 border-emerald-500/40' : 'bg-[#061239]'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 text-left">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-cyan-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 5 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-blue-900/80 bg-[#061239] pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 text-left">
                Confirm Password
              </label>
              <div className="relative">
                <CheckCircle2 className="absolute left-3.5 top-3 h-4 w-4 text-cyan-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-blue-900/80 bg-[#061239] pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-zinc-950 font-extrabold py-3 px-4 text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50 mt-4"
            >
              <span>{loading ? 'Creating Account...' : googleAccountNotice ? 'Complete Sign Up' : 'Create Account'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <p className="text-[11px] text-zinc-400">
            {mode === 'signin' ? "Don't have an account yet?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
                setGoogleAccountNotice(null);
              }}
              className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
            >
              {mode === 'signin' ? 'Sign up for free' : 'Sign in here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
