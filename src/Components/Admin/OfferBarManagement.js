import React, { useState, useEffect } from 'react';
import {
  IoAdd,
  IoClose,
  IoTrash,
  IoSave,
  IoPencil,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoMegaphoneOutline
} from 'react-icons/io5';
import axios from 'axios';

const OfferBarManagement = () => {
  const [offerBars, setOfferBars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

  const [offerForm, setOfferForm] = useState({
    message: '',
    background_color: '#000000',
    text_color: '#ffffff',
    sort_order: 0,
    is_active: true,
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchOfferBars();
  }, []);

  const fetchOfferBars = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/offer-bars`);
      if (response.data.success) {
        setOfferBars(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching offer bars:', err);
      setError('Failed to load offer bars');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOfferForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingOffer) {
        await axios.put(`${API_BASE_URL}/offer-bars/${editingOffer.id}`, offerForm);
        setSuccess('Offer bar updated successfully!');
      } else {
        await axios.post(`${API_BASE_URL}/offer-bars`, offerForm);
        setSuccess('Offer bar created successfully!');
      }

      fetchOfferBars();
      resetForm();
    } catch (err) {
      console.error('Error saving offer bar:', err);
      setError(err.response?.data?.message || 'Failed to save offer bar');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setOfferForm({
      message: offer.message,
      background_color: offer.background_color,
      text_color: offer.text_color,
      sort_order: offer.sort_order,
      is_active: offer.is_active,
      start_date: offer.start_date ? offer.start_date.split('T')[0] : '',
      end_date: offer.end_date ? offer.end_date.split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this offer bar?')) return;

    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/offer-bars/${id}`);
      setSuccess('Offer bar deleted successfully!');
      fetchOfferBars();
    } catch (err) {
      console.error('Error deleting offer bar:', err);
      setError('Failed to delete offer bar');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setOfferForm({
      message: '',
      background_color: '#000000',
      text_color: '#ffffff',
      sort_order: 0,
      is_active: true,
      start_date: '',
      end_date: '',
    });
    setEditingOffer(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Offer Bar Management</h2>
            <p className="text-gray-600">Manage top notification bars for announcements and offers</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="group relative px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2"
          >
            <IoAdd size={20} />
            <span>Add New Offer Bar</span>
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
                  {editingOffer ? 'Edit Offer Bar' : 'Add New Offer Bar'}
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
              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Offer Message *
                </label>
                <textarea
                  name="message"
                  value={offerForm.message}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  placeholder="e.g., 🚚 FREE SHIPPING on all Orders! | 📞 Need Assistance? Call at 02522-669393"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                />
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="background_color"
                      value={offerForm.background_color}
                      onChange={handleInputChange}
                      className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={offerForm.background_color}
                      onChange={(e) => setOfferForm(prev => ({ ...prev, background_color: e.target.value }))}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Text Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="text_color"
                      value={offerForm.text_color}
                      onChange={handleInputChange}
                      className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={offerForm.text_color}
                      onChange={(e) => setOfferForm(prev => ({ ...prev, text_color: e.target.value }))}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preview
                </label>
                <div
                  style={{
                    backgroundColor: offerForm.background_color,
                    color: offerForm.text_color
                  }}
                  className="p-4 rounded-xl text-center font-medium"
                >
                  {offerForm.message || 'Your offer message will appear here...'}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={offerForm.start_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={offerForm.end_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  />
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
                  value={offerForm.sort_order}
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
                  checked={offerForm.is_active}
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
                  <span>{loading ? 'Saving...' : editingOffer ? 'Update Offer' : 'Create Offer'}</span>
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

      {/* Offer Bars List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Preview</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Message</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {offerBars.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <IoMegaphoneOutline className="mx-auto mb-3 text-gray-400" size={48} />
                    <p className="text-gray-500 font-medium">No offer bars found</p>
                    <p className="text-sm text-gray-400 mt-1">Create your first offer bar to get started</p>
                  </td>
                </tr>
              ) : (
                offerBars.map((offer) => (
                  <tr key={offer.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div
                        style={{
                          backgroundColor: offer.background_color,
                          color: offer.text_color
                        }}
                        className="w-32 px-3 py-2 rounded-lg text-xs font-medium text-center truncate"
                      >
                        Preview
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 max-w-md truncate">{offer.message}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {offer.start_date && <p>From: {new Date(offer.start_date).toLocaleDateString()}</p>}
                        {offer.end_date && <p>To: {new Date(offer.end_date).toLocaleDateString()}</p>}
                        {!offer.start_date && !offer.end_date && <p className="text-gray-400">Always active</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-lg ${
                        offer.is_active
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800'
                          : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800'
                      }`}>
                        {offer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(offer)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <IoPencil className="text-blue-600" size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(offer.id)}
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

export default OfferBarManagement;
