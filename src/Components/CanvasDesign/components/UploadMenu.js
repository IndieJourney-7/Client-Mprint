/**
 * UploadMenu Component
 * Dropdown menu for upload items in the library
 */

import React from 'react';
import { IoTrashOutline } from 'react-icons/io5';

const UploadMenu = ({
  activeUploadMenu,
  recentUploads,
  activeSide,
  onClose,
  onShowDetails,
  onApplyImage,
  onDeleteUpload,
}) => {
  if (!activeUploadMenu) return null;

  const activeUpload = recentUploads.find((u) => u.id === activeUploadMenu);
  if (!activeUpload) return null;

  // Position: left sidebar (64px) + tool panel (288px) + gap
  const leftOffset = 64 + 288 + 20;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[100]" onClick={onClose} />

      {/* Menu */}
      <div
        className="fixed z-[101] bg-white rounded-xl shadow-2xl border border-gray-200 py-2 w-[220px]"
        style={{
          top: '50%',
          left: `${leftOffset}px`,
          transform: 'translateY(-50%)',
        }}
      >
        {/* Image preview header */}
        <div className="px-3 pb-3 mb-2 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <img
              src={activeUpload.thumbnail_url || activeUpload.file_url}
              alt=""
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {activeUpload.original_name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {activeUpload.created_at
                  ? new Date(activeUpload.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Uploaded recently'}
              </p>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowDetails(activeUpload);
          }}
          className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Details
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onApplyImage(activeUpload);
          }}
          className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Add to {activeSide === 'front' ? 'Front' : 'Back'} Design
        </button>

        <div className="my-1.5 border-t border-gray-100" />

        <button
          onClick={(e) => onDeleteUpload(activeUpload.id, e)}
          className="w-full px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
        >
          <IoTrashOutline size={16} className="text-red-500" />
          Move to Trash
        </button>
      </div>
    </>
  );
};

export default UploadMenu;
