export type UrgencyLevel = 'TODAY' | 'SOON' | 'UPCOMING' | 'NO DEADLINE FOUND';

export type DetailStatus = 'EXPLICITLY STATED' | 'INFERRED' | 'UNKNOWN';

export interface ImportantDetail {
  label: string;
  value: string;
  evidence?: string;
  status: DetailStatus;
}

export interface AnalysisResult {
  id: string;
  createdAt: string;
  documentType: string;
  title: string;
  oneSentenceMeaning: string;
  urgency: UrgencyLevel;
  deadline: string;
  deadlineEvidence: string;
  primaryAction: string;
  whyItMatters: string;
  steps: string[];
  whatYouNeed: string[];
  ifYouDoNothing: string;
  questionsToAsk: string[];
  suggestedResponse: string;
  suggestedResponseFormal?: string;
  suggestedResponseFriendly?: string;
  suggestedResponseFirm?: string;
  importantDetails: ImportantDetail[];
  uncertainties: string[];
  confidence: 'high' | 'medium' | 'low';
  isPasswordProtected?: boolean;
  sourceInfo?: {
    type: 'upload' | 'camera' | 'paste' | 'sample';
    name?: string;
    fileType?: string;
    sizeFormatted?: string;
    previewUrl?: string;
    textPreview?: string;
  };
}

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface SavedDocument {
  id: string;
  user_id: string;
  title: string;
  original_filename: string;
  document_type: string;
  summary: string;
  primary_action: string;
  deadline: string;
  urgency: UrgencyLevel;
  analysis_status: string;
  is_password_protected: boolean;
  created_at: string;
  updated_at: string;
  last_opened_at: string;
}

export interface ShareInfo {
  id: string;
  document_id: string;
  owner_user_id: string;
  share_token: string;
  permission: 'VIEW_ONLY' | 'VIEW_AND_DOWNLOAD';
  expires_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

export const DOCUMENT_TYPE_OPTIONS = [
  "I'm not sure",
  'Bill',
  'Letter',
  'Email',
  'Notice',
  'Contract / Agreement',
  'Policy',
  'Warranty',
  'Insurance',
  'School',
  'Work',
  'Housing',
  'Government',
  'Financial',
  'Medical / Healthcare',
  'Purchase / Return',
  'Other',
] as const;

export type DocumentTypeOption = typeof DOCUMENT_TYPE_OPTIONS[number];
