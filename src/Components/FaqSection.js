import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoChevronDown, IoChevronForward, IoHelpCircleOutline } from "react-icons/io5";

const FaqSection = () => {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

  // Category colors matching the theme
  const categoryColors = {
    ordering: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-500" },
    design: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-500" },
    printing: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", badge: "bg-purple-500" },
    shipping: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", badge: "bg-green-500" },
    returns: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-500" },
    payment: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", badge: "bg-teal-500" },
    account: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", badge: "bg-indigo-500" },
    bulk: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", badge: "bg-orange-500" },
    general: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700", badge: "bg-gray-500" },
  };

  useEffect(() => {
    const fetchFaqs = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/faqs/featured`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success && data.data) {
          setFaqs(Array.isArray(data.data) ? data.data : []);
        } else {
          setFaqs([]);
        }
      } catch (err) {
        console.error("Failed to fetch FAQs:", err);
        setFaqs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getColorScheme = (category) => {
    return categoryColors[category] || categoryColors.general;
  };

  // Get unique categories from FAQs
  const categories = [...new Set(faqs.map(faq => faq.category))];

  // Filter FAQs by active category
  const filteredFaqs = activeCategory === "all"
    ? faqs
    : faqs.filter(faq => faq.category === activeCategory);

  if (loading) {
    return (
      <section className="w-full py-12 md:py-20 bg-gradient-to-b from-white to-amber-50/30">
        <div className="max-w-6xl mx-auto px-4 md:px-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-500 text-sm md:text-base">
              Loading FAQs...
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        </div>
      </section>
    );
  }

  if (faqs.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-12 md:py-20 bg-gradient-to-b from-white to-amber-50/30">
      <div className="max-w-6xl mx-auto px-4 md:px-10">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <IoHelpCircleOutline className="text-lg" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto">
            Find answers to common questions about ordering, printing, shipping, and more.
          </p>
        </div>

        {/* Category Filter Pills - Mobile horizontal scroll, desktop centered */}
        {categories.length > 1 && (
          <div className="mb-8 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 justify-start md:justify-center min-w-max px-1 py-1">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap
                  ${activeCategory === "all"
                    ? "bg-amber-500 text-white shadow-md shadow-amber-200"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
              >
                All Questions
              </button>
              {categories.map((category) => {
                const colors = getColorScheme(category);
                const categoryLabels = {
                  ordering: "Ordering",
                  design: "Design",
                  printing: "Printing",
                  shipping: "Shipping",
                  returns: "Returns",
                  payment: "Payment",
                  account: "Account",
                  bulk: "Bulk Orders",
                  general: "General",
                };
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap
                      ${activeCategory === category
                        ? `${colors.badge} text-white shadow-md`
                        : `bg-white ${colors.text} hover:${colors.bg} border ${colors.border}`
                      }`}
                  >
                    {categoryLabels[category] || category}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* FAQ Accordion */}
        <div className="space-y-3 md:space-y-4">
          {filteredFaqs.map((faq, index) => {
            const colors = getColorScheme(faq.category);
            const isExpanded = expandedId === faq.id;

            return (
              <div
                key={faq.id}
                className={`rounded-xl overflow-hidden transition-all duration-300 border ${
                  isExpanded
                    ? `${colors.border} shadow-lg ${colors.bg}`
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                }`}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* Question Header */}
                <button
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full flex items-center justify-between px-5 py-4 md:px-6 md:py-5 text-left group"
                >
                  <div className="flex items-start gap-3 md:gap-4 flex-1 pr-4">
                    {/* Category Badge - Desktop only */}
                    <span
                      className={`hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.badge} text-white flex-shrink-0`}
                    >
                      {faq.category_label || faq.category}
                    </span>
                    <span className={`font-medium text-sm md:text-base ${
                      isExpanded ? colors.text : "text-gray-800 group-hover:text-gray-900"
                    }`}>
                      {faq.question}
                    </span>
                  </div>
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isExpanded
                        ? `${colors.badge} text-white rotate-180`
                        : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                    }`}
                  >
                    <IoChevronDown className="text-lg" />
                  </div>
                </button>

                {/* Answer Content */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-5 pb-5 md:px-6 md:pb-6">
                    {/* Mobile Category Badge */}
                    <span
                      className={`md:hidden inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.badge} text-white mb-3`}
                    >
                      {faq.category_label || faq.category}
                    </span>
                    <div className="md:pl-[72px]">
                      <p className="text-gray-600 text-sm md:text-base leading-relaxed whitespace-pre-line">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All FAQs Button */}
        <div className="text-center mt-10 md:mt-14">
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              setTimeout(() => navigate("/faq"), 300);
            }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-full font-medium text-sm md:text-base shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <span>View All FAQs</span>
            <IoChevronForward className="text-lg" />
          </button>
        </div>

        {/* Help Card */}
        <div className="mt-10 md:mt-14 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-bold mb-2">
                Still have questions?
              </h3>
              <p className="text-amber-100 text-sm md:text-base">
                Can't find the answer you're looking for? Our support team is here to help.
              </p>
            </div>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                setTimeout(() => navigate("/contact"), 300);
              }}
              className="bg-white text-amber-600 hover:bg-amber-50 px-6 py-3 rounded-full font-medium text-sm md:text-base transition-all duration-200 shadow-lg whitespace-nowrap"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
