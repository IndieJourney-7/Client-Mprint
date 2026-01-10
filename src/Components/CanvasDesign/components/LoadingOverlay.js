/**
 * LoadingOverlay Component
 * Displayed when loading initial design state
 */

import React from 'react';

const LoadingOverlay = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-white text-lg font-medium">Loading your design...</p>
        <p className="text-gray-400 text-sm mt-1">Please wait while we restore your work</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
