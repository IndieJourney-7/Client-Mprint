/**
 * useTextState Hook
 * Manages text layers for the canvas design editor
 * Similar to Vistaprint's text editing functionality
 */

import { useState, useCallback, useMemo } from 'react';

// Default text properties
const DEFAULT_TEXT_PROPS = {
  fontFamily: 'Arial',
  fontSize: 24,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'left',
  color: '#000000',
  lineHeight: 1.2,
  letterSpacing: 0,
  textDecoration: 'none',
};

// Available fonts
export const AVAILABLE_FONTS = [
  { name: 'Arial', family: 'Arial, sans-serif' },
  { name: 'Helvetica', family: 'Helvetica, Arial, sans-serif' },
  { name: 'Times New Roman', family: '"Times New Roman", Times, serif' },
  { name: 'Georgia', family: 'Georgia, serif' },
  { name: 'Verdana', family: 'Verdana, Geneva, sans-serif' },
  { name: 'Courier New', family: '"Courier New", Courier, monospace' },
  { name: 'Impact', family: 'Impact, Charcoal, sans-serif' },
  { name: 'Comic Sans MS', family: '"Comic Sans MS", cursive' },
  { name: 'Trebuchet MS', family: '"Trebuchet MS", Helvetica, sans-serif' },
  { name: 'Palatino', family: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
  { name: 'Lucida Console', family: '"Lucida Console", Monaco, monospace' },
  { name: 'Tahoma', family: 'Tahoma, Geneva, sans-serif' },
];

// Preset text field types (like Vistaprint)
export const TEXT_FIELD_PRESETS = [
  { id: 'company-name', label: 'Company Name', placeholder: 'Company Name', fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
  { id: 'company-message', label: 'Company Message', placeholder: 'Company Message', fontSize: 14, fontWeight: 'normal', color: '#666666' },
  { id: 'full-name', label: 'Full Name', placeholder: 'Full Name', fontSize: 20, fontWeight: 'bold', color: '#00b4d8' },
  { id: 'job-title', label: 'Job Title', placeholder: 'Job Title', fontSize: 14, fontWeight: 'normal', color: '#333333' },
  { id: 'email', label: 'Email / Other', placeholder: 'Email / Other', fontSize: 12, fontWeight: 'normal', color: '#333333' },
  { id: 'address-1', label: 'Address Line 1', placeholder: 'Address Line 1', fontSize: 11, fontWeight: 'normal', color: '#333333' },
  { id: 'address-2', label: 'Address Line 2', placeholder: 'Address Line 2', fontSize: 11, fontWeight: 'normal', color: '#333333' },
  { id: 'web', label: 'Web / Other', placeholder: 'Web / Other', fontSize: 11, fontWeight: 'normal', color: '#333333' },
  { id: 'phone', label: 'Phone / Other', placeholder: 'Phone / Other', fontSize: 11, fontWeight: 'normal', color: '#333333' },
];

// Generate unique ID
const generateId = () => `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Hook for managing text layers on canvas
 */
const useTextState = (cardPreset) => {
  // Text layers for front and back
  const [frontTextLayers, setFrontTextLayers] = useState([]);
  const [backTextLayers, setBackTextLayers] = useState([]);

  // Debug: Log text layers state on every render
  console.log('[useTextState] Current state:', {
    frontTextLayersCount: frontTextLayers.length,
    backTextLayersCount: backTextLayers.length,
    frontTextLayers,
    backTextLayers,
  });

  // Currently selected text layer ID
  const [selectedTextId, setSelectedTextId] = useState(null);

  // Active side for text editing
  const [activeTextSide, setActiveTextSide] = useState('front');

  // Text editing mode
  const [isEditingText, setIsEditingText] = useState(false);

  // Get current text layers based on active side
  const currentTextLayers = useMemo(() => {
    const layers = activeTextSide === 'front' ? frontTextLayers : backTextLayers;
    console.log('[useTextState] currentTextLayers computed:', {
      activeTextSide,
      frontCount: frontTextLayers.length,
      backCount: backTextLayers.length,
      resultCount: layers.length,
    });
    return layers;
  }, [activeTextSide, frontTextLayers, backTextLayers]);

  // Get selected text layer
  const selectedTextLayer = useMemo(() => {
    return currentTextLayers.find(layer => layer.id === selectedTextId) || null;
  }, [currentTextLayers, selectedTextId]);

  // Add new text layer to current side
  // IMPORTANT: Use functional update to avoid stale closure
  const addTextLayer = useCallback((presetId = null, customProps = {}) => {
    const preset = presetId
      ? TEXT_FIELD_PRESETS.find(p => p.id === presetId)
      : null;

    const newLayer = {
      id: generateId(),
      text: preset?.placeholder || customProps.text || 'New Text',
      x: customProps.x ?? (cardPreset?.width ? cardPreset.width / 2 - 50 : 100),
      y: customProps.y ?? (cardPreset?.height ? cardPreset.height / 2 : 100),
      width: customProps.width ?? 200,
      height: customProps.height ?? 40,
      rotation: customProps.rotation ?? 0,
      ...DEFAULT_TEXT_PROPS,
      ...(preset ? {
        fontSize: preset.fontSize,
        fontWeight: preset.fontWeight,
        color: preset.color,
      } : {}),
      ...customProps,
      presetId: presetId,
    };

    // Use functional update to add layer
    if (activeTextSide === 'front') {
      setFrontTextLayers(prev => [...prev, newLayer]);
    } else {
      setBackTextLayers(prev => [...prev, newLayer]);
    }

    setSelectedTextId(newLayer.id);
    return newLayer;
  }, [activeTextSide, cardPreset]);

  // Add text layer to a SPECIFIC side (front or back)
  // Used for restoring saved text layers during Edit Design
  // The layerProps should contain all saved properties - we just merge with defaults
  const addTextLayerToSide = useCallback((side, layerProps) => {
    console.log('[useTextState] addTextLayerToSide called:', { side, text: layerProps?.text, id: layerProps?.id });

    if (!layerProps) {
      console.error('[useTextState] addTextLayerToSide: layerProps is null/undefined');
      return null;
    }

    // Create the new layer by merging defaults with provided props
    // Use provided values if they exist, otherwise fall back to defaults
    const newLayer = {
      // Core properties
      id: layerProps.id || generateId(),
      text: layerProps.text ?? 'Text',
      // Position (use provided or center of cardPreset or fallback)
      x: layerProps.x ?? (cardPreset?.width ? cardPreset.width / 2 - 50 : 100),
      y: layerProps.y ?? (cardPreset?.height ? cardPreset.height / 2 : 100),
      // Size
      width: layerProps.width ?? 200,
      height: layerProps.height ?? 40,
      rotation: layerProps.rotation ?? 0,
      // Text styling - merge with defaults
      fontFamily: layerProps.fontFamily ?? DEFAULT_TEXT_PROPS.fontFamily,
      fontSize: layerProps.fontSize ?? DEFAULT_TEXT_PROPS.fontSize,
      fontWeight: layerProps.fontWeight ?? DEFAULT_TEXT_PROPS.fontWeight,
      fontStyle: layerProps.fontStyle ?? DEFAULT_TEXT_PROPS.fontStyle,
      textAlign: layerProps.textAlign ?? DEFAULT_TEXT_PROPS.textAlign,
      color: layerProps.color ?? DEFAULT_TEXT_PROPS.color,
      lineHeight: layerProps.lineHeight ?? DEFAULT_TEXT_PROPS.lineHeight,
      letterSpacing: layerProps.letterSpacing ?? DEFAULT_TEXT_PROPS.letterSpacing,
      textDecoration: layerProps.textDecoration ?? DEFAULT_TEXT_PROPS.textDecoration,
    };

    console.log('[useTextState] ✅ Created text layer:', { id: newLayer.id, text: newLayer.text, x: newLayer.x, y: newLayer.y });

    // Add to the appropriate side using functional update
    if (side === 'front') {
      setFrontTextLayers(prev => {
        const updated = [...prev, newLayer];
        console.log('[useTextState] Front layers updated, count:', updated.length);
        return updated;
      });
    } else {
      setBackTextLayers(prev => {
        const updated = [...prev, newLayer];
        console.log('[useTextState] Back layers updated, count:', updated.length);
        return updated;
      });
    }

    return newLayer;
  }, [cardPreset]);

  // Update text layer
  // IMPORTANT: Update both arrays to handle layers that might be on either side
  // This fixes the issue where restored layers couldn't be edited because
  // we were only searching in the activeTextSide array
  const updateTextLayer = useCallback((layerId, updates) => {
    console.log('[useTextState] updateTextLayer called:', { layerId, updates });

    // Update front layers if the layer exists there
    setFrontTextLayers(prev => {
      const layerExists = prev.some(layer => layer.id === layerId);
      if (layerExists) {
        const updated = prev.map(layer =>
          layer.id === layerId ? { ...layer, ...updates } : layer
        );
        console.log('[useTextState] Updated front text layer:', layerId);
        return updated;
      }
      return prev;
    });

    // Update back layers if the layer exists there
    setBackTextLayers(prev => {
      const layerExists = prev.some(layer => layer.id === layerId);
      if (layerExists) {
        const updated = prev.map(layer =>
          layer.id === layerId ? { ...layer, ...updates } : layer
        );
        console.log('[useTextState] Updated back text layer:', layerId);
        return updated;
      }
      return prev;
    });
  }, []);

  // Update selected text layer
  const updateSelectedText = useCallback((updates) => {
    if (selectedTextId) {
      updateTextLayer(selectedTextId, updates);
    }
  }, [selectedTextId, updateTextLayer]);

  // Remove text layer
  // IMPORTANT: Remove from both arrays to handle layers on either side
  const removeTextLayer = useCallback((layerId) => {
    console.log('[useTextState] removeTextLayer called:', { layerId });

    // Remove from front layers
    setFrontTextLayers(prev => prev.filter(layer => layer.id !== layerId));

    // Remove from back layers
    setBackTextLayers(prev => prev.filter(layer => layer.id !== layerId));

    if (selectedTextId === layerId) {
      setSelectedTextId(null);
    }
  }, [selectedTextId]);

  // Remove selected text layer
  const removeSelectedText = useCallback(() => {
    if (selectedTextId) {
      removeTextLayer(selectedTextId);
    }
  }, [selectedTextId, removeTextLayer]);

  // Duplicate text layer
  // IMPORTANT: Use functional update to avoid stale closure
  const duplicateTextLayer = useCallback((layerId) => {
    let newLayer = null;

    const updateFn = (prev) => {
      const layer = prev.find(l => l.id === layerId);
      if (layer) {
        newLayer = {
          ...layer,
          id: generateId(),
          x: layer.x + 20,
          y: layer.y + 20,
        };
        return [...prev, newLayer];
      }
      return prev;
    };

    if (activeTextSide === 'front') {
      setFrontTextLayers(updateFn);
    } else {
      setBackTextLayers(updateFn);
    }

    if (newLayer) {
      setSelectedTextId(newLayer.id);
    }
    return newLayer;
  }, [activeTextSide]);

  // Select text layer
  const selectTextLayer = useCallback((layerId) => {
    setSelectedTextId(layerId);
    if (layerId) {
      setIsEditingText(true);
    }
  }, []);

  // Deselect all text
  const deselectText = useCallback(() => {
    setSelectedTextId(null);
    setIsEditingText(false);
  }, []);

  // Switch active side
  const switchTextSide = useCallback((side) => {
    setActiveTextSide(side);
    setSelectedTextId(null);
    setIsEditingText(false);
  }, []);

  // Move text layer to position
  const moveTextLayer = useCallback((layerId, x, y) => {
    updateTextLayer(layerId, { x, y });
  }, [updateTextLayer]);

  // Resize text layer
  const resizeTextLayer = useCallback((layerId, width, height) => {
    updateTextLayer(layerId, { width, height });
  }, [updateTextLayer]);

  // Bring text layer to front
  // IMPORTANT: Use functional update to avoid stale closure
  const bringToFront = useCallback((layerId) => {
    const updateFn = (prev) => {
      const layer = prev.find(l => l.id === layerId);
      if (layer) {
        const otherLayers = prev.filter(l => l.id !== layerId);
        return [...otherLayers, layer];
      }
      return prev;
    };

    if (activeTextSide === 'front') {
      setFrontTextLayers(updateFn);
    } else {
      setBackTextLayers(updateFn);
    }
  }, [activeTextSide]);

  // Send text layer to back
  // IMPORTANT: Use functional update to avoid stale closure
  const sendToBack = useCallback((layerId) => {
    const updateFn = (prev) => {
      const layer = prev.find(l => l.id === layerId);
      if (layer) {
        const otherLayers = prev.filter(l => l.id !== layerId);
        return [layer, ...otherLayers];
      }
      return prev;
    };

    if (activeTextSide === 'front') {
      setFrontTextLayers(updateFn);
    } else {
      setBackTextLayers(updateFn);
    }
  }, [activeTextSide]);

  // Check if there are any text layers
  const hasTextLayers = useMemo(() => {
    return frontTextLayers.length > 0 || backTextLayers.length > 0;
  }, [frontTextLayers, backTextLayers]);

  // Get all text layers for export
  const getAllTextLayers = useCallback(() => {
    return {
      front: frontTextLayers,
      back: backTextLayers,
    };
  }, [frontTextLayers, backTextLayers]);

  // Set all text layers (for restoring state)
  // IMPORTANT: This directly sets both front and back text layers at once
  // Used when restoring a design from the server for editing
  // Each restored layer is validated and merged with default props to ensure
  // it behaves exactly like a newly created text layer
  const setAllTextLayers = useCallback((textData) => {
    console.log('[useTextState] 🔵 setAllTextLayers called with:', {
      frontCount: textData?.front?.length || 0,
      backCount: textData?.back?.length || 0,
      front: textData?.front,
      back: textData?.back,
    });

    // Helper to ensure each layer has all required properties
    const normalizeLayer = (layer) => {
      if (!layer || typeof layer !== 'object') return null;

      // Merge with defaults to ensure all properties exist
      const normalized = {
        ...DEFAULT_TEXT_PROPS,
        id: layer.id || generateId(),
        text: layer.text || 'Text',
        x: layer.x ?? 100,
        y: layer.y ?? 100,
        width: layer.width ?? 200,
        height: layer.height ?? 40,
        rotation: layer.rotation ?? 0,
        // Override with actual layer values
        ...layer,
      };

      console.log('[useTextState] 🔵 Normalized layer:', normalized);
      return normalized;
    };

    // Normalize and filter out invalid layers
    const frontLayers = Array.isArray(textData?.front)
      ? textData.front.map(normalizeLayer).filter(Boolean)
      : [];
    const backLayers = Array.isArray(textData?.back)
      ? textData.back.map(normalizeLayer).filter(Boolean)
      : [];

    console.log('[useTextState] 🔵 Setting frontTextLayers:', frontLayers);
    setFrontTextLayers(frontLayers);

    console.log('[useTextState] 🔵 Setting backTextLayers:', backLayers);
    setBackTextLayers(backLayers);

    console.log('[useTextState] 🔵 setAllTextLayers complete - front:', frontLayers.length, 'back:', backLayers.length);
  }, []);

  // Clear all text layers
  const clearAllText = useCallback(() => {
    setFrontTextLayers([]);
    setBackTextLayers([]);
    setSelectedTextId(null);
    setIsEditingText(false);
  }, []);

  return {
    // State
    frontTextLayers,
    backTextLayers,
    currentTextLayers,
    selectedTextId,
    selectedTextLayer,
    activeTextSide,
    isEditingText,
    hasTextLayers,

    // Actions
    addTextLayer,
    addTextLayerToSide, // For restoring saved text layers during Edit Design
    updateTextLayer,
    updateSelectedText,
    removeTextLayer,
    removeSelectedText,
    duplicateTextLayer,
    selectTextLayer,
    deselectText,
    switchTextSide,
    moveTextLayer,
    resizeTextLayer,
    bringToFront,
    sendToBack,
    getAllTextLayers,
    setAllTextLayers,
    clearAllText,
    setIsEditingText,
  };
};

export default useTextState;
