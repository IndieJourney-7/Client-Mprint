import React, { useState, useEffect } from 'react';
import {
  IoAdd,
  IoClose,
  IoTrash,
  IoSave,
  IoPencil,
  IoSearchOutline,
  IoChevronDown,
  IoChevronUp,
  IoCheckmarkCircle,
  IoAlertCircle,
  IoHelpCircleOutline,
  IoStarOutline,
  IoStar,
  IoEyeOutline,
  IoThumbsUpOutline,
  IoThumbsDownOutline,
  IoReorderThree,
} from 'react-icons/io5';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const FaqManagement = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stats, setStats] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    sort_order: 0,
    is_active: true,
    is_featured: false,
  });

  // FAQ Categories
  const categories = {
    ordering: 'Ordering & Checkout',
    design: 'Design & Artwork',
    printing: 'Printing & Quality',
    shipping: 'Shipping & Delivery',
    returns: 'Returns & Refunds',
    payment: 'Payment & Billing',
    account: 'Account & Login',
    bulk: 'Bulk Orders',
    general: 'General',
  };

  // Category colors
  const categoryColors = {
    ordering: 'bg-blue-100 text-blue-700',
    design: 'bg-purple-100 text-purple-700',
    printing: 'bg-amber-100 text-amber-700',
    shipping: 'bg-green-100 text-green-700',
    returns: 'bg-red-100 text-red-700',
    payment: 'bg-indigo-100 text-indigo-700',
    account: 'bg-cyan-100 text-cyan-700',
    bulk: 'bg-orange-100 text-orange-700',
    general: 'bg-gray-100 text-gray-700',
  };

  // Fetch FAQs
  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (categoryFilter) params.append('category', categoryFilter);

      const response = await fetch(`${API_BASE_URL}/admin/faqs?${params}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setFaqs(data.data.data || []);
        setStats(data.stats);
      }
    } catch (err) {
      setError('Failed to fetch FAQs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, [categoryFilter]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchFaqs();
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: 'general',
      sort_order: 0,
      is_active: true,
      is_featured: false,
    });
    setEditingFaq(null);
    setShowForm(false);
  };

  // Open edit form
  const openEditForm = (faq) => {
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      sort_order: faq.sort_order,
      is_active: faq.is_active,
      is_featured: faq.is_featured,
    });
    setEditingFaq(faq);
    setShowForm(true);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = editingFaq
        ? `${API_BASE_URL}/admin/faqs/${editingFaq.id}`
        : `${API_BASE_URL}/admin/faqs`;

      const response = await fetch(url, {
        method: editingFaq ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(editingFaq ? 'FAQ updated successfully!' : 'FAQ created successfully!');
        resetForm();
        fetchFaqs();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to save FAQ');
      }
    } catch (err) {
      setError('Failed to save FAQ');
      console.error(err);
    }
  };

  // Delete FAQ
  const deleteFaq = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/faqs/${id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('FAQ deleted successfully!');
        fetchFaqs();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to delete FAQ');
      }
    } catch (err) {
      setError('Failed to delete FAQ');
      console.error(err);
    }
  };

  // Toggle featured
  const toggleFeatured = async (faq) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/faqs/${faq.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ is_featured: !faq.is_featured }),
      });

      const data = await response.json();
      if (data.success) {
        fetchFaqs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle active
  const toggleActive = async (faq) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/faqs/${faq.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ is_active: !faq.is_active }),
      });

      const data = await response.json();
      if (data.success) {
        fetchFaqs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Total FAQs</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <IoHelpCircleOutline className="text-4xl text-amber-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Active</p>
                <p className="text-3xl font-bold">{stats.active}</p>
              </div>
              <IoCheckmarkCircle className="text-4xl text-green-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Featured</p>
                <p className="text-3xl font-bold">{stats.featured}</p>
              </div>
              <IoStar className="text-4xl text-purple-200" />
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <IoCheckmarkCircle className="text-xl" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <IoAlertCircle className="text-xl" />
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm border p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center flex-1">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-md">
              <div className="relative">
                <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search FAQs..."
                  className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-amber-200 focus:border-amber-500 outline-none"
                />
              </div>
            </form>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-amber-200 focus:border-amber-500 outline-none"
            >
              <option value="">All Categories</option>
              {Object.entries(categories).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Add Button */}
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition font-medium shadow-lg shadow-amber-200"
          >
            <IoAdd className="text-xl" />
            Add FAQ
          </button>
        </div>
      </div>

      {/* FAQ Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <IoClose className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-200 focus:border-amber-500 outline-none"
                >
                  {Object.entries(categories).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Question */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter the frequently asked question"
                  required
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-200 focus:border-amber-500 outline-none"
                />
              </div>

              {/* Answer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Answer <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Enter the detailed answer"
                  required
                  rows={5}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-200 focus:border-amber-500 outline-none resize-none"
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-200 focus:border-amber-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
              </div>

              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">Featured on Homepage</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition font-medium"
                >
                  <IoSave />
                  {editingFaq ? 'Update FAQ' : 'Create FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAQ List */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading FAQs...</p>
          </div>
        ) : faqs.length === 0 ? (
          <div className="p-12 text-center">
            <IoHelpCircleOutline className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No FAQs found</p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-5 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition"
            >
              Add Your First FAQ
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {faqs.map((faq, index) => (
              <div
                key={faq.id}
                className={`p-5 hover:bg-gray-50 transition ${!faq.is_active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Drag Handle */}
                  <div className="pt-1 text-gray-400 cursor-move">
                    <IoReorderThree className="text-xl" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${categoryColors[faq.category]}`}>
                        {categories[faq.category]}
                      </span>
                      {faq.is_featured && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">
                          <IoStar className="text-sm" />
                          Featured
                        </span>
                      )}
                      {!faq.is_active && (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </div>

                    <h4 className="font-semibold text-gray-800 mb-2">{faq.question}</h4>
                    <p className="text-gray-600 text-sm line-clamp-2">{faq.answer}</p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <IoEyeOutline />
                        {faq.views} views
                      </span>
                      <span className="flex items-center gap-1">
                        <IoThumbsUpOutline />
                        {faq.helpful_count} helpful
                      </span>
                      <span className="flex items-center gap-1">
                        <IoThumbsDownOutline />
                        {faq.not_helpful_count} not helpful
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFeatured(faq)}
                      className={`p-2 rounded-lg transition ${
                        faq.is_featured
                          ? 'bg-amber-100 text-amber-600'
                          : 'hover:bg-gray-100 text-gray-400'
                      }`}
                      title={faq.is_featured ? 'Remove from featured' : 'Add to featured'}
                    >
                      {faq.is_featured ? <IoStar /> : <IoStarOutline />}
                    </button>
                    <button
                      onClick={() => toggleActive(faq)}
                      className={`p-2 rounded-lg transition ${
                        faq.is_active
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                      title={faq.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <IoCheckmarkCircle />
                    </button>
                    <button
                      onClick={() => openEditForm(faq)}
                      className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                      title="Edit"
                    >
                      <IoPencil />
                    </button>
                    <button
                      onClick={() => deleteFaq(faq.id)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
                      title="Delete"
                    >
                      <IoTrash />
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

export default FaqManagement;
