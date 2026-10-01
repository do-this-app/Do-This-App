import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && (supabaseServiceKey || supabaseAnonKey));

// Server-side admin client using service-role key
export const supabaseAdmin: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Track if PostgreSQL tables are created in Supabase
let tablesAvailable = false;

export async function checkSupabaseTables(): Promise<boolean> {
  if (!supabaseAdmin) return false;
  try {
    const { error } = await supabaseAdmin.from('profiles').select('id').limit(1);
    if (!error) {
      tablesAvailable = true;
      return true;
    }
    tablesAvailable = false;
    return false;
  } catch {
    tablesAvailable = false;
    return false;
  }
}

export function areSupabaseTablesAvailable(): boolean {
  return tablesAvailable;
}

// Initial check on load
if (supabaseAdmin) {
  checkSupabaseTables().catch(() => {});
}

export const supabaseSync = {
  isConfigured: isSupabaseConfigured,
  url: supabaseUrl,

  async createAuthUser(email: string, passwordPlain: string, username: string) {
    if (!supabaseAdmin) return null;
    try {
      const cleanEmail = email.toLowerCase().trim();
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: passwordPlain,
        email_confirm: true,
        user_metadata: {
          username: username.trim(),
          display_name: username.trim(),
        },
      });
      if (error) {
        // If user already exists in Supabase Auth, retrieve existing record
        const existing = await this.getUserByEmail(cleanEmail);
        if (existing) {
          return existing;
        }
        console.warn('Supabase Auth createUser warning:', error.message);
        return null;
      }
      return data?.user || null;
    } catch (err: any) {
      console.warn('Supabase Auth error:', err.message);
      return null;
    }
  },

  async getUserByEmail(email: string) {
    if (!supabaseAdmin) return null;
    try {
      const cleanEmail = email.toLowerCase().trim();
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error || !data?.users) return null;
      return data.users.find((u) => u.email?.toLowerCase() === cleanEmail) || null;
    } catch {
      return null;
    }
  },

  async syncProfile(userId: string, username: string, displayName?: string, avatarUrl?: string) {
    if (!supabaseAdmin || !tablesAvailable) return;
    try {
      await supabaseAdmin.from('profiles').upsert({
        user_id: userId,
        username: username.trim(),
        display_name: (displayName || username).trim(),
        avatar_url: avatarUrl || '',
      });
    } catch (err: any) {
      console.warn('Supabase profile sync skipped:', err.message);
    }
  },

  async updateAuthPassword(userId: string, newPasswordPlain: string) {
    if (!supabaseAdmin) return;
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPasswordPlain,
      });
    } catch (err: any) {
      console.warn('Supabase Auth update password error:', err.message);
    }
  },

  async updateAuthEmail(userId: string, newEmail: string) {
    if (!supabaseAdmin) return;
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: newEmail.toLowerCase().trim(),
        email_confirm: true,
      });
    } catch (err: any) {
      console.warn('Supabase Auth update email error:', err.message);
    }
  },

  async deleteAuthUser(userId: string) {
    if (!supabaseAdmin) return;
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    } catch (err: any) {
      console.warn('Supabase Auth delete user error:', err.message);
    }
  },

  // Save document to Supabase if tables exist
  async syncDocument(userId: string, doc: any, analysis: any, rawRelations?: any) {
    if (!supabaseAdmin || !tablesAvailable) return;
    try {
      // 1. Documents
      const { error: docErr } = await supabaseAdmin.from('documents').upsert({
        id: doc.id,
        user_id: userId,
        title: doc.title,
        original_filename: doc.original_filename,
        document_type: doc.document_type,
        summary: doc.summary,
        primary_action: doc.primary_action,
        deadline: doc.deadline,
        urgency: doc.urgency,
        analysis_status: doc.analysis_status,
        is_password_protected: doc.is_password_protected,
        password_hash: doc.password_hash || null,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        last_opened_at: doc.last_opened_at,
      });
      if (docErr) throw docErr;

      // 2. Document Content
      if (rawRelations?.docContent) {
        await supabaseAdmin.from('document_content').upsert({
          id: rawRelations.docContent.id,
          document_id: doc.id,
          source_type: rawRelations.docContent.source_type || 'upload',
          storage_path: rawRelations.docContent.storage_path || null,
          extracted_text: rawRelations.docContent.extracted_text || '',
          created_at: rawRelations.docContent.created_at || doc.created_at,
        });
      }

      // 3. Analyses
      if (analysis) {
        const analysisId = rawRelations?.analysisRecord?.id || analysis.id || doc.id;
        const { error: anaErr } = await supabaseAdmin.from('analyses').upsert({
          id: analysisId,
          document_id: doc.id,
          user_id: userId,
          one_sentence_meaning: analysis.oneSentenceMeaning || doc.summary,
          primary_action: analysis.primaryAction || doc.primary_action,
          why_it_matters: analysis.whyItMatters || '',
          deadline: analysis.deadline || doc.deadline || 'No clear deadline found.',
          deadline_evidence: analysis.deadlineEvidence || '',
          if_you_do_nothing: analysis.ifYouDoNothing || '',
          confidence: analysis.confidence || 'high',
          created_at: doc.created_at,
          updated_at: doc.updated_at,
        });
        if (anaErr) throw anaErr;

        // 4. Analysis Steps
        if (rawRelations?.stepRecords?.length) {
          await supabaseAdmin.from('analysis_steps').upsert(
            rawRelations.stepRecords.map((s: any) => ({
              id: s.id,
              analysis_id: analysisId,
              step_number: s.step_number,
              step_text: s.step_text,
            }))
          );
        }

        // 5. Important Details
        if (rawRelations?.detailRecords?.length) {
          await supabaseAdmin.from('important_details').upsert(
            rawRelations.detailRecords.map((d: any) => ({
              id: d.id,
              analysis_id: analysisId,
              label: d.label,
              value: d.value,
              status: d.status || 'EXPLICITLY STATED',
              evidence: d.evidence || '',
              detail_text: d.detail_text || `${d.label}: ${d.value}`,
            }))
          );
        }

        // 6. Questions
        if (rawRelations?.questionRecords?.length) {
          await supabaseAdmin.from('questions').upsert(
            rawRelations.questionRecords.map((q: any) => ({
              id: q.id,
              analysis_id: analysisId,
              question_text: q.question_text,
            }))
          );
        }

        // 7. Responses
        if (rawRelations?.responseRecords?.length) {
          await supabaseAdmin.from('responses').upsert(
            rawRelations.responseRecords.map((r: any) => ({
              id: r.id,
              analysis_id: analysisId,
              response_text: r.response_text,
              response_style: r.response_style || 'default',
              created_at: r.created_at || doc.created_at,
            }))
          );
        }
      }
    } catch (err: any) {
      console.warn('Supabase document sync warning:', err.message);
    }
  },

  async deleteDocument(userId: string, documentId: string) {
    if (!supabaseAdmin || !tablesAvailable) return;
    try {
      await supabaseAdmin.from('documents').delete().match({ id: documentId, user_id: userId });
    } catch (err: any) {
      console.warn('Supabase document delete skipped:', err.message);
    }
  },

  async syncShare(share: any) {
    if (!supabaseAdmin || !tablesAvailable) return;
    try {
      await supabaseAdmin.from('shares').upsert({
        id: share.id,
        document_id: share.document_id,
        owner_user_id: share.owner_user_id,
        share_token: share.share_token,
        permission: share.permission,
        expires_at: share.expires_at,
        created_at: share.created_at,
        revoked_at: share.revoked_at,
      });
    } catch (err: any) {
      console.warn('Supabase share sync skipped:', err.message);
    }
  },
};
