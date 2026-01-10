/**
 * Image Helper Utilities
 * Functions for image status checking, preview generation, and display helpers
 */

import {
  IoCheckmarkCircle,
  IoWarning,
  IoAlertCircle,
} from 'react-icons/io5';

/**
 * Check if image is properly positioned within safe/bleed areas
 * @param {Object} img - Image object with x, y, width, height
 * @param {Object} safeArea - Safe area bounds
 * @param {Object} cardPreset - Card preset with bleed margins
 * @returns {Object} Status object with isValid, status, and message
 */
export const checkImageStatus = (img, safeArea, cardPreset) => {
  if (!img) return { isValid: false, status: 'empty' };

  const halfW = img.width / 2;
  const halfH = img.height / 2;
  const imgLeft = img.x - halfW;
  const imgTop = img.y - halfH;
  const imgRight = img.x + halfW;
  const imgBottom = img.y + halfH;

  // Check if image covers the entire safe area (ideal for full bleed design)
  const coversFullSafeArea =
    imgLeft <= safeArea.left &&
    imgTop <= safeArea.top &&
    imgRight >= safeArea.right &&
    imgBottom >= safeArea.bottom;

  // Check if image is completely within safe area
  const withinSafeArea =
    imgLeft >= safeArea.left &&
    imgTop >= safeArea.top &&
    imgRight <= safeArea.right &&
    imgBottom <= safeArea.bottom;

  // Check if image extends beyond bleed (will be cut off)
  const exceedsBleed =
    imgLeft < cardPreset.bleedMargin ||
    imgTop < cardPreset.bleedMargin ||
    imgRight > cardPreset.width - cardPreset.bleedMargin ||
    imgBottom > cardPreset.height - cardPreset.bleedMargin;

  if (coversFullSafeArea) {
    return { isValid: true, status: 'perfect', message: 'Design covers full print area' };
  } else if (withinSafeArea) {
    return { isValid: true, status: 'safe', message: 'Design is within safe area' };
  } else if (exceedsBleed) {
    return { isValid: false, status: 'exceeds', message: 'Design extends beyond bleed - will be trimmed' };
  } else {
    return { isValid: true, status: 'partial', message: 'Some content may be near edge' };
  }
};

/**
 * Generate complete card preview (full canvas with white background and guides)
 * Shows exactly what user designed with proper orientation and shape
 * @param {Object} imageData - Image data with src, x, y, width, height
 * @param {Object} cardPreset - Card preset with dimensions
 * @param {HTMLCanvasElement} exportCanvas - Canvas element for export
 * @param {number} cornerRadius - Corner radius in pixels (0 for sharp corners)
 * @returns {Promise<string|null>} Data URL of the complete card preview
 */
export const generateCompleteCardPreview = async (imageData, cardPreset, exportCanvas, cornerRadius = 0) => {
  if (!exportCanvas) {
    console.error('[generateCompleteCardPreview] No export canvas provided');
    return null;
  }

  if (!cardPreset) {
    console.error('[generateCompleteCardPreview] No cardPreset provided');
    return null;
  }

  console.log('[generateCompleteCardPreview] Starting:', {
    hasImageData: !!imageData,
    imageSrc: imageData?.src?.substring(0, 50),
    cardWidth: cardPreset.width,
    cardHeight: cardPreset.height,
    cornerRadius,
  });

  const ctx = exportCanvas.getContext('2d');

  // Set canvas to full card dimensions (including bleed)
  exportCanvas.width = cardPreset.width;
  exportCanvas.height = cardPreset.height;

  // Clear canvas
  ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);

  // Save context before clipping
  ctx.save();

  // If cornerRadius is specified, clip entire card to rounded rectangle
  if (cornerRadius > 0) {
    ctx.beginPath();
    ctx.roundRect(0, 0, exportCanvas.width, exportCanvas.height, cornerRadius);
    ctx.clip();
  }

  // Fill with white background (entire card)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  // Draw image if exists
  if (imageData && imageData.src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        console.log('[generateCompleteCardPreview] Image loaded, drawing:', {
          imageWidth: img.width,
          imageHeight: img.height,
          x: imageData.x,
          y: imageData.y,
        });
        // Draw image at its exact position (center-based positioning)
        const drawX = imageData.x - imageData.width / 2;
        const drawY = imageData.y - imageData.height / 2;
        ctx.drawImage(img, drawX, drawY, imageData.width, imageData.height);

        ctx.restore();
        const dataUrl = exportCanvas.toDataURL('image/png', 1);
        console.log('[generateCompleteCardPreview] Preview generated successfully, length:', dataUrl.length);
        resolve(dataUrl);
      };

      img.onerror = (error) => {
        console.error('[generateCompleteCardPreview] Failed to load image with CORS:', {
          src: imageData.src,
          error: error,
          srcType: imageData.src?.startsWith('data:') ? 'data URL' : imageData.src?.startsWith('blob:') ? 'blob URL' : 'HTTP URL'
        });

        // If CORS fails, we cannot export canvas to data URL (canvas would be tainted)
        // Solution: Return the original source URL as the preview
        // This works because the original URL will be used for display
        console.warn('[generateCompleteCardPreview] CORS failed - returning original source URL as preview');
        ctx.restore();

        // Return the original image source URL instead of trying to export tainted canvas
        resolve(imageData.src);
      };

      img.src = imageData.src;
    });
  } else {
    // No image, return white card
    console.warn('[generateCompleteCardPreview] No imageData or imageData.src, returning white card');
    ctx.restore();
    return Promise.resolve(exportCanvas.toDataURL('image/png', 1));
  }
};

