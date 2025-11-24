import React, { useState } from 'react';
import { Button } from './Button';
import { signInWithGoogle } from '../services/authService';
import { BookOpen, Sparkles } from 'lucide-react';

interface LoginProps {
    onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);

        try {
            await signInWithGoogle();
            onLoginSuccess();
        } catch (err: any) {
            console.error('Sign-in error:', err);
            setError(err.message || 'Failed to sign in. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Hero Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mb-6 shadow-lg">
                        <BookOpen className="w-10 h-10 text-white" />
                    </div>

                    <h1 className="text-4xl font-black text-gray-900 mb-3">
                        Lion City Scholars
                    </h1>

                    <p className="text-lg text-gray-600 mb-2">
                        Master Singapore Primary School Subjects
                    </p>

                    <div className="flex items-center justify-center gap-2 text-sm text-indigo-600">
                        <Sparkles className="w-4 h-4" />
                        <span>English • Math • Science • Chinese</span>
                        <Sparkles className="w-4 h-4" />
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                        Welcome Back!
                    </h2>
                    <p className="text-gray-500 text-center mb-6">
                        Sign in to track your progress and compete on the leaderboard
                    </p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
                                <span className="text-gray-800">Signing in...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                <span className="text-gray-800">Continue with Google</span>
                            </>
                        )}
                    </button>

                    <p className="text-xs text-gray-400 text-center mt-6">
                        By signing in, you agree to sync your progress across devices
                    </p>
                </div>

                {/* Features */}
                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-indigo-600">1000+</div>
                        <div className="text-xs text-gray-500">Questions</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-purple-600">4</div>
                        <div className="text-xs text-gray-500">Subjects</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-pink-600">P3-P4</div>
                        <div className="text-xs text-gray-500">Levels</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
