
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { ArrowLeft, Key, Save, AlertTriangle, GraduationCap, Download } from 'lucide-react';
import { User, Grade } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface SettingsProps {
  user: User;
  onUpdateProfile: (data: Partial<User>) => Promise<void>;
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onUpdateProfile, onBack }) => {
  const [grade, setGrade] = useState<Grade>(user.grade);
  const [saving, setSaving] = useState(false);
  const { isInstallable, install } = usePWAInstall();
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if user is on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
  }, []);

  const handleSave = async () => {
    if (grade === user.grade) return;

    setSaving(true);
    try {
      await onUpdateProfile({ grade });
      alert('Grade updated successfully!');
    } catch (error) {
      console.error('Failed to update grade:', error);
      alert('Failed to update grade. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-gray-600">
          <ArrowLeft />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
      </div>

      {/* Academic Settings */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6 slide-in">
        <div className="flex items-center gap-3 mb-4 text-indigo-600">
          <GraduationCap size={24} />
          <h2 className="text-lg font-bold">Academic Settings</h2>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
          <div className="grid grid-cols-2 gap-3">
            {(['Primary 3', 'Primary 4'] as Grade[]).map((g) => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={`p-3 rounded-xl border-2 transition-all ${grade === g
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                  : 'border-gray-100 hover:border-gray-200 text-gray-600'
                  }`}
              >
                {g}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <AlertTriangle size={12} />
            Changing grade will update your daily questions.
          </p>
        </div>

        <Button
          fullWidth
          onClick={handleSave}
          disabled={grade === user.grade || saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* PWA Install Section */}
      {isInstallable && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6 slide-in">
          <div className="flex items-center gap-3 mb-4 text-indigo-600">
            <Download size={24} />
            <h2 className="text-lg font-bold">Install App</h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Install Lion City Scholars on your device for quick access and offline learning!
          </p>
          <Button fullWidth onClick={install}>
            Install App
          </Button>
        </div>
      )}

      {/* iOS Instructions */}
      {isIOS && !isInstallable && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6 slide-in">
          <div className="flex items-center gap-3 mb-4 text-indigo-600">
            <Download size={24} />
            <h2 className="text-lg font-bold">Install App</h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            To install on iPhone/iPad:
          </p>
          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2 mb-2">
            <li>Tap the <strong>Share</strong> button <span className="inline-block bg-gray-100 p-1 rounded">⎋</span></li>
            <li>Scroll down and tap <strong>Add to Home Screen</strong> <span className="inline-block bg-gray-100 p-1 rounded">➕</span></li>
          </ol>
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6 slide-in">
        <div className="flex items-center gap-3 mb-4 text-indigo-600">
          <Key size={24} />
          <h2 className="text-lg font-bold">About</h2>
        </div>

        <p className="text-gray-500 text-sm mb-4 leading-relaxed">
          Lion City Scholars is a free educational tool designed to help Singapore Primary School students practice for their exams.
        </p>

        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-4 flex gap-3 text-sm text-indigo-700">
          <p>Version 1.0.0 • Offline Ready</p>
        </div>
      </div>
    </div>
  );
};
