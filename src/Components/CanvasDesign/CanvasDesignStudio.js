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
import { useImageState, useCanvasDrag, useUploads, useDesignPersistence, useTextState } from './hooks';
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
  // Text layers to restore when editing from cart
  initialFrontTextLayers = null,
  initialBackTextLayers = null,
  isEditMode = false,
  className = '',
  // Template props (when coming from TemplatePreview)
  templateData = null, // { template, colorVariant }
}) => {
  // CRITICAL: Determine if we should skip loading the preview image
  // We skip the preview image when:
  // 1. It's a template-based design (preview has text baked in from template)
  // 2. We have text layers to restore (preview has user's text baked in)
  // In both cases, we load the original template/background and restore text layers separately
  const isTemplateBasedDesign = !!(templateData?.template);
  const hasTextLayersToRestore = (initialFrontTextLayers?.length > 0) || (initialBackTextLayers?.length > 0);
  const shouldSkipPreviewImage = isTemplateBasedDesign || hasTextLayersToRestore;

  // Debug log on mount and prop changes
  console.log('[CanvasDesignStudio] Props received:', {
    designId,
    isEditMode,
    isTemplateBasedDesign,
    hasTextLayersToRestore,
    shouldSkipPreviewImage,
    initialFrontState: initialFrontState ? 'present' : 'null',
    initialBackState: initialBackState ? 'present' : 'null',
    initialFrontImage: initialFrontImage ? initialFrontImage.substring(0, 50) + '...' : 'null',
    initialBackImage: initialBackImage ? initialBackImage.substring(0, 50) + '...' : 'null',
    initialFrontTextLayers: initialFrontTextLayers?.length || 0,
    initialBackTextLayers: initialBackTextLayers?.length || 0,
    templateData: templateData ? 'present' : 'null',
    templateFrontUrl: templateData?.template?.front_template_url || templateData?.colorVariant?.front_template_url || 'null',
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

  // Template state
  const [currentTemplate, setCurrentTemplate] = useState(templateData?.template || null);
  const [selectedColorVariant, setSelectedColorVariant] = useState(templateData?.colorVariant || null);

  // Real-time preview state (includes text layers rendered)
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

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
    hasAnyDesign: hasAnyImageDesign,
    hasBothDesigns: hasBothImageDesigns,
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
  // CRITICAL: DON'T load the preview image when we have text layers to restore
  // The preview image has text BAKED IN - loading it would show duplicate/non-editable text
  // Instead, we load the original template background and restore text layers as editor objects
  const persistence = useDesignPersistence({
    designId,
    sessionId,
    safeArea,
    initialFrontState,
    initialBackState,
    // Skip preview image if it has text baked in (template-based OR has text layers)
    initialFrontImage: shouldSkipPreviewImage ? null : initialFrontImage,
    initialBackImage: shouldSkipPreviewImage ? null : initialBackImage,
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

  // Text state hook
  const textState = useTextState(cardPreset);
  const {
    frontTextLayers,
    backTextLayers,
    currentTextLayers,
    selectedTextId,
    selectedTextLayer,
    isEditingText,
    addTextLayer,
    addTextLayerToSide, // For restoring saved text layers
    updateTextLayer,
    removeTextLayer,
    selectTextLayer,
    deselectText,
    switchTextSide,
    moveTextLayer,
    setIsEditingText,
    clearAllText,
  } = textState;

  // Sync text side with active canvas side
  React.useEffect(() => {
    switchTextSide(activeSide);
  }, [activeSide, switchTextSide]);

  // Track if we've restored text layers using a ref to avoid stale closure issues
  const hasRestoredTextLayersRef = React.useRef(false);
  // Also keep state version for triggering re-renders after restoration
  const [textRestorationComplete, setTextRestorationComplete] = React.useState(false);

  // Debug: Log text state on every render to track text layer restoration
  console.log('[CanvasDesignStudio] TEXT STATE DEBUG:', {
    currentTextLayersCount: currentTextLayers?.length || 0,
    frontTextLayersCount: frontTextLayers?.length || 0,
    backTextLayersCount: backTextLayers?.length || 0,
    hasRestoredTextLayers: hasRestoredTextLayersRef.current,
    textRestorationComplete,
    initialFrontTextLayersCount: initialFrontTextLayers?.length || 0,
    initialBackTextLayersCount: initialBackTextLayers?.length || 0,
    activeSide,
    isEditMode,
    cardPresetWidth: cardPreset?.width,
  });

  // Restore initial text layers when editing from cart
  // CRITICAL: This must recreate text layers as editor-managed objects using addTextLayerToSide
  React.useEffect(() => {
    // Use ref to prevent multiple restorations (avoids stale closure issues with useState)
    if (hasRestoredTextLayersRef.current) {
      console.log('[CanvasDesignStudio] Text restoration - already completed, skipping');
      return;
    }

    // Check if we have text layers to restore
    const hasFrontText = Array.isArray(initialFrontTextLayers) && initialFrontTextLayers.length > 0;
    const hasBackText = Array.isArray(initialBackTextLayers) && initialBackTextLayers.length > 0;

    if (!hasFrontText && !hasBackText) {
      console.log('[CanvasDesignStudio] Text restoration - no text layers to restore');
      return;
    }

    // Wait for cardPreset to be ready
    if (!cardPreset?.width) {
      console.log('[CanvasDesignStudio] Text restoration - waiting for cardPreset...');
      return;
    }

    console.log('[CanvasDesignStudio] ✅ STARTING TEXT RESTORATION:', {
      frontCount: initialFrontTextLayers?.length || 0,
      backCount: initialBackTextLayers?.length || 0,
      cardPresetWidth: cardPreset.width,
    });

    // Mark as restored IMMEDIATELY using ref (prevents race conditions)
    hasRestoredTextLayersRef.current = true;

    // Clear existing text layers first
    clearAllText();

    // SYNCHRONOUSLY restore text layers after a microtask to let clearAllText settle
    // Using Promise.resolve().then() instead of setTimeout for faster, more reliable timing
    Promise.resolve().then(() => {
      console.log('[CanvasDesignStudio] Restoring front text layers...');

      // Restore FRONT text layers
      if (hasFrontText) {
        initialFrontTextLayers.forEach((layer, index) => {
          console.log(`[CanvasDesignStudio] Adding front layer ${index + 1}:`, layer.text, layer.id);
          addTextLayerToSide('front', {
            ...layer,
            // Ensure all required properties are present
            id: layer.id,
            text: layer.text || 'Text',
            x: layer.x,
            y: layer.y,
            width: layer.width || 200,
            height: layer.height || 40,
            rotation: layer.rotation || 0,
            fontFamily: layer.fontFamily || 'Arial',
            fontSize: layer.fontSize || 24,
            fontWeight: layer.fontWeight || 'normal',
            fontStyle: layer.fontStyle || 'normal',
            textAlign: layer.textAlign || 'left',
            color: layer.color || '#000000',
            lineHeight: layer.lineHeight || 1.2,
            letterSpacing: layer.letterSpacing || 0,
            textDecoration: layer.textDecoration || 'none',
          });
        });
      }

      // Restore BACK text layers
      if (hasBackText) {
        console.log('[CanvasDesignStudio] Restoring back text layers...');
        initialBackTextLayers.forEach((layer, index) => {
          console.log(`[CanvasDesignStudio] Adding back layer ${index + 1}:`, layer.text, layer.id);
          addTextLayerToSide('back', {
            ...layer,
            id: layer.id,
            text: layer.text || 'Text',
            x: layer.x,
            y: layer.y,
            width: layer.width || 200,
            height: layer.height || 40,
            rotation: layer.rotation || 0,
            fontFamily: layer.fontFamily || 'Arial',
            fontSize: layer.fontSize || 24,
            fontWeight: layer.fontWeight || 'normal',
            fontStyle: layer.fontStyle || 'normal',
            textAlign: layer.textAlign || 'left',
            color: layer.color || '#000000',
            lineHeight: layer.lineHeight || 1.2,
            letterSpacing: layer.letterSpacing || 0,
            textDecoration: layer.textDecoration || 'none',
          });
        });
      }

      // Mark restoration complete to trigger re-render
      setTextRestorationComplete(true);
      console.log('[CanvasDesignStudio] ✅ TEXT RESTORATION COMPLETE');
    });

  }, [initialFrontTextLayers, initialBackTextLayers, cardPreset, addTextLayerToSide, clearAllText]);

  // Handle text click
  const handleTextClick = (textId) => {
    selectTextLayer(textId);
    setIsSelected(false); // Deselect image when text is selected
  };

  // Handle text mouse down for dragging
  const handleTextMouseDown = (e, textId) => {
    selectTextLayer(textId);
    setIsSelected(false);

    const startX = e.clientX;
    const startY = e.clientY;
    const textLayer = currentTextLayers.find(t => t.id === textId);
    if (!textLayer) return;

    const startLayerX = textLayer.x;
    const startLayerY = textLayer.y;

    const handleMouseMove = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / (canvasZoom / 100);
      const dy = (moveEvent.clientY - startY) / (canvasZoom / 100);
      moveTextLayer(textId, startLayerX + dx, startLayerY + dy);
      setHasUnsavedChanges(true);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle text double click for inline editing
  const handleTextDoubleClick = (textId) => {
    selectTextLayer(textId);
    setIsEditingText(true);
  };

  // Handle template application
  const handleApplyTemplate = useCallback((template, colorVariant) => {
    setCurrentTemplate(template);
    setSelectedColorVariant(colorVariant);

    // Get the image URL from template or color variant
    const frontImageUrl = colorVariant?.front_template_url || template?.front_template_url || template?.preview_url;
    const backImageUrl = colorVariant?.back_template_url || template?.back_template_url;

    // Load template images as background
    if (frontImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const imageData = {
          src: frontImageUrl,
          x: cardPreset.width / 2,
          y: cardPreset.height / 2,
          width: cardPreset.width,
          height: cardPreset.height,
          rotation: 0,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        };
        setImageForSide('front', imageData);
      };
      img.src = frontImageUrl;
    }

    if (backImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const imageData = {
          src: backImageUrl,
          x: cardPreset.width / 2,
          y: cardPreset.height / 2,
          width: cardPreset.width,
          height: cardPreset.height,
          rotation: 0,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        };
        setImageForSide('back', imageData);
      };
      img.src = backImageUrl;
    }

    setHasUnsavedChanges(true);
  }, [cardPreset, setImageForSide, setHasUnsavedChanges]);

  // Handle color variant selection
  const handleSelectColorVariant = useCallback((colorVariant) => {
    setSelectedColorVariant(colorVariant);
    if (currentTemplate) {
      handleApplyTemplate(currentTemplate, colorVariant);
    }
  }, [currentTemplate, handleApplyTemplate]);

  // Track if we've loaded template to prevent re-loading
  const [hasLoadedTemplate, setHasLoadedTemplate] = React.useState(false);

  // Auto-load template images when templateData becomes available
  // This handles both: 1) coming from TemplatePreview, 2) editing from Cart with template
  React.useEffect(() => {
    console.log('[CanvasDesignStudio] Template auto-load effect check:', {
      hasLoadedTemplate,
      hasFrontImage: !!frontImage,
      hasBackImage: !!backImage,
      hasTemplateData: !!templateData,
      cardPresetWidth: cardPreset.width,
    });

    // Skip if we already loaded template
    if (hasLoadedTemplate) {
      console.log('[CanvasDesignStudio] Skipping template load - already loaded');
      return;
    }
    // Skip if we already have images loaded
    if (frontImage || backImage) {
      console.log('[CanvasDesignStudio] Skipping template load - images already exist');
      return;
    }
    // Need templateData and cardPreset to load template
    if (!templateData || !cardPreset.width) {
      console.log('[CanvasDesignStudio] Skipping template load - missing templateData or cardPreset');
      return;
    }

    console.log('[CanvasDesignStudio] ✅ Auto-loading template from templateData:', templateData);
    const { template, colorVariant } = templateData;
    if (template) {
      // Use setTimeout to ensure cardPreset is properly initialized
      setTimeout(() => {
        console.log('[CanvasDesignStudio] ✅ Calling handleApplyTemplate...');
        handleApplyTemplate(template, colorVariant);
        setHasLoadedTemplate(true);
      }, 100);
    }
  }, [templateData, cardPreset.width, hasLoadedTemplate, frontImage, backImage, handleApplyTemplate]);

  // Compute hasAnyDesign and hasBothDesigns including text layers
  const { front: frontTextLayersAll, back: backTextLayersAll } = textState.getAllTextLayers();
  const hasFrontContent = !!(frontImage || frontTextLayersAll.length > 0);
  const hasBackContent = !!(backImage || backTextLayersAll.length > 0);
  const hasAnyDesign = hasFrontContent || hasBackContent || hasAnyImageDesign;
  const hasBothDesigns = (hasFrontContent && hasBackContent) || hasBothImageDesigns;

  // Real-time preview generation with debouncing
  // This generates previews whenever images or text change
  React.useEffect(() => {
    // Debounce timer ref
    let debounceTimer;

    const generatePreviews = async () => {
      if (!exportCanvasRef.current || !cardPreset.width) return;

      setIsGeneratingPreview(true);

      try {
        // Generate front preview
        if (frontImage || frontTextLayersAll.length > 0) {
          const preview = await generateCompleteCardPreview(
            frontImage,
            cardPreset,
            exportCanvasRef.current,
            cornerRadius,
            frontTextLayersAll
          );
          setFrontPreview(preview);
        } else {
          setFrontPreview(null);
        }

        // Generate back preview
        if (backImage || backTextLayersAll.length > 0) {
          const preview = await generateCompleteCardPreview(
            backImage,
            cardPreset,
            exportCanvasRef.current,
            cornerRadius,
            backTextLayersAll
          );
          setBackPreview(preview);
        } else {
          setBackPreview(null);
        }
      } catch (error) {
        console.error('[CanvasDesignStudio] Error generating previews:', error);
      } finally {
        setIsGeneratingPreview(false);
      }
    };

    // Debounce preview generation (150ms delay for text typing, immediate for image changes)
    debounceTimer = setTimeout(generatePreviews, 150);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [frontImage, backImage, frontTextLayersAll, backTextLayersAll, cardPreset, cornerRadius]);

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

    // Get text layers for each side
    const { front: frontTextLayers, back: backTextLayers } = textState.getAllTextLayers();

    // Generate complete card previews (full card with white margins - matches what user sees in canvas)
    const frontPreview = frontImage || frontTextLayers.length > 0
      ? await generateCompleteCardPreview(frontImage, cardPreset, exportCanvasRef.current, cornerRadius, frontTextLayers)
      : null;

    const backPreview = backImage || backTextLayers.length > 0
      ? await generateCompleteCardPreview(backImage, cardPreset, exportCanvasRef.current, cornerRadius, backTextLayers)
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
      // Get text layers for each side
      const { front: frontTextLayersForSave, back: backTextLayersForSave } = textState.getAllTextLayers();

      // Generate complete card previews (full card with white margins - matches what user sees in canvas)
      const frontPrintReady = frontImage || frontTextLayersForSave.length > 0
        ? await generateCompleteCardPreview(frontImage, cardPreset, exportCanvasRef.current, cornerRadius, frontTextLayersForSave)
        : null;
      const backPrintReady = backImage || backTextLayersForSave.length > 0
        ? await generateCompleteCardPreview(backImage, cardPreset, exportCanvasRef.current, cornerRadius, backTextLayersForSave)
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

    // Get text layers for saving
    const { front: frontTextLayersToSave, back: backTextLayersToSave } = textState.getAllTextLayers();

    // Save canvas state including text layers for complete state restoration during edit
    try {
      await saveCanvasStateToServer(frontImage, backImage, frontTextLayersToSave, backTextLayersToSave);
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

    // Get text layers for preview generation
    const { front: frontTextLayersForNext, back: backTextLayersForNext } = textState.getAllTextLayers();

    try {
      if (frontImage || frontTextLayersForNext.length > 0) {
        console.log('[handleNext] Calling generateCompleteCardPreview for FRONT...');
        frontPreview = await generateCompleteCardPreview(frontImage, cardPreset, exportCanvasRef.current, cornerRadius, frontTextLayersForNext);
        console.log('[handleNext] Front preview generated, length:', frontPreview?.length);
      }
      if (backImage || backTextLayersForNext.length > 0) {
        console.log('[handleNext] Calling generateCompleteCardPreview for BACK...');
        backPreview = await generateCompleteCardPreview(backImage, cardPreset, exportCanvasRef.current, cornerRadius, backTextLayersForNext);
        console.log('[handleNext] Back preview generated, length:', backPreview?.length);
      }
    } catch (error) {
      console.error('Failed to generate preview images:', error);
    }

    setShowReviewModal(false);

    // Check if we have content (image or text) on each side
    const hasFrontContentForNext = !!(frontImage || frontTextLayersForNext.length > 0);
    const hasBackContentForNext = !!(backImage || backTextLayersForNext.length > 0);

    const designData = {
      front: hasFrontContentForNext
        ? {
            preview: frontPreview || frontImage?.src,
            hasContent: true,
            canvasState: frontImage,
            textLayers: frontTextLayersForNext,
          }
        : { preview: null, hasContent: false, textLayers: [] },
      back: hasBackContentForNext
        ? {
            preview: backPreview || backImage?.src,
            hasContent: true,
            canvasState: backImage,
            textLayers: backTextLayersForNext,
          }
        : { preview: null, hasContent: false, textLayers: [] },
      designId,
      showSuccessToast: isEditMode,
      // Include full design metadata for cart
      orientation,
      shape: cornerRadius > 0 ? 'rounded' : 'rectangle',
      cardDimensions: {
        width: safeArea.width,
        height: safeArea.height,
      },
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
          // Text props
          currentTextLayers={currentTextLayers}
          selectedTextLayer={selectedTextLayer}
          onAddText={addTextLayer}
          onUpdateText={updateTextLayer}
          onRemoveText={removeTextLayer}
          onSelectText={selectTextLayer}
          // Template props
          currentTemplate={currentTemplate}
          selectedColorVariant={selectedColorVariant}
          onApplyTemplate={handleApplyTemplate}
          onSelectColorVariant={handleSelectColorVariant}
          productId={productId}
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
          onCanvasClick={(e) => {
            handleCanvasClick(e);
            deselectText(); // Also deselect text when clicking canvas
          }}
          onImageClick={handleImageClick}
          onImageMouseDown={handleImageMouseDown}
          onDuplicateImage={duplicateImage}
          onRemoveImage={removeImage}
          handleMouseDown={handleMouseDown}
          getResizeHandles={getResizeHandles}
          fileInputRef={fileInputRef}
          // Text props
          textLayers={currentTextLayers}
          selectedTextId={selectedTextId}
          onTextClick={handleTextClick}
          onTextMouseDown={handleTextMouseDown}
          onTextDoubleClick={handleTextDoubleClick}
          isEditingText={isEditingText}
        />

        {/* Side panel */}
        <SidePanel
          frontImage={frontImage}
          backImage={backImage}
          frontStatus={frontStatus}
          backStatus={backStatus}
          activeSide={activeSide}
          onSwitchSide={switchSide}
          // Real-time previews with text
          frontPreview={frontPreview}
          backPreview={backPreview}
          isGeneratingPreview={isGeneratingPreview}
          hasFrontContent={hasFrontContent}
          hasBackContent={hasBackContent}
        />
      </div>

      {/* Footer */}
      <Footer canvasZoom={canvasZoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />

      {/* Review modal - View only, no action buttons */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        frontPreview={frontPreview}
        backPreview={backPreview}
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
