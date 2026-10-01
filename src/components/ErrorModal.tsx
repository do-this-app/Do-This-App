import React from 'react';
import { AlertCircle, RotateCcw, FileUp, X } from 'lucide-react';

interface ErrorModalProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss: () => void;
  onPickAnother?: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  error,
  onRetry,
  onDismiss,
  onPickAnother,
}) => {
  if (!error) return null;

  // Provide a friendly, human explanation
  let headline = 'Something went wrong';
  let advice = 'We encountered an issue reading or analyzing the document.';

  const errLower = error.toLowerCase();
  if (errLower.includes('too large')) {
    headline = 'File size too large';
    advice = 'Please upload a photo or document smaller than 25MB.';
  } else if (errLower.includes('unsupported') || errLower.includes('file type')) {
    headline = 'Unsupported file format';
    advice = 'We can analyze photos (JPG, PNG, WebP), PDFs, or pasted text directly.';
  } else if (errLower.includes('empty') || errLower.includes('select')) {
    headline = 'No document detected';
    advice = 'Please take a photo, upload a file, or paste your text to begin.';
  } else if (errLower.includes('unreadable') || errLower.includes('blur') || errLower.includes('poor image')) {
    headline = 'Document unreadable';
    advice = 'The text in the image is too blurry or dark. Try taking a photo with more light or paste the text directly.';
  } else if (errLower.includes('network') || errLower.includes('timeout') || errLower.includes('fetch')) {
    headline = 'Connection interrupted';
    advice = 'Please check your internet connection and try analyzing again.';
  } else if (errLower.includes('gemini') || errLower.includes('api') || errLower.includes('format')) {
    headline = 'Analysis temporarily unavailable';
    advice = 'The AI service could not complete the structured analysis right now. Please try again in a few moments.';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 text-center animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <AlertCircle className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-black text-zinc-950 tracking-tight">
          {headline}
        </h3>

        <p className="text-xs sm:text-sm text-zinc-600 mt-1.5 leading-relaxed">
          {advice}
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full py-3.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
            >
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <span>TRY AGAIN</span>
            </button>
          )}

          {onPickAnother && (
            <button
              onClick={onPickAnother}
              className="w-full py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <FileUp className="w-4 h-4 text-zinc-600" />
              <span>CHOOSE ANOTHER FILE</span>
            </button>
          )}

          <button
            onClick={onDismiss}
            className="w-full py-2 text-zinc-400 hover:text-zinc-700 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
