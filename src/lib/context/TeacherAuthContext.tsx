import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser } from '../../config/firebase';
import { syncTeacherProfile, TeacherProfile } from '../api/database';

interface TeacherAuthContextType {
  teacher: User | null;
  profile: TeacherProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const TeacherAuthContext = createContext<TeacherAuthContextType | undefined>(undefined);

export const TeacherAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [teacher, setTeacher] = useState<User | null>(null);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setTeacher(user);
      if (user) {
        const synced = await syncTeacherProfile({
          id: user.uid,
          email: user.email || '',
          name: user.displayName || user.email?.split('@')[0] || 'Teacher',
          photo_url: user.photoURL || undefined,
        });
        setProfile(synced);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        const synced = await syncTeacherProfile({
          id: user.uid,
          email: user.email || '',
          name: user.displayName || user.email?.split('@')[0] || 'Teacher',
          photo_url: user.photoURL || undefined,
        });
        setTeacher(user);
        setProfile(synced);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setTeacher(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TeacherAuthContext.Provider value={{ teacher, profile, loading, signIn, signOut }}>
      {children}
    </TeacherAuthContext.Provider>
  );
};

export function useTeacherAuth() {
  const context = useContext(TeacherAuthContext);
  if (!context) {
    throw new Error('useTeacherAuth must be used within a TeacherAuthProvider');
  }
  return context;
}
