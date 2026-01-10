/**
 * useCanvasDrag Hook
 * Handles drag and resize interactions for canvas images
 */

import { useState, useCallback, useEffect } from 'react';
import { IMAGE_CONFIG } from '../constants';

export const useCanvasDrag = ({
  currentImage,
  updateCurrentImage,
  canvasRef,
  canvasZoom,
  setHasUnsavedChanges,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialImageState, setInitialImageState] = useState(null);

  // Start drag or resize operation
  const handleMouseDown = useCallback((e, type, handle = null) => {
    e.stopPropagation();
    if (!currentImage) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scale = canvasZoom / 100;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setDragStart({ x, y });
    setInitialImageState({ ...currentImage });

    if (type === 'drag') {
      setIsDragging(true);
    } else if (type === 'resize') {
      setIsResizing(true);
      setResizeHandle(handle);
    }
  }, [currentImage, canvasRef, canvasZoom]);

  // Handle mouse move for drag/resize
  const handleMouseMove = useCallback((e) => {
    if (!isDragging && !isResizing) return;
    if (!currentImage || !initialImageState) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scale = canvasZoom / 100;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;

    if (isDragging) {
      updateCurrentImage({
        ...currentImage,
        x: initialImageState.x + deltaX,
        y: initialImageState.y + deltaY,
      });
    } else if (isResizing && resizeHandle) {
      let newWidth = initialImageState.width;
      let newHeight = initialImageState.height;

      const aspectRatio = initialImageState.width / initialImageState.height;

      switch (resizeHandle) {
        case 'se':
          newWidth = Math.max(IMAGE_CONFIG.minSize, initialImageState.width + deltaX * 2);
          newHeight = newWidth / aspectRatio;
          break;
        case 'sw':
          newWidth = Math.max(IMAGE_CONFIG.minSize, initialImageState.width - deltaX * 2);
          newHeight = newWidth / aspectRatio;
          break;
        case 'ne':
          newWidth = Math.max(IMAGE_CONFIG.minSize, initialImageState.width + deltaX * 2);
          newHeight = newWidth / aspectRatio;
          break;
        case 'nw':
          newWidth = Math.max(IMAGE_CONFIG.minSize, initialImageState.width - deltaX * 2);
          newHeight = newWidth / aspectRatio;
          break;
        default:
          break;
      }

      updateCurrentImage({
        ...currentImage,
        width: newWidth,
        height: newHeight,
      });
    }
  }, [isDragging, isResizing, currentImage, initialImageState, dragStart, canvasZoom, resizeHandle, updateCurrentImage, canvasRef]);

  // End drag/resize operation
  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
      setHasUnsavedChanges(true);
    }
  }, [isDragging, isResizing, setHasUnsavedChanges]);

  // Attach global mouse event listeners
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Get resize handle positions for rendering
  const getResizeHandles = useCallback(() => {
    if (!currentImage) return [];

    const halfW = currentImage.width / 2;
    const halfH = currentImage.height / 2;

    return [
      { id: 'nw', x: currentImage.x - halfW, y: currentImage.y - halfH },
      { id: 'ne', x: currentImage.x + halfW, y: currentImage.y - halfH },
      { id: 'sw', x: currentImage.x - halfW, y: currentImage.y + halfH },
      { id: 'se', x: currentImage.x + halfW, y: currentImage.y + halfH },
    ];
  }, [currentImage]);

  return {
    isDragging,
    isResizing,
    handleMouseDown,
    getResizeHandles,
  };
};

export default useCanvasDrag;
