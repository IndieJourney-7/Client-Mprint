/**
 * ToolPanel Component
 * Side panel that displays tool-specific content (uploads, templates, text, etc.)
 */

import React, { useRef } from 'react';
import {
  IoCloudUpload,
  IoAlertCircle,
  IoApps,
  IoSettingsOutline,
  IoCheckmarkCircle,
  IoMove,
  IoTrashOutline,
  IoEllipsisHorizontal,
} from 'react-icons/io5';
import { FaRegImages } from 'react-icons/fa';
import { ALLOWED_TYPES } from '../constants';
import { getStatusDisplay } from '../utils/imageHelpers';
import UploadMenu from './UploadMenu';
import ImageDetailsModal from './ImageDetailsModal';
import TextToolPanel from './TextToolPanel';
import TemplateToolPanel from './TemplateToolPanel';

const ToolPanel = ({
  activeToolId,
  activeSide,
  currentImage,
  currentStatus,
  // Upload state
  uploading,
  uploadError,
  isLoggedIn,
  loadingUploads,
  recentUploads,
  activeUploadMenu,
  showImageDetails,
  // Actions
  onFileSelect,
  onApplyFromLibrary,
  onDeleteUpload,
  setActiveUploadMenu,
  setShowImageDetails,
  // Image controls
  onFillSafeArea,
  onFitToSafeArea,
  onFillCanvas,
  onRemoveImage,
  // Text props
  currentTextLayers = [],
  selectedTextLayer = null,
  onAddText,
  onUpdateText,
  onRemoveText,
  onSelectText,
  // Template props
  currentTemplate = null,
  selectedColorVariant = null,
  onApplyTemplate,
  onSelectColorVariant,
  productId,
}) => {
  const fileInputRef = useRef(null);

  // Render uploads panel
  const renderUploadsPanel = () => {
    const statusDisplay = getStatusDisplay(currentStatus);
    const StatusIcon = statusDisplay.icon;

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Uploads</h3>
          <button className="text-gray-400 hover:text-gray-600">
            <IoApps size={16} />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Upload your design or choose from recent uploads.
        </p>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={onFileSelect}
          className="hidden"
        />

        {/* Upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full py-3 bg-cyan-400 hover:bg-cyan-500 text-black font-semibold rounded-lg transition flex items-center justify-center gap-2"
        >
          {uploading ? (
            <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" />
          ) : (
            <>
              <IoCloudUpload size={20} />
              Upload {activeSide === 'front' ? 'Front' : 'Back'} Design
            </>
          )}
        </button>

        {/* Upload error */}
        {uploadError && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600 flex items-center gap-2">
            <IoAlertCircle size={16} />
            {uploadError}
          </div>
        )}

        {/* Recent uploads grid */}
        {isLoggedIn && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Recent Uploads</h4>
              {recentUploads.length > 0 && (
                <span className="text-xs text-gray-400">
                  {recentUploads.length} images
                </span>
              )}
            </div>

            {loadingUploads ? (
              <div className="grid grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-gray-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : recentUploads.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto overflow-x-visible pr-1 relative">
                {recentUploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="aspect-square rounded-lg border-2 border-transparent hover:border-cyan-400 transition-all group relative bg-gray-100"
                  >
                    <img
                      src={upload.thumbnail_url || upload.file_url}
                      alt={upload.original_name}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src =
                          'https://via.placeholder.com/100x100?text=Error';
                      }}
                    />

                    {/* Menu button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveUploadMenu(
                          activeUploadMenu === upload.id ? null : upload.id
                        );
                      }}
                      className="absolute top-1 right-1 p-1.5 bg-white hover:bg-gray-50 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all z-10 border border-gray-200"
                      title="More options"
                    >
                      <IoEllipsisHorizontal size={12} className="text-gray-700" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <FaRegImages className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-xs text-gray-400">No uploads yet</p>
                <p className="text-xs text-gray-400">
                  Upload an image to see it here
                </p>
              </div>
            )}
          </div>
        )}

        {/* Upload menu dropdown */}
        <UploadMenu
          activeUploadMenu={activeUploadMenu}
          recentUploads={recentUploads}
          activeSide={activeSide}
          onClose={() => setActiveUploadMenu(null)}
          onShowDetails={(upload) => {
            setShowImageDetails(upload);
            setActiveUploadMenu(null);
          }}
          onApplyImage={(upload) => {
            onApplyFromLibrary(upload);
            setActiveUploadMenu(null);
          }}
          onDeleteUpload={(uploadId, e) => {
            onDeleteUpload(uploadId, e);
            setActiveUploadMenu(null);
          }}
        />

        {/* Image details modal */}
        <ImageDetailsModal
          image={showImageDetails}
          onClose={() => setShowImageDetails(null)}
          onUseImage={(upload) => {
            onApplyFromLibrary(upload);
            setShowImageDetails(null);
          }}
        />

        {/* Status indicator */}
        {currentImage && (
          <div
            className={`mt-4 p-3 ${statusDisplay.bg} ${statusDisplay.border} border rounded-lg`}
          >
            <div className={`flex items-center gap-2 ${statusDisplay.color}`}>
              <StatusIcon size={18} />
              <span className="text-sm font-medium">{currentStatus.message}</span>
            </div>
          </div>
        )}

        {/* Image controls */}
        {currentImage && (
          <div className="mt-4 space-y-3">
            {/* Quick fit buttons */}
            <div className="space-y-2">
              <button
                onClick={onFillSafeArea}
                className="w-full py-2.5 px-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <IoCheckmarkCircle size={16} />
                Fill Safe Area (Recommended)
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onFitToSafeArea}
                  className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition"
                  title="Fit entire image within safe area - may have white space"
                >
                  Fit to Safe Area
                </button>
                <button
                  onClick={onFillCanvas}
                  className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition"
                  title="Fill entire canvas including bleed area"
                >
                  Fill Canvas
                </button>
              </div>
            </div>

            {/* Drag instructions */}
            <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
              <div className="flex items-center gap-2 text-cyan-700">
                <IoMove size={16} />
                <span className="text-sm font-medium">Drag to Move</span>
              </div>
              <p className="text-xs text-cyan-600 mt-1">
                Click image to select, drag to move, use corners to resize.
              </p>
            </div>

            {/* Remove button */}
            <button
              onClick={onRemoveImage}
              className="w-full py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm flex items-center justify-center gap-1.5"
            >
              <IoTrashOutline size={14} />
              Remove Image
            </button>
          </div>
        )}

        {/* Print area guide */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 space-y-2">
          <p className="font-medium">Print Area Guide:</p>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0 border-t-2 border-dashed border-green-500"></div>
            <span>Safe Area - Keep important content here</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-cyan-500"></div>
            <span>Bleed Line - Content here may be trimmed</span>
          </div>
        </div>
      </div>
    );
  };

  // Render template panel (placeholder)
  const renderTemplatePanel = () => {
    return (
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 capitalize mb-3">
          {activeToolId.replace('-', ' ')}
        </h3>
        <div className="p-6 bg-gray-50 rounded-lg text-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
            <IoSettingsOutline size={24} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">Coming soon...</p>
        </div>
      </div>
    );
  };

  // Render text panel
  const renderTextPanel = () => {
    console.log('[ToolPanel] renderTextPanel with:', {
      currentTextLayersCount: currentTextLayers?.length || 0,
      currentTextLayers,
    });
    return (
      <TextToolPanel
        activeSide={activeSide}
        currentTextLayers={currentTextLayers}
        selectedTextLayer={selectedTextLayer}
        onAddText={onAddText}
        onUpdateText={onUpdateText}
        onRemoveText={onRemoveText}
        onSelectText={onSelectText}
      />
    );
  };

  // Render template panel with actual template functionality
  const renderTemplateToolPanel = () => {
    return (
      <TemplateToolPanel
        activeSide={activeSide}
        currentTemplate={currentTemplate}
        selectedColorVariant={selectedColorVariant}
        onApplyTemplate={onApplyTemplate}
        onSelectColorVariant={onSelectColorVariant}
        productId={productId}
      />
    );
  };

  // Render panel based on active tool
  const renderActivePanel = () => {
    switch (activeToolId) {
      case 'uploads':
        return renderUploadsPanel();
      case 'text':
        return renderTextPanel();
      case 'template':
        return renderTemplateToolPanel();
      case 'graphics':
      case 'background':
      case 'template-color':
      case 'qr-codes':
      default:
        return renderTemplatePanel();
    }
  };

  return (
    <aside className="w-72 bg-white border-r overflow-y-auto">
      {renderActivePanel()}
    </aside>
  );
};

export default ToolPanel;
