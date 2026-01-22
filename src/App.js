import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// ==========================================
// SHARED COMPONENTS
// ==========================================
import Footer from "./Components/Footer";
import SubscribeSection from "./Components/SubscribeSection";
import Layout from "./Layout/Layout";

// ==========================================
// HOME PAGE SECTIONS
// ==========================================
import Home from "./Components/Home";
import Categories from "./Components/Categories";
import Products from "./Components/Products";
import Trending from "./Components/Trending";
import PromoBanner from "./Components/PromoBanner";
import Newarrival from "./Components/Newarrival";
import Exploremore from "./Components/Exploremore";
import Branded from "./Components/Branded";
import FaqSection from "./Components/FaqSection";

// ==========================================
// CORE PAGES
// ==========================================
import CardDetailPage from "./Components/CardDetailPage";
import AdminPanel from "./Components/Admin/AdminPanel";
import AdminLogin from "./Components/Admin/AdminLogin";
import Cart from "./Components/Cart";
import SearchResults from "./Components/SearchResults";
import FavoritesPage from "./Components/FavoritesPage";
import AuthDebug from "./Components/AuthDebug";
import MyProjectsPage from "./Components/MyProjectsPage";
import PurchaseHistoryPage from "./Components/PurchaseHistoryPage";
import CheckoutPage from "./Components/CheckoutPage";
import OrderConfirmationPage from "./Components/OrderConfirmationPage";
import ContactUsPage from "./Components/ContactUsPage";
import FaqPage from "./Components/FaqPage";
import PolicyPage from "./Components/PolicyPage";
import ProductFinalizePage from "./Components/ProductFinalizePage";
import ProductConfigurationFlow from "./Components/ProductConfigurationFlow";
import ReviewDesignPage from "./Components/ReviewDesignPage";
import TemplateBrowser from "./Components/TemplateBrowser";
import TemplatePreview from "./Components/TemplatePreview";

// ==========================================
// DYNAMIC CATEGORY PAGE (REPLACES ALL INDIVIDUAL PAGES)
// ==========================================
import CategoryProductsPage from "./Components/CategoryProductsPage";

// ==========================================
// AUTH PAGES
// ==========================================
import Login from "./Components/Auth/Login";
import Signup from "./Components/Auth/Signup";
import PaymentModal from "./Components/PaymentModal";
import FloatingContactWidget from "./Components/FloatingContactWidget";
import CheckoutLayout from "./Components/CheckoutLayout";
import ScrollToTop from "./Components/ScrollToTop";
import { CartProvider } from "./context/CartContext";

