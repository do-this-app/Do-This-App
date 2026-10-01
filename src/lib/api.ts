import { User, UserProfile, SavedDocument, AnalysisResult, ShareInfo } from '../types';

const TOKEN_KEY = 'do_this_auth_token';

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string | null) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
};

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, { ...options, headers });
}

export const api = {
  // Auth
  async signup(payload: { email: string; username: string; password: string; confirmPassword?: string }) {
    const res = await fetchWithAuth('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create account.');
    setAuthToken(data.token);
    return data as { token: string; user: User; profile: UserProfile };
  },

  async login(payload: { emailOrUsername: string; password: string }) {
    const res = await fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid credentials.');
    setAuthToken(data.token);
    return data as { token: string; user: User; profile: UserProfile };
  },

  async getMe() {
    const token = getAuthToken();
    if (!token) return null;
    const res = await fetchWithAuth('/api/auth/me');
    if (!res.ok) {
      setAuthToken(null);
      return null;
    }
    const data = await res.json();
    return data as { user: User; profile: UserProfile };
  },

  async logout() {
    try {
      await fetchWithAuth('/api/auth/logout', { method: 'POST' });
    } finally {
      setAuthToken(null);
    }
  },

  async forgotPassword(email: string) {
    const res = await fetchWithAuth('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to request reset.');
    return data as { success: boolean; message: string; resetToken?: string };
  },

  async resetPassword(payload: { token: string; newPassword: string; confirmPassword?: string }) {
    const res = await fetchWithAuth('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reset password.');
    return data as { success: boolean; message: string };
  },

  async changePassword(payload: { currentPassword: string; newPassword: string; confirmPassword?: string }) {
    const res = await fetchWithAuth('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update password.');
    return data as { success: boolean; message: string };
  },

  async changeEmail(newEmail: string) {
    const res = await fetchWithAuth('/api/auth/change-email', {
      method: 'POST',
      body: JSON.stringify({ newEmail }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change email.');
    return data as { success: boolean; email: string };
  },

  // Profile
  async updateProfile(payload: { display_name?: string; username?: string }) {
    const res = await fetchWithAuth('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile.');
    return data as { profile: UserProfile };
  },

  async uploadAvatar(avatarData: string) {
    const res = await fetchWithAuth('/api/profile/avatar', {
      method: 'POST',
      body: JSON.stringify({ avatar_data: avatarData }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload profile photo.');
    return data as { profile: UserProfile };
  },

  async removeAvatar() {
    const res = await fetchWithAuth('/api/profile/avatar', {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove profile photo.');
    return data as { profile: UserProfile };
  },

  async deleteAccount() {
    const res = await fetchWithAuth('/api/profile/delete-account', {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete account.');
    setAuthToken(null);
    return data as { success: boolean };
  },

  // Documents & History
  async getDocuments(search?: string, sort?: 'recent' | 'newest' | 'oldest' | 'deadline') {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);

    const url = `/api/documents${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetchWithAuth(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load documents.');
    return data.documents as SavedDocument[];
  },

  async saveDocument(payload: {
    title: string;
    originalFilename?: string;
    documentType: string;
    summary: string;
    primaryAction: string;
    deadline: string;
    urgency: string;
    extractedText?: string;
    analysis: any;
  }) {
    const res = await fetchWithAuth('/api/documents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save document.');
    return data as { document: SavedDocument; analysis: AnalysisResult };
  },

  async getDocument(id: string) {
    const res = await fetchWithAuth(`/api/documents/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to open document.');
    return data as { document: SavedDocument; isProtected: boolean; analysis: AnalysisResult | null };
  },

  async renameDocument(id: string, title: string) {
    const res = await fetchWithAuth(`/api/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to rename document.');
    return data.document as SavedDocument;
  },

  async deleteDocument(id: string) {
    const res = await fetchWithAuth(`/api/documents/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete document.');
    return data as { success: boolean };
  },

  async clearHistory() {
    const res = await fetchWithAuth('/api/documents', {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to clear history.');
    return data as { success: boolean };
  },

  // Password Protection
  async protectDocument(id: string, password: string) {
    const res = await fetchWithAuth(`/api/documents/${id}/protect`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to protect document.');
    return data as { success: boolean; message: string };
  },

  async removeDocumentProtection(id: string, currentPassword: string) {
    const res = await fetchWithAuth(`/api/documents/${id}/remove-protection`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove protection.');
    return data as { success: boolean; message: string };
  },

  async unlockDocument(id: string, password: string) {
    const res = await fetchWithAuth(`/api/documents/${id}/unlock`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to unlock document.');
    return data.analysis as AnalysisResult;
  },

  // Secure Sharing
  async createShare(id: string, permission: 'VIEW_ONLY' | 'VIEW_AND_DOWNLOAD' = 'VIEW_ONLY', expiresInHours?: number) {
    const res = await fetchWithAuth(`/api/documents/${id}/shares`, {
      method: 'POST',
      body: JSON.stringify({ permission, expiresInHours }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate share link.');
    return data.share as ShareInfo;
  },

  async getDocumentShares(id: string) {
    const res = await fetchWithAuth(`/api/documents/${id}/shares`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load share links.');
    return data.shares as ShareInfo[];
  },

  async revokeShare(documentId: string, shareId: string) {
    const res = await fetchWithAuth(`/api/documents/${documentId}/shares/${shareId}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to revoke share link.');
    return data as { success: boolean };
  },

  // Public Share
  async getPublicShare(token: string) {
    const res = await fetch(`/api/shares/${token}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'This share link is invalid or expired.');
    return data as {
      share: ShareInfo;
      document: {
        title: string;
        document_type: string;
        summary: string;
        urgency: any;
        deadline: string;
        primary_action: string;
        is_password_protected: boolean;
      };
      isProtected: boolean;
      analysis: AnalysisResult | null;
    };
  },

  async unlockPublicShare(token: string, password: string) {
    const res = await fetch(`/api/shares/${token}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Incorrect document password.');
    return data.analysis as AnalysisResult;
  },

  // Supabase Cloud Status & Migration
  async getSupabaseStatus() {
    try {
      const res = await fetch('/api/supabase/status');
      if (!res.ok) return { configured: false, url: '', authReady: false, tablesCreated: false };
      return (await res.json()) as { configured: boolean; url: string; authReady: boolean; tablesCreated: boolean };
    } catch {
      return { configured: false, url: '', authReady: false, tablesCreated: false };
    }
  },

  async getSupabaseSchema() {
    const res = await fetch('/api/supabase/schema');
    if (!res.ok) throw new Error('Failed to load SQL schema.');
    return await res.text();
  },
};
