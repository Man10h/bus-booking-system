import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role = 'USER' }) => {
  const { isAuthenticated, currentUser } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (currentUser?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
