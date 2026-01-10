import React, { useState, useEffect } from 'react';
import {
  IoAdd,
  IoClose,
  IoSave,
  IoPencil,
  IoTrash,
  IoDocumentTextOutline,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoSearchOutline,
  IoShieldCheckmark,
  IoRefresh,
  IoEyeOutline,
  IoTimeOutline
} from 'react-icons/io5';

const PolicyManagement = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewPolicy, setPreviewPolicy] = useState(null);

  const API_BASE_URL = 'http://127.0.0.1:8000/api';

  // Policy types
  const policyTypes = {
    terms: { label: 'Terms and Conditions', color: 'bg-blue-500', icon: IoDocumentTextOutline },
    privacy: { label: 'Privacy Policy', color: 'bg-green-500', icon: IoShieldCheckmark },
    refund: { label: 'Refund Policy', color: 'bg-amber-500', icon: IoRefresh },
    shipping: { label: 'Shipping Policy', color: 'bg-purple-500', icon: IoTimeOutline },
  };

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'terms',
    content: '',
    meta_title: '',
    meta_description: '',
    is_active: true,
  });

  // Fetch policies
  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/admin/policies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setPolicies(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching policies:', err);
      setError('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingPolicy
        ? `${API_BASE_URL}/admin/policies/${editingPolicy.id}`
        : `${API_BASE_URL}/admin/policies`;

      const response = await fetch(url, {
        method: editingPolicy ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(editingPolicy ? 'Policy updated successfully!' : 'Policy created successfully!');
        setShowModal(false);
        resetForm();
        fetchPolicies();
      } else {
        setError(data.message || 'Failed to save policy');
      }
    } catch (err) {
      console.error('Error saving policy:', err);
      setError('Failed to save policy');
    }
  };

  // Delete policy
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/admin/policies/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Policy deleted successfully!');
        fetchPolicies();
      } else {
        setError(data.message || 'Failed to delete policy');
      }
    } catch (err) {
      console.error('Error deleting policy:', err);
      setError('Failed to delete policy');
    }
  };

  // Toggle active status
  const handleToggleActive = async (id) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/admin/policies/${id}/toggle-active`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Policy status updated!');
        fetchPolicies();
      }
    } catch (err) {
      console.error('Error toggling policy status:', err);
      setError('Failed to update policy status');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      type: 'terms',
      content: '',
      meta_title: '',
      meta_description: '',
      is_active: true,
    });
    setEditingPolicy(null);
  };

  // Open edit modal
  const openEditModal = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      title: policy.title,
      type: policy.type,
      content: policy.content,
      meta_title: policy.meta_title || '',
      meta_description: policy.meta_description || '',
      is_active: policy.is_active,
    });
    setShowModal(true);
  };

  // Open add modal
  const openAddModal = () => {
    resetForm();
    // Find first missing policy type
    const existingTypes = policies.map(p => p.type);
    const availableTypes = Object.keys(policyTypes).filter(t => !existingTypes.includes(t));
    if (availableTypes.length > 0) {
      setFormData(prev => ({
        ...prev,
        type: availableTypes[0],
        title: policyTypes[availableTypes[0]].label,
      }));
    }
    setShowModal(true);
  };

  // Get missing policy types
  const getMissingTypes = () => {
    const existingTypes = policies.map(p => p.type);
    return Object.keys(policyTypes).filter(t => !existingTypes.includes(t));
  };

  // Filter policies
  const filteredPolicies = policies.filter(policy =>
    policy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    policy.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Policy Management</h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage your store policies - Terms, Privacy, Refund & Shipping
            </p>
          </div>
          <button
            onClick={openAddModal}
            disabled={getMissingTypes().length === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
              getMissingTypes().length === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-200'
            }`}
          >
            <IoAdd className="text-xl" />
            Add Policy
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <IoCheckmarkCircle className="text-xl" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <IoCloseCircle className="text-xl" />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(policyTypes).map(([type, config]) => {
          const policy = policies.find(p => p.type === type);
          const Icon = config.icon;
          return (
            <div
              key={type}
              className={`bg-white rounded-2xl p-4 border ${
                policy ? 'border-gray-200' : 'border-dashed border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${config.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="text-white text-xl" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{config.label}</p>
                  <p className={`font-semibold ${policy ? 'text-gray-800' : 'text-gray-400'}`}>
                    {policy ? (policy.is_active ? 'Active' : 'Inactive') : 'Not Set'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200">
        <div className="relative">
          <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            placeholder="Search policies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition"
          />
        </div>
      </div>

      {/* Policies List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading policies...</p>
        </div>
      ) : filteredPolicies.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
          <IoDocumentTextOutline className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Policies Found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'No policies match your search.' : 'Start by adding your store policies.'}
          </p>
          {!searchQuery && getMissingTypes().length > 0 && (
            <button
              onClick={openAddModal}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2.5 rounded-xl font-medium hover:shadow-lg transition"
            >
              Add First Policy
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPolicies.map((policy) => {
            const config = policyTypes[policy.type] || { label: policy.type, color: 'bg-gray-500', icon: IoDocumentTextOutline };
            const Icon = config.icon;

            return (
              <div
                key={policy.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 ${config.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon className="text-white text-2xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-800 text-lg">{policy.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            policy.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {policy.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">
                          Version {policy.version} • Last updated: {formatDate(policy.last_updated_at)}
                        </p>
                        <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                          {policy.content.substring(0, 200)}...
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewPolicy(policy)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                        title="Preview"
                      >
                        <IoEyeOutline className="text-xl" />
                      </button>
                      <button
                        onClick={() => openEditModal(policy)}
                        className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition"
                        title="Edit"
                      >
                        <IoPencil className="text-xl" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(policy.id)}
                        className={`p-2 rounded-lg transition ${
                          policy.is_active
                            ? 'text-green-500 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={policy.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {policy.is_active ? (
                          <IoCheckmarkCircle className="text-xl" />
                        ) : (
                          <IoCloseCircle className="text-xl" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(policy.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <IoTrash className="text-xl" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                {editingPolicy ? 'Edit Policy' : 'Add New Policy'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition"
              >
                <IoClose className="text-2xl text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Policy Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Policy Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const type = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        type,
                        title: policyTypes[type]?.label || prev.title,
                      }));
                    }}
                    disabled={editingPolicy}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition disabled:bg-gray-100"
                  >
                    {Object.entries(policyTypes).map(([type, config]) => {
                      const exists = policies.find(p => p.type === type && (!editingPolicy || p.id !== editingPolicy.id));
                      return (
                        <option key={type} value={type} disabled={exists}>
                          {config.label} {exists ? '(Already exists)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition"
                    placeholder="e.g., Terms and Conditions"
                    required
                  />
                </div>

                {/* Meta Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition"
                    placeholder="SEO meta title"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-sm font-medium text-gray-700">Active (visible to users)</span>
                  </label>
                </div>

                {/* Meta Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.meta_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition"
                    placeholder="Brief description for search engines"
                  />
                </div>

                {/* Content */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Policy Content *
                  </label>
                  <div className="text-xs text-gray-500 mb-2">
                    Use markdown formatting: **bold**, *italic*, - bullet points, ## headings
                  </div>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition resize-none font-mono text-sm"
                    rows={15}
                    placeholder="Enter your policy content here...

Example:
## 1. Introduction
Welcome to Mprints. These terms and conditions govern your use of our website...

## 2. Definitions
**'We', 'us', 'our'** refers to Mprints...

## 3. Use of Service
- You must be at least 18 years old
- You agree to provide accurate information
- You are responsible for maintaining account security"
                    required
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-200 transition font-medium flex items-center gap-2"
                >
                  <IoSave className="text-lg" />
                  {editingPolicy ? 'Update Policy' : 'Create Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewPolicy && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <div>
                <h3 className="text-xl font-bold">{previewPolicy.title}</h3>
                <p className="text-amber-100 text-sm">Version {previewPolicy.version}</p>
              </div>
              <button
                onClick={() => setPreviewPolicy(null)}
                className="p-2 hover:bg-white/20 rounded-xl transition"
              >
                <IoClose className="text-2xl" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="prose prose-sm max-w-none">
                {previewPolicy.content.split('\n').map((line, idx) => {
                  // Simple markdown-like rendering
                  if (line.startsWith('## ')) {
                    return <h2 key={idx} className="text-lg font-bold text-gray-800 mt-6 mb-3">{line.replace('## ', '')}</h2>;
                  }
                  if (line.startsWith('### ')) {
                    return <h3 key={idx} className="text-base font-semibold text-gray-700 mt-4 mb-2">{line.replace('### ', '')}</h3>;
                  }
                  if (line.startsWith('- ')) {
                    return <li key={idx} className="text-gray-600 ml-4">{line.replace('- ', '')}</li>;
                  }
                  if (line.trim() === '') {
                    return <br key={idx} />;
                  }
                  return <p key={idx} className="text-gray-600 mb-2">{line}</p>;
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyManagement;
