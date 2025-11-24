
import React, { useState, useEffect } from 'react';
import { ViewState, User, Subject, Grade, Question } from './types';
import { NavBar } from './components/NavBar';
import { SubjectCard } from './components/SubjectCard';
import { GameScreen } from './components/GameScreen';
import { Leaderboard } from './components/Leaderboard';
import { Profile } from './components/Profile';
import { Onboarding } from './components/Onboarding';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { Button } from './components/Button';
import { Sparkles, Loader2 } from 'lucide-react';
import { generateDailyQuestions } from './services/geminiService';
import { onAuthStateChanged, signOut } from './services/authService';
import { getUserProfile, updateUserProfile, saveGameResult } from './services/firestoreService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [completedSubjects, setCompletedSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      setAuthLoading(true);

      if (firebaseUser) {
        setFirebaseUser(firebaseUser);

        // Fetch user profile from Firestore
        try {
          const profile = await getUserProfile(firebaseUser.uid);

          if (profile) {
            // Calculate streak from completedDates
            const completedDates = profile.completedDates || [];
            const sortedDates = [...completedDates].sort().reverse();
            let streak = 0;
            let currentDate = new Date();

            for (const dateStr of sortedDates) {
              const date = new Date(dateStr);
              const diffDays = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

              if (diffDays === streak) {
                streak++;
              } else {
                break;
              }
            }

            // User exists, load profile
            setUser({
              id: profile.uid,
              name: profile.name,
              grade: profile.grade,
              avatar: profile.photoURL || firebaseUser.photoURL || '',
              totalScore: profile.totalPoints,
              completedDates: completedDates,
              streak,
              level: 1,
              friends: []
            });
            setView(ViewState.HOME);
          } else {
            // New user, go to onboarding
            setView(ViewState.ONBOARDING);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setView(ViewState.ONBOARDING);
        }
      } else {
        // Not logged in
        setFirebaseUser(null);
        setUser(null);
        setView(ViewState.LOGIN);
      }

      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch questions when subject is selected
  useEffect(() => {
    const fetchQuestions = async () => {
      if (selectedSubject && user) {
        setLoadingQuestions(true);
        try {
          const data = await generateDailyQuestions(selectedSubject, user.grade);
          setQuestions(data);
        } catch (error) {
          console.error("Failed to fetch questions", error);
          setQuestions([]);
        } finally {
          setLoadingQuestions(false);
        }
      }
    };

    if (selectedSubject) {
      fetchQuestions();
    } else {
      setQuestions([]);
    }
  }, [selectedSubject, user]); // Note: StrictMode might still trigger this twice, but since we lift state, it's better. 
  // To truly fix StrictMode flicker for random data, we'd need a ref check, but let's see if this stabilizes the "in-game" refresh first.
  // The user said "auto refresh when in question page", which implies continuous or unexpected refreshing.
  // By moving it here, it only refreshes if selectedSubject changes.

  // Update completed subjects based on today's date
  useEffect(() => {
    // Reset completed subjects visual state if needed based on real data
    // For now, we keep it simple in state, but in production, we'd check `user.completedDates` matches today
  }, [user]);

  const handleOnboardingComplete = async (name: string, grade: Grade) => {
    if (!firebaseUser) return;

    try {
      // Save profile to Firestore
      await updateUserProfile(firebaseUser.uid, {
        uid: firebaseUser.uid,
        name,
        grade,
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || undefined,
        totalPoints: 0,
        gamesPlayed: 0,
        createdAt: null as any, // Will be set by service
        lastActive: null as any
      });

      // Update local state
      setUser({
        id: firebaseUser.uid,
        name,
        grade,
        avatar: firebaseUser.photoURL || '',
        totalScore: 0,
        completedDates: [],
        streak: 0,
        level: 1,
        friends: []
      });

      setView(ViewState.HOME);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  const handleSubjectSelect = async (subject: Subject) => {
    if (subject === selectedSubject) return; // Prevent re-select

    // Check if user has reached daily limit for this subject
    if (firebaseUser) {
      const { getGamesPlayedToday } = await import('./services/gameLimitService');
      const gamesPlayedToday = await getGamesPlayedToday(firebaseUser.uid, subject);

      if (gamesPlayedToday >= 2) {
        alert(`You've already played ${subject} twice today! Come back tomorrow to play more. 🎮`);
        return;
      }
    }

    setQuestions([]); // Clear previous
    setSelectedSubject(subject);
    setView(ViewState.GAME);
  };

  const handleGameComplete = async (score: number) => {
    if (user && selectedSubject && firebaseUser) {
      try {
        // Save game result to Firestore
        await saveGameResult(
          firebaseUser.uid,
          selectedSubject,
          user.grade,
          score,
          10 // Total questions
        );

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Update local user state
        setUser(prev => {
          if (!prev) return null;

          // Only add today if it's not already in the array
          const updatedDates = prev.completedDates.includes(today)
            ? prev.completedDates
            : [...prev.completedDates, today];

          // Calculate streak
          const sortedDates = [...updatedDates].sort().reverse();
          let streak = 0;
          let currentDate = new Date();

          for (const dateStr of sortedDates) {
            const date = new Date(dateStr);
            const diffDays = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === streak) {
              streak++;
            } else {
              break;
            }
          }

          return {
            ...prev,
            totalScore: prev.totalScore + score,
            completedDates: updatedDates,
            streak
          };
        });

        setCompletedSubjects(prev => [...prev, selectedSubject]);
      } catch (error) {
        console.error('Error saving game result:', error);
      }
    }

    setView(ViewState.HOME);
    setSelectedSubject(null);
    setQuestions([]);
    alert(`Great job! You earned ${score} points!`);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      setFirebaseUser(null);
      setView(ViewState.LOGIN);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Login View
  if (view === ViewState.LOGIN) {
    return <Login onLoginSuccess={() => { }} />;
  }

  // Onboarding View
  if (view === ViewState.ONBOARDING) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Settings View
  if (view === ViewState.SETTINGS) {
    return <Settings onBack={() => setView(ViewState.PROFILE)} />;
  }

  // Game View (No NavBar)
  if (view === ViewState.GAME && selectedSubject && user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GameScreen
          subject={selectedSubject}
          grade={user.grade}
          questions={questions}
          loading={loadingQuestions}
          onExit={() => {
            setView(ViewState.HOME);
            setSelectedSubject(null);
            setQuestions([]);
          }}
          onComplete={handleGameComplete}
        />
      </div>
    );
  }

  // Main App Shell
  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {view === ViewState.HOME && user && (
        <div className="p-6 max-w-lg mx-auto">
          <header className="flex justify-between items-center mb-8 pt-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Hi, {user.name.split(' ')[0]}! 👋</h1>
              <p className="text-gray-500 text-sm">Let's ace {user.grade} today!</p>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100 flex items-center gap-2">
              <span className="font-bold text-indigo-600">{user.totalScore}</span>
              <span className="text-xs text-gray-400 font-bold uppercase">PTS</span>
            </div>
          </header>

          <div className="grid gap-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Today's Quests</h2>
            {Object.values(Subject).map((sub) => (
              <SubjectCard
                key={sub}
                subject={sub}
                onClick={() => handleSubjectSelect(sub)}
                dailyComplete={completedSubjects.includes(sub)}
              />
            ))}
          </div>
        </div>
      )}

      {view === ViewState.LEADERBOARD && (
        <Leaderboard
          currentUserId={firebaseUser?.uid}
          onClose={() => setView(ViewState.HOME)}
        />
      )}

      {view === ViewState.PROFILE && user && (
        <Profile
          user={user}
          onOpenSettings={() => setView(ViewState.SETTINGS)}
          onLogout={handleLogout}
        />
      )}

      <NavBar currentView={view} setView={setView} />
    </div>
  );
};

export default App;
