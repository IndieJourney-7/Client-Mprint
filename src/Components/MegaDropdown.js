import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaChevronDown, FaChevronRight, FaArrowRight } from "react-icons/fa";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";

const MegaDropdown = ({
  label,
  categorySlug,
  icon: Icon,
  highlight = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dropdownTop, setDropdownTop] = useState(0);
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);
  const location = useLocation();

  // Close dropdown when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close dropdown function
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Calculate dropdown position
  const calculatePosition = useCallback(() => {
    if (triggerRef.current) {
      const parentRow = triggerRef.current.closest('.border-t');
      if (parentRow) {
        const parentRect = parentRow.getBoundingClientRect();
        setDropdownTop(parentRect.bottom);
      } else {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownTop(rect.bottom + 8);
      }
    }
  }, []);

  // Fetch menu data when hovering
  const fetchMenuData = async () => {
    if (menuData) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mega-menu/${categorySlug}?refresh=1`);
      const data = await response.json();

      if (data.success) {
        setMenuData(data.data);
      } else {
        setError(data.message || "Category not found");
      }
    } catch (err) {
      console.error("Error fetching mega menu:", err);
      setError("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  // Handle mouse enter
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    calculatePosition();
    fetchMenuData();
    setIsOpen(true);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Recalculate position on scroll/resize
  useEffect(() => {
    if (isOpen) {
      const handleUpdate = () => calculatePosition();
      window.addEventListener('scroll', handleUpdate);
      window.addEventListener('resize', handleUpdate);
      return () => {
        window.removeEventListener('scroll', handleUpdate);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [isOpen, calculatePosition]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Link component that closes dropdown on click
  const DropdownLink = ({ to, children, className, ...props }) => (
    <Link
      to={to}
      className={className}
      onClick={closeDropdown}
      {...props}
    >
      {children}
    </Link>
  );

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button */}
      <Link
        to={`/${categorySlug}`}
        onClick={closeDropdown}
        className={`flex items-center gap-1 px-2 py-1 rounded transition ${
          highlight
            ? "text-orange-600 font-bold bg-orange-50 hover:bg-orange-100"
            : "hover:text-red-600 hover:bg-gray-50"
        }`}
      >
        {Icon && <Icon className={highlight ? "text-orange-500" : ""} size={14} />}
        <span>{label}</span>
        <FaChevronDown
          className={`text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </Link>

      {/* Full Width Dropdown Panel - Using Portal-like fixed positioning with highest z-index */}
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-[1px]"
            style={{ zIndex: 9998, top: `${dropdownTop}px` }}
            onClick={closeDropdown}
            aria-hidden="true"
          />

          {/* Main Dropdown */}
          <div
            id={`mega-dropdown-${categorySlug}`}
            className="fixed left-0 right-0 bg-white shadow-2xl border-t-2 border-amber-500 overflow-y-auto"
            style={{
              zIndex: 9999,
              top: `${dropdownTop}px`,
              maxHeight: `calc(100vh - ${dropdownTop}px - 20px)`
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="max-w-[1600px] mx-auto">
              {/* Loading State */}
              {loading && (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading products...</p>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="p-12 text-center">
                  <div className="text-5xl mb-4">📦</div>
                  <p className="text-gray-700 font-medium mb-2">"{label}" category coming soon!</p>
                  <p className="text-gray-500 text-sm mb-4">We're adding products to this category.</p>
                  <DropdownLink
                    to={`/${categorySlug}`}
                    className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
                  >
                    Browse All Products
                    <FaArrowRight size={12} />
                  </DropdownLink>
                </div>
              )}

              {/* Menu Content */}
              {menuData && !loading && !error && (
                <div className="p-8">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">{menuData.name}</h3>
                      {menuData.description && (
                        <p className="text-sm text-gray-500 mt-1">{menuData.description}</p>
                      )}
                    </div>
                    <DropdownLink
                      to={menuData.see_all_link || `/${categorySlug}`}
                      className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
                    >
                      View All {menuData.name}
                      <FaArrowRight size={12} />
                    </DropdownLink>
                  </div>

                  {/* Columns Grid */}
                  {menuData.columns && menuData.columns.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                      {menuData.columns.map((column, colIndex) => (
                        <div key={column.id || colIndex} className="min-w-0">
                          {/* Column Header */}
                          <h4 className="font-bold text-gray-800 text-base mb-4 pb-2 border-b-2 border-amber-500">
                            {column.name}
                          </h4>

                          {/* Products List */}
                          <ul className="space-y-3">
                            {column.products && column.products.map((product) => (
                              <li key={product.id}>
                                <DropdownLink
                                  to={product.link}
                                  className="group flex items-center gap-2 text-gray-600 hover:text-amber-600 transition"
                                >
                                  <FaChevronRight
                                    className="text-gray-300 group-hover:text-amber-500 transition flex-shrink-0"
                                    size={10}
                                  />
                                  <span className="truncate text-sm">{product.name}</span>
                                  {product.is_new && (
                                    <span className="flex-shrink-0 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                                      New
                                    </span>
                                  )}
                                  {product.is_featured && !product.is_new && (
                                    <span className="flex-shrink-0 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                                      Popular
                                    </span>
                                  )}
                                </DropdownLink>
                              </li>
                            ))}
                          </ul>

                          {/* See All Link */}
                          {column.has_more && (
                            <DropdownLink
                              to={column.see_all_link}
                              className="inline-flex items-center gap-1 mt-4 text-amber-600 hover:text-amber-700 text-sm font-medium transition"
                            >
                              See all {column.total_count} products
                              <FaArrowRight size={10} />
                            </DropdownLink>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-5xl mb-4">🛍️</div>
                      <p className="text-gray-700 font-medium mb-2">Products coming soon!</p>
                      <p className="text-gray-500 text-sm mb-4">We're adding products to this category.</p>
                      <DropdownLink
                        to={`/${categorySlug}`}
                        className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium transition"
                      >
                        Browse Category
                        <FaArrowRight size={12} />
                      </DropdownLink>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-2xl p-6">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">💡</span>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-gray-800">
                              Need help choosing the right product?
                            </p>
                            <p className="text-sm text-gray-600">
                              Call us at <span className="font-medium">02522-669393</span> for expert advice
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <DropdownLink
                            to="/contact"
                            className="px-5 py-2.5 border-2 border-amber-600 text-amber-600 rounded-lg font-medium hover:bg-amber-50 transition"
                          >
                            Contact Us
                          </DropdownLink>
                          <DropdownLink
                            to={`/${categorySlug}`}
                            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                          >
                            Shop All
                            <FaArrowRight size={12} />
                          </DropdownLink>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MegaDropdown;
