import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Share2,
  Bookmark,
  BookmarkCheck,
  HelpCircle,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info,
  ExternalLink,
  MessageSquare,
  ListTodo,
  FileCheck,
  RotateCcw,
  Printer,
  FileDown,
} from 'lucide-react';
import { AnalysisResult, UrgencyLevel, DetailStatus } from '../types';
import { ShareModal } from './ShareModal';

interface ResultsScreenProps {
  analysis: AnalysisResult;
  isSaved: boolean;
  onToggleSave: () => void;
  onCheckAnother: () => void;
  onShowToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  analysis,
  isSaved,
  onToggleSave,
  onCheckAnother,
  onShowToast,
}) => {
  // Interactive step completion tracking
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  // Tone selection for suggested response
  const [selectedTone, setSelectedTone] = useState<'default' | 'formal' | 'friendly' | 'firm'>('default');
  const [isRewritingTone, setIsRewritingTone] = useState(false);
  const [customRewrittenResponse, setCustomRewrittenResponse] = useState<Record<string, string>>({});
  // Expandable sections for progressive disclosure
  const [showDetails, setShowDetails] = useState(true);
  const [showQuestions, setShowQuestions] = useState(true);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [copiedQuestionIndex, setCopiedQuestionIndex] = useState<number | null>(null);
  // Share Sheet / Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Trigger browser print dialog (which enables Save as PDF natively on all platforms)
  const handlePrint = () => {
    try {
      window.print();
    } catch {
      onShowToast('Could not open print dialog', 'error');
    }
  };

  // Get active response based on tone
  const getActiveResponse = (): string => {
    if (customRewrittenResponse[selectedTone]) {
      return customRewrittenResponse[selectedTone];
    }
    if (selectedTone === 'formal' && analysis.suggestedResponseFormal) {
      return analysis.suggestedResponseFormal;
    }
    if (selectedTone === 'friendly' && analysis.suggestedResponseFriendly) {
      return analysis.suggestedResponseFriendly;
    }
    if (selectedTone === 'firm' && analysis.suggestedResponseFirm) {
      return analysis.suggestedResponseFirm;
    }
    return analysis.suggestedResponse;
  };

  const handleCopyResponse = async () => {
    const textToCopy = getActiveResponse();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedResponse(true);
      onShowToast('Response copied to clipboard', 'success');
      setTimeout(() => setCopiedResponse(false), 2400);
    } catch {
      onShowToast('Could not copy to clipboard automatically', 'error');
    }
  };

  const handleCopyQuestion = async (question: string, index: number) => {
    try {
      await navigator.clipboard.writeText(question);
      setCopiedQuestionIndex(index);
      onShowToast('Question copied to clipboard', 'success');
      setTimeout(() => setCopiedQuestionIndex(null), 2000);
    } catch {
      onShowToast('Failed to copy question', 'error');
    }
  };

  const handleToneChange = async (tone: 'default' | 'formal' | 'friendly' | 'firm') => {
    setSelectedTone(tone);
    if (tone === 'default') return;

    // Check if we already have it from the structured response
    if (tone === 'formal' && analysis.suggestedResponseFormal) return;
    if (tone === 'friendly' && analysis.suggestedResponseFriendly) return;
    if (tone === 'firm' && analysis.suggestedResponseFirm) return;
    if (customRewrittenResponse[tone]) return;

    // If needed, fetch server rewrite
    setIsRewritingTone(true);
    try {
      const res = await fetch('/api/rewrite-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalResponse: analysis.suggestedResponse,
          tone,
          documentContext: `${analysis.documentType}: ${analysis.title}`,
        }),
      });
      const data = await res.json();
      if (data.response) {
        setCustomRewrittenResponse((prev) => ({ ...prev, [tone]: data.response }));
      }
    } catch (err) {
      console.error('Failed to rewrite tone:', err);
    } finally {
      setIsRewritingTone(false);
    }
  };

  // Helper for Urgency Badge
  const getUrgencyConfig = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'TODAY':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          icon: AlertTriangle,
          label: 'URGENT · TODAY',
        };
      case 'SOON':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: Clock,
          label: 'ACTION REQUIRED · SOON',
        };
      case 'UPCOMING':
        return {
          bg: 'bg-sky-50 text-sky-800 border-sky-200',
          icon: Calendar,
          label: 'UPCOMING DEADLINE',
        };
      case 'NO DEADLINE FOUND':
      default:
        return {
          bg: 'bg-zinc-100 text-zinc-700 border-zinc-200',
          icon: Info,
          label: 'NO DEADLINE IDENTIFIED',
        };
    }
  };

  const urgencyConfig = getUrgencyConfig(analysis.urgency);
  const UrgencyIcon = urgencyConfig.icon;

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] px-4 pb-32 pt-2 max-w-lg mx-auto w-full print-container">
      {/* Printable Header (Visible only in print / exported PDF) */}
      <div className="hidden print:block mb-6 pb-4 border-b-2 border-zinc-900 text-left">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black px-2 py-0.5 bg-black text-white rounded">
              DO THIS
            </span>
            <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
              Document Action Plan
            </span>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>
        <h1 className="text-xl font-black text-zinc-950">{analysis.title}</h1>
        <div className="text-xs text-zinc-600 mt-1">
          <span>Category: {analysis.documentType}</span>
          <span className="mx-2">·</span>
          <span>Deadline: {analysis.deadline}</span>
          <span className="mx-2">·</span>
          <span>Urgency: {analysis.urgency}</span>
        </div>
      </div>

      {/* Document Meta Header (Interactive Screen) */}
      <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-zinc-200 shadow-xs mb-4 no-print">
        <div className="flex items-center gap-2 truncate pr-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded font-mono border border-zinc-200">
            {analysis.documentType}
          </span>
          <span className="text-zinc-300">·</span>
          <span className="text-xs font-black text-zinc-950 truncate">
            {analysis.title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Save Button */}
          <button
            onClick={onToggleSave}
            className={`p-2 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 ${
              isSaved
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-zinc-100 border-zinc-200 text-zinc-800 hover:text-zinc-950'
            }`}
            aria-label={isSaved ? 'Analysis saved' : 'Save analysis'}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-black hidden xs:inline">SAVED</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 text-zinc-700" />
                <span className="text-[11px] font-black hidden xs:inline">SAVE</span>
              </>
            )}
          </button>

          {/* Print / Save as PDF Button */}
          <button
            onClick={handlePrint}
            className="p-2 rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-800 hover:text-zinc-950 active:scale-95 transition-all flex items-center gap-1"
            title="Print or Save as PDF"
            aria-label="Print or Save as PDF"
          >
            <Printer className="w-4 h-4 text-zinc-700" />
            <span className="text-[11px] font-black hidden xs:inline">PDF</span>
          </button>

          {/* Share Button (Pulls up Details and Share options) */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="p-2 rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-800 hover:text-zinc-950 active:scale-95 transition-all flex items-center gap-1"
            title="Share Action Plan"
            aria-label="Share Action Plan"
          >
            <Share2 className="w-4 h-4 text-zinc-700" />
            <span className="text-[11px] font-black hidden xs:inline">SHARE</span>
          </button>
        </div>
      </div>

      {/* 1. WHAT THIS MEANS (High-contrast editorial header) */}
      <section className="bg-white rounded-3xl p-5 shadow-xs border border-zinc-200 mb-4 animate-card-reveal stagger-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-[11px] font-black tracking-wider uppercase text-zinc-800 block">
            [01 // WHAT THIS MEANS]
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-800 font-black bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            CONFIRMED
          </span>
        </div>
        <p className="text-base sm:text-lg font-black text-zinc-950 leading-snug">
          {analysis.oneSentenceMeaning}
        </p>
      </section>

      {/* 2. DO THIS (The Hero Single Most Important Action) */}
      <section className="bg-zinc-950 text-white rounded-3xl p-5 sm:p-6 mb-4 relative overflow-hidden print-hero-card lock-in-hero-panel animate-card-reveal stagger-2">
        <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 text-zinc-950 flex items-center justify-center font-black text-xs">
              ✓
            </div>
            <span className="text-xs font-black tracking-widest uppercase text-emerald-400 font-mono">
              DO THIS FIRST
            </span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-zinc-900/90 px-2 py-0.5 rounded border border-zinc-800">
            [ACTION LOCKED]
          </span>
        </div>

        <h3 className="text-lg sm:text-xl font-black tracking-tight text-white leading-snug mt-1 relative z-10">
          {analysis.primaryAction}
        </h3>

        {/* Quick action button inside card */}
        <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between flex-wrap gap-2 no-print relative z-10">
          <span className="text-xs text-zinc-300 font-mono text-[11px] font-bold">
            Single most important action
          </span>
          <button
            onClick={() => {
              if (!completedSteps.includes(0)) {
                setCompletedSteps((prev) => [...prev, 0]);
                onShowToast('Marked primary action as done!', 'success');
              } else {
                setCompletedSteps((prev) => prev.filter((i) => i !== 0));
              }
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-[0.98] ${
              completedSteps.includes(0)
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-mono text-[11px] tracking-wide">{completedSteps.includes(0) ? 'COMPLETED' : 'MARK DONE'}</span>
          </button>
        </div>
      </section>

      {/* 3. DEADLINE & URGENCY CARD */}
      <section className="bg-white rounded-3xl p-5 shadow-xs border border-zinc-200 mb-4 animate-card-reveal stagger-3">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[11px] font-black tracking-wider uppercase text-zinc-800">
            [02 // DEADLINE]
          </span>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-black ${urgencyConfig.bg}`}>
            <UrgencyIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="font-mono text-[10px] tracking-wide">{urgencyConfig.label}</span>
          </div>
        </div>

        <div className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
          {analysis.deadline}
        </div>

        {/* Source Evidence */}
        <div className="mt-3 pt-3 border-t border-zinc-100 flex items-start gap-2 text-xs text-zinc-800 bg-zinc-50 p-3 rounded-2xl border border-zinc-200">
          <FileCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-black text-zinc-950 font-mono text-[11px]">SOURCE EVIDENCE: </span>
            <span className="italic font-medium text-zinc-800">“{analysis.deadlineEvidence}”</span>
          </div>
        </div>
      </section>

      {/* 4. WHY IT MATTERS */}
      <section className="bg-white rounded-3xl p-5 shadow-xs border border-zinc-200 mb-4 animate-card-reveal stagger-3">
        <span className="font-mono text-[11px] font-black tracking-wider uppercase text-zinc-800 block mb-1.5">
          [03 // WHY IT MATTERS]
        </span>
        <p className="text-sm font-semibold text-zinc-800 leading-relaxed">
          {analysis.whyItMatters}
        </p>
      </section>

      {/* 5. YOUR NEXT STEPS (Interactive Checklist on screen / clean list in print) */}
      <section className="bg-white rounded-3xl p-5 shadow-xs border border-zinc-200 mb-4 animate-card-reveal stagger-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black tracking-wider uppercase text-zinc-800 font-mono">
            [YOUR NEXT STEPS]
          </span>
          <span className="text-xs font-black text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200 no-print">
            {completedSteps.length} of {analysis.steps.length} done
          </span>
        </div>

        <div className="space-y-2.5">
          {analysis.steps.map((step, idx) => {
            const isDone = completedSteps.includes(idx);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggleStep(idx)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 active:scale-[0.99] ${
                  isDone
                    ? 'bg-emerald-50/60 border-emerald-200 text-zinc-500'
                    : 'bg-zinc-50 hover:bg-zinc-100/70 border-zinc-200/80 text-zinc-900'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isDone
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-zinc-300 bg-white'
                  }`}
                >
                  {isDone ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <span className="text-[10px] font-bold text-zinc-600">
                      {idx + 1}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <span
                    className={`text-xs sm:text-sm font-semibold leading-relaxed block ${
                      isDone ? 'line-through text-zinc-400' : 'text-zinc-900'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. YOU MAY NEED */}
      {analysis.whatYouNeed && analysis.whatYouNeed.length > 0 && (
        <section className="bg-white rounded-3xl p-5 shadow-xs border border-zinc-200/90 mb-4">
          <span className="text-[11px] font-extrabold tracking-wider uppercase text-zinc-400 block mb-2.5">
            YOU MAY NEED
          </span>
          <ul className="space-y-2">
            {analysis.whatYouNeed.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-zinc-700"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 shrink-0 mt-2" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 7. IF YOU DO NOTHING */}
      <section className="bg-white rounded-3xl p-5 shadow-xs border border-zinc-200 mb-4 animate-card-reveal stagger-4">
        <span className="font-mono text-[11px] font-black tracking-wider uppercase text-zinc-800 block mb-1.5">
          [04 // RISK OF INACTION]
        </span>
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm font-semibold text-zinc-800 leading-relaxed">
            {analysis.ifYouDoNothing}
          </p>
        </div>
      </section>

      {/* 8. COPY THIS RESPONSE (Ready-to-send draft message) */}
      <section className="bg-white rounded-3xl p-5 shadow-xs border border-zinc-200 mb-4 animate-card-reveal stagger-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-zinc-900" />
            <span className="font-mono text-[11px] font-black tracking-wider uppercase text-zinc-800">
              [05 // READY-TO-SEND RESPONSE]
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-700 font-black bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 no-print">
            Short & Specific
          </span>
        </div>

        <p className="text-xs text-zinc-700 font-semibold mb-3">
          Send this email, letter, or message to the company or agency:
        </p>

        {/* Tone Adjuster Buttons (Screen only) */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl mb-3 overflow-x-auto no-print">
          {(
            [
              { key: 'default', label: 'Default' },
              { key: 'friendly', label: 'Friendlier' },
              { key: 'formal', label: 'More Formal' },
              { key: 'firm', label: 'Firmer' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => handleToneChange(t.key)}
              disabled={isRewritingTone}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap ${
                selectedTone === t.key
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-700 hover:text-zinc-950'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Response Box */}
        <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 relative mb-3">
          {isRewritingTone ? (
            <div className="py-4 text-center text-xs text-zinc-600 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-zinc-800" />
              <span className="font-semibold">Rewriting in {selectedTone} tone...</span>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-zinc-900 font-medium leading-relaxed whitespace-pre-line select-all">
              {getActiveResponse()}
            </p>
          )}
        </div>

        {/* Big Copy Button (Screen only) */}
        <button
          onClick={handleCopyResponse}
          className="w-full py-3.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white font-black text-xs sm:text-sm rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm no-print"
        >
          {copiedResponse ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>COPIED TO CLIPBOARD!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>COPY THIS RESPONSE</span>
            </>
          )}
        </button>
      </section>

      {/* 9. QUESTIONS TO ASK */}
      {analysis.questionsToAsk && analysis.questionsToAsk.length > 0 && (
        <section className="bg-white rounded-3xl p-5 shadow-xs border border-zinc-200 mb-4 animate-card-reveal stagger-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[11px] font-black tracking-wider uppercase text-zinc-800">
              [06 // QUESTIONS TO ASK THEM]
            </span>
            <button
              onClick={() => setShowQuestions(!showQuestions)}
              className="text-zinc-600 hover:text-zinc-900 p-1 no-print"
            >
              {showQuestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {(showQuestions || typeof window !== 'undefined') && (
            <div className="space-y-2">
              {analysis.questionsToAsk.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 gap-2"
                >
                  <p className="text-xs font-bold text-zinc-900 leading-snug">
                    {q}
                  </p>
                  <button
                    onClick={() => handleCopyQuestion(q, idx)}
                    className="p-1.5 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-200/80 rounded-lg shrink-0 transition-colors no-print"
                    title="Copy question"
                    aria-label="Copy question"
                  >
                    {copiedQuestionIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 10. IMPORTANT DETAILS (Table / Grid with explicit verification status) */}
      {analysis.importantDetails && analysis.importantDetails.length > 0 && (
        <section className="bg-white rounded-3xl p-5 shadow-xs border border-zinc-200 mb-4 animate-card-reveal stagger-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[11px] font-black tracking-wider uppercase text-zinc-800">
              [07 // IMPORTANT FACTS & DETAILS]
            </span>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-zinc-600 hover:text-zinc-900 p-1 no-print"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {(showDetails || typeof window !== 'undefined') && (
            <div className="divide-y divide-zinc-100">
              {analysis.importantDetails.map((detail, idx) => (
                <div key={idx} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-zinc-700 font-mono">
                      {detail.label}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full ${
                        detail.status === 'EXPLICITLY STATED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : detail.status === 'INFERRED'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                      }`}
                    >
                      [{detail.status}]
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-black text-zinc-950 mt-1">
                    {detail.value}
                  </p>
                  {detail.evidence && (
                    <p className="text-xs text-zinc-600 italic mt-0.5 font-mono">
                      Evidence: “{detail.evidence}”
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 11. UNCERTAINTIES & MISSING INFORMATION (If any) */}
      {analysis.uncertainties && analysis.uncertainties.length > 0 && (
        <section className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-5 mb-4">
          <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wider mb-2">
            <HelpCircle className="w-4 h-4 text-amber-700" />
            <span>UNRESOLVED OR MISSING INFORMATION</span>
          </div>
          <p className="text-xs text-amber-800 mb-2 leading-relaxed">
            The document does not explicitly provide these details:
          </p>
          <ul className="space-y-1.5">
            {analysis.uncertainties.map((u, idx) => (
              <li key={idx} className="text-xs text-amber-900 font-medium flex items-start gap-2">
                <span className="text-amber-500 font-bold">·</span>
                <span>{u}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Bottom Action Bar (Screen only) */}
      <div className="mt-4 pt-4 border-t border-zinc-200 flex flex-col gap-2.5 no-print">
        {/* Share & Print Action Row */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="w-full py-3.5 px-4 bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs sm:text-sm rounded-2xl border border-zinc-200 shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span>SHARE PLAN</span>
          </button>

          <button
            onClick={handlePrint}
            className="w-full py-3.5 px-4 bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs sm:text-sm rounded-2xl border border-zinc-200 shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4 text-zinc-700" />
            <span>PRINT / PDF</span>
          </button>
        </div>

        {/* Check Another Document */}
        <button
          onClick={onCheckAnother}
          className="w-full py-4 px-6 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-sm rounded-2xl transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg"
        >
          <RotateCcw className="w-4 h-4 text-emerald-400" />
          <span>CHECK ANOTHER DOCUMENT</span>
        </button>
      </div>

      {/* Mandatory AI Disclaimer */}
      <div className="mt-6 text-center px-4">
        <p className="text-[11px] text-zinc-400 leading-relaxed max-w-sm mx-auto">
          DO THIS provides AI-generated information and is not a substitute for professional legal, financial, medical, tax, or other professional advice.
        </p>
      </div>

      {/* Comprehensive Share Modal (Pulls up details & allows sharing to Email, Messages, PDF, etc.) */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        analysis={analysis}
        onPrint={handlePrint}
        onShowToast={onShowToast}
      />
    </div>
  );
};
