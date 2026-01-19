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
 * @param {Array} textLayers - Array of text layer objects to render
 * @returns {Promise<string|null>} Data URL of the complete card preview
 */
export const generateCompleteCardPreview = async (imageData, cardPreset, exportCanvas, cornerRadius = 0, textLayers = []) => {
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

      // Only set crossOrigin for HTTP URLs, not for data URLs or blob URLs
      const isDataUrl = imageData.src.startsWith('data:');
      const isBlobUrl = imageData.src.startsWith('blob:');
      if (!isDataUrl && !isBlobUrl) {
        img.crossOrigin = 'anonymous';
      }

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

        // Draw text layers on top of image
        renderTextLayersToCanvas(ctx, textLayers);

        ctx.restore();
        const dataUrl = exportCanvas.toDataURL('image/png', 1);
        console.log('[generateCompleteCardPreview] Preview generated successfully, length:', dataUrl.length);
        resolve(dataUrl);
      };

      img.onerror = (error) => {
        console.error('[generateCompleteCardPreview] Failed to load image with CORS:', {
          src: imageData.src?.substring(0, 100),
          error: error,
          srcType: imageData.src?.startsWith('data:') ? 'data URL' : imageData.src?.startsWith('blob:') ? 'blob URL' : 'HTTP URL'
        });

        // CORS failed - try to fetch the image and convert to data URL
        // This is necessary because canvas becomes tainted with cross-origin images
        console.warn('[generateCompleteCardPreview] CORS failed - attempting fetch fallback');

        // Try fetching the image as blob and converting to data URL
        fetch(imageData.src, { mode: 'cors', credentials: 'include' })
          .then(response => {
            if (!response.ok) throw new Error('Fetch failed');
            return response.blob();
          })
          .then(blob => {
            return new Promise((resolveBlob) => {
              const reader = new FileReader();
              reader.onload = () => resolveBlob(reader.result);
              reader.onerror = () => resolveBlob(null);
              reader.readAsDataURL(blob);
            });
          })
          .then(dataUrl => {
            if (dataUrl) {
              // Successfully converted to data URL, now draw it
              const retryImg = new Image();
              retryImg.onload = () => {
                ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

                const drawX = imageData.x - imageData.width / 2;
                const drawY = imageData.y - imageData.height / 2;
                ctx.drawImage(retryImg, drawX, drawY, imageData.width, imageData.height);

                renderTextLayersToCanvas(ctx, textLayers);
                ctx.restore();

                const result = exportCanvas.toDataURL('image/png', 1);
                console.log('[generateCompleteCardPreview] Fetch fallback succeeded, length:', result.length);
                resolve(result);
              };
              retryImg.onerror = () => {
                // Still failed - generate white background with text
                generateFallbackPreview();
              };
              retryImg.src = dataUrl;
            } else {
              generateFallbackPreview();
            }
          })
          .catch(() => {
            generateFallbackPreview();
          });

        // Fallback: Generate white background preview (with or without text)
        function generateFallbackPreview() {
          console.warn('[generateCompleteCardPreview] All image loading failed - creating white background preview');

          ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

          // Always render text layers if they exist
          if (textLayers && textLayers.length > 0) {
            renderTextLayersToCanvas(ctx, textLayers);
          }

          ctx.restore();
          const result = exportCanvas.toDataURL('image/png', 1);
          console.log('[generateCompleteCardPreview] Fallback preview generated, length:', result.length);
          resolve(result);
        }
      };

      img.src = imageData.src;
    });
  } else {
    // No image, but may have text layers
    console.warn('[generateCompleteCardPreview] No imageData or imageData.src, rendering text only');

    // Draw text layers
    renderTextLayersToCanvas(ctx, textLayers);

    ctx.restore();
    return Promise.resolve(exportCanvas.toDataURL('image/png', 1));
  }
};

/**
 * Render text layers to canvas context
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Array} textLayers - Array of text layer objects
 */
const renderTextLayersToCanvas = (ctx, textLayers) => {
  if (!textLayers || textLayers.length === 0) return;

  textLayers.forEach((layer) => {
    if (!layer.text) return;

    ctx.save();

    // Apply rotation if any
    if (layer.rotation) {
      const centerX = layer.x + (layer.width || 100) / 2;
      const centerY = layer.y + (layer.height || 30) / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // Set font properties
    const fontStyle = layer.fontStyle === 'italic' ? 'italic ' : '';
    const fontWeight = layer.fontWeight === 'bold' ? 'bold ' : '';
    const fontSize = layer.fontSize || 24;
    const fontFamily = layer.fontFamily || 'Arial, sans-serif';

    ctx.font = `${fontStyle}${fontWeight}${fontSize}px ${fontFamily}`;
    ctx.fillStyle = layer.color || '#000000';
    ctx.textAlign = layer.textAlign || 'left';
    ctx.textBaseline = 'top';

    // Calculate text position based on alignment
    let textX = layer.x + 8; // Add padding
    if (layer.textAlign === 'center') {
      textX = layer.x + (layer.width || 200) / 2;
    } else if (layer.textAlign === 'right') {
      textX = layer.x + (layer.width || 200) - 8;
    }

    // Handle text decoration (underline)
    const textY = layer.y + 4; // Add top padding

    // Draw text
    ctx.fillText(layer.text, textX, textY);

    // Draw underline if needed
    if (layer.textDecoration === 'underline') {
      const textMetrics = ctx.measureText(layer.text);
      const underlineY = textY + fontSize + 2;

      ctx.beginPath();
      ctx.strokeStyle = layer.color || '#000000';
      ctx.lineWidth = Math.max(1, fontSize / 15);

      let underlineStartX = textX;
      if (layer.textAlign === 'center') {
        underlineStartX = textX - textMetrics.width / 2;
      } else if (layer.textAlign === 'right') {
        underlineStartX = textX - textMetrics.width;
      }

      ctx.moveTo(underlineStartX, underlineY);
      ctx.lineTo(underlineStartX + textMetrics.width, underlineY);
      ctx.stroke();
    }

    ctx.restore();
  });
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
