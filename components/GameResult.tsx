import React from 'react';
import { Button } from './Button';
import { Trophy, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

interface GameResultProps {
    score: number;
    totalQuestions: number;
    correctCount: number;
    onRetry: () => void;
    onFinish: () => void;
    hasMistakes: boolean;
}

export const GameResult: React.FC<GameResultProps> = ({
    score,
    totalQuestions,
    correctCount,
    onRetry,
    onFinish,
    hasMistakes
}) => {
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 slide-in">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 w-full max-w-md">
                <div className="mb-6 relative inline-block">
                    <Trophy className="w-20 h-20 text-yellow-400 mx-auto" />
                    <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {score} PTS
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Completed!</h2>
                <p className="text-gray-500 mb-8">Here's how you did</p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-700 font-bold text-lg">{correctCount}</span>
                        </div>
                        <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Correct</p>
                    </div>

                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700 font-bold text-lg">{totalQuestions - correctCount}</span>
                        </div>
                        <p className="text-xs text-red-600 font-medium uppercase tracking-wide">Incorrect</p>
                    </div>
                </div>

                <div className="mb-8">
                    <div className="text-4xl font-black text-indigo-600 mb-2">{percentage}%</div>
                    <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Success Rate</p>
                </div>

                <div className="space-y-3">
                    {hasMistakes && (
                        <Button
                            onClick={onRetry}
                            variant="outline"
                            fullWidth
                            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Retry Mistakes
                        </Button>
                    )}

                    <Button
                        onClick={onFinish}
                        fullWidth
                        className="shadow-lg shadow-indigo-200"
                    >
                        Finish & Save
                    </Button>
                </div>
            </div>
        </div>
    );
};
