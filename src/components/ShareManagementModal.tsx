import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ExternalLink,
  Plus,
  Lock,
} from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { api } from '../lib/api';
import { ShareInfo } from '../types';

interface ShareManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  isPasswordProtected: boolean;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ShareManagementModal: React.FC<ShareManagementModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  isPasswordProtected,
  onShowToast,
}) => {
  const [shares, setShares] = useState<ShareInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showWarningStep, setShowWarningStep] = useState(false);

  // Creation params
  const [permission, setPermission] = useState<'VIEW_ONLY' | 'VIEW_AND_DOWNLOAD'>('VIEW_ONLY');
  const [expiryOption, setExpiryOption] = useState<'never' | '24' | '168' | '720'>('168'); // default 7 days
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const loadShares = async () => {
    try {
      setLoading(true);
      const list = await api.getDocumentShares(documentId);
      setShares(list);
    } catch (err: any) {
      console.error('Failed to load shares:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadShares();
      setShowWarningStep(false);
    }
  }, [isOpen, documentId]);

  const handleCreateShare = async () => {
    setCreating(true);
    try {
      const hours = expiryOption === 'never' ? undefined : Number(expiryOption);
      const newShare = await api.createShare(documentId, permission, hours);
      setShares((prev) => [newShare, ...prev]);
      setShowWarningStep(false);
      onShowToast('Share link created', 'success');

      // Auto copy
      const fullUrl = `${window.location.origin}/#share=${newShare.share_token}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedToken(newShare.share_token);
      setTimeout(() => setCopiedToken(null), 2500);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to create share link', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (shareId: string) => {
    try {
      await api.revokeShare(documentId, shareId);
      setShares((prev) =>
        prev.map((s) => (s.id === shareId ? { ...s, revoked_at: new Date().toISOString() } : s))
      );
      onShowToast('Share link revoked immediately', 'info');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to revoke share link', 'error');
    }
  };

  const handleCopyLink = async (token: string) => {
    const fullUrl = `${window.location.origin}/#share=${token}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedToken(token);
      onShowToast('Share link copied to clipboard', 'success');
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      onShowToast('Could not copy link', 'error');
    }
  };

  const handleNativeShare = async (token: string) => {
    const fullUrl = `${window.location.origin}/#share=${token}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Action Plan: ${documentTitle}`,
          url: fullUrl,
        });
      } catch {}
    } else {
      handleCopyLink(token);
    }
  };

  const activeShares = shares.filter((s) => !s.revoked_at);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Sharing"
      description={`Share "${documentTitle}" with anyone via a private, revocable link.`}
    >
      <div className="space-y-4">
        {/* Step 1: Warning & Link Generator */}
        {showWarningStep ? (
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-3xl text-left space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Share Privacy Warning</span>
            </div>

            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              Anyone with this link may be able to view this document and its AI action plan.
              {isPasswordProtected && ' (Since this document is password protected, viewers will also need your password to unlock the full analysis).' }
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowWarningStep(false)}
                className="flex-1 py-2.5 bg-white border border-amber-300 text-amber-950 font-bold text-xs rounded-xl"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleCreateShare}
                disabled={creating}
                className="flex-1 py-2.5 bg-zinc-950 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs"
              >
                {creating ? 'Creating...' : 'CREATE SHARE LINK'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-3xl text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
                Create New Link
              </span>
              {isPasswordProtected && (
                <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-semibold bg-zinc-200/80 px-2 py-0.5 rounded-full">
                  <Lock className="w-3 h-3 text-zinc-600" />
                  <span>Password Protected</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                  PERMISSION
                </label>
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800"
                >
                  <option value="VIEW_ONLY">View Only</option>
                  <option value="VIEW_AND_DOWNLOAD">View + Download</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                  EXPIRES IN
                </label>
                <select
                  value={expiryOption}
                  onChange={(e) => setExpiryOption(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800"
                >
                  <option value="24">1 day</option>
                  <option value="168">7 days (Default)</option>
                  <option value="720">30 days</option>
                  <option value="never">Never (Manual Revoke)</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowWarningStep(true)}
              className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>GENERATE SHARE LINK</span>
            </button>
          </div>
        )}

        {/* Step 2: Active Links List */}
        <div className="text-left space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Active Share Links ({activeShares.length})
            </span>
          </div>

          {activeShares.length === 0 ? (
            <div className="p-4 bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl text-center">
              <span className="text-xs text-zinc-400 font-medium">
                No active share links. Documents are private by default.
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {activeShares.map((s) => {
                const isCopied = copiedToken === s.share_token;
                return (
                  <div
                    key={s.id}
                    className="p-3 bg-white border border-zinc-200/90 rounded-2xl shadow-2xs space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-mono text-[11px] text-zinc-800 font-semibold bg-zinc-100 px-2 py-0.5 rounded-lg truncate max-w-[160px]">
                          ...{s.share_token.slice(-10)}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase">
                          {s.permission === 'VIEW_ONLY' ? 'View Only' : 'Downloadable'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleRevoke(s.id)}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Revoke</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-zinc-100">
                      <button
                        onClick={() => handleCopyLink(s.share_token)}
                        className="flex-1 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>COPIED!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-zinc-600" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleNativeShare(s.share_token)}
                        className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors"
                        title="Share via device..."
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {s.expires_at && (
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                        <Clock className="w-3 h-3 text-zinc-300" />
                        <span>Expires: {new Date(s.expires_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Revoked Links count if any */}
        {shares.filter((s) => s.revoked_at).length > 0 && (
          <div className="text-[10px] text-zinc-400 text-center">
            {shares.filter((s) => s.revoked_at).length} previously revoked link(s) stopped permanently.
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
