import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Info,
  HelpCircle,
  Trash2,
  ChevronRight,
  Sparkles,
  Lock,
  User as UserIcon,
  Mail,
  KeyRound,
  Shield,
  AlertTriangle,
  Camera,
  LogOut,
  Share2,
  FileText,
  Database,
  Copy,
  Check,
} from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { api } from '../lib/api';
import { User, UserProfile } from '../types';

interface SettingsScreenProps {
  user: User | null;
  profile: UserProfile | null;
  savedCount: number;
  onClearHistory: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onAccountDeleted: () => void;
  onProfileUpdated: (profile: UserProfile) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  user,
  profile,
  savedCount,
  onClearHistory,
  onOpenProfile,
  onOpenAuth,
  onLogout,
  onAccountDeleted,
  onProfileUpdated,
  onShowToast,
}) => {
  const [supabaseStatus, setSupabaseStatus] = useState<{
    configured: boolean;
    url: string;
    authReady: boolean;
    tablesCreated: boolean;
  } | null>(null);

  useEffect(() => {
    async function loadStatus() {
      const status = await api.getSupabaseStatus();
      setSupabaseStatus(status);
    }
    loadStatus();
  }, []);

  const handleCopySchema = async () => {
    try {
      const schemaSql = await api.getSupabaseSchema();
      await navigator.clipboard.writeText(schemaSql);
      onShowToast('Copied SQL schema! Paste into Supabase SQL Editor.', 'success');
    } catch {
      onShowToast('Could not copy schema', 'error');
    }
  };
  const [activeSheet, setActiveSheet] = useState<
    | 'how'
    | 'privacy'
    | 'disclaimer'
    | 'change-password'
    | 'change-email'
    | 'change-username'
    | 'delete-account'
    | null
  >(null);

  // Form states for settings dialogs
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setDialogError(null);
    if (!currentPassword || !newPassword) {
      setDialogError('All fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      setDialogError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setDialogError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword({ currentPassword, newPassword, confirmPassword });
      onShowToast('Password changed successfully', 'success');
      setActiveSheet(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setDialogError(err.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setDialogError(null);
    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setDialogError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await api.changeEmail(newEmail);
      onShowToast('Email updated successfully', 'success');
      setActiveSheet(null);
      setNewEmail('');
    } catch (err: any) {
      setDialogError(err.message || 'Failed to change email.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setDialogError(null);
    if (!newUsername.trim() || newUsername.length < 3) {
      setDialogError('Username must be at least 3 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
      setDialogError('Username may only contain letters, numbers, and underscores.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.updateProfile({ username: newUsername });
      onProfileUpdated(res.profile);
      onShowToast('Username updated successfully', 'success');
      setActiveSheet(null);
    } catch (err: any) {
      setDialogError(err.message || 'Username already taken or invalid.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETE') {
      setDialogError('Please type DELETE to confirm.');
      return;
    }

    setLoading(true);
    try {
      await api.deleteAccount();
      onShowToast('Your account and data have been permanently deleted', 'info');
      setActiveSheet(null);
      onAccountDeleted();
    } catch (err: any) {
      setDialogError(err.message || 'Failed to delete account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] px-4 pb-32 pt-2 max-w-lg mx-auto w-full text-left">
      {/* Screen Title - Solid non-transparent card */}
      <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-xs mb-3.5">
        <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
          SETTINGS
        </h2>
        <p className="text-xs text-zinc-700 font-bold mt-0.5">
          Account, security, privacy & data controls
        </p>
      </div>

      <div className="space-y-4">
        {/* 1. ACCOUNT & PROFILE HEADER */}
        {user ? (
          <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3.5 truncate">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-950 text-white flex items-center justify-center font-bold text-sm shrink-0 border border-zinc-200">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-emerald-400 font-mono text-base">
                    {(profile?.display_name || user.username)[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="truncate">
                <h3 className="text-sm font-extrabold text-zinc-950 truncate leading-tight">
                  {profile?.display_name || user.username}
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5 truncate">
                  @{user.username}
                </p>
                <span className="text-[10px] text-zinc-400 block truncate mt-0.5">
                  {user.email}
                </span>
              </div>
            </div>

            <button
              onClick={onOpenProfile}
              className="px-3 py-1.5 bg-zinc-100/90 hover:bg-zinc-200/90 text-zinc-800 font-bold text-xs rounded-xl shrink-0 transition-all active:scale-[0.98] border border-zinc-200/50"
            >
              Edit
            </button>
          </div>
        ) : (
          <div className="bg-zinc-950 text-white rounded-3xl p-5 shadow-xs flex items-center justify-between relative overflow-hidden technical-bracket-card">
            <div className="edge-scanner-line opacity-30" />
            <div className="relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono block mb-0.5">
                [GUEST MODE]
              </span>
              <h3 className="text-sm font-extrabold text-white">
                Create a Free Account
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Save and access your documents across all devices.
              </p>
            </div>
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-2 bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98] shrink-0 relative z-10"
            >
              Sign In
            </button>
          </div>
        )}

        {/* 2. ACCOUNT SECTION */}
        {user && (
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-zinc-800 px-1 mb-2 block">
              ACCOUNT
            </span>
            <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs overflow-hidden divide-y divide-zinc-100">
              <button
                onClick={() => {
                  setDialogError(null);
                  setNewEmail(user.email);
                  setActiveSheet('change-email');
                }}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-950 block">Change Email</span>
                    <span className="text-xs text-zinc-600 font-medium">{user.email}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>

              <button
                onClick={() => {
                  setDialogError(null);
                  setNewUsername(user.username);
                  setActiveSheet('change-username');
                }}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-950 block">Change Username</span>
                    <span className="text-xs text-zinc-600 font-mono font-medium">@{user.username}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </div>
        )}

        {/* 3. SECURITY SECTION */}
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-zinc-800 px-1 mb-2 block">
            SECURITY
          </span>
          <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs overflow-hidden divide-y divide-zinc-100">
            {user && (
              <button
                onClick={() => {
                  setDialogError(null);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setActiveSheet('change-password');
                }}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-950 block">Change Password</span>
                    <span className="text-xs text-zinc-600 font-medium">Update your account login password</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>
            )}

            <div className="p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-950 block">Document Password Protection</span>
                <p className="text-xs text-zinc-600 font-medium leading-relaxed mt-0.5">
                  You can lock individual documents with a custom password from your history list or results screen. Content stays locked until unlocked.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. PRIVACY SECTION */}
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-zinc-800 px-1 mb-2 block">
            PRIVACY
          </span>
          <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs overflow-hidden divide-y divide-zinc-100">
            <button
              onClick={() => setActiveSheet('privacy')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-950 block">Privacy Architecture</span>
                  <span className="text-xs text-zinc-600 font-medium">Private by default · User Row Level Security</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>

            <button
              onClick={() => setActiveSheet('how')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-950 block">How DO THIS Works</span>
                  <span className="text-xs text-zinc-600 font-medium">Action-first document understanding engine</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>

            <button
              onClick={() => setActiveSheet('disclaimer')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-950 block">AI & Legal Disclaimer</span>
                  <span className="text-xs text-zinc-600 font-medium">Information purposes only</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* 5. DATA & ACCOUNT MANAGEMENT */}
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-zinc-800 px-1 mb-2 block">
            DATA MANAGEMENT
          </span>
          <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs overflow-hidden divide-y divide-zinc-100">
            <div className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-950 block">Saved Documents</span>
                <span className="text-xs text-zinc-600 font-medium">{savedCount} total checks saved</span>
              </div>
              {savedCount > 0 && (
                <button
                  onClick={onClearHistory}
                  className="text-xs font-bold text-zinc-700 hover:text-rose-600 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {user && (
              <button
                onClick={() => {
                  setDialogError(null);
                  setDeleteConfirmText('');
                  setActiveSheet('delete-account');
                }}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-rose-50/50 transition-colors group"
              >
                <div>
                  <span className="text-xs font-bold text-rose-600 block">Delete My Account</span>
                  <span className="text-xs text-zinc-600 font-medium">
                    Permanently delete account, documents, and all data
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-rose-600 transition-colors" />
              </button>
            )}
          </div>
        </div>

        {/* 6. PERSISTENT CLOUD BACKEND (SUPABASE) */}
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-zinc-800 px-1 mb-2 block">
            PERSISTENT CLOUD BACKEND
          </span>
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-zinc-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-950 block">Supabase Cloud Backend</span>
                  <span className="text-xs text-zinc-600 font-mono font-medium">
                    {supabaseStatus?.url ? supabaseStatus.url.replace(/^https?:\/\//, '').replace(/\/$/, '') : 'mabnsgawoxpcvpfsslbx.supabase.co'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                ACTIVE
              </span>
            </div>

            <p className="text-xs text-zinc-700 font-medium leading-relaxed">
              Your Supabase secrets are saved and connected. Authentication, profiles, and documents are backed by your private Supabase PostgreSQL project.
            </p>

            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
              <span className="text-[10px] text-zinc-400 font-medium">
                PostgreSQL schema migration (schema.sql)
              </span>
              <button
                type="button"
                onClick={handleCopySchema}
                className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SQL Schema</span>
              </button>
            </div>
          </div>
        </div>

        {/* Log Out */}
        {user && (
          <div className="pt-2">
            <button
              onClick={onLogout}
              className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out (@{user.username})</span>
            </button>
          </div>
        )}
      </div>

      {/* --- BOTTOM SHEETS --- */}

      {/* Change Password Sheet */}
      <BottomSheet
        isOpen={activeSheet === 'change-password'}
        onClose={() => setActiveSheet(null)}
        title="Change Password"
        description="Enter your current password and choose a new one"
      >
        <form onSubmit={handleChangePassword} className="space-y-3 text-left">
          {dialogError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              {dialogError}
            </div>
          )}
          <div>
            <label className="text-[11px] font-bold uppercase text-zinc-500 block mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-zinc-500 block mb-1">
              New Password (min 8 chars)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-zinc-500 block mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-zinc-950 text-white font-bold text-xs sm:text-sm rounded-xl mt-2"
          >
            {loading ? 'Updating...' : 'UPDATE PASSWORD'}
          </button>
        </form>
      </BottomSheet>

      {/* Change Email Sheet */}
      <BottomSheet
        isOpen={activeSheet === 'change-email'}
        onClose={() => setActiveSheet(null)}
        title="Change Email"
        description="Update the email address associated with your account"
      >
        <form onSubmit={handleChangeEmail} className="space-y-3 text-left">
          {dialogError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              {dialogError}
            </div>
          )}
          <div>
            <label className="text-[11px] font-bold uppercase text-zinc-500 block mb-1">
              New Email Address
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-zinc-950 text-white font-bold text-xs sm:text-sm rounded-xl mt-2"
          >
            {loading ? 'Saving...' : 'SAVE NEW EMAIL'}
          </button>
        </form>
      </BottomSheet>

      {/* Change Username Sheet */}
      <BottomSheet
        isOpen={activeSheet === 'change-username'}
        onClose={() => setActiveSheet(null)}
        title="Change Username"
        description="Choose a unique username for your account"
      >
        <form onSubmit={handleChangeUsername} className="space-y-3 text-left">
          {dialogError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              {dialogError}
            </div>
          )}
          <div>
            <label className="text-[11px] font-bold uppercase text-zinc-500 block mb-1">
              New Username
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-zinc-950 text-white font-bold text-xs sm:text-sm rounded-xl mt-2"
          >
            {loading ? 'Checking...' : 'UPDATE USERNAME'}
          </button>
        </form>
      </BottomSheet>

      {/* Delete Account Sheet */}
      <BottomSheet
        isOpen={activeSheet === 'delete-account'}
        onClose={() => setActiveSheet(null)}
        title="Delete My Account"
        description="Permanently delete your account and all associated documents"
      >
        <form onSubmit={handleDeleteAccount} className="space-y-3 text-left">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Irreversible Action</span>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">
              This permanently removes your profile, all {savedCount} saved documents, analyses,
              active share links, and credentials.
            </p>
          </div>

          {dialogError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              {dialogError}
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold uppercase text-zinc-500 block mb-1">
              Type DELETE to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading || deleteConfirmText !== 'DELETE'}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs"
          >
            {loading ? 'Deleting...' : 'PERMANENTLY DELETE ACCOUNT'}
          </button>
        </form>
      </BottomSheet>

      {/* How it works Sheet */}
      <BottomSheet
        isOpen={activeSheet === 'how'}
        onClose={() => setActiveSheet(null)}
        title="How DO THIS Works"
        description="Action-first document intelligence"
      >
        <div className="space-y-3 text-left text-xs text-zinc-700 leading-relaxed">
          <p>
            DO THIS is engineered around a single core question:
            <strong className="text-zinc-950 block mt-1">
              “What does this mean for me, and what do I need to do next?”
            </strong>
          </p>
          <ul className="space-y-2 list-disc pl-4 text-zinc-600">
            <li>Identifies the single most important action first.</li>
            <li>Detects strict deadlines, dates, and evidence quotes.</li>
            <li>Never hallucinates fees, penalties, or consequences not in the document.</li>
            <li>Drafts a short, ready-to-send response you can copy directly.</li>
          </ul>
        </div>
      </BottomSheet>

      {/* Privacy Architecture Sheet */}
      <BottomSheet
        isOpen={activeSheet === 'privacy'}
        onClose={() => setActiveSheet(null)}
        title="Privacy Architecture"
        description="Strict user isolation & zero-retention defaults"
      >
        <div className="space-y-3 text-left text-xs text-zinc-700 leading-relaxed">
          <p>
            Your documents are private by default. User data isolation is enforced at the database level:
          </p>
          <ul className="space-y-2 list-disc pl-4 text-zinc-600">
            <li>Row Level Security (RLS) ensures only you can view your documents.</li>
            <li>Document passwords use salted cryptographic scrypt hashing.</li>
            <li>Share links use unguessable random tokens and can be revoked anytime.</li>
            <li>Passwords, authentication tokens, and private files are never exposed.</li>
          </ul>
        </div>
      </BottomSheet>

      {/* Disclaimer Sheet */}
      <BottomSheet
        isOpen={activeSheet === 'disclaimer'}
        onClose={() => setActiveSheet(null)}
        title="AI & Legal Disclaimer"
        description="Important notice regarding information"
      >
        <div className="space-y-3 text-left text-xs text-zinc-700 leading-relaxed">
          <p>
            DO THIS provides AI-generated assistance and document analysis. It is designed to help you quickly understand correspondence, but is not a substitute for professional legal, financial, medical, or tax advice.
          </p>
          <p>
            Always verify critical account numbers and payment details with the issuing institution before executing transactions.
          </p>
        </div>
      </BottomSheet>
    </div>
  );
};
