import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '../features/auth/AuthContext';
import ProtectedRoute from '../components/app/ProtectedRoute';
import { useAuth } from '../features/auth/AuthContext';
import OnboardingPage from '../pages/student/OnboardingPage';
import RegisterPage from '../pages/public/RegisterPage';
import { TopLoadingBar } from '../components/common/TopLoadingBar';
import { incrementSuspense, decrementSuspense } from '../utils/requestTracker';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { LiveSessionNotificationListener } from '../components/common/LiveSessionNotificationListener';
import { TeacherLiveReminderListener } from '../components/teacher/TeacherLiveReminderListener';
import { AdminLiveNotificationListener } from '../components/admin/AdminLiveNotificationListener';

// ─── Public pages (eager loaded — small) ────
import LoginPage from '../pages/public/LoginPage';
import ForgotPasswordPage from '../pages/public/ForgotPasswordPage';
import UnregisteredPage from '../pages/public/UnregisteredPage';
import NotFoundPage from '../pages/public/NotFoundPage';

// ─── Marketing page (eager — entry point) ───
import LandingShell from '../pages/public/LandingShell';

// ─── Dashboards (lazy) ──────────────────────
const StudentDashboardPage = lazy(() => import('../pages/student/StudentDashboardPage'));
const AdminDashboardPage   = lazy(() => import('../pages/admin/AdminDashboardPage'));

// ─── Student sub-pages (lazy) ────────────────
const NotesPage      = lazy(() => import('../pages/student/NotesPage'));
const StudentTestsPage = lazy(() => import('../pages/student/TestsPage'));
const SchedulePage   = lazy(() => import('../pages/student/SchedulePage'));
const AttendancePage = lazy(() => import('../pages/student/AttendancePage'));
const ProfilePage    = lazy(() => import('../pages/student/ProfilePage'));
const StudentAnnouncementsPage = lazy(() => import('../pages/student/StudentAnnouncementsPage'));
const StudentChatPage = lazy(() => import('../pages/student/StudentChatPage'));

// ─── Teacher Portal (lazy) ──────────────────
const TeacherDashboardPage = lazy(() => import('../pages/teacher/TeacherDashboardPage'));
const TeacherAttendancePage = lazy(() => import('../pages/teacher/TeacherAttendancePage'));
const TeacherNotesPage = lazy(() => import('../pages/teacher/TeacherNotesPage'));
const TeacherTestsPage = lazy(() => import('../pages/teacher/TeacherTestsPage'));
const TeacherSchedulePage = lazy(() => import('../pages/teacher/TeacherSchedulePage'));
const TeacherAnnouncementsPage = lazy(() => import('../pages/teacher/TeacherAnnouncementsPage'));
const TeacherProfilePage = lazy(() => import('../pages/teacher/ProfilePage'));

// ─── Fee Pages (lazy) ───────────────────────
const StudentCheckoutPage = lazy(() => import('../pages/student/StudentCheckoutPage'));
const AdminFeesPage = lazy(() => import('../pages/admin/AdminFeesPage'));

// ─── Sage AI Pages (lazy) ───────────────────
const StudentSagePage = lazy(() => import('../pages/student/StudentSagePage'));
const TeacherSagePage = lazy(() => import('../pages/teacher/TeacherSagePage'));
const AdminSagePage   = lazy(() => import('../pages/admin/AdminSagePage'));

// ─── Admin sub-pages (lazy) ──────────────────
const ScheduleManagerPage  = lazy(() => import('../pages/admin/ScheduleManagerPage'));
const TeachersPage         = lazy(() => import('../pages/admin/TeachersPage'));
const StudentsAdminPage    = lazy(() => import('../pages/admin/StudentsAdminPage'));
const NotesManagerPage     = lazy(() => import('../pages/admin/NotesManagerPage'));
const AdminTestsPage       = lazy(() => import('../pages/admin/AdminTestsPage'));
const AttendanceAdminPage  = lazy(() => import('../pages/admin/AttendanceAdminPage'));
const AdminAnnouncementsPage = lazy(() => import('../pages/admin/AdminAnnouncementsPage'));
const AdminProfilePage     = lazy(() => import('../pages/admin/ProfilePage'));
const PriceManagerPage     = lazy(() => import('../pages/admin/PriceManagerPage'));
const RosterManagerPage    = lazy(() => import('../pages/admin/RosterManagerPage'));
const AdminChatPage        = lazy(() => import('../pages/admin/AdminChatPage'));

