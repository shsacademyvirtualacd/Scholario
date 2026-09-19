import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { recordPageContext, resolvePageContext } from '../../lib/pageContext';

export const PageContextTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Automatically capture and record page-aware context on route transition
    const context = resolvePageContext(location.pathname, location.search);
    recordPageContext(context);
  }, [location.pathname, location.search]);

  return null;
};
