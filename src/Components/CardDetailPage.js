import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaRegHeart, FaHeart, FaStar, FaStarHalfAlt, FaRegStar, FaTruck, FaUpload } from "react-icons/fa";
import { IoCheckmarkCircle, IoClose, IoChevronBack, IoChevronForward, IoHomeOutline, IoChevronForward as IoChevronRight } from "react-icons/io5";
import { Link } from "react-router-dom";
import api from "../api/api";
import { useFavorites } from "../context/FavoritesContext";
import RelatedProducts from "./RelatedProducts";
import CrossProducts from "./CrossProducts";
import ProductOptionsPanel from "./ProductOptionsPanel";
import CanvasDesignStudio from "./CanvasDesign";
import ImageZoom from "./ImageZoom";
import DesignOptionsModal from "./DesignOptionsModal";

/**
 * Get corner radius in pixels based on shape attribute selection
 * @param {Object} selectedAttributes - Currently selected product attributes
 * @returns {number} Corner radius in pixels (0 = sharp corners, 12 = rounded)
 */
const getCornerRadiusFromShape = (selectedAttributes) => {
  // Check for shape-related attributes (could be 'shape', 'corner_style', 'corners', etc.)
  const shapeValue = selectedAttributes?.shape || 
                     selectedAttributes?.corner_style || 
                     selectedAttributes?.corners ||
                     selectedAttributes?.card_shape || '';
  
  // Normalize to lowercase for comparison
  const shape = String(shapeValue).toLowerCase();
  
  // Return corner radius based on shape selection
  if (shape.includes('round') || shape.includes('curved')) {
    return 12; // Rounded corners in pixels
  }
  
  // Default to sharp corners (rectangle, standard, etc.)
  return 0;
};

