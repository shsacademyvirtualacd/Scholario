import { supabase } from './supabase';
import type { VisibilityRequest } from '../types';

/**
 * Service to manage online status / last seen visibility requests and admin approvals.
 */

export interface VisibilityStatusResponse {
  pendingRequest: VisibilityRequest | null;
  history: VisibilityRequest[];
}

export interface AdminVisibilityResponse {
  requests: VisibilityRequest[];
  pendingCount: number;
}

/**
 * Submit a request to hide online status (requires admin approval for students/teachers).
 */
export async function submitVisibilityRequest(userId: string, notes?: string): Promise<{
  success: boolean;
  message: string;
  autoApproved?: boolean;
  request?: VisibilityRequest;
}> {
  try {
    const res = await fetch('/api/visibility-requests/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, notes }),
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit visibility request');
    }
    return await res.json();
  } catch (err: any) {
    // Fallback: direct Supabase insert
    console.warn('[visibilityRequestsService] API submit failed, trying Supabase fallback:', err);
    const { data: existing } = await (supabase as any)
      .from('visibility_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })
      .limit(1);

    if (existing && existing.length > 0) {
      return {
        success: true,
        message: 'Request sent — pending admin approval',
        request: existing[0],
      };
    }

    const { data, error } = await (supabase as any)
      .from('visibility_requests')
      .insert({
        user_id: userId,
        requested_status: 'hidden',
        status: 'pending',
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      success: true,
      message: 'Request sent — pending admin approval',
      request: data,
    };
  }
}

/**
 * Re-enable visibility (self-serve, instant, no admin approval needed).
 */
export async function turnOnVisibility(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/visibility-requests/turn-on', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to re-enable visibility');
    }
    return await res.json();
  } catch (err: any) {
    console.warn('[visibilityRequestsService] API turn-on failed, trying Supabase fallback:', err);
    // Direct update
    await (supabase as any)
      .from('profiles')
      .update({ show_online_status: true })
      .eq('id', userId);

    // Cancel pending requests
    await (supabase as any)
      .from('visibility_requests')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'pending');

    return { success: true, message: 'Online status is now visible' };
  }
}

/**
 * Cancel a pending visibility request.
 */
export async function cancelVisibilityRequest(userId: string): Promise<{ success: boolean }> {
  try {
    const res = await fetch('/api/visibility-requests/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      throw new Error('Failed to cancel request');
    }
    return await res.json();
  } catch (err) {
    await (supabase as any)
      .from('visibility_requests')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'pending');
    return { success: true };
  }
}

/**
 * Fetch current user's visibility request status and pending request.
 */
