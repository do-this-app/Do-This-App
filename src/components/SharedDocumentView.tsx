import React, { useState, useEffect } from 'react';
import {
  Lock,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileCheck,
  Check,
  Copy,
  MessageSquare,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { api } from '../lib/api';
import { AnalysisResult, UrgencyLevel } from '../types';

interface SharedDocumentViewProps {
  shareToken: string;
  onExitShare: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const SharedDocumentView: React.FC<SharedDocumentViewProps> = ({
  shareToken,
  onExitShare,
  onShowToast,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProtected, setIsProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  // Document & analysis
  const [docMeta, setDocMeta] = useState<any>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    async function loadShare() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getPublicShare(shareToken);
        setDocMeta(data.document);
        setIsProtected(data.isProtected);
        if (data.analysis) {
          setAnalysis(data.analysis);
        }
      } catch (err: any) {
        setError(err.message || 'This shared link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    }
    loadShare();
  }, [shareToken]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setUnlocking(true);
    try {
      const fullAnalysis = await api.unlockPublicShare(shareToken, password);
      setAnalysis(fullAnalysis);
      setIsProtected(false);
      onShowToast('Document unlocked successfully', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Incorrect password', 'error');
    } finally {
      setUnlocking(false);
    }
  };

  const handleCopyResponse = async () => {
    if (!analysis?.suggestedResponse) return;
    try {
      await navigator.clipboard.writeText(analysis.suggestedResponse);
      setCopiedResponse(true);
      onShowToast('Response copied to clipboard', 'success');
      setTimeout(() => setCopiedResponse(false), 2000);
    } catch {
      onShowToast('Failed to copy', 'error');
    }
  };

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center text-emerald-400 animate-pulse mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-zinc-800">Loading shared action plan...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-zinc-950 mb-1">Link Unavailable</h2>
        <p className="text-xs text-zinc-600 mb-6 leading-relaxed">
          {error}
        </p>
        <button
          onClick={onExitShare}
          className="px-6 py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs"
        >
          Go to DO THIS Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Top Banner */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-zinc-950 flex items-center justify-center text-white font-mono font-bold text-xs">
              DT
            </div>
            <span className="font-extrabold text-sm tracking-tight text-zinc-950">
              DO THIS <span className="text-[11px] font-medium text-zinc-400">· Shared Plan</span>
            </span>
          </div>

          <button
            onClick={onExitShare}
            className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>Analyze your own</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 space-y-4">
        {/* Document Header */}
        <div className="p-4 bg-white rounded-3xl border border-zinc-200/90 shadow-xs text-left">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 truncate">
              {docMeta?.document_type || 'Document'}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold bg-zinc-100 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Verified Share</span>
            </div>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-zinc-950 tracking-tight leading-snug">
            {docMeta?.title}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1 leading-relaxed">
            {docMeta?.summary}
          </p>
        </div>

        {/* Password Prompt If Protected */}
        {isProtected && !analysis && (
          <div className="p-6 bg-white rounded-3xl border border-zinc-200/90 shadow-md text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center text-emerald-400 mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-950">
                This document is password protected
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto leading-relaxed">
                The owner has secured this action plan. Enter the password below to unlock.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="max-w-xs mx-auto space-y-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
              <button
                type="submit"
                disabled={unlocking || !password}
                className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs"
              >
                {unlocking ? 'Verifying...' : 'UNLOCK ACTION PLAN'}
              </button>
            </form>
          </div>
        )}

        {/* Full Analysis Content When Unlocked */}
        {analysis && (
          <>
            {/* DO THIS FIRST HERO */}
            <section className="bg-zinc-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-zinc-950/10 text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500 text-zinc-950 flex items-center justify-center font-black text-xs">
                  ✓
                </div>
                <span className="text-xs font-black tracking-widest uppercase text-emerald-400">
                  DO THIS FIRST
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
                {analysis.primaryAction}
              </h2>
            </section>

            {/* DEADLINE */}
            <section className="bg-white rounded-3xl p-5 shadow-xs border border-zinc-200/90 text-left">
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-zinc-400 block mb-1">
                DEADLINE
              </span>
              <div className="text-xl font-black text-zinc-950">
                {analysis.deadline}
              </div>
              {analysis.deadlineEvidence && (
                <div className="mt-2.5 pt-2.5 border-t border-zinc-100 flex items-start gap-2 text-xs text-zinc-600 bg-zinc-50 p-2.5 rounded-xl">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="italic">“{analysis.deadlineEvidence}”</span>
                </div>
              )}
            </section>

            {/* WHY IT MATTERS */}
            <section className="bg-white rounded-3xl p-5 shadow-xs border border-zinc-200/90 text-left">
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-zinc-400 block mb-1">
                WHY IT MATTERS
              </span>
              <p className="text-xs sm:text-sm text-zinc-700 font-medium leading-relaxed">
                {analysis.whyItMatters}
              </p>
            </section>

            {/* NEXT STEPS */}
            <section className="bg-white rounded-3xl p-5 shadow-xs border border-zinc-200/90 text-left">
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-zinc-400 block mb-3">
                NEXT STEPS CHECKLIST
              </span>
              <div className="space-y-2">
                {analysis.steps.map((step, idx) => {
                  const isDone = completedSteps.includes(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleStep(idx)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                        isDone
                          ? 'bg-emerald-50/60 border-emerald-200 text-zinc-400'
                          : 'bg-zinc-50 border-zinc-200/80 text-zinc-900'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-zinc-300 bg-white text-zinc-600 font-bold text-[10px]'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                      </div>
                      <span
                        className={`text-xs sm:text-sm font-semibold leading-relaxed ${
                          isDone ? 'line-through text-zinc-400' : 'text-zinc-900'
                        }`}
                      >
                        {step}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* DRAFT RESPONSE */}
            {analysis.suggestedResponse && (
              <section className="bg-white rounded-3xl p-5 shadow-xs border border-zinc-200/90 text-left">
                <span className="text-[11px] font-extrabold tracking-wider uppercase text-zinc-400 block mb-2">
                  SUGGESTED RESPONSE
                </span>
                <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200 text-xs sm:text-sm text-zinc-800 leading-relaxed mb-3">
                  {analysis.suggestedResponse}
                </div>
                <button
                  onClick={handleCopyResponse}
                  className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                >
                  {copiedResponse ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>COPIED TO CLIPBOARD</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>COPY RESPONSE</span>
                    </>
                  )}
                </button>
              </section>
            )}

            {/* Bottom Call to Action */}
            <div className="p-5 bg-zinc-950 text-white rounded-3xl text-center space-y-3">
              <h3 className="text-base font-black">
                Have a confusing letter, bill, or notice?
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                DO THIS transforms complex documents into plain-English next steps in seconds.
              </p>
              <button
                onClick={onExitShare}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>CHECK YOUR DOCUMENT FREE</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