const CardDetailPage = () => {
  // New URL structure: /category/:slug/:productSlug OR /products/:slug
  // slug = category slug (e.g., "bookmarks", "cards")
  // productSlug = product slug (e.g., "premium-bookmark-set")
  const { slug, productSlug } = useParams();
  const location = useLocation();

  // Determine the actual product slug and category slug based on route
  // If productSlug exists, we're on /category/:slug/:productSlug route
  // If only slug exists, we're on /products/:slug route (generic product detail)
  const actualProductSlug = productSlug || slug;
  const categorySlug = productSlug ? slug : null;
  const navigate = useNavigate();
  const { isFavorite: isFavoritedGlobal, toggleFavorite: toggleFavoriteGlobal } = useFavorites();

  // Check if editing from cart
  const editDesignId = location.state?.editDesignId || null;
  const cartItemId = location.state?.cartItemId || null;
  
  // Check if editing options from cart
  const editOptionsMode = location.state?.editOptionsMode || false;
  const editOptionsCartItemId = location.state?.cartItemId || null;
  const initialAttributes = location.state?.currentAttributes || null;

  // Product State
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState(null);

  // Image State
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [allImages, setAllImages] = useState([]);
  const [cart, setCart] = useState([]);

  // Product Configuration State
  const [attributes, setAttributes] = useState({});
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [customDesigns, setCustomDesigns] = useState({ front: null, back: null });
  
  // Design editing state (loaded from server when editing from cart)
  const [loadedDesignState, setLoadedDesignState] = useState({
    frontCanvasState: null,
    backCanvasState: null,
    frontImageUrl: null,
    backImageUrl: null,
  });
  // Start with loading=true if we have an editDesignId to prevent blank screen flash
  const [loadingDesignState, setLoadingDesignState] = useState(!!location.state?.editDesignId);

  // UI Flow State
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
  const [showDesignOptionsModal, setShowDesignOptionsModal] = useState(false);
  const [optionsCompleted, setOptionsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDesignStudio, setShowDesignStudio] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false); // Track navigation to hide overlay immediately
  const [isUpdatingOptions, setIsUpdatingOptions] = useState(false); // Track cart options update

  // Fetch Product
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError("");

      try {
        // Build API request with category if available
        const apiUrl = categorySlug
          ? `/api/products/${actualProductSlug}?category=${categorySlug}`
          : `/api/products/${actualProductSlug}`;
        const response = await api.get(apiUrl);

        if (response.data?.success && response.data?.data) {
          const productData = response.data.data;
          setProduct(productData);

          const images = [];
          if (productData.featured_image_url) {
            images.push({
              id: "featured",
              url: productData.featured_image_url,
              alt: productData.name + " - Featured Image",
              is_primary: true,
            });
          }
          if (productData.images && productData.images.length > 0) {
            productData.images.forEach((img, index) => {
              if (img.is_primary && productData.featured_image_url) return;
              images.push({
                id: img.id || `gallery-${index}`,
                url: img.image_url,
                alt: img.alt_text || productData.name,
                is_primary: img.is_primary || false,
                sort_order: img.sort_order || index,
              });
            });
          }
          if (images.length === 0) {
            images.push({
              id: "placeholder",
              url: `https://via.placeholder.com/500x500/f3f4f6/9ca3af?text=${encodeURIComponent(productData.name)}`,
              alt: productData.name + " - No Image Available",
              is_primary: true,
            });
          }
          images.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          setAllImages(images);

          if (productData.attributes && typeof productData.attributes === "object") {
            setAttributes(productData.attributes);

            // Start with mandatory orientation default
            const defaults = {
              orientation: "horizontal" // Mandatory default - card orientation
            };

            // Add defaults from database attributes
            Object.entries(productData.attributes).forEach(([key, value]) => {
              // Skip orientation-related keys from DB (we handle it separately)
              const normalizedKey = key.toLowerCase().replace(/[_\s]/g, "");
              if (normalizedKey === "orientation" || normalizedKey === "productorientation") {
                return;
              }

              if (Array.isArray(value) && value.length > 0) {
                const firstOption = value[0];
                // Handle various attribute option formats
                defaults[key] = firstOption.id || firstOption.value || firstOption.name || firstOption.quantity || firstOption;
              }
            });
            setSelectedAttributes(defaults);
          } else {
            // Even if no attributes, set default orientation
            setSelectedAttributes({ orientation: "horizontal" });
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
  }, [actualProductSlug, categorySlug]);

  // Load cart and check user
  useEffect(() => {
    const savedCart = localStorage.getItem("ecommerce_cart");
    if (savedCart) setCart(JSON.parse(savedCart));

    const checkUser = async () => {
      try {
        await api.get("/sanctum/csrf-cookie");
        const userRes = await api.get("/api/user");
        setUser(userRes.data?.user ?? userRes.data?.data ?? null);
      } catch {
        setUser(null);
      }
    };
    checkUser();
  }, []);

  // Load design state when editing from cart
  useEffect(() => {
    if (!editDesignId) {
      // No design to edit - ensure loading state is false
      setLoadingDesignState(false);
      return;
    }

    const loadDesignState = async () => {
      setLoadingDesignState(true);
      try {
        await api.get("/sanctum/csrf-cookie");
        const response = await api.get(`/api/designs/${editDesignId}/edit`);
        
        console.log("Design edit response:", response.data);
        
        if (response.data?.success) {
          const { front_canvas_state, back_canvas_state, front_image_url, back_image_url } = response.data.data;
          
          console.log("Loaded design state:", {
            front_canvas_state,
            back_canvas_state,
            front_image_url,
            back_image_url,
          });
          
          setLoadedDesignState({
            frontCanvasState: front_canvas_state,
            backCanvasState: back_canvas_state,
            frontImageUrl: front_image_url,
            backImageUrl: back_image_url,
          });
          
          // Don't open design studio here - wait for product to load first
        }
      } catch (err) {
        console.error("Failed to load design state:", err);
      } finally {
        setLoadingDesignState(false);
      }
    };

    loadDesignState();
  }, [editDesignId]);

  const isFavorite = product ? isFavoritedGlobal(product.id) : false;
  // Check if both designs have content (from Fabric.js canvas)
  const hasAllDesigns = customDesigns.front?.hasContent && customDesigns.back?.hasContent;
  const canOrder = hasAllDesigns;

  // Check if product has enhancement or lamination options
  const hasFinishingOptions = () => {
    if (!attributes) return false;
    return (
      (attributes.enhancement && Array.isArray(attributes.enhancement) && attributes.enhancement.length > 0) ||
      (attributes.lamination && Array.isArray(attributes.lamination) && attributes.lamination.length > 0)
    );
  };

  // Navigate to Finalize page with product data
  const navigateToFinalize = () => {
    const selectedPrice = getSelectedPrice();
    navigate('/finalize', {
      state: {
        product,
        selectedAttributes,
        customDesigns,
        selectedPrice
      }
    });
  };

  // Handle Add to Cart with FormData
  const handleAddToCart = async () => {
    if (!product || !canOrder) return;

    // If product has finishing options, go to finalize page first
    if (hasFinishingOptions()) {
      navigateToFinalize();
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedPrice = getSelectedPrice();
      await api.get("/sanctum/csrf-cookie");

      // First, add to cart without files
      const cartPayload = {
        product_id: product.id,
        quantity: selectedPrice.quantity,
        selected_attributes: selectedAttributes,
      };

      const response = await api.post("/api/cart/add", cartPayload);

      if (response.data?.success) {
        const cartId = response.data.data?.id;

        // If we have designs and cart ID, upload them
        if (cartId && (customDesigns.front || customDesigns.back)) {
          const formData = new FormData();
          if (customDesigns.front?.file) {
            formData.append("front_design", customDesigns.front.file);
          }
          if (customDesigns.back?.file) {
            formData.append("back_design", customDesigns.back.file);
          }

          await api.post(`/api/cart/${cartId}/upload-designs`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        }

        setSuccess("Product added to cart successfully!");
        setTimeout(() => setSuccess(""), 3000);

        // Update local cart
        const cartItem = {
          id: product.id,
          slug: product.slug,
          name: product.name,
          category: product.category?.name,
          price: selectedPrice.total,
          unitPrice: selectedPrice.unit,
          quantity: selectedPrice.quantity,
          selectedAttributes: selectedAttributes,
          hasCustomDesigns: hasAllDesigns,
          image: allImages[0]?.url,
          addedAt: new Date().toISOString(),
        };

        const newCart = [...cart, cartItem];
        setCart(newCart);
        localStorage.setItem("ecommerce_cart", JSON.stringify(newCart));
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || "Failed to add to cart. Please try again.";
      setError(errorMsg);
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      navigate("/login", {
        state: {
          from: window.location.pathname,
          message: "Please login to add products to favorites"
        }
      });
      return;
    }

    if (!product) return;

    const result = await toggleFavoriteGlobal(product.id);
    if (result.success) {
      setSuccess(result.message);
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(result.message || "Failed to update favorites");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleAttributeChange = (attributeName, value) => {
    setSelectedAttributes((prev) => ({ ...prev, [attributeName]: value }));
  };

  const formatLabel = (name) => name.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  const getSelectedPrice = () => {
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

      return { total: basePrice, unit: unitPrice, quantity: parseInt(tier.quantity || 1) };
    }

    return {
      total: parseFloat(product?.price || 0),
      unit: parseFloat(product?.price || 0),
      quantity: 1,
    };
  };

  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    for (let i = 0; i < fullStars; i++) stars.push(<FaStar key={i} className="text-yellow-400" />);
    if (hasHalfStar) stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++)
      stars.push(<FaRegStar key={`empty-${i}`} className="text-gray-300" />);
    return stars;
  };

  const previousImage = () =>
    setSelectedImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  const nextImage = () =>
    setSelectedImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));

  const handleImageError = (e) => {
    e.target.src = `https://via.placeholder.com/500x500/f3f4f6/9ca3af?text=${encodeURIComponent(
      product?.name || "Product"
    )}`;
  };

  const handleOptionsProceed = () => {
    setShowOptionsPanel(false);
    setOptionsCompleted(true);
  };

  // Handle edit options mode - update cart item with new options
  const handleUpdateCartOptions = async () => {
    if (!editOptionsCartItemId) return;
    
    setIsUpdatingOptions(true);
    try {
      await api.get("/sanctum/csrf-cookie");
      
      const selectedPrice = getSelectedPrice();
      const updatePayload = {
        quantity: selectedPrice.quantity,
        selected_attributes: selectedAttributes,
      };
      
      console.log("Updating cart item options:", { cartItemId: editOptionsCartItemId, ...updatePayload });
      
      const response = await api.put(`/api/cart/update/${editOptionsCartItemId}`, updatePayload);
      
      if (response.data?.success) {
        setSuccess("Options updated successfully!");
        // Navigate back to cart after short delay
        setTimeout(() => {
          navigate("/cart", { replace: true });
        }, 800);
      } else {
        setError("Failed to update options. Please try again.");
      }
    } catch (err) {
      console.error("Failed to update cart options:", err);
      setError(err?.response?.data?.message || "Failed to update options. Please try again.");
    } finally {
      setIsUpdatingOptions(false);
    }
  };

  // Effect to handle editOptionsMode - pre-populate attributes and show panel
  useEffect(() => {
    if (editOptionsMode && initialAttributes && !loading && product) {
      // Parse initial attributes if they're a string
      let parsedAttributes = initialAttributes;
      if (typeof initialAttributes === 'string') {
        try {
          parsedAttributes = JSON.parse(initialAttributes);
        } catch (e) {
          console.error("Failed to parse initial attributes:", e);
          parsedAttributes = {};
        }
      }
      
      // Merge initial attributes with defaults
      setSelectedAttributes(prev => ({
        ...prev,
        ...parsedAttributes,
      }));
      
      // Show options panel immediately
      setShowOptionsPanel(true);
      setOptionsCompleted(false);
    }
  }, [editOptionsMode, initialAttributes, loading, product]);

  // When editing from cart, render ONLY the design studio (skip CardDetailPage UI entirely)
  if (editDesignId) {
    // Show loading while product or design is loading
    if (loading || loadingDesignState || !product) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-500 mx-auto mb-6"></div>
            <p className="text-white text-lg font-medium">Loading your design...</p>
            <p className="text-gray-400 text-sm mt-2">Please wait while we restore your work</p>
          </div>
        </div>
      );
    }

    // If navigating away, show a brief transition screen to ensure clean unmount
    if (isNavigating) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    // Once everything is loaded, render CanvasDesignStudio directly (full screen)
    return (
      <div className="fixed inset-0 z-50 bg-gray-900">
        <CanvasDesignStudio
          key={editDesignId}
          onDesignsChange={setCustomDesigns}
          frontDesign={customDesigns.front}
          backDesign={customDesigns.back}
          productName={product.name}
          productId={product.id}
          designId={editDesignId}
          orientation={selectedAttributes.orientation || "horizontal"}
          cornerRadius={getCornerRadiusFromShape(selectedAttributes)}
          printDimensions={{
            print_length_inches: product.print_length_inches,
            print_width_inches: product.print_width_inches,
          }}
          initialFrontState={loadedDesignState.frontCanvasState}
          initialBackState={loadedDesignState.backCanvasState}
          initialFrontImage={loadedDesignState.frontImageUrl}
          initialBackImage={loadedDesignState.backImageUrl}
          isEditMode={true}
          onSave={(designs) => {
            setCustomDesigns(designs);
          }}
          onClose={() => {
            // When closing from edit mode, go back to cart
            setIsNavigating(true);
            // Use setTimeout to ensure state update triggers re-render before navigation
            setTimeout(() => {
              navigate("/cart", { replace: true });
            }, 0);
          }}
          onNext={async (designs) => {
            console.log("CardDetailPage onNext called with designs:", designs);
            setCustomDesigns(designs);
            
            // Build the state to pass to review page
            const reviewState = {
              designData: designs,
              cartItemId: cartItemId,
              editDesignId: editDesignId,
              productName: product.name,
              selectedAttributes: selectedAttributes,
            };
            
            console.log("Navigating to /review-design with state:", reviewState);
            
            // Set navigating state to trigger clean unmount
            setIsNavigating(true);
            
            // Navigate to Review Design Page for edit mode
            // Use replace: true to properly replace the route
            // Use setTimeout to ensure state update triggers re-render before navigation
            setTimeout(() => {
              navigate("/review-design", { state: reviewState, replace: true });
            }, 0);
          }}
          className="h-full"
        />
        {/* Close button overlay - navigates back to cart */}
        <button
          onClick={() => {
            setIsNavigating(true);
            setTimeout(() => {
              navigate("/cart", { replace: true });
            }, 0);
          }}
          className="absolute top-4 right-4 z-[60] p-2.5 bg-white hover:bg-gray-100 rounded-full shadow-lg transition"
          title="Back to Cart"
        >
          <IoClose size={24} className="text-gray-700" />
        </button>
        
        {/* Success message overlay */}
        {success && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <IoCheckmarkCircle size={20} />
            <span>{success}</span>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Oops!</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <IoChevronBack className="inline mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const selectedPrice = getSelectedPrice();

  return (
    <div className="min-h-screen bg-white">
      {/* Success/Error Messages */}
      {(success || error) && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className={`${success ? "bg-green-500" : "bg-red-500"} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2`}>
            <IoCheckmarkCircle size={20} />
            <span>{success || error}</span>
            <button onClick={() => { setSuccess(""); setError(""); }} className="ml-2">
              <IoClose size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="flex items-center gap-1 text-blue-600 hover:underline">
              <IoHomeOutline size={16} />
              <span>Home</span>
            </Link>
            {product.category && (
              <>
                <IoChevronRight size={14} className="text-gray-400" />
                <Link to={`/category/${product.category.slug}`} className="text-blue-600 hover:underline">
                  {product.category.name}
                </Link>
              </>
            )}
            <IoChevronRight size={14} className="text-gray-400" />
            <span className="text-gray-600">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Left Column - Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
              {/* Main Image with Lens Zoom */}
              <ImageZoom
                src={allImages[selectedImageIndex]?.url}
                alt={allImages[selectedImageIndex]?.alt || product.name}
                className="w-full h-full"
                zoomLevel={4}
                lensSize={150}
                onError={handleImageError}
              />
              {allImages.length > 1 && (
                <>
                  <button onClick={previousImage} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition z-20">
                    <IoChevronBack size={20} />
                  </button>
                  <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition z-20">
                    <IoChevronForward size={20} />
                  </button>
                </>
              )}
              <button onClick={toggleFavorite} className="absolute top-4 right-4 p-2.5 bg-white rounded-full shadow-md hover:shadow-lg transition z-20">
                {isFavorite ? <FaHeart className="text-red-500" size={20} /> : <FaRegHeart className="text-gray-400" size={20} />}
              </button>
            </div>

            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {allImages.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                      selectedImageIndex === index ? "border-gray-900" : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <img src={image.url} alt={image.alt} className="w-full h-full object-cover" onError={handleImageError} />
                  </button>
                ))}
              </div>
            )}

            {/* Product Specifications */}
            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Weight</p>
                  <p className="text-sm text-gray-600">{product.weight || "0.10"} kg</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Dimensions</p>
                  <p className="text-sm text-gray-600">{product.dimensions || "3.5x2"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Product Info & Options */}
          <div className="space-y-6">
            {/* Product Title & Rating */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

              {product.rating > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-0.5">{renderStarRating(parseFloat(product.rating))}</div>
                  <span className="text-sm text-gray-600">{parseFloat(product.rating).toFixed(1)}</span>
                  <span className="text-sm text-blue-600 hover:underline cursor-pointer">({product.reviews_count || 0})</span>
                </div>
              )}

              {/* Tag Line / Short Description */}
              <p className="text-gray-700 mb-4">
                {product.tag_line || product.short_description || "Premium quality product with professional finish."}
              </p>

              {/* Feature Bullets */}
              {product.description && (
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  {product.description.split('.').slice(0, 4).filter(s => s.trim()).map((sentence, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <span>{sentence.trim()}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* See Details Link */}
              <button
                onClick={() => document.getElementById('product-details')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                See Details
              </button>
            </div>

            {/* Divider */}
            <hr className="border-gray-200" />

            {/* Price Section */}
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold text-gray-900">₹{selectedPrice.total.toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-500">
                ₹{selectedPrice.unit.toFixed(2)} each / {selectedPrice.quantity} units
              </p>

              {/* Delivery Info */}
              <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                <FaTruck className="text-gray-400" />
                <span>Free delivery on orders above ₹500</span>
              </div>
            </div>

            {/* Product Options */}
            {attributes && Object.keys(attributes).length > 0 && (
              <div className="space-y-4">
                {Object.entries(attributes).map(([attrName, options]) => {
                  if (!Array.isArray(options) || options.length === 0) return null;

                  // Handle quantity/pricing tiers separately
                  if (attrName === 'quantity' || attrName === 'pricing_tiers') {
                    return (
                      <div key={attrName}>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Quantity</label>
                        <select
                          value={selectedAttributes[attrName] || ''}
                          onChange={(e) => handleAttributeChange(attrName, e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                          {options.map((opt, idx) => (
                            <option key={idx} value={opt.quantity || opt.id || opt.value}>
                              {opt.quantity} (₹{parseFloat(opt.unitPrice || opt.price / opt.quantity || opt.price).toFixed(2)} / unit)
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  // Skip orientation as it's handled in the design studio
                  if (attrName.toLowerCase() === 'orientation') return null;

                  return (
                    <div key={attrName}>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">{formatLabel(attrName)}</label>
                      <select
                        value={selectedAttributes[attrName] || ''}
                        onChange={(e) => handleAttributeChange(attrName, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">Select...</option>
                        {options.map((opt, idx) => (
                          <option key={idx} value={opt.id || opt.value || opt.name || opt}>
                            {opt.name || opt.label || opt.value || opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              {/* Browse Designs Button - Primary */}
              <button
                onClick={() => {
                  const templatesPath = categorySlug
                    ? `/category/${categorySlug}/${actualProductSlug}/templates`
                    : `/products/${actualProductSlug}/templates`;

                  navigate(templatesPath, {
                    state: {
                      product,
                      selectedAttributes,
                    }
                  });
                }}
                className="w-full py-4 px-6 bg-cyan-400 hover:bg-cyan-500 text-gray-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>Browse designs</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Upload Design Button - Secondary */}
              <button
                onClick={() => {
                  // Always show modal to select orientation, shape, quantity before design studio
                  // This ensures canvas knows what shape to render (Vistaprint flow)
                  setShowDesignOptionsModal(true);
                }}
                className="w-full py-4 px-6 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>Upload design</span>
                <FaUpload className="w-4 h-4" />
              </button>

              {/* Design Status */}
              {(customDesigns.front?.hasContent || customDesigns.back?.hasContent) && (
                <div className="flex justify-center gap-4 pt-2">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    customDesigns.front?.hasContent ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${customDesigns.front?.hasContent ? "bg-green-500" : "bg-gray-400"}`} />
                    Front
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    customDesigns.back?.hasContent ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${customDesigns.back?.hasContent ? "bg-green-500" : "bg-gray-400"}`} />
                    Back
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        <div id="product-details" className="mt-12 pt-8 border-t">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Product Details</h2>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 leading-relaxed">{product.description || "No description available."}</p>
          </div>

          {/* Print Dimensions (for Canvas Design) */}
          {(product.print_length_inches || product.print_width_inches) && (
            <div className="mt-6 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center text-2xl shadow-sm">
                  🖨️
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Print Dimensions (inches)</h3>
                  <p className="text-xs text-gray-600 mb-3">Used for canvas design area</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg px-4 py-3 border border-yellow-200">
                      <span className="text-xs text-gray-600 block mb-1">Length (Width)</span>
                      <p className="font-semibold text-gray-900">{product.print_length_inches}"</p>
                    </div>
                    <div className="bg-white rounded-lg px-4 py-3 border border-yellow-200">
                      <span className="text-xs text-gray-600 block mb-1">Height</span>
                      <p className="font-semibold text-gray-900">{product.print_width_inches}"</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Standard business card: 3.5 × 2 inches | Bleed of 0.125" will be added automatically
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      <RelatedProducts
        productSlug={actualProductSlug}
        category={categorySlug}
        limit={8}
        title="Related Products"
        showViewAll={true}
      />

      {/* More Products to Explore */}
      {product && (
        <CrossProducts
          currentProductId={product.id}
          currentCategorySlug={categorySlug}
          limit={8}
          title="You May Also Like"
          subtitle="Discover more products from our collection"
        />
      )}

      {/* Product Options Panel (Sidebar) */}
      <ProductOptionsPanel
        isOpen={showOptionsPanel}
        onClose={() => {
          setShowOptionsPanel(false);
          // If in edit options mode and closing, go back to cart
          if (editOptionsMode) {
            navigate("/cart", { replace: true });
          }
        }}
        product={product}
        attributes={attributes}
        selectedAttributes={selectedAttributes}
        onAttributeChange={handleAttributeChange}
        onProceed={editOptionsMode ? handleUpdateCartOptions : handleOptionsProceed}
        selectedPrice={selectedPrice}
        isEditMode={editOptionsMode}
        isUpdating={isUpdatingOptions}
      />

      {/* Full-screen Design Studio Modal - For NEW designs only (edit flow is handled above) */}
      {showDesignStudio && !editDesignId && (
        <div className="fixed inset-0 z-50">
          <CanvasDesignStudio
            key="new-design"
            onDesignsChange={setCustomDesigns}
            frontDesign={customDesigns.front}
            backDesign={customDesigns.back}
            productName={product.name}
            productId={product.id}
            orientation={selectedAttributes.orientation || "horizontal"}
            cornerRadius={getCornerRadiusFromShape(selectedAttributes)}
            printDimensions={{
              print_length_inches: product.print_length_inches,
              print_width_inches: product.print_width_inches,
            }}
            onSave={(designs) => {
              setCustomDesigns(designs);
            }}
            onClose={() => {
              setShowDesignStudio(false);
            }}
            onNext={async (designs) => {
              setCustomDesigns(designs);
              setShowDesignStudio(false);
              // New design - scroll to confirmation section
              setTimeout(() => {
                window.scrollTo({
                  top: document.body.scrollHeight,
                  behavior: "smooth"
                });
              }, 100);
            }}
            className="h-full"
          />
          {/* Close button overlay */}
          <button
            onClick={() => setShowDesignStudio(false)}
            className="absolute top-4 right-4 z-[60] p-2.5 bg-white hover:bg-gray-100 rounded-full shadow-lg transition"
            title="Close Studio"
          >
            <IoClose size={24} className="text-gray-700" />
          </button>
        </div>
      )}

      {/* Design Options Modal */}
      <DesignOptionsModal
        isOpen={showDesignOptionsModal}
        onClose={() => setShowDesignOptionsModal(false)}
        product={product}
        attributes={attributes}
        selectedAttributes={selectedAttributes}
        onProceed={(updatedAttributes) => {
          // Update selected attributes
          setSelectedAttributes(updatedAttributes);

          // Close modal
          setShowDesignOptionsModal(false);

          // Navigate to design studio with selected attributes in state
          const configPath = categorySlug
            ? `/category/${categorySlug}/${actualProductSlug}/configure`
            : `/products/${actualProductSlug}/configure`;
          navigate(configPath, {
            state: {
              selectedAttributes: updatedAttributes,
              product: product,
            }
          });
        }}
      />
    </div>
  );
};

export default CardDetailPage;
