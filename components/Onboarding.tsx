
import React, { useState } from 'react';
import { Grade } from '../types';
import { Button } from './Button';
import { UserCircle, GraduationCap } from 'lucide-react';

interface OnboardingProps {
  onComplete: (name: string, grade: Grade) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<Grade | null>(null);

  const handleNext = () => {
    if (step === 1 && name.trim()) {
      setStep(2);
    } else if (step === 2 && grade) {
      onComplete(name, grade);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          <div className={`h-2 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
          <div className={`h-2 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
        </div>

        {step === 1 && (
          <div className="slide-in">
            <div className="bg-white p-8 rounded-3xl shadow-lg text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                <UserCircle size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">What's your name?</h2>
              <p className="text-gray-500 mb-6">We'll use this for your certificate and leaderboard!</p>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full text-center text-xl font-bold p-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all mb-6 text-gray-800"
                autoFocus
              />

              <Button
                fullWidth
                onClick={handleNext}
                disabled={!name.trim()}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="slide-in">
            <div className="bg-white p-8 rounded-3xl shadow-lg text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-600">
                <GraduationCap size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Which grade are you in?</h2>
              <p className="text-gray-500 mb-6">This helps us pick the right questions for you.</p>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setGrade('Primary 3')}
                  className={`w-full p-4 rounded-xl border-2 font-bold transition-all ${grade === 'Primary 3'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-100 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  Primary 3
                </button>
                <button
                  onClick={() => setGrade('Primary 4')}
                  className={`w-full p-4 rounded-xl border-2 font-bold transition-all ${grade === 'Primary 4'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-100 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  Primary 4
                </button>
              </div>

              <Button
                fullWidth
                onClick={handleNext}
                disabled={!grade}
              >
                Start Learning!
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
