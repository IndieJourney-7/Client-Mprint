import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IoArrowBack,
  IoCheckmarkCircle,
  IoSparkles,
  IoLayersOutline,
  IoCartOutline,
  IoFlash,
  IoChevronForward,
  IoInformationCircle
} from 'react-icons/io5';
import api from '../api/api';

const ProductFinalizePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get product data from navigation state
  const { product, selectedAttributes, customDesigns, selectedPrice } = location.state || {};

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Enhancement & Lamination options from product attributes
  const [enhancementOptions, setEnhancementOptions] = useState([]);
  const [laminationOptions, setLaminationOptions] = useState([]);

  // Selected options
  const [selectedEnhancements, setSelectedEnhancements] = useState([]);
  const [selectedLamination, setSelectedLamination] = useState(null);

  // Calculated prices
  const [finalPrice, setFinalPrice] = useState(0);
  const [enhancementTotal, setEnhancementTotal] = useState(0);
  const [laminationPrice, setLaminationPrice] = useState(0);

  const API_BASE_URL = 'http://127.0.0.1:8000';

  useEffect(() => {
    // If no product data, redirect back
    if (!product) {
      navigate(-1);
      return;
    }

    // Extract enhancement and lamination options from product attributes
    const attributes = product.attributes || {};

    if (attributes.enhancement && Array.isArray(attributes.enhancement)) {
      setEnhancementOptions(attributes.enhancement);
    }

    if (attributes.lamination && Array.isArray(attributes.lamination)) {
      setLaminationOptions(attributes.lamination);
      // Default to first option if available
      if (attributes.lamination.length > 0) {
        setSelectedLamination(attributes.lamination[0].id);
        setLaminationPrice(parseFloat(attributes.lamination[0].price || 0));
      }
    }

    setLoading(false);
  }, [product, navigate]);

  // Calculate total price whenever selections change
  useEffect(() => {
    const basePrice = selectedPrice?.total || 0;

    // Calculate enhancement total (all selected enhancements)
    let enhTotal = 0;
    selectedEnhancements.forEach(enhId => {
      const enh = enhancementOptions.find(e => e.id === enhId);
      if (enh) {
        enhTotal += parseFloat(enh.price || 0);
      }
    });
    setEnhancementTotal(enhTotal);

    // Calculate lamination price
    let lamPrice = 0;
    if (selectedLamination) {
      const lam = laminationOptions.find(l => l.id === selectedLamination);
      if (lam) {
        lamPrice = parseFloat(lam.price || 0);
      }
    }
    setLaminationPrice(lamPrice);

    // Total = base + enhancements + lamination
    setFinalPrice(basePrice + enhTotal + lamPrice);
  }, [selectedEnhancements, selectedLamination, selectedPrice, enhancementOptions, laminationOptions]);

  const toggleEnhancement = (enhId) => {
    setSelectedEnhancements(prev => {
      if (prev.includes(enhId)) {
        return prev.filter(id => id !== enhId);
      }
      return [...prev, enhId];
    });
  };

  const handleLaminationSelect = (lamId) => {
    setSelectedLamination(lamId);
  };

  const handleAddToCart = async () => {
    setSubmitting(true);
    setError('');

    try {
      await api.get('/sanctum/csrf-cookie');

      // Build complete attributes including enhancements and lamination
      const completeAttributes = {
        ...selectedAttributes,
        enhancements: selectedEnhancements,
        lamination: selectedLamination
      };

      const cartPayload = {
        product_id: product.id,
        quantity: selectedPrice.quantity,
        selected_attributes: completeAttributes,
      };

      const response = await api.post('/api/cart/add', cartPayload);

      if (response.data?.success) {
        const cartId = response.data.data?.id;

        // Upload designs if available
        if (cartId && (customDesigns?.front || customDesigns?.back)) {
          const formData = new FormData();
          if (customDesigns.front?.file) {
            formData.append('front_design', customDesigns.front.file);
          }
          if (customDesigns.back?.file) {
            formData.append('back_design', customDesigns.back.file);
          }

          await api.post(`/api/cart/${cartId}/upload-designs`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }

        setSuccess('Product added to cart successfully!');
        setTimeout(() => {
          navigate('/cart');
        }, 1500);
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || 'Failed to add to cart. Please try again.';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBuyNow = async () => {
    setSubmitting(true);
    setError('');

    try {
      await api.get('/sanctum/csrf-cookie');

      const completeAttributes = {
        ...selectedAttributes,
        enhancements: selectedEnhancements,
        lamination: selectedLamination
      };

      const cartPayload = {
        product_id: product.id,
        quantity: selectedPrice.quantity,
        selected_attributes: completeAttributes,
      };

      const response = await api.post('/api/cart/add', cartPayload);

      if (response.data?.success) {
        const cartId = response.data.data?.id;

        if (cartId && (customDesigns?.front || customDesigns?.back)) {
          const formData = new FormData();
          if (customDesigns.front?.file) {
            formData.append('front_design', customDesigns.front.file);
          }
          if (customDesigns.back?.file) {
            formData.append('back_design', customDesigns.back.file);
          }

          await api.post(`/api/cart/${cartId}/upload-designs`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }

        // Navigate to checkout
        navigate(`/checkout?buyNow=true&productSlug=${product.slug}`);
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || 'Failed to process. Please try again.';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const getImageUrl = () => {
    if (product?.featured_image_url) return product.featured_image_url;
    if (product?.images?.[0]?.image_url) return product.images[0].image_url;
    if (product?.images?.[0]?.image_path) return `${API_BASE_URL}/storage/${product.images[0].image_path}`;
    return 'https://via.placeholder.com/200?text=No+Image';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading finalization options...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Product data not found</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const hasEnhancements = enhancementOptions.length > 0;
  const hasLamination = laminationOptions.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition"
            >
              <IoArrowBack size={20} />
              <span>Back to Product</span>
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Step 2 of 2</span>
              <IoChevronForward size={16} />
              <span className="font-medium text-gray-900">Finalize Options</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {(error || success) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className={`${success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded-lg`}>
            {success || error}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Page Title */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <IoSparkles className="text-amber-500" />
                Finalize Your Print
              </h1>
              <p className="mt-2 text-gray-600">
                Add premium finishing options to make your print stand out
              </p>
            </div>

            {/* Print Enhancements Section */}
            {hasEnhancements && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-amber-50 to-orange-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <IoSparkles className="text-amber-600" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Print Enhancements</h2>
                      <p className="text-sm text-gray-600">Select multiple options to enhance your print</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {enhancementOptions.map((enhancement) => {
                      const isSelected = selectedEnhancements.includes(enhancement.id);
                      return (
                        <button
                          key={enhancement.id}
                          onClick={() => toggleEnhancement(enhancement.id)}
                          className={`
                            relative p-4 rounded-xl border-2 transition-all text-left
                            ${isSelected
                              ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                              : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                            }
                          `}
                        >
                          {isSelected && (
                            <div className="absolute top-3 right-3">
                              <IoCheckmarkCircle className="text-amber-500" size={24} />
                            </div>
                          )}
                          <h3 className="font-semibold text-gray-900 pr-8">{enhancement.name}</h3>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-amber-600 font-bold">
                              +₹{parseFloat(enhancement.price || 0).toFixed(2)}
                            </span>
                          </div>
                          {enhancement.description && (
                            <p className="mt-2 text-sm text-gray-500">{enhancement.description}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedEnhancements.length > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg flex items-center justify-between">
                      <span className="text-sm text-amber-700">
                        {selectedEnhancements.length} enhancement{selectedEnhancements.length > 1 ? 's' : ''} selected
                      </span>
                      <span className="font-semibold text-amber-700">
                        +₹{enhancementTotal.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lamination Section */}
            {hasLamination && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-cyan-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <IoLayersOutline className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Lamination Type</h2>
                      <p className="text-sm text-gray-600">Choose a protective finish for durability</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {laminationOptions.map((lamination) => {
                      const isSelected = selectedLamination === lamination.id;
                      return (
                        <button
                          key={lamination.id}
                          onClick={() => handleLaminationSelect(lamination.id)}
                          className={`
                            relative p-4 rounded-xl border-2 transition-all text-left
                            ${isSelected
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                            }
                          `}
                        >
                          {isSelected && (
                            <div className="absolute top-3 right-3">
                              <IoCheckmarkCircle className="text-blue-500" size={24} />
                            </div>
                          )}
                          <h3 className="font-semibold text-gray-900 pr-8">{lamination.name}</h3>
                          <div className="mt-1">
                            <span className={`font-bold ${parseFloat(lamination.price) > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                              {parseFloat(lamination.price) > 0 ? `+₹${parseFloat(lamination.price).toFixed(2)}` : 'Included'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* No Options Available */}
            {!hasEnhancements && !hasLamination && (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <IoInformationCircle className="mx-auto text-gray-400" size={48} />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No Additional Options</h3>
                <p className="mt-2 text-gray-600">
                  This product doesn't have enhancement or lamination options configured.
                  You can proceed directly to checkout.
                </p>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

              {/* Product Preview */}
              <div className="flex gap-4 mb-6 pb-6 border-b">
                <img
                  src={getImageUrl()}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/80?text=No+Image';
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">Qty: {selectedPrice?.quantity || 1}</p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Price:</span>
                  <span className="font-medium">₹{(selectedPrice?.total || 0).toFixed(2)}</span>
                </div>

                {enhancementTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Enhancements:</span>
                    <span className="font-medium text-amber-600">+₹{enhancementTotal.toFixed(2)}</span>
                  </div>
                )}

                {laminationPrice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Lamination:</span>
                    <span className="font-medium text-blue-600">+₹{laminationPrice.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-3 border-t">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-gray-900">₹{finalPrice.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    ₹{(finalPrice / (selectedPrice?.quantity || 1)).toFixed(2)} per unit
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleAddToCart}
                  disabled={submitting}
                  className="w-full py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  ) : (
                    <>
                      <IoCartOutline size={20} />
                      Add to Cart
                    </>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={submitting}
                  className="w-full py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <IoFlash size={18} />
                      Buy Now
                    </>
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-gray-500 mt-4">
                Free shipping on orders over ₹500
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFinalizePage;
