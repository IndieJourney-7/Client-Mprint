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
  const [templateData, setTemplateData] = useState(location.state?.templateData || null); // Template data when coming from TemplatePreview

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

  // Track if we're in edit mode from cart
  const [isEditFromCart, setIsEditFromCart] = useState(false);
  const [editModeInitialized, setEditModeInitialized] = useState(false);

  // Check if editing from cart (restore saved design and orientation)
  // IMPORTANT: We set the designId here but DON'T open the design studio yet
  // The design studio will open AFTER the design data is fetched (see useEffect below)
  useEffect(() => {
    if (location.state?.editDesignId && product && !editModeInitialized) {
      console.log('[ProductConfigurationFlow] Edit from Cart detected, setting designId:', location.state.editDesignId);

      // Clear any previous editing data when starting a new edit
      setEditingDesignData(null);
      setShowDesignStudio(false);

      // Set the design ID for fetching
      setDesignId(location.state.editDesignId);
      setIsEditFromCart(true);
      setEditModeInitialized(true);

      // Restore saved attributes (orientation, quantity, etc.) from cart
      if (location.state.selectedAttributes) {
        setSelectedAttributes({
          ...location.state.selectedAttributes
        });
      }
      // NOTE: We don't open the design studio here anymore
      // It will open after fetchDesignData completes (see editingDesignData useEffect)
    }
  }, [location.state, product, editModeInitialized]);

  // Handle coming from TemplatePreview with showDesignStudio flag
  useEffect(() => {
    if (location.state?.showDesignStudio && location.state?.templateData && product && !designId) {
      console.log('[ProductConfigurationFlow] Coming from TemplatePreview with template data:', location.state.templateData);

      // Restore selected attributes if passed
      if (location.state.selectedAttributes) {
        setSelectedAttributes(prev => ({
          ...prev,
          ...location.state.selectedAttributes
        }));
      }

      // Set template data
      setTemplateData(location.state.templateData);

      // CRITICAL: Create design on server BEFORE entering design studio
      // This ensures we have a design_id that can be linked to the cart later
      const initDesignAndOpenStudio = async () => {
        console.log('[ProductConfigurationFlow] Creating design before opening studio (from TemplatePreview)');
        const createdDesignId = await createDesignOnServer(
          'customized',
          location.state.templateData.template?.id,
          location.state.templateData.colorVariant?.id
        );
        if (createdDesignId) {
          console.log('[ProductConfigurationFlow] Design created:', createdDesignId, '- opening design studio');
          setCurrentStep(2);
          setShowDesignStudio(true);
        } else {
          console.error('[ProductConfigurationFlow] Failed to create design');
        }
      };

      setTimeout(initDesignAndOpenStudio, 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, product]);

  // Fetch design data when editing existing design
  // This effect is triggered when isEditFromCart is true and designId is set
  useEffect(() => {
    const fetchDesignData = async () => {
      // Only fetch if we're in edit mode from cart and have a designId
      if (!isEditFromCart || !designId) {
        console.log('[ProductConfigurationFlow] Skipping fetch - not in edit mode or no designId', { isEditFromCart, designId });
        return;
      }

      // Skip if we already have the data for this design
      if (editingDesignData && !loadingDesignData) {
        console.log('[ProductConfigurationFlow] Design data already loaded');
        return;
      }

      setLoadingDesignData(true);
      console.log('[ProductConfigurationFlow] Fetching design data for editing:', designId);

      try {
        const response = await api.get(`/api/designs/${designId}/edit`);

        if (response.data?.success) {
          const data = response.data.data;
          console.log('[ProductConfigurationFlow] 🔵 Design data fetched from API:', {
            hasFrontImage: !!data.front_image_url,
            hasBackImage: !!data.back_image_url,
            // CRITICAL: Text layer debugging
            frontTextLayersCount: data.front_text_layers?.length || 0,
            backTextLayersCount: data.back_text_layers?.length || 0,
            frontTextLayersType: typeof data.front_text_layers,
            backTextLayersType: typeof data.back_text_layers,
            frontTextLayersIsArray: Array.isArray(data.front_text_layers),
            backTextLayersIsArray: Array.isArray(data.back_text_layers),
            // Log actual text layer data for debugging
            frontTextLayers: data.front_text_layers,
            backTextLayers: data.back_text_layers,
            hasTemplateData: !!data.template_data,
            templateDataKeys: data.template_data ? Object.keys(data.template_data) : [],
            orientation: data.orientation,
            selectedShape: data.selected_shape,
            designType: data.design_type,
          });

          // Store complete editing data including template info
          const editData = {
            frontCanvasState: data.front_canvas_state,
            backCanvasState: data.back_canvas_state,
            frontImageUrl: data.front_image_url,
            backImageUrl: data.back_image_url,
            // Text layers for restoring text when editing from cart
            frontTextLayers: data.front_text_layers || [],
            backTextLayers: data.back_text_layers || [],
            // Template data for restoring template-based designs
            templateData: data.template_data || null,
            // Design metadata
            designType: data.design_type,
            orientation: data.orientation,
            selectedShape: data.selected_shape,
          };

          // If design has template data, set it for CanvasDesignStudio
          if (data.template_data) {
            console.log('[ProductConfigurationFlow] Restoring template data:', data.template_data);
            setTemplateData(data.template_data);
          }

          // Restore orientation and shape from saved design
          if (data.orientation || data.selected_shape) {
            setSelectedAttributes(prev => ({
              ...prev,
              orientation: data.orientation || prev.orientation,
              shape: data.selected_shape || prev.shape,
            }));
          }

          // Set editing data LAST after all other state is updated
          setEditingDesignData(editData);
          console.log('[ProductConfigurationFlow] editingDesignData set:', editData);
        } else {
          console.error('[ProductConfigurationFlow] Failed to fetch design data - API returned failure');
        }
      } catch (error) {
        console.error('[ProductConfigurationFlow] Error fetching design data:', error);
      } finally {
        setLoadingDesignData(false);
      }
    };

    fetchDesignData();
  }, [isEditFromCart, designId, editingDesignData, loadingDesignData]);

  // Open design studio AFTER design data has been fetched (for Edit from Cart flow)
  // This ensures the canvas is hydrated with the saved design data
  // CRITICAL: Only open after editingDesignData is fully populated
  useEffect(() => {
    if (isEditFromCart && editingDesignData && !showDesignStudio && !loadingDesignData) {
      console.log('[ProductConfigurationFlow] ✅ Design data loaded, NOW opening design studio with:', {
        frontImageUrl: editingDesignData.frontImageUrl ? editingDesignData.frontImageUrl.substring(0, 50) + '...' : 'null',
        backImageUrl: editingDesignData.backImageUrl ? editingDesignData.backImageUrl.substring(0, 50) + '...' : 'null',
        frontTextLayersCount: editingDesignData.frontTextLayers?.length || 0,
        backTextLayersCount: editingDesignData.backTextLayers?.length || 0,
        hasTemplateData: !!editingDesignData.templateData,
        frontCanvasState: editingDesignData.frontCanvasState ? 'present' : 'null',
        backCanvasState: editingDesignData.backCanvasState ? 'present' : 'null',
      });

      // Small delay to ensure all state updates have propagated
      setTimeout(() => {
        setCurrentStep(2);
        setShowDesignStudio(true);
      }, 50);
    }
  }, [isEditFromCart, editingDesignData, showDesignStudio, loadingDesignData]);

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
  // designType: 'uploaded' | 'customized' | 'blank'
  const createDesignOnServer = async (designType = 'blank', templateIdParam = null, colorVariantIdParam = null) => {
    if (designId) return designId; // Already created

    setDesignCreating(true);
    try {
      await api.get("/sanctum/csrf-cookie");

      // Determine design type based on template data
      let finalDesignType = designType;
      let finalTemplateId = templateIdParam;
      let finalColorVariantId = colorVariantIdParam;

      // If coming from TemplatePreview with template data, mark as 'customized'
      if (templateData?.template?.id) {
        finalDesignType = 'customized';
        finalTemplateId = templateData.template.id;
        finalColorVariantId = templateData.colorVariant?.id || null;
      }

      const response = await api.post("/api/designs", {
        product_id: product.id,
        orientation: selectedAttributes.orientation || "horizontal",
        name: `${product.name} Design`,
        // Design type fields - distinguishes Browse Design vs Upload Design
        design_type: finalDesignType,
        template_id: finalTemplateId,
        color_variant_id: finalColorVariantId,
      });

      if (response.data?.success && response.data?.data?.id) {
        const newDesignId = response.data.data.id;
        setDesignId(newDesignId);
        console.log('[createDesignOnServer] Design created:', {
          designId: newDesignId,
          designType: finalDesignType,
          templateId: finalTemplateId,
        });
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

      // Finalize design before adding to cart - SEND THE COMPLETE PREVIEW IMAGES WITH TEXT LAYERS
      if (designId) {
        console.log("[handleAddToCart] Finalizing design:", designId);
        console.log("[handleAddToCart] Custom designs state:", {
          hasFront: !!customDesigns.front,
          hasBack: !!customDesigns.back,
          frontHasContent: customDesigns.front?.hasContent,
          backHasContent: customDesigns.back?.hasContent,
          frontPreviewType: customDesigns.front?.preview?.startsWith?.('data:') ? 'data URL' : 'other',
          frontPreviewLength: customDesigns.front?.preview?.length,
          frontPreviewStart: customDesigns.front?.preview?.substring?.(0, 50),
          backPreviewType: customDesigns.back?.preview?.startsWith?.('data:') ? 'data URL' : 'other',
          backPreviewLength: customDesigns.back?.preview?.length,
          backPreviewStart: customDesigns.back?.preview?.substring?.(0, 50),
          frontHasTextLayers: customDesigns.front?.textLayers?.length > 0,
          backHasTextLayers: customDesigns.back?.textLayers?.length > 0,
        });

        // CRITICAL: Send the complete preview images (with text layers rendered) to the backend
        // This ensures the Cart page displays the exact design the user created
        const finalizePayload = {
          front_preview: customDesigns.front?.preview || null,
          back_preview: customDesigns.back?.preview || null,
          front_text_layers: customDesigns.front?.textLayers || [],
          back_text_layers: customDesigns.back?.textLayers || [],
          orientation: customDesigns.orientation || selectedAttributes.orientation,
          shape: customDesigns.shape || selectedAttributes.shape,
        };

        // Validate that we have data URL previews (required for backend to save)
        if (finalizePayload.front_preview && !finalizePayload.front_preview.startsWith('data:')) {
          console.warn("[handleAddToCart] WARNING: front_preview is not a data URL, backend may fail to save it");
        }
        if (finalizePayload.back_preview && !finalizePayload.back_preview.startsWith('data:')) {
          console.warn("[handleAddToCart] WARNING: back_preview is not a data URL, backend may fail to save it");
        }

        console.log("[handleAddToCart] Finalize payload:", {
          frontPreviewExists: !!finalizePayload.front_preview,
          backPreviewExists: !!finalizePayload.back_preview,
          frontIsDataUrl: finalizePayload.front_preview?.startsWith?.('data:'),
          backIsDataUrl: finalizePayload.back_preview?.startsWith?.('data:'),
          frontPreviewLength: finalizePayload.front_preview?.length,
          backPreviewLength: finalizePayload.back_preview?.length,
          // Log text layers being sent to server
          frontTextLayersCount: finalizePayload.front_text_layers?.length || 0,
          backTextLayersCount: finalizePayload.back_text_layers?.length || 0,
          frontTextLayers: finalizePayload.front_text_layers,
          backTextLayers: finalizePayload.back_text_layers,
        });

        const finalizeResponse = await api.post(`/api/designs/${designId}/finalize`, finalizePayload);
        console.log("[handleAddToCart] Finalize response:", finalizeResponse.data);
      } else {
        console.warn("No designId available when adding to cart!");
      }

      const cartPayload = {
        product_id: product.id,
        quantity: selectedPrice.quantity,
        selected_attributes: { ...selectedAttributes, ...selectedFinishing },
        design_id: designId, // Link to saved design
      };

      console.log("[handleAddToCart] CRITICAL - designId value:", designId);
      console.log("[handleAddToCart] Cart payload:", cartPayload);

      if (!designId) {
        console.error("[handleAddToCart] ERROR: designId is null/undefined! This will cause cart to not show the design.");
      }

      // Check if we're editing an existing cart item (coming from Cart's Edit Design)
      const editingCartItemId = location.state?.cartItemId;
      let response;

      if (editingCartItemId) {
        // UPDATE existing cart item (editing from Cart)
        console.log("[handleAddToCart] Updating existing cart item:", editingCartItemId);
        response = await api.put(`/api/cart/update/${editingCartItemId}`, {
          ...cartPayload,
          // Ensure design_id is updated even if attributes match
        });
        if (response.data?.success) {
          setSuccess("Design updated successfully!");
        }
      } else {
        // ADD new cart item (new design flow)
        response = await api.post("/api/cart/add", cartPayload);
        if (response.data?.success) {
          setSuccess("Product added to cart successfully!");
        }
      }

      if (response.data?.success) {
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

  // Loading state - product loading
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

  // Loading state - design data loading (Edit from Cart flow)
  if (isEditFromCart && loadingDesignData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-500 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">Loading your design...</p>
          <p className="text-gray-400 text-sm mt-2">Restoring your previous work</p>
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
              onClick={() => {
                if (canProceedToStep2) {
                  // Navigate to template browser route
                  const templatesPath = categorySlug
                    ? `/category/${categorySlug}/${actualProductSlug}/templates`
                    : `/products/${actualProductSlug}/templates`;

                  navigate(templatesPath, {
                    state: {
                      product,
                      selectedAttributes,
                      designId,
                      sessionId,
                    }
                  });
                }
              }}
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
  const renderStep2 = () => {
    // Debug log the props being passed to CanvasDesignStudio
    console.log('[ProductConfigurationFlow] Rendering CanvasDesignStudio with props:', {
      designId,
      isEditMode: isEditFromCart,
      hasEditingDesignData: !!editingDesignData,
      initialFrontImage: editingDesignData?.frontImageUrl ? 'present' : 'null',
      initialBackImage: editingDesignData?.backImageUrl ? 'present' : 'null',
      initialFrontTextLayers: editingDesignData?.frontTextLayers?.length || 0,
      initialBackTextLayers: editingDesignData?.backTextLayers?.length || 0,
      initialFrontState: editingDesignData?.frontCanvasState ? 'present' : 'null',
      initialBackState: editingDesignData?.backCanvasState ? 'present' : 'null',
      templateData: templateData ? 'present' : 'null',
    });

    return (
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
        // Pass text layers when editing from cart (so text is restored)
        initialFrontTextLayers={editingDesignData?.frontTextLayers}
        initialBackTextLayers={editingDesignData?.backTextLayers}
        isEditMode={isEditFromCart}
        // Pass template data when coming from TemplatePreview
        templateData={templateData}
        onSave={(designs) => {
          // Update custom designs with full preview data including text layers
          setCustomDesigns({
            front: designs.front || customDesigns.front,
            back: designs.back || customDesigns.back,
            orientation: designs.orientation || selectedAttributes.orientation,
            shape: designs.shape || selectedAttributes.shape,
          });
          if (sessionInitialized && sessionId) {
            saveSession({
              front_thumbnail: designs.front?.preview,
              back_thumbnail: designs.back?.preview,
            });
          }
        }}
        onClose={() => {
          setShowDesignStudio(false);
          setCurrentStep(1);
        }}
        onNext={(designs) => {
          // Store complete design data including text layers and metadata
          setCustomDesigns({
            front: designs.front,
            back: designs.back,
            orientation: designs.orientation || selectedAttributes.orientation,
            shape: designs.shape || selectedAttributes.shape,
            cardDimensions: designs.cardDimensions,
          });
          setShowDesignStudio(false);
          setCurrentStep(3);
          if (sessionInitialized && sessionId) {
            saveSession({
              front_thumbnail: designs.front?.preview,
              back_thumbnail: designs.back?.preview,
            });
          }
        }}
      />
    </div>
    );
  };

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

  // Main render
  if (showDesignStudio && currentStep === 2) {
    return renderStep2();
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
