/**
 * ImageDetailsModal Component
 * Modal showing detailed information about an uploaded image
 */

import React from 'react';
import { IoClose } from 'react-icons/io5';

const ImageDetailsModal = ({ image, onClose, onUseImage }) => {
  if (!image) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 w-80 max-w-[90vw] overflow-hidden">
        {/* Image preview */}
        <div className="relative">
          <img
            src={image.file_url}
            alt={image.original_name}
            className="w-full h-40 object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition"
          >
            <IoClose size={18} />
          </button>
        </div>

        {/* Details */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-800 truncate mb-3">
            {image.original_name}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Type</span>
              <span className="font-medium text-gray-800">
                {image.mime_type || 'Image'}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Size</span>
              <span className="font-medium text-gray-800">
                {image.file_size
                  ? `${(image.file_size / 1024).toFixed(1)} KB`
                  : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Uploaded</span>
              <span className="font-medium text-gray-800">
                {image.created_at
                  ? new Date(image.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Unknown'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => onUseImage(image)}
              className="py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition"
            >
              Use Image
            </button>
            <button
              onClick={onClose}
              className="py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ImageDetailsModal;
