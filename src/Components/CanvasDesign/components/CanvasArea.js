/**
 * CanvasArea Component
 * Main canvas editing area with image display, guides, and controls
 */

import React from 'react';
import {
  IoCloudUpload,
  IoWarning,
  IoLockClosed,
  IoCopy,
  IoTrashOutline,
  IoEllipsisHorizontal,
  IoMove,
  IoRefresh,
} from 'react-icons/io5';

const CanvasArea = ({
  canvasRef,
  cardPreset,
  canvasZoom,
  activeSide,
  currentImage,
  currentStatus,
  isSelected,
  uploading,
  cornerRadius = 0, // Corner radius in pixels (0 = sharp, >0 = rounded)
  // Text props
  textLayers = [],
  selectedTextId = null,
  onTextClick,
  onTextMouseDown,
  onTextDoubleClick,
  isEditingText = false,
  // Actions
  onFileSelect,
  onCanvasClick,
  onImageClick,
  onImageMouseDown,
  onDuplicateImage,
  onRemoveImage,
  // Drag handlers
  handleMouseDown,
  getResizeHandles,
  // Refs
  fileInputRef,
}) => {
  // Render resize handles
  const renderResizeHandles = () => {
    if (!currentImage || !isSelected) return null;

    const handles = getResizeHandles();

    return handles.map((handle) => (
      <div
        key={handle.id}
        className="absolute w-3 h-3 bg-white border-2 border-cyan-500 rounded-full cursor-pointer z-20"
        style={{
          left: handle.x - 6,
          top: handle.y - 6,
          cursor: handle.id === 'nw' || handle.id === 'se' ? 'nwse-resize' : 'nesw-resize',
        }}
        onMouseDown={(e) => handleMouseDown(e, 'resize', handle.id)}
      />
    ));
  };

  return (
    <main className="flex-1 bg-gray-200 flex flex-col items-center justify-center relative overflow-auto p-8">
      {/* Image toolbar */}
      {currentImage && isSelected && (
        <div
          className="absolute z-30 flex items-center gap-1 bg-white rounded-lg shadow-lg px-2 py-1.5 border"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            top: `calc(50% - ${(cardPreset.height * canvasZoom) / 100 / 2}px - 50px)`,
          }}
        >
          <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Lock">
            <IoLockClosed size={18} />
          </button>
          <button
            onClick={onDuplicateImage}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
            title="Duplicate"
          >
            <IoCopy size={18} />
          </button>
          <button
            onClick={onRemoveImage}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
            title="Delete"
          >
            <IoTrashOutline size={18} />
          </button>
          <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="More">
            <IoEllipsisHorizontal size={18} />
          </button>
        </div>
      )}

      {/* Guide labels */}
      <div className="absolute top-4 right-4 flex gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded border text-xs text-gray-600 shadow-sm">
          <div className="w-4 h-0 border-t-2 border-dashed border-green-500"></div>
          Safety Area
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded border text-xs text-gray-600 shadow-sm">
          <div className="w-4 h-0.5 bg-cyan-500"></div>
          Bleed
        </div>
      </div>

      {/* Canvas container */}
      <div className="relative">
        {/* Height label */}
        <div className="absolute -left-14 top-1/2 -translate-y-1/2 text-xs text-gray-500">
          {cardPreset.heightCm}cm
        </div>

        {/* Warning icon */}
        {currentImage && currentStatus.status === 'exceeds' && (
          <div className="absolute z-30 text-orange-500" style={{ right: -12, top: -12 }}>
            <IoWarning size={24} />
          </div>
        )}

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="relative bg-white shadow-xl"
          style={{
            width: cardPreset.width,
            height: cardPreset.height,
            transform: `scale(${canvasZoom / 100})`,
            transformOrigin: 'center',
            borderRadius: cornerRadius > 0 ? `${cornerRadius + cardPreset.safeMargin}px` : '0',
            overflow: 'hidden',
          }}
          onClick={onCanvasClick}
        >
          {/* Image */}
          {currentImage && (
            <>
              {/* Selection border */}
              {isSelected && (
                <div
                  className="absolute border-2 border-orange-500 pointer-events-none z-10"
                  style={{
                    left: currentImage.x - currentImage.width / 2 - 2,
                    top: currentImage.y - currentImage.height / 2 - 2,
                    width: currentImage.width + 4,
                    height: currentImage.height + 4,
                  }}
                />
              )}

              {/* Image element */}
              <img
                src={currentImage.src}
                alt={`${activeSide} design`}
                className="absolute cursor-move select-none"
                style={{
                  left: currentImage.x - currentImage.width / 2,
                  top: currentImage.y - currentImage.height / 2,
                  width: currentImage.width,
                  height: currentImage.height,
                  transform: `rotate(${currentImage.rotation}deg)`,
                }}
                draggable={false}
                onClick={onImageClick}
                onMouseDown={onImageMouseDown}
              />

              {/* Resize handles */}
              {renderResizeHandles()}

              {/* Move/Rotate controls */}
              {isSelected && (
                <div
                  className="absolute z-20 flex items-center gap-1 bg-white rounded-full shadow-lg px-2 py-1 border"
                  style={{
                    left: currentImage.x - 30,
                    top: currentImage.y + currentImage.height / 2 + 8,
                  }}
                >
                  <button className="p-1 text-cyan-600 hover:bg-cyan-50 rounded-full" title="Move">
                    <IoMove size={16} />
                  </button>
                  <button className="p-1 text-cyan-600 hover:bg-cyan-50 rounded-full" title="Rotate">
                    <IoRefresh size={16} />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Text Layers */}
          {console.log('[CanvasArea] Rendering text layers:', textLayers?.length || 0, textLayers)}
          {textLayers.map((textLayer) => {
            const isTextSelected = selectedTextId === textLayer.id;
            return (
              <div
                key={textLayer.id}
                className={`absolute cursor-move select-none ${
                  isTextSelected ? 'ring-2 ring-cyan-500 ring-offset-1' : ''
                }`}
                style={{
                  left: textLayer.x,
                  top: textLayer.y,
                  width: textLayer.width || 'auto',
                  minWidth: '50px',
                  transform: `rotate(${textLayer.rotation || 0}deg)`,
                  fontFamily: textLayer.fontFamily,
                  fontSize: `${textLayer.fontSize}px`,
                  fontWeight: textLayer.fontWeight,
                  fontStyle: textLayer.fontStyle,
                  color: textLayer.color,
                  textAlign: textLayer.textAlign,
                  textDecoration: textLayer.textDecoration,
                  lineHeight: textLayer.lineHeight,
                  letterSpacing: `${textLayer.letterSpacing}px`,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  padding: '4px 8px',
                  zIndex: isTextSelected ? 25 : 15,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onTextClick?.(textLayer.id);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onTextMouseDown?.(e, textLayer.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onTextDoubleClick?.(textLayer.id);
                }}
              >
                {textLayer.text}

                {/* Text selection handles */}
                {isTextSelected && (
                  <>
                    {/* Corner resize handles for text */}
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-cyan-500 rounded-full cursor-nw-resize" />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-cyan-500 rounded-full cursor-ne-resize" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-cyan-500 rounded-full cursor-sw-resize" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-cyan-500 rounded-full cursor-se-resize" />
                  </>
                )}
              </div>
            );
          })}

          {/* Safety area guide - with optional rounded corners */}
          <div
            className="absolute pointer-events-none z-10"
            style={{
              left: cardPreset.safeMargin,
              top: cardPreset.safeMargin,
              right: cardPreset.safeMargin,
              bottom: cardPreset.safeMargin,
              border: '2px dashed #22c55e',
              borderRadius: cornerRadius > 0 ? `${cornerRadius}px` : '0',
            }}
          />

          {/* Bleed area guide */}
          <div 
            className="absolute inset-0 border-2 border-cyan-500 pointer-events-none z-10" 
            style={{
              borderRadius: cornerRadius > 0 ? `${cornerRadius + cardPreset.safeMargin}px` : '0',
            }}
          />

          {/* Upload button (when no image) */}
          {!currentImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex flex-col items-center gap-3 px-8 py-6 bg-cyan-500 hover:bg-cyan-600 text-white rounded-2xl shadow-lg transition-all transform hover:scale-105"
              >
                {uploading ? (
                  <div className="animate-spin h-10 w-10 border-3 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <IoCloudUpload size={40} />
                    <span className="text-lg font-semibold">
                      Upload {activeSide === 'front' ? 'Front' : 'Back'} Design
                    </span>
                    <span className="text-sm text-cyan-100">JPG, PNG, WebP (max 25MB)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Width label */}
        <div className="absolute -bottom-10 left-0 right-0 flex items-center justify-center">
          <div className="flex-1 border-t border-dashed border-gray-400 mx-2"></div>
          <div className="flex items-center gap-1">
            <IoMove size={14} className="text-cyan-500" />
            <span className="text-xs text-gray-500">{cardPreset.widthCm}cm</span>
            <IoRefresh size={14} className="text-cyan-500" />
          </div>
          <div className="flex-1 border-t border-dashed border-gray-400 mx-2"></div>
        </div>

        {/* Rotate icon */}
        <div className="absolute -bottom-6 left-0 text-gray-400">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </div>
      </div>
    </main>
  );
};

export default CanvasArea;
