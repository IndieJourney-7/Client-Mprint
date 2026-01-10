import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  IoArrowBack,
  IoCheckmarkCircle,
  IoWarning,
  IoCartOutline,
  IoChevronDown,
  IoChevronUp,
  IoCreateOutline,
} from "react-icons/io5";

/**
 * ReviewDesignPage - Review and confirm design before updating cart
 * 
 * This page is shown when editing a design from cart.
 * User must accept terms before the design update is applied to cart.
 */
const ReviewDesignPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get state passed from CanvasDesignStudio
  const {
    designData,
    cartItemId,
    editDesignId,
    productName,
    selectedAttributes,
  } = location.state || {};

  // Check if we should show success toast (passed from CanvasDesignStudio)
  const showSuccessToast = designData?.showSuccessToast;

  // Debug log on mount
  console.log("ReviewDesignPage mounted with state:", {
    designData,
    cartItemId,
    editDesignId,
    productName,
    selectedAttributes,
    showSuccessToast,
    fullState: location.state
  });

  // Debug preview data specifically
  console.log("ReviewDesignPage PREVIEW CHECK:", {
    hasFrontPreview: !!designData?.front?.preview,
    hasBackPreview: !!designData?.back?.preview,
    frontPreviewLength: designData?.front?.preview?.length || 0,
    backPreviewLength: designData?.back?.preview?.length || 0,
    frontPreviewStart: designData?.front?.preview?.substring(0, 50) || "EMPTY",
    frontHasContent: designData?.front?.hasContent,
    backHasContent: designData?.back?.hasContent,
  });

  // State
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ details: true });
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);

  // Show success toast on mount if flagged
  useEffect(() => {
    if (showSuccessToast) {
      setShowUpdateToast(true);
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setShowUpdateToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

  // Check if we have valid state - if not, show loading briefly then redirect
  useEffect(() => {
    if (!location.state || !designData || !cartItemId) {
      console.log("ReviewDesignPage: Missing required state, redirecting to cart...");
      setIsRedirecting(true);
      // Short delay to show user feedback
      const timer = setTimeout(() => {
        navigate("/cart", { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.state, designData, cartItemId, navigate]);

  const hasFrontDesign = designData?.front?.hasContent;
  const hasBackDesign = designData?.back?.hasContent;
  const hasBothDesigns = hasFrontDesign && hasBackDesign;
  const hasAnyDesign = hasFrontDesign || hasBackDesign;

  const canSubmit = hasAnyDesign && reviewConfirmed && termsAccepted;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Format attribute label
  const formatLabel = (name) => name?.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) || "";

  // Handle update cart - confirm design and go to cart
  const handleUpdateCart = async () => {
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    setError("");
    
    try {
      // The design has already been saved to server from CanvasDesignStudio
      // We just need to confirm and navigate to cart
      
      setSuccess("Design updated successfully!");
      
      // Navigate to cart after short delay
      setTimeout(() => {
        navigate("/cart", { 
          state: { 
            message: "Your design has been updated successfully!",
            updatedItemId: cartItemId 
          } 
        });
      }, 800);
      
    } catch (err) {
      console.error("Failed to update cart:", err);
      setError(err?.response?.data?.message || "Failed to update design. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit design - go back to design studio
  const handleEditDesign = () => {
    navigate(-1); // Go back to design studio
  };

  // Show loading/redirecting state if missing required data
  if (isRedirecting || !designData || !cartItemId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isRedirecting ? "Redirecting to cart..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Toast - Design Updated */}
      {showUpdateToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <IoCheckmarkCircle size={20} />
          <span className="font-medium">Design updated successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/cart")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
            >
              <IoArrowBack size={18} />
              <span>Back to Cart</span>
            </button>
            <h1 className="font-semibold text-gray-900">Review Your Design</h1>
            <div className="w-24" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left: Design Preview */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Design Preview</h2>
            
            {/* Flip Card Preview */}
            <div className="relative aspect-[1.8/1] perspective-1000 mb-4">
              <div
                className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Front Side */}
                <div
                  className="absolute inset-0 w-full h-full backface-hidden rounded-xl overflow-hidden border-2 border-gray-200"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  {hasFrontDesign && designData.front?.preview ? (
                    <img
                      src={designData.front.preview}
                      alt="Front Design"
                      className="w-full h-full object-contain bg-gray-100"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400">No front design</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Front
                  </div>
                </div>

                {/* Back Side */}
                <div
                  className="absolute inset-0 w-full h-full backface-hidden rounded-xl overflow-hidden border-2 border-gray-200"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  {hasBackDesign && designData.back?.preview ? (
                    <img
                      src={designData.back.preview}
                      alt="Back Design"
                      className="w-full h-full object-contain bg-gray-100"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400">No back design</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Back
                  </div>
                </div>
              </div>
            </div>

            {/* Flip Toggle Buttons */}
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setIsFlipped(false)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  !isFlipped
                    ? "bg-cyan-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Front
              </button>
              <button
                onClick={() => setIsFlipped(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  isFlipped
                    ? "bg-cyan-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Back
              </button>
            </div>

            {/* Edit Design Button */}
            <button
              onClick={handleEditDesign}
              className="w-full mt-6 py-3 px-4 rounded-xl font-medium border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50 flex items-center justify-center gap-2 transition"
            >
              <IoCreateOutline size={20} />
              Edit Design
            </button>
          </div>

          {/* Right: Review and Confirm */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Review & Confirm</h2>
            <p className="text-gray-600 text-sm mb-6">
              Please review your design carefully before confirming. Once submitted, the design will be updated in your cart.
            </p>

            {/* Product Info */}
            {productName && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-900">{productName}</h3>
                {selectedAttributes && Object.keys(selectedAttributes).length > 0 && (
                  <div className="mt-2 space-y-1">
                    {Object.entries(selectedAttributes).map(([key, value]) => (
                      <p key={key} className="text-sm text-gray-600">
                        {formatLabel(key)}: <span className="font-medium">{value}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Design Details Accordion */}
            <div className="border border-gray-200 rounded-xl mb-6 overflow-hidden">
              <button
                onClick={() => toggleSection("details")}
                className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
              >
                <span className="font-semibold text-gray-900">Design Details</span>
                {expandedSections.details ? <IoChevronUp /> : <IoChevronDown />}
              </button>
              {expandedSections.details && (
                <div className="p-4 space-y-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Front Design</span>
                    <span className={`font-medium ${hasFrontDesign ? "text-green-600" : "text-gray-400"}`}>
                      {hasFrontDesign ? "Uploaded" : "Empty"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Back Design</span>
                    <span className={`font-medium ${hasBackDesign ? "text-green-600" : "text-gray-400"}`}>
                      {hasBackDesign ? "Uploaded" : "Empty"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Single side warning */}
            {!hasBothDesigns && hasAnyDesign && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-2">
                  <IoWarning className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-medium text-yellow-800 text-sm">Single-side printing</p>
                    <p className="text-xs text-yellow-600 mt-1">
                      {hasFrontDesign ? "Back" : "Front"} side will be printed blank.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Design Confirmation Checkboxes */}
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
                  I accept the{" "}
                  <a href="/terms" className="text-cyan-600 underline">
                    Terms & Conditions
                  </a>{" "}
                  and understand that once submitted, the design cannot be modified.
                </span>
              </label>
            </div>

            {/* Update Cart Button */}
            <button
              onClick={handleUpdateCart}
              disabled={!canSubmit || isSubmitting}
              className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
                canSubmit
                  ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <IoCartOutline size={22} />
                  Go to Cart
                </>
              )}
            </button>

            {/* Success Message */}
            {success && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-center flex items-center justify-center gap-2">
                <IoCheckmarkCircle size={20} />
                {success}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
                {error}
              </div>
            )}

            {/* Info Text */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Your design will be saved and you'll be taken back to your cart.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDesignPage;
