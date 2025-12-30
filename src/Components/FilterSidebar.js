import React, { useState } from 'react';
import { FaFilter, FaTimes, FaSort } from 'react-icons/fa';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import PriceRangeFilter from './PriceRangeFilter';

const FilterSidebar = ({
  priceRange = { min: 0, max: 10000 },
  selectedPriceRange = [0, 10000],
  sortBy = 'created_at',
  sortOrder = 'desc',
  onPriceChange,
  onSortChange,
  onClearFilters,
  totalProducts = 0,
  isMobile = false,
  isOpen = false,
  onClose = () => {}
}) => {
  const [isPriceExpanded, setIsPriceExpanded] = useState(true);
  const [isSortExpanded, setIsSortExpanded] = useState(true);

  const sortOptions = [
    { value: 'created_at_desc', label: 'Newest First', sortBy: 'created_at', sortOrder: 'desc' },
    { value: 'price_asc', label: 'Price: Low to High', sortBy: 'price', sortOrder: 'asc' },
    { value: 'price_desc', label: 'Price: High to Low', sortBy: 'price', sortOrder: 'desc' },
    { value: 'name_asc', label: 'Name: A to Z', sortBy: 'name', sortOrder: 'asc' },
    { value: 'name_desc', label: 'Name: Z to A', sortBy: 'name', sortOrder: 'desc' },
  ];

  const currentSortValue = `${sortBy}_${sortOrder}`;
  const isFiltered = selectedPriceRange[0] !== priceRange.min || selectedPriceRange[1] !== priceRange.max;

  const sidebarContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <FaFilter className="text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        {isFiltered && (
          <button
            onClick={onClearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <FaTimes size={12} />
            Clear All
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
        <p className="text-sm text-gray-700">
          Showing <span className="font-bold text-blue-600">{totalProducts}</span> products
        </p>
      </div>

      {/* Sort Options */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsSortExpanded(!isSortExpanded)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
        >
          <div className="flex items-center gap-2">
            <FaSort className="text-gray-600" />
            <span className="font-medium text-gray-900">Sort By</span>
          </div>
          {isSortExpanded ? (
            <IoChevronUp className="text-gray-600" />
          ) : (
            <IoChevronDown className="text-gray-600" />
          )}
        </button>

        {isSortExpanded && (
          <div className="p-4 space-y-2">
            {sortOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition group"
              >
                <input
                  type="radio"
                  name="sort"
                  value={option.value}
                  checked={currentSortValue === option.value}
                  onChange={() => onSortChange(option.sortBy, option.sortOrder)}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <span className={`text-sm ${currentSortValue === option.value ? 'text-blue-600 font-medium' : 'text-gray-700 group-hover:text-gray-900'}`}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range Filter */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsPriceExpanded(!isPriceExpanded)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">Price Range</span>
            {isFiltered && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                Active
              </span>
            )}
          </div>
          {isPriceExpanded ? (
            <IoChevronUp className="text-gray-600" />
          ) : (
            <IoChevronDown className="text-gray-600" />
          )}
        </button>

        {isPriceExpanded && (
          <div className="p-4">
            <PriceRangeFilter
              min={priceRange.min}
              max={priceRange.max}
              value={selectedPriceRange}
              onChange={onPriceChange}
            />
          </div>
        )}
      </div>
    </div>
  );

  // Mobile Drawer
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
        )}

        {/* Drawer */}
        <div
          className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Filters & Sort</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <FaTimes className="text-gray-600" size={20} />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
      {sidebarContent}
    </div>
  );
};

export default FilterSidebar;
