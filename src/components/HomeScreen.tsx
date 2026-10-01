import React from 'react';
import { Camera, FileUp, ClipboardPaste, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { SAMPLE_DOCUMENTS, SampleDocument } from '../data/samples';

interface HomeScreenProps {
  onStartUpload: (initialMode?: 'file' | 'camera' | 'paste') => void;
  onSelectSample: (sample: SampleDocument) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartUpload,
  onSelectSample,
}) => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] px-4 pb-28 pt-3 max-w-lg mx-auto w-full">
      {/* Hero Header Card - Solid non-transparent white */}
      <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs mb-4 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-[11px] font-black tracking-wide uppercase mb-3 border border-zinc-200/80">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Action-First Document Intelligence
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 leading-tight">
          WHAT DO YOU <br className="hidden xs:inline" />
          NEED TO DO?
        </h1>

        <p className="mt-2 text-xs sm:text-sm text-zinc-700 font-semibold leading-relaxed max-w-xs mx-auto">
          Upload something confusing and we’ll turn it into clear next steps.
        </p>
      </div>

      {/* Main Action Card - Solid non-transparent white */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-zinc-200 mb-5">
        <div className="flex flex-col gap-3">
          {/* Primary CTA */}
          <button
            onClick={() => onStartUpload('file')}
            className="w-full flex items-center justify-between p-4 bg-zinc-950 hover:bg-zinc-800 text-white font-black rounded-2xl shadow-md active:scale-[0.985] transition-all group min-h-[58px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 text-white flex items-center justify-center shrink-0 border border-zinc-700">
                <FileUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="block text-base font-black tracking-tight">
                    CHECK SOMETHING
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400 font-extrabold px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700">
                    SCAN
                  </span>
                </div>
                <span className="block text-xs text-zinc-300 font-medium">
                  Photo, PDF, letter, bill, or notice
                </span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Quick Shortcuts Row */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={() => onStartUpload('camera')}
              className="flex items-center justify-center gap-2 p-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl font-black text-xs transition-all active:scale-[0.98] min-h-[46px] border border-zinc-200"
            >
              <Camera className="w-4 h-4 text-zinc-700" />
              <span className="font-mono text-[11px] tracking-wide">TAKE PHOTO</span>
            </button>
            <button
              onClick={() => onStartUpload('paste')}
              className="flex items-center justify-center gap-2 p-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl font-black text-xs transition-all active:scale-[0.98] min-h-[46px] border border-zinc-200"
            >
              <ClipboardPaste className="w-4 h-4 text-zinc-700" />
              <span className="font-mono text-[11px] tracking-wide">PASTE TEXT</span>
            </button>
          </div>
        </div>

        {/* Input Scope Clarification */}
        <div className="mt-4 pt-3.5 border-t border-zinc-100 text-center">
          <p className="text-xs text-zinc-700 font-semibold leading-snug">
            You can upload a photo, screenshot, PDF, letter, email, notice, or paste the text.
          </p>
        </div>
      </div>

      {/* Try a Real-World Sample Drawer - Solid non-transparent card */}
      <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-xs mb-5">
        <div className="flex items-center justify-between mb-3 px-0.5">
          <span className="font-mono text-xs font-black uppercase tracking-wider text-zinc-950">
            Real-World Benchmarks
          </span>
          <span className="font-mono text-[10px] text-zinc-600 font-bold uppercase tracking-wider bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
            Instant Test
          </span>
        </div>

        <div className="space-y-2">
          {SAMPLE_DOCUMENTS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelectSample(sample)}
              className="w-full text-left p-3.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-2xl transition-all active:scale-[0.985] flex items-center justify-between group"
            >
              <div className="pr-2 truncate">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-zinc-950 truncate">
                    {sample.name}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-zinc-600 bg-white px-1.5 py-0.5 rounded border border-zinc-200 shrink-0">
                    [{sample.category}]
                  </span>
                </div>
                <p className="text-xs text-zinc-700 font-medium truncate mt-0.5">
                  {sample.hint}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-zinc-700 group-hover:text-zinc-950 transition-colors">
                <span className="font-mono text-[11px]">RUN</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Privacy Notice Banner - Solid non-transparent */}
      <div className="mt-auto pt-2 pb-4">
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-white border border-zinc-200 text-zinc-700 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs font-medium leading-relaxed">
            <span className="font-bold text-zinc-950">Private by design.</span>{' '}
            Your document may contain sensitive information. Only upload documents you’re comfortable having analyzed. Nothing is stored permanently without your choice.
          </div>
        </div>
      </div>
    </div>
  );
};
