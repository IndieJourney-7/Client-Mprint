import React, { useState, useEffect } from 'react';
import {
  IoAdd,
  IoClose,
  IoTrash,
  IoSave,
  IoPencil,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoCloudUpload,
  IoImageOutline
} from 'react-icons/io5';
import axios from 'axios';

const BannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  const API_BASE_URL = 'http://127.0.0.1:8000/api';

  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    price_text: '',
    button_text: 'Shop Now',
    button_link: '',
    image: null,
    type: 'hero',
    position: 'left',
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/banners`);
      if (response.data.success) {
        setBanners(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching banners:', err);
      setError('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBannerForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerForm(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();

      // Append all form fields
      formData.append('title', bannerForm.title);
      formData.append('subtitle', bannerForm.subtitle || '');
      formData.append('description', bannerForm.description || '');
      formData.append('price_text', bannerForm.price_text || '');
      formData.append('button_text', bannerForm.button_text);
      formData.append('button_link', bannerForm.button_link || '');
      formData.append('type', bannerForm.type);
      formData.append('position', bannerForm.position);
      formData.append('sort_order', bannerForm.sort_order);
      formData.append('is_active', bannerForm.is_active ? '1' : '0');

      // Append image if present
      if (bannerForm.image) {
        formData.append('image', bannerForm.image);
      }

      console.log('Submitting banner form:', {
        title: bannerForm.title,
        type: bannerForm.type,
        position: bannerForm.position,
        hasImage: !!bannerForm.image,
        isActive: bannerForm.is_active
      });

      if (editingBanner) {
        const response = await axios.post(`${API_BASE_URL}/banners/${editingBanner.id}?_method=PUT`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log('Banner update response:', response.data);
        setSuccess('Banner updated successfully!');
      } else {
        const response = await axios.post(`${API_BASE_URL}/banners`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log('Banner create response:', response.data);
        setSuccess('Banner created successfully!');
      }

      fetchBanners();
      resetForm();
    } catch (err) {
      console.error('Error saving banner:', err);
      console.error('Error response:', err.response?.data);

      // Build detailed error message
      let errorMessage = 'Failed to save banner';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      if (err.response?.data?.errors) {
        const errors = Object.values(err.response.data.errors).flat();
        errorMessage += ': ' + errors.join(', ');
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title,
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      price_text: banner.price_text || '',
      button_text: banner.button_text,
      button_link: banner.button_link || '',
      image: null,
      type: banner.type,
      position: banner.position,
      sort_order: banner.sort_order,
      is_active: banner.is_active,
    });
    setImagePreview(banner.image_url);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;

    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/banners/${id}`);
      setSuccess('Banner deleted successfully!');
      fetchBanners();
    } catch (err) {
      console.error('Error deleting banner:', err);
      setError('Failed to delete banner');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setBannerForm({
      title: '',
      subtitle: '',
      description: '',
      price_text: '',
      button_text: 'Shop Now',
      button_link: '',
      image: null,
      type: 'hero',
      position: 'left',
      sort_order: 0,
      is_active: true,
    });
    setImagePreview('');
    setEditingBanner(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Banner Management</h2>
            <p className="text-gray-600">Manage hero banners and promo banners for homepage</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="group relative px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2"
          >
            <IoAdd size={20} />
            <span>Add New Banner</span>
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center shadow-sm">
          <IoCheckmarkCircle className="mr-3 text-green-600 flex-shrink-0" size={20} />
          <div className="flex-1 text-green-800 font-medium">{success}</div>
          <button onClick={() => setSuccess('')} className="ml-2 text-green-600 hover:text-green-800 transition">
            <IoClose size={18} />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center shadow-sm">
          <IoCloseCircle className="mr-3 text-red-600 flex-shrink-0" size={20} />
          <div className="flex-1 text-red-800 font-medium">{error}</div>
          <button onClick={() => setError('')} className="ml-2 text-red-600 hover:text-red-800 transition">
            <IoClose size={18} />
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">
                  {editingBanner ? 'Edit Banner' : 'Add New Banner'}
                </h3>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-white/20 rounded-xl transition"
                >
                  <IoClose className="text-white" size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Banner Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Banner Type *
                </label>
                <select
                  name="type"
                  value={bannerForm.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                >
                  <option value="hero">Hero Banner (Home Top)</option>
                  <option value="promo">Promo Banner (Home Middle)</option>
                </select>
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Position *
                </label>
                <select
                  name="position"
                  value={bannerForm.position}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                >
                  <option value="left">Left Side</option>
                  <option value="right">Right Side</option>
                  <option value="full">Full Width</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={bannerForm.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., My Name, My Pride"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  name="subtitle"
                  value={bannerForm.subtitle}
                  onChange={handleInputChange}
                  placeholder="Optional subtitle"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                />
              </div>

              {/* Price Text */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price Text
                </label>
                <input
                  type="text"
                  name="price_text"
                  value={bannerForm.price_text}
                  onChange={handleInputChange}
                  placeholder="e.g., 100 Visiting Cards at Rs 200"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={bannerForm.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Additional banner description"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                />
              </div>

              {/* Button Text */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Button Text *
                </label>
                <input
                  type="text"
                  name="button_text"
                  value={bannerForm.button_text}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Shop Now"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                />
              </div>

              {/* Button Link */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Button Link
                </label>
                <input
                  type="text"
                  name="button_link"
                  value={bannerForm.button_link}
                  onChange={handleInputChange}
                  placeholder="e.g., /bookmarks or https://example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Banner Image * {editingBanner && '(Upload new to replace)'}
                </label>
                <div className="mt-2">
                  {imagePreview && (
                    <div className="mb-3">
                      <img
                        src={imagePreview}
                        alt="Banner preview"
                        className="w-full h-48 object-cover rounded-xl"
                      />
                    </div>
                  )}
                  <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                    <div className="text-center">
                      <IoCloudUpload className="mx-auto mb-2 text-gray-400" size={32} />
                      <p className="text-sm text-gray-600">
                        Click to upload banner image
                      </p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG or WEBP (max 10MB)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      required={!editingBanner}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  name="sort_order"
                  value={bannerForm.sort_order}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                />
              </div>

              {/* Is Active */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={bannerForm.is_active}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-semibold text-gray-700">
                  Active (visible on website)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <IoSave size={20} />
                  <span>{loading ? 'Saving...' : editingBanner ? 'Update Banner' : 'Create Banner'}</span>
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banners List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Preview</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Position</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {banners.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <IoImageOutline className="mx-auto mb-3 text-gray-400" size={48} />
                    <p className="text-gray-500 font-medium">No banners found</p>
                    <p className="text-sm text-gray-400 mt-1">Create your first banner to get started</p>
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-24 h-16 object-cover rounded-lg"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{banner.title}</p>
                        {banner.price_text && (
                          <p className="text-sm text-gray-600">{banner.price_text}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-lg ${
                        banner.type === 'hero'
                          ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800'
                          : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800'
                      }`}>
                        {banner.type === 'hero' ? 'Hero' : 'Promo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 capitalize">{banner.position}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-lg ${
                        banner.is_active
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800'
                          : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800'
                      }`}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(banner)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <IoPencil className="text-blue-600" size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <IoTrash className="text-red-600" size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BannerManagement;
