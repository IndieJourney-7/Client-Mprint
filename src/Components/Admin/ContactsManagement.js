import React, { useState, useEffect } from 'react';
import {
  IoMailOutline,
  IoMailOpenOutline,
  IoCallOutline,
  IoTrash,
  IoClose,
  IoCheckmarkCircle,
  IoTimeOutline,
  IoAlertCircle,
  IoSearch,
  IoFilter,
  IoRefresh,
  IoEyeOutline,
  IoChevronDown,
  IoChevronUp,
  IoPersonOutline,
  IoDocumentAttachOutline,
  IoDownloadOutline,
  IoSendOutline,
  IoFlashOutline,
  IoChevronBack,
  IoChevronForward,
} from 'react-icons/io5';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const ContactsManagement = () => {
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Selected contact for detail view
  const [selectedContact, setSelectedContact] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Inquiry type labels
  const inquiryTypes = {
    order_status: 'Order Status & Tracking',
    order_issue: 'Order Issues',
    product_question: 'Product Questions',
    design_help: 'Design & Artwork Help',
    bulk_quote: 'Bulk Order Quote',
    returns_refunds: 'Returns & Refunds',
    print_quality: 'Print Quality Concern',
    shipping: 'Shipping & Delivery',
    billing: 'Billing & Invoice',
    website_issue: 'Website Technical Issue',
    partnership: 'Partnership & Business',
    other: 'Other',
  };

  // Status colors
  const statusColors = {
    new: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-700',
  };

  // Priority colors
  const priorityColors = {
    low: 'bg-gray-100 text-gray-600',
    normal: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    urgent: 'bg-red-100 text-red-600',
  };

  // Fetch contacts
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('inquiry_type', typeFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      params.append('page', currentPage);
      params.append('per_page', perPage);

      const response = await fetch(`${API_BASE_URL}/admin/contacts?${params}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setContacts(data.data.data);
        setTotalPages(data.data.last_page);
      }
    } catch (err) {
      setError('Failed to fetch contacts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/contacts/stats`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchStats();
  }, [currentPage, statusFilter, typeFilter, priorityFilter, perPage]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchContacts();
  };

  // View contact details
  const viewContact = async (contact) => {
    setSelectedContact(contact);
    setAdminNotes(contact.admin_notes || '');

    // Mark as read if not already
    if (!contact.is_read) {
      try {
        await fetch(`${API_BASE_URL}/admin/contacts/${contact.id}/mark-read`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        // Update local state
        setContacts((prev) =>
          prev.map((c) => (c.id === contact.id ? { ...c, is_read: true } : c))
        );
        fetchStats();
      } catch (err) {
        console.error('Failed to mark as read', err);
      }
    }
  };

  // Update contact status
  const updateContactStatus = async (id, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/contacts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Status updated successfully');
        setContacts((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status } : c))
        );
        if (selectedContact?.id === id) {
          setSelectedContact((prev) => ({ ...prev, status }));
        }
        fetchStats();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to update status');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Update admin notes
  const updateAdminNotes = async () => {
    if (!selectedContact) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/contacts/${selectedContact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ admin_notes: adminNotes }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Notes saved successfully');
        setSelectedContact((prev) => ({ ...prev, admin_notes: adminNotes }));
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to save notes');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Delete contact
  const deleteContact = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/contacts/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Contact deleted successfully');
        setContacts((prev) => prev.filter((c) => c.id !== id));
        if (selectedContact?.id === id) {
          setSelectedContact(null);
        }
        fetchStats();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to delete contact');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get ticket number
  const getTicketNumber = (id) => `TKT-${String(id).padStart(6, '0')}`;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="text-3xl font-bold">{stats.new}</div>
            <div className="text-blue-100 text-sm">New</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-4 text-white">
            <div className="text-3xl font-bold">{stats.in_progress}</div>
            <div className="text-yellow-100 text-sm">In Progress</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-4 text-white">
            <div className="text-3xl font-bold">{stats.resolved}</div>
            <div className="text-green-100 text-sm">Resolved</div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-xl p-4 text-white">
            <div className="text-3xl font-bold">{stats.urgent}</div>
            <div className="text-red-100 text-sm">Urgent</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl p-4 text-white">
            <div className="text-3xl font-bold">{stats.unread}</div>
            <div className="text-purple-100 text-sm">Unread</div>
          </div>
          <div className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl p-4 text-white">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-gray-300 text-sm">Total</div>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <IoCheckmarkCircle className="text-xl" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <IoAlertCircle className="text-xl" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <div className="relative">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, subject..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-500 outline-none"
              />
            </div>
          </form>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-500 outline-none"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-500 outline-none"
          >
            <option value="">All Types</option>
            {Object.entries(inquiryTypes).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-500 outline-none"
          >
            <option value="">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>

          {/* Refresh */}
          <button
            onClick={() => { fetchContacts(); fetchStats(); }}
            className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
          >
            <IoRefresh className="text-xl" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Contact List */}
        <div className={`flex-1 ${selectedContact ? 'lg:w-1/2' : 'w-full'}`}>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading contacts...</p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-12 text-center">
                <IoMailOutline className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No contacts found</p>
              </div>
            ) : (
              <>
                {/* Contact Items */}
                <div className="divide-y">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => viewContact(contact)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                        selectedContact?.id === contact.id ? 'bg-amber-50 border-l-4 border-amber-500' : ''
                      } ${!contact.is_read ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {!contact.is_read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                            <span className="font-semibold text-gray-800 truncate">
                              {contact.name}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[contact.priority]}`}>
                              {contact.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">{contact.subject}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <IoMailOutline />
                              {contact.email}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full ${statusColors[contact.status]}`}>
                              {contact.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-500 flex-shrink-0">
                          <div>{formatDate(contact.created_at)}</div>
                          <div className="text-gray-400 mt-1">{getTicketNumber(contact.id)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <IoChevronBack />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <IoChevronForward />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Contact Detail Panel */}
        {selectedContact && (
          <div className="hidden lg:block lg:w-1/2">
            <div className="bg-white rounded-xl shadow-sm border sticky top-6">
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between bg-gray-50 rounded-t-xl">
                <div>
                  <h3 className="font-bold text-gray-800">{getTicketNumber(selectedContact.id)}</h3>
                  <p className="text-sm text-gray-500">{formatDate(selectedContact.created_at)}</p>
                </div>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition"
                >
                  <IoClose className="text-xl" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Customer Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <IoPersonOutline />
                    Customer Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name</span>
                      <span className="font-medium">{selectedContact.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email</span>
                      <a href={`mailto:${selectedContact.email}`} className="text-amber-600 hover:underline">
                        {selectedContact.email}
                      </a>
                    </div>
                    {selectedContact.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone</span>
                        <a href={`tel:${selectedContact.phone}`} className="text-amber-600 hover:underline">
                          {selectedContact.phone}
                        </a>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Preferred Contact</span>
                      <span className="capitalize">{selectedContact.preferred_contact}</span>
                    </div>
                  </div>
                </div>

                {/* Inquiry Details */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Inquiry Details</h4>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedContact.status]}`}>
                        {selectedContact.status.replace('_', ' ')}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[selectedContact.priority]}`}>
                        {selectedContact.priority} priority
                      </span>
                    </div>
                    <div className="bg-amber-50 px-3 py-2 rounded-lg text-sm">
                      <span className="text-amber-700 font-medium">
                        {inquiryTypes[selectedContact.inquiry_type] || selectedContact.inquiry_type}
                      </span>
                    </div>
                    {selectedContact.order_number && (
                      <div className="text-sm">
                        <span className="text-gray-500">Order Number: </span>
                        <span className="font-medium">{selectedContact.order_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subject & Message */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Subject</h4>
                  <p className="text-gray-800">{selectedContact.subject}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Message</h4>
                  <div className="bg-gray-50 rounded-lg p-4 text-gray-700 text-sm whitespace-pre-wrap">
                    {selectedContact.message}
                  </div>
                </div>

                {/* Attachment */}
                {selectedContact.attachment && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <IoDocumentAttachOutline />
                      Attachment
                    </h4>
                    <a
                      href={`http://127.0.0.1:8000/storage/${selectedContact.attachment}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-amber-600 hover:text-amber-700 text-sm"
                    >
                      <IoDownloadOutline />
                      Download Attachment
                    </a>
                  </div>
                )}

                {/* Status Actions */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Update Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {['new', 'in_progress', 'resolved', 'closed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateContactStatus(selectedContact.id, status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          selectedContact.status === status
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Internal Notes</h4>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    placeholder="Add internal notes (not visible to customer)..."
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-500 outline-none text-sm resize-none"
                  />
                  <button
                    onClick={updateAdminNotes}
                    className="mt-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition"
                  >
                    Save Notes
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="pt-4 border-t flex gap-3">
                  <a
                    href={`mailto:${selectedContact.email}?subject=Re: ${selectedContact.subject}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition font-medium"
                  >
                    <IoSendOutline />
                    Reply via Email
                  </a>
                  <button
                    onClick={() => deleteContact(selectedContact.id)}
                    className="px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                  >
                    <IoTrash />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsManagement;