// ─── Page loader ────────────────────────────
const PageLoader: React.FC = () => {
  useEffect(() => {
    incrementSuspense();
    return () => decrementSuspense();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#E5E5E5] border-t-[#F4C430] animate-spin" />
        <span className="text-sm text-[#737373] font-medium">Loading…</span>
      </div>
    </div>
  );
};

// ─── Root redirect ──────────────────────────────────────────────────────────
// Logic:
//   rosterRejected  → /unregistered (user tried to log in but isn't on roster)
//   no session      → landing page  (normal public visitor)
//   session+profile+needsOnboarding → /student/onboarding (first-time student)
//   session+profile → role dashboard
//   session+no profile → /unregistered (safe fallback — roster check failed)
const RootRedirect: React.FC = () => {
  const { session, profile, loading, rosterRejected, needsOnboarding } = useAuth();

  if (loading) return <PageLoader />;
  if (rosterRejected) return <Navigate to="/unregistered" replace />;
  if (!session) return <LandingShell />;
  if (!profile) return <Navigate to="/unregistered" replace />;
  if (profile.role === 'admin') return <Navigate to="/admin" replace />;
  if (profile.role === 'teacher') return <Navigate to="/teacher" replace />;
  // Student: check onboarding before going to dashboard
  if (needsOnboarding) return <Navigate to="/student/onboarding" replace />;
  return <Navigate to="/student" replace />;
};

// ─── Router ──────────────────────────────────
const AppRouter: React.FC = () => (
  <BrowserRouter>
    <OfflineBanner />
    <TopLoadingBar />
    <Toaster position="top-right" richColors closeButton />
    <AuthProvider>
      <LiveSessionNotificationListener />
      <TeacherLiveReminderListener />
      <AdminLiveNotificationListener />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/unregistered" element={<UnregisteredPage />} />

          {/* Student Portal */}
          <Route
            path="/student"
            element={<ProtectedRoute requiredRole="student"><StudentDashboardPage /></ProtectedRoute>}
          />
          <Route
            path="/student/chat"
            element={<ProtectedRoute requiredRole="student"><StudentChatPage /></ProtectedRoute>}
          />
          <Route
            path="/student/notes"
            element={<ProtectedRoute requiredRole="student"><NotesPage /></ProtectedRoute>}
          />
          <Route
            path="/student/tests"
            element={<ProtectedRoute requiredRole="student"><StudentTestsPage /></ProtectedRoute>}
          />
          <Route
            path="/student/schedule"
            element={<ProtectedRoute requiredRole="student"><SchedulePage /></ProtectedRoute>}
          />
          <Route
            path="/student/attendance"
            element={<ProtectedRoute requiredRole="student"><AttendancePage /></ProtectedRoute>}
          />
          <Route
            path="/student/profile"
            element={<ProtectedRoute requiredRole="student"><ProfilePage /></ProtectedRoute>}
          />
          <Route
            path="/student/announcements"
            element={<ProtectedRoute requiredRole="student"><StudentAnnouncementsPage /></ProtectedRoute>}
          />
          <Route
            path="/student/sage"
            element={<ProtectedRoute requiredRole="student"><StudentSagePage /></ProtectedRoute>}
          />
          <Route
            path="/student/checkout"
            element={<ProtectedRoute requiredRole="student"><StudentCheckoutPage /></ProtectedRoute>}
          />
          <Route
            path="/student/onboarding"
            element={<ProtectedRoute requiredRole="student"><OnboardingPage /></ProtectedRoute>}
          />

          {/* Admin Panel */}
          <Route
            path="/admin"
            element={<ProtectedRoute requiredRole="admin"><AdminDashboardPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/chat"
            element={<ProtectedRoute requiredRole="admin"><AdminChatPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/roster"
            element={<ProtectedRoute requiredRole="admin"><RosterManagerPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/schedule"
            element={<ProtectedRoute requiredRole="admin"><ScheduleManagerPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/teachers"
            element={<ProtectedRoute requiredRole="admin"><TeachersPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/students"
            element={<ProtectedRoute requiredRole="admin"><StudentsAdminPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/notes"
            element={<ProtectedRoute requiredRole="admin"><NotesManagerPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/tests"
            element={<ProtectedRoute requiredRole="admin"><AdminTestsPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/attendance"
            element={<ProtectedRoute requiredRole="admin"><AttendanceAdminPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/attendance/:classId"
            element={<ProtectedRoute requiredRole="admin"><AttendanceAdminPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/announcements"
            element={<ProtectedRoute requiredRole="admin"><AdminAnnouncementsPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/sage"
            element={<ProtectedRoute requiredRole="admin"><AdminSagePage /></ProtectedRoute>}
          />
          <Route
            path="/admin/profile"
            element={<ProtectedRoute requiredRole="admin"><AdminProfilePage /></ProtectedRoute>}
          />
          <Route
            path="/admin/prices"
            element={<ProtectedRoute requiredRole="admin"><PriceManagerPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/fees"
            element={<ProtectedRoute requiredRole="admin"><AdminFeesPage /></ProtectedRoute>}
          />

          {/* Teacher Portal */}
          <Route
            path="/teacher"
            element={<ProtectedRoute requiredRole="teacher"><TeacherDashboardPage /></ProtectedRoute>}
          />
          <Route
            path="/teacher/attendance"
            element={<ProtectedRoute requiredRole="teacher"><TeacherAttendancePage /></ProtectedRoute>}
          />
          <Route
            path="/teacher/notes"
            element={<ProtectedRoute requiredRole="teacher"><TeacherNotesPage /></ProtectedRoute>}
          />
          <Route
            path="/teacher/tests"
            element={<ProtectedRoute requiredRole="teacher"><TeacherTestsPage /></ProtectedRoute>}
          />
          <Route
            path="/teacher/schedule"
            element={<ProtectedRoute requiredRole="teacher"><TeacherSchedulePage /></ProtectedRoute>}
          />
          <Route
            path="/teacher/announcements"
            element={<ProtectedRoute requiredRole="teacher"><TeacherAnnouncementsPage /></ProtectedRoute>}
          />
          <Route
            path="/teacher/sage"
            element={<ProtectedRoute requiredRole="teacher"><TeacherSagePage /></ProtectedRoute>}
          />
          <Route
            path="/teacher/profile"
            element={<ProtectedRoute requiredRole="teacher"><TeacherProfilePage /></ProtectedRoute>}
          />

          {/* Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  </BrowserRouter>
);

export default AppRouter;
