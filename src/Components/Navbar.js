import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaShoppingBag,
  FaSearch,
  FaBars,
  FaTimes,
  FaHeart,
  FaQuestionCircle,
  FaFolderOpen,
  FaBox,
  FaBoxes,
  FaIdCard,
  FaEnvelope,
} from "react-icons/fa";
import vista from "../Assets/vista.png";
import api from "../api/api";
import { useFavorites } from "../context/FavoritesContext";
import { useCart } from "../context/CartContext";
import MegaDropdown from "./MegaDropdown";

const Navbar = () => {
  const navigate = useNavigate();
  const { favoritesCount } = useFavorites();
  const { cartCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/categories?is_active=true`, {
          headers: { Accept: "application/json" },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Sort by sort_order and map to menu format
            const sortedCategories = (Array.isArray(data.data) ? data.data : [])
              .filter(cat => cat.is_active)
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            setCategories(sortedCategories);
          }
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        await api.get("/sanctum/csrf-cookie");
        try {
          const userRes = await api.get("/api/user");
          const userData = userRes.data?.user ?? userRes.data?.data ?? null;
          setUser(userData);
        } catch {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await api.get("/sanctum/csrf-cookie");
      await api.post("/api/logout");
      localStorage.removeItem("auth_token");
      setUser(null);
      window.location.href = "/login";
    } catch {
      alert("Logout failed. Try again.");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  return (
    <div className="w-full bg-white border-b shadow-sm relative z-50">
      {/* ===== TOP NAVBAR ===== */}
      <div className="flex items-center justify-between px-4 lg:px-12 py-4 flex-wrap gap-4 relative z-20">

        {/* Logo */}
        <Link to="/">
          <img
            src={vista}
            alt="logo"
            className="h-16 md:h-20 lg:h-24 object-contain"
          />
        </Link>

        {/* Search Bar */}
        <div className="flex items-center border rounded-full px-4 py-2 w-full md:w-[45%] max-w-xl">
          <input
            type="text"
            placeholder="Search for products (cards, certificates, posters...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full outline-none text-sm text-gray-700 placeholder-gray-400"
          />
          <button
            onClick={handleSearch}
            className="text-gray-500 hover:text-gray-700 transition"
            aria-label="Search"
          >
            <FaSearch className="ml-2" />
          </button>
        </div>

        {/* Right Icons */}
        <div className="hidden md:flex items-center gap-8 text-gray-800 text-sm">
          <a
            href={`tel:${(process.env.REACT_APP_PHONE_NUMBER || "02522-669393").replace(/-/g, '')}`}
            className="flex items-center gap-2 hover:text-blue-700"
          >
            <FaQuestionCircle className="text-lg" />
            <div className="flex flex-col leading-tight">
              <span className="font-medium">Help is here</span>
              <span className="text-xs text-gray-500">{process.env.REACT_APP_PHONE_NUMBER || "02522-669393"}</span>
            </div>
          </a>

          <Link
            to="/projects"
            className="flex items-center gap-2 hover:text-blue-700"
          >
            <FaFolderOpen className="text-lg" />
            <span className="font-medium">My Account</span>
          </Link>

          <Link
            to="/favorites"
            className="flex items-center gap-2 hover:text-red-600 relative"
          >
            <FaHeart className="text-lg text-red-500" />
            <span className="font-medium">
              My Wishlist {user && favoritesCount > 0 && `(${favoritesCount})`}
            </span>
          </Link>

          {!user ? (
            <Link
              to="/login"
              className="flex items-center gap-2 hover:text-blue-700"
            >
              <FaUser className="text-lg" />
              <span className="font-medium">Sign in</span>
            </Link>
          ) : (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 cursor-pointer hover:text-blue-700 transition"
              >
                <FaUser className="text-lg" />
                <span className="font-medium">
                  {user.name || "User"}
                </span>
              </button>

              {/* User Dropdown - Click based */}
              {userDropdownOpen && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 bg-white shadow-xl rounded-xl border border-gray-100 w-52 z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b">
                      <p className="text-sm font-semibold text-gray-900">{user.name || "User"}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                    >
                      <FaUser className="text-gray-400" size={14} />
                      <span className="text-sm text-gray-700">My Account</span>
                    </Link>
                    <Link
                      to="/purchase-history"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                    >
                      <FaBox className="text-gray-400" size={14} />
                      <span className="text-sm text-gray-700">Purchase History</span>
                    </Link>
                    <Link
                      to="/contact"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                    >
                      <FaEnvelope className="text-gray-400" size={14} />
                      <span className="text-sm text-gray-700">Contact Us</span>
                    </Link>
                    <div className="border-t">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition text-red-600"
                      >
                        <FaTimes className="text-red-400" size={14} />
                        <span className="text-sm">Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <Link
            to="/cart"
            className="flex items-center gap-2 hover:text-blue-700 relative"
          >
            <div className="relative">
              <FaShoppingBag className="text-lg" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
            <span className="font-medium">Cart</span>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-xl text-gray-700"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* ===== MOBILE DRAWER MENU ===== */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50">
          <div className="absolute top-0 left-0 w-72 h-full bg-white shadow-lg p-5 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-700 font-semibold">Menu</h3>
              <FaTimes
                onClick={() => setMenuOpen(false)}
                className="cursor-pointer text-gray-600 text-lg"
              />
            </div>

            <a
              href={`tel:${(process.env.REACT_APP_PHONE_NUMBER || "02522-669393").replace(/-/g, '')}`}
              className="flex items-center gap-2 mb-3 hover:text-blue-700"
            >
              <FaQuestionCircle className="text-lg" />
              <span>Help is here {process.env.REACT_APP_PHONE_NUMBER || "02522-669393"}</span>
            </a>

            <Link
              to="/projects"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 mb-3 hover:text-blue-700"
            >
              <FaFolderOpen className="text-lg" />
              <span>My Projects</span>
            </Link>

            <Link
              to="/favorites"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 mb-3 hover:text-red-600"
            >
              <FaHeart className="text-lg text-red-500" />
              <span>My Favorites {user && favoritesCount > 0 && `(${favoritesCount})`}</span>
            </Link>

            <Link
              to="/cart"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 mb-3 hover:text-blue-700"
            >
              <div className="relative">
                <FaShoppingBag className="text-lg" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center" style={{ fontSize: '10px' }}>
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </div>
              <span>Cart {cartCount > 0 && `(${cartCount})`}</span>
            </Link>

            {!user ? (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 mb-3 hover:text-blue-700"
              >
                <FaUser className="text-lg" />
                <span>Sign in</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/account"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 mb-3 hover:text-blue-700"
                >
                  <FaUser className="text-lg" />
                  <span>My Account</span>
                </Link>
                <Link
                  to="/purchase-history"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 mb-3 hover:text-blue-700"
                >
                  <FaBox className="text-lg" />
                  <span>Purchase History</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 mb-3 text-red-500"
                >
                  <FaUser className="text-lg" />
                  <span>Logout</span>
                </button>
              </>
            )}

            <hr className="my-4" />

            <div className="flex flex-col gap-3 text-gray-800 font-medium text-sm">
              {/*All link */}
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className="hover:text-red-600"
              >
                Home
              </Link>

              {/* Dynamic categories */}
              {categoriesLoading ? (
                <div className="text-gray-400 text-sm">Loading categories...</div>
              ) : (
                categories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/category/${category.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className={`hover:text-red-600 flex items-center gap-2 ${
                      category.slug === "bulk-orders"
                        ? "text-orange-600 font-bold"
                        : ""
                    }`}
                  >
                    {category.slug === "bulk-orders" && <FaBoxes className="text-orange-500" size={14} />}
                    {category.name}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== DESKTOP CATEGORY ROW (Scrollable) ===== */}
      <div className="hidden md:block w-full border-t relative z-10 bg-white">
        <div className="max-w-[1600px] mx-auto px-8">
          {/* Scrollable category container */}
          <div className="flex items-center overflow-x-auto py-3 text-gray-800 text-sm font-medium gap-1 scroll-smooth [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full">
            {/* All - Regular Link (sticky) */}
            <Link
              to="/"
              className="hover:text-red-600 transition px-3 py-2 rounded hover:bg-gray-50 whitespace-nowrap flex-shrink-0"
            >
              Home
            </Link>

            {/* Divider */}
            <div className="w-px h-5 bg-gray-300 flex-shrink-0"></div>

            {/* Dynamic category links */}
            {categoriesLoading ? (
              <span className="text-gray-400 text-sm flex-shrink-0">Loading...</span>
            ) : (
              categories.map((category) => {
                // Special handling for cards (mega dropdown)
                if (category.slug === "cards") {
                  return (
                    <MegaDropdown
                      key={category.id}
                      label={category.name}
                      categorySlug={category.slug}
                      icon={FaIdCard}
                    />
                  );
                }
                // Special handling for bulk orders (mega dropdown with highlight)
                if (category.slug === "bulk-orders") {
                  return (
                    <MegaDropdown
                      key={category.id}
                      label={category.name}
                      categorySlug={category.slug}
                      icon={FaBoxes}
                      highlight={true}
                    />
                  );
                }
                // Regular category links - use new /category/:slug route
                return (
                  <Link
                    key={category.id}
                    to={`/category/${category.slug}`}
                    className="hover:text-red-600 transition px-3 py-2 rounded hover:bg-gray-50 whitespace-nowrap flex-shrink-0"
                  >
                    {category.name}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