function App() {
  return (
    <CartProvider>
    <Router>
      {/* Scroll to top on route change */}
      <ScrollToTop />
      
      {/* Global Floating Contact Buttons - WhatsApp & Call */}
      <FloatingContactWidget
        phoneNumber={process.env.REACT_APP_PHONE_NUMBER || "02522-669393"}
        whatsappNumber={process.env.REACT_APP_WHATSAPP_NUMBER || "919876543210"}
      />

      <Routes>
        {/* ==================== ADMIN ROUTES (No Layout) ==================== */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPanel />} />

        {/* ==================== CHECKOUT FLOW (Distraction-Free Layout) ==================== */}
        {/* Minimal header with logo only - No navbar items for focused checkout experience */}
        <Route
          path="/finalize"
          element={
            <CheckoutLayout>
              <ProductFinalizePage />
            </CheckoutLayout>
          }
        />
        <Route
          path="/checkout"
          element={
            <CheckoutLayout>
              <CheckoutPage />
            </CheckoutLayout>
          }
        />
        <Route
          path="/order-confirmation/:orderId"
          element={
            <CheckoutLayout>
              <OrderConfirmationPage />
            </CheckoutLayout>
          }
        />
        <Route
          path="/review-design"
          element={
            <CheckoutLayout>
              <ReviewDesignPage />
            </CheckoutLayout>
          }
        />

        {/* ==================== MAIN LAYOUT (With Navbar/Footer) ==================== */}
        <Route element={<Layout />}>
          {/* ==================== HOME PAGE ==================== */}
          <Route
            path="/"
            element={
              <>
                <Home />
                <Categories />
                <Products />
                <Trending />
                <Branded />
                <PromoBanner />
                <Exploremore />
                <Newarrival />
                <FaqSection />
                <Footer />
              </>
            }
          />

          {/* ==================== SEARCH PAGE ==================== */}
          <Route
            path="/search"
            element={
              <>
                <SearchResults />
                <Footer />
              </>
            }
          />

          {/* ==================== FAVORITES PAGE ==================== */}
          <Route
            path="/favorites"
            element={
              <>
                <FavoritesPage />
                <Footer />
              </>
            }
          />

          {/* ==================== MY PROJECTS PAGE ==================== */}
          <Route
            path="/projects"
            element={
              <>
                <MyProjectsPage />
                <Footer />
              </>
            }
          />

          {/* ==================== PURCHASE HISTORY PAGE ==================== */}
          <Route
            path="/purchase-history"
            element={
              <>
                <PurchaseHistoryPage />
                <Footer />
              </>
            }
          />


          {/* ==================== AUTH DEBUG (Development Only) ==================== */}
          <Route path="/auth-debug" element={<AuthDebug />} />

          {/* ==================== CART PAGE ==================== */}
          <Route path="/payment" element={<PaymentModal />} />
          <Route
            path="/cart"
            element={
              <>
                <Cart />
                <Footer />
              </>
            }
          />

          {/* ==================== AUTH ROUTES ==================== */}
          <Route
            path="/login"
            element={
              <>
                <Login />
                <Footer />
              </>
            }
          />
          <Route
            path="/signup"
            element={
              <>
                <Signup />
                <Footer />
              </>
            }
          />

          {/* ==================== DYNAMIC CATEGORY PAGE ==================== */}
          {/* This single route handles ALL category product listings */}
          <Route
            path="/category/:slug"
            element={
              <>
                <CategoryProductsPage />
                <SubscribeSection />
                <Footer />
              </>
            }
          />

          {/* ==================== DYNAMIC PRODUCT DETAIL PAGE ==================== */}
          {/* This route handles product details within any category */}
          <Route
            path="/category/:slug/:productSlug"
            element={
              <>
                <CardDetailPage />
                <SubscribeSection />
                <Footer />
              </>
            }
          />

          {/* ==================== BACKWARD COMPATIBILITY REDIRECTS ==================== */}
          {/* Redirect old URLs to new /category/:slug format */}
          <Route path="/bookmarks" element={<Navigate to="/category/bookmarks" replace />} />
          <Route path="/bookmarks/:productSlug" element={<Navigate to="/category/bookmarks/:productSlug" replace />} />
          <Route path="/brochures" element={<Navigate to="/category/brochures" replace />} />
          <Route path="/brochures/:productSlug" element={<Navigate to="/category/brochures/:productSlug" replace />} />
          <Route path="/cards" element={<Navigate to="/category/cards" replace />} />
          <Route path="/cards/:productSlug" element={<Navigate to="/category/cards/:productSlug" replace />} />
          <Route path="/certificates" element={<Navigate to="/category/certificates" replace />} />
          <Route path="/certificates/:productSlug" element={<Navigate to="/category/certificates/:productSlug" replace />} />
          <Route path="/greetingcards" element={<Navigate to="/category/greeting-cards" replace />} />
          <Route path="/greetingcards/:productSlug" element={<Navigate to="/category/greeting-cards/:productSlug" replace />} />
          <Route path="/personalised" element={<Navigate to="/category/personalised-cards" replace />} />
          <Route path="/personalised/:productSlug" element={<Navigate to="/category/personalised-cards/:productSlug" replace />} />
          <Route path="/frames" element={<Navigate to="/category/photo-frames" replace />} />
          <Route path="/frames/:productSlug" element={<Navigate to="/category/photo-frames/:productSlug" replace />} />
          <Route path="/Prints" element={<Navigate to="/category/photo-prints" replace />} />
          <Route path="/Prints/:productSlug" element={<Navigate to="/category/photo-prints/:productSlug" replace />} />
          <Route path="/posters" element={<Navigate to="/category/posters" replace />} />
          <Route path="/posters/:productSlug" element={<Navigate to="/category/posters/:productSlug" replace />} />
          <Route path="/bulk-orders" element={<Navigate to="/category/bulk-orders" replace />} />
          <Route path="/bulk-orders/:productSlug" element={<Navigate to="/category/bulk-orders/:productSlug" replace />} />

          {/* ==================== GENERIC PRODUCT DETAIL ==================== */}
          <Route
            path="/products/:slug"
            element={
              <>
                <CardDetailPage />
                <SubscribeSection />
                <Footer />
              </>
            }
          />

          {/* ==================== PRODUCT CONFIGURATION FLOW ==================== */}
          {/* Multi-step: Options -> Design Studio -> Final Steps -> Cart */}
          <Route
            path="/products/:slug/configure"
            element={<ProductConfigurationFlow />}
          />
          <Route
            path="/category/:slug/:productSlug/configure"
            element={<ProductConfigurationFlow />}
          />
          <Route
            path="/products/:slug/templates"
            element={<TemplateBrowser />}
          />
          <Route
            path="/category/:slug/:productSlug/templates"
            element={<TemplateBrowser />}
          />
          <Route
            path="/products/:slug/templates/:templateId"
            element={<TemplatePreview />}
          />
          <Route
            path="/category/:slug/:productSlug/templates/:templateId"
            element={<TemplatePreview />}
          />

          {/* ==================== CONTACT US PAGE ==================== */}
          <Route
            path="/contact"
            element={
              <>
                <ContactUsPage />
                <Footer />
              </>
            }
          />

          {/* ==================== FAQ PAGE ==================== */}
          <Route
            path="/faq"
            element={
              <>
                <FaqPage />
                <Footer />
              </>
            }
          />

          {/* ==================== POLICY PAGES ==================== */}
          <Route
            path="/terms"
            element={
              <>
                <PolicyPage />
                <Footer />
              </>
            }
          />
          <Route
            path="/privacy"
            element={
              <>
                <PolicyPage />
                <Footer />
              </>
            }
          />
          <Route
            path="/refund"
            element={
              <>
                <PolicyPage />
                <Footer />
              </>
            }
          />
          <Route
            path="/shipping"
            element={
              <>
                <PolicyPage />
                <Footer />
              </>
            }
          />

          {/* ==================== 404 NOT FOUND ==================== */}
          <Route
            path="*"
            element={
              <>
                <div className="min-h-screen bg-gray-50 py-16 px-6">
                  <div className="max-w-4xl mx-auto text-center">
                    <div className="text-6xl mb-6">404</div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">
                      Page Not Found
                    </h1>
                    <p className="text-lg text-gray-600 mb-6">
                      Sorry, the page you're looking for doesn't exist.
                    </p>
                    <div className="space-x-4">
                      <button
                        onClick={() => window.history.back()}
                        className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
                      >
                        Go Back
                      </button>
                      <button
                        onClick={() => (window.location.href = "/")}
                        className="bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition"
                      >
                        Go Home
                      </button>
                    </div>
                  </div>
                </div>
                <Footer />
              </>
            }
          />
        </Route>
      </Routes>
    </Router>
    </CartProvider>
  );
}

export default App;
