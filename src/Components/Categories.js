import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

// Fallback images for categories without images
import bookmarks from "../Assets/bookmarks.png";
import brochures from "../Assets/brochures.png";
import cardimg from "../Assets/Cardimg.jpg";
import certificates from "../Assets/certificates.jpg";
import greetingCards from "../Assets/greeting-cards.png";
import photoFrame from "../Assets/photo-frame.png";
import photoPrints from "../Assets/photo-prints.png";
import posters from "../Assets/posters.png";
import personalisedcase from "../Assets/personalisedcase.jpg";

// Fallback image mapping by category slug
const fallbackImages = {
  bookmarks: bookmarks,
  brochures: brochures,
  cards: cardimg,
  certificates: certificates,
  "greeting-cards": greetingCards,
  "personalised-cards": personalisedcase,
  "photo-frames": photoFrame,
  "photo-prints": photoPrints,
  posters: posters,
};

const Categories = () => {
  const scrollRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const API_BASE_URL = "http://127.0.0.1:8000/api";

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories?is_active=true`);
        const data = await response.json();
        if (data.success && data.data) {
          const sortedCategories = (Array.isArray(data.data) ? data.data : [])
            .filter((cat) => cat.is_active)
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          setCategories(sortedCategories);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Check scroll position for arrow visibility
  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener("scroll", checkScrollPosition);
      window.addEventListener("resize", checkScrollPosition);
      return () => {
        scrollEl.removeEventListener("scroll", checkScrollPosition);
        window.removeEventListener("resize", checkScrollPosition);
      };
    }
  }, [categories]);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -350, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 350, behavior: "smooth" });
  };

  // Get category image with fallback
  const getCategoryImage = (category) => {
    if (category.image_url) {
      return category.image_url;
    }
    return fallbackImages[category.slug] || cardimg;
  };

  if (loading) {
    return (
      <div className="w-full py-10 md:py-16 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 md:px-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-10 text-center md:text-left">
            Explore all categories
          </h2>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-10 md:py-16 bg-white">
      <div className="max-w-[1600px] mx-auto px-4 md:px-10 relative group">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-10 text-center md:text-left">
          Explore all categories
        </h2>

        {/* Mobile Grid - 2 columns with horizontal scroll if many categories */}
        <div className="md:hidden">
          {categories.length <= 8 ? (
            // Grid for 8 or fewer categories
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className="flex flex-col items-center group/item"
                >
                  <div className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-full bg-white shadow-md overflow-hidden transition-transform group-hover/item:scale-105">
                    <img
                      src={getCategoryImage(category)}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-center mt-2 text-xs sm:text-sm font-semibold px-1 group-hover/item:text-blue-600 transition-colors">
                    {category.name}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            // Horizontal scroll for more than 8 categories
            <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
              <div className="flex gap-4" style={{ width: "max-content" }}>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/category/${category.slug}`}
                    className="flex flex-col items-center group/item flex-shrink-0"
                  >
                    <div className="w-[90px] h-[90px] rounded-full bg-white shadow-md overflow-hidden transition-transform group-hover/item:scale-105">
                      <img
                        src={getCategoryImage(category)}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <p className="text-center mt-2 text-xs font-semibold w-[90px] leading-tight group-hover/item:text-blue-600 transition-colors">
                      {category.name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Scroll with navigation arrows */}
        <div className="hidden md:block relative">
          <div className="relative flex items-center">
            {/* Left Arrow - only show when can scroll left */}
            {canScrollLeft && (
              <button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-lg p-3 rounded-full z-20 opacity-0 group-hover:opacity-100 transition hover:scale-110 hover:shadow-xl"
                aria-label="Scroll left"
              >
                <IoChevronBack className="text-2xl text-gray-700" />
              </button>
            )}

            {/* Scrollable Container */}
            <div
              ref={scrollRef}
              className="flex gap-10 lg:gap-16 overflow-x-auto px-8 lg:px-14 scroll-smooth no-scrollbar py-4"
            >
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className="flex flex-col items-center min-w-[140px] lg:min-w-[160px] group/item"
                >
                  <div className="w-[120px] h-[120px] lg:w-[150px] lg:h-[150px] rounded-full bg-white shadow-md overflow-hidden transition-all duration-300 group-hover/item:shadow-xl group-hover/item:scale-105">
                    <img
                      src={getCategoryImage(category)}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-center mt-3 text-sm font-semibold w-[140px] lg:w-[160px] leading-snug group-hover/item:text-blue-600 transition-colors">
                    {category.name}
                  </p>
                </Link>
              ))}
            </div>

            {/* Right Arrow - only show when can scroll right */}
            {canScrollRight && (
              <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-lg p-3 rounded-full z-20 opacity-0 group-hover:opacity-100 transition hover:scale-110 hover:shadow-xl"
                aria-label="Scroll right"
              >
                <IoChevronForward className="text-2xl text-gray-700" />
              </button>
            )}
          </div>

          {/* Scroll indicator dots for many categories */}
          {categories.length > 6 && (
            <div className="flex justify-center mt-4 gap-1">
              <span className="text-xs text-gray-400">
                Scroll to see more categories →
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Categories;
