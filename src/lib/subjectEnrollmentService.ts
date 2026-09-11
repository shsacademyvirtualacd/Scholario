// ─────────────────────────────────────────────
// Scholario — Subject Enrollment & Pricing Service
// Admin-configurable per-subject pricing & subject access control
// ─────────────────────────────────────────────

export interface SubjectPricingSettings {
  per_subject_fee: number; // default: 1000 PKR
  auto_upgrade_threshold: number; // default: 3 (4+ triggers All Subjects silently)
}

export interface StudentSubjectPlan {
  subjects: string[];
  plan_type: 'custom' | 'all';
  updated_at?: string;
}

const DEFAULT_SETTINGS: SubjectPricingSettings = {
  per_subject_fee: 1000,
  auto_upgrade_threshold: 3,
};

const LOCAL_STORAGE_SETTINGS_KEY = 'scholario_subject_pricing_settings';
const LOCAL_STORAGE_PLANS_KEY = 'scholario_student_subject_plans';

/**
 * Read admin-configurable subject fee and auto-upgrade threshold settings.
 * Checks server API first, falls back to localStorage, then defaults.
 */
export async function getSubjectPricingSettings(): Promise<SubjectPricingSettings> {
  try {
    const res = await fetch('/api/fee-settings');
    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      if (typeof data.per_subject_fee === 'number' && typeof data.auto_upgrade_threshold === 'number') {
        const validated: SubjectPricingSettings = {
          per_subject_fee: data.per_subject_fee,
          auto_upgrade_threshold: data.auto_upgrade_threshold,
        };
        try {
          localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(validated));
        } catch {
          // ignore localStorage errors
        }
        return validated;
      }
    }
  } catch (err) {
    console.warn('[subjectEnrollmentService:getSubjectPricingSettings] Network notice:', err);
  }

  // Fallback to localStorage
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        per_subject_fee: typeof parsed.per_subject_fee === 'number' ? parsed.per_subject_fee : DEFAULT_SETTINGS.per_subject_fee,
        auto_upgrade_threshold: typeof parsed.auto_upgrade_threshold === 'number' ? parsed.auto_upgrade_threshold : DEFAULT_SETTINGS.auto_upgrade_threshold,
      };
    }
  } catch {
    // ignore
  }

  return DEFAULT_SETTINGS;
}

/**
 * Synchronous read of cached pricing settings for instant renders.
 */
export function getCachedSubjectPricingSettings(): SubjectPricingSettings {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        per_subject_fee: typeof parsed.per_subject_fee === 'number' ? parsed.per_subject_fee : DEFAULT_SETTINGS.per_subject_fee,
        auto_upgrade_threshold: typeof parsed.auto_upgrade_threshold === 'number' ? parsed.auto_upgrade_threshold : DEFAULT_SETTINGS.auto_upgrade_threshold,
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

/**
 * Admin: Update subject pricing settings (per-subject fee and threshold).
 * Persists to server file store and localStorage.
 */
export async function updateSubjectPricingSettings(settings: SubjectPricingSettings): Promise<SubjectPricingSettings> {
  const cleanSettings: SubjectPricingSettings = {
    per_subject_fee: Math.max(0, Number(settings.per_subject_fee) || 0),
    auto_upgrade_threshold: Math.max(1, Number(settings.auto_upgrade_threshold) || 3),
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(cleanSettings));
  } catch {
    // ignore
  }

  try {
    const res = await fetch('/api/fee-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanSettings),
    });
    if (res.ok) {
      const data = (await res.json()) as { settings?: SubjectPricingSettings };
      return data.settings || cleanSettings;
    }
  } catch (err) {
    console.warn('[subjectEnrollmentService:updateSubjectPricingSettings] Server sync notice:', err);
  }

  return cleanSettings;
}

/**
 * Synchronous read of student subject plan from local storage/cache.
 */
export function getStudentSubjectPlanSync(studentId: string): StudentSubjectPlan | null {
  if (!studentId) return null;
  return getPlanFromLocalCache(studentId);
}

/**
 * Get single student subject enrollment plan.
 */
