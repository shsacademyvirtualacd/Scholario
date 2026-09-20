import { supabase } from './supabase';
import { 
  ScholarshipTier, 
  ScholarshipApplication, 
  ScholarshipVerificationPayload, 
  ScholarshipRejectionPayload, 
  ScholarshipRevocationPayload 
} from '../types/scholarship';
import { computePayableFee } from './feeCalculation';

export const DEFAULT_SCHOLARSHIP_TIERS: ScholarshipTier[] = [
  {
    id: 'tier-90-60',
    min_marks_percentage: 90,
    discount_percentage: 60,
    applicable_boards: 'all',
    is_active: true,
    tier_name: 'High Distinction Merit (90%+ Marks)',
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
    tier_name: 'Distinction Merit (80%+ Marks)',
    description: 'Distinction Merit Scholarship (80%+ Marks / A equivalent) — 40% tuition waiver',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'tier-improvement-50',
    min_marks_percentage: 0,
    discount_percentage: 50,
    applicable_boards: 'all',
    is_active: true,
    tier_name: 'Improvement students - 50%',
    description: 'Improvement students — 50% tuition scholarship upon result card verification',
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure improvement tier is present if not already added
        const hasImprovement = parsed.some((t: ScholarshipTier) => 
          t.id === 'tier-improvement-50' || 
          (t.tier_name && t.tier_name.toLowerCase().includes('improvement')) ||
          (t.description && t.description.toLowerCase().includes('improvement'))
        );
        if (!hasImprovement) {
          const improvementTier = DEFAULT_SCHOLARSHIP_TIERS.find(t => t.id === 'tier-improvement-50')!;
          const updated = [...parsed, improvementTier];
          saveLocalTiers(updated);
          return updated;
        }
        return parsed;
      }
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
        tier_name: d.tier_name || d.name || undefined,
        description: d.description,
        created_at: d.created_at,
        updated_at: d.updated_at
      }));

      // Ensure improvement tier exists
      const hasImprovement = formatted.some((t) => 
        t.id === 'tier-improvement-50' || 
        (t.tier_name && t.tier_name.toLowerCase().includes('improvement')) ||
        (t.description && t.description.toLowerCase().includes('improvement'))
      );
      if (!hasImprovement) {
        const improvementTier = DEFAULT_SCHOLARSHIP_TIERS.find(t => t.id === 'tier-improvement-50')!;
        formatted.push(improvementTier);
      }

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
  tiers: ScholarshipTier[] = DEFAULT_SCHOLARSHIP_TIERS,
  isImprovementStudent?: boolean
): { discountPercentage: number; tier: ScholarshipTier | null; eligible: boolean } {
  // If explicitly designated as improvement student
  if (isImprovementStudent) {
    const improvementTier = tiers.find(
      (t) => t.is_active && (
        t.id === 'tier-improvement-50' || 
        (t.tier_name && t.tier_name.toLowerCase().includes('improvement')) ||
        (t.description && t.description.toLowerCase().includes('improvement'))
      )
    );
    if (improvementTier) {
      return {
        discountPercentage: improvementTier.discount_percentage,
        tier: improvementTier,
        eligible: true
      };
    }
    return {
      discountPercentage: 50,
      tier: DEFAULT_SCHOLARSHIP_TIERS.find(t => t.id === 'tier-improvement-50') || null,
      eligible: true
    };
  }

  if (isNaN(marksPercentage) || marksPercentage <= 0) {
    return { discountPercentage: 0, tier: null, eligible: false };
  }

  const normalizedBoard = (boardId || '').toLowerCase();
  // Filter active tiers (excluding 0% minimum unless improvement match) and sort by min_marks_percentage descending
  const activeTiers = [...tiers]
    .filter((t) => t.is_active && t.min_marks_percentage > 0)
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
    min_marks_percentage: Number(tier.min_marks_percentage) || 0,
    discount_percentage: Number(tier.discount_percentage) || 40,
    applicable_boards: tier.applicable_boards || 'all',
    is_active: tier.is_active !== undefined ? tier.is_active : true,
    description: tier.description || tier.tier_name || null,
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
          tier_name: tier.tier_name || data.description,
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
          tier_name: tier.tier_name || data.description,
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
    min_marks_percentage: Number(tier.min_marks_percentage) || 0,
    discount_percentage: Number(tier.discount_percentage) || 40,
    applicable_boards: tier.applicable_boards || 'all',
    is_active: tier.is_active !== undefined ? tier.is_active : true,
    tier_name: tier.tier_name || tier.description || undefined,
    description: tier.description || tier.tier_name || null,
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
  admin_notes?: string;
  matched_tier_id?: string;
  base_fee?: number;
}): Promise<ScholarshipApplication> {
  const term = payload.academic_term || 'Current Term';
  const marks = Number(payload.claimed_marks_percentage) || 0;
  const recommendedDiscount = marks >= 90 ? 60 : marks >= 80 ? 40 : 0;
  const baseFee = Math.max(0, Math.round(Number(payload.base_fee) || 3000));
  const feeCalc = computePayableFee({
    base_fee: baseFee,
    discount_percent: recommendedDiscount,
    discount_status: 'pending'
  });

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
  const insertData: Record<string, any> = {
    student_id: payload.student_id,
    applicant_name: payload.applicant_name,
    applicant_email: payload.applicant_email,
    board: payload.board,
    class_grade: payload.class_grade,
    class: payload.class_grade,
    claimed_marks_percentage: marks,
    claimed_marks: marks,
    matched_tier_id: payload.matched_tier_id || null,
    verified_marks_percentage: null,
    proof_document_url: payload.proof_document_url,
    proof_url: payload.proof_document_url,
    status: 'pending' as const,
    applied_discount_percentage: 0,
    academic_term: term,
    admin_notes: payload.admin_notes || null,
    created_at: now,
    updated_at: now
  };

  let newRecord: ScholarshipApplication | null = null;

  // Try direct Supabase insert first
  try {
    const { data, error } = await (supabase as any)
      .from('scholarship_applications')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.warn('[submitScholarshipApplication] Supabase insert warning:', error.message);
      // If error mentions unknown column, retry with clean standard columns
      const cleanData = {
        student_id: payload.student_id,
        applicant_name: payload.applicant_name,
        applicant_email: payload.applicant_email,
        board: payload.board,
        class_grade: payload.class_grade,
        claimed_marks_percentage: marks,
        proof_document_url: payload.proof_document_url,
        status: 'pending',
        applied_discount_percentage: 0,
        academic_term: term,
        admin_notes: payload.admin_notes || null,
        created_at: now,
        updated_at: now
      };
      const { data: cleanRes, error: cleanErr } = await (supabase as any)
        .from('scholarship_applications')
        .insert(cleanData)
        .select('*')
        .single();
      if (!cleanErr && cleanRes) {
        newRecord = {
          ...cleanRes,
          class_grade: cleanRes.class_grade || cleanRes.class,
          claimed_marks_percentage: Number(cleanRes.claimed_marks_percentage ?? cleanRes.claimed_marks),
          verified_marks_percentage: cleanRes.verified_marks_percentage !== null ? Number(cleanRes.verified_marks_percentage) : null,
          applied_discount_percentage: Number(cleanRes.applied_discount_percentage) || 0,
          proof_document_url: cleanRes.proof_document_url || cleanRes.proof_url
        };
      }
    } else if (data) {
      newRecord = {
        ...data,
        class_grade: data.class_grade || data.class,
        claimed_marks_percentage: Number(data.claimed_marks_percentage ?? data.claimed_marks),
        verified_marks_percentage: data.verified_marks_percentage !== null ? Number(data.verified_marks_percentage) : null,
        applied_discount_percentage: Number(data.applied_discount_percentage) || 0,
        proof_document_url: data.proof_document_url || data.proof_url
      };
    }
  } catch (err) {
    console.warn('[submitScholarshipApplication] DB direct insert error:', err);
  }

  // If Supabase direct insert didn't succeed (e.g. client RLS restrictions), invoke server route
  if (!newRecord) {
    try {
      const srvRes = await fetch('/api/scholarships/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...insertData,
          base_fee: baseFee
        })
      });
      if (srvRes.ok) {
        const srvData: any = await srvRes.json();
        if (srvData && srvData.application) {
          newRecord = {
            ...srvData.application,
            claimed_marks_percentage: Number(srvData.application.claimed_marks_percentage ?? srvData.application.claimed_marks ?? marks),
            verified_marks_percentage: null,
            applied_discount_percentage: 0
          };
        }
      }
    } catch (srvErr) {
      console.warn('[submitScholarshipApplication] Server route apply fallback error:', srvErr);
    }
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
    } as ScholarshipApplication;
  }

  // Update local cache
  const localList = getLocalApps().filter((a) => a.id !== newRecord!.id);
  saveLocalApps([newRecord, ...localList]);

  // Update fee_statuses table with single source of truth fee math
  try {
    const feeStatusPayload = {
      student_id: payload.student_id,
      status: 'unpaid',
      scholarship_status: 'pending',
      scholarship_discount_percentage: recommendedDiscount,
      scholarship_application_id: newRecord.id,
      base_fee: feeCalc.base_fee,
      discount_percent: feeCalc.discount_percent,
      discount_status: 'pending',
      payable_amount: feeCalc.payable_amount,
      updated_at: now
    };

    const { data: existingFee } = await (supabase as any)
      .from('fee_statuses')
      .select('id, student_id')
      .eq('student_id', payload.student_id)
      .maybeSingle();

    if (existingFee) {
      await (supabase as any)
        .from('fee_statuses')
        .update(feeStatusPayload)
        .eq('student_id', payload.student_id);
    } else {
      await (supabase as any)
        .from('fee_statuses')
        .insert(feeStatusPayload);
    }
  } catch (feeErr) {
    console.warn('[submitScholarshipApplication] fee_statuses update warning:', feeErr);
  }

  return newRecord;
}

