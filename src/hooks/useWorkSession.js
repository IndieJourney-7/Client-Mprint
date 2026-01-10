import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/api';

const useWorkSession = (productId, orientation, shape, selectedAttributes) => {
  const [sessionId, setSessionId] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const saveTimerRef = useRef(null);

  // Initialize or restore session
  useEffect(() => {
    if (!productId) return;

    const initSession = async () => {
      try {
        // Check localStorage for existing session
        const storedSessionId = localStorage.getItem(`work_session_${productId}`);

        const response = await api.post('/api/work-sessions/init', {
          product_id: productId,
          session_id: storedSessionId,
          orientation: orientation || 'horizontal',
          shape: shape || 'rectangle',
          selected_attributes: selectedAttributes || {},
        });

        if (response.data?.success) {
          const session = response.data.data;
          setSessionId(session.session_id);
          setSessionData(session);
          localStorage.setItem(`work_session_${productId}`, session.session_id);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize work session:', error);
      }
    };

    initSession();
  }, [productId, orientation, shape, selectedAttributes]);

  // Auto-save function (debounced)
  const saveSession = useCallback(
    async (data) => {
      if (!sessionId) return;

      // Clear existing timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      // Debounce save by 1 second
      saveTimerRef.current = setTimeout(async () => {
        try {
          const response = await api.post('/api/work-sessions/save', {
            session_id: sessionId,
            ...data,
          });

          if (response.data?.success) {
            setSessionData(response.data.data);
          }
        } catch (error) {
          console.error('Failed to save work session:', error);
        }
      }, 1000);
    },
    [sessionId]
  );

  // Link design to session
  const linkDesign = useCallback(
    async (designId) => {
      if (!sessionId) return;

      try {
        const response = await api.post('/api/work-sessions/link-design', {
          session_id: sessionId,
          design_id: designId,
        });

        if (response.data?.success) {
          setSessionData(response.data.data);
        }
      } catch (error) {
        console.error('Failed to link design to session:', error);
      }
    },
    [sessionId]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return {
    sessionId,
    sessionData,
    isInitialized,
    saveSession,
    linkDesign,
  };
};

export default useWorkSession;
