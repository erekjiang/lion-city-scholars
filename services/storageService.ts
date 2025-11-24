
import { User, Subject, Grade } from '../types';
import { UserProfile } from './firestoreService';

const STORAGE_KEY = 'lion_city_scholars_guest';
const GUEST_ID = 'guest_user';

// Helper to get today's date string YYYY-MM-DD
export const getTodayString = () => new Date().toISOString().split('T')[0];

export const storageService = {
  // Get user profile (simulating Firestore)
  getUserProfile: async (uid: string): Promise<UserProfile | null> => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const user = JSON.parse(data);
    // Convert to UserProfile format if needed, or just return compatible object
    // Since we store User object locally, we might need to map it or just store UserProfile structure
    // For simplicity, let's store UserProfile structure in localStorage
    return user as UserProfile;
  },

  // Update user profile
  updateUserProfile: async (uid: string, data: Partial<UserProfile>): Promise<void> => {
    const currentData = localStorage.getItem(STORAGE_KEY);
    let user: UserProfile;

    if (currentData) {
      user = { ...JSON.parse(currentData), ...data };
    } else {
      // Create new guest profile
      user = {
        uid: GUEST_ID,
        name: 'Guest Scholar',
        grade: 'Primary 3', // Default
        email: '',
        totalPoints: 0,
        gamesPlayed: 0,
        completedDates: [],
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        lastActive: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        ...data
      } as UserProfile;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  },

  // Save game result
  saveGameResult: async (
    userId: string,
    subject: Subject,
    grade: Grade,
    score: number,
    totalQuestions: number
  ): Promise<void> => {
    const currentData = localStorage.getItem(STORAGE_KEY);
    if (!currentData) return;

    const user: UserProfile = JSON.parse(currentData);
    const today = getTodayString();

    // Update stats
    user.totalPoints += score;
    user.gamesPlayed += 1;
    user.lastActive = { seconds: Date.now() / 1000, nanoseconds: 0 } as any;

    if (!user.completedDates.includes(today)) {
      user.completedDates.push(today);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
};
