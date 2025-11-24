
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
import { Sparkles, Loader2, Download } from 'lucide-react';
import { generateDailyQuestions } from './services/geminiService';
import { onAuthStateChanged, signOut, checkRedirectResult } from './services/authService';
import { getUserProfile, updateUserProfile, saveGameResult } from './services/firestoreService';
import { storageService } from './services/storageService';
import { usePWAInstall } from './hooks/usePWAInstall';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [completedSubjects, setCompletedSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const { isInstallable, install } = usePWAInstall();

  // Scroll to top when view or subject changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, selectedSubject]);

  // Check for redirect result on mount (for mobile auth errors)
  useEffect(() => {
    checkRedirectResult()
      .then(user => {
        if (user) {
          // alert(`Redirect success! User: ${user.email}`);
        }
      })
      .catch(error => {
        console.error("Redirect Error:", error);
        // Only alert real errors, not nulls
        if (error.code !== 'auth/popup-closed-by-user') {
          alert(`Authentication Error: ${error.message}`);
        }
      });
  }, []);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      setAuthLoading(true);

      if (firebaseUser) {
        setFirebaseUser(firebaseUser);
        setIsGuest(false);

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
        // Not logged in (and not guest yet)
        setFirebaseUser(null);
        if (!isGuest) {
          setUser(null);
          setView(ViewState.LOGIN);
        }
      }

      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [isGuest]);

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
  }, [selectedSubject, user]);

  // Update completed subjects based on today's date
  useEffect(() => {
    // Reset completed subjects visual state if needed based on real data
  }, [user]);

  const handleGuestLogin = async () => {
    setIsGuest(true);
    setAuthLoading(true);

    try {
      // Check if guest profile exists in localStorage
      const profile = await storageService.getUserProfile('guest_user');

      if (profile) {
        // Load existing guest
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

        setUser({
          id: 'guest_user',
          name: profile.name,
          grade: profile.grade,
          avatar: profile.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
          totalScore: profile.totalPoints,
          completedDates: completedDates,
          streak,
          level: 1,
          friends: []
        });
        setView(ViewState.HOME);
      } else {
        // New guest, go to onboarding
        setFirebaseUser({ uid: 'guest_user', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest' }); // Mock firebaseUser for onboarding
        setView(ViewState.ONBOARDING);
      }
    } catch (error) {
      console.error('Error loading guest profile:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOnboardingComplete = async (name: string, grade: Grade) => {
    const uid = isGuest ? 'guest_user' : firebaseUser?.uid;
    if (!uid) return;

    try {
      const profileData = {
        uid,
        name,
        grade,
        email: isGuest ? '' : (firebaseUser?.email || ''),
        photoURL: isGuest ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest' : (firebaseUser?.photoURL || undefined),
        totalPoints: 0,
        gamesPlayed: 0,
        createdAt: null as any,
        lastActive: null as any
      };

      // Save profile
      if (isGuest) {
        await storageService.updateUserProfile(uid, profileData);
      } else {
        await updateUserProfile(uid, profileData);
      }

      // Update local state
      setUser({
        id: uid,
        name,
        grade,
        avatar: profileData.photoURL || '',
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
    console.log('handleSubjectSelect called for:', subject);
    console.log('Current user state:', user);
    console.log('Current firebaseUser:', firebaseUser);

    if (subject === selectedSubject) return; // Prevent re-select

    // Check if user has reached daily limit for this subject
    if (user) {
      // For guest, we might want to skip this or implement local limit
      // For now, let's allow unlimited play for guests or implement local check later
      if (!isGuest && firebaseUser) {
        try {
          const { getGamesPlayedToday } = await import('./services/gameLimitService');
          const gamesPlayedToday = await getGamesPlayedToday(firebaseUser.uid, subject);

          if (gamesPlayedToday >= 2) {
            alert(`You've already played ${subject} twice today! Come back tomorrow to play more. 🎮`);
            return;
          }
        } catch (error) {
          console.error('Error checking game limit:', error);
          // Fallback: allow play if limit check fails
        }
      }
    } else {
      console.warn('User is null in handleSubjectSelect');
      // Potential fix: if user is null but we are in HOME view, something is wrong.
      // We might need to wait or force a re-render.
    }

    setQuestions([]); // Clear previous
    setSelectedSubject(subject);
    setView(ViewState.GAME);
  };

  const handleGameComplete = async (score: number) => {
    if (user && selectedSubject) {
      try {
        const uid = user.id;

        // Save game result
        if (isGuest) {
          await storageService.saveGameResult(uid, selectedSubject, user.grade, score, 10);
        } else if (firebaseUser) {
          await saveGameResult(uid, selectedSubject, user.grade, score, 10);
        }

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
      if (isGuest) {
        setIsGuest(false);
        setUser(null);
        setView(ViewState.LOGIN);
      } else {
        await signOut();
        setUser(null);
        setFirebaseUser(null);
        setView(ViewState.LOGIN);
      }
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
    return <Login onLoginSuccess={() => { }} onGuestLogin={handleGuestLogin} />;
  }

  // Onboarding View
  if (view === ViewState.ONBOARDING) {
    return <Onboarding onComplete={handleOnboardingComplete} isGuest={isGuest} />;
  }

  const handleUpdateProfile = async (data: Partial<User>) => {
    if (!user) return;
    const uid = user.id;

    try {
      // Update Storage
      if (isGuest) {
        await storageService.updateUserProfile(uid, data);
      } else if (firebaseUser) {
        await updateUserProfile(uid, data);
      }

      // Update local state
      setUser(prev => {
        if (!prev) return null;
        return { ...prev, ...data };
      });

      // If grade changed, clear current questions so they regenerate
      if (data.grade && data.grade !== user.grade) {
        setQuestions([]);
        setSelectedSubject(null);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Settings View
  if (view === ViewState.SETTINGS && user) {
    return (
      <Settings
        user={user}
        onUpdateProfile={handleUpdateProfile}
        onBack={() => setView(ViewState.PROFILE)}
      />
    );
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

          {isInstallable && (
            <button
              onClick={install}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-2xl shadow-lg mb-8 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Download size={24} />
                </div>
                <div className="text-left">
                  <div className="font-bold">Install App</div>
                  <div className="text-xs text-indigo-100">Get offline access & better performance</div>
                </div>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-lg text-sm font-semibold group-hover:bg-white/30 transition-colors">
                Install
              </div>
            </button>
          )}

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
          currentUserId={user?.id}
          isGuest={isGuest}
          onClose={() => setView(ViewState.HOME)}
          onLogin={handleLogout}
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
