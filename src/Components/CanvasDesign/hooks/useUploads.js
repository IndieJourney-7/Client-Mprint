/**
 * useUploads Hook
 * Manages user's uploaded images library and upload operations
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/api';
import { ALLOWED_TYPES, MAX_FILE_SIZE } from '../constants';
import { createImageData } from '../utils/imageHelpers';

export const useUploads = ({ safeArea, designId }) => {
  const [recentUploads, setRecentUploads] = useState([]);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  // Menu state for upload items
  const [activeUploadMenu, setActiveUploadMenu] = useState(null);
  const [showImageDetails, setShowImageDetails] = useState(null);

  // Fetch recent uploads from server
  useEffect(() => {
    const fetchRecentUploads = async () => {
      setLoadingUploads(true);
      try {
        await api.get('/sanctum/csrf-cookie');
        const userRes = await api.get('/api/user');
        if (userRes.data?.user || userRes.data?.data) {
          setIsLoggedIn(true);
          try {
            const response = await api.get('/api/uploads/recent?limit=20');
            if (response.data?.success && response.data?.data) {
              setRecentUploads(response.data.data);
            }
          } catch (uploadError) {
            console.log('Could not fetch uploads, panel will be empty');
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.log('User not logged in - uploads panel disabled');
        setIsLoggedIn(false);
      } finally {
        setLoadingUploads(false);
      }
    };
    fetchRecentUploads();
  }, []);

  // Save image to user's library
  const saveToUserLibrary = useCallback(async (file) => {
    if (!isLoggedIn) return null;

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/api/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.success && response.data?.data) {
        setRecentUploads((prev) => [response.data.data, ...prev.slice(0, 19)]);
        console.log('Image saved to user library:', response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.error('Failed to save image to library:', error);
    }
    return null;
  }, [isLoggedIn]);

  // Mark upload as used
  const markUploadAsUsed = useCallback(async (uploadId) => {
    if (!isLoggedIn || !uploadId) return;
    try {
      await api.post(`/api/uploads/${uploadId}/used`);
    } catch (error) {
      console.error('Failed to mark upload as used:', error);
    }
  }, [isLoggedIn]);

  // Delete upload from library
  const deleteUploadFromLibrary = useCallback(async (uploadId, e) => {
    e?.stopPropagation();

    if (!isLoggedIn || !uploadId) return;

    if (!window.confirm('Are you sure you want to delete this image from your library?')) {
      return;
    }

    try {
      const response = await api.delete(`/api/uploads/${uploadId}`);
      if (response.data?.success) {
        setRecentUploads((prev) => prev.filter((upload) => upload.id !== uploadId));
        console.log('Upload deleted successfully');
      }
    } catch (error) {
      console.error('Failed to delete upload:', error);
      alert('Failed to delete image. Please try again.');
    }
  }, [isLoggedIn]);

  // Copy library image to design (so it appears in cart)
  const copyUploadToDesign = useCallback(async (uploadId, side) => {
    if (!designId) {
      console.warn('Cannot copy to design: no designId');
      return Promise.resolve();
    }

    console.log(`Copying upload ${uploadId} to ${side} design...`);

    return api
      .post(`/api/designs/${designId}/copy-from-upload`, {
        upload_id: uploadId,
        side: side,
      })
      .then(() => {
        console.log(`Library image copied to ${side} design successfully`);
      })
      .catch((error) => {
        console.error('Failed to copy library image to design:', error);
      });
  }, [designId]);

  // Upload image to design server
  const uploadImageToServer = useCallback(async (file, side) => {
    if (!designId) {
      console.warn('No designId available for server upload');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('side', side);
      formData.append('image', file);

      await api.post(`/api/designs/${designId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log(`${side} design uploaded to server successfully`);
    } catch (error) {
      console.error(`Failed to upload ${side} design to server:`, error);
    }
  }, [designId]);

  // Validate file before upload
  const validateFile = useCallback((file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPG, PNG, or WebP.');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File too large. Maximum 25MB.');
    }
    return true;
  }, []);

  // Handle file upload and return image data
  const processFileUpload = useCallback((file, uploadingSide) => {
    return new Promise((resolve, reject) => {
      setUploadError('');
      setUploading(true);

      try {
        validateFile(file);

        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = async () => {
            const imageData = createImageData(
              event.target.result,
              img.width,
              img.height,
              safeArea
            );

            setUploading(false);

            // Save to library and server in background
            saveToUserLibrary(file);
            uploadImageToServer(file, uploadingSide);

            resolve(imageData);
          };
          img.onerror = () => {
            setUploadError('Failed to load image');
            setUploading(false);
            reject(new Error('Failed to load image'));
          };
          img.src = event.target.result;
        };
        reader.onerror = () => {
          setUploadError('Failed to read file');
          setUploading(false);
          reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(file);
      } catch (error) {
        setUploadError(error.message);
        setUploading(false);
        reject(error);
      }
    });
  }, [safeArea, validateFile, saveToUserLibrary, uploadImageToServer]);

  // Apply image from library
  const loadImageFromLibrary = useCallback((upload, selectingSide) => {
    return new Promise((resolve) => {
      const applyImageData = (img, imgSrc) => {
        const imageData = createImageData(
          imgSrc,
          img.width,
          img.height,
          safeArea,
          { uploadId: upload.id }
        );

        // Mark as used and copy to design in background
        markUploadAsUsed(upload.id);
        const copyPromise = copyUploadToDesign(upload.id, selectingSide);

        resolve({ imageData, copyPromise });
      };

      // Try loading with crossOrigin first
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => applyImageData(img, upload.file_url);
      img.onerror = () => {
        // Fallback without crossOrigin
        const fallbackImg = new Image();
        fallbackImg.onload = () => applyImageData(fallbackImg, upload.file_url);
        fallbackImg.onerror = () => {
          // Try thumbnail as last resort
          if (upload.thumbnail_url && upload.thumbnail_url !== upload.file_url) {
            const thumbImg = new Image();
            thumbImg.onload = () => applyImageData(thumbImg, upload.thumbnail_url);
            thumbImg.onerror = () => {
              alert('Failed to load image. The image may be corrupted or inaccessible.');
              resolve(null);
            };
            thumbImg.src = upload.thumbnail_url;
          } else {
            alert('Failed to load image. Please try uploading again.');
            resolve(null);
          }
        };
        fallbackImg.src = upload.file_url;
      };
      img.src = upload.file_url;
    });
  }, [safeArea, markUploadAsUsed, copyUploadToDesign]);

  return {
    // State
    recentUploads,
    loadingUploads,
    isLoggedIn,
    uploading,
    uploadError,
    activeUploadMenu,
    showImageDetails,

    // Setters
    setUploadError,
    setActiveUploadMenu,
    setShowImageDetails,

    // Actions
    processFileUpload,
    loadImageFromLibrary,
    deleteUploadFromLibrary,
    saveToUserLibrary,
  };
};

export default useUploads;
