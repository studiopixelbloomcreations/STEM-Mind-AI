import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useTeacherAuth } from '../../../lib/context/TeacherAuthContext';
import { Skeleton } from '../../../components/ui/Skeleton';

export const TeacherGuard: React.FC = () => {
  const { teacher, loading } = useTeacherAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[var(--color-bg-base)] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center gap-3 justify-center mb-6">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-primary)] animate-pulse" />
            <span className="text-lg font-display font-bold text-white">NexLearn Control Room</span>
          </div>
          <Skeleton height={40} className="w-full" />
          <Skeleton height={120} className="w-full" />
          <Skeleton height={40} className="w-3/4 mx-auto" />
        </div>
      </div>
    );
  }

  if (!teacher) {
    return <Navigate to="/teacher" replace />;
  }

  return <Outlet />;
};
