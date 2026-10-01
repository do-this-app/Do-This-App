import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  UploadCloud,
  FileText,
  FileUp,
  X,
  ChevronDown,
  Check,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { DOCUMENT_TYPE_OPTIONS, DocumentTypeOption } from '../types';
import { BottomSheet } from './BottomSheet';

interface InputScreenProps {
  initialMode?: 'file' | 'camera' | 'paste';
  onAnalyze: (payload: {
    text: string;
    fileData?: string;
    mimeType?: string;
    userDocType?: string;
    fileName?: string;
    fileSizeFormatted?: string;
    previewUrl?: string;
  }) => void;
  onCancel: () => void;
  onError: (msg: string) => void;
}

export const InputScreen: React.FC<InputScreenProps> = ({
  initialMode = 'file',
  onAnalyze,
  onCancel,
  onError,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>(
    initialMode === 'paste' ? 'paste' : 'upload'
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [selectedDocType, setSelectedDocType] = useState<DocumentTypeOption>("I'm not sure");
  const [isTypeSheetOpen, setIsTypeSheetOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Trigger camera automatically if initialMode is camera
  useEffect(() => {
    if (initialMode === 'camera' && cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  }, [initialMode]);

  const handleFileChange = (file: File) => {
    // 25MB limit
    if (file.size > 25 * 1024 * 1024) {
      onError('File is too large. Please select a document or image under 25MB.');
      return;
    }

    const acceptedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'application/pdf',
      'text/plain',
      'text/markdown',
      'text/csv',
    ];

    const isAccepted = acceptedTypes.includes(file.type) ||
      file.name.endsWith('.pdf') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md');

    if (!isAccepted) {
      onError('Unsupported file type. Please upload a PDF, photo/image (JPG, PNG, WebP), or text file.');
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async () => {
    if (activeTab === 'upload' && !selectedFile) {
      onError('Please select or photograph a document to analyze.');
      return;
    }

    if (activeTab === 'paste' && !pastedText.trim()) {
      onError('Please enter or paste the document, email, or notice text.');
      return;
    }

    if (activeTab === 'upload' && selectedFile) {
      // Check if it's text/plain
      if (selectedFile.type === 'text/plain' || selectedFile.name.endsWith('.txt') || selectedFile.name.endsWith('.md')) {
        const textContent = await selectedFile.text();
        onAnalyze({
          text: textContent,
          userDocType: selectedDocType,
          fileName: selectedFile.name,
          fileSizeFormatted: formatFileSize(selectedFile.size),
        });
        return;
      }

      // Convert to base64 for API
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        onAnalyze({
          text: '',
          fileData: base64Data,
          mimeType: selectedFile.type || 'application/pdf',
          userDocType: selectedDocType,
          fileName: selectedFile.name,
          fileSizeFormatted: formatFileSize(selectedFile.size),
          previewUrl: filePreview || undefined,
        });
      };
      reader.onerror = () => {
        onError('Could not read the uploaded file. Please try another file.');
      };
      reader.readAsDataURL(selectedFile);
    } else {
      onAnalyze({
        text: pastedText.trim(),
        userDocType: selectedDocType,
        fileName: 'Pasted Document Text',
      });
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] px-4 pb-28 pt-2 max-w-lg mx-auto w-full">
      {/* Header description - Protected in solid non-transparent container */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200/90 shadow-xs mb-3.5">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950">
          Add your document
        </h2>
        <p className="text-xs sm:text-sm text-zinc-700 font-semibold mt-1 leading-relaxed">
          You can upload a photo, screenshot, PDF, letter, email, notice, or paste the text.
        </p>
      </div>

      {/* Input Mode Selector (Tabs) - Solid non-transparent bar */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 border border-zinc-200/90 rounded-2xl mb-4 shadow-2xs">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-xl transition-all ${
            activeTab === 'upload'
              ? 'bg-white text-zinc-950 shadow-xs border border-zinc-200/60'
              : 'text-zinc-700 hover:text-zinc-950 font-bold'
          }`}
        >
          <FileUp className="w-4 h-4 text-emerald-600" />
          <span>UPLOAD / PHOTO</span>
        </button>
        <button
          onClick={() => setActiveTab('paste')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-xl transition-all ${
            activeTab === 'paste'
              ? 'bg-white text-zinc-950 shadow-xs border border-zinc-200/60'
              : 'text-zinc-700 hover:text-zinc-950 font-bold'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>PASTE TEXT / EMAIL</span>
        </button>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf,text/plain,.pdf,.png,.jpg,.jpeg,.webp,.txt"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileChange(e.target.files[0]);
          }
        }}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileChange(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Main Input Container */}
      {activeTab === 'upload' ? (
        <div className="flex-1 flex flex-col gap-3">
          {!selectedFile ? (
            /* Upload Drop Area - Solid non-transparent white */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all min-h-[220px] bg-white shadow-xs ${
                isDragging
                  ? 'border-zinc-950 bg-zinc-50 scale-[0.99]'
                  : 'border-zinc-300 hover:border-zinc-500'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 mb-3 shadow-xs">
                <UploadCloud className="w-7 h-7 text-zinc-900" />
              </div>

              <span className="text-base font-black text-zinc-950 block mb-1">
                Drop or add your document
              </span>
              <span className="inline-block text-xs font-bold text-zinc-700 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200/80 mb-4 font-mono">
                Photo • Screenshot • PDF • Letter • Bill
              </span>

              {/* Action Buttons inside dropzone */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-3.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-black transition-all active:scale-[0.98] shadow-sm"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-xs uppercase tracking-wider">Take photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-3.5 bg-white hover:bg-zinc-50 text-zinc-950 rounded-xl text-xs font-black transition-all active:scale-[0.98] border border-zinc-300 shadow-2xs"
                >
                  <FileUp className="w-4 h-4 text-zinc-700" />
                  <span className="font-mono text-xs uppercase tracking-wider">Choose file</span>
                </button>
              </div>
            </div>
          ) : (
            /* Selected File Preview Card - Solid non-transparent white */
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-zinc-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 font-mono bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>[SOURCE READY]</span>
                </div>
                <button
                  onClick={removeSelectedFile}
                  className="text-xs text-zinc-600 hover:text-rose-600 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-rose-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>

              <div className="flex items-center gap-3.5 mt-3.5">
                {filePreview ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0 shadow-2xs">
                    <img
                      src={filePreview}
                      alt="Document preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 border border-zinc-200 shrink-0 shadow-2xs">
                    <FileText className="w-8 h-8 text-zinc-700" />
                  </div>
                )}

                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-black text-zinc-950 truncate">
                    {selectedFile.name}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-700 font-bold mt-1 font-mono">
                    <span>{formatFileSize(selectedFile.size)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedFile.type || 'Document'}</span>
                  </div>
                </div>
              </div>

              {/* Replace options */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-100">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 text-center py-2.5 px-3 text-xs font-bold text-zinc-800 bg-zinc-100 hover:bg-zinc-200/80 rounded-xl transition-all active:scale-[0.98] border border-zinc-200"
                >
                  Retake photo
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 text-center py-2.5 px-3 text-xs font-bold text-zinc-800 bg-zinc-100 hover:bg-zinc-200/80 rounded-xl transition-all active:scale-[0.98] border border-zinc-200"
                >
                  Pick another
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Paste Mode Area - Solid non-transparent white */
        <div className="flex-1 flex flex-col gap-2">
          <div className="relative bg-white rounded-3xl p-4 border border-zinc-200 shadow-xs flex-1 flex flex-col">
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste the text from an email, letter, invoice, notice, warranty, contract, or confusing message here..."
              rows={8}
              className="w-full p-2 text-sm text-zinc-950 font-medium placeholder:text-zinc-600 placeholder:font-medium focus:outline-none resize-none flex-1 font-sans bg-transparent leading-relaxed"
            />
            <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
              <span className="text-xs font-bold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-lg border border-zinc-200 font-mono">
                {pastedText.length} characters
              </span>
              {pastedText.length > 0 && (
                <button
                  onClick={() => setPastedText('')}
                  className="text-xs font-bold text-zinc-700 hover:text-rose-600 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-lg border border-zinc-200 transition-colors"
                >
                  Clear text
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Optional Document Type Selector - Solid non-transparent card */}
      <div className="mt-4 p-4 bg-white rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="inline-block px-2.5 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200 text-[11px] font-black uppercase tracking-wider font-mono">
            Step 2 (Optional)
          </span>
          <span className="text-xs font-bold text-zinc-800">
            What kind of document is this?
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsTypeSheetOpen(true)}
          className="w-full flex items-center justify-between p-3.5 bg-zinc-50 hover:bg-zinc-100/90 border border-zinc-200/90 rounded-xl text-left transition-all active:scale-[0.99]"
        >
          <div>
            <span className="text-sm font-black text-zinc-950 block">
              {selectedDocType}
            </span>
            <span className="text-xs font-semibold text-zinc-700 block mt-0.5">
              {selectedDocType === "I'm not sure"
                ? 'AI will automatically detect the document type'
                : 'Selected document category'}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-zinc-700 shrink-0" />
        </button>
      </div>

      {/* Document Type Bottom Sheet */}
      <BottomSheet
        isOpen={isTypeSheetOpen}
        onClose={() => setIsTypeSheetOpen(false)}
        title="Select Document Type"
        description="Optional: helps the AI customize next steps and deadlines"
      >
        <div className="grid grid-cols-2 gap-2 pb-2">
          {DOCUMENT_TYPE_OPTIONS.map((typeOption) => {
            const isSelected = selectedDocType === typeOption;
            return (
              <button
                key={typeOption}
                onClick={() => {
                  setSelectedDocType(typeOption);
                  setIsTypeSheetOpen(false);
                }}
                className={`flex items-center justify-between p-3 rounded-xl text-left text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-zinc-950 text-white font-bold shadow-xs'
                    : 'bg-zinc-100/80 hover:bg-zinc-200/80 text-zinc-800'
                }`}
              >
                <span className="truncate pr-1">{typeOption}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </BottomSheet>

      {/* Primary Action Button (Thumb-friendly bottom CTA) */}
      <div className="mt-5">
        <button
          onClick={handleSubmit}
          className="w-full py-4 px-6 bg-zinc-950 hover:bg-zinc-800 text-white font-black text-base rounded-2xl shadow-lg shadow-zinc-950/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group min-h-[58px]"
        >
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span>ANALYZE DOCUMENT</span>
          <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={onCancel}
          className="w-full mt-2.5 py-3 px-4 bg-white hover:bg-zinc-50 text-zinc-800 font-black text-xs rounded-xl border border-zinc-200 shadow-2xs text-center transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
