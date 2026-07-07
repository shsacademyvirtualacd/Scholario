import React from 'react';
import { ShieldAlert, LogOut, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import Logo from '../../components/ui/Logo';

export const UnregisteredPage: React.FC = () => {
  const { signOut, user, profile } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (profile) {
      if (profile.role === 'admin') navigate('/admin', { replace: true });
      else if (profile.role === 'teacher') navigate('/teacher', { replace: true });
      else navigate('/student', { replace: true });
    }
  }, [profile, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center px-6 py-12">
      <div className="w-full max-w-[420px] text-center">
        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <Logo size="md" variant="full" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 shadow-sm space-y-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldAlert size={32} />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-[#111111] tracking-tight">
              Access Restricted
            </h1>
            <p className="text-sm text-[#737373] leading-relaxed">
              The email <span className="font-bold text-[#111111]">{user?.email || 'your email'}</span> is not registered in the institution's roster.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/50 text-left">
            <h2 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <MessageSquare size={13} />
              What should I do?
            </h2>
            <p className="text-xs text-amber-900 leading-relaxed">
              Access to Scholario is restricted to pre-provisioned institutional members. Please contact your administrator or academic coordinator to add your email to the roster before attempting to log in.
            </p>
          </div>

          <div className="pt-2 border-t border-[#F5F5F5] flex flex-col gap-2">
            <button
              onClick={handleSignOut}
              className="btn btn-gold w-full flex items-center justify-center gap-2 py-2.5 font-bold"
            >
              <LogOut size={16} />
              Sign Out & Try Again
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-[#A3A3A3] mt-8">
          Scholario LMS Security System. All unauthorized access attempts are logged.
        </p>
      </div>
    </div>
  );
};

export default UnregisteredPage;
