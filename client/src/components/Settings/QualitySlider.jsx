import React from 'react';

const QualitySlider = ({ quality, setQuality }) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">
        Quality: <span className="text-blue-400 font-semibold">{quality}%</span>
      </label>
      <input
        type="range"
        min="10"
        max="100"
        value={quality}
        onChange={(e) => setQuality(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${quality}%, #374151 ${quality}%, #374151 100%)`
        }}
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>Smaller Size</span>
        <span>Better Quality</span>
      </div>
    </div>
  );
};

export default QualitySlider;