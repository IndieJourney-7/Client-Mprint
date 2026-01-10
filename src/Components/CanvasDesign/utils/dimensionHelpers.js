/**
 * Dimension Helper Utilities
 * Functions for calculating canvas dimensions from product print dimensions
 * 
 * Industry Standards:
 * - Dimensions stored in inches (client provides)
 * - Standard bleed: 0.125" (3mm) on each side
 * - Display conversion: inches to cm for user-facing measurements
 */

// Print industry constants
export const BLEED_INCHES = 0.125;       // Standard bleed (3mm)
export const CM_PER_INCH = 2.54;         // Conversion factor
export const PIXELS_PER_INCH = 100;      // Canvas resolution (100 DPI for display)

/**
 * Calculate canvas dimensions from product print dimensions
 * 
 * @param {Object} productDimensions - Product dimensions from API
 * @param {number} productDimensions.print_length_inches - Print length/width in inches
 * @param {number} productDimensions.print_width_inches - Print height in inches
 * @param {string} orientation - 'horizontal' or 'vertical'
 * @returns {Object} Canvas preset with calculated dimensions
 * 
 * @example
 * // Standard business card: 3.5" × 2"
 * calculateCanvasDimensions({ print_length_inches: 3.5, print_width_inches: 2 }, 'horizontal')
 * // Returns: { width: 375, height: 225, bleedMargin: 12.5, safeMargin: 25, ... }
 */
export const calculateCanvasDimensions = (productDimensions, orientation = 'horizontal') => {
  const {
    print_length_inches,
    print_width_inches,
  } = productDimensions || {};

  // Fallback to standard business card if no dimensions provided
  const lengthInches = parseFloat(print_length_inches) || 3.5;
  const heightInches = parseFloat(print_width_inches) || 2;

  // Add bleed on all sides
  const totalLengthWithBleed = lengthInches + (BLEED_INCHES * 2);
  const totalHeightWithBleed = heightInches + (BLEED_INCHES * 2);

  // Calculate pixel dimensions
  let canvasWidth, canvasHeight;
  
  if (orientation === 'horizontal') {
    // Length is the wider dimension
    canvasWidth = Math.round(totalLengthWithBleed * PIXELS_PER_INCH);
    canvasHeight = Math.round(totalHeightWithBleed * PIXELS_PER_INCH);
  } else {
    // Vertical: swap dimensions
    canvasWidth = Math.round(totalHeightWithBleed * PIXELS_PER_INCH);
    canvasHeight = Math.round(totalLengthWithBleed * PIXELS_PER_INCH);
  }

  // Calculate margins in pixels
  const bleedMarginPx = Math.round(BLEED_INCHES * PIXELS_PER_INCH);
  const safeMarginPx = bleedMarginPx * 2; // Safe area is typically 2x the bleed

  // Calculate display dimensions in cm (without bleed)
  const widthCm = parseFloat(((orientation === 'horizontal' ? lengthInches : heightInches) * CM_PER_INCH).toFixed(1));
  const heightCm = parseFloat(((orientation === 'horizontal' ? heightInches : lengthInches) * CM_PER_INCH).toFixed(1));

  return {
    width: canvasWidth,
    height: canvasHeight,
    bleedMargin: bleedMarginPx,
    safeMargin: safeMarginPx,
    // Numeric values for component display (e.g., "8.9cm")
    widthCm,
    heightCm,
    // String values for convenience
    displayWidth: `${widthCm}cm`,
    displayHeight: `${heightCm}cm`,
    // Include original dimensions for reference
    originalInches: {
      length: lengthInches,
      height: heightInches,
    },
    // For safe area calculations
    trimWidth: Math.round(lengthInches * PIXELS_PER_INCH),
    trimHeight: Math.round(heightInches * PIXELS_PER_INCH),
  };
};

/**
 * Get presets for both orientations based on product dimensions
 * 
 * @param {Object} productDimensions - Product dimensions from API
 * @returns {Object} Object with horizontal and vertical presets
 */
export const getOrientationPresets = (productDimensions) => {
  return {
    horizontal: calculateCanvasDimensions(productDimensions, 'horizontal'),
    vertical: calculateCanvasDimensions(productDimensions, 'vertical'),
  };
};

/**
 * Convert inches to cm for display
 * @param {number} inches - Value in inches
 * @returns {string} Formatted cm string
 */
export const inchesToCm = (inches) => {
  return `${(inches * CM_PER_INCH).toFixed(1)}cm`;
};

/**
 * Convert inches to pixels
 * @param {number} inches - Value in inches
 * @returns {number} Value in pixels
 */
export const inchesToPixels = (inches) => {
  return Math.round(inches * PIXELS_PER_INCH);
};

/**
 * Format dimension display string
 * @param {number} lengthInches - Length in inches
 * @param {number} heightInches - Height in inches
 * @returns {string} Formatted display string (e.g., "8.9cm × 5.1cm")
 */
export const formatDimensionDisplay = (lengthInches, heightInches) => {
  const lengthCm = (lengthInches * CM_PER_INCH).toFixed(1);
  const heightCm = (heightInches * CM_PER_INCH).toFixed(1);
  return `${lengthCm}cm × ${heightCm}cm`;
};

/**
 * Check if product has valid print dimensions
 * @param {Object} product - Product object from API
 * @returns {boolean} True if product has valid print dimensions
 */
export const hasValidPrintDimensions = (product) => {
  return (
    product &&
    product.print_length_inches > 0 &&
    product.print_width_inches > 0
  );
};

/**
 * Default card presets (fallback when product has no dimensions)
 * These match the original CARD_PRESETS for backward compatibility
 */
export const DEFAULT_CARD_PRESETS = {
  horizontal: {
    width: 375,           // 3.75" total with bleed
    height: 225,          // 2.25" total with bleed
    bleedMargin: 12.5,    // 0.125" bleed
    safeMargin: 25,       // 0.25" safe zone
    widthCm: 8.9,
    heightCm: 5.1,
    displayWidth: '8.9cm',
    displayHeight: '5.1cm',
  },
  vertical: {
    width: 225,
    height: 375,
    bleedMargin: 12.5,
    safeMargin: 25,
    widthCm: 5.1,
    heightCm: 8.9,
    displayWidth: '5.1cm',
    displayHeight: '8.9cm',
  },
};
