import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaRegHeart, FaHeart, FaStar, FaFilter } from "react-icons/fa";
import { IoHomeOutline, IoChevronForward } from "react-icons/io5";
import api from "../api/api";
import { useFavorites } from "../context/FavoritesContext";
import FilterSidebar from "./FilterSidebar";

const CategoryProductsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite: toggleFavoriteContext } = useFavorites();

  // Category state
  const [category, setCategory] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(true);

  // Products state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  // Filter & Sort states
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [selectedPriceRange, setSelectedPriceRange] = useState([0, 10000]);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

  // Check if filters are active
  const isFiltered =
    selectedPriceRange[0] !== priceRange.min ||
    selectedPriceRange[1] !== priceRange.max;

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check if user is logged in
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

  // Reset state when category changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedPriceRange([0, 10000]);
    setPriceRange({ min: 0, max: 10000 });
    setSortBy("created_at");
    setSortOrder("desc");
    setCategory(null);
    setProducts([]);
    fetchCategoryDetails();
  }, [slug]);

  // Fetch products when filters change
  useEffect(() => {
    if (slug) {
      fetchProducts();
    }
  }, [slug, selectedPriceRange, sortBy, sortOrder, currentPage]);

  // Fetch category details
  const fetchCategoryDetails = async () => {
    setCategoryLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${slug}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setCategory(data.data);
        }
      }
    } catch (err) {
      console.error("Error fetching category:", err);
    } finally {
      setCategoryLoading(false);
    }
  };

  // Fetch products for the category
  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        sort_by: sortBy,
        sort_order: sortOrder,
        page: currentPage,
        per_page: 12,
      });

      // Only add price filters if they're different from the default range
      if (selectedPriceRange[0] !== priceRange.min) {
        params.append("min_price", selectedPriceRange[0]);
      }
      if (selectedPriceRange[1] !== priceRange.max) {
        params.append("max_price", selectedPriceRange[1]);
      }

      const response = await fetch(
        `${API_BASE_URL}/products/category/${slug}?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      let productsData = [];
      if (response.ok) {
        const data = await response.json();

        // Set price range from backend
        if (data.price_range) {
          const newRange = {
            min: Math.floor(data.price_range.min),
            max: Math.ceil(data.price_range.max),
          };
          setPriceRange(newRange);
          // Only set selected range on first load
          if (
            selectedPriceRange[0] === 0 &&
            selectedPriceRange[1] === 10000 &&
            currentPage === 1
          ) {
            setSelectedPriceRange([newRange.min, newRange.max]);
          }
        }

        // Handle pagination info
        if (data.data?.last_page) {
          setTotalPages(data.data.last_page);
          setTotalProducts(data.data.total || 0);
        }

        if (data.data?.data) {
          productsData = data.data.data;
        } else if (Array.isArray(data.data)) {
          productsData = data.data;
        } else {
          productsData = [];
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setProducts(productsData);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (newRange) => {
    setSelectedPriceRange(newRange);
    setCurrentPage(1);
  };

  const handleSortChange = (newSortBy, newSortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedPriceRange([priceRange.min, priceRange.max]);
    setSortBy("created_at");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const getProductImageUrl = (product) => {
    if (product.featured_image) {
      return `${API_BASE_URL.replace("/api", "")}/storage/${product.featured_image}`;
    }
    if (product.images && product.images.length > 0) {
      return `${API_BASE_URL.replace("/api", "")}/storage/${product.images[0].image_path}`;
    }
    if (product.image_url) {
      return product.image_url;
    }
    return `https://via.placeholder.com/400x300?text=${encodeURIComponent(category?.name || "Product")}`;
  };

  const getCategoryBannerUrl = () => {
    // First check for banner_image_url (the new dedicated banner field)
    if (category?.banner_image_url) {
      return category.banner_image_url;
    }
    // Fallback to category image if no banner is set
    if (category?.image_url) {
      return category.image_url;
    }
    // Legacy support for raw image path
    if (category?.image) {
      return `${API_BASE_URL.replace("/api", "")}/storage/${category.image}`;
    }
    return null;
  };

  const toggleFavorite = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/login", {
        state: {
          from: window.location.pathname,
          message: "Please login to add products to favorites",
        },
      });
      return;
    }

    await toggleFavoriteContext(productId);
  };

  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(parseFloat(rating));
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400" size={14} />);
    }
    for (let i = fullStars; i < 5; i++) {
      stars.push(
        <FaStar key={`empty-${i}`} className="text-gray-300" size={14} />
      );
    }
    return stars;
  };

  const handleProductClick = (productSlug) => {
    navigate(`/category/${slug}/${productSlug}`);
  };

  // Get display name for category
  const getCategoryDisplayName = () => {
    if (category?.name) return category.name;
    // Fallback: convert slug to title case
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (categoryLoading && loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {getCategoryDisplayName()}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-red-500 text-6xl mb-6">!</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Oops! Something went wrong
          </h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const bannerUrl = getCategoryBannerUrl();
  // Check if a dedicated banner image is uploaded (not just fallback category image)
  const hasDedicatedBanner = category?.banner_image_url ? true : false;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Category Banner */}
      {bannerUrl && (
        <div className="relative h-48 md:h-64 lg:h-80 overflow-hidden">
          <img
            src={bannerUrl}
            alt={category?.name || "Category"}
            className="w-full h-full object-cover"
          />
          {/* Show text overlay ONLY if no dedicated banner image is uploaded */}
          {!hasDedicatedBanner && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                <div className="max-w-7xl mx-auto">
                  <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
                    {getCategoryDisplayName()}
                  </h1>
                  {category?.description && (
                    <p className="text-white/80 text-sm md:text-base max-w-2xl">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="px-4 md:px-10 py-8 md:py-10">
        {/* Breadcrumb */}
        <nav className="max-w-7xl mx-auto mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link
              to="/"
              className="flex items-center gap-1 hover:text-amber-600 transition"
            >
              <IoHomeOutline />
              Home
            </Link>
            <IoChevronForward className="text-xs" />
            <span className="text-gray-800 font-medium">
              {getCategoryDisplayName()}
            </span>
          </div>
        </nav>

        {/* Header (shown when no banner) */}
        {!bannerUrl && (
          <div className="mb-8 md:mb-10">
            <div className="max-w-7xl mx-auto text-center">
              <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4">
                {getCategoryDisplayName()}
              </h1>
              {category?.description && (
                <p className="text-lg text-gray-600 mb-2 max-w-2xl mx-auto">
                  {category.description}
                </p>
              )}
              <p className="text-sm text-amber-600">
                Same day delivery available | Premium quality printing | Custom
                designs
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-amber-600">
                  {totalProducts || products.length}+
                </h3>
                <p className="text-xs md:text-sm text-gray-600">Designs</p>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-green-600">
                  24hr
                </h3>
                <p className="text-xs md:text-sm text-gray-600">Fast Delivery</p>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-purple-600">
                  4.7
                </h3>
                <p className="text-xs md:text-sm text-gray-600">Customer Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filter Button */}
        {isMobile && (
          <div className="max-w-7xl mx-auto mb-6">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="relative w-full group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 rounded-xl"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
              <div className="relative flex items-center justify-center gap-3 px-6 py-4 text-white">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <FaFilter size={16} />
                </div>
                <span className="font-bold text-lg">Filters & Sort</span>
                {isFiltered && (
                  <span className="ml-auto bg-white/30 text-white text-xs px-3 py-1 rounded-full font-medium backdrop-blur-sm">
                    Active
                  </span>
                )}
              </div>
            </button>
          </div>
        )}

        {/* Main Content with Sidebar */}
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            {!isMobile && (
              <div className="w-80 flex-shrink-0">
                <FilterSidebar
                  priceRange={priceRange}
                  selectedPriceRange={selectedPriceRange}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onPriceChange={handlePriceChange}
                  onSortChange={handleSortChange}
                  onClearFilters={handleClearFilters}
                  totalProducts={totalProducts || products.length}
                  isMobile={false}
                />
              </div>
            )}

            {/* Mobile Drawer */}
            {isMobile && (
              <FilterSidebar
                priceRange={priceRange}
                selectedPriceRange={selectedPriceRange}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onPriceChange={handlePriceChange}
                onSortChange={handleSortChange}
                onClearFilters={handleClearFilters}
                totalProducts={totalProducts || products.length}
                isMobile={true}
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
              />
            )}

            {/* Products Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                  <div className="text-gray-400 text-6xl mb-6">📦</div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                    No Products Found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your filters or check back soon!
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition inline-block"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {products.map((product) => {
                      const isProductFavorite = isFavorite(product.id);
                      const imageSrc = getProductImageUrl(product);

                      return (
                        <div key={product.id} className="group">
                          <div
                            onClick={() => handleProductClick(product.slug)}
                            className="cursor-pointer"
                          >
                            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden h-full flex flex-col">
                              <button
                                onClick={(e) => toggleFavorite(e, product.id)}
                                className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all"
                              >
                                {isProductFavorite ? (
                                  <FaHeart className="text-red-500" size={14} />
                                ) : (
                                  <FaRegHeart
                                    className="text-gray-600"
                                    size={14}
                                  />
                                )}
                              </button>
                              <div className="aspect-[4/3] overflow-hidden">
                                <img
                                  src={imageSrc}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    e.target.src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(getCategoryDisplayName())}`;
                                  }}
                                />
                              </div>
                              <div className="p-3 md:p-5 flex-1 flex flex-col">
                                <h2 className="text-sm md:text-lg font-semibold text-gray-800 mb-1 md:mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                                  {product.name}
                                </h2>
                                {(product.tag_line || product.short_description) && (
                                  <p className="hidden md:block text-sm text-gray-600 mb-3 line-clamp-2 flex-1">
                                    {product.tag_line || product.short_description}
                                  </p>
                                )}
                                {parseFloat(product.rating) > 0 && (
                                  <div className="hidden md:flex items-center gap-2 mb-3">
                                    <div className="flex items-center gap-1">
                                      {renderStarRating(product.rating)}
                                    </div>
                                    <span className="text-xs text-gray-600">
                                      {parseFloat(product.rating).toFixed(1)} (
                                      {product.reviews_count || 0})
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between mt-auto">
                                  <div>
                                    <span className="text-base md:text-xl font-bold text-amber-600">
                                      ₹{parseFloat(product.price || 0).toFixed(0)}
                                    </span>
                                    {product.sale_price &&
                                      parseFloat(product.sale_price) <
                                        parseFloat(product.price) && (
                                        <span className="text-xs md:text-sm text-gray-500 line-through ml-1 md:ml-2">
                                          ₹{parseFloat(product.sale_price).toFixed(0)}
                                        </span>
                                      )}
                                  </div>
                                  <span
                                    className={`hidden md:inline text-xs px-2 py-1 rounded-full ${
                                      parseInt(product.stock_quantity) > 0
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {parseInt(product.stock_quantity) > 0
                                      ? "In Stock"
                                      : "Out of Stock"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex justify-center items-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          currentPage === 1
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-amber-500 text-white hover:bg-amber-600"
                        }`}
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          currentPage === totalPages
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-amber-500 text-white hover:bg-amber-600"
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryProductsPage;
