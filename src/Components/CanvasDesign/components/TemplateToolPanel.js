/**
 * TemplateToolPanel Component
 * Panel for browsing and applying templates to the canvas
 * Shows current template info and allows template switching
 */

import React, { useState, useEffect } from 'react';
import {
  IoImageOutline,
  IoSwapHorizontal,
  IoCheckmarkCircle,
  IoColorPaletteOutline,
} from 'react-icons/io5';
import api from '../../../api/api';

const TemplateToolPanel = ({
  activeSide,
  currentTemplate,
  selectedColorVariant,
  onApplyTemplate,
  onSelectColorVariant,
  productId,
}) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(currentTemplate?.id || null);

  // Fetch available templates for the product
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!productId) return;

      setLoading(true);
      try {
        const response = await api.get('/api/templates', {
          params: {
            per_page: 12,
            product_id: productId,
          },
        });
        if (response.data?.success) {
          setTemplates(response.data.data?.data || response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [productId]);

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setSelectedTemplateId(template.id);
    onApplyTemplate?.(template, null); // Apply with default color
  };

  // Handle color variant selection
  const handleColorSelect = (template, variant) => {
    onSelectColorVariant?.(variant);
    onApplyTemplate?.(template, variant);
  };

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Template</h3>
        <button className="text-gray-400 hover:text-gray-600">
          <IoSwapHorizontal size={18} />
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Choose a pre-designed template or customize your own design.
      </p>

      {/* Current Template (if selected) */}
      {currentTemplate && (
        <div className="mb-6 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <IoCheckmarkCircle className="text-cyan-500" size={18} />
            <span className="text-sm font-medium text-cyan-700">Current Template</span>
          </div>
          <div className="flex items-center gap-3">
            <img
              src={selectedColorVariant?.preview_url || currentTemplate.preview_url}
              alt={currentTemplate.name}
              className="w-16 h-10 object-cover rounded border"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 truncate">{currentTemplate.name}</p>
              {currentTemplate.color_variants?.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {currentTemplate.color_variants.slice(0, 4).map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => handleColorSelect(currentTemplate, variant)}
                      className={`w-4 h-4 rounded-full border transition ${
                        selectedColorVariant?.id === variant.id
                          ? 'border-cyan-500 ring-1 ring-cyan-300'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: variant.color_hex }}
                      title={variant.color_name}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Grid */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Available Templates</h4>
          {templates.length > 0 && (
            <span className="text-xs text-gray-400">{templates.length} templates</span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="aspect-[16/10] bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : templates.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`relative aspect-[16/10] rounded-lg border-2 overflow-hidden cursor-pointer transition-all group ${
                  selectedTemplateId === template.id
                    ? 'border-cyan-500 ring-2 ring-cyan-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img
                  src={template.preview_url}
                  alt={template.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200x120?text=Template';
                  }}
                />
                {selectedTemplateId === template.id && (
                  <div className="absolute top-1 right-1 bg-cyan-500 rounded-full p-0.5">
                    <IoCheckmarkCircle className="text-white" size={14} />
                  </div>
                )}
                {/* Color indicators */}
                {template.color_variants?.length > 0 && (
                  <div className="absolute bottom-1 left-1 flex gap-0.5">
                    {template.color_variants.slice(0, 3).map((variant) => (
                      <div
                        key={variant.id}
                        className="w-3 h-3 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: variant.color_hex }}
                      />
                    ))}
                    {template.color_variants.length > 3 && (
                      <span className="text-[10px] text-white bg-black/50 px-1 rounded">
                        +{template.color_variants.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <IoImageOutline className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-xs text-gray-400">No templates available</p>
            <p className="text-xs text-gray-400">Upload your own design instead</p>
          </div>
        )}
      </div>

      {/* Color Variants Panel (when template is selected) */}
      {currentTemplate?.color_variants?.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <IoColorPaletteOutline size={16} className="text-gray-500" />
            <h4 className="text-sm font-medium text-gray-700">Color Variants</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Default color */}
            <button
              onClick={() => handleColorSelect(currentTemplate, null)}
              className={`w-8 h-8 rounded-full border-2 transition ${
                !selectedColorVariant
                  ? 'border-cyan-500 ring-2 ring-cyan-200'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: '#3B82F6' }}
              title="Default"
            />
            {currentTemplate.color_variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => handleColorSelect(currentTemplate, variant)}
                className={`w-8 h-8 rounded-full border-2 transition ${
                  selectedColorVariant?.id === variant.id
                    ? 'border-cyan-500 ring-2 ring-cyan-200'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: variant.color_hex || '#888' }}
                title={variant.color_name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Customization tip */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
        <p className="font-medium mb-1">Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Select a template to use as your base design</li>
          <li>Add text fields to customize the template</li>
          <li>Upload your logo to replace placeholder images</li>
        </ul>
      </div>
    </div>
  );
};

export default TemplateToolPanel;
