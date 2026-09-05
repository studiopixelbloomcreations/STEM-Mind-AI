import { auth, loginWithGoogle, logoutUser } from '../../config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export { auth, loginWithGoogle, logoutUser };

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}
