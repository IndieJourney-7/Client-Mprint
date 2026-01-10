/**
 * Header Component
 * Top navigation bar for the canvas design studio
 */

import React from 'react';
import {
  IoSaveOutline,
  IoArrowUndo,
  IoArrowRedo,
  IoEyeOutline,
  IoClose,
} from 'react-icons/io5';

const Header = ({
  productName,
  isHorizontal,
  cardPreset,
  hasUnsavedChanges,
  isSaving,
  saveMessage,
  isEditMode,
  onSave,
  onPreview,
  onNext,
  onClose,
}) => {
  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center">
          <svg viewBox="0 0 100 40" className="h-8 w-auto">
            <text x="35" y="28" fontSize="20" fill="#06b6d4" fontWeight="600">
              MPrint Studio
            </text>
          </svg>
        </div>

        {/* Product info */}
        <div className="flex flex-col border-l pl-4">
          <span className="text-xs text-cyan-600 font-semibold">
            Professional Design Editor
          </span>
          <span className="text-xs text-gray-500">
            {productName} • {isHorizontal ? 'Horizontal' : 'Vertical'} •{' '}
            {cardPreset.widthCm}×{cardPreset.heightCm}cm
          </span>
        </div>

        {/* Save status */}
        <div className="flex items-center gap-2 border-l pl-4">
          <div
            className={`w-2 h-2 rounded-full ${
              hasUnsavedChanges ? 'bg-yellow-400' : 'bg-green-500'
            }`}
          />
          <button
            onClick={onSave}
            disabled={isSaving}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            <IoSaveOutline size={16} />
            {isSaving ? 'Saving...' : saveMessage || 'Save'}
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 border-l pl-4">
          <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
            <IoArrowUndo size={16} />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
            <IoArrowRedo size={16} />
          </button>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onPreview}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <IoEyeOutline size={18} />
          Preview
        </button>
        <button
          onClick={onNext}
          className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg"
        >
          {isEditMode ? 'Update' : 'Next'}
        </button>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <IoClose size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
