import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import {
  IoDocumentTextOutline,
  IoShieldCheckmark,
  IoRefresh,
  IoTimeOutline,
  IoChevronForward,
  IoHomeOutline,
  IoArrowBack,
  IoPrintOutline
} from "react-icons/io5";

const PolicyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Get type from URL path (e.g., /terms -> terms, /privacy -> privacy)
  const type = location.pathname.replace("/", "");
  const [policy, setPolicy] = useState(null);
  const [allPolicies, setAllPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE_URL = "http://127.0.0.1:8000/api";

  // Policy configurations
  const policyConfig = {
    terms: {
      icon: IoDocumentTextOutline,
      color: "from-blue-500 to-blue-600",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
      borderColor: "border-blue-200",
    },
    privacy: {
      icon: IoShieldCheckmark,
      color: "from-green-500 to-green-600",
      lightColor: "bg-green-50",
      textColor: "text-green-600",
      borderColor: "border-green-200",
    },
    refund: {
      icon: IoRefresh,
      color: "from-amber-500 to-orange-500",
      lightColor: "bg-amber-50",
      textColor: "text-amber-600",
      borderColor: "border-amber-200",
    },
    shipping: {
      icon: IoTimeOutline,
      color: "from-purple-500 to-purple-600",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600",
      borderColor: "border-purple-200",
    },
  };

  // Fetch policy
  useEffect(() => {
    const fetchPolicy = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/policies/${type}`, {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError("Policy not found");
          } else {
            throw new Error("Failed to fetch policy");
          }
          return;
        }

        const data = await response.json();
        if (data.success) {
          setPolicy(data.data);
        } else {
          setError("Policy not found");
        }
      } catch (err) {
        console.error("Error fetching policy:", err);
        setError("Failed to load policy. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    const fetchAllPolicies = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/policies`, {
          headers: { Accept: "application/json" },
        });
        const data = await response.json();
        if (data.success) {
          setAllPolicies(data.data || []);
        }
      } catch (err) {
        console.error("Error fetching policies:", err);
      }
    };

    if (type) {
      fetchPolicy();
      fetchAllPolicies();
    }
  }, [type]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Render markdown-like content
  const renderContent = (content) => {
    if (!content) return null;

    return content.split("\n").map((line, idx) => {
      // Headings
      if (line.startsWith("## ")) {
        return (
          <h2
            key={idx}
            className="text-xl md:text-2xl font-bold text-gray-800 mt-8 mb-4 pb-2 border-b border-gray-200"
          >
            {line.replace("## ", "")}
          </h2>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h3
            key={idx}
            className="text-lg md:text-xl font-semibold text-gray-700 mt-6 mb-3"
          >
            {line.replace("### ", "")}
          </h3>
        );
      }

      // Bullet points
      if (line.startsWith("- ")) {
        return (
          <li key={idx} className="text-gray-600 ml-6 mb-2 list-disc">
            {renderInlineFormatting(line.replace("- ", ""))}
          </li>
        );
      }

      // Numbered list
      const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
      if (numberedMatch) {
        return (
          <li key={idx} className="text-gray-600 ml-6 mb-2 list-decimal">
            {renderInlineFormatting(numberedMatch[2])}
          </li>
        );
      }

      // Empty lines
      if (line.trim() === "") {
        return <div key={idx} className="h-4" />;
      }

      // Regular paragraphs
      return (
        <p key={idx} className="text-gray-600 leading-relaxed mb-3">
          {renderInlineFormatting(line)}
        </p>
      );
    });
  };

  // Render inline formatting (bold, italic)
  const renderInlineFormatting = (text) => {
    // Handle bold **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-gray-800">
            {part.slice(2, -2)}
          </strong>
        );
      }
      // Handle italic *text*
      const italicParts = part.split(/(\*[^*]+\*)/g);
      return italicParts.map((iPart, j) => {
        if (iPart.startsWith("*") && iPart.endsWith("*")) {
          return (
            <em key={`${i}-${j}`} className="italic">
              {iPart.slice(1, -1)}
            </em>
          );
        }
        return iPart;
      });
    });
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  const config = policyConfig[type] || policyConfig.terms;
  const Icon = config.icon;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center py-20">
            <IoDocumentTextOutline className="text-6xl text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {error || "Policy Not Found"}
            </h1>
            <p className="text-gray-500 mb-6">
              The policy you're looking for doesn't exist or hasn't been created yet.
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white print:bg-white">
      {/* Hero Section */}
      <div className={`bg-gradient-to-r ${config.color} py-12 md:py-16 print:hidden`}>
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-white/80 text-sm mb-6">
            <Link to="/" className="hover:text-white flex items-center gap-1">
              <IoHomeOutline />
              Home
            </Link>
            <IoChevronForward className="text-xs" />
            <span className="text-white">Policies</span>
            <IoChevronForward className="text-xs" />
            <span className="text-white">{policy.title}</span>
          </nav>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
              <Icon className="text-white text-3xl md:text-4xl" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
                {policy.title}
              </h1>
              <p className="text-white/80 text-sm md:text-base">
                Version {policy.version} • Last updated: {formatDate(policy.last_updated_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block py-8 border-b-2 border-gray-200 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{policy.title}</h1>
        <p className="text-gray-500">
          Version {policy.version} • Last updated: {formatDate(policy.last_updated_at)}
        </p>
        <p className="text-gray-500">Mprints - www.mprints.com</p>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 order-2 lg:order-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm print:shadow-none print:border-none print:p-0">
              {/* Print Button - Desktop */}
              <div className="hidden md:flex justify-end mb-6 print:hidden">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  <IoPrintOutline className="text-lg" />
                  Print this policy
                </button>
              </div>

              {/* Policy Content */}
              <div className="prose prose-gray max-w-none">
                {renderContent(policy.content)}
              </div>

              {/* Contact Info */}
              <div className={`mt-10 p-6 ${config.lightColor} rounded-xl border ${config.borderColor} print:hidden`}>
                <h3 className={`font-semibold ${config.textColor} mb-2`}>
                  Questions about this policy?
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  If you have any questions about our {policy.title.toLowerCase()}, please don't hesitate to contact us.
                </p>
                <Link
                  to="/contact"
                  className={`inline-flex items-center gap-2 bg-gradient-to-r ${config.color} text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg transition`}
                >
                  Contact Us
                  <IoChevronForward />
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar - Other Policies */}
          <div className="w-full lg:w-72 order-1 lg:order-2 print:hidden">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-24">
              <h3 className="font-semibold text-gray-800 mb-4">Other Policies</h3>
              <div className="space-y-2">
                {allPolicies
                  .filter((p) => p.type !== type)
                  .map((p) => {
                    const pConfig = policyConfig[p.type] || policyConfig.terms;
                    const PIcon = pConfig.icon;
                    return (
                      <Link
                        key={p.id}
                        to={`/${p.type}`}
                        className={`flex items-center gap-3 p-3 rounded-xl hover:${pConfig.lightColor} transition group`}
                      >
                        <div
                          className={`w-10 h-10 bg-gradient-to-r ${pConfig.color} rounded-lg flex items-center justify-center`}
                        >
                          <PIcon className="text-white text-lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate group-hover:text-gray-900">
                            {p.title}
                          </p>
                          <p className="text-xs text-gray-500">v{p.version}</p>
                        </div>
                        <IoChevronForward className="text-gray-400 group-hover:text-gray-600" />
                      </Link>
                    );
                  })}
              </div>

              {/* Quick Links */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Quick Links</h4>
                <div className="space-y-2">
                  <Link
                    to="/faq"
                    className="block text-sm text-gray-600 hover:text-amber-600 transition"
                  >
                    Frequently Asked Questions
                  </Link>
                  <Link
                    to="/contact"
                    className="block text-sm text-gray-600 hover:text-amber-600 transition"
                  >
                    Contact Support
                  </Link>
                  <Link
                    to="/bulk-orders"
                    className="block text-sm text-gray-600 hover:text-amber-600 transition"
                  >
                    Bulk Order Inquiry
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button - Mobile */}
        <div className="mt-8 lg:hidden print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
          >
            <IoArrowBack />
            Go Back
          </button>
        </div>
      </div>

      {/* Print Footer */}
      <div className="hidden print:block mt-8 pt-4 border-t border-gray-200 text-center text-gray-500 text-sm">
        <p>Mprints - All rights reserved</p>
        <p>This document was printed from www.mprints.com</p>
      </div>
    </div>
  );
};

export default PolicyPage;
