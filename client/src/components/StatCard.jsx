import React from 'react';

const StatCard = ({ icon: Icon, label, value, gradient, border }) => {
  return (
    <div className={`${gradient} p-4 rounded-xl border ${border}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <p className="text-sm text-gray-400">{label}</p>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
};

export default StatCard;