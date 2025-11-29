import React, { useState, useEffect } from 'react';
import { Subject, Question, Grade } from '../types';
import { generateDailyQuestions } from '../services/geminiService';
import { Button } from './Button';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameResult } from './GameResult';

interface GameScreenProps {
  subject: Subject;
  grade: Grade;
  questions: Question[];
  loading: boolean;
  onExit: () => void;
  onComplete: (score: number) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ subject, grade, questions, loading, onExit, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  // New state for results and retry
  const [gameStatus, setGameStatus] = useState<'playing' | 'result'>('playing');
  const [incorrectIndices, setIncorrectIndices] = useState<number[]>([]);
  const [retryQuestions, setRetryQuestions] = useState<Question[]>([]);
  const [initialScore, setInitialScore] = useState<number | null>(null);
  const [isRetryMode, setIsRetryMode] = useState(false);

  // Derive the questions to display based on mode
  // This avoids useEffect sync lag which caused the crash
  const currentQuestions = isRetryMode ? retryQuestions : questions;

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    setShowExplanation(true);

    const isCorrect = index === currentQuestions[currentIndex].correctAnswerIndex;

    if (isCorrect) {
      // Only add score if not in retry mode (or maybe we want to track it separately?)
      // For now, let's just track score for the main game.
      // If we are in retry mode, we don't add to the main score to avoid inflation?
      // Or maybe we do? The requirement is "improve memory". 
      // Let's keep score accumulation simple: only count score on first attempt or just display current session score.
      // Actually, let's just keep the score logic as is for the current session.
      setScore(s => s + 10);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#22c55e', '#4ade80']
      });
    } else {
      // Track incorrect answer if not already tracked (though in retry mode we might want to re-track)
      // We store the ORIGINAL index from the full questions list if possible, or just the current question object
      // But activeQuestions is a subset in retry. 
      // Let's store the actual Question objects that were wrong.
      // Wait, state is `incorrectIndices`. Let's change it to `incorrectQuestions` to be safer.
      // Or just use a separate list for the next round.

      // Actually, let's just use a local tracking for the current session.
      // We need to know which questions from `activeQuestions` were wrong.
    }
  };

  const handleNext = () => {
    // Check if current question was answered incorrectly
    const currentQ = currentQuestions[currentIndex];
    const isCorrect = selectedOption === currentQ.correctAnswerIndex;

    if (!isCorrect) {
      // Add to incorrect list if not already there (to avoid duplicates if logic changes)
      // We need to identify the question uniquely. Let's use the question text or just the object reference.
      // Since we are not modifying questions, reference is fine.
      // However, we need to pass these to the next retry.
      // Let's update a state `wrongAnswers` which accumulates wrong questions for this session.
      setIncorrectIndices(prev => [...prev, currentIndex]);
    }

    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setShowExplanation(false);
    } else {
      // End of quiz
      if (!isRetryMode) {
        setInitialScore(score); // Save the first full run score
      }
      setGameStatus('result');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(c => c - 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setShowExplanation(false);
    }
  };

  const handleRetry = () => {
    // Filter questions to only those that were answered incorrectly
    // incorrectIndices contains indices from the `activeQuestions` array of the JUST FINISHED session.
    const wrongQuestions = currentQuestions.filter((_, index) => incorrectIndices.includes(index));

    if (wrongQuestions.length === 0) return;

    setRetryQuestions(wrongQuestions);
    setIncorrectIndices([]); // Reset for the new round
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setShowExplanation(false);
    setScore(0); // Reset score for the practice round
    setGameStatus('playing');
    setIsRetryMode(true);
  };

  const handleFinish = () => {
    // If we have an initial score (from first run), use that. Otherwise use current score.
    // Usually we want to record the first run's score for the leaderboard.
    onComplete(initialScore !== null ? initialScore : score);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Generating your quest...</h2>
        <p className="text-gray-500 mt-2">Preparing {grade} level questions for {subject}</p>
      </div>
    );
  }

  // Safety check for empty questions
  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">No questions available</h2>
        <p className="text-gray-500 mt-2">Please try again or select a different subject.</p>
        <Button onClick={onExit} className="mt-4">Go Back</Button>
      </div>
    );
  }

  if (gameStatus === 'result') {
    return (
      <GameResult
        score={score}
        totalQuestions={currentQuestions.length}
        correctCount={currentQuestions.length - incorrectIndices.length}
        onRetry={handleRetry}
        onFinish={handleFinish}
        hasMistakes={incorrectIndices.length > 0}
      />
    );
  }

  const currentQ = currentQuestions[currentIndex];
  // Safety check for currentQ
  if (!currentQ) {
    return null; // Or some error state, but this shouldn't happen with the fix
  }

  const progress = ((currentIndex + 1) / currentQuestions.length) * 100;

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onExit} className="p-2 -ml-2 text-gray-400 hover:text-gray-600">
          <ArrowLeft />
        </button>
        <div className="flex-1 mx-4">
          <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            <span>Question {currentIndex + 1}/{currentQuestions.length}</span>
            <span>{score} Pts</span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-3xl p-6 shadow-sm mb-6 border border-gray-100 slide-in">
        {isRetryMode && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase tracking-wide">
            <RotateCcw size={12} />
            Retry Mode
          </div>
        )}
        <h2 className="text-lg font-bold text-gray-800 leading-relaxed mb-6">
          {currentQ.questionText}
        </h2>

        <div className="space-y-3">
          {currentQ.options.map((option, idx) => {
            let stateClass = "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50";
            let icon = null;

            if (isAnswered) {
              if (idx === currentQ.correctAnswerIndex) {
                stateClass = "border-green-500 bg-green-50 text-green-700";
                icon = <CheckCircle size={20} className="text-green-500" />;
              } else if (idx === selectedOption) {
                stateClass = "border-red-500 bg-red-50 text-red-700";
                icon = <XCircle size={20} className="text-red-500" />;
              } else {
                stateClass = "opacity-50 border-gray-100";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                disabled={isAnswered}
                className={`w-full p-4 rounded-xl border-2 text-left font-medium transition-all flex justify-between items-center ${stateClass}`}
              >
                <span>{option}</span>
                {icon}
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation & Next Button */}
      {showExplanation && (
        <div className="slide-in pb-8">
          <div className={`rounded-2xl p-4 mb-6 ${selectedOption === currentQ.correctAnswerIndex ? 'bg-green-100 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
            <div className="flex items-start gap-3">
              <AlertCircle className="shrink-0 mt-0.5" size={20} />
              <div>
                <span className="font-bold block mb-1">Explanation:</span>
                <p className="text-sm opacity-90">{currentQ.explanation}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {currentIndex > 0 && (
              <Button
                onClick={handlePrevious}
                variant="outline"
                className="flex-1"
              >
                Previous
              </Button>
            )}
            <Button
              onClick={handleNext}
              fullWidth={currentIndex === 0}
              className={`shadow-lg ${currentIndex > 0 ? 'flex-1' : ''}`}
            >
              {currentIndex === currentQuestions.length - 1 ? "See Results" : "Next Question"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};