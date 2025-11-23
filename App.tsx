
import React, { useState, useEffect } from 'react';
import { ViewState, User, Subject, Grade } from './types';
import { NavBar } from './components/NavBar';
import { SubjectCard } from './components/SubjectCard';
import { GameScreen } from './components/GameScreen';
import { Leaderboard } from './components/Leaderboard';
import { Profile } from './components/Profile';
import { Onboarding } from './components/Onboarding';
import { Settings } from './components/Settings';
import { Button } from './components/Button';
import { Sparkles } from 'lucide-react';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [user, setUser] = useState<User | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [completedSubjects, setCompletedSubjects] = useState<Subject[]>([]);

  // Check storage on mount
  useEffect(() => {
    const storedUser = storageService.getUser();
    if (storedUser) {
      setUser(storedUser);
      setView(ViewState.HOME);
    }
  }, []);

  // Update completed subjects based on today's date
  useEffect(() => {
    // Reset completed subjects visual state if needed based on real data
    // For now, we keep it simple in state, but in production, we'd check `user.completedDates` matches today
  }, [user]);

  const handleGoogleLogin = () => {
    // Simulate Google Login
    // In a real app, this would return an ID token
    // We check if a user exists locally
    const storedUser = storageService.getUser();
    
    if (storedUser) {
      setUser(storedUser);
      setView(ViewState.HOME);
    } else {
      // New User -> Go to Onboarding
      setView(ViewState.ONBOARDING);
    }
  };

  const handleOnboardingComplete = (name: string, grade: Grade, apiKey?: string) => {
    const avatar = `https://picsum.photos/seed/${name}/200`;
    const newUser = storageService.createUser(name, grade, avatar);
    
    // Save Custom API Key if provided
    if (apiKey && apiKey.trim()) {
      storageService.setCustomApiKey(apiKey.trim());
    }

    setUser(newUser);
    setView(ViewState.HOME);
  };

  const handleLogout = () => {
    storageService.clearSession(); // Optional: Clear tokens
    setUser(null);
    setView(ViewState.LOGIN);
    setSelectedSubject(null);
    setCompletedSubjects([]);
  };

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setView(ViewState.GAME);
  };

  const handleGameComplete = (score: number) => {
    if (user && selectedSubject) {
      // Update persistent storage
      const updatedUser = storageService.updateProgress(score);
      if (updatedUser) {
        setUser(updatedUser);
      }
      setCompletedSubjects(prev => [...prev, selectedSubject]);
    }
    setView(ViewState.HOME);
    setSelectedSubject(null);
    alert(`Great job! You earned ${score} points!`);
  };

  // Login View
  if (view === ViewState.LOGIN) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="bg-white/20 p-6 rounded-full mb-6 backdrop-blur-sm">
          <Sparkles size={48} className="text-yellow-300" />
        </div>
        <h1 className="text-4xl font-bold mb-2 tracking-tight">Lion City Scholars</h1>
        <p className="text-blue-100 mb-12 text-lg">Join the challenge, master your subjects!</p>
        
        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl text-gray-800">
          <h2 className="font-bold text-2xl mb-6">Welcome!</h2>
          <Button fullWidth onClick={handleGoogleLogin} className="flex items-center justify-center gap-3 relative">
             <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
             Sign in with Google
          </Button>
          <p className="text-xs text-gray-400 mt-4">
            By joining, you agree to become the smartest kid in Singapore (probably).
          </p>
        </div>
      </div>
    );
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
          onExit={() => setView(ViewState.HOME)} 
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

      {view === ViewState.LEADERBOARD && <Leaderboard />}
      
      {view === ViewState.PROFILE && user && (
        <Profile 
          user={user} 
          onLogout={handleLogout} 
          onOpenSettings={() => setView(ViewState.SETTINGS)} 
        />
      )}

      <NavBar currentView={view} setView={setView} />
    </div>
  );
};

export default App;
