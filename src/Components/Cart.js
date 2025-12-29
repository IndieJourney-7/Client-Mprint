import React, { useEffect, useState, Fragment } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaRegHeart, FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import api from "../api/api";

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCartData = async () => {
    try {
      setLoading(true);
      setError(null);

      await api.get("/sanctum/csrf-cookie");
      // Ensure authenticated; redirect guests
      await api.get("/api/user").catch(() => {
        navigate("/login", { replace: true });
        throw new Error("unauth");
      });

      const cartRes = await api.get("/api/cart");
      if (cartRes.data?.success) {
        setCartItems(cartRes.data.data || []);
      } else {
        setCartItems([]);
      }
    } catch (err) {
      if (err.message === "unauth") return;
      setError(err?.response?.data?.message || "Failed to load cart");
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id) => {
    try {
      await api.get("/sanctum/csrf-cookie");
      await api.delete(`/api/cart/remove/${id}`);
      setCartItems((prev) => prev.filter((i) => i.id !== id));
    } catch (_) {
      alert("Failed to remove item. Please try again.");
    }
  };

  useEffect(() => {
    fetchCartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="p-8 text-center">Loading cart...</div>;

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>Error: {error}</p>
        <button onClick={fetchCartData} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded">
          Retry
        </button>
      </div>
    );
  }

  // Empty state that resembles the screenshot
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#eaf6ff] flex items-center justify-center px-4">
        <div className="w-full max-w-6xl">
          <div className="bg-[#eaf6ff] rounded-2xl p-8 text-center">
            <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center">
              {/* simple bag emoji; replace with SVG if you have one */}
              <span role="img" aria-label="bag" className="text-5xl">🛍️</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Looks like your cart is empty.
            </h1>
            <p className="text-gray-700 mb-8">
              Let’s fix that — there are lots of great things waiting for you!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Track an order */}
              <div className="bg-white rounded-xl p-6 text-left shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Track an order</h3>
                <p className="text-gray-600 mb-4">Find and track an order to see its status.</p>
                <button
                  onClick={() => navigate("/account/orders")}
                  className="inline-flex items-center gap-2 border rounded-lg px-4 py-2 hover:bg-gray-50"
                >
                  <span className="text-base">Go to Order History</span>
                </button>
              </div>

              {/* Promo code */}
              <div className="bg-white rounded-xl p-6 text-left shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Shop with a promo code</h3>
                <p className="text-gray-600 mb-4">
                  Apply a promo code to see discounted products as you shop.
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="inline-flex items-center gap-2 border rounded-lg px-4 py-2 hover:bg-gray-50"
                >
                  <span className="text-base">Have a code?</span>
                </button>
              </div>

              {/* Help center */}
              <div className="bg-white rounded-xl p-6 text-left shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Get help with an order</h3>
                <p className="text-gray-600 mb-4">
                  Browse articles or talk to us via chat, email or phone.
                </p>
                <button
                  onClick={() => navigate("/help")}
                  className="inline-flex items-center gap-2 border rounded-lg px-4 py-2 hover:bg-gray-50"
                >
                  <span className="text-base">Go to Help Center</span>
                </button>
              </div>
            </div>
          </div>

          {/* Suggested product card like the second screenshot */}
          {/* <div className="mt-10">
            <h2 className="text-xl font-semibold mb-4">Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div
                className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition"
                onClick={() => navigate("/products/polyester-polos-multi-location")}
              >
                <div className="relative">
                  <img
                    src="https://via.placeholder.com/640x480/eeeeee/777777?text=Polyester+Polos"
                    alt="Polyester Polos - Multi Location"
                    className="w-full h-56 object-cover"
                  />
                  <button
                    type="button"
                    className="absolute top-3 right-3 bg-white/90 rounded-full p-2 shadow"
                    aria-label="favorite"
                  >
                    <FaRegHeart className="text-gray-700" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Polyester Polos - Multi Location</h3>
                  <div className="flex items-center gap-1 text-amber-500 mb-1">
                    <FaStar /><FaStar /><FaStar /><FaStarHalfAlt /><FaRegStar />
                    <span className="ml-2 text-gray-600 text-sm">3 (4)</span>
                  </div>
                  <p className="text-gray-700 text-sm">1 starting at ₹590.00</p>
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    );
  }

  // Filled cart (compact list)
  const total = cartItems.reduce((sum, i) => sum + Number(i.total_price || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">
          Shopping Cart ({cartItems.length})
        </h1>

        <div className="bg-white rounded-2xl shadow-sm divide-y">
          {cartItems.map((item) => {
            const img = item.product?.featured_image_url || "https://via.placeholder.com/120x120/eeeeee/777777?text=Image";
            const name = item.product?.name || "Product";
            const slug = item.product?.slug || "";
            return (
              <Fragment key={item.id}>
                <div className="p-4 flex items-center gap-4">
                  {/* Thumbnail navigates to detail page */}
                  <button
                    type="button"
                    onClick={() => slug && navigate(`/products/${slug}`)}
                    className="w-20 h-20 rounded-lg overflow-hidden border hover:shadow transition"
                    title={name}
                  >
                    <img src={img} alt={name} className="w-full h-full object-cover" />
                  </button>

                  {/* Info area navigates too */}
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => slug && navigate(`/products/${slug}`)}
                  >
                    <h3 className="font-semibold text-gray-900">{name}</h3>
                    <p className="text-gray-600">Qty: {item.quantity}</p>
                  </div>

                  {/* Price and action */}
                  <div className="text-right">
                    <div className="text-lg font-semibold">₹{Number(item.total_price || 0).toFixed(0)}</div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="mt-2 text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 flex justify-end">
          <div className="bg-white rounded-xl shadow-sm p-4 w-full sm:w-80">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <button
              onClick={() => navigate("/checkout")}
              className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Checkout
            </button>
          </div>
        </div>

        {/* Continue shopping */}
        <div className="mt-4">
          <Link to="/" className="text-blue-600 hover:text-blue-700">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
