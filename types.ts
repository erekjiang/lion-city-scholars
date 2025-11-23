
export enum Subject {
  ENGLISH = 'English',
  MATH = 'Math',
  SCIENCE = 'Science',
  CHINESE = 'Chinese'
}

export type Grade = 'Primary 3' | 'Primary 4';

export interface Question {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface User {
  id: string;
  name: string;
  grade: Grade;
  avatar: string;
  totalScore: number;
  streak: number;
  level: number;
  friends: string[];
  completedDates: string[]; // ISO Date strings YYYY-MM-DD
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  avatar: string;
  rank: number;
}

export enum ViewState {
  LOGIN,
  ONBOARDING,
  HOME,
  GAME,
  LEADERBOARD,
  PROFILE,
  SETTINGS
}

export const SUBJECT_THEMES: Record<Subject, { color: string; bg: string; icon: string }> = {
  [Subject.ENGLISH]: { color: 'text-blue-600', bg: 'bg-blue-100', icon: '📖' },
  [Subject.MATH]: { color: 'text-red-600', bg: 'bg-red-100', icon: '➗' },
  [Subject.SCIENCE]: { color: 'text-green-600', bg: 'bg-green-100', icon: '🔬' },
  [Subject.CHINESE]: { color: 'text-orange-600', bg: 'bg-orange-100', icon: '🧧' },
};
