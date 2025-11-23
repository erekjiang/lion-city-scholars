import React, { useState, useEffect } from 'react';
import { Subject, Question, Grade } from '../types';
import { generateDailyQuestions } from '../services/geminiService';
import { Button } from './Button';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameScreenProps {
  subject: Subject;
  grade: Grade;
  onExit: () => void;
  onComplete: (score: number) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ subject, grade, onExit, onComplete }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const data = await generateDailyQuestions(subject, grade);
        setQuestions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [subject, grade]);

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    setShowExplanation(true);

    if (index === questions[currentIndex].correctAnswerIndex) {
      setScore(s => s + 10);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#22c55e', '#4ade80']
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setShowExplanation(false);
    } else {
      onComplete(score);
    }
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

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onExit} className="p-2 -ml-2 text-gray-400 hover:text-gray-600">
          <ArrowLeft />
        </button>
        <div className="flex-1 mx-4">
          <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            <span>Question {currentIndex + 1}/10</span>
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
          <Button onClick={handleNext} fullWidth className="shadow-lg">
            {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
          </Button>
        </div>
      )}
    </div>
  );
};