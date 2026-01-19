/**
 * SidePanel Component
 * Right panel showing front/back design thumbnails with real-time previews
 */

import React from 'react';
import { IoCheckmarkCircle, IoSync } from 'react-icons/io5';

const SidePanel = ({
  frontImage,
  backImage,
  frontStatus,
  backStatus,
  activeSide,
  onSwitchSide,
  // Real-time previews (includes text layers)
  frontPreview = null,
  backPreview = null,
  isGeneratingPreview = false,
  // Content indicators
  hasFrontContent = false,
  hasBackContent = false,
}) => {
  const isGoodStatus = (status) =>
    status?.status === 'perfect' || status?.status === 'safe';

  // Use preview if available, otherwise fall back to raw image
  const frontDisplaySrc = frontPreview || frontImage?.src;
  const backDisplaySrc = backPreview || backImage?.src;

  return (
    <aside className="w-24 bg-white border-l flex flex-col items-center py-6 gap-3">
      {/* Front thumbnail */}
      <button
        onClick={() => onSwitchSide('front')}
        className={`w-16 h-10 rounded border-2 overflow-hidden transition relative ${
          activeSide === 'front' ? 'border-gray-800 shadow-md' : 'border-gray-300'
        }`}
      >
        {frontDisplaySrc ? (
          <>
            <img
              src={frontDisplaySrc}
              alt="Front"
              className="w-full h-full object-cover"
            />
            {/* Generating indicator */}
            {isGeneratingPreview && activeSide === 'front' && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                <IoSync size={14} className="text-cyan-500 animate-spin" />
              </div>
            )}
            {isGoodStatus(frontStatus) && !isGeneratingPreview && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <IoCheckmarkCircle size={12} className="text-white" />
              </div>
            )}
          </>
        ) : hasFrontContent ? (
          // Has content (like text) but no image - show placeholder with indicator
          <div className="w-full h-full bg-white flex items-center justify-center border border-dashed border-gray-300">
            {isGeneratingPreview ? (
              <IoSync size={14} className="text-cyan-500 animate-spin" />
            ) : (
              <span className="text-[8px] text-gray-400">Text</span>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="w-3 h-0.5 bg-cyan-500"></div>
          </div>
        )}
      </button>
      <span
        className={`text-xs ${
          activeSide === 'front' ? 'text-gray-800 font-medium' : 'text-gray-500'
        }`}
      >
        Front
      </span>

      {/* Back thumbnail */}
      <button
        onClick={() => onSwitchSide('back')}
        className={`w-16 h-10 rounded border-2 overflow-hidden transition relative ${
          activeSide === 'back' ? 'border-gray-800 shadow-md' : 'border-gray-300'
        }`}
      >
        {backDisplaySrc ? (
          <>
            <img
              src={backDisplaySrc}
              alt="Back"
              className="w-full h-full object-cover"
            />
            {/* Generating indicator */}
            {isGeneratingPreview && activeSide === 'back' && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                <IoSync size={14} className="text-cyan-500 animate-spin" />
              </div>
            )}
            {isGoodStatus(backStatus) && !isGeneratingPreview && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <IoCheckmarkCircle size={12} className="text-white" />
              </div>
            )}
          </>
        ) : hasBackContent ? (
          // Has content (like text) but no image - show placeholder with indicator
          <div className="w-full h-full bg-white flex items-center justify-center border border-dashed border-gray-300">
            {isGeneratingPreview ? (
              <IoSync size={14} className="text-cyan-500 animate-spin" />
            ) : (
              <span className="text-[8px] text-gray-400">Text</span>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}
      </button>
      <span
        className={`text-xs ${
          activeSide === 'back' ? 'text-gray-800 font-medium' : 'text-gray-500'
        }`}
      >
        Back
      </span>
    </aside>
  );
};

export default SidePanel;
