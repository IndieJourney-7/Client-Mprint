import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import {
  IoAdd,
  IoClose,
  IoTrash,
  IoSave,
  IoPencil,
  IoEyeOutline,
  IoHeart,
  IoLayersOutline,
  IoColorPaletteOutline,
  IoCheckmarkCircle,
  IoCloseCircle
} from 'react-icons/io5';

const TemplateManagement = () => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category_id: '',
    subcategory_id: '',
    orientation: 'horizontal',
    corners: 'rectangle',
    base_price: 200,
    is_active: true,
    is_featured: false,
    sort_order: 0,
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [frontTemplate, setFrontTemplate] = useState(null);
  const [backTemplate, setBackTemplate] = useState(null);

  // Color variant state
  const [showColorForm, setShowColorForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [colorVariantForm, setColorVariantForm] = useState({
    color_name: '',
    color_hex: '#3B82F6',
    sort_order: 0,
  });
  const [colorPreviewImage, setColorPreviewImage] = useState(null);
  const [colorFrontTemplate, setColorFrontTemplate] = useState(null);
  const [colorBackTemplate, setColorBackTemplate] = useState(null);

  useEffect(() => {
    fetchTemplates();
    fetchCategories();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      await api.get('/sanctum/csrf-cookie');
      const response = await api.get('/api/admin/templates');
      if (response.data.success) {
        setTemplates(response.data.data.data || response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data.data || response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.get('/sanctum/csrf-cookie');

      const formData = new FormData();
      Object.keys(templateForm).forEach(key => {
        let value = templateForm[key];
        // Convert boolean values to 1/0 for Laravel validation
        if (key === 'is_active' || key === 'is_featured') {
          value = value ? '1' : '0';
        }
        formData.append(key, value);
      });

      if (previewImage) formData.append('preview_image', previewImage);
      if (frontTemplate) formData.append('front_template', frontTemplate);
      if (backTemplate) formData.append('back_template', backTemplate);

      if (editingTemplate) {
        await api.post(`/api/admin/templates/${editingTemplate.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          params: { _method: 'PUT' }
        });
        setSuccess('Template updated successfully!');
      } else {
        await api.post('/api/admin/templates', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Template created successfully!');
      }

      fetchTemplates();
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save template');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleColorVariantSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.get('/sanctum/csrf-cookie');

      const formData = new FormData();
      Object.keys(colorVariantForm).forEach(key => {
        formData.append(key, colorVariantForm[key]);
      });

      if (colorPreviewImage) formData.append('preview_image', colorPreviewImage);
      if (colorFrontTemplate) formData.append('front_template', colorFrontTemplate);
      if (colorBackTemplate) formData.append('back_template', colorBackTemplate);

      await api.post(`/api/admin/templates/${selectedTemplate.id}/variants`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess('Color variant added successfully!');
      fetchTemplates();
      resetColorForm();
      setShowColorForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add color variant');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      await api.get('/sanctum/csrf-cookie');
      await api.delete(`/api/admin/templates/${id}`);
      setSuccess('Template deleted successfully!');
      fetchTemplates();
    } catch (err) {
      setError('Failed to delete template');
      console.error(err);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      category_id: template.category_id,
      subcategory_id: template.subcategory_id || '',
      orientation: template.orientation,
      corners: template.corners,
      base_price: template.base_price,
      is_active: template.is_active,
      is_featured: template.is_featured,
      sort_order: template.sort_order,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      category_id: '',
      subcategory_id: '',
      orientation: 'horizontal',
      corners: 'rectangle',
      base_price: 200,
      is_active: true,
      is_featured: false,
      sort_order: 0,
    });
    setPreviewImage(null);
    setFrontTemplate(null);
    setBackTemplate(null);
    setEditingTemplate(null);
  };

  const resetColorForm = () => {
    setColorVariantForm({
      color_name: '',
      color_hex: '#3B82F6',
      sort_order: 0,
    });
    setColorPreviewImage(null);
    setColorFrontTemplate(null);
    setColorBackTemplate(null);
    setSelectedTemplate(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-3xl shadow-lg border border-pink-200 p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <IoLayersOutline className="text-4xl" />
              Template Management
            </h1>
            <p className="text-pink-100">
              Create and manage design templates for Browse Designs feature
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-white text-pink-600 px-6 py-3 rounded-xl hover:bg-pink-50 transition flex items-center gap-2 font-semibold shadow-lg"
          >
            <IoAdd size={20} />
            Add Template
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <IoCheckmarkCircle size={20} />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <IoCloseCircle size={20} />
          {error}
        </div>
      )}

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingTemplate ? 'Edit Template' : 'Add New Template'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <IoClose size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Template Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    placeholder="e.g., Business Card - Professional"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={templateForm.category_id}
                    onChange={(e) => setTemplateForm({ ...templateForm, category_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Orientation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orientation *
                  </label>
                  <select
                    value={templateForm.orientation}
                    onChange={(e) => setTemplateForm({ ...templateForm, orientation: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                  </select>
                </div>

                {/* Corners */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Corners *
                  </label>
                  <select
                    value={templateForm.corners}
                    onChange={(e) => setTemplateForm({ ...templateForm, corners: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="rounded">Rounded</option>
                  </select>
                </div>

                {/* Base Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={templateForm.base_price}
                    onChange={(e) => setTemplateForm({ ...templateForm, base_price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={templateForm.sort_order}
                    onChange={(e) => setTemplateForm({ ...templateForm, sort_order: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  placeholder="Describe this template..."
                />
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-3 gap-4">
                {/* Preview Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview Image * {!editingTemplate && '(Required)'}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required={!editingTemplate}
                    onChange={(e) => setPreviewImage(e.target.files[0])}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                {/* Front Template */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Front Template
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFrontTemplate(e.target.files[0])}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                {/* Back Template */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Back Template
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBackTemplate(e.target.files[0])}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={templateForm.is_active}
                    onChange={(e) => setTemplateForm({ ...templateForm, is_active: e.target.checked })}
                    className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={templateForm.is_featured}
                    onChange={(e) => setTemplateForm({ ...templateForm, is_featured: e.target.checked })}
                    className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
                >
                  <IoSave size={20} />
                  {loading ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Color Variant Form Modal */}
      {showColorForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Add Color Variant - {selectedTemplate?.name}
              </h2>
              <button
                onClick={() => setShowColorForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <IoClose size={24} />
              </button>
            </div>

            <form onSubmit={handleColorVariantSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Color Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={colorVariantForm.color_name}
                    onChange={(e) => setColorVariantForm({ ...colorVariantForm, color_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    placeholder="e.g., Blue, Red, Black"
                  />
                </div>

                {/* Color Hex */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Hex *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={colorVariantForm.color_hex}
                      onChange={(e) => setColorVariantForm({ ...colorVariantForm, color_hex: e.target.value })}
                      className="w-16 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      required
                      value={colorVariantForm.color_hex}
                      onChange={(e) => setColorVariantForm({ ...colorVariantForm, color_hex: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
              </div>

              {/* File Uploads */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview Image *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setColorPreviewImage(e.target.files[0])}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Front Template
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setColorFrontTemplate(e.target.files[0])}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Back Template
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setColorBackTemplate(e.target.files[0])}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
                >
                  <IoSave size={20} />
                  {loading ? 'Adding...' : 'Add Color Variant'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowColorForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {loading && !showForm && !showColorForm ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <IoLayersOutline className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates yet</h3>
            <p className="text-gray-600 mb-4">Create your first design template</p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-pink-500 text-white px-6 py-2 rounded-xl hover:bg-pink-600 transition inline-flex items-center gap-2"
            >
              <IoAdd size={20} />
              Add Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition">
                {/* Preview Image */}
                <div className="relative aspect-[3/2] bg-gray-100">
                  {template.preview_url ? (
                    <img
                      src={template.preview_url}
                      alt={template.name}
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <IoLayersOutline size={48} className="text-gray-300" />
                    </div>
                  )}

                  {/* Status Badges */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    {template.is_featured && (
                      <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                        Featured
                      </span>
                    )}
                    {!template.is_active && (
                      <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {template.category?.name} • {template.orientation} • ₹{template.base_price}
                  </p>

                  {/* Color Variants */}
                  {template.color_variants && template.color_variants.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <IoColorPaletteOutline size={16} className="text-gray-500" />
                      <div className="flex gap-1">
                        {template.color_variants.map((variant) => (
                          <div
                            key={variant.id}
                            className="w-6 h-6 rounded-full border-2 border-white shadow"
                            style={{ backgroundColor: variant.color_hex }}
                            title={variant.color_name}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {template.color_variants.length} colors
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowColorForm(true);
                      }}
                      className="flex-1 bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 transition text-sm flex items-center justify-center gap-1"
                    >
                      <IoColorPaletteOutline size={16} />
                      Add Color
                    </button>
                    <button
                      onClick={() => handleEdit(template)}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      <IoPencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      <IoTrash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateManagement;
