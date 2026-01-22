import { useState, useEffect, useRef, useCallback } from 'react';

const PriceRangeFilter = ({ min = 0, max = 10000, value = [0, 10000], onChange }) => {
  const [minValue, setMinValue] = useState(value[0]);
  const [maxValue, setMaxValue] = useState(value[1]);
  const [isDragging, setIsDragging] = useState(false);
  const debounceTimer = useRef(null);

  // Update local state when prop value changes (but not during dragging)
  useEffect(() => {
    if (!isDragging) {
      setMinValue(value[0]);
      setMaxValue(value[1]);
    }
  }, [value, isDragging]);

  // Update local state when min/max range changes (initial load or category change)
  useEffect(() => {
    if (!isDragging) {
      // Ensure values are within the new range
      const clampedMin = Math.max(min, Math.min(value[0], max));
      const clampedMax = Math.max(min, Math.min(value[1], max));
      setMinValue(clampedMin);
      setMaxValue(clampedMax);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, isDragging]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Debounced onChange to prevent too many API calls
  const debouncedOnChange = useCallback((newMin, newMax) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      if (onChange) {
        onChange([newMin, newMax]);
      }
      setIsDragging(false);
    }, 500); // Wait 500ms after user stops dragging
  }, [onChange]);

  const handleMinInputChange = (e) => {
    const newValue = Math.max(min, Math.min(Number(e.target.value) || min, maxValue - 1));
    setMinValue(newValue);
    if (onChange) {
      onChange([newValue, maxValue]);
    }
  };

  const handleMaxInputChange = (e) => {
    const newValue = Math.min(max, Math.max(Number(e.target.value) || max, minValue + 1));
    setMaxValue(newValue);
    if (onChange) {
      onChange([minValue, newValue]);
    }
  };

  const formatPrice = (price) => {
    return `₹${Math.round(price).toLocaleString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Price Input Fields */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Min Price
          </label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 text-base font-bold z-10">₹</span>
            <input
              type="number"
              value={minValue}
              onChange={handleMinInputChange}
              className="relative w-full pl-10 pr-4 py-3.5 text-base font-semibold text-gray-800 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-blue-300"
              placeholder="Min"
            />
          </div>
        </div>

        <div className="flex-shrink-0 text-gray-400 font-bold text-xl mt-6">—</div>

        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Max Price
          </label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 text-base font-bold z-10">₹</span>
            <input
              type="number"
              value={maxValue}
              onChange={handleMaxInputChange}
              className="relative w-full pl-10 pr-4 py-3.5 text-base font-semibold text-gray-800 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-blue-300"
              placeholder="Max"
            />
          </div>
        </div>
      </div>

      {/* Selected Range Display */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-5 shadow-sm border border-blue-100">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full opacity-20 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200 rounded-full opacity-20 blur-2xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide flex items-center gap-2">
                Selected Range
                {isDragging && (
                  <span className="inline-flex items-center gap-1 text-yellow-600">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                    <span className="text-xs">Updating...</span>
                  </span>
                )}
              </p>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {formatPrice(minValue)} - {formatPrice(maxValue)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Range</p>
              <p className="text-lg font-bold text-blue-600">
                {Math.round(((maxValue - minValue) / (max - min)) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Remove number input spinners */
        input[type='number']::-webkit-inner-spin-button,
        input[type='number']::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input[type='number'] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};

export default PriceRangeFilter;
