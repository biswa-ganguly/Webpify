import React from 'react';
import { Settings, Info } from 'lucide-react';
import QualitySlider from './QualitySlider';
import DimensionInput from './DimensionInput';

const SettingsPanel = ({ quality, setQuality, width, setWidth, height, setHeight }) => {
  return (
    <div className="mt-8 p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold text-gray-200 text-lg">Conversion Settings</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QualitySlider quality={quality} setQuality={setQuality} />
        <DimensionInput 
          label="Width (px)" 
          value={width} 
          onChange={setWidth} 
          placeholder="Auto" 
        />
        <DimensionInput 
          label="Height (px)" 
          value={height} 
          onChange={setHeight} 
          placeholder="Auto" 
        />
      </div>

      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-300">
            <strong>Pro Tip:</strong> Leave dimensions empty to maintain original size. 
            Specify only width or height to preserve aspect ratio automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;