export async function getUserVisibilityStatus(userId: string): Promise<VisibilityStatusResponse> {
  try {
    const res = await fetch(`/api/visibility-requests/status/${userId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[visibilityRequestsService] Failed to fetch status via API, using Supabase fallback:', err);
  }

  // Supabase fallback
  const { data: pending } = await (supabase as any)
    .from('visibility_requests')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false })
    .limit(1);

  const { data: history } = await (supabase as any)
    .from('visibility_requests')
    .select('*')
    .eq('user_id', userId)
    .order('requested_at', { ascending: false })
    .limit(5);

  return {
    pendingRequest: pending && pending.length > 0 ? pending[0] : null,
    history: history || [],
  };
}

/**
 * Admin: Fetch all visibility requests.
 */
export async function getAdminVisibilityRequests(): Promise<AdminVisibilityResponse> {
  try {
    const res = await fetch('/api/admin/visibility-requests');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[visibilityRequestsService] Failed to fetch admin requests via API, fallback to Supabase:', err);
  }

  // Supabase fallback
  const { data, error } = await (supabase as any)
    .from('visibility_requests')
    .select(`
      *,
      user:profiles!visibility_requests_user_id_fkey(id, full_name, role, phone, avatar_url, show_online_status)
    `)
    .order('requested_at', { ascending: false });

  if (error) throw error;

  const mapped = (data || []).map((row: any) => ({
    ...row,
    user_name: row.user?.full_name || 'Unknown User',
    user_role: row.user?.role || 'student',
    user_phone: row.user?.phone,
    user_avatar: row.user?.avatar_url,
    user_current_show_online: row.user?.show_online_status,
  }));

  const pendingCount = mapped.filter((r: any) => r.status === 'pending').length;

  return {
    requests: mapped,
    pendingCount,
  };
}

/**
 * Admin: Approve or Reject a visibility request.
 */
export async function reviewVisibilityRequest(
  requestId: string,
  action: 'approve' | 'reject',
  adminId: string,
  reason?: string
): Promise<{ success: boolean; message?: string }> {
  console.log(`[visibilityRequestsService] reviewVisibilityRequest starting: requestId=${requestId}, action=${action}, adminId=${adminId}`);

  // 1. Try server API endpoint first
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const res = await fetch('/api/admin/visibility-requests/review', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        requestId,
        action,
        adminId,
        reason,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as { success: boolean; message?: string };
      console.log('[visibilityRequestsService] API review succeeded:', data);
      return data;
    }

    const err: any = await res.json().catch(() => ({}));
    const errorDetails = err.error || err.detail || `Server returned error ${res.status}`;
    console.warn('[visibilityRequestsService] API review endpoint returned error, trying Supabase fallback:', errorDetails, err);
    throw new Error(errorDetails);
  } catch (apiErr: any) {
    console.warn('[visibilityRequestsService] API review call error, falling back to Supabase client:', apiErr?.message);

    // 2. Direct Supabase fallback
    try {
      // Fetch the request record to obtain user_id
      const { data: reqRow, error: fetchErr } = await (supabase as any)
        .from('visibility_requests')
        .select('id, user_id, status')
        .eq('id', requestId)
        .single();

      if (fetchErr || !reqRow) {
        const fetchMsg = fetchErr ? fetchErr.message : 'Visibility request not found in database';
        console.error('[visibilityRequestsService] Supabase fetch request failed:', fetchErr);
        throw new Error(fetchMsg);
      }

      const targetUserId = reqRow.user_id;

      // Update visibility request record
      const { error: updateReqErr } = await (supabase as any)
        .from('visibility_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_by: adminId || null,
          reviewed_at: new Date().toISOString(),
          notes: reason || null,
        })
        .eq('id', requestId);

      if (updateReqErr) {
        console.error('[visibilityRequestsService] Supabase update visibility_requests failed:', updateReqErr);
        throw new Error(`Database error updating request: ${updateReqErr.message}`);
      }

      if (action === 'approve') {
        // Update user profile to hide online status
        const { error: profileErr } = await (supabase as any)
          .from('profiles')
          .update({ show_online_status: false })
          .eq('id', targetUserId);

        if (profileErr) {
          console.error('[visibilityRequestsService] Supabase update profile show_online_status failed:', profileErr);
          throw new Error(`Database error updating user profile: ${profileErr.message}`);
        }

        // Insert notification
        const { error: notifErr } = await (supabase as any)
          .from('notifications')
          .insert({
            recipient_id: targetUserId,
            title: 'Visibility Request Approved',
            message: 'Your request to hide your online status and last seen has been approved by administration. Your status is now private.',
            type: 'privacy',
            severity: 'normal',
            is_read: false,
            created_at: new Date().toISOString(),
          });

        if (notifErr) {
          console.warn('[visibilityRequestsService] Notification insert warning (non-fatal):', notifErr);
        }

        return { success: true, message: 'Request approved and user status updated to hidden' };
      } else {
        // action === 'reject'
        const rejectMsg = reason
          ? `Your request to hide your online status was declined by administration: ${reason}. Your status remains visible.`
          : 'Your request to hide your online status and last seen was declined by administration. Your status remains visible.';

        const { error: notifErr } = await (supabase as any)
          .from('notifications')
          .insert({
            recipient_id: targetUserId,
            title: 'Visibility Request Declined',
            message: rejectMsg,
            type: 'privacy',
            severity: 'normal',
            is_read: false,
            created_at: new Date().toISOString(),
          });

        if (notifErr) {
          console.warn('[visibilityRequestsService] Notification insert warning (non-fatal):', notifErr);
        }

        return { success: true, message: 'Request rejected' };
      }
    } catch (fallbackErr: any) {
      console.error('[visibilityRequestsService] Both API and Supabase fallback failed with error:', fallbackErr);
      throw fallbackErr;
    }
  }
}
