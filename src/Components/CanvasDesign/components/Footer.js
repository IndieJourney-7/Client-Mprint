/**
 * Footer Component
 * Bottom bar with zoom controls and help button
 */

import React from 'react';
import {
  IoRemoveOutline,
  IoAddOutline,
  IoSettingsOutline,
  IoHelpCircleOutline,
} from 'react-icons/io5';
import { ZOOM_CONFIG } from '../constants';

const Footer = ({ canvasZoom, onZoomIn, onZoomOut }) => {
  return (
    <footer className="h-12 bg-white border-t flex items-center justify-between px-4">
      <div />
      
      {/* Zoom controls */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
        <button
          onClick={onZoomOut}
          disabled={canvasZoom <= ZOOM_CONFIG.min}
          className="text-gray-600 hover:text-gray-800 disabled:text-gray-300"
        >
          <IoRemoveOutline size={16} />
        </button>
        <span className="text-sm font-medium text-gray-700 w-12 text-center">
          {canvasZoom}%
        </span>
        <button
          onClick={onZoomIn}
          disabled={canvasZoom >= ZOOM_CONFIG.max}
          className="text-gray-600 hover:text-gray-800 disabled:text-gray-300"
        >
          <IoAddOutline size={16} />
        </button>
        <button className="ml-1 text-gray-500">
          <IoSettingsOutline size={14} />
        </button>
      </div>

      {/* Help button */}
      <button className="flex items-center gap-2 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-full">
        <IoHelpCircleOutline size={16} />
        Need design help?
      </button>
    </footer>
  );
};

export default Footer;
