import React, { useState, useEffect } from 'react';
import {
  IoRefresh,
  IoSearchOutline,
  IoEyeOutline,
  IoClose,
  IoChevronBack,
  IoChevronForward,
  IoDownloadOutline,
  IoImageOutline,
  IoTimeOutline,
  IoFolderOutline,
} from 'react-icons/io5';

const UserUploadsManagement = () => {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const API_BASE_URL = 'http://127.0.0.1:8000/api';

  // Fetch designs
  const fetchDesigns = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
        sort_by: 'created_at',
        sort_order: 'desc',
      });
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/admin/designs?${params}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();

      if (data.success) {
        setDesigns(data.data.data || []);
        setCurrentPage(data.data.current_page || 1);
        setTotalPages(data.data.last_page || 1);
      } else {
        setError(data.message || 'Failed to fetch designs');
      }
    } catch (err) {
      setError('Failed to fetch designs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/admin/uploads/stats`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return bytes + ' B';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    fetchStats();
    fetchDesigns(1);
  }, []);

  useEffect(() => {
    fetchDesigns(1);
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Designs</h2>
          <p className="text-gray-500 mt-1">View all user created designs</p>
        </div>
        <button
          onClick={() => {
            fetchStats();
            fetchDesigns(1);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition"
        >
          <IoRefresh size={18} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <IoImageOutline size={24} />
              </div>
              <div>
                <p className="text-white/80 text-sm">Total Designs</p>
                <p className="text-2xl font-bold">{stats.total_designs || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <IoFolderOutline size={24} />
              </div>
              <div>
                <p className="text-white/80 text-sm">Storage Used</p>
                <p className="text-2xl font-bold">{stats.total_storage || '0 KB'}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <IoTimeOutline size={24} />
              </div>
              <div>
                <p className="text-white/80 text-sm">Today's Designs</p>
                <p className="text-2xl font-bold">{stats.designs_today || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <IoEyeOutline size={18} />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <IoClose size={18} />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <IoClose size={18} />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search designs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        /* Designs Table */
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Design</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">User</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Product</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Created</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {designs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <IoImageOutline size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No designs found</p>
                  </td>
                </tr>
              ) : (
                designs.map((design) => (
                  <tr key={design.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {design.front_thumbnail_url && (
                            <img
                              src={design.front_thumbnail_url}
                              alt="Front"
                              className="w-12 h-8 object-cover rounded border"
                            />
                          )}
                          {design.back_thumbnail_url && (
                            <img
                              src={design.back_thumbnail_url}
                              alt="Back"
                              className="w-12 h-8 object-cover rounded border"
                            />
                          )}
                          {!design.front_thumbnail_url && !design.back_thumbnail_url && (
                            <div className="w-12 h-8 bg-gray-100 rounded border flex items-center justify-center">
                              <IoImageOutline className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">{design.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="text-gray-900">{design.user?.name || 'Unknown'}</p>
                        <p className="text-gray-500 text-xs">{design.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {design.product?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          design.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : design.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {design.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(design.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedDesign(design);
                            setShowPreviewModal(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="View Design"
                        >
                          <IoEyeOutline size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => fetchDesigns(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IoChevronBack size={18} />
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => fetchDesigns(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IoChevronForward size={18} />
          </button>
        </div>
      )}

      {/* Preview Modal - Shows both Front and Back designs */}
      {showPreviewModal && selectedDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedDesign.name}</h3>
                <p className="text-sm text-gray-500">
                  Created by: {selectedDesign.user?.name || 'Unknown'} ({selectedDesign.user?.email || '-'})
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Product: {selectedDesign.product?.name || '-'} • Status: {selectedDesign.status}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedDesign(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <IoClose size={24} />
              </button>
            </div>
            
            {/* Scrollable content area with both images */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
              <div className="space-y-6">
                {/* Front Design */}
                {selectedDesign.front_original_url && (
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                        Front Design
                      </h4>
                      <a
                        href={selectedDesign.front_original_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        <IoDownloadOutline size={16} />
                        Download
                      </a>
                    </div>
                    <div className="flex justify-center bg-gray-50 rounded-lg p-4">
                      <img
                        src={selectedDesign.front_original_url}
                        alt="Front Design"
                        className="max-w-full max-h-[400px] object-contain rounded-lg shadow-lg"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Back Design */}
                {selectedDesign.back_original_url && (
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                        Back Design
                      </h4>
                      <a
                        href={selectedDesign.back_original_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                      >
                        <IoDownloadOutline size={16} />
                        Download
                      </a>
                    </div>
                    <div className="flex justify-center bg-gray-50 rounded-lg p-4">
                      <img
                        src={selectedDesign.back_original_url}
                        alt="Back Design"
                        className="max-w-full max-h-[400px] object-contain rounded-lg shadow-lg"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {/* No designs available */}
                {!selectedDesign.front_original_url && !selectedDesign.back_original_url && (
                  <div className="text-center py-12 text-gray-500">
                    <IoImageOutline size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No design images available</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t flex items-center justify-between bg-gray-50 flex-shrink-0">
              <div className="text-sm text-gray-500">
                Created: {formatDate(selectedDesign.created_at)}
              </div>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedDesign(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserUploadsManagement;
