export type ScholarshipStatus = 'none' | 'pending' | 'verified' | 'rejected' | 'revoked';

export interface ScholarshipTier {
  id: string;
  min_marks_percentage: number;
  max_marks_percentage?: number | null;
  discount_percentage: number;
  applicable_boards: 'all' | string[];
  is_active: boolean;
  tier_name?: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ScholarshipApplication {
  id: string;
  student_id: string;
  applicant_name: string;
  applicant_email: string;
  board: string;
  class_grade: string;
  claimed_marks_percentage: number;
  verified_marks_percentage: number | null;
  proof_document_url: string;
  status: 'pending' | 'verified' | 'rejected' | 'revoked';
  reviewed_by: string | null;
  reviewed_at: string | null;
  verified_at?: string | null;
  rejection_reason: string | null;
  revocation_reason: string | null;
  applied_discount_percentage: number;
  discount_percentage?: number;
  academic_term: string;
  admin_notes?: string | null;
  review_notes?: string | null;
  created_at: string;
  updated_at: string;
  // Joined or augmented data
  student_phone?: string | null;
  reviewer_name?: string | null;
}

export interface ScholarshipVerificationPayload {
  application_id: string;
  verified_marks_percentage: number;
  discount_percentage: number;
  reviewer_id?: string;
  notes?: string;
}

export interface ScholarshipRejectionPayload {
  application_id: string;
  rejection_reason: string;
  reviewer_id?: string;
}

export interface ScholarshipRevocationPayload {
  application_id: string;
  revocation_reason: string;
  reviewer_id?: string;
}
