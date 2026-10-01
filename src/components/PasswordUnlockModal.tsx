import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { api } from '../lib/api';
import { AnalysisResult } from '../types';

interface PasswordUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  onUnlocked: (analysis: AnalysisResult) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const PasswordUnlockModal: React.FC<PasswordUnlockModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  onUnlocked,
  onShowToast,
}) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter the document password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const analysis = await api.unlockDocument(documentId, password);
      onShowToast('Document unlocked', 'success');
      setPassword('');
      onUnlocked(analysis);
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
      onClose={onClose}
      title="Protected Document"
      description="Enter password to access this document"
    >
      <div className="space-y-4">
        {/* Lock visual card */}
        <div className="p-6 bg-zinc-950 text-white rounded-3xl flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="text-xs font-black tracking-widest uppercase text-emerald-400 mb-1">
            PROTECTED
          </span>
          <h3 className="text-base sm:text-lg font-black text-white truncate max-w-xs">
            {documentTitle}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
            Content, deadlines, and action steps are locked until unlocked.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="text-xs text-rose-800 font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-3 text-left">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
              Document Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
              <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Verifying...' : 'UNLOCK DOCUMENT'}
          </button>
        </form>
      </div>
    </BottomSheet>
  );
};
