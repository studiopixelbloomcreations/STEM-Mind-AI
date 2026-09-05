import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const getFirebaseConfig = () => {
  const jsonStr = import.meta.env.VITE_FIREBASE_WEBAPP_CONFIG;
  if (!jsonStr) {
    console.warn('VITE_FIREBASE_WEBAPP_CONFIG environment variable is not defined.');
    return {};
  }
  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to parse VITE_FIREBASE_WEBAPP_CONFIG JSON:', err);
    return {};
  }
};

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Google Sign-In helper
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

// Sign-Out helper
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-Out Error:', error);
    throw error;
  }
};

export default app;
