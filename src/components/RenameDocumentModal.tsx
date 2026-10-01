import React, { useState, useEffect } from 'react';
import { Edit3, Check } from 'lucide-react';
import { BottomSheet } from './BottomSheet';

interface RenameDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTitle: string;
  onSaveTitle: (newTitle: string) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const RenameDocumentModal: React.FC<RenameDocumentModalProps> = ({
  isOpen,
  onClose,
  currentTitle,
  onSaveTitle,
  onShowToast,
}) => {
  const [title, setTitle] = useState(currentTitle);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
    }
  }, [isOpen, currentTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onShowToast('Title cannot be empty', 'error');
      return;
    }

    setSaving(true);
    try {
      await onSaveTitle(title.trim());
      onShowToast('Document renamed', 'success');
      onClose();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to rename document', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Rename Document"
      description="Update how this document is displayed in your history"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
            Document Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Utility Bill — October 2026"
            autoFocus
            className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 font-semibold"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs sm:text-sm rounded-xl transition-colors"
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="flex-1 py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{saving ? 'Saving...' : 'SAVE TITLE'}</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