export async function getStudentSubjectPlan(studentId: string): Promise<StudentSubjectPlan | null> {
  if (!studentId) return null;

  try {
    const res = await fetch(`/api/student-subject-plans/${encodeURIComponent(studentId)}`);
    if (res.ok) {
      const data = (await res.json()) as { plan?: StudentSubjectPlan };
      if (data.plan) {
        // Cache locally
        savePlanToLocalCache(studentId, data.plan);
        return data.plan;
      }
    }
  } catch (err) {
    console.warn('[subjectEnrollmentService:getStudentSubjectPlan] API notice:', err);
  }

  // Local storage fallback
  return getPlanFromLocalCache(studentId);
}

/**
 * Get all student subject plans.
 */
export async function getAllStudentSubjectPlans(): Promise<Record<string, StudentSubjectPlan>> {
  try {
    const res = await fetch('/api/student-subject-plans');
    if (res.ok) {
      const data = (await res.json()) as Record<string, StudentSubjectPlan>;
      if (data && typeof data === 'object') {
        try {
          localStorage.setItem(LOCAL_STORAGE_PLANS_KEY, JSON.stringify(data));
        } catch {
          // ignore
        }
        return data;
      }
    }
  } catch (err) {
    console.warn('[subjectEnrollmentService:getAllStudentSubjectPlans] API notice:', err);
  }

  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_PLANS_KEY);
    if (cached) return JSON.parse(cached);
  } catch {
    // ignore
  }

  return {};
}

/**
 * Save or override a student's subject plan.
 */
export async function saveStudentSubjectPlan(
  studentId: string,
  subjectsOrPlan: string[] | { subjects: string[]; plan_type?: 'custom' | 'all' },
  planType?: 'custom' | 'all'
): Promise<StudentSubjectPlan> {
  let cleanSubs: string[] = [];
  let finalPlanType: 'custom' | 'all' = 'all';

  if (Array.isArray(subjectsOrPlan)) {
    cleanSubs = subjectsOrPlan.filter(Boolean);
    finalPlanType = planType || (cleanSubs.length > 0 ? 'custom' : 'all');
  } else if (subjectsOrPlan && typeof subjectsOrPlan === 'object') {
    cleanSubs = Array.isArray(subjectsOrPlan.subjects) ? subjectsOrPlan.subjects.filter(Boolean) : [];
    finalPlanType = subjectsOrPlan.plan_type || (cleanSubs.length > 0 ? 'custom' : 'all');
  }

  const plan: StudentSubjectPlan = {
    subjects: cleanSubs,
    plan_type: finalPlanType,
    updated_at: new Date().toISOString(),
  };

  savePlanToLocalCache(studentId, plan);

  try {
    await fetch('/api/student-subject-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        subjects: cleanSubs,
        plan_type: finalPlanType,
      }),
    });
  } catch (err) {
    console.warn('[subjectEnrollmentService:saveStudentSubjectPlan] Server notice:', err);
  }

  return plan;
}

function getPlanFromLocalCache(studentId: string): StudentSubjectPlan | null {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_PLANS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed[studentId] || null;
    }
  } catch {
    // ignore
  }
  return null;
}

