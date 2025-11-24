
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { ArrowLeft, Key, Save, AlertTriangle } from 'lucide-react';
import { storageService } from '../services/storageService';

interface SettingsProps {
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
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
