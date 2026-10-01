import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
  KeyRound,
  RotateCcw,
} from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { api } from '../lib/api';
import { User, UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, profile: UserProfile) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  initialMode?: 'login' | 'signup' | 'forgot';
  guestConversionNotice?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onShowToast,
  initialMode = 'login',
  guestConversionNotice = false,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>(initialMode);

  // Form fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Reset flow
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setInlineError(null);
    setResetSuccessMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);
    if (!email.trim() || !password) {
      setInlineError('Please enter your email or username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login({ emailOrUsername: email, password });
      onShowToast(`Welcome back, ${res.profile.display_name || res.user.username}!`, 'success');
      onAuthSuccess(res.user, res.profile);
      resetForm();
      onClose();
    } catch (err: any) {
      setInlineError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);

    if (!email.trim() || !username.trim() || !password) {
      setInlineError('All fields are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInlineError('Please enter a valid email address.');
      return;
    }
    if (username.length < 3) {
      setInlineError('Username must be at least 3 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setInlineError('Username may only contain letters, numbers, and underscores.');
      return;
    }
    if (password.length < 8) {
      setInlineError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setInlineError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.signup({
        email,
        username,
        password,
        confirmPassword,
      });
      onShowToast(`Account created! Welcome, ${res.user.username}.`, 'success');
      onAuthSuccess(res.user, res.profile);
      resetForm();
      onClose();
    } catch (err: any) {
      setInlineError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);
    if (!email.trim()) {
      setInlineError('Please enter your email.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setResetSuccessMessage(res.message);
      if (res.resetToken) {
        setResetToken(res.resetToken);
        setMode('reset');
      }
    } catch (err: any) {
      setInlineError(err.message || 'Failed to request reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);
    if (!resetToken || !newPassword) {
      setInlineError('Please enter token and new password.');
      return;
    }
    if (newPassword.length < 8) {
      setInlineError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword({ token: resetToken, newPassword });
      onShowToast('Password reset successfully! Please log in.', 'success');
      setMode('login');
      resetForm();
    } catch (err: any) {
      setInlineError(err.message || 'Invalid or expired reset token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'signup'
          ? 'Create Free Account'
          : mode === 'forgot'
          ? 'Reset Password'
          : mode === 'reset'
          ? 'Enter New Password'
          : 'Sign In'
      }
      description={
        guestConversionNotice
          ? 'Create a free account to permanently keep this document and access it across devices.'
          : mode === 'signup'
          ? 'Keep your documents, action plans, and history synchronized across devices.'
          : mode === 'forgot'
          ? "Enter your email to receive password reset instructions."
          : 'Access your saved documents and private history.'
      }
    >
      <div className="space-y-4">
        {/* Guest Conversion Notice Banner */}
        {guestConversionNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-start gap-2 text-left">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-900 font-medium leading-relaxed">
              Your current analysis will automatically be saved to your new account!
            </p>
          </div>
        )}

        {/* Inline Error Message */}
        {inlineError && (
          <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-start gap-2 text-left animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="text-xs text-rose-800 font-medium">{inlineError}</span>
          </div>
        )}

        {/* Reset Success Message */}
        {resetSuccessMessage && (
          <div className="p-3 bg-zinc-100 border border-zinc-200 rounded-2xl text-left text-xs text-zinc-700 leading-relaxed">
            {resetSuccessMessage}
          </div>
        )}

        {/* 1. SIGN IN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3 text-left">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                Email or Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com or alexm"
                  autoComplete="username"
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                />
                <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setInlineError(null);
                    setMode('forgot');
                  }}
                  className="text-[11px] text-zinc-500 hover:text-zinc-900 font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <span>Signing in...</span> : <span>LOG IN</span>}
            </button>

            {/* Switch to Signup */}
            <div className="pt-2 text-center">
              <span className="text-xs text-zinc-500">Don't have an account? </span>
              <button
                type="button"
                onClick={() => {
                  setInlineError(null);
                  setMode('signup');
                }}
                className="text-xs font-bold text-zinc-950 hover:underline"
              >
                Create one free
              </button>
            </div>

            {/* Continue as guest */}
            <div className="pt-2 border-t border-zinc-100 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-zinc-500 hover:text-zinc-800 font-medium py-1"
              >
                Continue without an account
              </button>
            </div>
          </form>
        )}

        {/* 2. SIGN UP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3 text-left">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                />
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                Choose Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="alexmorgan"
                  autoComplete="username"
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                />
                <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              </div>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                Letters, numbers, underscores (3–25 characters)
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  className="w-full pl-9 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <span>Creating account...</span> : <span>CREATE FREE ACCOUNT</span>}
            </button>

            {/* Switch to Login */}
            <div className="pt-2 text-center">
              <span className="text-xs text-zinc-500">Already have an account? </span>
              <button
                type="button"
                onClick={() => {
                  setInlineError(null);
                  setMode('login');
                }}
                className="text-xs font-bold text-zinc-950 hover:underline"
              >
                Log in
              </button>
            </div>
          </form>
        )}

        {/* 3. FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-3 text-left">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                Your Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                />
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all active:scale-[0.98]"
            >
              {loading ? 'Sending...' : 'SEND RESET INSTRUCTIONS'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setInlineError(null);
                  setMode('login');
                }}
                className="text-xs text-zinc-600 hover:text-zinc-900 font-semibold"
              >
                Back to Log In
              </button>
            </div>
          </form>
        )}

        {/* 4. RESET PASSWORD FORM */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-3 text-left">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                Reset Token
              </label>
              <input
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste reset token"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                New Password (min 8 chars)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all"
            >
              {loading ? 'Updating...' : 'SET NEW PASSWORD'}
            </button>
          </form>
        )}

        {/* Privacy Note */}
        <div className="pt-2 text-center text-[10px] text-zinc-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          <span>Private & Encrypted Password Verification</span>
        </div>
      </div>
    </BottomSheet>
  );
};
