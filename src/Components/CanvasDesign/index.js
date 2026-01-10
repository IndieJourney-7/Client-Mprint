/**
 * CanvasDesign Module
 * 
 * A scalable, modular canvas-based design editor for print products.
 * 
 * Structure:
 * ├── index.js                    # This file - main exports
 * ├── CanvasDesignStudio.js       # Main orchestrator component
 * ├── constants.js                # Configuration and constants
 * ├── hooks/                      # Custom React hooks
 * │   ├── useImageState.js        # Image state management
 * │   ├── useCanvasDrag.js        # Drag/resize interactions
 * │   ├── useUploads.js           # Upload management
 * │   └── useDesignPersistence.js # Save/load design state
 * ├── components/                 # UI components
 * │   ├── Header.js               # Top navigation bar
 * │   ├── Footer.js               # Zoom controls
 * │   ├── Sidebar.js              # Tool icons
 * │   ├── ToolPanel.js            # Tool content panel
 * │   ├── CanvasArea.js           # Main canvas editor
 * │   ├── SidePanel.js            # Front/back thumbnails
 * │   ├── ReviewModal.js          # Preview modal
 * │   ├── ImageDetailsModal.js    # Image info modal
 * │   ├── UploadMenu.js           # Upload context menu
 * │   └── LoadingOverlay.js       # Loading state
 * └── utils/                      # Utility functions
 *     └── imageHelpers.js         # Image calculations
 * 
 * Usage:
 * import CanvasDesignStudio from './Components/CanvasDesign';
 * // or
 * import { CanvasDesignStudio } from './Components/CanvasDesign';
 */

// Main component export
export { default } from './CanvasDesignStudio';
export { default as CanvasDesignStudio } from './CanvasDesignStudio';

// Constants for external use
export { CARD_PRESETS, ALLOWED_TYPES, MAX_FILE_SIZE, SIDEBAR_TOOLS, ZOOM_CONFIG } from './constants';

// Hooks for advanced usage
export { useImageState, useCanvasDrag, useUploads, useDesignPersistence } from './hooks';

// Utilities for external use
export * from './utils';

// Individual components for custom compositions
export {
  Header,
  Footer,
  Sidebar,
  ToolPanel,
  CanvasArea,
  SidePanel,
  ReviewModal,
  ImageDetailsModal,
  UploadMenu,
  LoadingOverlay,
} from './components';
