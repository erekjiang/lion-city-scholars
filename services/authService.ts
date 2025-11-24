
import {
    signInWithPopup,
    signInWithRedirect,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    User,
    getRedirectResult
} from 'firebase/auth';
import { auth } from './firebase';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<User | void> => {
    try {
        // Check for mobile device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            await signInWithRedirect(auth, googleProvider);
            // The page will redirect, so we don't return anything
            return;
        }

        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error: any) {
        // Fallback to redirect if popup fails (e.g. popup blocked)
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
            console.warn('Popup blocked or closed, falling back to redirect');
            await signInWithRedirect(auth, googleProvider);
            return;
        }

        console.error('Error signing in with Google:', error);
        throw error;
    }
};

export const checkRedirectResult = async () => {
    try {
        const result = await getRedirectResult(auth);
        return result?.user;
    } catch (error: any) {
        console.error('Redirect result error:', error);
        // Alert the error so the user can see it on mobile
        alert(`Authentication Error: ${error.message} `);
        throw error;
    }
};

export const signOut = async (): Promise<void> => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
};

export const onAuthStateChanged = (callback: (user: User | null) => void) => {
    return firebaseOnAuthStateChanged(auth, callback);
};
