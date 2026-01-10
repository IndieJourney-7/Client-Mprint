/**
 * useImageState Hook
 * Manages front/back image state and provides image manipulation functions
 */

import { useState, useCallback, useMemo } from 'react';
import { CARD_PRESETS, calculateCanvasDimensions, hasValidPrintDimensions } from '../constants';
import { 
  calculateSafeArea, 
  calculateFillDimensions, 
  calculateFitDimensions,
  getSafeAreaCenter,
  checkImageStatus 
} from '../utils/imageHelpers';

/**
 * @param {string} orientation - 'horizontal' or 'vertical'
 * @param {Object} printDimensions - Optional product print dimensions
 * @param {number} printDimensions.print_length_inches - Print length in inches
 * @param {number} printDimensions.print_width_inches - Print height in inches
 */
export const useImageState = (orientation = 'horizontal', printDimensions = null) => {
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [activeSide, setActiveSide] = useState('front');
  const [isSelected, setIsSelected] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Get card preset based on orientation and optional print dimensions
  const isHorizontal = orientation === 'horizontal';
  
  // Calculate card preset - use dynamic dimensions if product has them, otherwise fallback
  const cardPreset = useMemo(() => {
    if (printDimensions && hasValidPrintDimensions(printDimensions)) {
      // Use dynamic calculation from product dimensions
      return calculateCanvasDimensions(printDimensions, orientation);
    }
    // Fallback to default presets
    return CARD_PRESETS[isHorizontal ? 'horizontal' : 'vertical'];
  }, [orientation, isHorizontal, printDimensions]);

  // Calculate safe area
  const safeArea = useMemo(() => calculateSafeArea(cardPreset), [cardPreset]);

  // Get current side's image
  const currentImage = activeSide === 'front' ? frontImage : backImage;

  // Calculate status for both sides
  const frontStatus = useMemo(() => checkImageStatus(frontImage, safeArea, cardPreset), [frontImage, safeArea, cardPreset]);
  const backStatus = useMemo(() => checkImageStatus(backImage, safeArea, cardPreset), [backImage, safeArea, cardPreset]);
  const currentStatus = activeSide === 'front' ? frontStatus : backStatus;

  // Update current side's image
  const updateCurrentImage = useCallback((newImageData) => {
    if (activeSide === 'front') {
      setFrontImage(newImageData);
    } else {
      setBackImage(newImageData);
    }
  }, [activeSide]);

  // Set image for a specific side
  const setImageForSide = useCallback((side, imageData) => {
    if (side === 'front') {
      setFrontImage(imageData);
    } else {
      setBackImage(imageData);
    }
    setHasUnsavedChanges(true);
  }, []);

  // Switch active side
  const switchSide = useCallback((side) => {
    setActiveSide(side);
    setIsSelected(false);
  }, []);

  // Fit image to safe area (may have white space)
  const fitToSafeArea = useCallback(() => {
    if (!currentImage) return;

    const { width, height } = calculateFitDimensions(
      currentImage.naturalWidth,
      currentImage.naturalHeight,
      safeArea
    );
    const center = getSafeAreaCenter(safeArea);

    updateCurrentImage({
      ...currentImage,
      x: center.x,
      y: center.y,
      width,
      height,
    });
    setHasUnsavedChanges(true);
  }, [currentImage, safeArea, updateCurrentImage]);

  // Fill safe area completely (no white space)
  const fillSafeArea = useCallback(() => {
    if (!currentImage) return;

    const { width, height } = calculateFillDimensions(
      currentImage.naturalWidth,
      currentImage.naturalHeight,
      safeArea
    );
    const center = getSafeAreaCenter(safeArea);

    updateCurrentImage({
      ...currentImage,
      x: center.x,
      y: center.y,
      width,
      height,
    });
    setHasUnsavedChanges(true);
  }, [currentImage, safeArea, updateCurrentImage]);

  // Fill entire canvas (full bleed)
  const fillCanvas = useCallback(() => {
    if (!currentImage) return;

    const scale = Math.max(
      cardPreset.width / currentImage.naturalWidth,
      cardPreset.height / currentImage.naturalHeight
    );

    updateCurrentImage({
      ...currentImage,
      x: cardPreset.width / 2,
      y: cardPreset.height / 2,
      width: currentImage.naturalWidth * scale,
      height: currentImage.naturalHeight * scale,
    });
    setHasUnsavedChanges(true);
  }, [currentImage, cardPreset, updateCurrentImage]);

  // Remove current image
  const removeImage = useCallback(() => {
    updateCurrentImage(null);
    setIsSelected(false);
    setHasUnsavedChanges(true);
  }, [updateCurrentImage]);

  // Duplicate current image (offset slightly)
  const duplicateImage = useCallback(() => {
    if (!currentImage) return;
    updateCurrentImage({
      ...currentImage,
      x: currentImage.x + 20,
      y: currentImage.y + 20,
    });
    setHasUnsavedChanges(true);
  }, [currentImage, updateCurrentImage]);

  // Check if any design exists
  const hasAnyDesign = !!(frontImage || backImage);
  const hasBothDesigns = !!(frontImage && backImage);

  return {
    // State
    frontImage,
    backImage,
    activeSide,
    currentImage,
    isSelected,
    hasUnsavedChanges,
    
    // Computed
    cardPreset,
    safeArea,
    isHorizontal,
    frontStatus,
    backStatus,
    currentStatus,
    hasAnyDesign,
    hasBothDesigns,

    // Setters
    setFrontImage,
    setBackImage,
    setIsSelected,
    setHasUnsavedChanges,
    updateCurrentImage,
    setImageForSide,
    switchSide,

    // Actions
    fitToSafeArea,
    fillSafeArea,
    fillCanvas,
    removeImage,
    duplicateImage,
  };
};

export default useImageState;
