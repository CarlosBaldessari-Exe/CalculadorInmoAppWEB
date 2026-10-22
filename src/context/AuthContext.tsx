import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { UserProfile } from '../types';
import { getUserProfile, saveUserProfile, seedSampleData } from '../services/firestoreService';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updatePersonalSplit: (newSplit: number) => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'marianobaldessari14@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          let profile = await getUserProfile(currentUser.uid);
          const isUserAdmin = currentUser.email === ADMIN_EMAIL;

          if (!profile) {
            // Create initial user profile in Firestore
            profile = {
              uid: currentUser.uid,
              nombre: currentUser.displayName || (currentUser.email?.split('@')[0] ?? 'Mariano'),
              email: currentUser.email || '',
              porcentajeComisionPersonal: 0.45, // 45% standard Mariano commission
              rol: isUserAdmin ? 'administrador' : 'asesor',
              fotoUrl: currentUser.photoURL || undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await saveUserProfile(profile);
          } else if (isUserAdmin && profile.rol !== 'administrador') {
            profile.rol = 'administrador';
            await saveUserProfile(profile);
          }

          setUserProfile(profile);

          // Seed sample Uruguayan real estate properties if portfolio is empty
          await seedSampleData(currentUser.uid, profile.nombre);
        } catch (err) {
          console.error('Error fetching/saving user profile:', err);
          // Fallback in-memory profile
          setUserProfile({
            uid: currentUser.uid,
            nombre: currentUser.displayName || 'Mariano Baldessari',
            email: currentUser.email || ADMIN_EMAIL,
            porcentajeComisionPersonal: 0.45,
            rol: currentUser.email === ADMIN_EMAIL ? 'administrador' : 'asesor',
          });
        }
      } else {
        // Default guest / advisor profile so user can test calculations immediately
        setUserProfile({
          uid: 'demo_mariano_asesor',
          nombre: 'Mariano Baldessari (Asesor)',
          email: ADMIN_EMAIL,
          porcentajeComisionPersonal: 0.45,
          rol: 'asesor',
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Sign Out Error:', error);
    }
  };

  const updatePersonalSplit = async (newSplit: number) => {
    if (!userProfile) return;
    const updated = {
      ...userProfile,
      porcentajeComisionPersonal: newSplit,
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(updated);
    if (user) {
      await saveUserProfile(updated);
    }
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated: UserProfile = {
      ...userProfile,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(updated);
    if (user) {
      await saveUserProfile(updated);
    }
  };

  const isAdmin = userProfile?.rol === 'administrador' || user?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAdmin,
        signInWithGoogle,
        signOut,
        updatePersonalSplit,
        updateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
