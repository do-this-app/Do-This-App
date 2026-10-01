import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UserRecord {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
  reset_token?: string;
  reset_expires?: string;
}

export interface ProfileRecord {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface SessionRecord {
  id: string;
  user_id: string;
  token: string;
  created_at: string;
  expires_at: string;
}

export interface DocumentRecord {
  id: string;
  user_id: string;
  title: string;
  original_filename: string;
  document_type: string;
  summary: string;
  primary_action: string;
  deadline: string;
  urgency: string;
  analysis_status: string;
  is_password_protected: boolean;
  password_hash?: string;
  created_at: string;
  updated_at: string;
  last_opened_at: string;
}

export interface DocumentContentRecord {
  id: string;
  document_id: string;
  source_type: string;
  storage_path?: string;
  extracted_text?: string;
  created_at: string;
}

export interface AnalysisRecord {
  id: string;
  document_id: string;
  user_id: string;
  one_sentence_meaning: string;
  primary_action: string;
  why_it_matters: string;
  deadline: string;
  deadline_evidence: string;
  if_you_do_nothing: string;
  confidence: string;
  created_at: string;
  updated_at: string;
}

export interface AnalysisStepRecord {
  id: string;
  analysis_id: string;
  step_number: number;
  step_text: string;
}

export interface ImportantDetailRecord {
  id: string;
  analysis_id: string;
  label: string;
  value: string;
  status: string;
  evidence?: string;
  detail_text?: string;
}

export interface QuestionRecord {
  id: string;
  analysis_id: string;
  question_text: string;
}

export interface ResponseRecord {
  id: string;
  analysis_id: string;
  response_text: string;
  response_style: string;
  created_at: string;
}

export interface ShareRecord {
  id: string;
  document_id: string;
  owner_user_id: string;
  share_token: string;
  permission: 'VIEW_ONLY' | 'VIEW_AND_DOWNLOAD';
  expires_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

interface DatabaseSchema {
  users: UserRecord[];
  profiles: ProfileRecord[];
  sessions: SessionRecord[];
  documents: DocumentRecord[];
  document_content: DocumentContentRecord[];
  analyses: AnalysisRecord[];
  analysis_steps: AnalysisStepRecord[];
  important_details: ImportantDetailRecord[];
  questions: QuestionRecord[];
  responses: ResponseRecord[];
  shares: ShareRecord[];
}

const DB_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DB_DIR, 'production_database.json');

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initial state
function getInitialData(): DatabaseSchema {
  return {
    users: [],
    profiles: [],
    sessions: [],
    documents: [],
    document_content: [],
    analyses: [],
    analysis_steps: [],
    important_details: [],
    questions: [],
    responses: [],
    shares: [],
  };
}

class RelationalDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error loading persistent database file, initializing clean state:', err);
    }
    const initial = getInitialData();
    this.persistSync(initial);
    return initial;
  }

  private persistSync(dataToSave: DatabaseSchema) {
    try {
      const tmpFile = `${DB_FILE}.${Date.now()}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Error saving persistent database:', err);
    }
  }

  private save() {
    this.persistSync(this.data);
  }

  // --- CRYPTO UTILITIES ---
  hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  verifyPassword(password: string, storedHash: string): boolean {
    if (!storedHash || !storedHash.includes(':')) return false;
    const [salt, key] = storedHash.split(':');
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  }

  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  generateId(): string {
    return crypto.randomUUID();
  }

  // --- USER AUTHENTICATION & PROFILES ---
  findUserByEmail(email: string): UserRecord | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserByUsername(username: string): UserRecord | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  findUserById(id: string): UserRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  findProfileByUserId(userId: string): ProfileRecord | undefined {
    return this.data.profiles.find((p) => p.user_id === userId);
  }

  createUser(
    email: string,
    username: string,
    passwordPlain: string,
    explicitUserId?: string
  ): { user: UserRecord; profile: ProfileRecord } {
    const existingEmail = this.findUserByEmail(email);
    if (existingEmail) throw new Error('An account with this email already exists.');

    const existingUsername = this.findUserByUsername(username);
    if (existingUsername) throw new Error('This username is already taken.');

    const now = new Date().toISOString();
    const userId = explicitUserId || this.generateId();
    const password_hash = this.hashPassword(passwordPlain);

    const user: UserRecord = {
      id: userId,
      email: email.toLowerCase().trim(),
      username: username.trim(),
      password_hash,
      created_at: now,
      updated_at: now,
    };

    const profile: ProfileRecord = {
      id: this.generateId(),
      user_id: userId,
      username: username.trim(),
      display_name: username.trim(),
      avatar_url: '',
      created_at: now,
      updated_at: now,
    };

    this.data.users.push(user);
    this.data.profiles.push(profile);
    this.save();

    return { user, profile };
  }

  migrateUserId(oldUserId: string, newUserId: string) {
    if (!oldUserId || !newUserId || oldUserId === newUserId) return;
    const user = this.data.users.find((u) => u.id === oldUserId);
    if (user) {
      user.id = newUserId;
      user.updated_at = new Date().toISOString();
    }
    const profile = this.data.profiles.find((p) => p.user_id === oldUserId);
    if (profile) {
      profile.user_id = newUserId;
      profile.updated_at = new Date().toISOString();
    }
    for (const session of this.data.sessions) {
      if (session.user_id === oldUserId) {
        session.user_id = newUserId;
      }
    }
    for (const doc of this.data.documents) {
      if (doc.user_id === oldUserId) {
        doc.user_id = newUserId;
        doc.updated_at = new Date().toISOString();
      }
    }
    for (const analysis of this.data.analyses) {
      if (analysis.user_id === oldUserId) {
        analysis.user_id = newUserId;
        analysis.updated_at = new Date().toISOString();
      }
    }
    for (const share of this.data.shares) {
      if (share.owner_user_id === oldUserId) {
        share.owner_user_id = newUserId;
      }
    }
    this.save();
  }

  createSession(userId: string): SessionRecord {
    const token = this.generateToken();
    const now = new Date();
    // 30 days session
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const session: SessionRecord = {
      id: this.generateId(),
      user_id: userId,
      token,
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
    };

    this.data.sessions.push(session);
    this.save();
    return session;
  }

  findSession(token: string): (SessionRecord & { user: UserRecord; profile: ProfileRecord }) | null {
    if (!token) return null;
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session) return null;

    if (new Date(session.expires_at) < new Date()) {
      // Expired session
      this.deleteSession(token);
      return null;
    }

    const user = this.findUserById(session.user_id);
    if (!user) return null;

    const profile = this.findProfileByUserId(session.user_id);
    if (!profile) return null;

    return { ...session, user, profile };
  }

  deleteSession(token: string) {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.save();
  }

  updateProfile(userId: string, updates: { display_name?: string; username?: string; avatar_url?: string }): ProfileRecord {
    const profile = this.findProfileByUserId(userId);
    if (!profile) throw new Error('Profile not found.');

    if (updates.username && updates.username.toLowerCase() !== profile.username.toLowerCase()) {
      const existing = this.findUserByUsername(updates.username);
      if (existing && existing.id !== userId) {
        throw new Error('This username is already taken.');
      }
      profile.username = updates.username.trim();
      const user = this.findUserById(userId);
      if (user) {
        user.username = updates.username.trim();
        user.updated_at = new Date().toISOString();
      }
    }

    if (updates.display_name !== undefined) {
      profile.display_name = updates.display_name.trim();
    }

    if (updates.avatar_url !== undefined) {
      profile.avatar_url = updates.avatar_url;
    }

    profile.updated_at = new Date().toISOString();
    this.save();
    return profile;
  }

  changePassword(userId: string, oldPasswordPlain: string, newPasswordPlain: string) {
    const user = this.findUserById(userId);
    if (!user) throw new Error('User not found.');

    if (!this.verifyPassword(oldPasswordPlain, user.password_hash)) {
      throw new Error('Incorrect current password.');
    }

    user.password_hash = this.hashPassword(newPasswordPlain);
    user.updated_at = new Date().toISOString();
    this.save();
  }

  changeEmail(userId: string, newEmail: string) {
    const user = this.findUserById(userId);
    if (!user) throw new Error('User not found.');

    const existing = this.findUserByEmail(newEmail);
    if (existing && existing.id !== userId) {
      throw new Error('An account with this email already exists.');
    }

    user.email = newEmail.toLowerCase().trim();
    user.updated_at = new Date().toISOString();
    this.save();
  }

  createPasswordResetToken(email: string): string | null {
    const user = this.findUserByEmail(email);
    if (!user) return null;

    const token = crypto.randomBytes(24).toString('hex');
    user.reset_token = token;
    // 1 hour expiry
    user.reset_expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    this.save();
    return token;
  }

  resetPasswordWithToken(token: string, newPasswordPlain: string) {
    const user = this.data.users.find(
      (u) => u.reset_token === token && u.reset_expires && new Date(u.reset_expires) > new Date()
    );
    if (!user) throw new Error('Invalid or expired password reset token.');

    user.password_hash = this.hashPassword(newPasswordPlain);
    user.reset_token = undefined;
    user.reset_expires = undefined;
    user.updated_at = new Date().toISOString();
    this.save();
  }

  // --- CASCADING DELETE OF USER ACCOUNT ---
  deleteUserAccount(userId: string) {
    // 1. Delete all user documents and cascade their relations
    const userDocs = this.data.documents.filter((d) => d.user_id === userId);
    for (const doc of userDocs) {
      this.deleteDocument(userId, doc.id);
    }

    // 2. Remove sessions
    this.data.sessions = this.data.sessions.filter((s) => s.user_id !== userId);

    // 3. Remove profile
    this.data.profiles = this.data.profiles.filter((p) => p.user_id !== userId);

    // 4. Remove user
    this.data.users = this.data.users.filter((u) => u.id !== userId);

    this.save();
  }

  // --- DOCUMENTS, ANALYSES & ROW LEVEL SECURITY ---
  getDocuments(userId: string, search?: string, sort: 'recent' | 'newest' | 'oldest' | 'deadline' = 'recent'): DocumentRecord[] {
    let docs = this.data.documents.filter((d) => d.user_id === userId);

    if (search) {
      const q = search.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.document_type.toLowerCase().includes(q) ||
          d.summary.toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case 'newest':
        return docs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'oldest':
        return docs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'deadline':
        return docs.sort((a, b) => {
          if (a.urgency === 'TODAY' && b.urgency !== 'TODAY') return -1;
          if (b.urgency === 'TODAY' && a.urgency !== 'TODAY') return 1;
          if (a.urgency === 'SOON' && b.urgency !== 'SOON') return -1;
          if (b.urgency === 'SOON' && a.urgency !== 'SOON') return 1;
          return new Date(b.last_opened_at).getTime() - new Date(a.last_opened_at).getTime();
        });
      case 'recent':
      default:
        return docs.sort((a, b) => new Date(b.last_opened_at).getTime() - new Date(a.last_opened_at).getTime());
    }
  }

  getDocumentById(userId: string, documentId: string): DocumentRecord | null {
    const doc = this.data.documents.find((d) => d.id === documentId);
    if (!doc) return null;
    // RLS Enforcement: User A cannot read User B's documents
    if (doc.user_id !== userId) return null;
    return doc;
  }

  saveDocument(
    userId: string,
    payload: {
      title: string;
      originalFilename?: string;
      documentType: string;
      summary: string;
      primaryAction: string;
      deadline: string;
      urgency: string;
      extractedText?: string;
      analysis: {
        oneSentenceMeaning: string;
        primaryAction: string;
        whyItMatters: string;
        deadline: string;
        deadlineEvidence: string;
        ifYouDoNothing: string;
        confidence: string;
        steps: string[];
        whatYouNeed?: string[];
        importantDetails?: Array<{ label: string; value: string; status: string; evidence?: string }>;
        questionsToAsk?: string[];
        suggestedResponse: string;
        suggestedResponseFormal?: string;
        suggestedResponseFriendly?: string;
        suggestedResponseFirm?: string;
        uncertainties?: string[];
      };
    }
  ): { document: DocumentRecord; analysis: any; raw?: any } {
    const now = new Date().toISOString();
    const docId = this.generateId();

    const document: DocumentRecord = {
      id: docId,
      user_id: userId,
      title: payload.title,
      original_filename: payload.originalFilename || 'Document',
      document_type: payload.documentType,
      summary: payload.summary,
      primary_action: payload.primaryAction,
      deadline: payload.deadline,
      urgency: payload.urgency,
      analysis_status: 'completed',
      is_password_protected: false,
      created_at: now,
      updated_at: now,
      last_opened_at: now,
    };

    const docContent: DocumentContentRecord = {
      id: this.generateId(),
      document_id: docId,
      source_type: 'upload',
      extracted_text: payload.extractedText || '',
      created_at: now,
    };

    const analysisId = this.generateId();
    const analysisRecord: AnalysisRecord = {
      id: analysisId,
      document_id: docId,
      user_id: userId,
      one_sentence_meaning: payload.analysis.oneSentenceMeaning,
      primary_action: payload.analysis.primaryAction,
      why_it_matters: payload.analysis.whyItMatters,
      deadline: payload.analysis.deadline,
      deadline_evidence: payload.analysis.deadlineEvidence,
      if_you_do_nothing: payload.analysis.ifYouDoNothing,
      confidence: payload.analysis.confidence || 'high',
      created_at: now,
      updated_at: now,
    };

    // Steps
    const stepRecords: AnalysisStepRecord[] = (payload.analysis.steps || []).map((step, idx) => ({
      id: this.generateId(),
      analysis_id: analysisId,
      step_number: idx + 1,
      step_text: step,
    }));

    // Details
    const detailRecords: ImportantDetailRecord[] = (payload.analysis.importantDetails || []).map((d) => ({
      id: this.generateId(),
      analysis_id: analysisId,
      label: d.label,
      value: d.value,
      status: d.status,
      evidence: d.evidence,
      detail_text: `${d.label}: ${d.value}`,
    }));

    // Questions
    const questionRecords: QuestionRecord[] = (payload.analysis.questionsToAsk || []).map((q) => ({
      id: this.generateId(),
      analysis_id: analysisId,
      question_text: q,
    }));

    // Responses
    const responseRecords: ResponseRecord[] = [
      {
        id: this.generateId(),
        analysis_id: analysisId,
        response_text: payload.analysis.suggestedResponse,
        response_style: 'default',
        created_at: now,
      },
    ];

    if (payload.analysis.suggestedResponseFormal) {
      responseRecords.push({
        id: this.generateId(),
        analysis_id: analysisId,
        response_text: payload.analysis.suggestedResponseFormal,
        response_style: 'formal',
        created_at: now,
      });
    }
    if (payload.analysis.suggestedResponseFriendly) {
      responseRecords.push({
        id: this.generateId(),
        analysis_id: analysisId,
        response_text: payload.analysis.suggestedResponseFriendly,
        response_style: 'friendly',
        created_at: now,
      });
    }
    if (payload.analysis.suggestedResponseFirm) {
      responseRecords.push({
        id: this.generateId(),
        analysis_id: analysisId,
        response_text: payload.analysis.suggestedResponseFirm,
        response_style: 'firm',
        created_at: now,
      });
    }

    this.data.documents.push(document);
    this.data.document_content.push(docContent);
    this.data.analyses.push(analysisRecord);
    this.data.analysis_steps.push(...stepRecords);
    this.data.important_details.push(...detailRecords);
    this.data.questions.push(...questionRecords);
    this.data.responses.push(...responseRecords);

    this.save();

    return {
      document,
      analysis: this.getCompleteAnalysisForDocument(docId),
      raw: {
        docContent,
        analysisRecord,
        stepRecords,
        detailRecords,
        questionRecords,
        responseRecords,
      },
    };
  }

  getCompleteAnalysisForDocument(documentId: string): any {
    const analysis = this.data.analyses.find((a) => a.document_id === documentId);
    if (!analysis) return null;

    const steps = this.data.analysis_steps
      .filter((s) => s.analysis_id === analysis.id)
      .sort((a, b) => a.step_number - b.step_number)
      .map((s) => s.step_text);

    const importantDetails = this.data.important_details
      .filter((d) => d.analysis_id === analysis.id)
      .map((d) => ({
        label: d.label,
        value: d.value,
        status: d.status,
        evidence: d.evidence,
      }));

    const questionsToAsk = this.data.questions
      .filter((q) => q.analysis_id === analysis.id)
      .map((q) => q.question_text);

    const responses = this.data.responses.filter((r) => r.analysis_id === analysis.id);
    const defResp = responses.find((r) => r.response_style === 'default')?.response_text || '';
    const formResp = responses.find((r) => r.response_style === 'formal')?.response_text;
    const friendResp = responses.find((r) => r.response_style === 'friendly')?.response_text;
    const firmResp = responses.find((r) => r.response_style === 'firm')?.response_text;

    const doc = this.data.documents.find((d) => d.id === documentId);

    return {
      documentType: doc?.document_type || 'Document',
      title: doc?.title || 'Document Analysis',
      oneSentenceMeaning: analysis.one_sentence_meaning,
      urgency: doc?.urgency || 'NO DEADLINE FOUND',
      deadline: analysis.deadline,
      deadlineEvidence: analysis.deadline_evidence,
      primaryAction: analysis.primary_action,
      whyItMatters: analysis.why_it_matters,
      steps,
      whatYouNeed: [],
      ifYouDoNothing: analysis.if_you_do_nothing,
      questionsToAsk,
      suggestedResponse: defResp,
      suggestedResponseFormal: formResp,
      suggestedResponseFriendly: friendResp,
      suggestedResponseFirm: firmResp,
      importantDetails,
      uncertainties: [],
      confidence: analysis.confidence || 'high',
      isPasswordProtected: doc?.is_password_protected || false,
    };
  }

  renameDocument(userId: string, documentId: string, newTitle: string): DocumentRecord {
    const doc = this.getDocumentById(userId, documentId);
    if (!doc) throw new Error('Document not found or unauthorized.');

    doc.title = newTitle.trim();
    doc.updated_at = new Date().toISOString();
    this.save();
    return doc;
  }

  touchDocumentLastOpened(userId: string, documentId: string) {
    const doc = this.getDocumentById(userId, documentId);
    if (doc) {
      doc.last_opened_at = new Date().toISOString();
      this.save();
    }
  }

  // --- PASSWORD PROTECTION ---
  protectDocument(userId: string, documentId: string, passwordPlain: string) {
    const doc = this.getDocumentById(userId, documentId);
    if (!doc) throw new Error('Document not found or unauthorized.');

    doc.is_password_protected = true;
    doc.password_hash = this.hashPassword(passwordPlain);
    doc.updated_at = new Date().toISOString();
    this.save();
  }

  removeDocumentProtection(userId: string, documentId: string, currentPasswordPlain: string) {
    const doc = this.getDocumentById(userId, documentId);
    if (!doc) throw new Error('Document not found or unauthorized.');

    if (!doc.password_hash || !this.verifyPassword(currentPasswordPlain, doc.password_hash)) {
      throw new Error('Incorrect document password.');
    }

    doc.is_password_protected = false;
    doc.password_hash = undefined;
    doc.updated_at = new Date().toISOString();
    this.save();
  }

  verifyDocumentPassword(documentId: string, passwordPlain: string): boolean {
    const doc = this.data.documents.find((d) => d.id === documentId);
    if (!doc || !doc.is_password_protected || !doc.password_hash) return false;
    return this.verifyPassword(passwordPlain, doc.password_hash);
  }

  // --- CASCADING DELETION OF A DOCUMENT ---
  deleteDocument(userId: string, documentId: string) {
    const doc = this.getDocumentById(userId, documentId);
    if (!doc) throw new Error('Document not found or unauthorized.');

    // Find analysis
    const analysis = this.data.analyses.find((a) => a.document_id === documentId);
    if (analysis) {
      const aid = analysis.id;
      this.data.analysis_steps = this.data.analysis_steps.filter((s) => s.analysis_id !== aid);
      this.data.important_details = this.data.important_details.filter((d) => d.analysis_id !== aid);
      this.data.questions = this.data.questions.filter((q) => q.analysis_id !== aid);
      this.data.responses = this.data.responses.filter((r) => r.analysis_id !== aid);
      this.data.analyses = this.data.analyses.filter((a) => a.id !== aid);
    }

    // Remove content
    this.data.document_content = this.data.document_content.filter((c) => c.document_id !== documentId);

    // Remove shares
    this.data.shares = this.data.shares.filter((s) => s.document_id !== documentId);

    // Remove document
    this.data.documents = this.data.documents.filter((d) => d.id !== documentId);

    this.save();
  }

  clearUserHistory(userId: string) {
    const userDocs = this.data.documents.filter((d) => d.user_id === userId);
    for (const doc of userDocs) {
      this.deleteDocument(userId, doc.id);
    }
  }

  // --- SECURE SHARING ---
  createShare(
    userId: string,
    documentId: string,
    permission: 'VIEW_ONLY' | 'VIEW_AND_DOWNLOAD' = 'VIEW_ONLY',
    expiresInHours?: number
  ): ShareRecord {
    const doc = this.getDocumentById(userId, documentId);
    if (!doc) throw new Error('Document not found or unauthorized.');

    // 32-character cryptographically secure token
    const share_token = crypto.randomBytes(16).toString('hex');
    const now = new Date();
    const expires_at = expiresInHours ? new Date(now.getTime() + expiresInHours * 60 * 60 * 1000).toISOString() : null;

    const share: ShareRecord = {
      id: this.generateId(),
      document_id: documentId,
      owner_user_id: userId,
      share_token,
      permission,
      expires_at,
      created_at: now.toISOString(),
      revoked_at: null,
    };

    this.data.shares.push(share);
    this.save();
    return share;
  }

  getDocumentShares(userId: string, documentId: string): ShareRecord[] {
    const doc = this.getDocumentById(userId, documentId);
    if (!doc) throw new Error('Document not found or unauthorized.');
    return this.data.shares.filter((s) => s.document_id === documentId && s.owner_user_id === userId);
  }

  revokeShare(userId: string, shareId: string) {
    const share = this.data.shares.find((s) => s.id === shareId && s.owner_user_id === userId);
    if (!share) throw new Error('Share link not found or unauthorized.');
    share.revoked_at = new Date().toISOString();
    this.save();
  }

  getPublicShare(shareToken: string): { share: ShareRecord; document: DocumentRecord; analysis: any } | null {
    const share = this.data.shares.find((s) => s.share_token === shareToken);
    if (!share) return null;

    // Check revocation
    if (share.revoked_at) return null;

    // Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) return null;

    const doc = this.data.documents.find((d) => d.id === share.document_id);
    if (!doc) return null;

    // If protected, do not expose full analysis until unlocked
    if (doc.is_password_protected) {
      return {
        share,
        document: {
          ...doc,
          password_hash: undefined, // NEVER expose password hash
        },
        analysis: null,
      };
    }

    const fullAnalysis = this.getCompleteAnalysisForDocument(doc.id);

    return {
      share,
      document: {
        ...doc,
        password_hash: undefined,
      },
      analysis: fullAnalysis,
    };
  }

  unlockPublicShare(shareToken: string, passwordPlain: string): any {
    const shareData = this.getPublicShare(shareToken);
    if (!shareData) throw new Error('Invalid or expired share link.');

    const doc = this.data.documents.find((d) => d.id === shareData.share.document_id);
    if (!doc) throw new Error('Document not found.');

    if (doc.is_password_protected) {
      if (!doc.password_hash || !this.verifyPassword(passwordPlain, doc.password_hash)) {
        throw new Error('Incorrect document password.');
      }
    }

    return this.getCompleteAnalysisForDocument(doc.id);
  }
}

export const db = new RelationalDatabase();
