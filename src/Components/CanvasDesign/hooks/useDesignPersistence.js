/**
 * useDesignPersistence Hook
 * Handles saving and loading design state to/from server
 */

import { useState, useCallback, useEffect } from 'react';
import api from '../../../api/api';
import { createImageData } from '../utils/imageHelpers';

export const useDesignPersistence = ({
  designId,
  sessionId,
  safeArea,
  initialFrontState,
  initialBackState,
  initialFrontImage,
  initialBackImage,
  setFrontImage,
  setBackImage,
}) => {
  const [savingCanvasState, setSavingCanvasState] = useState(false);
  const [loadingInitialImages, setLoadingInitialImages] = useState(
    !!(initialFrontImage || initialBackImage)
  );
  const [pendingCopyPromise, setPendingCopyPromise] = useState(null);

  // Load initial canvas state from props (when editing from cart)
  useEffect(() => {
    console.log('[useDesignPersistence] Initial state check:', {
      hasFrontImage: !!initialFrontImage,
      hasBackImage: !!initialBackImage,
      frontImageUrl: initialFrontImage?.substring(0, 80),
      backImageUrl: initialBackImage?.substring(0, 80),
    });

    if (!initialFrontImage && !initialBackImage) {
      console.log('[useDesignPersistence] No initial images to load');
      setLoadingInitialImages(false);
      return;
    }

    const loadInitialState = async () => {
      setLoadingInitialImages(true);
      console.log('[useDesignPersistence] Loading initial state:', {
        initialFrontState,
        initialBackState,
        initialFrontImage: initialFrontImage?.substring(0, 80),
        initialBackImage: initialBackImage?.substring(0, 80),
        safeArea,
      });

      const imageLoadPromises = [];

      // Load front image
      if (initialFrontImage) {
        const frontPromise = loadInitialImage(
          initialFrontImage,
          initialFrontState,
          safeArea,
          setFrontImage
        );
        imageLoadPromises.push(frontPromise);
      }

      // Load back image
      if (initialBackImage) {
        const backPromise = loadInitialImage(
          initialBackImage,
          initialBackState,
          safeArea,
          setBackImage
        );
        imageLoadPromises.push(backPromise);
      }

      await Promise.all(imageLoadPromises);
      console.log('All initial images loaded');
      setLoadingInitialImages(false);
    };

    loadInitialState();
  }, [initialFrontState, initialBackState, initialFrontImage, initialBackImage, safeArea, setFrontImage, setBackImage]);

  // Helper to load a single initial image
  const loadInitialImage = (imageUrl, canvasState, safeArea, setImage) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        console.log('Image loaded successfully:', img.width, 'x', img.height);

        // Convert HTTP URL to data URL to avoid CORS issues in canvas export
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');

        console.log('[loadInitialImage] Converted to data URL, length:', dataUrl.length);

        if (canvasState && canvasState.x !== undefined) {
          // Use saved canvas state with data URL
          setImage({
            src: dataUrl,
            x: canvasState.x,
            y: canvasState.y,
            width: canvasState.width,
            height: canvasState.height,
            rotation: canvasState.rotation || 0,
            naturalWidth: canvasState.naturalWidth || img.width,
            naturalHeight: canvasState.naturalHeight || img.height,
          });
        } else {
          // Center in safe area with data URL
          const imageData = createImageData(dataUrl, img.width, img.height, safeArea);
          setImage(imageData);
        }
        resolve();
      };

      img.onerror = (error) => {
        console.error('[loadInitialImage] Failed to load with CORS:', {
          url: imageUrl,
          error: error
        });

        // Try fetching the image via fetch API with credentials
        // This can sometimes work when direct Image loading fails
        console.log('[loadInitialImage] Attempting fetch API fallback...');

        fetch(imageUrl, { credentials: 'include' })
          .then(response => {
            if (!response.ok) throw new Error('Fetch failed');
            return response.blob();
          })
          .then(blob => {
            // Convert blob to data URL
            const reader = new FileReader();
            reader.onloadend = () => {
              const dataUrl = reader.result;
              console.log('[loadInitialImage] Fetch API succeeded, converted to data URL, length:', dataUrl.length);

              // Load image to get dimensions
              const tempImg = new Image();
              tempImg.onload = () => {
                if (canvasState && canvasState.x !== undefined) {
                  setImage({
                    src: dataUrl,
                    x: canvasState.x,
                    y: canvasState.y,
                    width: canvasState.width,
                    height: canvasState.height,
                    rotation: canvasState.rotation || 0,
                    naturalWidth: canvasState.naturalWidth || tempImg.width,
                    naturalHeight: canvasState.naturalHeight || tempImg.height,
                  });
                } else {
                  const imageData = createImageData(dataUrl, tempImg.width, tempImg.height, safeArea);
                  setImage(imageData);
                }
                resolve();
              };
              tempImg.onerror = () => {
                console.error('[loadInitialImage] Failed to load data URL after fetch');
                resolve();
              };
              tempImg.src = dataUrl;
            };
            reader.readAsDataURL(blob);
          })
          .catch(fetchError => {
            console.error('[loadInitialImage] Fetch API also failed:', fetchError);

            // Final fallback: Use HTTP URL directly without conversion
            // The image will display in canvas, but we can't convert to data URL
            // generateCompleteCardPreview will handle CORS fallback during export
            console.warn('[loadInitialImage] Using HTTP URL directly (no data URL conversion due to CORS)');

            // Load image to get dimensions, but use HTTP URL as src
            const fallbackImg = new Image();
            fallbackImg.onload = () => {
              if (canvasState && canvasState.x !== undefined) {
                // Use saved canvas state with HTTP URL
                setImage({
                  src: imageUrl, // HTTP URL - will work for display, may fail for export
                  x: canvasState.x,
                  y: canvasState.y,
                  width: canvasState.width,
                  height: canvasState.height,
                  rotation: canvasState.rotation || 0,
                  naturalWidth: canvasState.naturalWidth || fallbackImg.width,
                  naturalHeight: canvasState.naturalHeight || fallbackImg.height,
                });
              } else {
                // Center in safe area with HTTP URL
                const imageData = createImageData(imageUrl, fallbackImg.width, fallbackImg.height, safeArea);
                setImage(imageData);
              }
              resolve();
            };
            fallbackImg.onerror = () => {
              console.error('[loadInitialImage] Fallback image also failed to load');
              resolve();
            };
            fallbackImg.src = imageUrl;
          });
      };

      img.src = imageUrl;
    });
  };

  // Save canvas state to server (auto-save to work session and design)
  // Now includes text layers for complete state restoration
  const saveCanvasStateToServer = useCallback(async (frontImage, backImage, frontTextLayers = null, backTextLayers = null) => {
    if (!designId && !sessionId) {
      console.log('Cannot save canvas state: no designId or sessionId');
      return false;
    }

    setSavingCanvasState(true);
    try {
      const payload = {
        front_canvas_state: frontImage
          ? {
              x: frontImage.x,
              y: frontImage.y,
              width: frontImage.width,
              height: frontImage.height,
              rotation: frontImage.rotation || 0,
              naturalWidth: frontImage.naturalWidth,
              naturalHeight: frontImage.naturalHeight,
            }
          : null,
        back_canvas_state: backImage
          ? {
              x: backImage.x,
              y: backImage.y,
              width: backImage.width,
              height: backImage.height,
              rotation: backImage.rotation || 0,
              naturalWidth: backImage.naturalWidth,
              naturalHeight: backImage.naturalHeight,
            }
          : null,
        // Include text layers for complete state restoration during edit
        front_text_layers: frontTextLayers,
        back_text_layers: backTextLayers,
      };

      console.log('Saving canvas state payload:', payload);

      // Save to design if designId exists
      if (designId) {
        await api.post(`/api/designs/${designId}/canvas-state`, payload);
        console.log('Canvas state saved to design successfully');
      }

      // Auto-save to work session
      if (sessionId) {
        await api.post('/api/work-sessions/save', {
          session_id: sessionId,
          ...payload,
        });
        console.log('Canvas state saved to work session successfully');
      }

      return true;
    } catch (error) {
      console.error('Failed to save canvas state:', error);
      return false;
    } finally {
      setSavingCanvasState(false);
    }
  }, [designId, sessionId]);

  // Save design for later
  const saveDesign = useCallback(async (frontImage, backImage, productId, orientation, generatePrintPreviewFn) => {
    try {
      // Generate print-ready previews (async)
      const frontPrintReady = frontImage ? await generatePrintPreviewFn(frontImage) : null;
      const backPrintReady = backImage ? await generatePrintPreviewFn(backImage) : null;
      
      const designData = {
        product_id: productId,
        front_preview: frontPrintReady || frontImage?.src,
        back_preview: backPrintReady || backImage?.src,
        front_print_ready: frontPrintReady,
        back_print_ready: backPrintReady,
        orientation,
      };
      await api.post('/api/designs/save', designData);
      return { success: true, data: designData };
    } catch (error) {
      console.error('Failed to save design:', error);
      return { success: false, error };
    }
  }, []);

  return {
    savingCanvasState,
    loadingInitialImages,
    pendingCopyPromise,
    setPendingCopyPromise,
    saveCanvasStateToServer,
    saveDesign,
  };
};

export default useDesignPersistence;
