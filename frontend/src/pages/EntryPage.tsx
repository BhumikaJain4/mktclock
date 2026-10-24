import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/LoadingState';

interface EntryPageProps {
  navigate: (route: string) => void;
}

export const EntryPage: React.FC<EntryPageProps> = ({ navigate }) => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        navigate('/timer');
      } else {
        navigate('/login');
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  return <LoadingState message="Verifying university library session..." />;
};
