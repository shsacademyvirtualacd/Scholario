/**
 * Academic Configuration — Single Source of Truth
 *
 * Centralizes fees, billing labels, scholarship tiers, payment accounts,
 * and academic session metadata for SHS Virtual Academy across the entire app.
 */

export interface FeeGradeGroup {
  id: string;
  name: string;
  gradeLabel: string;
  allSubjectsFee: number;
  perSubjectFee: number;
  gradeKeys: string[];
  description: string;
}

export interface PaymentAccount {
  id: 'easypaisa' | 'jazzcash';
  provider: 'Easypaisa' | 'JazzCash';
  accountNumber: string;
  accountTitle: string;
  badge?: string;
  instructions: string;
}

export interface ScholarshipTierConfig {
  id: string;
  minMarks: number;
  discountPercentage: number;
  label: string;
  description: string;
}

export interface AcademicConfig {
  sessionLabel: string;
  admissionsOpen: boolean;
  announcementVersion: string;
  billingLabel: string; // e.g., 'per month'
  whatsappNumber: string;
  whatsappFormatted: string;
  whatsappGroupLink: string;
  whatsappDirectLink: string;
  feeGroups: {
    matric: FeeGradeGroup;
    fsc: FeeGradeGroup;
    olevel: FeeGradeGroup;
    alevel: FeeGradeGroup;
    ielts: FeeGradeGroup;
  };
  scholarshipTiers: ScholarshipTierConfig[];
  improvementTier: {
    discountPercentage: number;
    label: string;
    description: string;
  };
  paymentAccounts: PaymentAccount[];
}

/**
 * Hardcoded fallbacks matching current production settings.
 * If live configs or network fail, this fallback ensures registration and checkout work seamlessly.
 */
export const DEFAULT_ACADEMIC_CONFIG: AcademicConfig = {
  sessionLabel: '2026–27',
  admissionsOpen: true,
  announcementVersion: '2026-v2',
  billingLabel: 'per month',
  whatsappNumber: '03058969050',
  whatsappFormatted: '+92 305 86969050',
  whatsappGroupLink: 'https://chat.whatsapp.com/L3EYfjDXFNOGTzZjAjRuvg',
  whatsappDirectLink: 'https://wa.me/9230586969050',
  feeGroups: {
    matric: {
      id: 'matric',
      name: 'Matriculation (9th & 10th)',
      gradeLabel: 'Grade 9–10',
      allSubjectsFee: 3000,
      perSubjectFee: 1000,
      gradeKeys: ['9', '10', 'Grade 9', 'Grade 10'],
      description: 'Comprehensive matric curriculum covering Mathematics, Physics, Chemistry, Biology, Urdu, and English.',
    },
    fsc: {
      id: 'fsc',
      name: 'FSC & ICS (11th & 12th)',
      gradeLabel: 'Grade 11–12',
      allSubjectsFee: 4000,
      perSubjectFee: 1000,
      gradeKeys: ['11', '12', 'Grade 11', 'Grade 12'],
      description: 'Pre-Medical, Pre-Engineering, and ICS streams with daily live lectures and structured notes.',
    },
    olevel: {
      id: 'olevel',
      name: 'Cambridge O Levels',
      gradeLabel: 'O1, O2, O3',
      allSubjectsFee: 5000,
      perSubjectFee: 2500,
      gradeKeys: ['O1', 'O2', 'O3', 'olevel'],
      description: 'Cambridge IGCSE & O-Level syllabus prep with topical past papers and exam drills.',
    },
    alevel: {
      id: 'alevel',
      name: 'Cambridge A Levels',
      gradeLabel: 'AS & A2',
      allSubjectsFee: 6500,
      perSubjectFee: 3500,
      gradeKeys: ['AS', 'A2', 'alevel'],
      description: 'Rigorous Advanced Level modular instruction with step-by-step guidance.',
    },
    ielts: {
      id: 'ielts',
      name: 'IELTS Preparation',
      gradeLabel: 'Academic & GT',
      allSubjectsFee: 3000,
      perSubjectFee: 2500,
      gradeKeys: ['ielts', 'academic', 'general_training'],
      description: 'Reading, Writing, Listening & Speaking masterclasses with certified teacher evaluations.',
    },
  },
  scholarshipTiers: [
    {
      id: 'tier-90-60',
      minMarks: 90,
      discountPercentage: 60,
      label: '90%+ Marks',
      description: 'High Distinction Merit Scholarship — 60% tuition waiver',
    },
    {
      id: 'tier-80-40',
      minMarks: 80,
      discountPercentage: 40,
      label: '80–89% Marks',
      description: 'Distinction Merit Scholarship — 40% tuition waiver',
    },
    {
      id: 'tier-70-20',
      minMarks: 70,
      discountPercentage: 20,
      label: '70–79% Marks',
      description: 'Merit Scholar Allowance — 20% tuition waiver',
    },
  ],
  improvementTier: {
    discountPercentage: 50,
    label: 'Improvement Candidates',
    description: 'Reviewed manually when the student sends a roll number slip or previous marksheet (up to 50% scholarship).',
  },
  paymentAccounts: [
    {
      id: 'easypaisa',
      provider: 'Easypaisa',
      accountNumber: '03335292094',
      accountTitle: 'Sadia Fatima',
      badge: 'Mobile Wallet',
      instructions: 'Transfer the exact amount to the Easypaisa wallet above and keep your digital receipt.',
    },
    {
      id: 'jazzcash',
      provider: 'JazzCash',
      accountNumber: '03058969050',
      accountTitle: 'Haseena Bibi',
      badge: 'Mobile Wallet',
      instructions: 'Send money to the JazzCash account above and take a clear screenshot of the transaction ID.',
    },
  ],
};

