import React, { useState } from 'react';
import {
  Clock,
  Trash2,
  ChevronRight,
  PlusCircle,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle2,
  Search,
  MoreVertical,
  Share2,
  Lock,
  Edit3,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  Shield,
} from 'lucide-react';
import { SavedDocument, AnalysisResult, UrgencyLevel, User } from '../types';

interface HistoryScreenProps {
  documents: SavedDocument[];
  onOpenDocument: (doc: SavedDocument) => void;
  onRenameDocument: (doc: SavedDocument) => void;
  onShareDocument: (doc: SavedDocument) => void;
  onProtectDocument: (doc: SavedDocument) => void;
  onDeleteDocument: (docId: string) => void;
  onClearAll: () => void;
  onGoToCheck: () => void;
  user: User | null;
  onOpenAuth: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  documents,
  onOpenDocument,
  onRenameDocument,
  onShareDocument,
  onProtectDocument,
  onDeleteDocument,
  onClearAll,
  onGoToCheck,
  user,
  onOpenAuth,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'newest' | 'oldest' | 'deadline'>('recent');
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<SavedDocument | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter by search query
  const filteredDocs = documents.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.document_type.toLowerCase().includes(q) ||
      doc.summary.toLowerCase().includes(q) ||
      doc.primary_action.toLowerCase().includes(q)
    );
  });

  // Sort
  const sortedDocs = [...filteredDocs].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'deadline':
        if (a.urgency === 'TODAY' && b.urgency !== 'TODAY') return -1;
        if (b.urgency === 'TODAY' && a.urgency !== 'TODAY') return 1;
        if (a.urgency === 'SOON' && b.urgency !== 'SOON') return -1;
        if (b.urgency === 'SOON' && a.urgency !== 'SOON') return 1;
        return new Date(b.last_opened_at || b.created_at).getTime() - new Date(a.last_opened_at || a.created_at).getTime();
      case 'recent':
      default:
        return new Date(b.last_opened_at || b.created_at).getTime() - new Date(a.last_opened_at || a.created_at).getTime();
    }
  });

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'TODAY':
        return 'text-rose-700 bg-rose-50 border border-rose-200';
      case 'SOON':
        return 'text-amber-700 bg-amber-50 border border-amber-200';
      case 'UPCOMING':
        return 'text-sky-700 bg-sky-50 border border-sky-200';
      default:
        return 'text-zinc-600 bg-zinc-100 border border-zinc-200';
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] px-4 pb-32 pt-2 max-w-lg mx-auto w-full">
      {/* Screen Title - Solid non-transparent card */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-200 shadow-xs mb-3.5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
            DOCUMENT HISTORY
          </h2>
          <p className="text-xs text-zinc-700 font-bold mt-0.5">
            {documents.length} saved {documents.length === 1 ? 'document' : 'documents'}
          </p>
        </div>

        {documents.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-xs font-bold text-zinc-700 hover:text-rose-700 py-1.5 px-3 rounded-lg bg-zinc-100 hover:bg-rose-50 border border-zinc-200 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Guest Account Banner */}
      {!user && (
        <div className="mb-4 p-4 bg-zinc-950 text-white rounded-3xl shadow-sm flex items-start justify-between gap-3 text-left">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cross-Device Cloud Sync</span>
            </div>
            <p className="text-xs text-zinc-300 leading-snug">
              Sign in or create a free account to permanently save documents across all your devices.
            </p>
          </div>
          <button
            onClick={onOpenAuth}
            className="px-3.5 py-2 bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs rounded-xl shrink-0 shadow-xs transition-colors"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Search and Sort Toolbar - Solid non-transparent card */}
      {documents.length > 0 && (
        <div className="p-3.5 bg-white rounded-2xl border border-zinc-200 shadow-xs mb-4 space-y-2.5">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, category, action..."
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-950 font-medium placeholder:text-zinc-600 focus:outline-none focus:border-zinc-950 shadow-2xs"
            />
            <Search className="w-4 h-4 text-zinc-600 absolute left-3 top-3" />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-700">
              Sort by
            </span>
            <div className="flex items-center gap-1">
              {(
                [
                  { key: 'recent', label: 'Recent' },
                  { key: 'deadline', label: 'Deadlines' },
                  { key: 'newest', label: 'Newest' },
                  { key: 'oldest', label: 'Oldest' },
                ] as const
              ).map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key)}
                  className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition-colors ${
                    sortBy === s.key
                      ? 'bg-zinc-950 text-white'
                      : 'text-zinc-700 hover:text-zinc-950 bg-zinc-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {documents.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-10 text-center bg-white rounded-3xl border border-zinc-200 mt-4 shadow-xs relative overflow-hidden">
          {/* Subtle central signal indicator */}
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-3xl bg-zinc-950 flex flex-col items-center justify-center text-white shadow-xl shadow-zinc-950/15 relative overflow-hidden">
              <Clock className="w-7 h-7 text-emerald-400" />
            </div>
          </div>

          <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-700 font-black mb-1 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
            [WORKSPACE READY]
          </span>
          <h3 className="text-lg sm:text-xl font-black text-zinc-950 tracking-tight mt-1">
            Your workspace is waiting.
          </h3>
          <p className="text-xs sm:text-sm text-zinc-700 font-medium mt-1.5 max-w-xs leading-relaxed">
            When you check a document, tap SAVE to permanently archive your action plans, verified deadlines, and ready responses.
          </p>
          <button
            onClick={onGoToCheck}
            className="mt-6 py-3.5 px-6 bg-zinc-950 hover:bg-zinc-800 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-[0.985] flex items-center gap-2 group"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400 group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-mono text-[11px] tracking-wide">CHECK A DOCUMENT</span>
          </button>
        </div>
      ) : sortedDocs.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-zinc-200 mt-4 shadow-xs">
          <Search className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-700 font-bold font-mono">
            No documents matched "<span className="font-black text-zinc-950">{searchQuery}</span>"
          </p>
        </div>
      ) : (
        /* Document Cards List - Solid non-transparent white */
        <div className="space-y-3">
          {sortedDocs.map((doc, docIdx) => {
            const isMenuOpen = activeMenuDocId === doc.id;
            const formattedDate = new Date(doc.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });
            // Hash-based technical dot archive signature
            const docHash = doc.id.slice(-4).toUpperCase();

            return (
              <div
                key={doc.id}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-zinc-200 shadow-xs hover:border-zinc-300 hover:shadow-md transition-all text-left relative animate-card-reveal"
                style={{ animationDelay: `${docIdx * 50}ms` }}
              >
                {/* Top Row: Type, Date, Lock, Menu */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-mono text-[9px] font-black text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                      #{docHash}
                    </span>
                    <span className="font-mono text-[10px] font-black uppercase tracking-wider text-zinc-700 truncate">
                      {doc.document_type}
                    </span>
                    <span className="text-zinc-300">·</span>
                    <span className="font-mono text-[10px] text-zinc-600 font-bold">
                      {formattedDate}
                    </span>
                    {doc.is_password_protected && (
                      <span className="flex items-center gap-0.5 text-[10px] font-black text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                        <Lock className="w-3 h-3 text-amber-700" />
                        <span>Protected</span>
                      </span>
                    )}
                  </div>

                  {/* Three-dot menu button */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuDocId(isMenuOpen ? null : doc.id)}
                      className="p-1.5 -mr-1 text-zinc-400 hover:text-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors"
                      title="More actions"
                      aria-label="More actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setActiveMenuDocId(null)}
                        />
                        <div className="absolute right-0 top-8 z-30 w-44 bg-white rounded-2xl shadow-xl border border-zinc-200/90 py-1.5 text-xs text-zinc-800 animate-in fade-in zoom-in-95">
                          <button
                            onClick={() => {
                              setActiveMenuDocId(null);
                              onOpenDocument(doc);
                            }}
                            className="w-full px-3.5 py-2 text-left hover:bg-zinc-100 font-semibold flex items-center gap-2"
                          >
                            <ChevronRight className="w-4 h-4 text-zinc-400" />
                            <span>Open Analysis</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuDocId(null);
                              onRenameDocument(doc);
                            }}
                            className="w-full px-3.5 py-2 text-left hover:bg-zinc-100 font-semibold flex items-center gap-2"
                          >
                            <Edit3 className="w-4 h-4 text-zinc-400" />
                            <span>Rename</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuDocId(null);
                              onShareDocument(doc);
                            }}
                            className="w-full px-3.5 py-2 text-left hover:bg-zinc-100 font-semibold flex items-center gap-2"
                          >
                            <Share2 className="w-4 h-4 text-zinc-400" />
                            <span>Share...</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuDocId(null);
                              onProtectDocument(doc);
                            }}
                            className="w-full px-3.5 py-2 text-left hover:bg-zinc-100 font-semibold flex items-center gap-2"
                          >
                            <Lock className="w-4 h-4 text-zinc-400" />
                            <span>{doc.is_password_protected ? 'Password options' : 'Protect Document'}</span>
                          </button>

                          <div className="border-t border-zinc-100 my-1" />

                          <button
                            onClick={() => {
                              setActiveMenuDocId(null);
                              setDeleteConfirmDoc(doc);
                            }}
                            className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3
                  onClick={() => onOpenDocument(doc)}
                  className="text-sm sm:text-base font-extrabold text-zinc-950 tracking-tight cursor-pointer hover:text-black line-clamp-1 mb-1"
                >
                  {doc.title}
                </h3>

                {/* Short AI Summary (1-2 sentences answering: What is this?) */}
                <p
                  onClick={() => onOpenDocument(doc)}
                  className="text-xs text-zinc-600 leading-snug line-clamp-2 cursor-pointer mb-2.5"
                >
                  {doc.summary}
                </p>

                {/* Deadline & Urgency Badge */}
                {doc.deadline && doc.deadline !== 'No clear deadline found.' && (
                  <div className="mb-3 flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${getUrgencyBadge(
                        doc.urgency
                      )}`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{doc.deadline}</span>
                    </span>
                  </div>
                )}

                {/* Action Footer: [ OPEN ] [ SHARE ] */}
                <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <div className="flex-1 truncate pr-2 text-xs text-zinc-700 font-medium">
                    <span className="font-black text-zinc-950">DO THIS: </span>
                    <span className="truncate">{doc.primary_action}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onShareDocument(doc)}
                      className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                      title="Share document"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">Share</span>
                    </button>

                    <button
                      onClick={() => onOpenDocument(doc)}
                      className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1"
                    >
                      <span>Open</span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full text-left shadow-2xl space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>

            <h3 className="text-base font-extrabold text-zinc-950">
              Delete this document?
            </h3>

            <p className="text-xs text-zinc-600 leading-relaxed">
              This permanently removes <strong className="text-zinc-900">"{deleteConfirmDoc.title}"</strong>, its AI analysis, next steps, and active share links from your account.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmDoc(null)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = deleteConfirmDoc.id;
                  setDeleteConfirmDoc(null);
                  onDeleteDocument(id);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full text-left shadow-2xl space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="text-base font-extrabold text-zinc-950">
              Clear all saved history?
            </h3>

            <p className="text-xs text-zinc-600 leading-relaxed">
              This will permanently delete all {documents.length} documents and their analysis results. This cannot be undone.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowClearConfirm(false);
                  onClearAll();
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
              >
                CLEAR ALL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
