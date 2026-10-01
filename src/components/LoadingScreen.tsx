import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, FileSearch, Calendar, ListChecks, Check, Shield } from 'lucide-react';

interface LoadingScreenProps {
  documentName?: string;
  onPhaseChange?: (phase: number) => void;
}

const STAGES = [
  {
    label: 'READING YOUR DOCUMENT',
    subtext: 'Scanning text, layout, headers, and sender details',
    detail: 'Extracting clauses and document structure...',
    icon: FileSearch,
    durationMs: 2800,
  },
  {
    label: 'FINDING THE IMPORTANT PARTS',
    subtext: 'Isolating dates, amounts, policies, and key clauses',
    detail: 'Checking for explicit fees, terms, and obligations...',
    icon: Sparkles,
    durationMs: 2800,
  },
  {
    label: 'FIGURING OUT WHAT YOU NEED TO DO',
    subtext: 'Verifying deadlines, risks, and required actions',
    detail: 'Cross-referencing stated consequences and timelines...',
    icon: Calendar,
    durationMs: 2800,
  },
  {
    label: 'BUILDING YOUR NEXT STEPS',
    subtext: 'Formulating your plain-English, action-first plan',
    detail: 'Drafting your ready-to-send response and checklist...',
    icon: ListChecks,
    durationMs: 2800,
  },
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ documentName, onPhaseChange }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(6);

  useEffect(() => {
    // Total duration ~11,200ms
    const totalDuration = STAGES.reduce((acc, s) => acc + s.durationMs, 0);
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const fraction = Math.min(elapsed / totalDuration, 1);
      const percent = Math.max(6, Math.min(Math.round(fraction * 100), 98));

      // Smooth progress calculation
      setProgressPercent(percent);

      // Map progress percent to the 8 Dot Field phases (0 to 7)
      let phase = 0;
      if (percent < 12) phase = 0; // RECEIVE
      else if (percent < 30) phase = 1; // SCAN
      else if (percent < 50) phase = 2; // DISCOVER
      else if (percent < 70) phase = 3; // EXTRACT
      else if (percent < 84) phase = 4; // ORGANIZE
      else if (percent < 94) phase = 5; // RESOLVE
      else if (percent < 98) phase = 6; // REVEAL
      else phase = 7; // SETTLE

      if (onPhaseChange) {
        onPhaseChange(phase);
      }

      // Determine current stage
      let accumulated = 0;
      for (let i = 0; i < STAGES.length; i++) {
        accumulated += STAGES[i].durationMs;
        if (elapsed < accumulated || i === STAGES.length - 1) {
          setCurrentStageIndex(i);
          break;
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [onPhaseChange]);

  const activeStage = STAGES[currentStageIndex];
  const ActiveIcon = activeStage.icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-5 pb-28 pt-4 max-w-md mx-auto text-center w-full animate-in fade-in duration-300 relative z-10">
      
      {/* Animated Central Scanner Device */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-zinc-950 flex flex-col items-center justify-center text-white shadow-2xl shadow-zinc-950/25 relative overflow-hidden technical-bracket-card">
          {/* Subtle scanning laser bar */}
          <div className="edge-scanner-line" />
          
          <ActiveIcon className="w-9 h-9 text-emerald-400 transition-all duration-300 transform scale-105" />
          
          <span className="font-mono text-[11px] text-zinc-400 font-bold mt-2 tracking-wider">
            {progressPercent}%
          </span>
        </div>

        {/* Outer glowing pulsing halo */}
        <div className="absolute -inset-2 rounded-[32px] border border-zinc-200/80 animate-pulse pointer-events-none" />
        <div className="absolute -inset-3.5 rounded-[36px] border border-zinc-100/90 pointer-events-none" />
      </div>

      {/* Prominent Stage Headline - Solid non-transparent card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200 shadow-xs w-full mb-3.5">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 transition-all duration-300">
          {activeStage.label}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-700 font-semibold mt-1 transition-all duration-300 leading-snug">
          {activeStage.subtext}
        </p>
      </div>

      {/* Modern Progress Bar - Solid non-transparent card */}
      <div className="w-full bg-white rounded-2xl p-3.5 sm:p-4 border border-zinc-200 shadow-xs mb-4">
        <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden p-0.5 border border-zinc-200/60">
          <div
            className="h-full bg-zinc-950 rounded-full transition-all duration-200 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-700 font-bold mt-2.5 px-0.5">
          <span className="truncate pr-2 font-mono text-[11px] uppercase tracking-wider text-zinc-800">{activeStage.detail}</span>
          <span className="font-mono shrink-0 font-black text-zinc-950">{progressPercent}%</span>
        </div>
      </div>

      {/* 4 Staged Progression List - Solid non-transparent white */}
      <div className="w-full space-y-2.5 bg-white p-4 sm:p-5 rounded-3xl border border-zinc-200 shadow-xs">
        {STAGES.map((stage, idx) => {
          const isDone = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;
          const StepIcon = stage.icon;

          return (
            <div
              key={stage.label}
              className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 ${
                isCurrent
                  ? 'bg-zinc-950 text-white font-bold shadow-md scale-[1.01]'
                  : isDone
                  ? 'bg-emerald-50 border border-emerald-200 text-zinc-900 font-bold'
                  : 'text-zinc-600 font-semibold bg-zinc-50 border border-zinc-200/60'
              }`}
            >
              {/* Status Indicator Icon */}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-zinc-800 text-emerald-400'
                    : 'bg-zinc-200 text-zinc-400'
                }`}
              >
                {isDone ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <StepIcon className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Stage Title */}
              <div className="text-left flex-1 min-w-0">
                <span className="text-xs block leading-tight truncate">
                  {stage.label}
                </span>
              </div>

              {/* State Badge / Pulse */}
              {isCurrent && (
                <div className="flex items-center gap-1.5 shrink-0 pr-1">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold font-mono">
                    Analyzing
                  </span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
              )}

              {isDone && (
                <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold shrink-0 pr-1 font-mono">
                  Complete
                </span>
              )}
            </div>
          );
        })}
      </div>

      {documentName && (
        <div className="mt-5 px-3.5 py-1.5 rounded-full bg-white text-zinc-700 text-xs font-semibold truncate max-w-xs border border-zinc-200 shadow-2xs">
          Document: <span className="font-bold text-zinc-950">{documentName}</span>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="mt-4 inline-flex items-center justify-center gap-1.5 text-xs text-zinc-800 font-bold bg-white px-3.5 py-1.5 rounded-full border border-zinc-200 shadow-2xs">
        <Shield className="w-3.5 h-3.5 text-emerald-600" />
        <span className="font-mono text-[10px] uppercase tracking-wider font-bold">Action-First Grounding · Never Hallucinates</span>
      </div>
    </div>
  );
};
