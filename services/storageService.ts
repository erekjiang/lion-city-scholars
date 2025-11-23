import { User, Grade } from '../types';

const STORAGE_KEY = 'lion_city_scholars_user';

// Helper to get today's date string YYYY-MM-DD
export const getTodayString = () => new Date().toISOString().split('T')[0];

export const storageService = {
  // Simulate fetching user from "cloud"
  getUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },

  // Simulate creating a new user
  createUser: (name: string, grade: Grade, avatar: string): User => {
    const newUser: User = {
      id: 'user_' + Date.now(),
      name,
      grade,
      avatar,
      totalScore: 0,
      streak: 0,
      level: 1,
      friends: [],
      completedDates: []
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  },

  // Update user progress
  updateProgress: (score: number) => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const user: User = JSON.parse(data);
    const today = getTodayString();
    
    // Update Score
    user.totalScore += score;
    
    // Update Level (simple logic: 1000 pts per level)
    user.level = Math.floor(user.totalScore / 1000) + 1;

    // Update Streak & Completed Dates
    if (!user.completedDates.includes(today)) {
      // Check if yesterday was completed for streak calculation
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (user.completedDates.includes(yesterdayStr)) {
        user.streak += 1;
      } else {
        user.streak = 1; // Reset streak if missed yesterday, or 1 if it's the first day
      }
      
      user.completedDates.push(today);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  // Clear data (logout)
  clearSession: () => {
    // We don't delete data on logout to persist it for the same device,
    // but in a real app, this might clear auth tokens.
  }
};