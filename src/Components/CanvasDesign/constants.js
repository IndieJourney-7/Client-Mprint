/**
 * CanvasDesign Constants
 * Central configuration for the canvas design studio
 */

import { FaRegImages } from 'react-icons/fa';
import { BsLayers } from 'react-icons/bs';
import { IoText } from 'react-icons/io5';
import { MdColorLens } from 'react-icons/md';
import { BiShapeSquare } from 'react-icons/bi';
import { BsQrCode } from 'react-icons/bs';

// Re-export dimension helpers for convenience
export {
  calculateCanvasDimensions,
  getOrientationPresets,
  hasValidPrintDimensions,
  inchesToCm,
  inchesToPixels,
  formatDimensionDisplay,
  DEFAULT_CARD_PRESETS,
  BLEED_INCHES,
  CM_PER_INCH,
  PIXELS_PER_INCH,
} from './utils/dimensionHelpers';

/*
  PRINTING KNOWLEDGE:
  ==================
  - BLEED AREA: Extra area (usually 3mm / 0.125") that extends beyond the final cut line.
    Content here gets trimmed off. Used for edge-to-edge printing.

  - SAFE AREA: The inner area where all important content should stay.
    This ensures nothing critical gets cut off during trimming.

  - TRIM LINE: The actual edge of the final printed card.

  For visiting cards (9.19cm x 5.38cm / 3.5" x 2"):
  - Bleed extends ~3mm (0.125") beyond trim on all sides
  - Safe area is ~5mm inside the trim line

  Our canvas shows:
  - CYAN border = Bleed line (outer) - content here may be trimmed
  - GREEN dashed = Safe area (inner) - keep important content here
  - The image should ideally FIT WITHIN the safe area for best results
  
  DYNAMIC DIMENSIONS:
  ==================
  Products now store print_length_inches and print_width_inches.
  Use calculateCanvasDimensions() to get canvas presets dynamically.
  CARD_PRESETS below serves as fallback for products without dimensions.
*/

// Default card dimensions - Standard business card (fallback)
// For dynamic dimensions, use calculateCanvasDimensions() from dimensionHelpers
export const CARD_PRESETS = {
  horizontal: {
    // Canvas size (includes bleed): 3.75" x 2.25" at 100 DPI
    width: 375,
    height: 225,
    // Display dimensions in cm
    widthCm: 8.9,
    heightCm: 5.1,
    displayWidth: '8.9cm',
    displayHeight: '5.1cm',
    // Safe area margin from edge (represents ~5mm / 0.2" safe zone)
    safeMargin: 25,
    // Bleed margin (0.125" = 12.5px at 100 DPI)
    bleedMargin: 12.5,
    // Original print dimensions
    originalInches: { length: 3.5, height: 2 },
  },
  vertical: {
    width: 225,
    height: 375,
    widthCm: 5.1,
    heightCm: 8.9,
    displayWidth: '5.1cm',
    displayHeight: '8.9cm',
    safeMargin: 25,
    bleedMargin: 12.5,
    originalInches: { length: 3.5, height: 2 },
  },
};

// Allowed image types for upload
export const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Maximum file size (25MB)
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

// Sidebar tool definitions
export const SIDEBAR_TOOLS = [
  { id: 'uploads', icon: FaRegImages, label: 'Uploads' },
  { id: 'text', icon: IoText, label: 'Text' },
  { id: 'graphics', icon: BiShapeSquare, label: 'Graphics' },
  { id: 'background', icon: MdColorLens, label: 'Backgrou\nnd' },
  { id: 'template', icon: BsLayers, label: 'Template' },
  { id: 'template-color', icon: MdColorLens, label: 'Template\ncolor' },
  { id: 'qr-codes', icon: BsQrCode, label: 'QR-codes' },
];

// Zoom constraints
export const ZOOM_CONFIG = {
  min: 50,
  max: 150,
  step: 10,
  default: 100,
};

// Image constraints
export const IMAGE_CONFIG = {
  minSize: 50, // Minimum image dimension
};

// Resize handle positions
export const RESIZE_HANDLES = ['nw', 'ne', 'sw', 'se'];

// Default canvas state
export const getDefaultCanvasState = () => ({
  frontImage: null,
  backImage: null,
  activeSide: 'front',
  canvasZoom: ZOOM_CONFIG.default,
  hasUnsavedChanges: false,
});
