import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  IoArrowBack,
  IoArrowForward,
  IoCheckmarkCircle,
  IoChevronDown,
  IoChevronUp,
  IoCartOutline,
  IoEyeOutline,
  IoHelpCircleOutline,
  IoWarning,
  IoCall,
} from "react-icons/io5";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import api from "../api/api";
import { useFavorites } from "../context/FavoritesContext";
import CanvasDesignStudio from "./CanvasDesign";
import useWorkSession from "../hooks/useWorkSession";
import TemplateBrowser from "./TemplateBrowser";

// Step indicators
const STEPS = [
  { id: 1, name: "Options", description: "Select quantity & options" },
  { id: 2, name: "Design", description: "Upload your design" },
  { id: 3, name: "Final Steps", description: "Choose finishing & add to cart" },
];

const ProductConfigurationFlow = () => {
  const { slug, productSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isFavorite: isFavoritedGlobal, toggleFavorite: toggleFavoriteGlobal } = useFavorites();

  // Determine actual slugs
  const actualProductSlug = productSlug || slug;
  const categorySlug = productSlug ? slug : null;

  // Core state
  const [currentStep, setCurrentStep] = useState(1);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  // Product attributes & selection
  const [attributes, setAttributes] = useState({});
  const [selectedAttributes, setSelectedAttributes] = useState({});

  // Design state
  const [customDesigns, setCustomDesigns] = useState({ front: null, back: null });
  const [showDesignStudio, setShowDesignStudio] = useState(false);
  const [designId, setDesignId] = useState(null); // Server design ID
  const [designCreating, setDesignCreating] = useState(false);
  const [editingDesignData, setEditingDesignData] = useState(null); // Data for editing existing design
  const [loadingDesignData, setLoadingDesignData] = useState(false);

  // Clear previews when orientation or shape changes (canvas will remount)
  React.useEffect(() => {
    if (selectedAttributes.orientation || selectedAttributes.shape) {
      console.log('[ProductConfigurationFlow] Orientation or shape changed, clearing old previews');
      setCustomDesigns({ front: null, back: null });
    }
  }, [selectedAttributes.orientation, selectedAttributes.shape]);

  // Final step state
  const [selectedFinishing, setSelectedFinishing] = useState({});
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Flip preview
  const [isFlipped, setIsFlipped] = useState(false);

  // Cart/Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  // UI State
  const [expandedSections, setExpandedSections] = useState({});

  // Work session hook - persistent state
  const {
    sessionId,
    sessionData,
    isInitialized: sessionInitialized,
    saveSession,
  } = useWorkSession(
    product?.id,
    selectedAttributes.orientation || 'horizontal',
    selectedAttributes.shape || 'rectangle',
    selectedAttributes
  );

  // Auto-save work session whenever selections change
  useEffect(() => {
    if (sessionInitialized && sessionId) {
      saveSession({
        orientation: selectedAttributes.orientation || 'horizontal',
        shape: selectedAttributes.shape || 'rectangle',
        selected_attributes: selectedAttributes,
      });
    }
  }, [sessionInitialized, sessionId, selectedAttributes, saveSession]);

  // Restore from work session (only once on initial load)
  const [hasRestoredSession, setHasRestoredSession] = useState(false);
  useEffect(() => {
    if (sessionData && sessionData.selected_attributes && !hasRestoredSession) {
      setSelectedAttributes((prev) => ({
        ...prev,
        ...sessionData.selected_attributes,
      }));
      setHasRestoredSession(true);
    }
  }, [sessionData, hasRestoredSession]);

  // Check if editing from cart (restore saved design and orientation)
  useEffect(() => {
    if (location.state?.editDesignId && product) {
      setDesignId(location.state.editDesignId);

      // Restore saved attributes (orientation, quantity, etc.) from cart
      if (location.state.selectedAttributes) {
        setSelectedAttributes({
          ...location.state.selectedAttributes
        });

        // Wait for next tick to ensure state is updated, then open design studio
        setTimeout(() => {
          setCurrentStep(2);
          setShowDesignStudio(true);
        }, 0);
      } else {
        // No saved attributes, open anyway
        setCurrentStep(2);
        setShowDesignStudio(true);
      }
    }
  }, [location.state, product]);

  // Fetch design data when editing existing design
  useEffect(() => {
    const fetchDesignData = async () => {
      if (!designId || editingDesignData) return; // Already loaded or no designId

      setLoadingDesignData(true);
      console.log('[ProductConfigurationFlow] Fetching design data for editing:', designId);

      try {
        const response = await api.get(`/api/designs/${designId}/edit`);

        if (response.data?.success) {
          const data = response.data.data;
          console.log('[ProductConfigurationFlow] Design data fetched:', data);

          setEditingDesignData({
            frontCanvasState: data.front_canvas_state,
            backCanvasState: data.back_canvas_state,
            frontImageUrl: data.front_image_url,
            backImageUrl: data.back_image_url,
          });
        } else {
          console.error('[ProductConfigurationFlow] Failed to fetch design data');
        }
      } catch (error) {
        console.error('[ProductConfigurationFlow] Error fetching design data:', error);
      } finally {
        setLoadingDesignData(false);
      }
    };

    if (designId) {
      fetchDesignData();
    }
  }, [designId, editingDesignData]);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError("");

      try {
        const apiUrl = categorySlug
          ? `/api/products/${actualProductSlug}?category=${categorySlug}`
          : `/api/products/${actualProductSlug}`;
        const response = await api.get(apiUrl);

        if (response.data?.success && response.data?.data) {
          const productData = response.data.data;
          setProduct(productData);

          if (productData.attributes && typeof productData.attributes === "object") {
            setAttributes(productData.attributes);

            // Initialize selectedAttributes from location.state (from modal) or defaults
            if (location.state?.selectedAttributes) {
              // Coming from DesignOptionsModal with pre-selected options
              setSelectedAttributes(location.state.selectedAttributes);
            } else if (!location.state?.editDesignId) {
              // Fresh start - set defaults
              const defaults = { orientation: "horizontal", shape: "rectangle" };
              Object.entries(productData.attributes).forEach(([key, value]) => {
                const normalizedKey = key.toLowerCase().replace(/[_\s]/g, "");
                if (normalizedKey === "orientation" || normalizedKey === "productorientation") return;

                if (Array.isArray(value) && value.length > 0) {
                  const firstOption = value[0];
                  defaults[key] = firstOption.id || firstOption.value || firstOption.name || firstOption.quantity || firstOption;
                }
              });
              setSelectedAttributes(defaults);
            }
          } else if (!location.state?.editDesignId && !location.state?.selectedAttributes) {
            setSelectedAttributes({ orientation: "horizontal", shape: "rectangle" });
          }
        } else {
          setError("Product not found.");
        }
      } catch (err) {
        setError("Failed to fetch product details.");
      } finally {
        setLoading(false);
      }
    };

    if (actualProductSlug) fetchProduct();
  }, [actualProductSlug, categorySlug, location.state]);

  // Check user - REQUIRE LOGIN for design studio
  useEffect(() => {
    const checkUser = async () => {
      try {
        await api.get("/sanctum/csrf-cookie");
        const userRes = await api.get("/api/user");
        const userData = userRes.data?.user ?? userRes.data?.data ?? null;
        setUser(userData);

        // If no user, redirect to login
        if (!userData) {
          navigate("/login", {
            state: {
              from: location.pathname,
              message: "Please login to create your custom design"
            }
          });
        }
      } catch {
        setUser(null);
        // Redirect to login if not authenticated
        navigate("/login", {
          state: {
            from: location.pathname,
            message: "Please login to create your custom design"
          }
        });
      }
    };
    checkUser();
  }, [navigate, location.pathname]);

  // Format label helper
  const formatLabel = (name) => name.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  // Get pricing
  const getSelectedPrice = useCallback(() => {
    const quantityAttr = attributes.quantity || attributes.pricing_tiers;
    if (!quantityAttr || !Array.isArray(quantityAttr)) {
      return {
        total: parseFloat(product?.price || 0),
        unit: parseFloat(product?.price || 0),
        quantity: 1,
      };
    }

    const selectedQty = selectedAttributes.quantity || selectedAttributes.pricing_tiers;
    const tier = quantityAttr.find(
      (t) => String(t.quantity) === String(selectedQty) || t.id === selectedQty
    );

    if (tier) {
      let basePrice = parseFloat(tier.price || 0);
      let unitPrice = parseFloat(tier.unitPrice || tier.price || 0);

      // Add option prices
      Object.entries(selectedAttributes).forEach(([key, value]) => {
        if (key === "quantity" || key === "pricing_tiers") return;
        const attrOptions = attributes[key];
        if (attrOptions && Array.isArray(attrOptions)) {
          const selectedOption = attrOptions.find((opt) => (opt.id || opt.value) === value);
          if (selectedOption && selectedOption.price) {
            const additionalPrice = parseFloat(selectedOption.price);
            basePrice += additionalPrice;
            unitPrice += additionalPrice / tier.quantity;
          }
        }
      });

      // Add finishing prices
      Object.entries(selectedFinishing).forEach(([key, value]) => {
        const finishOptions = attributes[key];
        if (finishOptions && Array.isArray(finishOptions)) {
          const selectedOption = finishOptions.find((opt) => (opt.id || opt.value || opt.name) === value);
          if (selectedOption && selectedOption.price) {
            basePrice += parseFloat(selectedOption.price);
          }
        }
      });

      return { total: basePrice, unit: unitPrice, quantity: parseInt(tier.quantity || 1) };
    }

    return {
      total: parseFloat(product?.price || 0),
      unit: parseFloat(product?.price || 0),
      quantity: 1,
    };
  }, [attributes, selectedAttributes, selectedFinishing, product]);

  const selectedPrice = useMemo(() => getSelectedPrice(), [getSelectedPrice]);

  // Check if designs exist
  const hasAnyDesign = customDesigns.front?.hasContent || customDesigns.back?.hasContent;
  const hasBothDesigns = customDesigns.front?.hasContent && customDesigns.back?.hasContent;

  // Handle attribute change
  const handleAttributeChange = (key, value) => {
    setSelectedAttributes((prev) => ({ ...prev, [key]: value }));
  };

  // Handle finishing change
  const handleFinishingChange = (key, value) => {
    setSelectedFinishing((prev) => ({ ...prev, [key]: value }));
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Navigation handlers
  const canProceedToStep2 =
    (selectedAttributes.quantity || selectedAttributes.pricing_tiers) &&
    selectedAttributes.orientation &&
    selectedAttributes.shape;
  const canProceedToStep3 = hasAnyDesign;
  const canAddToCart = hasAnyDesign && reviewConfirmed && termsAccepted;

  const goToStep = (step) => {
    if (step === 2 && !canProceedToStep2) return;
    if (step === 3 && !canProceedToStep3) return;
    setCurrentStep(step);
  };

  // Create design on server when entering design studio
  const createDesignOnServer = async () => {
    if (designId) return designId; // Already created

    setDesignCreating(true);
    try {
      await api.get("/sanctum/csrf-cookie");
      const response = await api.post("/api/designs", {
        product_id: product.id,
        orientation: selectedAttributes.orientation || "horizontal",
        name: `${product.name} Design`,
      });

      if (response.data?.success && response.data?.data?.id) {
        const newDesignId = response.data.data.id;
        setDesignId(newDesignId);
        return newDesignId;
      }
      throw new Error("Failed to create design");
    } catch (err) {
      console.error("Error creating design:", err);
      setError("Failed to initialize design. Please try again.");
      return null;
    } finally {
      setDesignCreating(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1 && canProceedToStep2) {
      // Create design on server before entering design studio
      const createdDesignId = await createDesignOnServer();
      if (createdDesignId) {
        setCurrentStep(2);
        setShowDesignStudio(true);
      }
    } else if (currentStep === 2 && canProceedToStep3) {
      setShowDesignStudio(false);
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setShowDesignStudio(false);
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
      setShowDesignStudio(true);
    }
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!product || !canAddToCart) return;

    setIsSubmitting(true);
    try {
      await api.get("/sanctum/csrf-cookie");

      // Finalize design before adding to cart
      if (designId) {
        console.log("Finalizing design:", designId);
        await api.post(`/api/designs/${designId}/finalize`);
      } else {
        console.warn("No designId available when adding to cart!");
      }

      const cartPayload = {
        product_id: product.id,
        quantity: selectedPrice.quantity,
        selected_attributes: { ...selectedAttributes, ...selectedFinishing },
        design_id: designId, // Link to saved design
      };

      console.log("Adding to cart with payload:", cartPayload);

      const response = await api.post("/api/cart/add", cartPayload);

      if (response.data?.success) {
        setSuccess("Product added to cart successfully!");
        setTimeout(() => {
          navigate("/cart");
        }, 1500);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add to cart. Please try again.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Favorite toggle
  const isFavorite = product ? isFavoritedGlobal(product.id) : false;
  const toggleFavorite = async () => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (product) {
      await toggleFavoriteGlobal(product.id);
    }
  };

  // Get finishing options from backend - covers various attribute names
  const getFinishingOptions = () => {
    // Common finishing attribute keys used in printing products
    const finishingKeys = [
      'enhancement', 'lamination', 'stock', 'finish', 'coating', 'corners',
      'paper_type', 'paper', 'material', 'matte', 'glossy', 'uv', 'spot_uv',
      'foil', 'embossing', 'die_cut', 'rounded_corners', 'square_corners',
      'velvet', 'silk', 'backside', 'back_side', 'back_print'
    ];
    const options = {};

    // Check for exact matches
    finishingKeys.forEach(key => {
      if (attributes[key] && Array.isArray(attributes[key]) && attributes[key].length > 0) {
        options[key] = attributes[key];
      }
    });

    // Also check for case-insensitive matches and partial matches
    Object.entries(attributes).forEach(([key, value]) => {
      if (!Array.isArray(value) || value.length === 0) return;
      if (key === 'quantity' || key === 'pricing_tiers') return;

      const lowerKey = key.toLowerCase();
      // Check if this key contains finishing-related words
      const isFinishing = finishingKeys.some(fk =>
        lowerKey.includes(fk) || fk.includes(lowerKey)
      ) || lowerKey.includes('finish') || lowerKey.includes('paper') ||
         lowerKey.includes('lamina') || lowerKey.includes('coat') ||
         lowerKey.includes('stock') || lowerKey.includes('corner');

      if (isFinishing && !options[key]) {
        options[key] = value;
      }
    });

    return options;
  };

  const finishingOptions = getFinishingOptions();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-500 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">Loading product...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Oops!</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button onClick={() => navigate(-1)} className="bg-cyan-500 text-white px-6 py-3 rounded-lg hover:bg-cyan-600 transition">
            <IoArrowBack className="inline mr-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  // Get quantity options
  const quantityOptions = attributes.quantity || attributes.pricing_tiers || [];

  // Render Step 1: Options & Quantity Selection
  const renderStep1 = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
            <IoArrowBack size={20} />
            <span>Back</span>
          </button>
          <div className="text-center">
            <h1 className="font-semibold text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-500">Step 1 of 3: Select Options</p>
          </div>
          <button onClick={toggleFavorite} className="p-2 rounded-full hover:bg-gray-100">
            {isFavorite ? <FaHeart className="text-red-500" size={20} /> : <FaRegHeart className="text-gray-600" size={20} />}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {/* Product Image */}
          <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-6 relative max-w-xl mx-auto">
            <img
              src={product.featured_image_url || `https://via.placeholder.com/800x450/f3f4f6/9ca3af?text=${encodeURIComponent(product.name)}`}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Quantity Selection */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Quantity*</h3>
            <div className="relative">
              <select
                value={selectedAttributes.quantity || selectedAttributes.pricing_tiers || ""}
                onChange={(e) => handleAttributeChange(attributes.quantity ? "quantity" : "pricing_tiers", e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg font-medium appearance-none bg-white focus:border-cyan-500 focus:outline-none cursor-pointer"
              >
                <option value="">Select Quantity</option>
                {quantityOptions.map((opt, idx) => (
                  <option key={idx} value={opt.quantity || opt.id || opt.value}>
                    {opt.quantity || opt.name} {opt.price && `(₹${parseFloat(opt.price).toFixed(2)})`}
                  </option>
                ))}
              </select>
              <IoChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={24} />
            </div>
          </div>

          {/* Other Options */}
          {Object.entries(attributes).map(([key, options]) => {
            // Skip quantity and pricing tiers
            if (key === 'quantity' || key === 'pricing_tiers') return null;
            if (!Array.isArray(options) || options.length === 0) return null;

            // Skip finishing options - these are shown in Final Step
            if (finishingOptions[key]) return null;

            const normalizedKey = key.toLowerCase().replace(/[_\s]/g, "");
            if (normalizedKey === "orientation" || normalizedKey === "productorientation") return null;

            return (
              <div key={key} className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">{formatLabel(key)}*</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {options.map((opt, idx) => {
                    const optValue = opt.id || opt.value || opt.name;
                    const isSelected = selectedAttributes[key] === optValue;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleAttributeChange(key, optValue)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? "border-cyan-500 bg-cyan-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="font-medium text-gray-900">{opt.name || opt.value}</div>
                        {opt.price && parseFloat(opt.price) > 0 && (
                          <div className="text-sm text-cyan-600 mt-1">+₹{parseFloat(opt.price).toFixed(2)}</div>
                        )}
                        {opt.description && (
                          <div className="text-xs text-gray-500 mt-1">{opt.description}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Orientation */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Card Orientation*</h3>
            <div className="grid grid-cols-2 gap-3">
              {['horizontal', 'vertical'].map((orient) => (
                <button
                  key={orient}
                  onClick={() => handleAttributeChange('orientation', orient)}
                  className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                    selectedAttributes.orientation === orient
                      ? "border-cyan-500 bg-cyan-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`${orient === 'horizontal' ? 'w-12 h-8' : 'w-8 h-12'} border-2 border-gray-400 rounded`} />
                  <span className="font-medium capitalize">{orient}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Card Shape */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Card Shape*</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'rectangle', label: 'Rectangle', description: 'Sharp corners' },
                { value: 'rounded', label: 'Rounded Corners', description: 'Smooth edges' }
              ].map((shape) => (
                <button
                  key={shape.value}
                  onClick={() => handleAttributeChange('shape', shape.value)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                    selectedAttributes.shape === shape.value
                      ? "border-cyan-500 bg-cyan-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`w-16 h-10 border-2 border-gray-400 ${shape.value === 'rounded' ? 'rounded-lg' : 'rounded-none'}`}
                  />
                  <div className="text-center">
                    <div className="font-medium">{shape.label}</div>
                    <div className="text-xs text-gray-500">{shape.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t space-y-3">
            {/* Browse Designs Button */}
            <button
              onClick={() => setCurrentStep(4)} // Navigate to template browser
              disabled={!canProceedToStep2}
              className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
                canProceedToStep2
                  ? "bg-white border-2 border-cyan-500 text-cyan-500 hover:bg-cyan-50"
                  : "bg-gray-100 border-2 border-gray-300 text-gray-400 cursor-not-allowed"
              }`}
            >
              Browse Designs
              <IoArrowForward size={20} />
            </button>

            {/* Continue to Design Studio Button */}
            <button
              onClick={handleNext}
              disabled={!canProceedToStep2 || designCreating}
              className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
                canProceedToStep2 && !designCreating
                  ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {designCreating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Initializing Design Studio...
                </>
              ) : (
                <>
                  Upload Your Own Design
                  <IoArrowForward size={20} />
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-500">
              Browse pre-made templates or upload your own design
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Step 2: Design Studio
  const renderStep2 = () => (
    <div className="fixed inset-0 z-50 bg-white">
      <CanvasDesignStudio
        key={`${selectedAttributes.orientation}-${selectedAttributes.shape}`}
        onDesignsChange={setCustomDesigns}
        frontDesign={customDesigns.front}
        backDesign={customDesigns.back}
        productName={product.name}
        productId={product.id}
        designId={designId}
        orientation={selectedAttributes.orientation || "horizontal"}
        cornerRadius={selectedAttributes.shape === 'rounded' ? 20 : 0}
        printDimensions={{
          print_length_inches: product.print_length_inches,
          print_width_inches: product.print_width_inches,
        }}
        sessionId={sessionId}
        // Pass editing data when editing from cart
        initialFrontState={editingDesignData?.frontCanvasState}
        initialBackState={editingDesignData?.backCanvasState}
        initialFrontImage={editingDesignData?.frontImageUrl}
        initialBackImage={editingDesignData?.backImageUrl}
        isEditMode={!!location.state?.editDesignId}
        onSave={(designs) => {
          setCustomDesigns(designs);
          if (sessionInitialized && sessionId) {
            saveSession({
              front_thumbnail: designs.front,
              back_thumbnail: designs.back,
            });
          }
        }}
        onClose={() => {
          setShowDesignStudio(false);
          setCurrentStep(1);
        }}
        onNext={(designs) => {
          setCustomDesigns(designs);
          setShowDesignStudio(false);
          setCurrentStep(3);
          if (sessionInitialized && sessionId) {
            saveSession({
              front_thumbnail: designs.front,
              back_thumbnail: designs.back,
            });
          }
        }}
      />
    </div>
  );

  // Render Step 3: Final Steps - Finishing & Add to Cart
  const renderStep3 = () => {
    console.log('[Step 3] Rendering with customDesigns:', {
      hasFront: !!customDesigns.front?.preview,
      hasBack: !!customDesigns.back?.preview,
      frontPreviewLength: customDesigns.front?.preview?.length,
      backPreviewLength: customDesigns.back?.preview?.length,
      orientation: selectedAttributes.orientation,
      shape: selectedAttributes.shape,
    });

    return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={handleBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
            <IoArrowBack size={20} />
            <span>Back to Design</span>
          </button>
          <div className="text-center">
            <h1 className="font-semibold text-gray-900">Final Steps</h1>
            <p className="text-sm text-gray-500">Step 3 of 3: Finishing & Checkout</p>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <IoCall size={18} />
            <span className="text-sm">02522-669393</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Final Steps</h2>
          <p className="text-gray-600 mt-2">
            Almost done! Make selections below to finalize your design. Have questions? Call us at 02522-669393.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Design Preview with Flip */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              {/* Flip Card Preview - Display preview image exactly as-is */}
              <div className="flex flex-col items-center mb-6">
                <div
                  className="relative cursor-pointer flex justify-center"
                  style={{ perspective: "1000px" }}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <div
                    className="transition-transform duration-700"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                    }}
                  >
                    {/* Front - Show complete card preview with white margins (as-is from canvas) */}
                    <div
                      className="shadow-2xl"
                      style={{
                        backfaceVisibility: "hidden"
                      }}
                    >
                      {customDesigns.front?.preview ? (
                        <img
                          src={customDesigns.front.preview}
                          alt="Front Design"
                          onLoad={(e) => {
                            console.log('[Step 3] Front image loaded:', {
                              naturalWidth: e.target.naturalWidth,
                              naturalHeight: e.target.naturalHeight,
                              orientation: selectedAttributes.orientation,
                            });
                          }}
                          style={{
                            display: 'block',
                            width: 'auto',
                            height: 'auto',
                            maxWidth: '100%',
                            objectFit: 'contain',
                            borderRadius: selectedAttributes.shape === 'rounded' ? '20px' : '0'
                          }}
                        />
                      ) : (
                        <div className="bg-gray-100 flex items-center justify-center text-gray-400 shadow-lg" style={{ width: '300px', height: '200px' }}>
                          No Front Design
                        </div>
                      )}
                    </div>
                    {/* Back - Show complete card preview with white margins (as-is from canvas) */}
                    <div
                      className="absolute top-0 left-0 w-full h-full shadow-2xl flex items-center justify-center"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)"
                      }}
                    >
                      {customDesigns.back?.preview ? (
                        <img
                          src={customDesigns.back.preview}
                          alt="Back Design"
                          onLoad={(e) => {
                            console.log('[Step 3] Back image loaded:', {
                              naturalWidth: e.target.naturalWidth,
                              naturalHeight: e.target.naturalHeight,
                              orientation: selectedAttributes.orientation,
                            });
                          }}
                          style={{
                            display: 'block',
                            width: 'auto',
                            height: 'auto',
                            maxWidth: '100%',
                            objectFit: 'contain',
                            borderRadius: selectedAttributes.shape === 'rounded' ? '20px' : '0'
                          }}
                        />
                      ) : (
                        <div className="bg-gray-100 flex items-center justify-center text-gray-400 shadow-lg" style={{ width: '300px', height: '200px' }}>
                          No Back Design
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setIsFlipped(false)}
                    className={`px-6 py-2 rounded-full font-medium transition ${
                      !isFlipped ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Front
                  </button>
                  <button
                    onClick={() => setIsFlipped(true)}
                    className={`px-6 py-2 rounded-full font-medium transition ${
                      isFlipped ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Back
                  </button>
                </div>

                <p className="text-sm text-gray-500 mt-3">
                  <IoEyeOutline className="inline mr-1" />
                  Click card to flip preview
                </p>
              </div>

              {/* Quantity Selection (shown again for easy modification) */}
              <div className="border-t pt-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Quantity*</h3>
                <div className="relative">
                  <select
                    value={selectedAttributes.quantity || selectedAttributes.pricing_tiers || ""}
                    onChange={(e) => handleAttributeChange(attributes.quantity ? "quantity" : "pricing_tiers", e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg font-medium appearance-none bg-white focus:border-cyan-500 focus:outline-none"
                  >
                    {quantityOptions.map((opt, idx) => (
                      <option key={idx} value={opt.quantity || opt.id || opt.value}>
                        {opt.quantity || opt.name} (₹{parseFloat(opt.price || 0).toFixed(2)})
                      </option>
                    ))}
                  </select>
                  <IoChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={24} />
                </div>
              </div>

              {/* Finishing Options (Stock, Enhancement, Lamination) */}
              {Object.entries(finishingOptions).map(([key, options]) => (
                <div key={key} className="border-t pt-6 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">{formatLabel(key)}*</h3>
                  <div className="space-y-3">
                    {options.map((opt, idx) => {
                      const optValue = opt.id || opt.value || opt.name;
                      const isSelected = selectedFinishing[key] === optValue;
                      const price = parseFloat(opt.price || 0);

                      return (
                        <div
                          key={idx}
                          onClick={() => handleFinishingChange(key, optValue)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-cyan-500 bg-cyan-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Preview image if available */}
                            {opt.image && (
                              <img src={opt.image} alt={opt.name} className="w-16 h-16 rounded-lg object-cover" />
                            )}
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold text-gray-900">{opt.name}</h4>
                                  {opt.description && (
                                    <p className="text-sm text-gray-600 mt-1">{opt.description}</p>
                                  )}
                                  {opt.best_for && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      <span className="font-medium">Best for:</span> {opt.best_for}
                                    </p>
                                  )}
                                  {opt.feels_like && (
                                    <p className="text-xs text-gray-500">
                                      <span className="font-medium">Feels like:</span> {opt.feels_like}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className={`font-semibold ${price > 0 ? 'text-cyan-600' : 'text-green-600'}`}>
                                    {price > 0 ? `+₹${price.toFixed(2)}` : 'Included'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {/* Selection indicator */}
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-cyan-500 bg-cyan-500' : 'border-gray-300'
                            }`}>
                              {isSelected && <IoCheckmarkCircle className="text-white" size={20} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Edit Design Button */}
              <div className="border-t pt-6">
                <button
                  onClick={() => {
                    setCurrentStep(2);
                    setShowDesignStudio(true);
                  }}
                  className="w-full py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Edit Design
                </button>
              </div>
            </div>
          </div>

          {/* Right: Order Summary & Add to Cart */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>

              {/* Price Display */}
              <div className="text-center py-4 bg-gray-50 rounded-xl mb-4">
                <div className="text-3xl font-bold text-gray-900">₹{selectedPrice.total.toFixed(2)}</div>
                <div className="text-sm text-gray-500">
                  ₹{selectedPrice.unit.toFixed(2)} each / {selectedPrice.quantity} units
                </div>
                <div className="text-xs text-green-600 mt-1">FREE Shipping</div>
              </div>

              {/* Expandable Selected Options */}
              <div className="border rounded-xl overflow-hidden mb-4">
                <button
                  onClick={() => toggleSection('options')}
                  className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
                >
                  <span className="font-semibold text-gray-900">Selected options</span>
                  {expandedSections.options ? <IoChevronUp /> : <IoChevronDown />}
                </button>
                {expandedSections.options && (
                  <div className="p-4 space-y-2 border-t">
                    {Object.entries(selectedAttributes).map(([key, value]) => {
                      if (!value) return null;
                      const attrOptions = attributes[key];
                      let displayValue = value;
                      let price = null;
                      if (attrOptions && Array.isArray(attrOptions)) {
                        const opt = attrOptions.find(o => String(o.id || o.value || o.quantity) === String(value));
                        if (opt) {
                          displayValue = opt.name || opt.quantity || value;
                          price = opt.price;
                        }
                      }
                      return (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600">{formatLabel(key)}: {displayValue}</span>
                          <span className="text-gray-500">{price ? `₹${parseFloat(price).toFixed(2)}` : 'Included'}</span>
                        </div>
                      );
                    })}
                    {Object.entries(selectedFinishing).map(([key, value]) => {
                      if (!value) return null;
                      const finishOptions = finishingOptions[key];
                      let displayValue = value;
                      let price = null;
                      if (finishOptions && Array.isArray(finishOptions)) {
                        const opt = finishOptions.find(o => String(o.id || o.value || o.name) === String(value));
                        if (opt) {
                          displayValue = opt.name || value;
                          price = opt.price;
                        }
                      }
                      return (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600">{formatLabel(key)}: {displayValue}</span>
                          <span className="text-gray-500">{price && parseFloat(price) > 0 ? `₹${parseFloat(price).toFixed(2)}` : 'Included'}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Design Confirmation */}
              <div className="space-y-3 mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reviewConfirmed}
                    onChange={(e) => setReviewConfirmed(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-gray-700">
                    I have reviewed my design and confirm it is correct for printing.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-gray-700">
                    I accept the <a href="/terms" className="text-cyan-600 underline">Terms & Conditions</a> and understand that once submitted, the design cannot be modified.
                  </span>
                </label>
              </div>

              {/* Single side warning */}
              {!hasBothDesigns && hasAnyDesign && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <IoWarning className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-medium text-yellow-800 text-sm">Single-side printing</p>
                      <p className="text-xs text-yellow-600 mt-1">
                        {customDesigns.front?.hasContent ? "Back" : "Front"} side will be printed blank.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart || isSubmitting}
                className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
                  canAddToCart
                    ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <IoCartOutline size={22} />
                    Add to Cart
                  </>
                )}
              </button>

              {/* Success Message */}
              {success && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-center">
                  <IoCheckmarkCircle className="inline mr-2" size={20} />
                  {success}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
                  {error}
                </div>
              )}

              {/* Help link */}
              <button className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2">
                <IoHelpCircleOutline size={18} />
                <span className="text-sm">Need help?</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  // Render Step 4: Template Browser
  const renderStep4 = () => (
    <TemplateBrowser />
  );

  // Main render
  if (showDesignStudio && currentStep === 2) {
    return renderStep2();
  }

  // Template Browser (Step 4)
  if (currentStep === 4) {
    return renderStep4();
  }

  return (
    <>
      {/* Step Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => goToStep(step.id)}
                  disabled={
                    (step.id === 2 && !canProceedToStep2) ||
                    (step.id === 3 && !canProceedToStep3)
                  }
                  className={`flex items-center gap-2 ${
                    currentStep === step.id
                      ? "text-cyan-600"
                      : currentStep > step.id
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep === step.id
                      ? "bg-cyan-500 text-white"
                      : currentStep > step.id
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}>
                    {currentStep > step.id ? <IoCheckmarkCircle size={18} /> : step.id}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="font-medium text-sm">{step.name}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 3 && renderStep3()}
    </>
  );
};

export default ProductConfigurationFlow;
