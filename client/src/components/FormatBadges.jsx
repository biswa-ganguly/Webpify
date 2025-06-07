import React from 'react';

const FormatBadges = () => {
  const formats = ['JPEG', 'PNG', 'GIF', 'BMP', 'TIFF'];
  
  return (
    <div className="flex flex-wrap justify-center gap-2 text-sm">
      {formats.map(format => (
        <span 
          key={format} 
          className="bg-gray-800/50 backdrop-blur-sm text-gray-300 px-3 py-1 rounded-full border border-gray-700"
        >
          {format}
        </span>
      ))}
      <span className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-1 rounded-full font-semibold">
        → WebP
      </span>
    </div>
  );
};

export default FormatBadges;