import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthContext';
import ProtectedRoute from '../components/app/ProtectedRoute';
import { useAuth } from '../features/auth/AuthContext';

// ─── Public pages (eager loaded — small) ────
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import ForgotPasswordPage from '../pages/public/ForgotPasswordPage';

// ─── Marketing page (eager — entry point) ───
import LandingShell from '../pages/public/LandingShell';

// ─── Dashboards (lazy) ──────────────────────
const StudentDashboardPage = lazy(() => import('../pages/student/StudentDashboardPage'));
const AdminDashboardPage   = lazy(() => import('../pages/admin/AdminDashboardPage'));

// ─── Student sub-pages (lazy) ────────────────
const NotesPage      = lazy(() => import('../pages/student/NotesPage'));
const SchedulePage   = lazy(() => import('../pages/student/SchedulePage'));
const AttendancePage = lazy(() => import('../pages/student/AttendancePage'));
const ProfilePage    = lazy(() => import('../pages/student/ProfilePage'));

// ─── Admin sub-pages (lazy) ──────────────────
const ScheduleManagerPage  = lazy(() => import('../pages/admin/ScheduleManagerPage'));
const TeachersPage         = lazy(() => import('../pages/admin/TeachersPage'));
const StudentsAdminPage    = lazy(() => import('../pages/admin/StudentsAdminPage'));
const NotesManagerPage     = lazy(() => import('../pages/admin/NotesManagerPage'));
const AttendanceAdminPage  = lazy(() => import('../pages/admin/AttendanceAdminPage'));

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
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
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
          <Route
            path="/student/attendance"
            element={<ProtectedRoute requiredRole="student"><AttendancePage /></ProtectedRoute>}
          />
          <Route
            path="/student/profile"
            element={<ProtectedRoute requiredRole="student"><ProfilePage /></ProtectedRoute>}
          />

          {/* Admin Panel */}
          <Route
            path="/admin"
            element={<ProtectedRoute requiredRole="admin"><AdminDashboardPage /></ProtectedRoute>}
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
            path="/admin/attendance/:classId"
            element={<ProtectedRoute requiredRole="admin"><AttendanceAdminPage /></ProtectedRoute>}
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  </BrowserRouter>
);

export default AppRouter;
