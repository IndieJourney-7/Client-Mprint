import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaRegHeart, FaHeart, FaStar, FaTshirt } from "react-icons/fa";
import api from "../api/api";

const PoloTshirtsPage = () => {
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

  // ✅ Fetch polo t-shirts specifically from Laravel API
  useEffect(() => {
    const fetchPoloTshirts = async () => {
      setLoading(true);
      setError("");

      try {
        // Try category-specific endpoint first
        let response = await fetch(`${API_BASE_URL}/products/category/custom-polo-t-shirts`, {
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
        console.log('Polo T-shirts API Response:', data);

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

          // Filter for polo t-shirts category if we got all products
          const poloProducts = productsData.filter(product =>
            product.category &&
            (product.category.slug === 'custom-polo-t-shirts' ||
             product.category.name.toLowerCase().includes('polo') ||
             product.name.toLowerCase().includes('polo') ||
             product.description?.toLowerCase().includes('polo') ||
             product.name.toLowerCase().includes('collar'))
          );

          setProducts(poloProducts.length > 0 ? poloProducts : productsData);
        } else {
          setError("No polo t-shirts found.");
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError("Failed to load polo t-shirts from backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchPoloTshirts();
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

    // Default polo t-shirt placeholder
    return "https://via.placeholder.com/400x500?text=Custom+Polo+T-Shirt";
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
    const hasHalfStar = (parseFloat(rating) % 1) >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400" size={14} />);
    }

    if (hasHalfStar) {
      stars.push(<FaStar key="half" className="text-yellow-400" size={14} />);
    }

    const emptyStars = 5 - Math.ceil(parseFloat(rating));
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
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL']; // Default sizes
  };

  // Get available colors from attributes
  const getColors = (attributes) => {
    if (attributes && attributes.colors) {
      return attributes.colors;
    }
    if (attributes && attributes.color) {
      return [attributes.color];
    }
    return ['Multiple Colors'];
  };

  // Handle loading & errors
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading custom polo t-shirts...</p>
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
            className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // UI Rendering
  return (
    <div className="px-6 md:px-10 py-10 bg-gradient-to-b from-teal-50 to-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            👔 Premium Custom Polo T-Shirts
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Professional polo shirts with custom embroidery and printing for corporate and casual wear
          </p>
          <p className="text-sm text-teal-600">
            Premium cotton blend • Custom embroidery • Corporate uniforms • Team wear
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-4xl mx-auto mb-10">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <h3 className="text-2xl font-bold text-teal-600">Premium</h3>
              <p className="text-sm text-gray-600">Cotton Blend</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-blue-600">Custom</h3>
              <p className="text-sm text-gray-600">Embroidery</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-purple-600">All Sizes</h3>
              <p className="text-sm text-gray-600">XS to 5XL</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Features */}
      <div className="max-w-6xl mx-auto mb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'Premium Fabric', description: '100% Cotton Pique', icon: '🏆' },
            { title: 'Custom Embroidery', description: 'Logo & Text Options', icon: '🎨' },
            { title: 'Professional Look', description: 'Corporate Ready', icon: '👔' },
            { title: 'Bulk Discounts', description: 'Team & Corporate Orders', icon: '📦' }
          ].map((feature, index) => (
            <div key={index} className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition border border-teal-100">
              <div className="text-2xl mb-2">{feature.icon}</div>
              <h3 className="font-medium text-gray-800 mb-1">{feature.title}</h3>
              <p className="text-xs text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="text-gray-400 text-6xl mb-6">
            <FaTshirt />
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">No Polo T-Shirts Available</h3>
          <p className="text-gray-600 mb-6">We're working on adding premium polo t-shirt options. Check back soon!</p>
          <Link
            to="/"
            className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition inline-block"
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
              const colors = getColors(product.attributes);

              return (
                <div key={product.id} className="group">
                  <Link to={`/polo-tshirts/${product.slug}`}>
                    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden border border-teal-100">
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
                        <span className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full font-semibold">
                          Premium
                        </span>
                      </div>

                      {/* Product Image */}
                      <div className="aspect-[4/5] overflow-hidden">
                        <img
                          src={imageSrc}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/400x500?text=Custom+Polo+T-Shirt";
                          }}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="p-5">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-teal-600 transition-colors">
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
                          <div className="flex flex-wrap gap-1 mb-2">
                            <span className="text-xs text-gray-500">Sizes:</span>
                            {sizes.slice(0, 4).map((size, index) => (
                              <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {size}
                              </span>
                            ))}
                            {sizes.length > 4 && <span className="text-xs text-gray-500">+more</span>}
                          </div>
                        )}

                        {/* Available Colors */}
                        {colors && colors.length > 0 && colors[0] !== 'Multiple Colors' && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            <span className="text-xs text-gray-500">Colors:</span>
                            {colors.slice(0, 3).map((color, index) => (
                              <span key={index} className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded">
                                {color}
                              </span>
                            ))}
                            {colors.length > 3 && <span className="text-xs text-gray-500">+more</span>}
                          </div>
                        )}

                        {/* Material Info */}
                        {product.attributes && product.attributes.material && (
                          <div className="mb-3">
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
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
                            <span className="text-sm text-gray-600">
                              {parseFloat(product.rating).toFixed(1)} ({product.reviews_count || 0})
                            </span>
                          </div>
                        )}

                        {/* Pricing */}
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-xl font-bold text-teal-600">
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

                        {/* Features */}
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                            <span>Custom embroidery available</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span>Professional corporate look</span>
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
          <div className="max-w-4xl mx-auto mt-16 text-center bg-gradient-to-r from-teal-100 to-cyan-100 rounded-2xl p-8">
            <div className="mb-4 text-4xl">🏢</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Corporate Polo Shirt Solutions
            </h2>
            <p className="text-gray-600 mb-6">
              Elevate your company's professional image with premium custom polo shirts.
              Perfect for uniforms, events, and team building activities!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition">
                Get Corporate Quote
              </button>
              <button className="bg-white border border-teal-600 text-teal-600 px-6 py-3 rounded-lg hover:bg-teal-50 transition">
                View Color Options
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 text-sm">
              <div className="text-gray-600">
                <strong className="text-gray-800">🏆</strong> Premium Quality
              </div>
              <div className="text-gray-600">
                <strong className="text-gray-800">🎨</strong> Custom Embroidery
              </div>
              <div className="text-gray-600">
                <strong className="text-gray-800">👔</strong> Professional Look
              </div>
              <div className="text-gray-600">
                <strong className="text-gray-800">📦</strong> Bulk Discounts
              </div>
            </div>
          </div>

          {/* Size & Care Guide */}
          <div className="max-w-6xl mx-auto mt-12 bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Size & Care Guide</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-3">📏</div>
                <h4 className="font-semibold mb-2">Size Chart</h4>
                <p className="text-sm text-gray-600">Available in XS to 5XL sizes. Check our detailed size guide for perfect fit</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🧺</div>
                <h4 className="font-semibold mb-2">Care Instructions</h4>
                <p className="text-sm text-gray-600">Machine wash cold, tumble dry low. Do not iron directly on embroidery</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🎯</div>
                <h4 className="font-semibold mb-2">Customization</h4>
                <p className="text-sm text-gray-600">Logo embroidery, text printing, and custom color combinations available</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PoloTshirtsPage;
