import { supabase } from './supabase';
import { 
  ScholarshipTier, 
  ScholarshipApplication, 
  ScholarshipVerificationPayload, 
  ScholarshipRejectionPayload, 
  ScholarshipRevocationPayload 
} from '../types/scholarship';

export const DEFAULT_SCHOLARSHIP_TIERS: ScholarshipTier[] = [
  {
    id: 'tier-90-60',
    min_marks_percentage: 90,
    discount_percentage: 60,
    applicable_boards: 'all',
    is_active: true,
    description: 'High Distinction Merit Scholarship (90%+ Marks / A* equivalent) — 60% tuition waiver',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'tier-80-40',
    min_marks_percentage: 80,
    discount_percentage: 40,
    applicable_boards: 'all',
    is_active: true,
    description: 'Distinction Merit Scholarship (80%+ Marks / A equivalent) — 40% tuition waiver',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const LOCAL_TIERS_KEY = 'scholario_scholarship_tiers_cache';
const LOCAL_APPS_KEY = 'scholario_scholarship_applications_cache';

function getLocalTiers(): ScholarshipTier[] {
  try {
    const raw = localStorage.getItem(LOCAL_TIERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_SCHOLARSHIP_TIERS;
}

function saveLocalTiers(tiers: ScholarshipTier[]) {
  try {
    localStorage.setItem(LOCAL_TIERS_KEY, JSON.stringify(tiers));
  } catch {}
}

function getLocalApps(): ScholarshipApplication[] {
  try {
    const raw = localStorage.getItem(LOCAL_APPS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveLocalApps(apps: ScholarshipApplication[]) {
  try {
    localStorage.setItem(LOCAL_APPS_KEY, JSON.stringify(apps));
  } catch {}
}

/**
 * Retrieve all active and configured scholarship tiers
 */
export async function getScholarshipTiers(): Promise<ScholarshipTier[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('scholarship_tiers')
      .select('*')
      .order('min_marks_percentage', { ascending: false });

    if (error) {
      console.warn('[scholarshipService:getScholarshipTiers] Table lookup fallback:', error.message);
      return getLocalTiers();
    }

    if (data && data.length > 0) {
      const formatted: ScholarshipTier[] = data.map((d: any) => ({
        id: d.id,
        min_marks_percentage: Number(d.min_marks_percentage),
        discount_percentage: Number(d.discount_percentage),
        applicable_boards: d.applicable_boards === 'all' || !d.applicable_boards ? 'all' : d.applicable_boards,
        is_active: Boolean(d.is_active),
        description: d.description,
        created_at: d.created_at,
        updated_at: d.updated_at
      }));
      saveLocalTiers(formatted);
      return formatted;
    }
  } catch (err) {
    console.warn('[scholarshipService:getScholarshipTiers] Exception fallback:', err);
  }

  return getLocalTiers();
}

/**
 * Calculate applicable discount percentage for a student's marks and board
 */
export function calculateDiscountForMarks(
  marksPercentage: number,
  boardId: string,
  tiers: ScholarshipTier[] = DEFAULT_SCHOLARSHIP_TIERS
): { discountPercentage: number; tier: ScholarshipTier | null; eligible: boolean } {
  if (isNaN(marksPercentage) || marksPercentage <= 0) {
    return { discountPercentage: 0, tier: null, eligible: false };
  }

  const normalizedBoard = (boardId || '').toLowerCase();
  // Filter active tiers and sort by min_marks_percentage descending
  const activeTiers = [...tiers]
    .filter((t) => t.is_active)
    .sort((a, b) => b.min_marks_percentage - a.min_marks_percentage);

  for (const t of activeTiers) {
    const boards = t.applicable_boards;
    const boardMatches = 
      boards === 'all' || 
      (Array.isArray(boards) && boards.some((b) => b.toLowerCase() === normalizedBoard || b === 'all'));

    if (boardMatches && marksPercentage >= t.min_marks_percentage) {
      return {
        discountPercentage: t.discount_percentage,
        tier: t,
        eligible: true
      };
    }
  }

  return { discountPercentage: 0, tier: null, eligible: false };
}

/**
 * Save or update a scholarship tier
 */
export async function saveScholarshipTier(tier: Partial<ScholarshipTier>): Promise<ScholarshipTier> {
  const isNew = !tier.id || tier.id.startsWith('tier-temp');
  const now = new Date().toISOString();
  const payload = {
    min_marks_percentage: Number(tier.min_marks_percentage) || 80,
    discount_percentage: Number(tier.discount_percentage) || 40,
    applicable_boards: tier.applicable_boards || 'all',
    is_active: tier.is_active !== undefined ? tier.is_active : true,
    description: tier.description || null,
    updated_at: now
  };

  try {
    if (isNew) {
      const { data, error } = await (supabase as any)
        .from('scholarship_tiers')
        .insert({ ...payload, created_at: now })
        .select('*')
        .single();
      if (!error && data) {
        const saved: ScholarshipTier = {
          id: data.id,
          min_marks_percentage: Number(data.min_marks_percentage),
          discount_percentage: Number(data.discount_percentage),
          applicable_boards: data.applicable_boards,
          is_active: data.is_active,
          description: data.description,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        const current = getLocalTiers().filter((t) => t.id !== saved.id);
        saveLocalTiers([saved, ...current]);
        return saved;
      }
    } else {
      const { data, error } = await (supabase as any)
        .from('scholarship_tiers')
        .update(payload)
        .eq('id', tier.id!)
        .select('*')
        .single();
      if (!error && data) {
        const saved: ScholarshipTier = {
          id: data.id,
          min_marks_percentage: Number(data.min_marks_percentage),
          discount_percentage: Number(data.discount_percentage),
          applicable_boards: data.applicable_boards,
          is_active: data.is_active,
          description: data.description,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        const current = getLocalTiers().map((t) => (t.id === saved.id ? saved : t));
        saveLocalTiers(current);
        return saved;
      }
    }
  } catch (err) {
    console.warn('[scholarshipService:saveScholarshipTier] DB notice:', err);
  }

  // Fallback to local
  const generatedId = tier.id || `tier_${Date.now()}`;
  const localTier: ScholarshipTier = {
    id: generatedId,
    min_marks_percentage: Number(tier.min_marks_percentage) || 80,
    discount_percentage: Number(tier.discount_percentage) || 40,
    applicable_boards: tier.applicable_boards || 'all',
    is_active: tier.is_active !== undefined ? tier.is_active : true,
    description: tier.description || null,
    created_at: tier.created_at || now,
    updated_at: now
  };
  const current = getLocalTiers().filter((t) => t.id !== generatedId);
  saveLocalTiers([localTier, ...current]);
  return localTier;
}

/**
 * Delete a scholarship tier
 */
export async function deleteScholarshipTier(id: string): Promise<void> {
  try {
    await (supabase as any)
      .from('scholarship_tiers')
      .delete()
      .eq('id', id);
  } catch (err) {
    console.warn('[scholarshipService:deleteScholarshipTier] DB error:', err);
  }
  const filtered = getLocalTiers().filter((t) => t.id !== id);
  saveLocalTiers(filtered);
}

/**
 * Upload proof document to Cloudflare R2 / Server storage
 */
export async function uploadScholarshipProofFile(file: File): Promise<{ url: string; key: string }> {
  if (!file) {
    throw new Error('Please select a valid document or image file.');
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/scholarships/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data: any = await res.json();
      if (data.url || data.file_url) {
        return {
          url: data.url || data.file_url,
          key: data.key || data.id || `doc_${Date.now()}`
        };
      }
    }
  } catch (netErr) {
    console.warn('[scholarshipService:uploadScholarshipProofFile] Server endpoint unreachable, using client blob:', netErr);
  }

  // Fallback: create base64 data URL for offline/preview test
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        url: reader.result as string,
        key: `local_${Date.now()}_${file.name}`
      });
    };
    reader.onerror = () => reject(new Error('Failed to read document file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Submit a new scholarship application (Registration step or checkout)
 */
export async function submitScholarshipApplication(payload: {
  student_id: string;
  applicant_name: string;
  applicant_email: string;
  board: string;
  class_grade: string;
  claimed_marks_percentage: number;
  proof_document_url: string;
  academic_term?: string;
}): Promise<ScholarshipApplication> {
  const term = payload.academic_term || 'Current Term';

  // Check for existing pending or verified applications for this student
  try {
    const { data: existing } = await (supabase as any)
      .from('scholarship_applications')
      .select('*')
      .eq('student_id', payload.student_id)
      .eq('academic_term', term)
      .in('status', ['pending', 'verified'])
      .maybeSingle();

    if (existing) {
      throw new Error(`You already have an active scholarship application (${existing.status}) for ${term}.`);
    }
  } catch (checkErr: any) {
    if (checkErr.message && checkErr.message.includes('already have an active')) {
      throw checkErr;
    }
  }

  const now = new Date().toISOString();
  const insertData = {
    student_id: payload.student_id,
    applicant_name: payload.applicant_name,
    applicant_email: payload.applicant_email,
    board: payload.board,
    class_grade: payload.class_grade,
    claimed_marks_percentage: Number(payload.claimed_marks_percentage),
    verified_marks_percentage: null,
    proof_document_url: payload.proof_document_url,
    status: 'pending' as const,
    applied_discount_percentage: 0,
    academic_term: term,
    created_at: now,
    updated_at: now
  };

  let newRecord: ScholarshipApplication | null = null;

  try {
    const { data, error } = await (supabase as any)
      .from('scholarship_applications')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.warn('[submitScholarshipApplication] Supabase insert warning:', error.message);
    } else if (data) {
      newRecord = {
        ...data,
        claimed_marks_percentage: Number(data.claimed_marks_percentage),
        verified_marks_percentage: data.verified_marks_percentage !== null ? Number(data.verified_marks_percentage) : null,
        applied_discount_percentage: Number(data.applied_discount_percentage) || 0
      };
    }
  } catch (err) {
    console.warn('[submitScholarshipApplication] DB fallback:', err);
  }

  if (!newRecord) {
    newRecord = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...insertData,
      status: 'pending' as const,
      verified_marks_percentage: null,
      reviewed_by: null,
      reviewed_at: null,
      rejection_reason: null,
      revocation_reason: null,
      admin_notes: null
    };
  }

  // Update local cache
  const localList = getLocalApps().filter((a) => a.id !== newRecord!.id);
  saveLocalApps([newRecord, ...localList]);

  // Update fee_statuses table to reflect scholarship_status = 'pending'
  try {
    const { data: existingFee } = await (supabase as any)
      .from('fee_statuses')
      .select('id, student_id')
      .eq('student_id', payload.student_id)
      .maybeSingle();

    if (existingFee) {
      await (supabase as any)
        .from('fee_statuses')
        .update({
          scholarship_status: 'pending',
          scholarship_application_id: newRecord.id,
          updated_at: now
        })
        .eq('student_id', payload.student_id);
    } else {
      await (supabase as any)
        .from('fee_statuses')
        .insert({
          student_id: payload.student_id,
          status: 'unpaid',
          scholarship_status: 'pending',
          scholarship_discount_percentage: 0,
          scholarship_application_id: newRecord.id,
          updated_at: now
        });
    }
  } catch (feeErr) {
    console.warn('[submitScholarshipApplication] fee_statuses update warning:', feeErr);
  }

  return newRecord;
}

/**
 * Fetch all scholarship applications for admin queue
 */
export async function getScholarshipApplications(
  statusFilter?: 'all' | 'pending' | 'verified' | 'rejected' | 'revoked'
): Promise<ScholarshipApplication[]> {
  try {
    let query = (supabase as any)
      .from('scholarship_applications')
      .select(`
        *,
        student:profiles!scholarship_applications_student_id_fkey(
          id,
          full_name,
          phone,
          board_id,
          class_id
        ),
        reviewer:profiles!scholarship_applications_reviewed_by_fkey(
          id,
          full_name
        )
      `)
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[getScholarshipApplications] Complex query error, trying simple select:', error.message);
      // Fallback simple query
      let simpleQuery = (supabase as any)
        .from('scholarship_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (statusFilter && statusFilter !== 'all') {
        simpleQuery = simpleQuery.eq('status', statusFilter);
      }
      const { data: simpleData, error: simpleErr } = await simpleQuery;
      if (!simpleErr && simpleData) {
        return simpleData.map((d: any) => ({
          ...d,
          claimed_marks_percentage: Number(d.claimed_marks_percentage),
          verified_marks_percentage: d.verified_marks_percentage !== null ? Number(d.verified_marks_percentage) : null,
          applied_discount_percentage: Number(d.applied_discount_percentage) || 0
        }));
      }
      throw error;
    }

    if (data) {
      return data.map((d: any) => ({
        ...d,
        claimed_marks_percentage: Number(d.claimed_marks_percentage),
        verified_marks_percentage: d.verified_marks_percentage !== null ? Number(d.verified_marks_percentage) : null,
        applied_discount_percentage: Number(d.applied_discount_percentage) || 0,
        student_phone: d.student?.phone || null,
        reviewer_name: d.reviewer?.full_name || null
      }));
    }
  } catch (err) {
    console.warn('[getScholarshipApplications] Supabase fallback to local apps:', err);
  }

  const local = getLocalApps();
  if (statusFilter && statusFilter !== 'all') {
    return local.filter((a) => a.status === statusFilter);
  }
  return local;
}

/**
 * Fetch scholarship application for a specific student
 */
export async function getStudentScholarshipApplication(
  studentId: string,
  term?: string
): Promise<ScholarshipApplication | null> {
  if (!studentId) return null;

  try {
    let query = (supabase as any)
      .from('scholarship_applications')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (term) {
      query = query.eq('academic_term', term);
    }

    const { data, error } = await query.limit(1);
    if (!error && data && data.length > 0) {
      const item = data[0];
      return {
        ...item,
        claimed_marks_percentage: Number(item.claimed_marks_percentage),
        verified_marks_percentage: item.verified_marks_percentage !== null ? Number(item.verified_marks_percentage) : null,
        applied_discount_percentage: Number(item.applied_discount_percentage) || 0
      };
    }
  } catch (err) {
    console.warn('[getStudentScholarshipApplication] Exception:', err);
  }

  const local = getLocalApps().find(
    (a) => a.student_id === studentId && (!term || a.academic_term === term)
  );
  return local || null;
}

/**
 * Admin: Verify and approve a student's scholarship application
 */
export async function approveScholarshipApplication(
  payload: ScholarshipVerificationPayload
): Promise<void> {
  const now = new Date().toISOString();

  // Try API route first for server-level elevation
  try {
    const res = await fetch(`/api/scholarships/applications/${payload.application_id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      return;
    }
  } catch {}

  // 1. Fetch the application to get studentId
  const { data: appData } = await (supabase as any)
    .from('scholarship_applications')
    .select('*')
    .eq('id', payload.application_id)
    .single();

  const studentId = appData?.student_id;
  const verifiedMarks = Number(payload.verified_marks_percentage);
  const discountPct = Number(payload.discount_percentage);

  // 2. Update scholarship_applications row
  await (supabase as any)
    .from('scholarship_applications')
    .update({
      status: 'verified',
      verified_marks_percentage: verifiedMarks,
      applied_discount_percentage: discountPct,
      reviewed_by: payload.reviewer_id || null,
      reviewed_at: now,
      admin_notes: payload.notes || null,
      updated_at: now
    })
    .eq('id', payload.application_id);

  // 3. Update fee_statuses row for the student
  if (studentId) {
    const { data: existingFee } = await (supabase as any)
      .from('fee_statuses')
      .select('id, status')
      .eq('student_id', studentId)
      .maybeSingle();

    if (existingFee) {
      await (supabase as any)
        .from('fee_statuses')
        .update({
          scholarship_status: 'verified',
          scholarship_discount_percentage: discountPct,
          scholarship_application_id: payload.application_id,
          updated_at: now
        })
        .eq('student_id', studentId);
    } else {
      await (supabase as any)
        .from('fee_statuses')
        .insert({
          student_id: studentId,
          status: 'unpaid',
          scholarship_status: 'verified',
          scholarship_discount_percentage: discountPct,
          scholarship_application_id: payload.application_id,
          updated_at: now
        });
    }

    // 4. Log in fee_audit_trail
    try {
      await (supabase as any).from('fee_audit_trail').insert({
        student_id: studentId,
        status_from: 'scholarship_review',
        status_to: 'scholarship_verified',
        changed_by: payload.reviewer_id || null,
        notes: `Merit Scholarship Approved: ${discountPct}% tuition discount applied based on verified marks (${verifiedMarks}%). ${payload.notes ? 'Note: ' + payload.notes : ''}`,
        changed_at: now
      });
    } catch (auditErr) {
      console.warn('[approveScholarshipApplication] fee_audit_trail insert notice:', auditErr);
    }

    // 5. Send in-app notification to student
    try {
      await (supabase as any).from('notifications').insert({
        recipient_id: studentId,
        type: 'announcement',
        title: '🎉 Merit Scholarship Approved!',
        message: `Congratulations! Your scholarship application has been verified. A ${discountPct}% tuition discount has been applied to your account.`,
        severity: 'crucial',
        is_read: false,
        created_at: now
      });
    } catch (notifErr) {
      console.warn('[approveScholarshipApplication] Notification insert notice:', notifErr);
    }
  }

  // Update local cache
  const localApps = getLocalApps().map((a) =>
    a.id === payload.application_id
      ? {
          ...a,
          status: 'verified' as const,
          verified_marks_percentage: verifiedMarks,
          applied_discount_percentage: discountPct,
          reviewed_by: payload.reviewer_id || null,
          reviewed_at: now,
          admin_notes: payload.notes || null,
          updated_at: now
        }
      : a
  );
  saveLocalApps(localApps);
}

/**
 * Admin: Reject a student's scholarship application
 */
export async function rejectScholarshipApplication(
  payload: ScholarshipRejectionPayload
): Promise<void> {
  const now = new Date().toISOString();

  // Try API route first
  try {
    const res = await fetch(`/api/scholarships/applications/${payload.application_id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      return;
    }
  } catch {}

  const { data: appData } = await (supabase as any)
    .from('scholarship_applications')
    .select('*')
    .eq('id', payload.application_id)
    .single();

  const studentId = appData?.student_id;

  // 1. Update scholarship_applications row
  await (supabase as any)
    .from('scholarship_applications')
    .update({
      status: 'rejected',
      rejection_reason: payload.rejection_reason,
      reviewed_by: payload.reviewer_id || null,
      reviewed_at: now,
      applied_discount_percentage: 0,
      updated_at: now
    })
    .eq('id', payload.application_id);

  // 2. Update fee_statuses
  if (studentId) {
    await (supabase as any)
      .from('fee_statuses')
      .update({
        scholarship_status: 'rejected',
        scholarship_discount_percentage: 0,
        updated_at: now
      })
      .eq('student_id', studentId);

    // 3. Log audit trail
    try {
      await (supabase as any).from('fee_audit_trail').insert({
        student_id: studentId,
        status_from: 'scholarship_review',
        status_to: 'scholarship_rejected',
        changed_by: payload.reviewer_id || null,
        notes: `Merit Scholarship Rejected: ${payload.rejection_reason}`,
        changed_at: now
      });
    } catch (auditErr) {
      console.warn('[rejectScholarshipApplication] fee_audit_trail notice:', auditErr);
    }

    // 4. Send in-app notification to student
    try {
      await (supabase as any).from('notifications').insert({
        recipient_id: studentId,
        type: 'announcement',
        title: 'Scholarship Application Update',
        message: `Your scholarship application was reviewed and could not be approved at this time. Reason: ${payload.rejection_reason}. Your standard tuition fee remains payable.`,
        severity: 'normal',
        is_read: false,
        created_at: now
      });
    } catch (notifErr) {
      console.warn('[rejectScholarshipApplication] Notification notice:', notifErr);
    }
  }

  // Update local cache
  const localApps = getLocalApps().map((a) =>
    a.id === payload.application_id
      ? {
          ...a,
          status: 'rejected' as const,
          rejection_reason: payload.rejection_reason,
          reviewed_by: payload.reviewer_id || null,
          reviewed_at: now,
          applied_discount_percentage: 0,
          updated_at: now
        }
      : a
  );
  saveLocalApps(localApps);
}

/**
 * Admin: Revoke a previously approved scholarship
 */
export async function revokeScholarship(
  payload: ScholarshipRevocationPayload
): Promise<void> {
  const now = new Date().toISOString();

  // Try API route first
  try {
    const res = await fetch(`/api/scholarships/applications/${payload.application_id}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      return;
    }
  } catch {}

  const { data: appData } = await (supabase as any)
    .from('scholarship_applications')
    .select('*')
    .eq('id', payload.application_id)
    .single();

  const studentId = appData?.student_id;

  // 1. Update scholarship_applications row
  await (supabase as any)
    .from('scholarship_applications')
    .update({
      status: 'revoked',
      revocation_reason: payload.revocation_reason,
      applied_discount_percentage: 0,
      reviewed_by: payload.reviewer_id || null,
      reviewed_at: now,
      updated_at: now
    })
    .eq('id', payload.application_id);

  // 2. Update fee_statuses: reset discount to 0
  if (studentId) {
    await (supabase as any)
      .from('fee_statuses')
      .update({
        scholarship_status: 'revoked',
        scholarship_discount_percentage: 0,
        updated_at: now
      })
      .eq('student_id', studentId);

    // 3. Log audit trail
    try {
      await (supabase as any).from('fee_audit_trail').insert({
        student_id: studentId,
        status_from: 'scholarship_verified',
        status_to: 'scholarship_revoked',
        changed_by: payload.reviewer_id || null,
        notes: `Merit Scholarship Revoked: ${payload.revocation_reason}. Tuition fee reverted to standard base rate.`,
        changed_at: now
      });
    } catch (auditErr) {
      console.warn('[revokeScholarship] fee_audit_trail notice:', auditErr);
    }

    // 4. Send notification
    try {
      await (supabase as any).from('notifications').insert({
        recipient_id: studentId,
        type: 'announcement',
        title: 'Scholarship Status Update: Revoked',
        message: `Your scholarship discount has been revoked: ${payload.revocation_reason}. Tuition fee dues have been restored to standard pricing.`,
        severity: 'crucial',
        is_read: false,
        created_at: now
      });
    } catch (notifErr) {
      console.warn('[revokeScholarship] Notification notice:', notifErr);
    }
  }

  // Update local cache
  const localApps = getLocalApps().map((a) =>
    a.id === payload.application_id
      ? {
          ...a,
          status: 'revoked' as const,
          revocation_reason: payload.revocation_reason,
          applied_discount_percentage: 0,
          reviewed_by: payload.reviewer_id || null,
          reviewed_at: now,
          updated_at: now
        }
      : a
  );
  saveLocalApps(localApps);
}

/**
 * Convenience wrapper for approving scholarship from Admin UI
 */
export async function adminApproveScholarship(
  applicationId: string,
  details: {
    verified_marks_percentage: number;
    discount_percentage: number;
    review_notes?: string;
    reviewer_id?: string;
  }
): Promise<void> {
  return approveScholarshipApplication({
    application_id: applicationId,
    verified_marks_percentage: details.verified_marks_percentage,
    discount_percentage: details.discount_percentage,
    notes: details.review_notes,
    reviewer_id: details.reviewer_id,
  });
}

/**
 * Convenience wrapper for rejecting scholarship from Admin UI
 */
export async function adminRejectScholarship(
  applicationId: string,
  rejectionReason: string,
  reviewerId?: string
): Promise<void> {
  return rejectScholarshipApplication({
    application_id: applicationId,
    rejection_reason: rejectionReason,
    reviewer_id: reviewerId,
  });
}

/**
 * Convenience wrapper for revoking scholarship from Admin UI
 */
export async function adminRevokeScholarship(
  applicationId: string,
  revocationReason: string,
  reviewerId?: string
): Promise<void> {
  return revokeScholarship({
    application_id: applicationId,
    revocation_reason: revocationReason,
    reviewer_id: reviewerId,
  });
}

/**
 * Convenience wrapper for saving all tiers
 */
export async function saveScholarshipTiers(tiers: ScholarshipTier[]): Promise<ScholarshipTier[]> {
  const results: ScholarshipTier[] = [];
  for (const tier of tiers) {
    const saved = await saveScholarshipTier(tier);
    results.push(saved);
  }
  return results;
}

