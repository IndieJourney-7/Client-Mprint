import { Link } from "react-router-dom";
import { IoShieldCheckmarkOutline, IoLockClosed } from "react-icons/io5";
import vista from "../Assets/vista.png";

const CheckoutLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal Header - Logo Only */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo - Links back to home */}
            <Link to="/" className="flex-shrink-0">
              <img
                src={vista}
                alt="Mprint"
                className="h-10 md:h-14 object-contain"
              />
            </Link>

            {/* Secure Checkout Badge */}
            <div className="flex items-center gap-2 text-gray-600">
              <div className="hidden sm:flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                <IoShieldCheckmarkOutline size={18} />
                <span className="text-sm font-medium">Secure Checkout</span>
              </div>
              <div className="flex sm:hidden items-center text-green-600">
                <IoLockClosed size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-1"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <Link to="/policy/privacy" className="hover:text-gray-700 transition">
                Privacy Policy
              </Link>
              <span className="hidden sm:inline">|</span>
              <Link to="/policy/terms" className="hover:text-gray-700 transition">
                Terms of Service
              </Link>
              <span className="hidden sm:inline">|</span>
              <Link to="/contact-us" className="hover:text-gray-700 transition">
                Need Help?
              </Link>
            </div>
            <p className="text-gray-400">
              © {new Date().getFullYear()} Mprint. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CheckoutLayout;
