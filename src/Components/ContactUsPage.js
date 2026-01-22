import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaPaperPlane,
  FaCheckCircle,
  FaExclamationCircle,
  FaUpload,
  FaTimes,
  FaQuestionCircle,
  FaShoppingBag,
  FaPrint,
  FaUndo,
  FaTruck,
  FaHandshake,
  FaPalette,
  FaFileInvoice,
  FaDesktop,
  FaBoxOpen,
} from "react-icons/fa";
import api from "../api/api";

const ContactUsPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    inquiry_type: "",
    order_number: "",
    product_name: "",
    subject: "",
    message: "",
    preferred_contact: "email",
  });

  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  // Inquiry types with icons
  const inquiryTypes = [
    { value: "order_status", label: "Order Status & Tracking", icon: FaTruck },
    { value: "order_issue", label: "Order Issues", icon: FaShoppingBag },
    { value: "product_question", label: "Product Questions", icon: FaQuestionCircle },
    { value: "design_help", label: "Design & Artwork Help", icon: FaPalette },
    { value: "bulk_quote", label: "Bulk Order Quote", icon: FaBoxOpen },
    { value: "returns_refunds", label: "Returns & Refunds", icon: FaUndo },
    { value: "print_quality", label: "Print Quality Concern", icon: FaPrint },
    { value: "shipping", label: "Shipping & Delivery", icon: FaTruck },
    { value: "billing", label: "Billing & Invoice", icon: FaFileInvoice },
    { value: "website_issue", label: "Website Technical Issue", icon: FaDesktop },
    { value: "partnership", label: "Partnership & Business", icon: FaHandshake },
    { value: "other", label: "Other", icon: FaQuestionCircle },
  ];

  // Fields that require order number
  const orderRelatedTypes = ["order_status", "order_issue", "returns_refunds", "print_quality", "shipping"];

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field error when typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf",
        "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!allowedTypes.includes(file.type)) {
        setError("File type not supported. Please upload JPG, PNG, GIF, PDF, or DOC files.");
        return;
      }

      setAttachment(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachmentPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreview(null);
      }
    }
  };

  // Remove attachment
  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.inquiry_type) newErrors.inquiry_type = "Please select an inquiry type";
    if (!formData.subject.trim()) newErrors.subject = "Subject is required";
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Append all form fields
      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append file if exists
      if (attachment) {
        formDataToSend.append("attachment", attachment);
      }

      const response = await api.post("/api/contacts", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setSuccess({
          message: response.data.message,
          ticketNumber: response.data.data.ticket_number,
        });

        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          inquiry_type: "",
          order_number: "",
          product_name: "",
          subject: "",
          message: "",
          preferred_contact: "email",
        });
        setAttachment(null);
        setAttachmentPreview(null);
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
            <p className="text-xl text-amber-100 max-w-2xl mx-auto">
              We're here to help! Whether you have a question about your order, need design assistance,
              or want a custom quote, our team is ready to assist you.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Info Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Phone */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4 hover:shadow-xl transition">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FaPhone className="text-amber-600 text-xl" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Call Us</h3>
              <a href={`tel:${(process.env.REACT_APP_PHONE_NUMBER || "02522-669393").replace(/-/g, '')}`} className="text-amber-600 hover:text-amber-700 font-medium">
                {process.env.REACT_APP_PHONE_NUMBER || "02522-669393"}
              </a>
              <p className="text-sm text-gray-500">Mon-Sat, 9AM-6PM</p>
            </div>
          </div>

          {/* Email */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4 hover:shadow-xl transition">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FaEnvelope className="text-amber-600 text-xl" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Email Us</h3>
              <a href={`mailto:${process.env.REACT_APP_SUPPORT_EMAIL || "support@mprint.com"}`} className="text-amber-600 hover:text-amber-700 font-medium">
                {process.env.REACT_APP_SUPPORT_EMAIL || "support@mprint.com"}
              </a>
              <p className="text-sm text-gray-500">We reply within 24 hours</p>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4 hover:shadow-xl transition">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FaMapMarkerAlt className="text-amber-600 text-xl" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Visit Us</h3>
              <p className="text-gray-600">{process.env.REACT_APP_COMPANY_LOCATION || "Mumbai, Maharashtra"}</p>
              <p className="text-sm text-gray-500">{process.env.REACT_APP_COMPANY_COUNTRY || "India"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Send Us a Message</h2>
              <p className="text-gray-500 mb-8">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>

              {/* Success Message */}
              {success && (
                <div className="mb-8 bg-green-50 border border-green-200 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <FaCheckCircle className="text-green-500 text-2xl flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-green-800 text-lg">Message Sent Successfully!</h3>
                      <p className="text-green-700 mt-1">{success.message}</p>
                      <div className="mt-3 bg-green-100 rounded-lg px-4 py-2 inline-block">
                        <span className="text-sm text-green-600">Your Ticket Number: </span>
                        <span className="font-bold text-green-800">{success.ticketNumber}</span>
                      </div>
                      <p className="text-sm text-green-600 mt-2">
                        Please save this number for future reference.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <FaExclamationCircle className="text-red-500 text-xl" />
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name & Email Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.name ? "border-red-300 bg-red-50" : "border-gray-200"
                      } focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition outline-none`}
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.email ? "border-red-300 bg-red-50" : "border-gray-200"
                      } focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition outline-none`}
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                  </div>
                </div>

                {/* Phone & Preferred Contact Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-gray-400">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition outline-none"
                    />
                  </div>

                  {/* Preferred Contact */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Contact Method
                    </label>
                    <div className="flex gap-4">
                      {["email", "phone", "any"].map((method) => (
                        <label
                          key={method}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition ${
                            formData.preferred_contact === method
                              ? "border-amber-500 bg-amber-50 text-amber-700"
                              : "border-gray-200 hover:border-amber-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="preferred_contact"
                            value={method}
                            checked={formData.preferred_contact === method}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <span className="capitalize text-sm font-medium">{method}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Inquiry Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What can we help you with? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {inquiryTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <label
                          key={type.value}
                          className={`flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition ${
                            formData.inquiry_type === type.value
                              ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                              : "border-gray-200 hover:border-amber-300 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="inquiry_type"
                            value={type.value}
                            checked={formData.inquiry_type === type.value}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <Icon className={`text-lg ${formData.inquiry_type === type.value ? "text-amber-600" : "text-gray-400"}`} />
                          <span className="text-sm font-medium truncate">{type.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {errors.inquiry_type && <p className="mt-2 text-sm text-red-500">{errors.inquiry_type}</p>}
                </div>

                {/* Conditional: Order Number */}
                {orderRelatedTypes.includes(formData.inquiry_type) && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <label className="block text-sm font-medium text-amber-800 mb-2">
                      Order Number <span className="text-gray-500">(if applicable)</span>
                    </label>
                    <input
                      type="text"
                      name="order_number"
                      value={formData.order_number}
                      onChange={handleChange}
                      placeholder="e.g., ORD-123456"
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition outline-none"
                    />
                    <p className="mt-1 text-xs text-amber-600">
                      Providing your order number helps us resolve your issue faster.
                    </p>
                  </div>
                )}

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Brief summary of your inquiry"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.subject ? "border-red-300 bg-red-50" : "border-gray-200"
                    } focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition outline-none`}
                  />
                  {errors.subject && <p className="mt-1 text-sm text-red-500">{errors.subject}</p>}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Please describe your inquiry in detail..."
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.message ? "border-red-300 bg-red-50" : "border-gray-200"
                    } focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition outline-none resize-none`}
                  />
                  {errors.message && <p className="mt-1 text-sm text-red-500">{errors.message}</p>}
                  <p className="mt-1 text-xs text-gray-400 text-right">
                    {formData.message.length}/5000 characters
                  </p>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachment <span className="text-gray-400">(Optional)</span>
                  </label>

                  {!attachment ? (
                    <label className="flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition group">
                      <FaUpload className="text-3xl text-gray-400 group-hover:text-amber-500 mb-2" />
                      <span className="text-sm text-gray-600 group-hover:text-amber-600">
                        Click to upload or drag and drop
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        JPG, PNG, PDF, DOC (max 10MB)
                      </span>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      {attachmentPreview ? (
                        <img
                          src={attachmentPreview}
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-amber-100 rounded-lg flex items-center justify-center">
                          <FaUpload className="text-amber-600 text-xl" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{attachment.name}</p>
                        <p className="text-xs text-gray-500">
                          {(attachment.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeAttachment}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    You can attach design files, screenshots, or photos of damaged products.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-white font-semibold text-lg transition ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 shadow-lg hover:shadow-xl"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Business Hours */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <FaClock className="text-amber-600" />
                </div>
                <h3 className="font-bold text-gray-800">Business Hours</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monday - Friday</span>
                  <span className="font-medium text-gray-800">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saturday</span>
                  <span className="font-medium text-gray-800">9:00 AM - 2:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sunday</span>
                  <span className="font-medium text-red-500">Closed</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-gray-800 mb-4">Quick Links</h3>
              <div className="space-y-3">
                <Link
                  to="/purchase-history"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 transition group"
                >
                  <FaShoppingBag className="text-amber-500" />
                  <span className="text-gray-700 group-hover:text-amber-600">Track Your Order</span>
                </Link>
                <Link
                  to="/bulk-orders"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 transition group"
                >
                  <FaBoxOpen className="text-amber-500" />
                  <span className="text-gray-700 group-hover:text-amber-600">Bulk Order Inquiry</span>
                </Link>
                <Link
                  to="/"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 transition group"
                >
                  <FaPrint className="text-amber-500" />
                  <span className="text-gray-700 group-hover:text-amber-600">Browse Products</span>
                </Link>
              </div>
            </div>

            {/* Response Time Promise */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="font-bold text-lg mb-2">Our Promise</h3>
              <p className="text-amber-100 text-sm mb-4">
                We strive to respond to all inquiries within 24 hours during business days.
                For urgent matters, please call us directly.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <FaCheckCircle />
                <span>24-hour response guarantee</span>
              </div>
            </div>

            {/* FAQ Teaser */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3">Frequently Asked Questions</h3>
              <div className="space-y-3 text-sm">
                <details className="group">
                  <summary className="cursor-pointer text-gray-700 hover:text-amber-600 font-medium">
                    How do I track my order?
                  </summary>
                  <p className="mt-2 text-gray-500 pl-4">
                    Visit the Purchase History page or use the order tracking link in your confirmation email.
                  </p>
                </details>
                <details className="group">
                  <summary className="cursor-pointer text-gray-700 hover:text-amber-600 font-medium">
                    What file formats do you accept?
                  </summary>
                  <p className="mt-2 text-gray-500 pl-4">
                    We accept JPG, PNG, PDF, AI, PSD, and EPS files for print-ready designs.
                  </p>
                </details>
                <details className="group">
                  <summary className="cursor-pointer text-gray-700 hover:text-amber-600 font-medium">
                    Do you offer bulk discounts?
                  </summary>
                  <p className="mt-2 text-gray-500 pl-4">
                    Yes! Contact us for custom quotes on bulk orders. We offer competitive pricing for large quantities.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;
