# Student Portal UI v2 Redesign Progress

## Project Stack & Discovery Verification
- **Hosting & Server**: Cloudflare Pages with Pages Functions (`functions/` directory, `wrangler.toml`), Node Express local dev server (`server.ts`).
- **Database**: Supabase PostgreSQL (`@supabase/supabase-js`).
- **Authentication**: **Supabase Auth** (`@supabase/supabase-js` Google OAuth & Session token). Note: Firebase Auth is *not* used in the project; auth is handled entirely by Supabase Auth.
- **AI Assistant**: Google GenAI Gemini 2.5 Flash (`@google/genai` via server-side endpoints).
- **Timezone**: Pakistan Standard Time (PKT, UTC+5).
- **Styling System**: Tailwind CSS v4 (`@tailwindcss/vite`), Lucide React icons, Plus Jakarta Sans / Inter typography.
- **Version Source**: Hardcoded `v2.4` in `src/components/admin/AdminShell.tsx:245`. We consolidate this into a shared constant `src/utils/version.ts` as `APP_VERSION = 'v2.5'` and update both AdminShell and StudentShell to read from it.

---

## Route & Component File Mapping (Student Portal)

| Route | Router Entry (`src/app/router.tsx`) | Component File Rendered | Status |
| :--- | :--- | :--- | :--- |
| **Student Layout** | Used by all student pages | `src/components/student/StudentShell.tsx` | In Progress |
| `/student` (Dashboard) | `<Route path="/student" element={<StudentDashboardPage />} />` | `src/pages/student/StudentDashboardPage.tsx` | Pending |
| `/student/schedule` | `<Route path="/student/schedule" element={<SchedulePage />} />` | `src/pages/student/SchedulePage.tsx` | Pending |
| `/student/attendance` | `<Route path="/student/attendance" element={<AttendancePage />} />` | `src/pages/student/AttendancePage.tsx` | Pending |
| `/student/notes` | `<Route path="/student/notes" element={<NotesPage />} />` | `src/pages/student/NotesPage.tsx` | Pending |
| `/student/tests` | `<Route path="/student/tests" element={<StudentTestsPage />} />` | `src/pages/student/TestsPage.tsx` | Pending |
| `/student/self-testing` | `<Route path="/student/self-testing" element={<StudentSelfTestingPage />} />` | `src/pages/student/SelfTestingPage.tsx` (renders `src/components/tests/SelfTestingView.tsx`) | Pending |
| `/student/chat` | `<Route path="/student/chat" element={<StudentChatPage />} />` | `src/pages/student/StudentChatPage.tsx` (renders `src/components/chat/ChatView.tsx`) | Pending |
| `/student/announcements` | `<Route path="/student/announcements" element={<StudentAnnouncementsPage />} />` | `src/pages/student/StudentAnnouncementsPage.tsx` | Pending |
| `/student/sage` | `<Route path="/student/sage" element={<StudentSagePage />} />` | `src/pages/student/StudentSagePage.tsx` (renders `src/components/sage/SageChatView.tsx`) | Pending |
| `/student/checkout` | `<Route path="/student/checkout" element={<StudentCheckoutPage />} />` | `src/pages/student/StudentCheckoutPage.tsx` | Pending |

---

## Checklist of Tasks

- [x] **Step 0: Discovery & Shared Version Constant**
  - Created `src/utils/version.ts` with `APP_VERSION = 'v2.5'`.
  - Updated `src/components/admin/AdminShell.tsx` to import and render `APP_VERSION`.
- [x] **Phase 0: Shared Student Foundation**
  - `src/components/student/shared/StudentPageHeader.tsx` (title, "UI v2" tag, description, action slot).
  - `src/components/student/shared/StudentStatusBadge.tsx` (multi-status icon + text + color).
  - `src/components/student/shared/StudentClassCard.tsx` (unified class card for Dashboard & Schedule, single active/waiting/mark button).
  - `src/components/student/shared/StudentEmptyState.tsx` (friendly empty state with next action).
  - `src/components/student/shared/StudentBottomSheet.tsx` (accessible bottom sheet for mobile/tablet).
  - `src/components/student/shared/StudentSkeleton.tsx` (accessible skeleton loaders).
  - `src/components/student/shared/StudentErrorState.tsx` (friendly error state with retry).
  - `src/utils/studentFormatting.ts` (PKT 12h formatting, consistent date "Oct 14, 2026", proper name capitalization).
  - `src/components/common/UpdatePrompt.tsx` (slim non-intrusive reload banner that never covers content or triggers during tests).
  - `src/components/student/StudentShell.tsx` (full-height drawer, "Student Portal" pill, v2.5 badge, grouped navigation, user card, Quick Start walkthrough, icon rail on tablet, collapsible sidebar on desktop, 44px+ touch targets).
  - `src/components/student/QuickStartModal.tsx` (5-step swipeable walkthrough matching real button labels).