/**
 * Generate print-ready preview (cropped to safe area) - LEGACY for printing
 * @param {Object} imageData - Image data with src, x, y, width, height
 * @param {Object} safeArea - Safe area bounds
 * @param {HTMLCanvasElement} exportCanvas - Canvas element for export
 * @param {number} cornerRadius - Corner radius in pixels (0 for sharp corners)
 * @returns {Promise<string|null>} Data URL of the cropped image
 */
export const generatePrintPreview = async (imageData, safeArea, exportCanvas, cornerRadius = 0) => {
  if (!imageData || !exportCanvas) return null;

  console.log('[generatePrintPreview] Creating preview with:', {
    safeAreaWidth: safeArea.width,
    safeAreaHeight: safeArea.height,
    cornerRadius,
    imageDataSrc: imageData.src?.substring(0, 50) + '...',
  });

  const ctx = exportCanvas.getContext('2d');

  // Set canvas to safe area dimensions
  exportCanvas.width = safeArea.width;
  exportCanvas.height = safeArea.height;

  // Clear canvas
  ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);

  // If cornerRadius is specified, clip to rounded rectangle
  if (cornerRadius > 0) {
    ctx.beginPath();
    ctx.roundRect(0, 0, exportCanvas.width, exportCanvas.height, cornerRadius);
    ctx.clip();
  }

  // Fill with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  // Load image properly (async)
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Calculate position relative to safe area
      // imageData.x, imageData.y is the CENTER of the image on the full canvas
      // We need to position it relative to safe area (which starts at safeArea.left, safeArea.top)
      const drawX = imageData.x - imageData.width / 2 - safeArea.left;
      const drawY = imageData.y - imageData.height / 2 - safeArea.top;

      // Draw image at calculated position
      ctx.drawImage(img, drawX, drawY, imageData.width, imageData.height);

      resolve(exportCanvas.toDataURL('image/png', 1));
    };

    img.onerror = () => {
      console.error('Failed to load image for preview:', imageData.src);
      resolve(null);
    };

    img.src = imageData.src;
  });
};

/**
 * Get status display styling based on image status
 * @param {Object} status - Status object from checkImageStatus
 * @returns {Object} Display configuration with color, bg, border, and icon
 */
export const getStatusDisplay = (status) => {
  switch (status?.status) {
    case 'perfect':
      return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: IoCheckmarkCircle };
    case 'safe':
      return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: IoCheckmarkCircle };
    case 'partial':
      return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: IoWarning };
    case 'exceeds':
      return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: IoAlertCircle };
    default:
      return { color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', icon: IoAlertCircle };
  }
};

/**
 * Calculate safe area bounds from card preset
 * @param {Object} cardPreset - Card preset configuration
 * @returns {Object} Safe area bounds
 */
export const calculateSafeArea = (cardPreset) => ({
  left: cardPreset.safeMargin,
  top: cardPreset.safeMargin,
  right: cardPreset.width - cardPreset.safeMargin,
  bottom: cardPreset.height - cardPreset.safeMargin,
  width: cardPreset.width - cardPreset.safeMargin * 2,
  height: cardPreset.height - cardPreset.safeMargin * 2,
});

/**
 * Calculate image dimensions to fill safe area (cover mode)
 * @param {number} imgWidth - Original image width
 * @param {number} imgHeight - Original image height
 * @param {Object} safeArea - Safe area bounds
 * @returns {Object} Calculated width and height
 */
export const calculateFillDimensions = (imgWidth, imgHeight, safeArea) => {
  const scale = Math.max(safeArea.width / imgWidth, safeArea.height / imgHeight);
  return {
    width: imgWidth * scale,
    height: imgHeight * scale,
  };
};

/**
 * Calculate image dimensions to fit within safe area (contain mode)
 * @param {number} imgWidth - Original image width
 * @param {number} imgHeight - Original image height
 * @param {Object} safeArea - Safe area bounds
 * @returns {Object} Calculated width and height
 */
export const calculateFitDimensions = (imgWidth, imgHeight, safeArea) => {
  const scale = Math.min(safeArea.width / imgWidth, safeArea.height / imgHeight);
  return {
    width: imgWidth * scale,
    height: imgHeight * scale,
  };
};

/**
 * Calculate center position of safe area
 * @param {Object} safeArea - Safe area bounds
 * @returns {Object} Center x and y coordinates
 */
export const getSafeAreaCenter = (safeArea) => ({
  x: safeArea.left + safeArea.width / 2,
  y: safeArea.top + safeArea.height / 2,
});

/**
 * Create new image data object for canvas
 * @param {string} src - Image source URL or data URL
 * @param {number} naturalWidth - Original image width
 * @param {number} naturalHeight - Original image height
 * @param {Object} safeArea - Safe area for positioning
 * @param {Object} options - Additional options (uploadId, preserveSize, etc.)
 * @returns {Object} Image data object ready for canvas
 */
export const createImageData = (src, naturalWidth, naturalHeight, safeArea, options = {}) => {
  // DIRECTIVE: Preserve aspect ratio, scale to fit safe area for visibility
  // If image is larger than safe area, scale down to fit
  // If image is smaller than safe area, keep original size (show with white space)
  // User can then manually scale up/down as needed
  const center = getSafeAreaCenter(safeArea);

  let displayWidth = naturalWidth;
  let displayHeight = naturalHeight;

  // Only scale down if image is larger than safe area
  if (naturalWidth > safeArea.width || naturalHeight > safeArea.height) {
    const { width, height } = calculateFitDimensions(naturalWidth, naturalHeight, safeArea);
    displayWidth = width;
    displayHeight = height;
  }
  // If smaller, keep original size (will show with white space)

  return {
    src,
    x: center.x,
    y: center.y,
    width: displayWidth,
    height: displayHeight,
    rotation: 0,
    naturalWidth,
    naturalHeight,
    ...options,
  };
};