/**
 * Fetch all scholarship applications for admin queue.
 * Throws real Supabase errors when queries fail so the admin UI can show an error
 * state with a Retry button rather than displaying a false 0.
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
      console.warn('[getScholarshipApplications] Complex join notice, trying standalone select:', error.message);
      // Fallback simple query on scholarship_applications table
      let simpleQuery = (supabase as any)
        .from('scholarship_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        simpleQuery = simpleQuery.eq('status', statusFilter);
      }

      const { data: simpleData, error: simpleErr } = await simpleQuery;

      if (simpleErr) {
        console.error('[getScholarshipApplications] Supabase Database Error:', {
          message: simpleErr.message,
          code: simpleErr.code,
          details: simpleErr.details,
          hint: simpleErr.hint,
        });
        throw simpleErr;
      }

      if (simpleData) {
        const studentIds = simpleData.map((d: any) => d.student_id).filter(Boolean);
        const profileMap = new Map<string, any>();
        if (studentIds.length > 0) {
          try {
            const { data: profData } = await (supabase as any)
              .from('profiles')
              .select('id, full_name, phone, board_id, class_id')
              .in('id', studentIds);
            (profData || []).forEach((p: any) => profileMap.set(p.id, p));
          } catch {}
        }

        const mapped = simpleData.map((d: any) => {
          const prof = profileMap.get(d.student_id);
          return {
            ...d,
            applicant_name: d.applicant_name || prof?.full_name || 'Student',
            class_grade: d.class_grade || d.class || '',
            claimed_marks_percentage: Number(d.claimed_marks_percentage ?? d.claimed_marks ?? 0),
            verified_marks_percentage: d.verified_marks_percentage !== null && d.verified_marks_percentage !== undefined ? Number(d.verified_marks_percentage) : null,
            applied_discount_percentage: Number(d.applied_discount_percentage) || 0,
            proof_document_url: d.proof_document_url || d.proof_url || '',
            student_phone: prof?.phone || null,
          };
        });

        saveLocalApps(mapped);
        return mapped;
      }
    }

    if (data) {
      const mapped = data.map((d: any) => ({
        ...d,
        applicant_name: d.applicant_name || d.student?.full_name || 'Student',
        class_grade: d.class_grade || d.class || '',
        claimed_marks_percentage: Number(d.claimed_marks_percentage ?? d.claimed_marks ?? 0),
        verified_marks_percentage: d.verified_marks_percentage !== null && d.verified_marks_percentage !== undefined ? Number(d.verified_marks_percentage) : null,
        applied_discount_percentage: Number(d.applied_discount_percentage) || 0,
        proof_document_url: d.proof_document_url || d.proof_url || '',
        student_phone: d.student?.phone || null,
        reviewer_name: d.reviewer?.full_name || null
      }));
      saveLocalApps(mapped);
      return mapped;
    }
  } catch (err: any) {
    console.error('[getScholarshipApplications] Database Fetch Exception:', {
      message: err?.message,
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
    });
    // Rethrow error so AdminFeesPage knows the fetch failed and presents the Retry button
    throw err;
  }

  return [];
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

  // 3. Update fee_statuses row for the student using single source of truth
  if (studentId) {
    const { data: existingFee } = await (supabase as any)
      .from('fee_statuses')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    const baseFee = Number(existingFee?.base_fee) || 3000;
    const feeCalc = computePayableFee({
      base_fee: baseFee,
      discount_percent: discountPct,
      discount_status: 'verified'
    });

    const feeUpdateData = {
      scholarship_status: 'verified',
      scholarship_discount_percentage: discountPct,
      scholarship_application_id: payload.application_id,
      base_fee: feeCalc.base_fee,
      discount_percent: feeCalc.discount_percent,
      discount_status: 'verified',
      payable_amount: feeCalc.payable_amount,
      updated_at: now
    };

    if (existingFee) {
      await (supabase as any)
        .from('fee_statuses')
        .update(feeUpdateData)
        .eq('student_id', studentId);
    } else {
      await (supabase as any)
        .from('fee_statuses')
        .insert({
          student_id: studentId,
          status: 'unpaid',
          ...feeUpdateData
        });
    }

    // 4. Log in fee_audit_trail
    try {
      await (supabase as any).from('fee_audit_trail').insert({
        student_id: studentId,
        status_from: 'scholarship_review',
        status_to: 'scholarship_verified',
        changed_by: payload.reviewer_id || null,
        notes: `Merit Scholarship Approved: ${discountPct}% tuition discount applied based on verified marks (${verifiedMarks}%). Payable: PKR ${feeCalc.payable_amount.toLocaleString()} (original: PKR ${feeCalc.base_fee.toLocaleString()}). ${payload.notes ? 'Note: ' + payload.notes : ''}`,
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
        message: `Congratulations! Your scholarship application has been verified. A ${discountPct}% tuition discount has been applied to your account. Your payable tuition fee is PKR ${feeCalc.payable_amount.toLocaleString()}.`,
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

  // 2. Update fee_statuses using single source of truth
  if (studentId) {
    const { data: existingFee } = await (supabase as any)
      .from('fee_statuses')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    const baseFee = Number(existingFee?.base_fee) || 3000;
    const feeCalc = computePayableFee({
      base_fee: baseFee,
      discount_percent: 0,
      discount_status: 'rejected'
    });

    await (supabase as any)
      .from('fee_statuses')
      .update({
        scholarship_status: 'rejected',
        scholarship_discount_percentage: 0,
        base_fee: feeCalc.base_fee,
        discount_percent: 0,
        discount_status: 'rejected',
        payable_amount: feeCalc.payable_amount,
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
        notes: `Merit Scholarship Rejected: ${payload.rejection_reason}. Standard tuition payable: PKR ${feeCalc.payable_amount.toLocaleString()}.`,
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
        message: `Your scholarship application was reviewed and could not be approved at this time. Reason: ${payload.rejection_reason}. Your standard tuition fee (PKR ${feeCalc.payable_amount.toLocaleString()}) remains payable.`,
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

  // 2. Update fee_statuses: reset discount to 0 using single source of truth
  if (studentId) {
    const { data: existingFee } = await (supabase as any)
      .from('fee_statuses')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    const baseFee = Number(existingFee?.base_fee) || 3000;
    const feeCalc = computePayableFee({
      base_fee: baseFee,
      discount_percent: 0,
      discount_status: 'revoked'
    });

    await (supabase as any)
      .from('fee_statuses')
      .update({
        scholarship_status: 'revoked',
        scholarship_discount_percentage: 0,
        base_fee: feeCalc.base_fee,
        discount_percent: 0,
        discount_status: 'revoked',
        payable_amount: feeCalc.payable_amount,
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
        notes: `Merit Scholarship Revoked: ${payload.revocation_reason}. Tuition fee reverted to standard base rate (PKR ${feeCalc.payable_amount.toLocaleString()}).`,
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

