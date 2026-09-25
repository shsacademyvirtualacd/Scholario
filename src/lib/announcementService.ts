import { supabase } from './supabase';
import type { Announcement } from '../types';

// ─── Default Fallback Announcements ─────────────────────────────────────────
// Used when database table is freshly provisioned or in offline/demo modes.
export const DEFAULT_PUBLIC_ANNOUNCEMENT: Announcement = {
  id: '00000000-0000-4000-a000-000000000001',
  title: 'Admissions Open for Academic Session 2026–2027',
  body: `### Welcome to SHS Virtual Academy

Admissions are officially open for **FBISE Grades 9, 10, 11 (FSc Pre-Medical, Pre-Engineering, ICS) and Grade 12**.

- **Daily Live HD Classes**: Interactive lectures with subject-specialist faculty.
- **Subject Note Vault**: Solved numericals, chapter notes, and past paper mark schemes.
- **Testing Center**: Bi-weekly timed practice tests and AI-powered question banks.
- **Merit Scholarships**: Up to 100% fee waiver based on previous board results.

Seats are limited per subject stream to guarantee small-batch teacher interaction.`,
  announcement_type: 'public',
  target_roles: ['all'],
  is_active: true,
  starts_at: new Date(Date.now() - 86400000).toISOString(),
  ends_at: new Date(Date.now() + 90 * 86400000).toISOString(),
  action_label: 'Start Application',
  action_url: '/register',
  badge_label: 'Admissions Open',
  severity: 'crucial',
  scope: 'system',
  created_at: new Date(Date.now() - 86400000).toISOString(),
};

export const DEFAULT_STUDENT_ONBOARDING_ANNOUNCEMENT: Announcement = {
  id: '00000000-0000-4000-a000-000000000002',
  title: 'Welcome to Scholario: Student Quick Start Guide',
  body: `### Getting the Most Out of Your Student Portal

Welcome to your learning dashboard! Here is how to navigate your daily academic workflow:

1. **Live Timetable & Join Button**: Check your active schedule on the dashboard. When a class is scheduled, click the **Join Live Class** button to enter the live session with your teacher.
2. **Subject Note Vault**: Visit the Notes section to download curated chapter slides, formula cheat sheets, and board revision notes.
3. **Testing Center**: Practice with timed online quizzes, past-paper assessments, and generate custom AI practice sets.
4. **Sage AI Academic Companion**: Have a question about a tricky numerical or syllabus concept? Chat with Sage 24/7 for instant explanations grounded in your curriculum.
5. **Attendance & Streaks**: Your attendance is automatically verified when you join live lectures. Keep your streak alive to stay on top of your studies!

If you ever need assistance, reach out to your instructor or academy administration via the Chat tab.`,
  announcement_type: 'dashboard',
  target_roles: ['student'],
  is_active: true,
  starts_at: new Date(Date.now() - 86400000).toISOString(),
  action_label: 'Explore My Schedule',
  action_url: '/student/schedule',
  badge_label: 'Student Manual',
  severity: 'normal',
  scope: 'system',
  created_at: new Date(Date.now() - 86400000).toISOString(),
};

export const DEFAULT_TEACHER_ONBOARDING_ANNOUNCEMENT: Announcement = {
  id: '00000000-0000-4000-a000-000000000003',
  title: 'Welcome to Scholario: Faculty Portal Guide',
  body: `### Welcome, Faculty Member!

Your teacher portal is engineered to streamline class management, attendance, and student interaction:

1. **Live Session Dispatch**: Paste your Google Meet or Zoom link directly on the dashboard before class time so students can join smoothly.
2. **Attendance Verification**: Easily record and verify student attendance during or immediately after live lecture periods.
3. **Curriculum Vault**: Upload lecture slides, PDF assignments, and chapter notes to your assigned subject streams.
4. **Testing Center**: Create assessments, review student submissions, and release grades with detailed feedback.
5. **Sage AI for Educators**: Leverage Sage to outline lesson plans, generate MCQ options, and summarize complex syllabus topics.

Review your assigned classes on the schedule page to get started with your teaching term.`,
  announcement_type: 'dashboard',
  target_roles: ['teacher'],
  is_active: true,
  starts_at: new Date(Date.now() - 86400000).toISOString(),
  action_label: 'View Teaching Schedule',
  action_url: '/teacher/schedule',
  badge_label: 'Teacher Guide',
  severity: 'normal',
  scope: 'system',
  created_at: new Date(Date.now() - 86400000).toISOString(),
};

