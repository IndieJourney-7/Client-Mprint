import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [offerBars, setOfferBars] = useState([]);
  const [heroBanners, setHeroBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

  // Fetch offer bars and hero banners
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch active offer bars
        const offersResponse = await fetch(`${API_BASE_URL}/offer-bars?active_only=1`);
        const offersData = await offersResponse.json();
        if (offersData.success) {
          setOfferBars(offersData.data);
        }

        // Fetch active hero banners
        const bannersResponse = await fetch(`${API_BASE_URL}/banners?type=hero&active_only=1`);
        const bannersData = await bannersResponse.json();
        if (bannersData.success) {
          setHeroBanners(bannersData.data);
        }
      } catch (err) {
        console.error("Failed to fetch banners:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-rotate offer bars
  useEffect(() => {
    if (offerBars.length > 1) {
      const interval = setInterval(() => {
        setCurrentOfferIndex((prev) => (prev + 1) % offerBars.length);
      }, 5000); // Change every 5 seconds
      return () => clearInterval(interval);
    }
  }, [offerBars]);

  const handleBannerClick = (banner) => {
    if (banner.button_link) {
      if (banner.button_link.startsWith('http')) {
        window.location.href = banner.button_link;
      } else {
        navigate(banner.button_link);
      }
    }
  };

  const currentOffer = offerBars[currentOfferIndex];

  // Get left and right hero banners
  const leftBanner = heroBanners.find(b => b.position === 'left') || heroBanners[0];
  const rightBanner = heroBanners.find(b => b.position === 'right') || heroBanners[1];

  return (
    <div className="w-full bg-white">
      {/* Offer bar - Dynamic with rotation */}
      {currentOffer && (
        <div
          style={{
            backgroundColor: currentOffer.background_color,
            color: currentOffer.text_color
          }}
          className="flex items-center justify-between px-4 md:px-12 py-3 text-sm md:text-base transition-all duration-500"
        >
          <span
            className="text-lg md:text-xl cursor-pointer hover:opacity-70 select-none"
            onClick={() => setCurrentOfferIndex((prev) => (prev - 1 + offerBars.length) % offerBars.length)}
          >
            &lt;
          </span>
          <p className="flex-grow text-center font-medium mx-4" dangerouslySetInnerHTML={{ __html: currentOffer.message }} />
          <span
            className="text-lg md:text-xl cursor-pointer hover:opacity-70 select-none"
            onClick={() => setCurrentOfferIndex((prev) => (prev + 1) % offerBars.length)}
          >
            &gt;
          </span>
        </div>
      )}

      {/* Hero / banners - Dynamic from API */}
      {loading ? (
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 bg-white">
          {/* Left Banner */}
          {leftBanner && (
            <div
              className="relative h-[320px] md:h-screen bg-cover bg-center md:rounded-none rounded-t-2xl md:rounded-none"
              style={{ backgroundImage: `url(${leftBanner.image_url})` }}
            >
              <div className="absolute bottom-8 left-1/2 md:left-12 md:bottom-12 transform -translate-x-1/2 md:translate-x-0 bg-white bg-opacity-90 md:bg-opacity-100 shadow-lg p-6 md:p-8 rounded-2xl w-[90%] md:w-[380px] text-center md:text-left">
                <h2 className="text-2xl md:text-4xl font-semibold mb-3">
                  {leftBanner.title}
                </h2>
                {leftBanner.subtitle && (
                  <p className="text-base md:text-lg text-gray-700">
                    {leftBanner.subtitle}
                  </p>
                )}
                {leftBanner.price_text && (
                  <p className="text-base md:text-lg text-gray-700 mb-4">
                    {leftBanner.price_text}
                  </p>
                )}
                {leftBanner.description && (
                  <p className="text-sm text-gray-600 mb-4">
                    {leftBanner.description}
                  </p>
                )}
                <button
                  onClick={() => handleBannerClick(leftBanner)}
                  className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-900 transition"
                >
                  {leftBanner.button_text}
                </button>
              </div>
            </div>
          )}

          {/* Right Banner */}
          {rightBanner && (
            <div
              className="relative h-[320px] md:h-screen bg-cover bg-center md:rounded-none rounded-b-2xl md:rounded-none"
              style={{ backgroundImage: `url(${rightBanner.image_url})` }}
            >
              <div className="absolute bottom-8 left-1/2 md:left-12 md:bottom-12 transform -translate-x-1/2 md:translate-x-0 bg-white bg-opacity-90 md:bg-opacity-100 shadow-lg p-6 md:p-8 rounded-2xl w-[90%] md:w-[380px] text-center md:text-left">
                <h2 className="text-2xl md:text-4xl font-semibold mb-3">
                  {rightBanner.title}
                </h2>
                {rightBanner.subtitle && (
                  <p className="text-base md:text-lg text-gray-700">
                    {rightBanner.subtitle}
                  </p>
                )}
                {rightBanner.price_text && (
                  <p className="text-base md:text-lg text-gray-700 mb-4">
                    {rightBanner.price_text}
                  </p>
                )}
                {rightBanner.description && (
                  <p className="text-sm text-gray-600 mb-4">
                    {rightBanner.description}
                  </p>
                )}
                <button
                  onClick={() => handleBannerClick(rightBanner)}
                  className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-900 transition"
                >
                  {rightBanner.button_text}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
