import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { FileQuestion } from 'lucide-react';
import Logo from '../../components/ui/Logo';

const NotFoundPage: React.FC = () => {
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  const handleReturn = () => {
    if (!session) {
      navigate('/login', { replace: true });
      return;
    }

    if (profile) {
      if (profile.role === 'admin') navigate('/admin', { replace: true });
      else if (profile.role === 'teacher') navigate('/teacher', { replace: true });
      else navigate('/student', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center p-6">
      <div className="absolute top-8 left-8">
        <Logo size="md" variant="full" />
      </div>

      <div className="w-full max-w-md bg-white border border-[#E5E5E5] rounded-xl p-10 shadow-sm text-center">
        <div className="w-16 h-16 rounded-full bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center mx-auto mb-6">
          <FileQuestion size={32} className="text-[#A3A3A3]" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-[#111111] tracking-tight mb-3">
          404 - Page Not Found
        </h1>
        <p className="text-base text-[#737373] mb-10 leading-relaxed">
          We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in the first place.
        </p>

        <button
          onClick={handleReturn}
          className="w-full py-3.5 px-4 bg-[#111111] hover:bg-[#262626] text-white rounded-xl font-semibold text-sm transition-colors active:scale-[0.98]"
        >
          {session ? 'Return to Dashboard' : 'Back to Login'}
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
