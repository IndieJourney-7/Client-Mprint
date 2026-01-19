/**
 * TextToolPanel Component
 * Panel for editing text properties - similar to Vistaprint's text editor
 */

import React, { useState } from 'react';
import {
  IoTrashOutline,
  IoColorPaletteOutline,
  IoAddOutline,
} from 'react-icons/io5';
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
} from 'react-icons/fa';
import { AVAILABLE_FONTS, TEXT_FIELD_PRESETS } from '../hooks/useTextState';

// Preset colors
const COLOR_PRESETS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#C0C0C0',
  '#800000', '#008000', '#000080', '#808000', '#800080',
  '#008080', '#00b4d8', '#1a1a1a', '#333333', '#666666',
];

const TextToolPanel = ({
  activeSide,
  currentTextLayers,
  selectedTextLayer,
  onAddText,
  onUpdateText,
  onRemoveText,
  onSelectText,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState('#000000');

  // Debug: Log what TextToolPanel receives
  console.log('[TextToolPanel] Received props:', {
    activeSide,
    currentTextLayersCount: currentTextLayers?.length || 0,
    currentTextLayers,
    selectedTextLayer: selectedTextLayer?.id || null,
  });

  // Handle text change from input field
  const handleTextChange = (layerId, newText) => {
    onUpdateText(layerId, { text: newText });
  };

  // Handle font change
  const handleFontChange = (fontFamily) => {
    if (selectedTextLayer) {
      onUpdateText(selectedTextLayer.id, { fontFamily });
    }
  };

  // Handle font size change
  const handleFontSizeChange = (fontSize) => {
    if (selectedTextLayer) {
      onUpdateText(selectedTextLayer.id, { fontSize: parseInt(fontSize) });
    }
  };

  // Handle color change
  const handleColorChange = (color) => {
    if (selectedTextLayer) {
      onUpdateText(selectedTextLayer.id, { color });
    }
    setShowColorPicker(false);
  };

  // Toggle bold
  const toggleBold = () => {
    if (selectedTextLayer) {
      onUpdateText(selectedTextLayer.id, {
        fontWeight: selectedTextLayer.fontWeight === 'bold' ? 'normal' : 'bold',
      });
    }
  };

  // Toggle italic
  const toggleItalic = () => {
    if (selectedTextLayer) {
      onUpdateText(selectedTextLayer.id, {
        fontStyle: selectedTextLayer.fontStyle === 'italic' ? 'normal' : 'italic',
      });
    }
  };

  // Toggle underline
  const toggleUnderline = () => {
    if (selectedTextLayer) {
      onUpdateText(selectedTextLayer.id, {
        textDecoration: selectedTextLayer.textDecoration === 'underline' ? 'none' : 'underline',
      });
    }
  };

  // Set text alignment
  const setAlignment = (textAlign) => {
    if (selectedTextLayer) {
      onUpdateText(selectedTextLayer.id, { textAlign });
    }
  };

  // Add new text from preset
  const handleAddPreset = (presetId) => {
    onAddText(presetId);
  };

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Text</h3>
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="text-gray-400 hover:text-gray-600"
        >
          <IoColorPaletteOutline size={18} />
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Edit your text below, or click on the field you'd like to edit directly on your design.
      </p>

      {/* Existing Text Fields - Editable */}
      {currentTextLayers.length > 0 ? (
        <div className="space-y-3 mb-6">
          <p className="text-xs text-gray-500 font-medium">Your Text ({currentTextLayers.length}):</p>
          {currentTextLayers.map((layer) => (
            <div
              key={layer.id}
              className={`relative border rounded-lg transition-all ${
                selectedTextLayer?.id === layer.id
                  ? 'border-cyan-500 bg-cyan-50 shadow-sm'
                  : 'border-gray-200 hover:border-cyan-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="text"
                value={layer.text}
                onChange={(e) => handleTextChange(layer.id, e.target.value)}
                onClick={() => onSelectText(layer.id)}
                placeholder={layer.placeholder || 'Enter text...'}
                className="w-full px-3 py-3 pr-10 bg-transparent text-gray-800 focus:outline-none rounded-lg"
                style={{
                  fontFamily: layer.fontFamily,
                  fontWeight: layer.fontWeight,
                  fontStyle: layer.fontStyle,
                }}
              />
              <button
                onClick={() => onRemoveText(layer.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                title="Remove text"
              >
                <IoTrashOutline size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center">
          <p className="text-sm text-gray-500">No text layers yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "New Text Field" or use Quick Add below</p>
        </div>
      )}

      {/* Add New Text Field Button */}
      <button
        onClick={() => onAddText()}
        className="w-full py-3 bg-cyan-400 hover:bg-cyan-500 text-black font-semibold rounded-lg transition flex items-center justify-center gap-2 mb-6"
      >
        <IoAddOutline size={20} />
        New Text Field
      </button>

      {/* Text Formatting Tools (shown when text is selected) */}
      {selectedTextLayer && (
        <div className="border-t pt-4 space-y-4">
          {/* Font Family */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Font</label>
            <select
              value={selectedTextLayer.fontFamily}
              onChange={(e) => handleFontChange(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-cyan-500 focus:outline-none"
            >
              {AVAILABLE_FONTS.map((font) => (
                <option key={font.name} value={font.family} style={{ fontFamily: font.family }}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Size</label>
            <select
              value={selectedTextLayer.fontSize}
              onChange={(e) => handleFontSizeChange(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-cyan-500 focus:outline-none"
            >
              {[8, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72].map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </div>

          {/* Text Color */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Color</label>
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-full p-2 border border-gray-200 rounded-lg flex items-center gap-2 hover:bg-gray-50"
              >
                <div
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: selectedTextLayer.color }}
                />
                <span className="text-sm text-gray-700">{selectedTextLayer.color}</span>
              </button>

              {/* Color Picker Dropdown */}
              {showColorPicker && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorChange(color)}
                        className={`w-8 h-8 rounded border-2 transition ${
                          selectedTextLayer.color === color
                            ? 'border-cyan-500 scale-110'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <button
                      onClick={() => handleColorChange(customColor)}
                      className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
                    >
                      Apply Custom
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Text Style Buttons */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Style</label>
            <div className="flex gap-1">
              <button
                onClick={toggleBold}
                className={`p-2.5 rounded transition ${
                  selectedTextLayer.fontWeight === 'bold'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Bold"
              >
                <FaBold size={14} />
              </button>
              <button
                onClick={toggleItalic}
                className={`p-2.5 rounded transition ${
                  selectedTextLayer.fontStyle === 'italic'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Italic"
              >
                <FaItalic size={14} />
              </button>
              <button
                onClick={toggleUnderline}
                className={`p-2.5 rounded transition ${
                  selectedTextLayer.textDecoration === 'underline'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Underline"
              >
                <FaUnderline size={14} />
              </button>
              <div className="w-px bg-gray-300 mx-1" />
              <button
                onClick={() => setAlignment('left')}
                className={`p-2.5 rounded transition ${
                  selectedTextLayer.textAlign === 'left'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Align Left"
              >
                <FaAlignLeft size={14} />
              </button>
              <button
                onClick={() => setAlignment('center')}
                className={`p-2.5 rounded transition ${
                  selectedTextLayer.textAlign === 'center'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Align Center"
              >
                <FaAlignCenter size={14} />
              </button>
              <button
                onClick={() => setAlignment('right')}
                className={`p-2.5 rounded transition ${
                  selectedTextLayer.textAlign === 'right'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Align Right"
              >
                <FaAlignRight size={14} />
              </button>
            </div>
          </div>

          {/* Remove Selected Text */}
          <button
            onClick={() => onRemoveText(selectedTextLayer.id)}
            className="w-full py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm flex items-center justify-center gap-1.5 mt-4"
          >
            <IoTrashOutline size={14} />
            Remove Selected Text
          </button>
        </div>
      )}

      {/* Quick Add Presets - always show for easy access */}
      <div className="border-t pt-4">
        <p className="text-xs text-gray-500 mb-3">Quick Add:</p>
        <div className="space-y-2">
          {TEXT_FIELD_PRESETS.slice(0, 5).map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleAddPreset(preset.id)}
              className="w-full py-2 px-3 text-left text-sm text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
        <p className="font-medium mb-1">Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Click on text in the canvas to select and edit</li>
          <li>Drag text to reposition</li>
          <li>Use the corners to resize</li>
        </ul>
      </div>
    </div>
  );
};

export default TextToolPanel;
