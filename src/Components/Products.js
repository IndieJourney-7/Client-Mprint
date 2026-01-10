import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

// Fallback images
import Standardboard from "../Assets/Standardboard.jpg";
import A4brochures from "../Assets/A4brochures.jpg";
import circlebusinesscard from "../Assets/circlebusinesscard.jpg";
import certificatesImg from "../Assets/certificates.jpg";
import greetingcard from "../Assets/greetingcard.jpg";
import personalisedcase from "../Assets/personalisedcase.jpg";
import photoFramesImg from "../Assets/photo-frame.png";
import photoPrintsImg from "../Assets/photo-prints.png";
import postersImg from "../Assets/posters.png";

// Fallback image mapping by category slug
const fallbackImages = {
  bookmarks: Standardboard,
  brochures: A4brochures,
  cards: circlebusinesscard,
  certificates: certificatesImg,
  "greeting-cards": greetingcard,
  "personalised-cards": personalisedcase,
  "photo-frames": photoFramesImg,
  "photo-prints": photoPrintsImg,
  posters: postersImg,
};

const Products = () => {
  const scrollRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const API_BASE_URL = "http://127.0.0.1:8000/api";

  // Fetch categories with their products from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories?is_active=true`);
        const data = await response.json();
        if (data.success && data.data) {
          // Filter active categories that have products
          const categoriesWithProducts = (Array.isArray(data.data) ? data.data : [])
            .filter((cat) => cat.is_active && cat.products && cat.products.length > 0)
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          setCategories(categoriesWithProducts);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
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
    scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  };

  // Get featured product image from category
  const getProductImage = (category) => {
    // Get the first product's featured image
    const firstProduct = category.products?.[0];
    if (firstProduct?.featured_image_url) {
      return firstProduct.featured_image_url;
    }
    // Fallback to category image or default
    if (category.image_url) {
      return category.image_url;
    }
    return fallbackImages[category.slug] || circlebusinesscard;
  };

  // Get price display from first product
  const getPriceDisplay = (category) => {
    const firstProduct = category.products?.[0];
    if (firstProduct) {
      const price = firstProduct.sale_price || firstProduct.price;
      // Check if product has quantity pricing
      if (firstProduct.attributes?.quantity?.[0]) {
        const minQty = firstProduct.attributes.quantity[0].quantity;
        return `BUY ${minQty} @ Rs.${parseFloat(price).toFixed(0)}`;
      }
      return `Starting @ Rs.${parseFloat(price).toFixed(0)}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="w-full py-8 md:py-14 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 md:px-10">
          <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-12 text-left">
            Our Most Popular Products
          </h2>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 md:py-14 bg-white">
      <div className="max-w-[1600px] mx-auto px-4 md:px-10">
        <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-12 text-left">
          Our Most Popular Products
        </h2>

        {/* Mobile: 2-column grid or horizontal scroll */}
        <div className="md:hidden">
          {categories.length <= 6 ? (
            // Grid for 6 or fewer categories
            <div className="grid grid-cols-2 gap-x-6 gap-y-8">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className="flex flex-col items-center relative group"
                >
                  {getPriceDisplay(category) && (
                    <div className="absolute top-2 left-2 bg-[#27B1E2] text-white text-[10px] font-medium py-[2px] px-2 rounded-full z-10 shadow">
                      {getPriceDisplay(category)}
                    </div>
                  )}
                  <img
                    src={getProductImage(category)}
                    alt={category.name}
                    className="w-[140px] h-[120px] object-cover mb-2 rounded-md transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  <p className="text-center font-semibold text-[15px] leading-tight mt-0 group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            // Horizontal scroll for more than 6 categories
            <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
              <div className="flex gap-6" style={{ width: "max-content" }}>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/category/${category.slug}`}
                    className="flex flex-col items-center relative group flex-shrink-0"
                  >
                    {getPriceDisplay(category) && (
                      <div className="absolute top-2 left-2 bg-[#27B1E2] text-white text-[10px] font-medium py-[2px] px-2 rounded-full z-10 shadow">
                        {getPriceDisplay(category)}
                      </div>
                    )}
                    <img
                      src={getProductImage(category)}
                      alt={category.name}
                      className="w-[130px] h-[110px] object-cover mb-2 rounded-md transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    <p className="text-center font-semibold text-[14px] leading-tight mt-0 w-[130px] group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Desktop: horizontal scroll with buttons */}
        <div className="hidden md:block relative mt-10 group">
          {/* Left Arrow */}
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border shadow-lg p-3 rounded-full z-20 opacity-0 group-hover:opacity-100 transition hover:scale-110"
              aria-label="Scroll Left"
            >
              <IoChevronBack className="text-2xl" />
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex gap-8 lg:gap-10 overflow-x-auto scroll-smooth px-10 lg:px-14 no-scrollbar py-4"
          >
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="flex flex-col items-center relative min-w-[180px] lg:min-w-[200px] group/item"
              >
                {getPriceDisplay(category) && (
                  <div className="absolute top-2 left-2 bg-[#27B1E2] text-white text-[10px] font-medium py-[2px] px-2 rounded-full z-10 shadow">
                    {getPriceDisplay(category)}
                  </div>
                )}
                <img
                  src={getProductImage(category)}
                  alt={category.name}
                  className="w-[180px] h-[150px] lg:w-[200px] lg:h-[170px] object-cover mb-3 rounded-md transition-all duration-300 group-hover/item:shadow-lg group-hover/item:scale-105"
                  loading="lazy"
                />
                <p className="text-center font-semibold text-[15px] lg:text-[16px] leading-tight mt-0 group-hover/item:text-blue-600 transition-colors">
                  {category.name}
                </p>
              </Link>
            ))}
          </div>

          {/* Right Arrow */}
          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border shadow-lg p-3 rounded-full z-20 opacity-0 group-hover:opacity-100 transition hover:scale-110"
              aria-label="Scroll Right"
            >
              <IoChevronForward className="text-2xl" />
            </button>
          )}
        </div>

        {/* Scroll hint for many categories */}
        {categories.length > 5 && (
          <div className="hidden md:flex justify-center mt-4">
            <span className="text-xs text-gray-400">
              Scroll to see more products →
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
