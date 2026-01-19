import React, { useEffect, useState, Fragment } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  IoChevronBack,
  IoChevronForward,
  IoChevronDown,
  IoChevronUp,
  IoTrashOutline,
  IoCreateOutline,
  IoAddCircleOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import { FaRegHeart, FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import api from "../api/api";
import { useCart } from "../context/CartContext";

/**
 * Get corner radius in pixels based on shape attribute selection
 * @param {Object} selectedAttributes - Cart item's selected attributes
 * @returns {number} Corner radius in pixels (0 = sharp corners, 12 = rounded)
 */
const getCornerRadiusFromShape = (selectedAttributes) => {
  if (!selectedAttributes) return 0;
  
  // Check for shape-related attributes
  const shapeValue = selectedAttributes?.shape || 
                     selectedAttributes?.corner_style || 
                     selectedAttributes?.corners ||
                     selectedAttributes?.card_shape || '';
  
  const shape = String(shapeValue).toLowerCase();

  if (shape.includes('round') || shape.includes('curved')) {
    return 20; // Match canvas corner radius
  }

  return 0;
};

const Cart = () => {
  const navigate = useNavigate();
  const { refreshCartCount } = useCart();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});
  const [promoCode, setPromoCode] = useState("");
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [quantities, setQuantities] = useState({});
  // Track which design side is shown for each cart item (front or back)
  const [displayedSide, setDisplayedSide] = useState({});

  const fetchCartData = async () => {
    try {
      setLoading(true);
      setError(null);

      await api.get("/sanctum/csrf-cookie");
      await api.get("/api/user").catch(() => {
        navigate("/login", { replace: true });
        throw new Error("unauth");
      });

      const cartRes = await api.get("/api/cart");
      if (cartRes.data?.success) {
        const items = cartRes.data.data || [];
        setCartItems(items);
        // Initialize quantities
        const qtyMap = {};
        items.forEach(item => {
          qtyMap[item.id] = item.quantity;
        });
        setQuantities(qtyMap);
      } else {
        setCartItems([]);
      }
    } catch (err) {
      if (err.message === "unauth") return;
      setError(err?.response?.data?.message || "Failed to load cart");
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id) => {
    try {
      await api.get("/sanctum/csrf-cookie");
      await api.delete(`/api/cart/remove/${id}`);
      setCartItems((prev) => prev.filter((i) => i.id !== id));
      // Update cart count in navbar
      refreshCartCount();
    } catch (_) {
      alert("Failed to remove item. Please try again.");
    }
  };

  const updateQuantity = async (id, newQty) => {
    try {
      await api.get("/sanctum/csrf-cookie");
      await api.put(`/api/cart/update/${id}`, { quantity: newQty });
      setQuantities(prev => ({ ...prev, [id]: newQty }));
      // Refresh cart to get updated prices
      fetchCartData();
      // Update cart count in navbar
      refreshCartCount();
    } catch (_) {
      alert("Failed to update quantity. Please try again.");
    }
  };

  const toggleItemExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Toggle between front and back design display
  const toggleDesignSide = (itemId, direction) => {
    setDisplayedSide(prev => {
      const currentSide = prev[itemId] || 'front';
      if (direction === 'next') {
        return { ...prev, [itemId]: currentSide === 'front' ? 'back' : 'front' };
      } else {
        return { ...prev, [itemId]: currentSide === 'back' ? 'front' : 'back' };
      }
    });
  };

  // Navigate to design studio for editing
  const handleEditDesign = (item) => {
    // Navigate to product detail page with design_id for loading state
    // Use the product slug to go to the CardDetailPage which has design studio integration
    const productSlug = item.product?.slug;
    
    console.log("Edit design clicked:", { 
      design_id: item.design_id, 
      cart_item_id: item.id,
      product_slug: productSlug 
    });
    
    if (!productSlug) {
      alert("Unable to edit design. Product not found.");
      return;
    }
    
    // Navigate to /products/:slug which opens ProductConfigurationFlow with existing design
    const attributes = parseAttributes(item);
    navigate(`/products/${productSlug}`, {
      state: {
        editDesignId: item.design_id,
        cartItemId: item.id,
        selectedAttributes: attributes, // Pass saved orientation and other options
        quantity: item.quantity,
      }
    });
  };

  // Navigate to product page to edit options (quantity, paper type, etc.)
  const handleEditOptions = (item) => {
    const productSlug = item.product?.slug;
    
    console.log("Edit options clicked:", { 
      cart_item_id: item.id,
      product_slug: productSlug,
      selected_attributes: item.selected_attributes
    });
    
    if (!productSlug) {
      alert("Unable to edit options. Product not found.");
      return;
    }
    
    // Navigate to product page with edit options mode
    // This will open the options panel for editing
    navigate(`/products/${productSlug}`, {
      state: {
        editOptionsMode: true,
        cartItemId: item.id,
        currentAttributes: item.selected_attributes,
        currentQuantity: item.quantity,
        designId: item.design_id,
      }
    });
  };

  useEffect(() => {
    fetchCartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Format attribute label
  const formatLabel = (name) => name.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  // Parse selected attributes
  const parseAttributes = (item) => {
    try {
      if (typeof item.selected_attributes === 'string') {
        return JSON.parse(item.selected_attributes);
      }
      return item.selected_attributes || {};
    } catch {
      return {};
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button onClick={fetchCartData} className="bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#e8f4fd]">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-white rounded-full flex items-center justify-center shadow-sm">
              <span className="text-5xl">🛍️</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Looks like your cart is empty.
            </h1>
            <p className="text-gray-600 text-lg">
              Let's fix that — there are lots of great things waiting for you!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Track an order */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Track an order</h3>
              <p className="text-gray-600 text-sm mb-4">Find and track an order to see its status.</p>
              <button
                onClick={() => navigate("/account/orders")}
                className="inline-flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition"
              >
                Go to Order History
              </button>
            </div>

            {/* Promo code */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Shop with a promo code</h3>
              <p className="text-gray-600 text-sm mb-4">Apply a promo code to see discounted products as you shop.</p>
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition"
              >
                Have a code?
              </button>
            </div>

            {/* Help center */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Get help with an order</h3>
              <p className="text-gray-600 text-sm mb-4">Browse articles or talk to us via chat, email or phone.</p>
              <button
                onClick={() => navigate("/contact")}
                className="inline-flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition"
              >
                Go to Help Center
              </button>
            </div>
          </div>

          {/* Continue Shopping */}
          <div className="text-center mt-10">
            <button
              onClick={() => navigate("/")}
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 rounded-lg font-semibold transition"
            >
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => {
              const attributes = parseAttributes(item);
              const isExpanded = expandedItems[item.id];

              // Debug: Log the cart item data to check design URLs
              console.log('[Cart] Cart item data:', {
                id: item.id,
                design_id: item.design_id,
                front_design_url: item.front_design_url,
                back_design_url: item.back_design_url,
                front_original_url: item.front_original_url,
                back_original_url: item.back_original_url,
                design_type: item.design_type,
                product_image: item.product?.featured_image_url,
              });

              // Determine which image to show - prioritize user's design over product image
              const hasFrontDesign = !!item.front_design_url;
              const hasBackDesign = !!item.back_design_url;
              const hasBothDesigns = hasFrontDesign && hasBackDesign;
              const hasAnyDesign = hasFrontDesign || hasBackDesign;
              
              // Current displayed side for this item
              const currentSide = displayedSide[item.id] || 'front';
              
              // Get the image to display
              let displayImage;
              let displayLabel;
              if (hasAnyDesign) {
                // Show user's design
                if (currentSide === 'front' && hasFrontDesign) {
                  displayImage = item.front_design_url;
                  displayLabel = 'Front';
                } else if (currentSide === 'back' && hasBackDesign) {
                  displayImage = item.back_design_url;
                  displayLabel = 'Back';
                } else if (hasFrontDesign) {
                  displayImage = item.front_design_url;
                  displayLabel = 'Front';
                } else {
                  displayImage = item.back_design_url;
                  displayLabel = 'Back';
                }
              } else {
                // Fallback to product image
                displayImage = item.product?.featured_image_url || "https://via.placeholder.com/160x100/f3f4f6/9ca3af?text=Design";
                displayLabel = null;
              }
              
              const name = item.product?.name || "Product";
              const itemTotal = Number(item.total_price || 0);

              // Get available quantity options from product attributes
              const quantityOptions = item.product?.attributes?.quantity ||
                item.product?.attributes?.pricing_tiers ||
                [{ quantity: item.quantity }];

              // Get corner radius from selected attributes
              const cornerRadius = getCornerRadiusFromShape(item.selected_attributes);

              return (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex gap-6">
                      {/* Design Preview - Display complete card preview with white margins */}
                      <div className="flex-shrink-0">
                        <div className="relative group">
                          {/* Show complete card preview at fixed container size (matches Preview Modal and Final Steps) */}
                          <div className="relative border border-gray-300 shadow-sm flex items-center justify-center" style={{ width: '180px', height: '120px' }}>
                            <img
                              src={displayImage}
                              alt={name}
                              onLoad={(e) => {
                                console.log('[Cart] Preview image loaded:', {
                                  itemId: item.id,
                                  naturalWidth: e.target.naturalWidth,
                                  naturalHeight: e.target.naturalHeight,
                                  orientation: item.selected_attributes?.orientation,
                                  displaySide: displayLabel,
                                });
                              }}
                              style={{
                                display: 'block',
                                maxWidth: '100%',
                                maxHeight: '100%',
                                width: 'auto',
                                height: 'auto',
                                objectFit: 'contain',
                                borderRadius: cornerRadius > 0 ? `${cornerRadius}px` : '0'
                              }}
                            />
                            {/* Side label badge */}
                            {displayLabel && (
                              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                                {displayLabel}
                              </div>
                            )}
                            {/* Design type badge - shows Uploaded or Customized */}
                            {item.design_type && item.design_type !== 'blank' && (
                              <div className={`absolute top-2 left-2 text-white text-xs px-2 py-0.5 rounded ${
                                item.design_type === 'uploaded' ? 'bg-blue-500/80' : 'bg-green-500/80'
                              }`}>
                                {item.design_type === 'uploaded' ? 'Uploaded' : 'Customized'}
                              </div>
                            )}
                          </div>
                          
                          {/* Navigation arrows - only show if both front and back exist */}
                          {hasBothDesigns && (
                            <>
                              <button 
                                onClick={() => toggleDesignSide(item.id, 'prev')}
                                className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 rounded-full shadow hover:bg-white transition"
                                title="Previous side"
                              >
                                <IoChevronBack size={16} />
                              </button>
                              <button 
                                onClick={() => toggleDesignSide(item.id, 'next')}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 rounded-full shadow hover:bg-white transition"
                                title="Next side"
                              >
                                <IoChevronForward size={16} />
                              </button>
                            </>
                          )}
                          
                          {/* Edit link - navigates to design studio with design ID */}
                          <button
                            onClick={() => handleEditDesign(item)}
                            className="flex items-center justify-center gap-1 w-full mt-4 pt-2 text-cyan-600 text-sm hover:underline border-t border-gray-100"
                          >
                            <IoCreateOutline size={14} />
                            Edit Design
                          </button>
                          
                          {/* Edit Options button - navigates to product page for editing options */}
                          <button
                            onClick={() => handleEditOptions(item)}
                            className="flex items-center justify-center gap-1 w-full pt-2 text-gray-600 text-sm hover:text-cyan-600 hover:underline"
                          >
                            <IoSettingsOutline size={14} />
                            Edit Options
                          </button>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
                            {/* Show template name if design is customized from a template */}
                            {item.design_type === 'customized' && item.template_name && (
                              <p className="text-sm text-gray-500 mt-0.5">
                                Template: {item.template_name}
                              </p>
                            )}
                            {/* Show "Uploaded Design" label for uploaded designs */}
                            {item.design_type === 'uploaded' && (
                              <p className="text-sm text-blue-600 mt-0.5">
                                Your Uploaded Design
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-cyan-600 hover:text-cyan-700 text-sm underline"
                          >
                            Remove
                          </button>
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-gray-600">Quantity</span>
                          <div className="relative">
                            <select
                              value={quantities[item.id] || item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-gray-900 font-medium focus:outline-none focus:border-cyan-500"
                            >
                              {Array.isArray(quantityOptions) ? (
                                quantityOptions.map((opt, idx) => (
                                  <option key={idx} value={opt.quantity || opt}>
                                    {opt.quantity || opt}
                                  </option>
                                ))
                              ) : (
                                <option value={item.quantity}>{item.quantity}</option>
                              )}
                            </select>
                            <IoChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                          </div>
                        </div>

                        {/* Expandable Selected Options */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          <button
                            onClick={() => toggleItemExpand(item.id)}
                            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
                          >
                            <span className="font-semibold text-gray-900">Selected options</span>
                            {isExpanded ? <IoChevronUp size={18} /> : <IoChevronDown size={18} />}
                          </button>

                          {isExpanded && (
                            <div className="px-4 py-3 space-y-2 border-t">
                              {Object.entries(attributes).map(([key, value]) => {
                                if (!value) return null;

                                // Try to get display name and price from product attributes
                                let displayValue = value;
                                let price = null;

                                const productAttr = item.product?.attributes?.[key];
                                if (productAttr && Array.isArray(productAttr)) {
                                  const opt = productAttr.find(o =>
                                    String(o.id || o.value || o.quantity || o.name) === String(value)
                                  );
                                  if (opt) {
                                    displayValue = opt.name || opt.quantity || value;
                                    price = opt.price;
                                  }
                                }

                                return (
                                  <div key={key} className="flex justify-between text-sm">
                                    <span className="text-gray-600">{formatLabel(key)}: {displayValue}</span>
                                    <span className="text-gray-500">
                                      {price && parseFloat(price) > 0 ? `₹${parseFloat(price).toFixed(2)}` : 'Included'}
                                    </span>
                                  </div>
                                );
                              })}

                              {/* Design info */}
                              {item.front_design_url && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Front Design</span>
                                  <span className="text-green-600">Uploaded ✓</span>
                                </div>
                              )}
                              {item.back_design_url && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Back Design</span>
                                  <span className="text-green-600">Uploaded ✓</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">
                          ₹{itemTotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Item Total Bar */}
                  <div className="bg-gray-50 px-6 py-3 flex justify-between items-center border-t">
                    <span className="font-semibold text-gray-700">Item Total</span>
                    <span className="text-xl font-bold text-gray-900">₹{itemTotal.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              {/* Subtotal */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-2xl font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Promo Code */}
              <div className="border-t pt-4 mb-4">
                <button
                  onClick={() => setPromoExpanded(!promoExpanded)}
                  className="w-full flex items-center justify-between text-gray-700 hover:text-gray-900"
                >
                  <span>Have a code?</span>
                  {promoExpanded ? <IoChevronUp size={18} /> : <IoChevronDown size={18} />}
                </button>

                {promoExpanded && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Enter promo code"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
                    />
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium">
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => navigate("/checkout")}
                className="w-full py-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold text-lg transition"
              >
                Checkout
              </button>

              {/* Continue Shopping */}
              <Link
                to="/"
                className="block text-center mt-4 text-cyan-600 hover:text-cyan-700 font-medium"
              >
                Continue Shopping
              </Link>

              {/* Trust badges */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-center gap-4 text-gray-400 text-sm">
                  <span>🔒 Secure Checkout</span>
                  <span>•</span>
                  <span>📦 Free Shipping</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
