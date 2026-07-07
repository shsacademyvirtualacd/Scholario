import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import type { Role } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-[#E5E5E5] border-t-[#F4C430] animate-spin"
          />
          <span className="text-sm text-[#737373] font-medium">Loading…</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile) {
    return <Navigate to="/unregistered" replace />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    // Redirect to their correct dashboard
    const destination = 
      profile?.role === 'admin' 
        ? '/admin' 
        : profile?.role === 'teacher'
          ? '/teacher'
          : '/student';
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
