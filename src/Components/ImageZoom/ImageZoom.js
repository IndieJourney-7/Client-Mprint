import { useState, useRef, useCallback } from "react";

/**
 * ImageZoom Component - Lens/Magnifier style zoom on hover
 * 
 * @param {string} src - Image source URL
 * @param {string} alt - Image alt text
 * @param {string} className - Additional classes for the container
 * @param {number} zoomLevel - Magnification level (default: 2)
 * @param {number} lensSize - Diameter of the magnifying lens in pixels (default: 150)
 * @param {function} onError - Image error handler
 */
const ImageZoom = ({
  src,
  alt = "Product image",
  className = "",
  zoomLevel = 2,
  lensSize = 150,
  onError,
}) => {
  const [isZooming, setIsZooming] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const [backgroundPosition, setBackgroundPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleMouseEnter = useCallback(() => {
    setIsZooming(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsZooming(false);
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const lensRadius = lensSize / 2;

      // Calculate cursor position relative to container
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;

      // Clamp lens position to stay within image bounds
      x = Math.max(lensRadius, Math.min(x, rect.width - lensRadius));
      y = Math.max(lensRadius, Math.min(y, rect.height - lensRadius));

      // Set lens center position
      setLensPosition({ x, y });

      // Calculate background position for zoomed view
      // The background needs to show the zoomed area centered in the lens
      const bgX = ((x / rect.width) * 100);
      const bgY = ((y / rect.height) * 100);
      setBackgroundPosition({ x: bgX, y: bgY });
    },
    [lensSize]
  );

  // Touch support for mobile - tap to toggle zoom
  const [isTouchZooming, setIsTouchZooming] = useState(false);

  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    setIsTouchZooming(true);
    setIsZooming(true);
    
    if (containerRef.current && e.touches[0]) {
      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const lensRadius = lensSize / 2;

      let x = touch.clientX - rect.left;
      let y = touch.clientY - rect.top;

      x = Math.max(lensRadius, Math.min(x, rect.width - lensRadius));
      y = Math.max(lensRadius, Math.min(y, rect.height - lensRadius));

      setLensPosition({ x, y });
      const bgX = (x / rect.width) * 100;
      const bgY = (y / rect.height) * 100;
      setBackgroundPosition({ x: bgX, y: bgY });
    }
  }, [lensSize]);

  const handleTouchMove = useCallback((e) => {
    if (!isTouchZooming || !containerRef.current || !e.touches[0]) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const lensRadius = lensSize / 2;

    let x = touch.clientX - rect.left;
    let y = touch.clientY - rect.top;

    x = Math.max(lensRadius, Math.min(x, rect.width - lensRadius));
    y = Math.max(lensRadius, Math.min(y, rect.height - lensRadius));

    setLensPosition({ x, y });
    const bgX = (x / rect.width) * 100;
    const bgY = (y / rect.height) * 100;
    setBackgroundPosition({ x: bgX, y: bgY });
  }, [isTouchZooming, lensSize]);

  const handleTouchEnd = useCallback(() => {
    setIsTouchZooming(false);
    setIsZooming(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden cursor-crosshair ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Base Image */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover pointer-events-none select-none"
        draggable={false}
        onError={onError}
      />

      {/* Magnifying Lens */}
      {isZooming && src && (
        <div
          className="absolute rounded-full border-2 border-white shadow-lg pointer-events-none z-10"
          style={{
            width: lensSize,
            height: lensSize,
            left: lensPosition.x - lensSize / 2,
            top: lensPosition.y - lensSize / 2,
            backgroundImage: `url(${src})`,
            backgroundSize: `${zoomLevel * 100}%`,
            backgroundPosition: `${backgroundPosition.x}% ${backgroundPosition.y}%`,
            backgroundRepeat: "no-repeat",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255,255,255,0.5)",
          }}
        />
      )}

      {/* Subtle hint on mobile */}
      <div className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block">
        Hover to zoom
      </div>
    </div>
  );
};

export default ImageZoom;
