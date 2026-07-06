import React, { useState, useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import StudentDashboardPage from './pages/StudentDashboardPage';

type Page = 'home' | 'student' | 'admin';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [transitioning, setTransitioning] = useState(false);

  const handleNavigate = (page: string) => {
    if (page === currentPage) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrentPage(page as Page);
      window.scrollTo(0, 0);
      setTransitioning(false);
    }, 150);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      style={{
        opacity: transitioning ? 0 : 1,
        transition: 'opacity 150ms ease',
        minHeight: '100vh',
      }}
    >
      {currentPage === 'admin' ? (
        <DashboardPage onNavigate={handleNavigate} />
      ) : currentPage === 'student' ? (
        <StudentDashboardPage onNavigate={handleNavigate} />
      ) : (
        <div className="min-h-screen bg-white">
          <Navbar onNavigate={handleNavigate} />
          <HomePage onNavigate={handleNavigate} />
          <Footer />
        </div>
      )}
    </div>
  );
};

export default App;
