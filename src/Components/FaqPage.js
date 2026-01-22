import React, { useState, useEffect } from "react";
import { IoChevronDown, IoHelpCircleOutline, IoSearchOutline, IoThumbsUp, IoThumbsDown } from "react-icons/io5";

const FaqPage = () => {
  const [faqData, setFaqData] = useState([]);
  const [, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackGiven, setFeedbackGiven] = useState({});
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

  // Category colors matching the theme
  const categoryColors = {
    ordering: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-500", light: "bg-amber-100" },
    design: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-500", light: "bg-blue-100" },
    printing: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", badge: "bg-purple-500", light: "bg-purple-100" },
    shipping: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", badge: "bg-green-500", light: "bg-green-100" },
    returns: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-500", light: "bg-red-100" },
    payment: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", badge: "bg-teal-500", light: "bg-teal-100" },
    account: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", badge: "bg-indigo-500", light: "bg-indigo-100" },
    bulk: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", badge: "bg-orange-500", light: "bg-orange-100" },
    general: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700", badge: "bg-gray-500", light: "bg-gray-100" },
  };

  useEffect(() => {
    const fetchFaqs = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/faqs`, {
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
          setFaqData(Array.isArray(data.data) ? data.data : []);
          setCategories(data.categories || {});
        } else {
          setFaqData([]);
        }
      } catch (err) {
        console.error("Failed to fetch FAQs:", err);
        setFaqData([]);
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

  const handleFeedback = async (faqId, helpful) => {
    if (feedbackGiven[faqId]) return;

    try {
      await fetch(`${API_BASE_URL}/faqs/${faqId}/helpful`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ helpful }),
      });
      setFeedbackGiven((prev) => ({ ...prev, [faqId]: helpful ? "yes" : "no" }));
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    }
  };

  // Get all FAQs flat for search
  const getAllFaqs = () => {
    const allFaqs = [];
    faqData.forEach((categoryGroup) => {
      if (categoryGroup.faqs) {
        categoryGroup.faqs.forEach((faq) => {
          allFaqs.push({
            ...faq,
            category: categoryGroup.category,
            category_label: categoryGroup.label,
          });
        });
      }
    });
    return allFaqs;
  };

  // Filter FAQs based on search and category
  const getFilteredFaqs = () => {
    const allFaqs = getAllFaqs();
    let filtered = allFaqs;

    // Filter by category
    if (activeCategory !== "all") {
      filtered = filtered.filter((faq) => faq.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (faq) =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredFaqs = getFilteredFaqs();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 md:px-10">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-3">
              Help Center
            </h1>
            <p className="text-gray-500">Loading FAQs...</p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 md:px-10">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <IoHelpCircleOutline className="text-lg" />
            <span>Help Center</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto">
            Find answers to common questions about our printing services, ordering process, shipping, and more.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            placeholder="Search for answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-base"
          />
        </div>

        {/* Category Pills */}
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
              All ({getAllFaqs().length})
            </button>
            {faqData.map((categoryGroup) => {
              const colors = getColorScheme(categoryGroup.category);
              return (
                <button
                  key={categoryGroup.category}
                  onClick={() => setActiveCategory(categoryGroup.category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap
                    ${activeCategory === categoryGroup.category
                      ? `${colors.badge} text-white shadow-md`
                      : `bg-white ${colors.text} hover:${colors.bg} border ${colors.border}`
                    }`}
                >
                  {categoryGroup.label} ({categoryGroup.faqs?.length || 0})
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count */}
        {searchQuery && (
          <div className="mb-6 text-center">
            <p className="text-gray-500">
              Found <span className="font-semibold text-gray-800">{filteredFaqs.length}</span> results
              {searchQuery && <span> for "{searchQuery}"</span>}
            </p>
          </div>
        )}

        {/* FAQ List */}
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IoHelpCircleOutline className="text-3xl text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No FAQs Found</h3>
            <p className="text-gray-500">
              {searchQuery
                ? "Try a different search term or browse all categories."
                : "No FAQs are available in this category yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {filteredFaqs.map((faq, index) => {
              const colors = getColorScheme(faq.category);
              const isExpanded = expandedId === faq.id;
              const feedback = feedbackGiven[faq.id];

              return (
                <div
                  key={faq.id}
                  className={`rounded-xl overflow-hidden transition-all duration-300 border ${
                    isExpanded
                      ? `${colors.border} shadow-lg ${colors.bg}`
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  {/* Question Header */}
                  <button
                    onClick={() => toggleExpand(faq.id)}
                    className="w-full flex items-center justify-between px-5 py-4 md:px-6 md:py-5 text-left group"
                  >
                    <div className="flex items-start gap-3 md:gap-4 flex-1 pr-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.badge} text-white flex-shrink-0`}
                      >
                        {faq.category_label}
                      </span>
                      <span
                        className={`font-medium text-sm md:text-base ${
                          isExpanded ? colors.text : "text-gray-800 group-hover:text-gray-900"
                        }`}
                      >
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
                      isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-5 pb-5 md:px-6 md:pb-6">
                      <div className="md:pl-[88px]">
                        <p className="text-gray-600 text-sm md:text-base leading-relaxed whitespace-pre-line mb-6">
                          {faq.answer}
                        </p>

                        {/* Feedback Section */}
                        <div className="border-t border-gray-200 pt-4">
                          <p className="text-sm text-gray-500 mb-3">Was this helpful?</p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleFeedback(faq.id, true)}
                              disabled={!!feedback}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                feedback === "yes"
                                  ? "bg-green-100 text-green-700 border border-green-200"
                                  : feedback
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600 border border-transparent hover:border-green-200"
                              }`}
                            >
                              <IoThumbsUp className={feedback === "yes" ? "text-green-600" : ""} />
                              Yes
                            </button>
                            <button
                              onClick={() => handleFeedback(faq.id, false)}
                              disabled={!!feedback}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                feedback === "no"
                                  ? "bg-red-100 text-red-700 border border-red-200"
                                  : feedback
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200"
                              }`}
                            >
                              <IoThumbsDown className={feedback === "no" ? "text-red-600" : ""} />
                              No
                            </button>
                          </div>
                          {feedback && (
                            <p className="text-sm text-gray-500 mt-3">Thanks for your feedback!</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Contact Support Card */}
        <div className="mt-12 md:mt-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
          </div>

          <div className="relative z-10 text-center">
            <h3 className="text-xl md:text-2xl font-bold mb-3">
              Still have questions?
            </h3>
            <p className="text-amber-100 text-sm md:text-base mb-6 max-w-md mx-auto">
              Can't find the answer you're looking for? Our support team is here to help you with any questions.
            </p>
            <a
              href="/contact"
              className="inline-block bg-white text-amber-600 hover:bg-amber-50 px-6 py-3 rounded-full font-medium text-sm md:text-base transition-all duration-200 shadow-lg"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;
