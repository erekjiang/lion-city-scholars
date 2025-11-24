import {
    collection,
    query,
    where,
    getDocs,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Subject } from '../types';

// Check how many games a user has played for a specific subject today
export const getGamesPlayedToday = async (
    userId: string,
    subject: Subject
): Promise<number> => {
    try {
        // Get today's start and end timestamps
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = Timestamp.fromDate(today);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const todayEnd = Timestamp.fromDate(tomorrow);

        // Query games played today for this subject
        const q = query(
            collection(db, 'gameResults'),
            where('userId', '==', userId),
            where('subject', '==', subject),
            where('timestamp', '>=', todayStart),
            where('timestamp', '<', todayEnd)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
    } catch (error) {
        console.error('Error getting games played today:', error);
        return 0;
    }
};
