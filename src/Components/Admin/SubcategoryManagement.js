import React, { useState, useEffect } from 'react';
import {
  IoAdd,
  IoClose,
  IoTrash,
  IoSave,
  IoPencil,
  IoSearchOutline,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoLayersOutline,
  IoChevronDown
} from 'react-icons/io5';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const SubcategoryManagement = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [form, setForm] = useState({
    category_id: '',
    name: '',
    slug: '',
    description: '',
    sort_order: 0,
    is_active: true
  });

  // Fetch subcategories
  const fetchSubcategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/subcategories`);
      const data = await response.json();
      if (data.success) {
        setSubcategories(data.data);
      }
    } catch (err) {
      setError('Failed to fetch subcategories');
      console.error(err);
    }
    setLoading(false);
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    fetchSubcategories();
    fetchCategories();
  }, []);

  // Generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;

    setForm(prev => {
      const updated = { ...prev, [name]: newValue };
      if (name === 'name' && value.trim()) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const url = editingItem
        ? `${API_BASE_URL}/subcategories/${editingItem.id}`
        : `${API_BASE_URL}/subcategories`;

      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          sort_order: parseInt(form.sort_order) || 0
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(editingItem ? 'Subcategory updated successfully!' : 'Subcategory created successfully!');
        resetForm();
        fetchSubcategories();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to save subcategory');
      }
    } catch (err) {
      setError('Error saving subcategory: ' + err.message);
    }
    setLoading(false);
  };

  // Delete subcategory
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subcategory?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/subcategories/${id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Subcategory deleted successfully!');
        fetchSubcategories();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to delete subcategory');
      }
    } catch (err) {
      setError('Error deleting subcategory: ' + err.message);
    }
    setLoading(false);
  };

  // Edit subcategory
  const handleEdit = (subcategory) => {
    setEditingItem(subcategory);
    setForm({
      category_id: subcategory.category_id,
      name: subcategory.name,
      slug: subcategory.slug,
      description: subcategory.description || '',
      sort_order: subcategory.sort_order || 0,
      is_active: subcategory.is_active !== undefined ? subcategory.is_active : true
    });
    setShowForm(true);
  };

  // Reset form
  const resetForm = () => {
    setForm({
      category_id: '',
      name: '',
      slug: '',
      description: '',
      sort_order: 0,
      is_active: true
    });
    setEditingItem(null);
    setShowForm(false);
    setError('');
  };

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === parseInt(categoryId));
    return category ? category.name : 'Unknown';
  };

  // Filter subcategories
  const filteredSubcategories = subcategories.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || sub.category_id === parseInt(filterCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Subcategory Management</h2>
            <p className="text-gray-600">Organize products into subcategories for mega menu dropdowns</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Category Filter */}
            <div className="relative flex-1 sm:flex-initial">
              <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full sm:w-48 pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none appearance-none bg-white"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search subcategories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-56 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
            </div>

            {/* Add Button */}
            <button
              onClick={() => {
                setEditingItem(null);
                setShowForm(true);
              }}
              className="group relative px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
            >
              <IoAdd size={20} className="group-hover:rotate-90 transition-transform" />
              Add Subcategory
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="animate-in slide-in-from-top duration-300">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center shadow-sm">
            <IoCheckmarkCircle className="mr-3 text-green-600 flex-shrink-0" size={22} />
            <div className="flex-1 text-green-800 font-medium">{success}</div>
            <button onClick={() => setSuccess('')} className="ml-2 p-1.5 hover:bg-green-100 rounded-lg transition">
              <IoClose size={18} className="text-green-600" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="animate-in slide-in-from-top duration-300">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center shadow-sm">
            <IoCloseCircle className="mr-3 text-red-600 flex-shrink-0" size={22} />
            <div className="flex-1 text-red-800 font-medium">{error}</div>
            <button onClick={() => setError('')} className="ml-2 p-1.5 hover:bg-red-100 rounded-lg transition">
              <IoClose size={18} className="text-red-600" />
            </button>
          </div>
        </div>
      )}

      {/* Subcategories Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 overflow-hidden">
        {loading && !showForm ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-gray-600 font-medium">Loading subcategories...</p>
          </div>
        ) : filteredSubcategories.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 mb-4">
              <IoLayersOutline size={32} className="text-gray-400" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">No subcategories found</p>
            <p className="text-sm text-gray-500">
              {searchQuery || filterCategory ? 'Try a different search or filter' : 'Click "Add Subcategory" to create your first subcategory'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200/50 bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Subcategory</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {filteredSubcategories.map((subcategory) => (
                  <tr key={subcategory.id} className="group hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center ring-1 ring-purple-200">
                          <IoLayersOutline className="text-purple-600" size={18} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{subcategory.name}</div>
                          {subcategory.description && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">{subcategory.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 text-xs font-medium rounded-lg bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800">
                        {getCategoryName(subcategory.category_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs text-gray-600 font-mono bg-gray-100 px-3 py-1.5 rounded-lg">
                        {subcategory.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">{subcategory.sort_order}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-lg ${
                        subcategory.is_active
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {subcategory.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(subcategory)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <IoPencil size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(subcategory.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          <IoTrash size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingItem ? 'Edit Subcategory' : 'Add New Subcategory'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Subcategories organize products in mega menu</p>
                </div>
                <button
                  onClick={resetForm}
                  className="p-2 rounded-xl hover:bg-white/80 transition-colors"
                >
                  <IoClose size={24} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Parent Category *</label>
                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subcategory Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Premium Cards, Budget Cards"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Slug</label>
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="auto-generated-slug"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate from name</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Brief description of this subcategory..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all resize-none"
                />
              </div>

              {/* Sort Order & Active */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sort Order</label>
                  <input
                    type="number"
                    name="sort_order"
                    value={form.sort_order}
                    onChange={handleChange}
                    min="0"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all"
                  />
                </div>
                <div className="flex items-center pt-8">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleChange}
                      className="h-5 w-5 text-purple-600 focus:ring-4 focus:ring-purple-100 border-gray-300 rounded cursor-pointer"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">Active</span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <IoSave size={18} />
                  {loading ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubcategoryManagement;
