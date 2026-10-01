import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, ShieldCheck, Check, ShieldAlert } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { api } from '../lib/api';

interface PasswordProtectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  isCurrentlyProtected: boolean;
  onProtectionChanged: (isProtected: boolean) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const PasswordProtectionModal: React.FC<PasswordProtectionModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  isCurrentlyProtected,
  onProtectionChanged,
  onShowToast,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setPassword('');
    setConfirmPassword('');
    setCurrentPassword('');
    setError(null);
  };

  const handleSetProtection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.protectDocument(documentId, password);
      onProtectionChanged(true);
      onShowToast('Document is now password protected', 'success');
      reset();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to protect document.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProtection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError('Please enter the current document password.');
      return;
    }

    setLoading(true);
    try {
      await api.removeDocumentProtection(documentId, currentPassword);
      onProtectionChanged(false);
      onShowToast('Password protection removed', 'info');
      reset();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Incorrect password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      title={isCurrentlyProtected ? 'Document Protection' : 'Protect Document'}
      description={
        isCurrentlyProtected
          ? `"${documentTitle}" is currently locked with password protection.`
          : `Require a password before anyone can open "${documentTitle}".`
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="text-xs text-rose-800 font-medium">{error}</span>
          </div>
        )}

        {/* Security Disclosure */}
        <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-left">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 mb-1">
            <ShieldCheck className="w-4 h-4 text-zinc-700" />
            <span>PASSWORD PROTECTED ACCESS</span>
          </div>
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            This document will require the password before displaying its summary, deadline, or AI action plan.
            Passwords are salted and cryptographically hashed on the server; they are never stored in plaintext.
          </p>
        </div>

        {/* Action Form */}
        {!isCurrentlyProtected ? (
          <form onSubmit={handleSetProtection} className="space-y-3 text-left">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                Create Document Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 4 chars)"
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>{loading ? 'Locking...' : 'LOCK DOCUMENT'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleRemoveProtection} className="space-y-3 text-left">
            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                To remove password protection, enter the current document password below.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Removing...' : 'REMOVE PROTECTION'}</span>
            </button>
          </form>
        )}
      </div>
    </BottomSheet>
  );
};
