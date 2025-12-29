import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { FaSearch, FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import api from "../api/api";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    if (query.trim()) {
      searchProducts(query);
    }
  }, [query]);

  const searchProducts = async (searchQuery) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/products", {
        params: {
          search: searchQuery,
          per_page: 50,
        },
      });

      if (response.data?.success) {
        const productsData = response.data.data?.data || response.data.data || [];
        setProducts(productsData);
        setTotalResults(response.data.data?.total || productsData.length);
      } else {
        setProducts([]);
        setTotalResults(0);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search products. Please try again.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-gray-300" />);
    }

    return stars;
  };

  const handleProductClick = (product) => {
    const categoryPath = product.category?.path || `/products`;
    navigate(`${categoryPath}/${product.slug}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <FaSearch className="text-gray-400" size={24} />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Search Results
            </h1>
          </div>
          {query && (
            <p className="text-gray-600">
              Showing results for{" "}
              <span className="font-semibold text-gray-900">"{query}"</span>
              {totalResults > 0 && (
                <span className="ml-2">({totalResults} products found)</span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Searching products...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && products.length === 0 && query && (
          <div className="text-center py-20">
            <FaSearch className="mx-auto text-gray-300 mb-4" size={64} />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              No products found
            </h2>
            <p className="text-gray-600 mb-6">
              We couldn't find any products matching "{query}"
            </p>
            <div className="space-y-3">
              <p className="text-gray-600 font-medium">Try:</p>
              <ul className="text-gray-600 space-y-1">
                <li>Checking your spelling</li>
                <li>Using more general keywords</li>
                <li>Searching for product categories like "cards", "posters", etc.</li>
              </ul>
            </div>
            <Link
              to="/"
              className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Browse All Products
            </Link>
          </div>
        )}

        {/* No Query */}
        {!loading && !query && (
          <div className="text-center py-20">
            <FaSearch className="mx-auto text-gray-300 mb-4" size={64} />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Start searching
            </h2>
            <p className="text-gray-600">
              Enter a search term to find products
            </p>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 group"
              >
                {/* Product Image */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={
                      product.featured_image_url ||
                      `https://via.placeholder.com/400x400/f3f4f6/9ca3af?text=${encodeURIComponent(
                        product.name
                      )}`
                    }
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/400x400/f3f4f6/9ca3af?text=${encodeURIComponent(
                        product.name
                      )}`;
                    }}
                  />
                  {product.is_featured && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      ⭐ Featured
                    </div>
                  )}
                  {product.sale_price && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Sale
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[3rem]">
                    {product.name}
                  </h3>

                  {/* Category */}
                  {product.category && (
                    <p className="text-xs text-gray-500 mb-2">
                      {product.category.name}
                    </p>
                  )}

                  {/* Rating */}
                  {product.rating > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <div className="flex items-center">
                        {renderStarRating(parseFloat(product.rating))}
                      </div>
                      <span className="text-xs text-gray-600 ml-1">
                        ({product.reviews_count || 0})
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-2">
                    {product.sale_price ? (
                      <>
                        <span className="text-lg font-bold text-gray-900">
                          ₹{parseFloat(product.sale_price).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          ₹{parseFloat(product.price).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">
                        ₹{parseFloat(product.price).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Stock Status */}
                  {product.stock_quantity > 0 ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      In Stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