function savePlanToLocalCache(studentId: string, plan: StudentSubjectPlan) {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_PLANS_KEY);
    const parsed = cached ? JSON.parse(cached) : {};
    parsed[studentId] = plan;
    localStorage.setItem(LOCAL_STORAGE_PLANS_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

/**
 * Calculate tuition fee and effective plan based on selected subjects and admin settings.
 *
 * Rules:
 * - If 0 subjects or 'all' plan selected directly:
 *   fee = baseClassFee, plan_type = 'all'
 * - If student selects 1 to threshold (default 3) subjects:
 *   fee = count * perSubjectFee (default Rs. 1,000/subject), plan_type = 'custom'
 * - If student selects > threshold (default 3, i.e. 4+):
 *   silently auto-upgrades to "All Subjects" and charges baseClassFee without user notification!
 */
export function calculateSubjectEnrollmentFee(params: {
  baseClassFee?: number;
  baseTuitionFee?: number;
  selectedSubjects: string[];
  totalAvailableSubjects?: number;
  perSubjectFee?: number;
  threshold?: number;
  isAllPlanDirectlySelected?: boolean;
  enrollmentMode?: 'all' | 'custom';
  grade?: string;
  boardId?: string;
  streamName?: string;
}): {
  fee: number;
  finalFee: number;
  plan_type: 'custom' | 'all';
  subjectCount: number;
  isAutoUpgraded: boolean;
  ratePerSubject: number;
  discountPercent?: number;
  discountAmount?: number;
  rawFee?: number;
} {
  const {
    baseClassFee,
    baseTuitionFee,
    selectedSubjects,
    threshold = DEFAULT_SETTINGS.auto_upgrade_threshold,
    isAllPlanDirectlySelected = false,
    enrollmentMode,
    boardId,
  } = params;

  const normBoard = String(boardId || '').trim().toLowerCase();
  const isALevel = normBoard === 'alevel';
  const isOLevel = normBoard === 'olevel';

  // Determine rate per subject
  let effectivePerSubjectFee = params.perSubjectFee ?? DEFAULT_SETTINGS.per_subject_fee;
  if (isALevel) {
    effectivePerSubjectFee = params.perSubjectFee && params.perSubjectFee > 1000 ? params.perSubjectFee : 6500;
  } else if (isOLevel) {
    effectivePerSubjectFee = params.perSubjectFee && params.perSubjectFee > 1000 ? params.perSubjectFee : 5000;
  }

  const effectiveBaseFee = baseClassFee ?? baseTuitionFee ?? (isALevel ? 6500 : isOLevel ? 5000 : 0);
  const isAllDirect = isAllPlanDirectlySelected || enrollmentMode === 'all';
  const count = selectedSubjects.length;

  // Handle Cambridge A/O Levels modular per-subject pricing (STRICTLY per-subject, NO bundle / all-subjects plan)
  if (isALevel || isOLevel) {
    if (count === 0) {
      return {
        fee: 0,
        finalFee: 0,
        plan_type: 'custom',
        subjectCount: 0,
        isAutoUpgraded: false,
        ratePerSubject: effectivePerSubjectFee,
        discountPercent: 0,
        discountAmount: 0,
        rawFee: 0,
      };
    }

    const rawFee = count * effectivePerSubjectFee;
    // Discount logic: 1 subject = 0% discount; 2+ subjects = FLAT 5% discount on the total
    const discountPercent = count >= 2 ? 0.05 : 0;
    const discountAmount = Math.round(rawFee * discountPercent);
    const discountedFee = rawFee - discountAmount;

    return {
      fee: discountedFee,
      finalFee: discountedFee,
      plan_type: 'custom',
      subjectCount: count,
      isAutoUpgraded: false,
      ratePerSubject: effectivePerSubjectFee,
      discountPercent: discountPercent * 100, // 0 or 5
      discountAmount,
      rawFee,
    };
  }

  if (isAllDirect || selectedSubjects.length === 0) {
    return {
      fee: effectiveBaseFee,
      finalFee: effectiveBaseFee,
      plan_type: 'all',
      subjectCount: selectedSubjects.length,
      isAutoUpgraded: false,
      ratePerSubject: effectivePerSubjectFee,
      discountPercent: 0,
      discountAmount: 0,
      rawFee: effectiveBaseFee,
    };
  }

  if (count <= threshold) {
    const customFee = count * effectivePerSubjectFee;
    return {
      fee: customFee,
      finalFee: customFee,
      plan_type: 'custom',
      subjectCount: count,
      isAutoUpgraded: false,
      ratePerSubject: effectivePerSubjectFee,
      discountPercent: 0,
      discountAmount: 0,
      rawFee: customFee,
    };
  }

  // Count is > threshold (i.e. 4+ subjects) -> Silent auto-upgrade to All Subjects
  return {
    fee: effectiveBaseFee,
    finalFee: effectiveBaseFee,
    plan_type: 'all',
    subjectCount: count,
    isAutoUpgraded: true, // Internal flag; do NOT surface upgrade message to student
    ratePerSubject: effectivePerSubjectFee,
    discountPercent: 0,
    discountAmount: 0,
    rawFee: effectiveBaseFee,
  };
}
