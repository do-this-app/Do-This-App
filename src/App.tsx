/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { InputScreen } from './components/InputScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { Toast, ToastMessage } from './components/Toast';
import { ErrorModal } from './components/ErrorModal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { RenameDocumentModal } from './components/RenameDocumentModal';
import { PasswordProtectionModal } from './components/PasswordProtectionModal';
import { PasswordUnlockModal } from './components/PasswordUnlockModal';
import { ShareManagementModal } from './components/ShareManagementModal';
import { SharedDocumentView } from './components/SharedDocumentView';
import { DotFieldCanvas, DotFieldState } from './components/DotFieldCanvas';
import { AnalysisResult, SavedDocument, User, UserProfile } from './types';
import { SampleDocument } from './data/samples';
import { api, getAuthToken } from './lib/api';
import {
  getSavedAnalyses,
  saveAnalysis,
  deleteAnalysis,
  clearAllAnalyses,
} from './utils/storage';

export default function App() {
  // Navigation & Flow
  const [currentTab, setCurrentTab] = useState<NavTab>('check');
  const [checkFlowState, setCheckFlowState] = useState<'home' | 'input' | 'loading' | 'results'>('home');
  const [inputInitialMode, setInputInitialMode] = useState<'file' | 'camera' | 'paste'>('file');

  // Active analysis result & current document ID
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisResult | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [loadingDocName, setLoadingDocName] = useState<string>('');
  const [loadingPhase, setLoadingPhase] = useState<number>(0);
  const [pulseTrigger, setPulseTrigger] = useState<number>(0);

  // Authentication & Profile State
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [guestConversionNotice, setGuestConversionNotice] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Persistent Document History
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([]);

  // Modals for Saved Document Actions
  const [renameDocModal, setRenameDocModal] = useState<SavedDocument | null>(null);
  const [protectDocModal, setProtectDocModal] = useState<SavedDocument | null>(null);
  const [unlockDocModal, setUnlockDocModal] = useState<SavedDocument | null>(null);
  const [shareDocModal, setShareDocModal] = useState<SavedDocument | null>(null);

  // Public Share Route State (#share=<token>)
  const [publicShareToken, setPublicShareToken] = useState<string | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Error modal state
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({
      id: Date.now().toString(),
      type,
      text,
    });
  };

  // Check URL for public share link (#share=<token>)
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#share=')) {
        const token = hash.replace('#share=', '').trim();
        if (token) {
          setPublicShareToken(token);
        }
      } else {
        setPublicShareToken(null);
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Check user session on initial mount
  useEffect(() => {
    async function initAuth() {
      try {
        const authData = await api.getMe();
        if (authData) {
          setUser(authData.user);
          setProfile(authData.profile);
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
      }
    }
    initAuth();
  }, []);

  // Fetch persistent documents when user changes
  useEffect(() => {
    async function loadDocuments() {
      if (user) {
        try {
          const docs = await api.getDocuments();
          setSavedDocuments(docs);
        } catch (err) {
          console.error('Failed to load documents from database:', err);
        }
      } else {
        // Fallback to local storage for guest
        const local = getSavedAnalyses();
        const mapped: SavedDocument[] = local.map((a) => ({
          id: a.id,
          user_id: 'guest',
          title: a.title,
          original_filename: a.sourceInfo?.name || 'Document',
          document_type: a.documentType,
          summary: a.oneSentenceMeaning,
          primary_action: a.primaryAction,
          deadline: a.deadline,
          urgency: a.urgency,
          analysis_status: 'completed',
          is_password_protected: Boolean(a.isPasswordProtected),
          created_at: a.createdAt,
          updated_at: a.createdAt,
          last_opened_at: a.createdAt,
        }));
        setSavedDocuments(mapped);
      }
    }
    loadDocuments();
  }, [user]);

  // Switch to Check flow
  const handleStartUpload = (mode: 'file' | 'camera' | 'paste' = 'file') => {
    setInputInitialMode(mode);
    setCheckFlowState('input');
    setCurrentTab('check');
  };

  // Perform Analysis via server-side API
  const handleAnalyze = async (payload: {
    text: string;
    fileData?: string;
    mimeType?: string;
    userDocType?: string;
    fileName?: string;
    fileSizeFormatted?: string;
    previewUrl?: string;
  }) => {
    setLastPayload(payload);
    setLoadingDocName(payload.fileName || 'Document');
    setCheckFlowState('loading');
    setActiveDocumentId(null);

    // Staged loading experience (~11.2 seconds)
    const MIN_LOADING_TIME_MS = 11200;
    const minDelayPromise = new Promise((resolve) => setTimeout(resolve, MIN_LOADING_TIME_MS));

    try {
      const fetchPromise = fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(async (response) => {
        if (!response.ok) {
          let errMessage = 'Failed to analyze document.';
          try {
            const errData = await response.json();
            errMessage = errData.error || errMessage;
          } catch {
            errMessage = `Server error (${response.status})`;
          }
          throw new Error(errMessage);
        }
        return response.json();
      });

      const [_, data] = await Promise.all([minDelayPromise, fetchPromise]);

      const newAnalysis: AnalysisResult = {
        ...data,
        id: 'analysis-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        createdAt: new Date().toISOString(),
        sourceInfo: {
          type: payload.fileData ? 'upload' : 'paste',
          name: payload.fileName,
          sizeFormatted: payload.fileSizeFormatted,
          previewUrl: payload.previewUrl,
          textPreview: payload.text ? payload.text.substring(0, 120) : undefined,
        },
      };

      setActiveAnalysis(newAnalysis);
      setPulseTrigger((p) => p + 1);
      setCheckFlowState('results');
    } catch (err: any) {
      console.error('Error in analyze API:', err);
      await minDelayPromise;
      setErrorModal(err.message || 'We encountered an error analyzing your document.');
      setCheckFlowState('input');
    }
  };

  // Select Sample Document
  const handleSelectSample = (sample: SampleDocument) => {
    handleAnalyze({
      text: sample.content,
      userDocType: sample.category,
      fileName: sample.name,
    });
  };

  // Save or Toggle Save current analysis
  const handleToggleSave = async () => {
    if (!activeAnalysis) return;

    // Check if user is signed in
    if (!user) {
      // Guest -> Account conversion prompt
      setAuthModalMode('signup');
      setGuestConversionNotice(true);
      setIsAuthModalOpen(true);
      return;
    }

    // Check if already saved
    const existingDoc = savedDocuments.find(
      (d) => d.id === activeDocumentId || d.title.toLowerCase() === activeAnalysis.title.toLowerCase()
    );

    if (existingDoc) {
      try {
        await api.deleteDocument(existingDoc.id);
        setSavedDocuments((prev) => prev.filter((d) => d.id !== existingDoc.id));
        setActiveDocumentId(null);
        showToast('Removed from saved checks', 'info');
      } catch (err: any) {
        showToast(err.message || 'Failed to remove document', 'error');
      }
    } else {
      try {
        const saved = await api.saveDocument({
          title: activeAnalysis.title,
          originalFilename: activeAnalysis.sourceInfo?.name || 'Document',
          documentType: activeAnalysis.documentType,
          summary: activeAnalysis.oneSentenceMeaning,
          primaryAction: activeAnalysis.primaryAction,
          deadline: activeAnalysis.deadline,
          urgency: activeAnalysis.urgency,
          analysis: activeAnalysis,
        });
        setActiveDocumentId(saved.document.id);
        setSavedDocuments((prev) => [saved.document, ...prev]);
        setPulseTrigger((p) => p + 1);
        showToast('Saved to your private account', 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to save document to account', 'error');
      }
    }
  };

  // Handle successful login or account creation
  const handleAuthSuccess = async (newUser: User, newProfile: UserProfile) => {
    setUser(newUser);
    setProfile(newProfile);

    // Refresh database documents
    try {
      const docs = await api.getDocuments();
      setSavedDocuments(docs);

      // If user converted from guest while viewing an active analysis, automatically save it!
      if (activeAnalysis && !activeDocumentId) {
        const saved = await api.saveDocument({
          title: activeAnalysis.title,
          originalFilename: activeAnalysis.sourceInfo?.name || 'Document',
          documentType: activeAnalysis.documentType,
          summary: activeAnalysis.oneSentenceMeaning,
          primaryAction: activeAnalysis.primaryAction,
          deadline: activeAnalysis.deadline,
          urgency: activeAnalysis.urgency,
          analysis: activeAnalysis,
        });
        setActiveDocumentId(saved.document.id);
        setSavedDocuments((prev) => [saved.document, ...prev]);
        showToast('Document saved to your new account!', 'success');
      }
    } catch (err) {
      console.error('Failed to sync documents after login:', err);
    }
  };

  // Open a saved document from History
  const handleOpenDocument = async (doc: SavedDocument) => {
    if (!user) {
      // Local fallback for guest
      const local = getSavedAnalyses();
      const match = local.find((a) => a.id === doc.id);
      if (match) {
        setActiveAnalysis(match);
        setActiveDocumentId(doc.id);
        setCheckFlowState('results');
        setCurrentTab('check');
        return;
      }
    }

    try {
      const data = await api.getDocument(doc.id);
      if (data.isProtected && !data.analysis) {
        // Protected document: prompt for password
        setUnlockDocModal(doc);
        return;
      }

      if (data.analysis) {
        setActiveAnalysis(data.analysis);
        setActiveDocumentId(doc.id);
        setCheckFlowState('results');
        setCurrentTab('check');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to open document', 'error');
    }
  };

  // Unlocked password-protected document callback
  const handleDocumentUnlocked = (analysis: AnalysisResult) => {
    setActiveAnalysis(analysis);
    if (unlockDocModal) {
      setActiveDocumentId(unlockDocModal.id);
    }
    setCheckFlowState('results');
    setCurrentTab('check');
    setUnlockDocModal(null);
  };

  // Rename a saved document
  const handleSaveRenamedTitle = async (newTitle: string) => {
    if (!renameDocModal) return;

    if (user) {
      const updated = await api.renameDocument(renameDocModal.id, newTitle);
      setSavedDocuments((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d))
      );
    } else {
      // Local guest rename
      setSavedDocuments((prev) =>
        prev.map((d) => (d.id === renameDocModal.id ? { ...d, title: newTitle } : d))
      );
    }

    if (activeDocumentId === renameDocModal.id && activeAnalysis) {
      setActiveAnalysis({ ...activeAnalysis, title: newTitle });
    }
  };

  // Delete a saved document
  const handleDeleteDocument = async (docId: string) => {
    if (user) {
      try {
        await api.deleteDocument(docId);
        setSavedDocuments((prev) => prev.filter((d) => d.id !== docId));
        showToast('Document deleted permanently', 'info');
      } catch (err: any) {
        showToast(err.message || 'Failed to delete document', 'error');
      }
    } else {
      deleteAnalysis(docId);
      setSavedDocuments((prev) => prev.filter((d) => d.id !== docId));
      showToast('Document removed', 'info');
    }

    if (activeDocumentId === docId) {
      setActiveDocumentId(null);
    }
  };

  // Clear all history
  const handleClearAllHistory = async () => {
    if (user) {
      try {
        await api.clearHistory();
        setSavedDocuments([]);
        showToast('All saved checks cleared permanently', 'info');
      } catch (err: any) {
        showToast(err.message || 'Failed to clear history', 'error');
      }
    } else {
      clearAllAnalyses();
      setSavedDocuments([]);
      showToast('Saved checks cleared', 'info');
    }
  };

  // Log Out
  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setProfile(null);
    setActiveDocumentId(null);
    showToast('Signed out successfully', 'info');
  };

  // Account Deleted
  const handleAccountDeleted = () => {
    setUser(null);
    setProfile(null);
    setSavedDocuments([]);
    setActiveAnalysis(null);
    setActiveDocumentId(null);
    setCheckFlowState('home');
    setCurrentTab('check');
  };

  // Navigation Tab Change
  const handleTabChange = (tab: NavTab) => {
    setCurrentTab(tab);
    if (tab === 'check') {
      if (!activeAnalysis) {
        setCheckFlowState('home');
      }
    }
  };

  // Header Back Button
  const canGoBack =
    currentTab === 'check' && (checkFlowState === 'input' || checkFlowState === 'results');

  const handleHeaderBack = () => {
    if (checkFlowState === 'results') {
      setCheckFlowState('home');
      setActiveAnalysis(null);
      setActiveDocumentId(null);
    } else if (checkFlowState === 'input') {
      setCheckFlowState('home');
    }
  };

  // If public share link is open in URL, render the public SharedDocumentView
  if (publicShareToken) {
    return (
      <SharedDocumentView
        shareToken={publicShareToken}
        onExitShare={() => {
          window.location.hash = '';
          setPublicShareToken(null);
        }}
        onShowToast={showToast}
      />
    );
  }

  const isCurrentActiveSaved = Boolean(
    activeAnalysis &&
      savedDocuments.some(
        (d) => d.id === activeDocumentId || d.title.toLowerCase() === activeAnalysis.title.toLowerCase()
      )
  );

  const getDotFieldState = (): DotFieldState => {
    if (errorModal) return 'error';
    if (currentTab === 'check') {
      if (checkFlowState === 'loading') return 'processing';
      if (checkFlowState === 'results') return 'results';
      if (checkFlowState === 'input') return 'focus';
      return 'idle';
    }
    if (currentTab === 'history') return 'history';
    if (currentTab === 'settings') return 'settings';
    return 'idle';
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-white relative overflow-x-hidden">
      {/* Living Document Intelligence Dot Field Engine */}
      <DotFieldCanvas
        state={getDotFieldState()}
        processingPhase={loadingPhase}
        pulseTrigger={pulseTrigger}
      />

      {/* Universal Header with User Profile / Sign In */}
      <Header
        onBack={handleHeaderBack}
        showBack={canGoBack}
        title={
          currentTab === 'history'
            ? 'SAVED CHECKS'
            : currentTab === 'settings'
            ? 'SETTINGS'
            : checkFlowState === 'results'
            ? 'ACTION PLAN'
            : undefined
        }
        user={user}
        profile={profile}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenAuth={() => {
          setAuthModalMode('login');
          setGuestConversionNotice(false);
          setIsAuthModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col max-w-lg mx-auto w-full relative z-10">
        {currentTab === 'check' && (
          <>
            {checkFlowState === 'home' && (
              <HomeScreen
                onStartUpload={handleStartUpload}
                onSelectSample={handleSelectSample}
              />
            )}

            {checkFlowState === 'input' && (
              <InputScreen
                initialMode={inputInitialMode}
                onAnalyze={handleAnalyze}
                onCancel={() => setCheckFlowState('home')}
                onError={(msg) => setErrorModal(msg)}
              />
            )}

            {checkFlowState === 'loading' && (
              <LoadingScreen
                documentName={loadingDocName}
                onPhaseChange={(phase) => setLoadingPhase(phase)}
              />
            )}

            {checkFlowState === 'results' && activeAnalysis && (
              <ResultsScreen
                analysis={activeAnalysis}
                isSaved={isCurrentActiveSaved}
                onToggleSave={handleToggleSave}
                onCheckAnother={() => {
                  setActiveAnalysis(null);
                  setActiveDocumentId(null);
                  setCheckFlowState('home');
                }}
                onShowToast={showToast}
              />
            )}
          </>
        )}

        {currentTab === 'history' && (
          <HistoryScreen
            documents={savedDocuments}
            onOpenDocument={handleOpenDocument}
            onRenameDocument={(doc) => setRenameDocModal(doc)}
            onShareDocument={(doc) => {
              if (!user) {
                setAuthModalMode('signup');
                setGuestConversionNotice(true);
                setIsAuthModalOpen(true);
              } else {
                setShareDocModal(doc);
              }
            }}
            onProtectDocument={(doc) => {
              if (!user) {
                setAuthModalMode('signup');
                setGuestConversionNotice(true);
                setIsAuthModalOpen(true);
              } else {
                setProtectDocModal(doc);
              }
            }}
            onDeleteDocument={handleDeleteDocument}
            onClearAll={handleClearAllHistory}
            onGoToCheck={() => {
              setCurrentTab('check');
              setCheckFlowState('home');
            }}
            user={user}
            onOpenAuth={() => {
              setAuthModalMode('login');
              setGuestConversionNotice(false);
              setIsAuthModalOpen(true);
            }}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsScreen
            user={user}
            profile={profile}
            savedCount={savedDocuments.length}
            onClearHistory={handleClearAllHistory}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onOpenAuth={() => {
              setAuthModalMode('login');
              setGuestConversionNotice(false);
              setIsAuthModalOpen(true);
            }}
            onLogout={handleLogout}
            onAccountDeleted={handleAccountDeleted}
            onProfileUpdated={(updated) => setProfile(updated)}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Modern 2026 Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={handleTabChange}
        savedCount={savedDocuments.length}
      />

      {/* Toast Feedback */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Polished Error Modal */}
      <ErrorModal
        error={errorModal}
        onRetry={lastPayload ? () => {
          setErrorModal(null);
          handleAnalyze(lastPayload);
        } : undefined}
        onPickAnother={() => {
          setErrorModal(null);
          setCheckFlowState('input');
        }}
        onDismiss={() => setErrorModal(null)}
      />

      {/* Auth Modal (Login / Sign Up / Forgot Password / Guest Conversion) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        guestConversionNotice={guestConversionNotice}
        onAuthSuccess={handleAuthSuccess}
        onShowToast={showToast}
      />

      {/* User Profile Modal */}
      {user && profile && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={user}
          profile={profile}
          onProfileUpdated={(updated) => setProfile(updated)}
          onLogout={handleLogout}
          onShowToast={showToast}
        />
      )}

      {/* Rename Document Modal */}
      {renameDocModal && (
        <RenameDocumentModal
          isOpen={Boolean(renameDocModal)}
          onClose={() => setRenameDocModal(null)}
          currentTitle={renameDocModal.title}
          onSaveTitle={handleSaveRenamedTitle}
          onShowToast={showToast}
        />
      )}

      {/* Password Protection Modal */}
      {protectDocModal && (
        <PasswordProtectionModal
          isOpen={Boolean(protectDocModal)}
          onClose={() => setProtectDocModal(null)}
          documentId={protectDocModal.id}
          documentTitle={protectDocModal.title}
          isCurrentlyProtected={protectDocModal.is_password_protected}
          onProtectionChanged={(isProtected) => {
            setSavedDocuments((prev) =>
              prev.map((d) => (d.id === protectDocModal.id ? { ...d, is_password_protected: isProtected } : d))
            );
          }}
          onShowToast={showToast}
        />
      )}

      {/* Password Unlock Modal */}
      {unlockDocModal && (
        <PasswordUnlockModal
          isOpen={Boolean(unlockDocModal)}
          onClose={() => setUnlockDocModal(null)}
          documentId={unlockDocModal.id}
          documentTitle={unlockDocModal.title}
          onUnlocked={handleDocumentUnlocked}
          onShowToast={showToast}
        />
      )}

      {/* Share Management Modal */}
      {shareDocModal && (
        <ShareManagementModal
          isOpen={Boolean(shareDocModal)}
          onClose={() => setShareDocModal(null)}
          documentId={shareDocModal.id}
          documentTitle={shareDocModal.title}
          isPasswordProtected={shareDocModal.is_password_protected}
          onShowToast={showToast}
        />
      )}
    </div>
  );
}