// ─── Public Announcements (Part 1 — Pre-Login) ──────────────────────────────

/**
 * Fetch the latest active public announcement within its active time window.
 */
export async function getPublicAnnouncement(): Promise<Announcement | null> {
  try {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('announcement_type', 'public')
      .eq('is_active', true)
      .lte('starts_at', nowIso)
      .order('starts_at', { ascending: false });

    if (error) {
      console.warn('[announcementService] Error fetching public announcements, using fallback:', error.message);
      return DEFAULT_PUBLIC_ANNOUNCEMENT;
    }

    if (data && data.length > 0) {
      // Filter ends_at if set
      const active = data.find((a: any) => !a.ends_at || new Date(a.ends_at).getTime() >= Date.now());
      if (active) return active as Announcement;
    }

    // If no records in database yet, provide default fallback
    return DEFAULT_PUBLIC_ANNOUNCEMENT;
  } catch (err) {
    console.warn('[announcementService] Fetch error:', err);
    return DEFAULT_PUBLIC_ANNOUNCEMENT;
  }
}

/**
 * Session storage key for public dismissals (per-browser-session).
 */
export function isPublicAnnouncementDismissed(id: string): boolean {
  try {
    const sessionVal = sessionStorage.getItem(`scholario_public_dismissed_${id}`);
    if (sessionVal === 'true') return true;
    const localVal = localStorage.getItem(`scholario_public_dismissed_${id}`);
    if (localVal === 'true') return true;
    return false;
  } catch {
    return false;
  }
}

export function dismissPublicAnnouncement(id: string): void {
  try {
    sessionStorage.setItem(`scholario_public_dismissed_${id}`, 'true');
    localStorage.setItem(`scholario_public_dismissed_${id}`, 'true');
  } catch {
    // Ignore storage quota errors
  }
}

// ─── Dashboard Announcements (Part 2 — Post-Login) ──────────────────────────

/**
 * Fetch all active dashboard notices targeted at the given user role
 * that have not yet been dismissed by this user account.
 * Sorted newest first.
 */
export async function getActiveDashboardAnnouncements(
  userRole: string,
  userId?: string
): Promise<Announcement[]> {
  try {
    const nowIso = new Date().toISOString();
    const { data: rawAnnouncements, error: annErr } = await supabase
      .from('announcements')
      .select('*')
      .eq('announcement_type', 'dashboard')
      .eq('is_active', true)
      .lte('starts_at', nowIso)
      .order('starts_at', { ascending: false });

    let announcements: Announcement[] = [];

    if (!annErr && rawAnnouncements && rawAnnouncements.length > 0) {
      announcements = (rawAnnouncements as Announcement[]).filter((ann) => {
        // Check ends_at
        if (ann.ends_at && new Date(ann.ends_at).getTime() < Date.now()) return false;
        // Role check
        const roles = Array.isArray(ann.target_roles) ? ann.target_roles : ['all'];
        return roles.includes('all') || roles.includes(userRole);
      });
    } else {
      // Fallback default guides if database table has not yet been seeded
      if (userRole === 'student') {
        announcements = [DEFAULT_STUDENT_ONBOARDING_ANNOUNCEMENT];
      } else if (userRole === 'teacher') {
        announcements = [DEFAULT_TEACHER_ONBOARDING_ANNOUNCEMENT];
      }
    }

    if (announcements.length === 0) return [];

    // Check dismissals
    let dismissedIds = new Set<string>();

    if (userId) {
      try {
        const { data: dismissals, error: disErr } = await supabase
          .from('announcement_dismissals')
          .select('announcement_id')
          .eq('user_id', userId);

        if (!disErr && dismissals) {
          dismissals.forEach((d: any) => dismissedIds.add(d.announcement_id));
        }
      } catch (e) {
        console.warn('[announcementService] Error querying dismissals table:', e);
      }

      // Check localStorage backup
      announcements.forEach((a) => {
        try {
          if (localStorage.getItem(`scholario_dismissed_ann_${userId}_${a.id}`) === 'true') {
            dismissedIds.add(a.id);
          }
        } catch {
          // ignore
        }
      });
    }

    // Filter out dismissed
    return announcements.filter((a) => !dismissedIds.has(a.id));
  } catch (err) {
    console.error('[announcementService] getActiveDashboardAnnouncements error:', err);
    return [];
  }
}

/**
 * Permanently dismiss a dashboard announcement for this user account.
 */
