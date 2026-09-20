/**
 * Centralized Single Source of Truth for Tuition Fee & Scholarship Math
 * 
 * Formula:
 *   base_fee (from class/grade fee config or subject pricing)
 *   - discount_percent (from verified scholarship, or provisional if pending)
 *   = payable_amount
 */

export type ScholarshipDiscountStatus = 'none' | 'pending' | 'verified' | 'rejected' | 'revoked';

export interface FeeCalculationInput {
  base_fee: number;
  discount_percent?: number | null;
  discount_status?: ScholarshipDiscountStatus | string | null;
}

export interface FeeCalculationResult {
  base_fee: number;
  discount_percent: number;
  discount_status: ScholarshipDiscountStatus;
  discount_amount: number;
  payable_amount: number;
  is_provisional: boolean;
  formatted_base_fee: string;
  formatted_payable_amount: string;
  explanation_label: string;
  status_badge_text: string;
}

/**
 * Recomputes the exact tuition dues and discounts according to academic policy.
 * 
 * Rules:
 * 1. Verified scholarship: discount applied, confirmed.
 * 2. Pending scholarship: discount shown provisionally (e.g. PKR 1,800 instead of PKR 3,000 with 40% off),
 *    marked with "Pending Verification" badge and original price strikethrough.
 * 3. Rejected/Revoked/None: full base_fee is payable.
 */
export function computePayableFee(input: FeeCalculationInput): FeeCalculationResult {
  const base_fee = Math.max(0, Math.round(Number(input.base_fee) || 0));
  const rawPercent = Number(input.discount_percent) || 0;
  const discount_percent = Math.max(0, Math.min(100, Math.round(rawPercent)));

  const normalizedStatus = (input.discount_status || 'none').toLowerCase();
  const discount_status: ScholarshipDiscountStatus = (
    ['none', 'pending', 'verified', 'rejected', 'revoked'].includes(normalizedStatus)
      ? normalizedStatus
      : 'none'
  ) as ScholarshipDiscountStatus;

  let payable_amount = base_fee;
  let discount_amount = 0;
  let is_provisional = false;
  let explanation_label = '';
  let status_badge_text = '';

  if (discount_status === 'verified' && discount_percent > 0) {
    discount_amount = Math.round(base_fee * (discount_percent / 100));
    payable_amount = Math.max(0, base_fee - discount_amount);
    is_provisional = false;
    explanation_label = `Verified ${discount_percent}% merit scholarship applied (original: PKR ${base_fee.toLocaleString()})`;
    status_badge_text = `${discount_percent}% Scholarship Verified`;
  } else if (discount_status === 'pending' && discount_percent > 0) {
    // Provisional display as requested: show PKR 1,800 with "Pending verification of 40% scholarship (original: PKR 3,000)"
    discount_amount = Math.round(base_fee * (discount_percent / 100));
    payable_amount = Math.max(0, base_fee - discount_amount);
    is_provisional = true;
    explanation_label = `Pending verification of ${discount_percent}% scholarship (original: PKR ${base_fee.toLocaleString()})`;
    status_badge_text = `Pending Verification (${discount_percent}% Scholarship)`;
  } else if (discount_status === 'rejected') {
    payable_amount = base_fee;
    discount_amount = 0;
    is_provisional = false;
    explanation_label = `Scholarship application rejected. Standard tuition fee payable: PKR ${base_fee.toLocaleString()}`;
    status_badge_text = 'Standard Tuition';
  } else {
    payable_amount = base_fee;
    discount_amount = 0;
    is_provisional = false;
    explanation_label = `Standard tuition fee: PKR ${base_fee.toLocaleString()}`;
    status_badge_text = 'Standard Tuition';
  }

  return {
    base_fee,
    discount_percent,
    discount_status,
    discount_amount,
    payable_amount,
    is_provisional,
    formatted_base_fee: `PKR ${base_fee.toLocaleString()}`,
    formatted_payable_amount: `PKR ${payable_amount.toLocaleString()}`,
    explanation_label,
    status_badge_text,
  };
}
