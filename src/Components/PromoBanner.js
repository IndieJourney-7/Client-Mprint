import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function PromoBanner() {
  const navigate = useNavigate();
  const [promoBanners, setPromoBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = "http://127.0.0.1:8000/api";

  useEffect(() => {
    const fetchPromoBanners = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/banners?type=promo&active_only=1`);
        const data = await response.json();
        if (data.success) {
          setPromoBanners(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch promo banners:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPromoBanners();
  }, []);

  const handleBannerClick = (banner) => {
    if (banner.button_link) {
      if (banner.button_link.startsWith('http')) {
        window.location.href = banner.button_link;
      } else {
        navigate(banner.button_link);
      }
    }
  };

  // Get left and right promo banners
  const leftBanner = promoBanners.find(b => b.position === 'left') || promoBanners[0];
  const rightBanner = promoBanners.find(b => b.position === 'right') || promoBanners[1];

  if (loading) {
    return (
      <div className="w-full h-[550px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (promoBanners.length === 0) {
    return null;
  }

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-0">
      {/* LEFT SIDE Banner */}
      {leftBanner && (
        <div
          className="relative h-[550px] bg-cover bg-center"
          style={{ backgroundImage: `url(${leftBanner.image_url})` }}
        >
          <div className="absolute top-[62%] -translate-y-1/2 left-8 sm:left-10 bg-white rounded-3xl shadow-xl p-6 sm:p-8 w-[75%] sm:w-[320px]">
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
              {leftBanner.title}
            </h2>

            {leftBanner.subtitle && (
              <p className="text-md sm:text-lg mt-3 font-medium text-gray-700">
                {leftBanner.subtitle}
              </p>
            )}

            {leftBanner.price_text && (
              <p className="text-md sm:text-lg mt-3 font-medium text-gray-700">
                {leftBanner.price_text}
              </p>
            )}

            {leftBanner.description && (
              <p className="text-sm text-gray-600 mt-2">
                {leftBanner.description}
              </p>
            )}

            <div className="mt-6">
              <button
                onClick={() => handleBannerClick(leftBanner)}
                className="bg-black text-white px-5 py-3 rounded-xl font-semibold hover:bg-gray-900 transition cursor-pointer w-full"
              >
                {leftBanner.button_text}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RIGHT SIDE Banner */}
      {rightBanner && (
        <div
          className="relative h-[550px] bg-cover bg-center"
          style={{ backgroundImage: `url(${rightBanner.image_url})` }}
        >
          <div className="absolute top-[62%] -translate-y-1/2 left-8 sm:left-10 bg-white rounded-3xl shadow-xl p-6 sm:p-8 w-[75%] sm:w-[320px]">
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
              {rightBanner.title}
            </h2>

            {rightBanner.subtitle && (
              <p className="text-md sm:text-lg mt-3 font-medium text-gray-700">
                {rightBanner.subtitle}
              </p>
            )}

            {rightBanner.price_text && (
              <p className="text-md sm:text-lg mt-3 font-medium text-gray-700">
                {rightBanner.price_text}
              </p>
            )}

            {rightBanner.description && (
              <p className="text-sm text-gray-600 mt-2">
                {rightBanner.description}
              </p>
            )}

            <div className="mt-6">
              <button
                onClick={() => handleBannerClick(rightBanner)}
                className="bg-black text-white px-5 py-3 rounded-xl font-semibold hover:bg-gray-900 transition cursor-pointer w-full"
              >
                {rightBanner.button_text}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PromoBanner;