export async function dismissDashboardAnnouncement(
  announcementId: string,
  userId: string
): Promise<void> {
  // 1. Instant local persistence
  try {
    localStorage.setItem(`scholario_dismissed_ann_${userId}_${announcementId}`, 'true');
  } catch {
    // ignore
  }

  // 2. Database persistence
  try {
    const { error } = await (supabase as any)
      .from('announcement_dismissals')
      .upsert(
        {
          announcement_id: announcementId,
          user_id: userId,
          dismissed_at: new Date().toISOString(),
        },
        { onConflict: 'announcement_id,user_id' }
      );

    if (error) {
      console.warn('[announcementService] Upsert dismissal to database failed:', error.message);
    }
  } catch (err) {
    console.warn('[announcementService] Dismissal error:', err);
  }
}

// ─── Admin Management Methods ───────────────────────────────────────────────

/**
 * Fetch all announcements for admin panel with dismissal count statistics.
 */
export async function getAdminAnnouncements(): Promise<Announcement[]> {
  try {
    // 1. Fetch announcements
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*, creator:profiles(*), class:classes(*), stream:streams(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!announcements) return [];

    // 2. Fetch dismissal counts
    let dismissalCounts: Record<string, number> = {};
    try {
      const { data: dismissals } = await supabase
        .from('announcement_dismissals')
        .select('announcement_id');

      if (dismissals) {
        dismissals.forEach((row: any) => {
          dismissalCounts[row.announcement_id] = (dismissalCounts[row.announcement_id] || 0) + 1;
        });
      }
    } catch {
      // ignore if dismissals table is not yet created
    }

    return (announcements as any[]).map((ann) => ({
      ...ann,
      dismissal_count: dismissalCounts[ann.id] || 0,
      target_roles: Array.isArray(ann.target_roles) ? ann.target_roles : ['all'],
      announcement_type: ann.announcement_type || 'dashboard',
      is_active: ann.is_active !== undefined ? ann.is_active : true,
    })) as Announcement[];
  } catch (err) {
    console.error('[announcementService] getAdminAnnouncements error:', err);
    // Return sample seeded items if table error
    return [
      { ...DEFAULT_PUBLIC_ANNOUNCEMENT, dismissal_count: 0 },
      { ...DEFAULT_STUDENT_ONBOARDING_ANNOUNCEMENT, dismissal_count: 0 },
      { ...DEFAULT_TEACHER_ONBOARDING_ANNOUNCEMENT, dismissal_count: 0 },
    ];
  }
}

/**
 * Create or update an announcement in the admin panel.
 */
export async function saveAnnouncement(
  payload: Partial<Announcement>
): Promise<Announcement> {
  const insertData: any = {
    title: payload.title?.trim(),
    body: payload.body?.trim(),
    announcement_type: payload.announcement_type || 'dashboard',
    target_roles: payload.target_roles || ['all'],
    is_active: payload.is_active ?? true,
    starts_at: payload.starts_at || new Date().toISOString(),
    ends_at: payload.ends_at || null,
    action_label: payload.action_label?.trim() || null,
    action_url: payload.action_url?.trim() || null,
    badge_label: payload.badge_label?.trim() || null,
    severity: payload.severity || 'normal',
    scope: payload.scope || 'system',
    class_id: payload.class_id || null,
    stream_id: payload.stream_id || null,
    updated_at: new Date().toISOString(),
  };

  if (payload.created_by) {
    insertData.created_by = payload.created_by;
  }

  if (payload.id) {
    // Update
    const { data, error } = await (supabase as any)
      .from('announcements')
      .update(insertData)
      .eq('id', payload.id)
      .select('*, creator:profiles(*), class:classes(*), stream:streams(*)')
      .single();

    if (error) throw error;
    return data as Announcement;
  } else {
    // Insert
    const { data, error } = await (supabase as any)
      .from('announcements')
      .insert([insertData])
      .select('*, creator:profiles(*), class:classes(*), stream:streams(*)')
      .single();

    if (error) throw error;
    return data as Announcement;
  }
}

/**
 * Toggle active state of an announcement.
 */
export async function toggleAnnouncementActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const { error } = await (supabase as any)
    .from('announcements')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Delete an announcement permanently.
 */
export async function deleteAnnouncementById(id: string): Promise<void> {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Reset dismissals for an announcement so it reappears for all accounts.
 */
export async function resetAnnouncementDismissals(id: string): Promise<void> {
  const { error } = await supabase
    .from('announcement_dismissals')
    .delete()
    .eq('announcement_id', id);

  if (error) throw error;
}
