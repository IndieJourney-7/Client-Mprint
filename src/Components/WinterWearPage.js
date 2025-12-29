import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaRegHeart, FaHeart, FaStar } from "react-icons/fa";
import api from "../api/api";

const WinterWearPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const API_BASE_URL = "http://127.0.0.1:8000/api";

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
    const fetchFavorites = async () => {
      if (!user) {
        setFavorites([]);
        return;
      }
      try {
        const response = await api.get("/api/favorites");
        if (response.data?.success && response.data.data) {
          const favoriteIds = response.data.data.map(fav => fav.product?.id).filter(Boolean);
          setFavorites(favoriteIds);
        }
      } catch (err) {
        console.error("Failed to fetch favorites:", err);
        setFavorites([]);
      }
    };
    fetchFavorites();
  }, [user]);

  // ✅ Fetch winter wear products specifically from Laravel API
  useEffect(() => {
    const fetchWinterWear = async () => {
      setLoading(true);
      setError("");

      try {
        // Try category-specific endpoint first
        let response = await fetch(`${API_BASE_URL}/products/category/custom-winter-wear`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        // If category endpoint doesn't exist, filter all products
        if (!response.ok) {
          response = await fetch(`${API_BASE_URL}/products`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          });
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Winter Wear API Response:', data);

        if (data.success && data.data) {
          let productsData = [];

          // Handle different response structures
          if (data.data.data) {
            // Paginated response from /products
            productsData = data.data.data;
          } else if (Array.isArray(data.data)) {
            // Direct array response from /category endpoint
            productsData = data.data;
          } else {
            productsData = [data.data];
          }

          // Filter for winter wear category if we got all products
          const winterWearProducts = productsData.filter(product =>
            product.category &&
            (product.category.slug === 'custom-winter-wear' ||
             product.category.name.toLowerCase().includes('winter') ||
             product.category.name.toLowerCase().includes('hoodie') ||
             product.category.name.toLowerCase().includes('jacket') ||
             product.name.toLowerCase().includes('hoodie') ||
             product.name.toLowerCase().includes('jacket') ||
             product.name.toLowerCase().includes('winter'))
          );

          setProducts(winterWearProducts.length > 0 ? winterWearProducts : productsData);
        } else {
          setError("No winter wear products found.");
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError("Failed to load winter wear products from backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchWinterWear();
  }, []);

  // Helper function to get product image URL
  const getProductImageUrl = (product) => {
    // Try featured image from API
    if (product.featured_image) {
      return `${API_BASE_URL.replace('/api', '')}/storage/${product.featured_image}`;
    }

    // Try first gallery image
    if (product.images && product.images.length > 0) {
      return `${API_BASE_URL.replace('/api', '')}/storage/${product.images[0].image_path}`;
    }

    // Try legacy image_url field
    if (product.image_url) {
      return product.image_url;
    }

    // Fallback based on product type
    const productName = product.name?.toLowerCase() || "";
    if (productName.includes('hoodie')) {
      return "https://via.placeholder.com/400x500?text=Custom+Hoodie";
    } else if (productName.includes('jacket')) {
      return "https://via.placeholder.com/400x500?text=Custom+Jacket";
    }

    // Default winter wear placeholder
    return "https://via.placeholder.com/400x500?text=Winter+Wear";
  };

  // Toggle favorite
  const toggleFavorite = async (e, productId) => {
    e.preventDefault();

    if (!user) {
      navigate("/login", {
        state: {
          from: window.location.pathname,
          message: "Please login to add products to favorites"
        }
      });
      return;
    }

    try {
      const response = await api.post("/api/favorites/toggle", {
        product_id: productId
      });

      if (response.data?.success) {
        if (response.data.is_favorited) {
          setFavorites([...favorites, productId]);
        } else {
          setFavorites(favorites.filter(id => id !== productId));
        }
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  // Render star rating
  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(parseFloat(rating));

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400" size={14} />);
    }

    const emptyStars = 5 - fullStars;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaStar key={`empty-${i}`} className="text-gray-300" size={14} />);
    }

    return stars;
  };

  // Get size options from attributes
  const getSizes = (attributes) => {
    if (attributes && attributes.sizes) {
      return attributes.sizes;
    }
    return ['S', 'M', 'L', 'XL']; // Default sizes
  };

  // ✅ Handle loading & errors
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading winter wear collection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-red-500 text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Oops! Something went wrong</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ✅ UI Rendering
  return (
    <div className="px-6 md:px-10 py-10 bg-gradient-to-b from-blue-50 to-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            ❄️ Custom Winter Wear
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Stay warm in style with premium custom hoodies, jackets & winter apparel
          </p>
          <p className="text-sm text-blue-600">
            Custom designs • Premium materials • All sizes available • Corporate discounts
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-4xl mx-auto mb-10">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <h3 className="text-2xl font-bold text-blue-600">{products.length}+</h3>
              <p className="text-sm text-gray-600">Winter Styles</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-600">Premium</h3>
              <p className="text-sm text-gray-600">Quality Materials</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-purple-600">Custom</h3>
              <p className="text-sm text-gray-600">Design Options</p>
            </div>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="text-gray-400 text-6xl mb-6">🧥</div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">No Winter Wear Available</h3>
          <p className="text-gray-600 mb-6">We're working on adding amazing winter wear designs. Check back soon!</p>
          <Link
            to="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition inline-block"
          >
            Browse Other Categories
          </Link>
        </div>
      ) : (
        <>
          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {products.map((product) => {
              const isFavorite = favorites.includes(product.id);
              const imageSrc = getProductImageUrl(product);
              const sizes = getSizes(product.attributes);

              return (
                <div key={product.id} className="group">
                  <Link to={`/winter-wear/${product.slug}`}>
                    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                      {/* Favorite Button */}
                      <button
                        onClick={(e) => toggleFavorite(e, product.id)}
                        className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all"
                      >
                        {isFavorite ? (
                          <FaHeart className="text-red-500" size={16} />
                        ) : (
                          <FaRegHeart className="text-gray-600" size={16} />
                        )}
                      </button>

                      {/* Badges */}
                      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                        {product.is_featured && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold">
                            ⭐ Featured
                          </span>
                        )}
                        {product.sale_price && parseFloat(product.sale_price) < parseFloat(product.price) && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                            {Math.round(((parseFloat(product.price) - parseFloat(product.sale_price)) / parseFloat(product.price)) * 100)}% OFF
                          </span>
                        )}
                        {product.stock_quantity && parseInt(product.stock_quantity) < 20 && (
                          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-semibold">
                            Limited Stock
                          </span>
                        )}
                      </div>

                      {/* Product Image */}
                      <div className="aspect-[4/5] overflow-hidden">
                        <img
                          src={imageSrc}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/400x500?text=Winter+Wear";
                          }}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="p-5">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {product.name}
                        </h2>

                        {/* Short Description */}
                        {product.short_description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {product.short_description}
                          </p>
                        )}

                        {/* Available Sizes */}
                        {sizes && sizes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            <span className="text-xs text-gray-500">Sizes:</span>
                            {sizes.slice(0, 4).map((size, index) => (
                              <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {size}
                              </span>
                            ))}
                            {sizes.length > 4 && <span className="text-xs text-gray-500">+more</span>}
                          </div>
                        )}

                        {/* Material Info */}
                        {product.attributes && product.attributes.material && (
                          <div className="mb-3">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {product.attributes.material}
                            </span>
                          </div>
                        )}

                        {/* Rating */}
                        {product.rating > 0 && (
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-1">
                              {renderStarRating(product.rating)}
                            </div>
                            <span className="text-xs text-gray-600">
                              {parseFloat(product.rating).toFixed(1)} ({product.reviews_count || 0})
                            </span>
                          </div>
                        )}

                        {/* Pricing */}
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-xl font-bold text-blue-600">
                              ₹{parseFloat(product.price || 0).toFixed(2)}
                            </span>
                            {product.sale_price && parseFloat(product.sale_price) < parseFloat(product.price) && (
                              <span className="text-sm text-gray-500 line-through ml-2">
                                ₹{parseFloat(product.sale_price).toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* Stock Status */}
                          {product.stock_quantity !== undefined && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              parseInt(product.stock_quantity) > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {parseInt(product.stock_quantity) > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                          )}
                        </div>

                        {/* Quick Preview Button */}
                        <div className="mt-4">
                          <div className="bg-gray-50 text-gray-700 text-center py-2 rounded-lg text-sm font-medium group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                            View Details & Customize
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Call to Action */}
          <div className="max-w-4xl mx-auto mt-16 text-center bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-8">
            <div className="mb-4 text-4xl">👔</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Corporate Winter Wear Solutions
            </h2>
            <p className="text-gray-600 mb-6">
              Outfit your team with premium custom hoodies and jackets.
              Bulk discounts available for corporate orders!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                Get Bulk Quote
              </button>
              <button className="bg-white border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition">
                Size Guide
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 text-sm">
              <div className="text-gray-600">
                <strong className="text-gray-800">🎨</strong> Custom Designs
              </div>
              <div className="text-gray-600">
                <strong className="text-gray-800">📏</strong> All Sizes (XS-5XL)
              </div>
              <div className="text-gray-600">
                <strong className="text-gray-800">🚚</strong> Fast Delivery
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WinterWearPage;
