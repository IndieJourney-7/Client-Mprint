import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { IoClose, IoHeart, IoHeartOutline, IoChevronBack, IoRefresh } from 'react-icons/io5';
import api from '../api/api';

/**
 * TemplatePreview - Preview a selected template with Front/Back view
 * Similar to Vistaprint's template detail view
 */
const TemplatePreview = () => {
  const { slug, productSlug, templateId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine actual product slug and category slug
  const actualProductSlug = productSlug || slug;
  const categorySlug = productSlug ? slug : null;

  // Get data from navigation state
  const { product, selectedAttributes, template: passedTemplate } = location.state || {};

  // State
  const [template, setTemplate] = useState(passedTemplate || null);
  const [loading, setLoading] = useState(!passedTemplate);
  const [activeSide, setActiveSide] = useState('front');
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedColorVariant, setSelectedColorVariant] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [relatedTemplates, setRelatedTemplates] = useState([]);
  const cardRef = useRef(null);

  // Fetch template if not passed via state
  useEffect(() => {
    if (!passedTemplate && templateId) {
      fetchTemplate();
    }
    fetchRelatedTemplates();
  }, [templateId, passedTemplate]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/templates/${templateId}`);
      if (response.data.success) {
        setTemplate(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching template:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedTemplates = async () => {
    try {
      const params = {
        per_page: 4,
        exclude_id: templateId,
      };
      if (product?.category_id) {
        params.category_id = product.category_id;
      }
      const response = await api.get('/api/templates', { params });
      if (response.data.success) {
        setRelatedTemplates(response.data.data.data || response.data.data);
      }
    } catch (error) {
      console.error('Error fetching related templates:', error);
    }
  };

  const handleFavoriteToggle = async () => {
    try {
      await api.get('/sanctum/csrf-cookie');
      await api.post(`/api/templates/${template.id}/favorite`);
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleEditDesign = async () => {
    try {
      // Track template usage
      await api.post(`/api/templates/${template.id}/use`);

      // Navigate to configure/design studio with template data
      const configurePath = categorySlug
        ? `/category/${categorySlug}/${actualProductSlug}/configure`
        : `/products/${actualProductSlug}/configure`;

      navigate(configurePath, {
        state: {
          product,
          selectedAttributes,
          templateData: {
            template,
            colorVariant: selectedColorVariant,
          },
          showDesignStudio: true,
        },
      });
    } catch (error) {
      console.error('Error using template:', error);
    }
  };

  const handleClose = () => {
    // Go back to template browser
    const templatesPath = categorySlug
      ? `/category/${categorySlug}/${actualProductSlug}/templates`
      : `/products/${actualProductSlug}/templates`;

    navigate(templatesPath, {
      state: { product, selectedAttributes },
    });
  };

  const handleRelatedTemplateClick = (relatedTemplate) => {
    const previewPath = categorySlug
      ? `/category/${categorySlug}/${actualProductSlug}/templates/${relatedTemplate.id}`
      : `/products/${actualProductSlug}/templates/${relatedTemplate.id}`;

    navigate(previewPath, {
      state: {
        product,
        selectedAttributes,
        template: relatedTemplate,
      },
    });
  };

  // Get front/back images based on color variant
  const getFrontImage = () => {
    if (selectedColorVariant) {
      return selectedColorVariant.preview_url || selectedColorVariant.front_template_url;
    }
    return template?.preview_url || template?.front_template_url;
  };

  const getBackImage = () => {
    if (selectedColorVariant) {
      return selectedColorVariant.back_template_url || selectedColorVariant.preview_url;
    }
    return template?.back_template_url || template?.preview_url;
  };

  // Flip handlers
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    setActiveSide(isFlipped ? 'front' : 'back');
  };

  const handleSideChange = (side) => {
    setActiveSide(side);
    setIsFlipped(side === 'back');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-cyan-500"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Template not found</p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
          >
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side - Template Preview */}
          <div className="flex-1">
            {/* Back Button */}
            <button
              onClick={handleClose}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
            >
              <IoChevronBack size={20} />
              <span>Back to templates</span>
            </button>

            {/* Preview Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* 3D Flip Card Container */}
              <div className="relative bg-gray-50 p-8 flex items-center justify-center min-h-[400px]">
                {/* Flip Button */}
                <button
                  onClick={handleFlip}
                  className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition text-gray-700 hover:text-gray-900"
                >
                  <IoRefresh size={18} className={`transition-transform duration-300 ${isFlipped ? 'rotate-180' : ''}`} />
                  <span className="text-sm font-medium">Flip</span>
                </button>

                {/* 3D Card */}
                <div
                  ref={cardRef}
                  className="relative w-full max-w-md cursor-pointer"
                  onClick={handleFlip}
                  style={{ perspective: '1000px' }}
                >
                  <div
                    className="relative w-full transition-transform duration-700 ease-in-out"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                  >
                    {/* Front Face */}
                    <div
                      className="relative w-full aspect-[16/10]"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <img
                        src={getFrontImage()}
                        alt={`${template.name} - Front`}
                        className="w-full h-full object-contain rounded-lg shadow-lg bg-white"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x240?text=Front+Preview';
                        }}
                      />
                      {/* Front Label */}
                      <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/70 text-white text-sm rounded-full">
                        Front
                      </div>
                    </div>

                    {/* Back Face */}
                    <div
                      className="absolute inset-0 w-full aspect-[16/10]"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                      }}
                    >
                      <img
                        src={getBackImage()}
                        alt={`${template.name} - Back`}
                        className="w-full h-full object-contain rounded-lg shadow-lg bg-white"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x240?text=Back+Preview';
                        }}
                      />
                      {/* Back Label */}
                      <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/70 text-white text-sm rounded-full">
                        Back
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hover instruction */}
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-gray-500">
                  Click or use buttons to flip
                </p>
              </div>

              {/* Front/Back Toggle Buttons */}
              <div className="flex justify-center py-6 border-t">
                <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => handleSideChange('front')}
                    className={`px-8 py-3 text-sm font-medium transition ${
                      activeSide === 'front'
                        ? 'bg-white text-gray-900 border-2 border-gray-900'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Front
                  </button>
                  <button
                    onClick={() => handleSideChange('back')}
                    className={`px-8 py-3 text-sm font-medium transition ${
                      activeSide === 'back'
                        ? 'bg-white text-gray-900 border-2 border-gray-900'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Template Info */}
          <div className="lg:w-96">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">
              {/* Close Button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <IoClose size={24} className="text-gray-500" />
                </button>
              </div>

              {/* Template Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {template.name || 'Visiting Cards Designs & Templates'}
              </h1>

              {/* Price */}
              <p className="text-gray-600 mb-2">
                {product?.attributes?.quantity?.[0]?.quantity || 100} for{' '}
                <span className="font-semibold">
                  ₹{template.base_price || product?.price || '200.00'}
                </span>
              </p>

              {/* Free Shipping */}
              <p className="text-cyan-600 underline text-sm mb-6">FREE Shipping</p>

              {/* Color Variants */}
              {template.color_variants && template.color_variants.length > 0 && (
                <div className="mb-6">
                  <p className="text-gray-900 font-medium mb-3">Colours</p>
                  <div className="flex gap-2 flex-wrap">
                    {/* Default color (no variant) */}
                    <button
                      onClick={() => setSelectedColorVariant(null)}
                      className={`w-10 h-10 rounded-full border-2 transition ${
                        !selectedColorVariant
                          ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-400'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: '#3B82F6' }}
                      title="Default"
                    />
                    {template.color_variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedColorVariant(variant)}
                        className={`w-10 h-10 rounded-full border-2 transition ${
                          selectedColorVariant?.id === variant.id
                            ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-400'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: variant.color_hex || '#888' }}
                        title={variant.color_name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Divider */}
              <hr className="my-6" />

              {/* Edit My Design Button */}
              <button
                onClick={handleEditDesign}
                className="w-full py-4 bg-cyan-400 hover:bg-cyan-500 text-gray-900 font-semibold rounded-lg transition-colors text-lg"
              >
                Edit my design
              </button>

              {/* Favorite Button */}
              <button
                onClick={handleFavoriteToggle}
                className="w-full mt-3 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isFavorite ? (
                  <>
                    <IoHeart className="text-red-500" size={20} />
                    <span>Saved to favorites</span>
                  </>
                ) : (
                  <>
                    <IoHeartOutline size={20} />
                    <span>Save to favorites</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* More Templates Like This */}
        {relatedTemplates.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">More templates like this</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedTemplates.map((relatedTemplate) => (
                <div
                  key={relatedTemplate.id}
                  onClick={() => handleRelatedTemplateClick(relatedTemplate)}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition cursor-pointer group"
                >
                  {/* Template Image */}
                  <div className="relative aspect-[4/3] bg-gray-100 p-4">
                    <img
                      src={relatedTemplate.preview_url}
                      alt={relatedTemplate.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x200?text=Template';
                      }}
                    />
                    {/* Favorite Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Toggle favorite for related template
                      }}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow hover:shadow-md transition opacity-0 group-hover:opacity-100"
                    >
                      <IoHeartOutline size={18} className="text-gray-600" />
                    </button>
                  </div>

                  {/* Template Info */}
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {relatedTemplate.name}
                    </h3>
                    {relatedTemplate.color_variants && relatedTemplate.color_variants.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {relatedTemplate.color_variants.slice(0, 4).map((variant) => (
                          <div
                            key={variant.id}
                            className="w-4 h-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: variant.color_hex }}
                          />
                        ))}
                        {relatedTemplate.color_variants.length > 4 && (
                          <span className="text-xs text-gray-500 ml-1">
                            +{relatedTemplate.color_variants.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatePreview;
