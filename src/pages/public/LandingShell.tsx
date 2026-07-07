import React from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import HomePage from '../HomePage';
import { useNavigate } from 'react-router-dom';

/**
 * Wraps the existing marketing HomePage with real navigation via React Router.
 * The old onNavigate(page) pattern is replaced with navigate('/route').
 */
const LandingShell: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (page: string) => {
    if (page === 'student') navigate('/student');
    else if (page === 'admin') navigate('/admin');
    else if (page === 'login') navigate('/login');
    else if (page === 'register') navigate('/register');
    // 'home' = stay on /
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar onNavigate={handleNavigate} />
      <HomePage onNavigate={handleNavigate} />
      <Footer onNavigate={handleNavigate} />
    </div>
  );
};

export default LandingShell;