const CONFIG_STORAGE_KEY = 'scholario_academic_config_cache';

/**
 * Reads academic config with instant cached fallback.
 */
export function getAcademicConfig(): AcademicConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_ACADEMIC_CONFIG, ...parsed };
    }
  } catch {}
  return DEFAULT_ACADEMIC_CONFIG;
}

/**
 * Saves updated academic config to local cache.
 */
export function saveAcademicConfig(config: Partial<AcademicConfig>): void {
  try {
    const current = getAcademicConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

/**
 * Feature flag helper for UI v2 rollout safety.
 * Defaults to true; can be toggled via query string (?ui_v2=0 or ?ui_v2=1) or localStorage.
 */
export function isFeatureV2Enabled(flagName: string = 'ui_v2_registration'): boolean {
  try {
    // 1. Check URL parameters for immediate debug/testing
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const urlVal = params.get('ui_v2');
      if (urlVal === '0' || urlVal === 'false' || urlVal === 'off') return false;
      if (urlVal === '1' || urlVal === 'true' || urlVal === 'on') return true;
    }

    // 2. Check localStorage
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(`scholario_flag_${flagName}`);
      if (stored === 'false') return false;
      if (stored === 'true') return true;
    }
  } catch {}

  // Default enabled for UI v2 experience
  return true;
}

/**
 * Calculate applicable discount from marks percentage or improvement candidate status.
 */
export function calculateConfigScholarship(
  marksPercentage: number,
  isImprovement: boolean = false,
  config: AcademicConfig = getAcademicConfig()
): {
  discountPercentage: number;
  label: string;
  tier: ScholarshipTierConfig | null;
  isImprovement: boolean;
} {
  if (isImprovement) {
    return {
      discountPercentage: config.improvementTier.discountPercentage,
      label: config.improvementTier.label,
      tier: null,
      isImprovement: true,
    };
  }

  const marks = Number(marksPercentage) || 0;
  if (marks <= 0) {
    return { discountPercentage: 0, label: 'Standard Tuition', tier: null, isImprovement: false };
  }

  // Check tiers from highest minMarks descending
  const sorted = [...config.scholarshipTiers].sort((a, b) => b.minMarks - a.minMarks);
  for (const tier of sorted) {
    if (marks >= tier.minMarks) {
      return {
        discountPercentage: tier.discountPercentage,
        label: tier.label,
        tier,
        isImprovement: false,
      };
    }
  }

  return { discountPercentage: 0, label: 'Standard Tuition', tier: null, isImprovement: false };
}
