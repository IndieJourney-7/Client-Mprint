import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import api from '../api/api';
import { IoHeart, IoHeartOutline, IoSearch, IoCloudUploadOutline, IoChevronDown, IoChevronUp } from 'react-icons/io5';

/**
 * TemplateBrowser - Browse and select design templates (like Vistaprint)
 *
 * Features:
 * - Template grid with color variants
 * - Personalization sidebar (Make it yours)
 * - Filters (orientation, corners, colors)
 * - Search functionality
 * - Favorites system
 * - Upload own design option
 */
const TemplateBrowser = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug, productSlug } = useParams();

  // Determine actual product slug and category slug
  const actualProductSlug = productSlug || slug;
  const categorySlug = productSlug ? slug : null;

  // Get product info from navigation state
  const { product, selectedAttributes } = location.state || {};

  // Template state
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrientation, setSelectedOrientation] = useState(selectedAttributes?.orientation || 'all');
  const [selectedCorners, setSelectedCorners] = useState(selectedAttributes?.shape === 'rounded' ? 'rounded' : 'all');
  const [expandedFilters, setExpandedFilters] = useState({
    color: true,
    orientation: true,
    corners: true,
  });

  // Personalization state
  const [personalization, setPersonalization] = useState({
    companyName: '',
    fullName: '',
    logoFile: null,
    logoPreview: null,
  });

  // Fetch templates
  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrientation, selectedCorners, searchQuery, pagination.current_page]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.current_page,
        per_page: 12,
      };

      if (product?.category_id) {
        params.category_id = product.category_id;
      }

      if (selectedOrientation !== 'all') {
        params.orientation = selectedOrientation;
      }

      if (selectedCorners !== 'all') {
        params.corners = selectedCorners;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await api.get('/api/templates', { params });

      if (response.data.success) {
        setTemplates(response.data.data.data);
        setPagination({
          current_page: response.data.data.current_page,
          last_page: response.data.data.last_page,
          total: response.data.data.total,
        });
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle template selection - navigate to preview page
  const handleTemplateSelect = (template) => {
    // Navigate to template preview page
    const previewPath = categorySlug
      ? `/category/${categorySlug}/${actualProductSlug}/templates/${template.id}`
      : `/products/${actualProductSlug}/templates/${template.id}`;

    navigate(previewPath, {
      state: {
        product,
        selectedAttributes,
        template,
      },
    });
  };

  // Handle upload own design
  const handleUploadOwn = () => {
    const configurePath = categorySlug
      ? `/category/${categorySlug}/${actualProductSlug}/configure`
      : `/products/${actualProductSlug}/configure`;

    navigate(configurePath, {
      state: {
        ...location.state,
        showDesignStudio: true,
      },
    });
  };

  // Handle favorite toggle
  const handleFavoriteToggle = async (templateId, event) => {
    event.stopPropagation();

    try {
      const response = await api.post(`/api/templates/${templateId}/favorite`);

      if (response.data.success) {
        // Update local state
        setTemplates(prev => prev.map(t =>
          t.id === templateId
            ? { ...t, is_favorited: response.data.is_favorited }
            : t
        ));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Please login to save favorites');
      } else {
        console.error('Error toggling favorite:', error);
      }
    }
  };

  // Handle logo upload
  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPersonalization(prev => ({
        ...prev,
        logoFile: file,
        logoPreview: URL.createObjectURL(file),
      }));
    }
  };

  // Toggle filter section
  const toggleFilter = (filterName) => {
    setExpandedFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Browse Designs</h1>
          <p className="text-gray-600 mt-1">
            {product?.name} - {pagination.total || 0} templates available
          </p>
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar - Make it yours */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-blue-50 rounded-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Make it yours</h2>
              <p className="text-sm text-gray-600 mb-6">
                Add your information to see personalised templates just for you.
              </p>

              {/* Logo/Photo Upload */}
              <div className="mb-4">
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-cyan-500 transition bg-white">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    {personalization.logoPreview ? (
                      <img
                        src={personalization.logoPreview}
                        alt="Logo preview"
                        className="max-h-20 mx-auto"
                      />
                    ) : (
                      <div className="text-gray-500">
                        <div className="text-2xl mb-2">📷</div>
                        <div className="text-sm font-medium">Add logo or photo</div>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Company Name */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Company Name"
                  value={personalization.companyName}
                  onChange={(e) => setPersonalization(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              {/* Full Name */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={personalization.fullName}
                  onChange={(e) => setPersonalization(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="mt-6 bg-white rounded-lg p-6 sticky top-[400px]">
              <h3 className="font-bold text-gray-900 mb-4">Filter By</h3>

              {/* Product Orientation */}
              <div className="mb-4 border-b pb-4">
                <button
                  onClick={() => toggleFilter('orientation')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="font-medium text-gray-900">Product Orientation</span>
                  {expandedFilters.orientation ? <IoChevronUp /> : <IoChevronDown />}
                </button>
                {expandedFilters.orientation && (
                  <div className="mt-3 space-y-2">
                    {['all', 'horizontal', 'vertical'].map(orientation => (
                      <label key={orientation} className="flex items-center">
                        <input
                          type="radio"
                          name="orientation"
                          value={orientation}
                          checked={selectedOrientation === orientation}
                          onChange={(e) => setSelectedOrientation(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm capitalize">{orientation}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Corners */}
              <div className="mb-4">
                <button
                  onClick={() => toggleFilter('corners')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="font-medium text-gray-900">Corners</span>
                  {expandedFilters.corners ? <IoChevronUp /> : <IoChevronDown />}
                </button>
                {expandedFilters.corners && (
                  <div className="mt-3 space-y-2">
                    {['all', 'rectangle', 'rounded'].map(corner => (
                      <label key={corner} className="flex items-center">
                        <input
                          type="radio"
                          name="corners"
                          value={corner}
                          checked={selectedCorners === corner}
                          onChange={(e) => setSelectedCorners(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm capitalize">{corner}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <IoSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search templates"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search input w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-600">
              {pagination.total} results
            </div>

            {/* Template Grid */}
            {loading ? (
              <div className="grid grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                    <div className="aspect-[3/2] bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {/* Upload Your Own Design Card */}
                <div
                  onClick={handleUploadOwn}
                  className="bg-white rounded-lg p-6 cursor-pointer hover:shadow-lg transition border-2 border-dashed border-gray-300 hover:border-cyan-500 flex flex-col items-center justify-center"
                  style={{ aspectRatio: '3/2' }}
                >
                  <IoCloudUploadOutline size={48} className="text-gray-400 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Upload your own design</h3>
                  <p className="text-sm text-gray-600">100 for ₹200.00</p>
                </div>

                {/* Template Cards */}
                {templates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={handleTemplateSelect}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                {[...Array(pagination.last_page)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPagination(prev => ({ ...prev, current_page: i + 1 }))}
                    className={`px-4 py-2 rounded ${
                      pagination.current_page === i + 1
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * TemplateCard Component
 */
const TemplateCard = ({ template, onSelect, onFavoriteToggle }) => {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [previewImage, setPreviewImage] = useState(template.preview_url);

  // Update preview when hovering over color variant
  const handleVariantHover = (variant) => {
    setPreviewImage(variant.preview_url);
  };

  const handleVariantLeave = () => {
    setPreviewImage(selectedVariant?.preview_url || template.preview_url);
  };

  const handleVariantClick = (variant) => {
    setSelectedVariant(variant);
    setPreviewImage(variant.preview_url);
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition group relative">
      {/* Favorite Button */}
      <button
        onClick={(e) => onFavoriteToggle(template.id, e)}
        className="absolute top-3 right-3 z-10 bg-white rounded-full p-2 shadow-md hover:scale-110 transition"
      >
        {template.is_favorited ? (
          <IoHeart size={20} className="text-red-500" />
        ) : (
          <IoHeartOutline size={20} className="text-gray-400" />
        )}
      </button>

      {/* Template Preview */}
      <div
        onClick={() => onSelect(template)}
        className="cursor-pointer"
      >
        <div className="relative aspect-[3/2] bg-gray-100 overflow-hidden">
          <img
            src={previewImage}
            alt={template.name}
            className="w-full h-full object-contain p-4"
          />
        </div>

        {/* Template Info */}
        <div className="p-4">
          {/* Color Variants */}
          {template.color_variants && template.color_variants.length > 0 && (
            <div className="flex gap-2 mb-3">
              {/* Default color */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVariant(null);
                  setPreviewImage(template.preview_url);
                }}
                onMouseEnter={() => handleVariantHover(template)}
                onMouseLeave={handleVariantLeave}
                className={`w-8 h-8 rounded-full border-2 ${
                  !selectedVariant ? 'border-cyan-500' : 'border-gray-300'
                }`}
                style={{ backgroundColor: '#3B82F6' }}
              />

              {/* Color variants */}
              {template.color_variants.map(variant => (
                <button
                  key={variant.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVariantClick(variant);
                  }}
                  onMouseEnter={() => handleVariantHover(variant)}
                  onMouseLeave={handleVariantLeave}
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedVariant?.id === variant.id ? 'border-cyan-500' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: variant.color_hex }}
                  title={variant.color_name}
                />
              ))}
            </div>
          )}

          {/* Price */}
          <div className="text-sm text-gray-900">
            100 for ₹{template.base_price}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateBrowser;
