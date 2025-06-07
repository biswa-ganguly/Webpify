import React from 'react';
import { Zap, ImageIcon, Layers } from 'lucide-react';
import ModeSelector from './ModeSelector';
import FormatBadges from './FormatBadges';

const Header = ({ mode, onModeChange }) => {
  return (
    <div className="text-center mb-8">
      <div className="flex justify-center items-center gap-3 mb-4">
        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          WebP Converter Pro
        </h1>
      </div>
      <p className="text-xl text-gray-300 mb-6">
        Transform your images with next-generation compression
      </p>
      
      <ModeSelector mode={mode} onModeChange={onModeChange} />
      <FormatBadges />
    </div>
  );
};

export default Header;