
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { ArrowLeft, Key, Save, AlertTriangle } from 'lucide-react';
import { storageService } from '../services/storageService';

interface SettingsProps {
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const current = storageService.getCustomApiKey();
    if (current) setApiKey(current);
  }, []);

  const handleSave = () => {
    storageService.setCustomApiKey(apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    setApiKey('');
    storageService.setCustomApiKey('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-gray-600">
          <ArrowLeft />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6 slide-in">
        <div className="flex items-center gap-3 mb-4 text-indigo-600">
          <Key size={24} />
          <h2 className="text-lg font-bold">Custom API Key</h2>
        </div>
        
        <p className="text-gray-500 text-sm mb-4 leading-relaxed">
          If you are experiencing issues or want to use your own quota, you can provide your own Google Gemini API Key here.
        </p>

        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 mb-4 flex gap-3 text-sm text-yellow-700">
          <AlertTriangle className="shrink-0" size={18} />
          <p>This key is stored only on your device in this browser.</p>
        </div>

        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter API Key (AIzaSy...)"
          className="w-full p-4 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-indigo-500 outline-none mb-4 font-mono text-sm"
        />

        <div className="flex gap-3">
          <Button onClick={handleSave} fullWidth>
            {saved ? 'Saved!' : 'Save Key'}
          </Button>
          {apiKey && (
            <Button variant="secondary" onClick={handleClear}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="text-center">
        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noreferrer"
          className="text-indigo-500 text-sm font-medium hover:underline"
        >
          Get a free API Key from Google AI Studio
        </a>
      </div>
    </div>
  );
};
