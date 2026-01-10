import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

function Newarrival() {
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = "http://127.0.0.1:8000/api";

  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" });

  // Fetch new arrivals from API
  useEffect(() => {
    const fetchNewArrivals = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/products/new-arrivals?per_page=12`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success && data.data) {
          // Handle both paginated and non-paginated responses
          const productList = data.data.data || data.data;
          setProducts(Array.isArray(productList) ? productList : []);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Failed to fetch new arrivals:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNewArrivals();
  }, []);

  const getProductImageUrl = (product) => {
    if (product.featured_image) {
      return `${API_BASE_URL.replace("/api", "")}/storage/${product.featured_image}`;
    }
    if (product.images && product.images.length > 0) {
      return product.images[0].image_url ||
        `${API_BASE_URL.replace("/api", "")}/storage/${product.images[0].image_path}`;
    }
    if (product.image_url) {
      return product.image_url;
    }
    return "https://via.placeholder.com/200x170?text=New+Product";
  };

  const getCategorySlug = (product) => {
    if (product.category?.slug) {
      return product.category.slug;
    }
    return "products";
  };

  const handleProductClick = (product) => {
    const categorySlug = getCategorySlug(product);
    navigate(`/${categorySlug}/${product.slug}`);
  };

  if (loading) {
    return (
      <div className="w-full py-8 md:py-14 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 md:px-10">
          <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-12 text-left">
            New Arrivals
          </h2>
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-8 md:py-14 bg-white">
      <div className="max-w-[1600px] mx-auto px-4 md:px-10">
        <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-12 text-left">
          New Arrivals
        </h2>
        {/* Mobile: 2-column grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:hidden">
          {products.map((product) => {
            const imageUrl = getProductImageUrl(product);
            return (
              <div
                key={product.id}
                className="flex flex-col items-center relative cursor-pointer"
                onClick={() => handleProductClick(product)}
              >
                <div className="absolute top-2 left-2 bg-[#27B1E2] text-white text-[10px] font-medium py-[2px] px-2 rounded-full z-10 shadow">
                  ₹{parseFloat(product.price || 0).toFixed(2)}
                </div>
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-[140px] h-[120px] object-cover mb-2 rounded-md"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/140x120?text=Product";
                  }}
                />
                <p className="text-center font-semibold text-[15px] leading-tight mt-0">
                  {product.name}
                </p>
                {product.tag_line && (
                  <p className="text-center text-[11px] text-gray-600 mt-1 px-1 line-clamp-2">
                    {product.tag_line}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        {/* Desktop: horizontal scroll with buttons */}
        <div className="hidden md:block relative mt-10">
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border shadow-lg p-3 rounded-full z-20 hover:scale-110 transition"
            aria-label="Scroll Left"
          >
            <IoChevronBack className="text-2xl" />
          </button>
          <div
            ref={scrollRef}
            className="flex gap-10 overflow-x-auto scroll-smooth px-14 no-scrollbar"
          >
            {products.map((product) => {
              const imageUrl = getProductImageUrl(product);
              return (
                <div
                  key={product.id}
                  className="flex flex-col items-center relative min-w-[200px] cursor-pointer"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="absolute top-2 left-2 bg-[#27B1E2] text-white text-[10px] font-medium py-[2px] px-2 rounded-full z-10 shadow">
                    ₹{parseFloat(product.price || 0).toFixed(2)}
                  </div>
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-[200px] h-[170px] object-cover mb-3 rounded-md"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/200x170?text=Product";
                    }}
                  />
                  <p className="text-center font-semibold text-[16px] leading-tight mt-0">
                    {product.name}
                  </p>
                  {product.tag_line && (
                    <p className="text-center text-xs text-gray-600 mt-2 px-2 line-clamp-2">
                      {product.tag_line}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border shadow-lg p-3 rounded-full z-20 hover:scale-110 transition"
            aria-label="Scroll Right"
          >
            <IoChevronForward className="text-2xl" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Newarrival;
