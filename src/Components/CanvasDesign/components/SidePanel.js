/**
 * SidePanel Component
 * Right panel showing front/back design thumbnails
 */

import React from 'react';
import { IoCheckmarkCircle } from 'react-icons/io5';

const SidePanel = ({
  frontImage,
  backImage,
  frontStatus,
  backStatus,
  activeSide,
  onSwitchSide,
}) => {
  const isGoodStatus = (status) => 
    status.status === 'perfect' || status.status === 'safe';

  return (
    <aside className="w-24 bg-white border-l flex flex-col items-center py-6 gap-3">
      {/* Front thumbnail */}
      <button
        onClick={() => onSwitchSide('front')}
        className={`w-16 h-10 rounded border-2 overflow-hidden transition relative ${
          activeSide === 'front' ? 'border-gray-800 shadow-md' : 'border-gray-300'
        }`}
      >
        {frontImage ? (
          <>
            <img
              src={frontImage.src}
              alt="Front"
              className="w-full h-full object-cover"
            />
            {isGoodStatus(frontStatus) && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <IoCheckmarkCircle size={12} className="text-white" />
              </div>
            )}
          </>
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
        {backImage ? (
          <>
            <img
              src={backImage.src}
              alt="Back"
              className="w-full h-full object-cover"
            />
            {isGoodStatus(backStatus) && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <IoCheckmarkCircle size={12} className="text-white" />
              </div>
            )}
          </>
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