- [ ] **Phase 1: Student Pages Redesign**
  - [x] **1. Dashboard (`/student`)**
    - File: `src/pages/student/StudentDashboardPage.tsx`
    - Proper capitalization greeting, 1 compact stat row, Next Class hero, remaining classes (no duplicate), collapsed focus timer, notes only if available, compact attendance summary, 1 primary button per class card, shared attendance calculations, friendly zero states, real teacher names.
  - [x] **2. Weekly Schedule (`/student/schedule`)**
    - File: `src/pages/student/SchedulePage.tsx`
    - Single-row swipeable day strip (Mon-Sun), today highlighted, dot indicators for class days, "Today" shortcut, reuse unified `StudentClassCard`, friendly empty-day state.
  - [x] **3. My Attendance (`/student/attendance`)**
    - File: `src/pages/student/AttendancePage.tsx`, `src/components/student/AttendanceCalendar.tsx`
    - Compact summary ring/bar, neutral zero state colors, tapping calendar day opens bottom sheet with sessions, session log stacked rows, subject filter chips with counts, updated policy note with real button names.
  - [x] **4. Notes Library (`/student/notes`)**
    - File: `src/pages/student/NotesPage.tsx`, `src/components/student/NoteCard.tsx`
    - Friendly empty state with shortcuts, single scrollable subject chips row with counts, grey out 0-note subjects, modern card view with uploader and chapter info, preview & download.
  - [x] **5. Testing Center (`/student/tests`)**
    - Files: `src/pages/student/TestsPage.tsx`, `src/components/student/StudentTestCard.tsx`, `src/components/student/StudentSubmissionPanel.tsx`
    - Search + Filters bottom sheet, removable active chips, status tabs with counts, title case display, overdue indicator only if unsubmitted, full-screen detail view on mobile / side-by-side on desktop, late submission flag.
  - [ ] **6. Self Testing (`/student/self-testing`)**
    - Files: `src/pages/student/SelfTestingPage.tsx`, `src/components/tests/SelfTestingView.tsx`
    - Compact 2-line intro with realistic disclaimer, 1-line locked scope row, single horizontal scrollable subject chips, suggestion chips wrapping naturally, segmented question count, sticky bottom bar with quiz summary and start action.
  - [ ] **7. Chat (`/student/chat`)**
    - Files: `src/pages/student/StudentChatPage.tsx`, `src/components/chat/ChatView.tsx`
    - Remove redundant dark banner, slim header, sort by latest message, group empty chats under "Start a conversation", short role labels, 44px touch targets.
  - [ ] **8. Announcements (`/student/announcements`)**
    - File: `src/pages/student/StudentAnnouncementsPage.tsx`
    - Clean list with read/unread indicators, date formatting, modal/drawer detail view, responsive layout.
  - [ ] **9. Sage AI (`/student/sage`)**
    - Files: `src/pages/student/StudentSagePage.tsx`, `src/components/sage/SageChatView.tsx`
    - Student-optimized view, slim header, status indicator, 4 suggestion cards, error state with retry, mobile-friendly input.
  - [ ] **10. Tuition Dues & Checkout (`/student/checkout`)**
    - File: `src/pages/student/StudentCheckoutPage.tsx`
    - Fix duplicate "Grade Grade 10", verified receipt card when paid, collapsed payment details, 1 card per payment account with copy button, clean deduplicated audit trail.
- [ ] **DATA CHECKS Investigation**
  - Verify and document all 7 DATA CHECKS items.
- [ ] **Final Build & Lint Verification**
  - `npm run lint` and `npm run build` passing.
