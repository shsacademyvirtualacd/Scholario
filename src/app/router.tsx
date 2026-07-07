import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthContext';
import ProtectedRoute from '../components/app/ProtectedRoute';
import { useAuth } from '../features/auth/AuthContext';

// ─── Public pages (eager loaded — small) ────
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import ForgotPasswordPage from '../pages/public/ForgotPasswordPage';
import UnregisteredPage from '../pages/public/UnregisteredPage';

// ─── Marketing page (eager — entry point) ───
import LandingShell from '../pages/public/LandingShell';

// ─── Dashboards (lazy) ──────────────────────
const StudentDashboardPage = lazy(() => import('../pages/student/StudentDashboardPage'));
const AdminDashboardPage   = lazy(() => import('../pages/admin/AdminDashboardPage'));

// ─── Teacher Portal (lazy) ──────────────────
const TeacherDashboardPage = lazy(() => import('../pages/teacher/TeacherDashboardPage'));
const TeacherNotesPage = lazy(() => import('../pages/teacher/TeacherNotesPage'));
const TeacherSchedulePage = lazy(() => import('../pages/teacher/TeacherSchedulePage'));
const TeacherAnnouncementsPage = lazy(() => import('../pages/teacher/TeacherAnnouncementsPage'));
const TeacherProfilePage = lazy(() => import('../pages/teacher/ProfilePage'));

// ─── Fee Pages (lazy) ───────────────────────
const StudentCheckoutPage = lazy(() => import('../pages/student/StudentCheckoutPage'));
const AdminFeesPage = lazy(() => import('../pages/admin/AdminFeesPage'));

// ─── Student sub-pages (lazy) ────────────────
const NotesPage      = lazy(() => import('../pages/student/NotesPage'));
const SchedulePage   = lazy(() => import('../pages/student/SchedulePage'));
// const AttendancePage = lazy(() => import('../pages/student/AttendancePage'));
const ProfilePage    = lazy(() => import('../pages/student/ProfilePage'));
const StudentAnnouncementsPage = lazy(() => import('../pages/student/StudentAnnouncementsPage'));

// ─── Admin sub-pages (lazy) ──────────────────
const ScheduleManagerPage  = lazy(() => import('../pages/admin/ScheduleManagerPage'));
const TeachersPage         = lazy(() => import('../pages/admin/TeachersPage'));
const StudentsAdminPage    = lazy(() => import('../pages/admin/StudentsAdminPage'));
const NotesManagerPage     = lazy(() => import('../pages/admin/NotesManagerPage'));
// const AttendanceAdminPage  = lazy(() => import('../pages/admin/AttendanceAdminPage'));
const AdminAnnouncementsPage = lazy(() => import('../pages/admin/AdminAnnouncementsPage'));
const AdminProfilePage     = lazy(() => import('../pages/admin/ProfilePage'));
const PriceManagerPage     = lazy(() => import('../pages/admin/PriceManagerPage'));
const RosterManagerPage    = lazy(() => import('../pages/admin/RosterManagerPage'));

// ─── Page loader ────────────────────────────
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-[#E5E5E5] border-t-[#F4C430] animate-spin" />
      <span className="text-sm text-[#737373] font-medium">Loading…</span>
    </div>
  </div>
);

// ─── Root redirect based on role ─────────────
const RootRedirect: React.FC = () => {
  const { session, profile, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!session) return <LandingShell />;
  if (!profile) return <Navigate to="/unregistered" replace />;
  if (profile.role === 'admin') return <Navigate to="/admin" replace />;
  if (profile.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
};

// ─── Router ──────────────────────────────────
const AppRouter: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
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
            path="/student/notes"
            element={<ProtectedRoute requiredRole="student"><NotesPage /></ProtectedRoute>}
          />
          <Route
            path="/student/schedule"
            element={<ProtectedRoute requiredRole="student"><SchedulePage /></ProtectedRoute>}
          />
          {/*
          <Route
            path="/student/attendance"
            element={<ProtectedRoute requiredRole="student"><AttendancePage /></ProtectedRoute>}
          />
          */}
          <Route
            path="/student/profile"
            element={<ProtectedRoute requiredRole="student"><ProfilePage /></ProtectedRoute>}
          />
          <Route
            path="/student/announcements"
            element={<ProtectedRoute requiredRole="student"><StudentAnnouncementsPage /></ProtectedRoute>}
          />
          <Route
            path="/student/checkout"
            element={<ProtectedRoute requiredRole="student"><StudentCheckoutPage /></ProtectedRoute>}
          />

          {/* Admin Panel */}
          <Route
            path="/admin"
            element={<ProtectedRoute requiredRole="admin"><AdminDashboardPage /></ProtectedRoute>}
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
          {/*
          <Route
            path="/admin/attendance/:classId"
            element={<ProtectedRoute requiredRole="admin"><AttendanceAdminPage /></ProtectedRoute>}
          />
          */}
          <Route
            path="/admin/announcements"
            element={<ProtectedRoute requiredRole="admin"><AdminAnnouncementsPage /></ProtectedRoute>}
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
            path="/teacher/notes"
            element={<ProtectedRoute requiredRole="teacher"><TeacherNotesPage /></ProtectedRoute>}
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
            path="/teacher/profile"
            element={<ProtectedRoute requiredRole="teacher"><TeacherProfilePage /></ProtectedRoute>}
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  </BrowserRouter>
);

export default AppRouter;
