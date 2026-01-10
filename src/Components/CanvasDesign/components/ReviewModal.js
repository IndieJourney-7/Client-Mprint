/**
 * ReviewModal Component
 * Preview modal with 3D flip card animation - VIEW ONLY (no action buttons)
 */

import { useState } from 'react';
import { IoClose } from 'react-icons/io5';

const ReviewModal = ({
  isOpen,
  onClose,
  frontImage,
  backImage,
  safeArea,
  cornerRadius = 0, // Corner radius in pixels
  isHorizontal,
  hasAnyDesign,
  hasBothDesigns,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  if (!isOpen) return null;

  // Guard against missing safeArea
  if (!safeArea || !safeArea.width || !safeArea.height) {
    console.error('[ReviewModal] Invalid safeArea:', safeArea);
    return null;
  }

  // Preview dimensions - scale to fit nicely in the modal
  // Use the actual safe area dimensions for proper aspect ratio
  const maxPreviewSize = 400; // Maximum dimension for good visibility
  const aspectRatio = safeArea.width / safeArea.height;
  
  let previewWidth, previewHeight;
  if (isHorizontal) {
    // Horizontal: width is larger
    previewWidth = maxPreviewSize;
    previewHeight = previewWidth / aspectRatio;
  } else {
    // Vertical: height is larger
    previewHeight = maxPreviewSize;
    previewWidth = previewHeight * aspectRatio;
  }

  // Scale factor for preview (how much we're scaling down from actual safe area size)
  const scaleX = previewWidth / safeArea.width;
  const scaleY = previewHeight / safeArea.height;

  // Helper to render image in preview - shows image exactly as positioned on canvas
  const renderImageInPreview = (imageData) => {
    if (!imageData) return null;

    // Image center is at (x, y), calculate top-left corner
    const imgLeft = imageData.x - imageData.width / 2;
    const imgTop = imageData.y - imageData.height / 2;
    
    // Position relative to safe area (safe area starts at safeMargin from canvas edge)
    const relX = imgLeft - safeArea.left;
    const relY = imgTop - safeArea.top;

    // Scale to preview size
    const previewX = relX * scaleX;
    const previewY = relY * scaleY;
    const previewW = imageData.width * scaleX;
    const previewH = imageData.height * scaleY;

    return (
      <img
        src={imageData.src}
        alt="Design"
        style={{
          position: 'absolute',
          left: `${previewX}px`,
          top: `${previewY}px`,
          width: `${previewW}px`,
          height: `${previewH}px`,
          maxWidth: 'none',
          maxHeight: 'none',
        }}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="relative max-w-2xl w-full">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/80 hover:text-white transition"
        >
          <IoClose size={32} />
        </button>

        {/* Preview container */}
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-8 flex flex-col items-center">
          <h2 className="text-white text-xl font-semibold mb-2">Preview Your Card</h2>
          <p className="text-gray-400 text-sm mb-1">
            Click card to flip • Safe area preview (print-ready)
          </p>
          <p className="text-gray-500 text-xs mb-6">
            Bleed area excluded • Final printed size
          </p>

          {/* 3D flip card - Sharp rectangle corners like actual printed card */}
          <div
            className="relative cursor-pointer mb-6"
            style={{
              width: `${previewWidth}px`,
              height: `${previewHeight}px`,
              perspective: '1200px',
            }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div
              className="w-full h-full transition-transform duration-700"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front face - Dynamic corners based on shape selection */}
              <div
                className="absolute inset-0 shadow-2xl bg-white"
                style={{
                  backfaceVisibility: 'hidden',
                  overflow: 'hidden',
                  borderRadius: cornerRadius > 0 ? `${cornerRadius}px` : '0',
                }}
              >
                {frontImage ? (
                  <div className="w-full h-full relative bg-white" style={{ overflow: 'hidden' }}>
                    {renderImageInPreview(frontImage)}
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <span className="text-lg">No Front Design</span>
                  </div>
                )}
              </div>

              {/* Back face - Dynamic corners based on shape selection */}
              <div
                className="absolute inset-0 shadow-2xl bg-white"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  overflow: 'hidden',
                  borderRadius: cornerRadius > 0 ? `${cornerRadius}px` : '0',
                }}
              >
                {backImage ? (
                  <div className="w-full h-full relative bg-white" style={{ overflow: 'hidden' }}>
                    {renderImageInPreview(backImage)}
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <span className="text-lg">No Back Design</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Front/Back toggle - Only viewing, no action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setIsFlipped(false)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition ${
                !isFlipped
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Front
            </button>
            <button
              onClick={() => setIsFlipped(true)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition ${
                isFlipped
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Back
            </button>
          </div>

          {/* Single side warning */}
          {!hasBothDesigns && hasAnyDesign && (
            <p className="text-yellow-400 text-xs mt-4">
              Note: {frontImage ? 'Back' : 'Front'} side will print blank
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
