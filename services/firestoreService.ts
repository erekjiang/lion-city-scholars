import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    getDocs,
    where,
    Timestamp,
    increment
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Subject, Grade } from '../types';

export interface UserProfile {
    uid: string;
    name: string;
    grade: Grade;
    email: string;
    photoURL?: string;
    totalPoints: number;
    gamesPlayed: number;
    createdAt: Timestamp;
    lastActive: Timestamp;
}

export interface GameResult {
    userId: string;
    subject: Subject;
    grade: Grade;
    score: number;
    totalQuestions: number;
    timestamp: Timestamp;
}

export interface LeaderboardEntry {
    uid: string;
    name: string;
    grade: Grade;
    totalPoints: number;
    photoURL?: string;
}

// Get user profile from Firestore
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as UserProfile;
        }
        return null;
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
    }
};

// Create or update user profile
export const updateUserProfile = async (
    uid: string,
    data: Partial<UserProfile>
): Promise<void> => {
    try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // Update existing
            await updateDoc(docRef, {
                ...data,
                lastActive: Timestamp.now()
            });
        } else {
            // Create new
            await setDoc(docRef, {
                uid,
                totalPoints: 0,
                gamesPlayed: 0,
                createdAt: Timestamp.now(),
                lastActive: Timestamp.now(),
                ...data
            });
        }
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
};

// Save game result and update user stats
export const saveGameResult = async (
    userId: string,
    subject: Subject,
    grade: Grade,
    score: number,
    totalQuestions: number
): Promise<void> => {
    try {
        // Save game result
        await addDoc(collection(db, 'gameResults'), {
            userId,
            subject,
            grade,
            score,
            totalQuestions,
            timestamp: Timestamp.now()
        });

        // Update user stats
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            totalPoints: increment(score),
            gamesPlayed: increment(1),
            lastActive: Timestamp.now()
        });
    } catch (error) {
        console.error('Error saving game result:', error);
        throw error;
    }
};

// Get leaderboard (top users by points)
export const getLeaderboard = async (limitCount: number = 10): Promise<LeaderboardEntry[]> => {
    try {
        const q = query(
            collection(db, 'users'),
            orderBy('totalPoints', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        const leaderboard: LeaderboardEntry[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data() as UserProfile;
            leaderboard.push({
                uid: data.uid,
                name: data.name,
                grade: data.grade,
                totalPoints: data.totalPoints,
                photoURL: data.photoURL
            });
        });

        return leaderboard;
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        throw error;
    }
};

// Get user's game history
export const getUserProgress = async (userId: string): Promise<GameResult[]> => {
    try {
        const q = query(
            collection(db, 'gameResults'),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(20)
        );

        const querySnapshot = await getDocs(q);
        const results: GameResult[] = [];

        querySnapshot.forEach((doc) => {
            results.push(doc.data() as GameResult);
        });

        return results;
    } catch (error) {
        console.error('Error getting user progress:', error);
        throw error;
    }
};
