import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaHeart,
  FaFolderOpen,
  FaBox,
  FaUndo,
  FaShoppingCart,
  FaTrash,
  FaEye,
  FaCheckCircle,
  FaTruck,
  FaClock,
  FaTimesCircle,
  FaExclamationTriangle,
  FaChevronDown,
  FaChevronUp,
  FaReceipt,
  FaImage
} from 'react-icons/fa';
import api from '../api/api';
import { useFavorites } from '../context/FavoritesContext';

const MyProjectsPage = () => {
  const navigate = useNavigate();
  const { favorites, removeFromFavorites, favoritesCount } = useFavorites();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [expandedComplaint, setExpandedComplaint] = useState(null);
  const [addingToCart, setAddingToCart] = useState(new Set());
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const API_BASE_URL = 'http://127.0.0.1:8000';

  // Tabs configuration
  const tabs = [
    { id: 'orders', label: 'My Orders', icon: FaBox, count: orders.length },
    { id: 'returns', label: 'Returns', icon: FaUndo, count: complaints.length },
    { id: 'projects', label: 'My Projects', icon: FaFolderOpen, count: purchaseHistory.length },
    { id: 'wishlist', label: 'Wishlist', icon: FaHeart, count: favoritesCount }
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      if (activeTab === 'orders') {
        fetchOrders();
      } else if (activeTab === 'returns') {
        fetchComplaints();
      } else if (activeTab === 'projects') {
        fetchPurchaseHistory();
      }
    }
  }, [activeTab, user]);

  const checkAuth = async () => {
    try {
      await api.get('/sanctum/csrf-cookie');
      const response = await api.get('/api/user');
      const userData = response.data?.user ?? response.data?.data ?? null;

      if (!userData) {
        navigate('/login');
        return;
      }

      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/login');
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/orders');
      if (response.data.success) {
        setOrders(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/complaints');
      if (response.data.success) {
        setComplaints(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setError('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/orders');
      if (response.data.success) {
        const allOrders = response.data.data || [];
        // Extract all products from all orders
        const allProducts = allOrders.flatMap(order =>
          (order.order_items || []).map(item => ({
            ...item,
            order_number: order.order_number,
            order_date: order.created_at,
            order_status: order.status
          }))
        );
        setPurchaseHistory(allProducts);
      }
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      setError('Failed to load purchase history');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId) => {
    setAddingToCart(prev => new Set(prev).add(productId));
    try {
      await api.get('/sanctum/csrf-cookie');
      const response = await api.post('/api/cart/add', {
        product_id: productId,
        quantity: 1
      });

      if (response.data.success) {
        setSuccess('Added to cart successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('Failed to add to cart');
      setTimeout(() => setError(''), 3000);
    } finally {
      setAddingToCart(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const getOrderStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: FaClock, label: 'Pending' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: FaTruck, label: 'Processing' },
      shipped: { bg: 'bg-purple-100', text: 'text-purple-800', icon: FaTruck, label: 'Shipped' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800', icon: FaCheckCircle, label: 'Delivered' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: FaTimesCircle, label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getComplaintStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      in_review: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Review' },
      resolved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Resolved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const renderWishlist = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {favorites.length === 0 ? (
        <div className="col-span-full text-center py-16">
          <FaHeart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No items in wishlist</h3>
          <p className="text-gray-500 mb-6">Add products to your wishlist to see them here</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Browse Products
          </button>
        </div>
      ) : (
        favorites.map((product) => {
          const imageUrl = product?.featured_image_url ||
            product?.images?.[0]?.image_url ||
            (product?.images?.[0]?.image_path
              ? `${API_BASE_URL}/storage/${product.images[0].image_path}`
              : null);

          return (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition group">
              <div className="relative h-56 bg-gray-100">
                <img
                  src={imageUrl || 'https://via.placeholder.com/400?text=No+Image'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400?text=No+Image';
                  }}
                />
                <button
                  onClick={() => removeFromFavorites(product.id)}
                  className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-50 transition"
                >
                  <FaTrash className="text-red-500" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-blue-600">
                      ₹{product.sale_price || product.price}
                    </span>
                    {product.sale_price && (
                      <span className="text-sm text-gray-400 line-through">
                        ₹{product.price}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/products/${product.slug}`)}
                    className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium flex items-center justify-center gap-2"
                  >
                    <FaEye />
                    View
                  </button>
                  <button
                    onClick={() => addToCart(product.id)}
                    disabled={addingToCart.has(product.id)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <FaShoppingCart />
                    {addingToCart.has(product.id) ? 'Adding...' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg">
          <FaBox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Order Header */}
            <div
              className="p-6 cursor-pointer hover:bg-gray-50 transition"
              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaReceipt className="text-blue-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Order #{order.order_number}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {getOrderStatusBadge(order.status)}
                  {expandedOrder === order.id ? (
                    <FaChevronUp className="text-gray-400" />
                  ) : (
                    <FaChevronDown className="text-gray-400" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Amount</p>
                  <p className="font-semibold text-gray-900 text-lg">₹{parseFloat(order.total).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Items</p>
                  <p className="font-semibold text-gray-900">{order.order_items?.length || 0} items</p>
                </div>
                <div>
                  <p className="text-gray-600">Payment Method</p>
                  <p className="font-semibold text-gray-900">{order.payment_method}</p>
                </div>
                <div>
                  <p className="text-gray-600">Payment Status</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Expanded Order Details */}
            {expandedOrder === order.id && (
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Shipping Address */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FaTruck className="text-blue-600" />
                      Shipping Address
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{order.shipping_address}</p>
                      <p>{order.shipping_city}, {order.shipping_state} {order.shipping_zip}</p>
                      <p>{order.shipping_country}</p>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Order Details</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Transaction ID:</span> {order.transaction_id}</p>
                      <p><span className="font-medium">Invoice ID:</span> {order.invoice_id}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                  <div className="space-y-3">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex gap-4 bg-white rounded-lg p-4">
                        <img
                          src={item.product?.images?.[0]?.image_path
                            ? `${API_BASE_URL}/storage/${item.product.images[0].image_path}`
                            : 'https://via.placeholder.com/80'}
                          alt={item.product_name}
                          className="w-20 h-20 object-cover rounded"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/80?text=No+Image';
                          }}
                        />
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900">{item.product_name}</h5>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          <p className="text-sm text-gray-600">Price: ₹{parseFloat(item.price).toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">₹{parseFloat(item.subtotal).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderReturns = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading complaints...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg">
          <FaUndo className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No complaints raised</h3>
          <p className="text-gray-500">Your complaint history will appear here</p>
        </div>
      ) : (
        complaints.map((complaint) => (
          <div key={complaint.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Complaint Header */}
            <div
              className="p-6 cursor-pointer hover:bg-gray-50 transition"
              onClick={() => setExpandedComplaint(expandedComplaint === complaint.id ? null : complaint.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <FaExclamationTriangle className="text-red-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Complaint #{complaint.id}</h3>
                    <p className="text-sm text-gray-600">{complaint.product_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {getComplaintStatusBadge(complaint.status)}
                  {expandedComplaint === complaint.id ? (
                    <FaChevronUp className="text-gray-400" />
                  ) : (
                    <FaChevronDown className="text-gray-400" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Issue Type</p>
                  <p className="font-semibold text-gray-900">{complaint.issue_type}</p>
                </div>
                <div>
                  <p className="text-gray-600">Order Number</p>
                  <p className="font-semibold text-gray-900">#{complaint.order?.order_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Submitted On</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Expanded Complaint Details */}
            {expandedComplaint === complaint.id && (
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600 text-sm">{complaint.description}</p>
                  </div>

                  {complaint.images && complaint.images.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FaImage className="text-blue-600" />
                        Evidence Images ({complaint.images.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {complaint.images.map((imagePath, index) => (
                          <img
                            key={index}
                            src={`${API_BASE_URL}/storage/${imagePath}`}
                            alt={`Evidence ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {complaint.admin_response && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Admin Response</h4>
                      <p className="text-gray-700 text-sm">{complaint.admin_response}</p>
                    </div>
                  )}

                  {complaint.resolved_at && (
                    <div className="text-sm text-gray-600">
                      <p><span className="font-medium">Resolved On:</span> {new Date(complaint.resolved_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderProjects = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {loading ? (
        <div className="col-span-full text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchase history...</p>
        </div>
      ) : purchaseHistory.length === 0 ? (
        <div className="col-span-full text-center py-16">
          <FaFolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No purchase history</h3>
          <p className="text-gray-500 mb-6">Products you've purchased will appear here</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        purchaseHistory.map((item) => {
          const imageUrl = item.product?.images?.[0]?.image_path
            ? `${API_BASE_URL}/storage/${item.product.images[0].image_path}`
            : 'https://via.placeholder.com/400';

          return (
            <div key={`${item.order_number}-${item.id}`} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
              <div className="relative h-56 bg-gray-100">
                <img
                  src={imageUrl}
                  alt={item.product_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400?text=No+Image';
                  }}
                />
                <div className="absolute top-3 right-3">
                  {getOrderStatusBadge(item.order_status)}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.product_name}</h3>
                <div className="space-y-2 text-sm text-gray-600 mb-3">
                  <p><span className="font-medium">Order:</span> #{item.order_number}</p>
                  <p><span className="font-medium">Quantity:</span> {item.quantity}</p>
                  <p><span className="font-medium">Price:</span> ₹{parseFloat(item.price).toFixed(2)}</p>
                  <p><span className="font-medium">Purchased:</span> {new Date(item.order_date).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (item.product) {
                        navigate(`/products/${item.product.slug}`);
                      }
                    }}
                    className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium flex items-center justify-center gap-2"
                  >
                    <FaEye />
                    View
                  </button>
                  <button
                    onClick={() => {
                      if (item.product) {
                        addToCart(item.product.id);
                      }
                    }}
                    disabled={!item.product || addingToCart.has(item.product?.id)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <FaShoppingCart />
                    Buy Again
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-600">Manage your orders, returns, and wishlist</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <FaCheckCircle className="text-green-500" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <FaExclamationTriangle className="text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-4 border-b-2 transition font-medium whitespace-nowrap ${
                    isActive
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'wishlist' && renderWishlist()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'returns' && renderReturns()}
          {activeTab === 'projects' && renderProjects()}
        </div>
      </div>
    </div>
  );
};

export default MyProjectsPage;
