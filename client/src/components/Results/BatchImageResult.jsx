import React from 'react';
import { CheckCircle, Download, RefreshCw, Layers, Archive } from 'lucide-react';
import { formatFileSize } from '../../utils/helpers';
import StatCard from '../../components/StatCard';
import LoadingButton from '../../components/LoadingButton';

const BatchImageResult = ({ batchResult, downloading, onDownload, onReset }) => {
  const stats = [
    {
      icon: Layers,
      label: "Total Files",
      value: batchResult.totalFiles,
      gradient: "bg-gradient-to-br from-blue-500/20 to-blue-600/20",
      border: "border-blue-500/30",
      textColor: "text-blue-400"
    },
    {
      icon: CheckCircle,
      label: "Successful",
      value: batchResult.successfulConversions,
      gradient: "bg-gradient-to-br from-green-500/20 to-green-600/20",
      border: "border-green-500/30",
      textColor: "text-green-400"
    },
    {
      icon: Archive,
      label: "Total Saved",
      value: `${batchResult.overallCompressionRatio}%`,
      gradient: "bg-gradient-to-br from-purple-500/20 to-purple-600/20",
      border: "border-purple-500/30",
      textColor: "text-purple-400"
    },
    {
      icon: Download,
      label: "ZIP Size",
      value: formatFileSize(batchResult.zipSize),
      gradient: "bg-gradient-to-br from-yellow-500/20 to-yellow-600/20",
      border: "border-yellow-500/30",
      textColor: "text-yellow-400"
    }
  ];

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-500/20 rounded-lg">
          <CheckCircle className="w-6 h-6 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-200">Batch Conversion Complete!</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.gradient} p-4 rounded-xl border ${stat.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.textColor}`} />
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
            <p className={`text-xl font-bold ${stat.textColor}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-gray-800/50 p-4 rounded-xl mb-6 border border-gray-700">
        <h3 className="font-semibold text-gray-300 mb-3">Conversion Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Files Processed:</span>
            <span className="text-gray-300 font-medium">
              {batchResult.successfulConversions} of {batchResult.totalFiles}
            </span>
          </div>
          {batchResult.failedFiles && batchResult.failedFiles.length > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Failed Files:</span>
              <span className="text-red-400 font-medium">
                {batchResult.failedFiles.length}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="text-center space-y-4">
        <LoadingButton
          loading={downloading}
          loadingText="Downloading ZIP..."
          onClick={onDownload}
          icon={Download}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 mx-auto"
        >
          Download ZIP File
        </LoadingButton>
        
        <button
          onClick={onReset}
          className="text-gray-400 hover:text-gray-300 font-medium text-sm transition-colors flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Convert More Images
        </button>
      </div>
    </div>
  );
};

export default BatchImageResult;
