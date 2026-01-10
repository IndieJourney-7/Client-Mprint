import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaRegHeart, FaHeart, FaStar, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import api from "../api/api";
import { useFavorites } from "../context/FavoritesContext";

const CrossProducts = ({
  currentProductId,
  currentCategorySlug,
  limit = 8,
  title = "Explore Other Products",
  subtitle = "Discover more from our collection"
}) => {
  const navigate = useNavigate();
  const { isFavorite: isFavoritedGlobal, toggleFavorite: toggleFavoriteGlobal } = useFavorites();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const API_BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userRes = await api.get("/api/user");
        setUser(userRes.data?.user ?? userRes.data?.data ?? null);
      } catch {
        setUser(null);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    const fetchCrossProducts = async () => {
      setLoading(true);
      setError("");

      try {
        // Fetch more products to ensure we have enough after filtering
        const response = await api.get(`/api/products?per_page=50`);

        console.log('CrossProducts API Response:', response.data);

        // Handle paginated response - data could be in response.data.data.data (paginated)
        // or response.data.data (array)
        let allProducts = [];
        
        if (response.data?.success) {
          // Check if it's paginated (has nested data array)
          if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
            allProducts = response.data.data.data;
          } else if (Array.isArray(response.data?.data)) {
            allProducts = response.data.data;
          }
        }

        console.log('Cross Products - Total fetched:', allProducts.length);
        console.log('Current Product ID:', currentProductId);

        if (allProducts.length > 0) {
          // Filter out ONLY the current product (show all other products including same category)
          const filteredProducts = allProducts.filter(product => {
            const isSameProduct = currentProductId ? product.id === currentProductId : false;
            return !isSameProduct;
          });

          console.log('Cross Products - After filtering:', filteredProducts.length);

          // Shuffle and limit the products
          const shuffled = filteredProducts.sort(() => 0.5 - Math.random());
          const selectedProducts = shuffled.slice(0, limit);

          console.log('Cross Products - Final selection:', selectedProducts.length);
          setProducts(selectedProducts);
        } else {
          console.log('Cross Products - No products returned from API');
          setProducts([]);
        }
      } catch (err) {
        console.error("Failed to fetch cross products:", err);
        setError("Failed to load products");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCrossProducts();
  }, [currentProductId, currentCategorySlug, limit]);

  const getProductImageUrl = (product) => {
    if (product.featured_image_url) {
      return product.featured_image_url;
    }
    if (product.featured_image) {
      return `${API_BASE_URL}/storage/${product.featured_image}`;
    }
    if (product.images && product.images.length > 0) {
      return product.images[0].image_url || `${API_BASE_URL}/storage/${product.images[0].image_path}`;
    }
    return "https://via.placeholder.com/400x300?text=Product";
  };

  const handleToggleFavorite = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/login", {
        state: {
          from: window.location.pathname,
          message: "Please login to add products to favorites"
        }
      });
      return;
    }

    await toggleFavoriteGlobal(productId);
  };

  const handleProductClick = (product) => {
    const categorySlug = product.category?.slug || "";
    const productSlug = product.slug;
    
    if (categorySlug) {
      navigate(`/category/${categorySlug}/${productSlug}`);
    } else {
      navigate(`/products/${productSlug}`);
    }
    
    // Scroll to top when navigating to new product
    window.scrollTo(0, 0);
  };

  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(parseFloat(rating || 0));
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400" size={12} />);
    }
    for (let i = fullStars; i < 5; i++) {
      stars.push(<FaStar key={`empty-${i}`} className="text-gray-300" size={12} />);
    }
    return stars;
  };

  const scrollContainer = (direction) => {
    const container = document.getElementById('cross-products-scroll');
    if (!container) return;

    const scrollAmount = 320;
    const newPosition = direction === 'left'
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({ left: newPosition, behavior: 'smooth' });
  };

  const handleScroll = (e) => {
    const container = e.target;
    setScrollPosition(container.scrollLeft);
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
  };

  if (loading) {
    return (
      <div className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded w-64 mt-2 animate-pulse"></div>
            </div>
          </div>
          <div className="flex gap-6 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[280px] bg-white rounded-xl shadow-sm overflow-hidden animate-pulse border border-gray-100">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('CrossProducts Error:', error);
    return null;
  }

  if (products.length === 0) {
    console.log('CrossProducts: No products to display');
    return null;
  }

  return (
    <div className="py-12 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
            <p className="text-gray-600 mt-1">{subtitle}</p>
          </div>
          <Link
            to="/"
            className="hidden md:flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            View All
            <FaChevronRight size={14} />
          </Link>
        </div>

        <div className="relative group">
          {canScrollLeft && (
            <button
              onClick={() => scrollContainer('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-lg rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white -translate-x-1/2"
              aria-label="Scroll left"
            >
              <FaChevronLeft className="text-gray-700" size={16} />
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={() => scrollContainer('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-lg rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white translate-x-1/2"
              aria-label="Scroll right"
            >
              <FaChevronRight className="text-gray-700" size={16} />
            </button>
          )}

          <div
            id="cross-products-scroll"
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
            onScroll={handleScroll}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product) => {
              const isFavorite = isFavoritedGlobal(product.id);
              const imageSrc = getProductImageUrl(product);
              const productCategory = product.category?.slug || "";

              return (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-[280px] group/card cursor-pointer"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                      <img
                        src={imageSrc}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/400x400?text=Product";
                        }}
                      />

                      <button
                        onClick={(e) => handleToggleFavorite(e, product.id)}
                        className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all hover:scale-110"
                        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        {isFavorite ? (
                          <FaHeart className="text-red-500" size={16} />
                        ) : (
                          <FaRegHeart className="text-gray-600" size={16} />
                        )}
                      </button>

                      {product.is_featured && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm">
                          Featured
                        </div>
                      )}

                      {product.category && (
                        <div className="absolute bottom-3 left-3 bg-blue-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                          {product.category.name}
                        </div>
                      )}

                      {product.sale_price && parseFloat(product.sale_price) < parseFloat(product.price) && (
                        <div className="absolute bottom-3 right-3 bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                          {Math.round(((product.price - product.sale_price) / product.price) * 100)}% OFF
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-1.5 line-clamp-2 group-hover/card:text-blue-600 transition-colors">
                        {product.name}
                      </h3>

                      {product.tag_line && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {product.tag_line}
                        </p>
                      )}

                      {parseFloat(product.rating) > 0 && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="flex items-center gap-0.5">
                            {renderStarRating(product.rating)}
                          </div>
                          <span className="text-xs text-gray-500">
                            ({product.reviews_count || 0})
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-blue-600">
                            ₹{parseFloat(product.sale_price || product.price || 0).toFixed(0)}
                          </span>
                          {product.sale_price && parseFloat(product.sale_price) < parseFloat(product.price) && (
                            <span className="text-sm text-gray-400 line-through">
                              ₹{parseFloat(product.price).toFixed(0)}
                            </span>
                          )}
                        </div>

                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            parseInt(product.stock_quantity) > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {parseInt(product.stock_quantity) > 0 ? "In Stock" : "Out"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 text-center md:hidden">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Browse All Products
            <FaChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CrossProducts;
