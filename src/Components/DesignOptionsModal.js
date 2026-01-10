import React, { useState, useEffect } from "react";
import { IoClose, IoCheckmarkCircle, IoWarning } from "react-icons/io5";
import { FaUpload } from "react-icons/fa";
import { BsPhone, BsPhoneLandscape } from "react-icons/bs";

const DesignOptionsModal = ({
  isOpen,
  onClose,
  product,
  attributes,
  selectedAttributes,
  onProceed,
}) => {
  const [localOrientation, setLocalOrientation] = useState(selectedAttributes.orientation || "horizontal");
  const [localQuantity, setLocalQuantity] = useState(selectedAttributes.quantity || 1);
  const [localShape, setLocalShape] = useState(selectedAttributes.shape || "");
  const [missingFields, setMissingFields] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Check which required fields are missing
      const missing = [];

      // Orientation is ALWAYS required for canvas shape
      if (!selectedAttributes.orientation) {
        missing.push("orientation");
      }

      if (!selectedAttributes.quantity || selectedAttributes.quantity < 1) {
        missing.push("quantity");
      }

      // Only check shape if product has shape options
      if (attributes.shape && (!selectedAttributes.shape || selectedAttributes.shape === "")) {
        missing.push("shape");
      }

      setMissingFields(missing);

      // Set local values from selected attributes
      setLocalOrientation(selectedAttributes.orientation || "horizontal");
      setLocalQuantity(selectedAttributes.quantity || 1);
      setLocalShape(selectedAttributes.shape || "");
    }
  }, [isOpen, selectedAttributes, attributes]);

  if (!isOpen) return null;

  const hasShapeOptions = attributes.shape && Array.isArray(attributes.shape) && attributes.shape.length > 0;

  const canProceed = () => {
    if (!localOrientation) return false;
    if (localQuantity < 1) return false;
    if (hasShapeOptions && !localShape) return false;
    return true;
  };

  const handleProceed = () => {
    if (!canProceed()) return;

    const updatedAttributes = {
      ...selectedAttributes,
      orientation: localOrientation,
      quantity: localQuantity,
    };

    if (hasShapeOptions) {
      updatedAttributes.shape = localShape;
    }

    onProceed(updatedAttributes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaUpload className="text-2xl" />
            <div>
              <h2 className="text-2xl font-bold">Complete Product Options</h2>
              <p className="text-cyan-100 text-sm mt-1">
                Please select all required options before uploading your design
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <IoClose className="text-2xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Missing Fields Warning */}
          {missingFields.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <IoWarning className="text-amber-500 text-xl flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">
                  Required Options Missing
                </h3>
                <p className="text-sm text-amber-700">
                  Please complete the following options to proceed to design upload:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-amber-700">
                  {missingFields.map((field) => (
                    <li key={field} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {field === "orientation" && "Product Orientation"}
                      {field === "quantity" && "Quantity"}
                      {field === "shape" && "Shape/Corner Style"}
                      {field === "finishing" && "Finishing Option"}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Product Orientation - REQUIRED */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <span className={missingFields.includes("orientation") ? "text-red-600" : ""}>
                Product Orientation {missingFields.includes("orientation") && "*"}
              </span>
              {!missingFields.includes("orientation") && (
                <IoCheckmarkCircle className="text-green-500" />
              )}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setLocalOrientation("horizontal")}
                className={`p-4 rounded-xl border-2 font-medium transition-all flex flex-col items-center gap-2 ${
                  localOrientation === "horizontal"
                    ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                <BsPhoneLandscape className="text-2xl" />
                <span>Horizontal</span>
              </button>
              <button
                onClick={() => setLocalOrientation("vertical")}
                className={`p-4 rounded-xl border-2 font-medium transition-all flex flex-col items-center gap-2 ${
                  localOrientation === "vertical"
                    ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                <BsPhone className="text-2xl" />
                <span>Vertical</span>
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <span className={missingFields.includes("quantity") ? "text-red-600" : ""}>
                Quantity {missingFields.includes("quantity") && "*"}
              </span>
              {!missingFields.includes("quantity") && (
                <IoCheckmarkCircle className="text-green-500" />
              )}
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLocalQuantity(Math.max(1, localQuantity - 1))}
                className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                value={localQuantity}
                onChange={(e) => setLocalQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 text-center border border-gray-300 rounded-lg px-4 py-2 font-semibold text-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              <button
                onClick={() => setLocalQuantity(localQuantity + 1)}
                className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Shape/Corner Style */}
          {hasShapeOptions && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className={missingFields.includes("shape") ? "text-red-600" : ""}>
                  Shape/Corner Style {missingFields.includes("shape") && "*"}
                </span>
                {!missingFields.includes("shape") && (
                  <IoCheckmarkCircle className="text-green-500" />
                )}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {attributes.shape.map((option) => {
                  const shapeName = option.name || option.label || option;
                  const isSelected = localShape === shapeName;
                  return (
                    <button
                      key={shapeName}
                      onClick={() => setLocalShape(shapeName)}
                      className={`p-4 rounded-xl border-2 font-medium transition-all ${
                        isSelected
                          ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      {shapeName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Finishing Options - REMOVED: This is selected in Final Steps page after design, not before */}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl border-t flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleProceed}
            disabled={!canProceed()}
            className={`px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
              canProceed()
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:scale-105"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <span>Proceed to Design Studio</span>
            <FaUpload />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignOptionsModal;
