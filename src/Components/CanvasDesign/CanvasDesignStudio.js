/**
 * CanvasDesignStudio
 * Main orchestrator component that composes all canvas design functionality
 * 
 * This is the primary entry point for the canvas design editor.
 * It manages state coordination between sub-components and handles
 * the overall design workflow (upload → edit → preview → save).
 */

import React, { useState, useRef, useCallback } from 'react';
import { ZOOM_CONFIG } from './constants';
import { generateCompleteCardPreview } from './utils/imageHelpers';
import { useImageState, useCanvasDrag, useUploads, useDesignPersistence } from './hooks';
import {
  Header,
  Footer,
  Sidebar,
  ToolPanel,
  CanvasArea,
  SidePanel,
  ReviewModal,
  LoadingOverlay,
} from './components';

const CanvasDesignStudio = ({
  onDesignsChange,
  productName = 'Standard Visiting Cards',
  orientation = 'horizontal',
  printDimensions = null, // { print_length_inches, print_width_inches } from product
  cornerRadius = 0, // Corner radius in pixels (0 = sharp corners, >0 = rounded)
  onSave,
  onNext,
  onClose,
  productId,
  designId,
  sessionId, // Work session ID for persistent state
  initialFrontState = null,
  initialBackState = null,
  initialFrontImage = null,
  initialBackImage = null,
  isEditMode = false,
  className = '',
}) => {
  // Debug log on mount
  console.log('CanvasDesignStudio mounted with props:', {
    designId,
    initialFrontState,
    initialBackState,
    initialFrontImage,
    initialBackImage,
    orientation,
    printDimensions,
    cornerRadius,
  });

  // UI State
  const [activeToolId, setActiveToolId] = useState('uploads');
  const [canvasZoom, setCanvasZoom] = useState(ZOOM_CONFIG.default);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Refs
  const canvasRef = useRef(null);
  const exportCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Image state hook - pass printDimensions for dynamic canvas sizing
  const imageState = useImageState(orientation, printDimensions);
  const {
    frontImage,
    backImage,
    activeSide,
    currentImage,
    isSelected,
    hasUnsavedChanges,
    cardPreset,
    safeArea,
    isHorizontal,
    frontStatus,
    backStatus,
    currentStatus,
    hasAnyDesign,
    hasBothDesigns,
    setFrontImage,
    setBackImage,
    setIsSelected,
    setHasUnsavedChanges,
    updateCurrentImage,
    setImageForSide,
    switchSide,
    fitToSafeArea,
    fillSafeArea,
    fillCanvas,
    removeImage,
    duplicateImage,
  } = imageState;

  // Persistence hook
  const persistence = useDesignPersistence({
    designId,
    sessionId,
    safeArea,
    initialFrontState,
    initialBackState,
    initialFrontImage,
    initialBackImage,
    setFrontImage,
    setBackImage,
  });
  const {
    savingCanvasState,
    loadingInitialImages,
    pendingCopyPromise,
    setPendingCopyPromise,
    saveCanvasStateToServer,
  } = persistence;

  // Upload hook
  const uploads = useUploads({ safeArea, designId });
  const {
    recentUploads,
    loadingUploads,
    isLoggedIn,
    uploading,
    uploadError,
    activeUploadMenu,
    showImageDetails,
    setActiveUploadMenu,
    setShowImageDetails,
    processFileUpload,
    loadImageFromLibrary,
    deleteUploadFromLibrary,
  } = uploads;

  // Drag hook
  const drag = useCanvasDrag({
    currentImage,
    updateCurrentImage,
    canvasRef,
    canvasZoom,
    setHasUnsavedChanges,
  });
  const { handleMouseDown, getResizeHandles } = drag;

  // Notify parent of design changes with print-ready previews (safe area only)
  const notifyDesignChange = useCallback(async () => {
    console.log('[CanvasDesignStudio] Generating previews with:', {
      orientation,
      safeAreaWidth: safeArea.width,
      safeAreaHeight: safeArea.height,
      cardPresetWidth: cardPreset.width,
      cardPresetHeight: cardPreset.height,
      hasFrontImage: !!frontImage,
      hasBackImage: !!backImage,
      cornerRadius,
    });

    // CRITICAL DEBUG: Inspect actual image state before generating previews
    console.log('[CanvasDesignStudio] IMAGE STATE DETAILS:', {
      frontImage: frontImage,
      frontImageHasSrc: !!frontImage?.src,
      frontImageSrcLength: frontImage?.src?.length,
      frontImageSrcStart: frontImage?.src?.substring(0, 100),
      frontImageWidth: frontImage?.width,
      frontImageHeight: frontImage?.height,
      frontImageX: frontImage?.x,
      frontImageY: frontImage?.y,
      backImage: backImage,
      backImageHasSrc: !!backImage?.src,
      backImageSrcLength: backImage?.src?.length,
      backImageSrcStart: backImage?.src?.substring(0, 100),
    });

    // Generate complete card previews (full card with white margins - matches what user sees in canvas)
    const frontPreview = frontImage
      ? await generateCompleteCardPreview(frontImage, cardPreset, exportCanvasRef.current, cornerRadius)
      : null;

    const backPreview = backImage
      ? await generateCompleteCardPreview(backImage, cardPreset, exportCanvasRef.current, cornerRadius)
      : null;

    console.log('[CanvasDesignStudio] Generated previews:', {
      frontPreviewExists: !!frontPreview,
      backPreviewExists: !!backPreview,
      orientation,
    });

    onDesignsChange?.({
      front: frontImage
        ? { preview: frontPreview, hasContent: true, status: frontStatus }
        : { preview: null, hasContent: false, status: { isValid: false } },
      back: backImage
        ? { preview: backPreview, hasContent: true, status: backStatus }
        : { preview: null, hasContent: false, status: { isValid: false } },
      orientation,
      shape: cornerRadius > 0 ? 'rounded' : 'rectangle',
      cardDimensions: {
        width: safeArea.width,
        height: safeArea.height,
      },
    });
  }, [onDesignsChange, frontImage, backImage, frontStatus, backStatus, safeArea, cornerRadius, orientation, cardPreset]);

  // Notify on image changes
  React.useEffect(() => {
    notifyDesignChange();
  }, [frontImage, backImage, notifyDesignChange]);

  // Handle file upload
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadingSide = activeSide;
    
    try {
      const imageData = await processFileUpload(file, uploadingSide);
      setImageForSide(uploadingSide, imageData);
      setIsSelected(true);
    } catch (error) {
      console.error('Upload failed:', error);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle applying image from library
  const handleApplyFromLibrary = async (upload) => {
    const selectingSide = activeSide;
    const result = await loadImageFromLibrary(upload, selectingSide);
    
    if (result) {
      setImageForSide(selectingSide, result.imageData);
      setIsSelected(true);
      if (result.copyPromise) {
        setPendingCopyPromise(result.copyPromise);
      }
    }
  };

  // Zoom controls
  const handleZoomIn = () => setCanvasZoom((prev) => Math.min(prev + ZOOM_CONFIG.step, ZOOM_CONFIG.max));
  const handleZoomOut = () => setCanvasZoom((prev) => Math.max(prev - ZOOM_CONFIG.step, ZOOM_CONFIG.min));

  // Canvas click handler
  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) {
      setIsSelected(false);
    }
  };

  // Image click handler
  const handleImageClick = (e) => {
    e.stopPropagation();
    setIsSelected(true);
  };

  // Image mouse down handler
  const handleImageMouseDown = (e) => {
    setIsSelected(true);
    handleMouseDown(e, 'drag');
  };

  // Save handler
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // Generate complete card previews (full card with white margins - matches what user sees in canvas)
      const frontPrintReady = frontImage
        ? await generateCompleteCardPreview(frontImage, cardPreset, exportCanvasRef.current, cornerRadius)
        : null;
      const backPrintReady = backImage
        ? await generateCompleteCardPreview(backImage, cardPreset, exportCanvasRef.current, cornerRadius)
        : null;
      
      const designData = {
        product_id: productId,
        front_preview: frontPrintReady || frontImage?.src,
        back_preview: backPrintReady || backImage?.src,
        front_print_ready: frontPrintReady,
        back_print_ready: backPrintReady,
        orientation,
      };
      
      // Save via API
      const api = (await import('../../api/api')).default;
      await api.post('/api/designs/save', designData);
      
      setHasUnsavedChanges(false);
      setSaveMessage('Saved!');
      setTimeout(() => setSaveMessage(''), 2000);
      onSave?.(designData);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveMessage('Save failed');
      setTimeout(() => setSaveMessage(''), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  // Preview handler - Just open modal for viewing
  const handlePreview = () => {
    console.log('handlePreview called - opening review modal for viewing only');
    setShowReviewModal(true);
  };

  // Next/Continue handler - Actually proceed with saving and moving forward
  const handleNext = async () => {
    console.log('Continue button clicked!', {
      hasAnyDesign,
      savingCanvasState,
      frontImage: !!frontImage,
      backImage: !!backImage,
      isEditMode,
    });

    if (!hasAnyDesign) {
      console.warn('hasAnyDesign is false, cannot continue');
      return;
    }

    // Wait for pending copy operation
    if (pendingCopyPromise) {
      console.log('Waiting for pending copy operation...');
      try {
        await pendingCopyPromise;
        console.log('Pending copy completed');
      } catch (error) {
        console.error('Pending copy failed, but continuing:', error);
      }
    }

    // Save canvas state
    try {
      await saveCanvasStateToServer(frontImage, backImage);
    } catch (error) {
      console.error('Failed to save canvas state, but continuing:', error);
    }

    // Generate complete card preview images (full card with white margins - matches canvas view)
    let frontPreview = null;
    let backPreview = null;

    // CRITICAL DEBUG: Inspect image state before generating previews for handleNext
    console.log('[handleNext] IMAGE STATE BEFORE PREVIEW GENERATION:', {
      frontImage: frontImage,
      frontImageHasSrc: !!frontImage?.src,
      frontImageSrcLength: frontImage?.src?.length,
      frontImageSrcStart: frontImage?.src?.substring(0, 100),
      frontImageWidth: frontImage?.width,
      frontImageHeight: frontImage?.height,
      backImage: backImage,
      backImageHasSrc: !!backImage?.src,
      backImageSrcLength: backImage?.src?.length,
      cardPresetWidth: cardPreset.width,
      cardPresetHeight: cardPreset.height,
    });

    try {
      if (frontImage) {
        console.log('[handleNext] Calling generateCompleteCardPreview for FRONT...');
        frontPreview = await generateCompleteCardPreview(frontImage, cardPreset, exportCanvasRef.current, cornerRadius);
        console.log('[handleNext] Front preview generated, length:', frontPreview?.length);
      }
      if (backImage) {
        console.log('[handleNext] Calling generateCompleteCardPreview for BACK...');
        backPreview = await generateCompleteCardPreview(backImage, cardPreset, exportCanvasRef.current, cornerRadius);
        console.log('[handleNext] Back preview generated, length:', backPreview?.length);
      }
    } catch (error) {
      console.error('Failed to generate preview images:', error);
    }

    setShowReviewModal(false);

    const designData = {
      front: frontImage
        ? {
            preview: frontPreview || frontImage.src,
            hasContent: true,
            canvasState: frontImage,
          }
        : { preview: null, hasContent: false },
      back: backImage
        ? {
            preview: backPreview || backImage.src,
            hasContent: true,
            canvasState: backImage,
          }
        : { preview: null, hasContent: false },
      designId,
      showSuccessToast: isEditMode,
    };

    console.log('Calling onNext with design data:', designData);

    if (onNext) {
      try {
        await onNext(designData);
      } catch (error) {
        console.error('onNext failed:', error);
      }
    } else {
      console.error('onNext callback is not defined!');
    }
  };

  return (
    <div className={`flex flex-col h-screen bg-white ${className}`}>
      {/* Loading overlay */}
      <LoadingOverlay isLoading={loadingInitialImages} />

      {/* Hidden canvas for export */}
      <canvas ref={exportCanvasRef} className="hidden" />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <Header
        productName={productName}
        isHorizontal={isHorizontal}
        cardPreset={cardPreset}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        saveMessage={saveMessage}
        isEditMode={isEditMode}
        onSave={handleSave}
        onPreview={handlePreview}
        onNext={handleNext}
        onClose={onClose}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <Sidebar activeToolId={activeToolId} onToolSelect={setActiveToolId} />

        {/* Tool panel */}
        <ToolPanel
          activeToolId={activeToolId}
          activeSide={activeSide}
          currentImage={currentImage}
          currentStatus={currentStatus}
          uploading={uploading}
          uploadError={uploadError}
          isLoggedIn={isLoggedIn}
          loadingUploads={loadingUploads}
          recentUploads={recentUploads}
          activeUploadMenu={activeUploadMenu}
          showImageDetails={showImageDetails}
          onFileSelect={handleFileSelect}
          onApplyFromLibrary={handleApplyFromLibrary}
          onDeleteUpload={deleteUploadFromLibrary}
          setActiveUploadMenu={setActiveUploadMenu}
          setShowImageDetails={setShowImageDetails}
          onFillSafeArea={fillSafeArea}
          onFitToSafeArea={fitToSafeArea}
          onFillCanvas={fillCanvas}
          onRemoveImage={removeImage}
        />

        {/* Canvas area */}
        <CanvasArea
          canvasRef={canvasRef}
          cardPreset={cardPreset}
          canvasZoom={canvasZoom}
          activeSide={activeSide}
          currentImage={currentImage}
          currentStatus={currentStatus}
          isSelected={isSelected}
          uploading={uploading}
          cornerRadius={cornerRadius}
          onFileSelect={handleFileSelect}
          onCanvasClick={handleCanvasClick}
          onImageClick={handleImageClick}
          onImageMouseDown={handleImageMouseDown}
          onDuplicateImage={duplicateImage}
          onRemoveImage={removeImage}
          handleMouseDown={handleMouseDown}
          getResizeHandles={getResizeHandles}
          fileInputRef={fileInputRef}
        />

        {/* Side panel */}
        <SidePanel
          frontImage={frontImage}
          backImage={backImage}
          frontStatus={frontStatus}
          backStatus={backStatus}
          activeSide={activeSide}
          onSwitchSide={switchSide}
        />
      </div>

      {/* Footer */}
      <Footer canvasZoom={canvasZoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />

      {/* Review modal - View only, no action buttons */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        frontImage={frontImage}
        backImage={backImage}
        safeArea={safeArea}
        cornerRadius={cornerRadius}
        isHorizontal={isHorizontal}
        hasAnyDesign={hasAnyDesign}
        hasBothDesigns={hasBothDesigns}
      />
    </div>
  );
};

export default CanvasDesignStudio;
