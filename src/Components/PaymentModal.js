import React, { useState, useEffect } from "react";
import { FaPhone, FaGooglePay } from "react-icons/fa";
import { SiPaytm, SiAmazonpay, SiPhonepe } from "react-icons/si";
import visa from "../Assets/visa.png";
import mastercard from "../Assets/mastercard.png";
import rupay from "../Assets/rupay.png";

const PaymentModal = ({ currency = "INR", onClose, onPay }) => {
  const [method, setMethod] = useState("card");
  const [upiApp, setUpiApp] = useState("");
  const [upiId, setUpiId] = useState("");
  const [cardDetails, setCardDetails] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api"}/products`);
        const data = await res.json();
        // adjust if your API wraps data, e.g. {data: [...]}
        const list = Array.isArray(data) ? data : data.data || [];
        if (list.length > 0) {
          setProducts(list);
          setSelectedProductId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch products", err);
      }
    };
    fetchProducts();
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const amount = selectedProduct ? Number(selectedProduct.price || 0) : 0;

  const upiApps = [
    { name: "GPay", icon: <FaGooglePay size={26} className="text-sky-600" /> },
    { name: "PhonePe", icon: <SiPhonepe size={26} className="text-violet-600" /> },
    { name: "Paytm", icon: <SiPaytm size={26} className="text-sky-700" /> },
    { name: "Amazon Pay", icon: <SiAmazonpay size={26} className="text-amber-600" /> },
  ];

  const isCardSelected = method === "card";
  const isUpiSelected = method === "upi";

  const handlePay = () => {
    if (!selectedProduct) return;
    if (method === "card") {
      onPay?.({
        type: "card",
        payload: { ...cardDetails, productId: selectedProduct.id, amount },
      });
    } else {
      onPay?.({
        type: "upi",
        payload: { upiId, upiApp, productId: selectedProduct.id, amount },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-white/80 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/60 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Complete your payment
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Secured by industry‑standard encryption
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
            >
              <span className="text-lg leading-none">&times;</span>
            </button>
          )}
        </div>

        {/* Amount strip + product select */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-t-none rounded-3xl sm:rounded-3xl sm:-mt-px">
          <div className="w-full sm:w-auto">
            <select
              value={selectedProductId || ""}
              onChange={(e) => setSelectedProductId(Number(e.target.value))}
              className="w-full sm:w-auto rounded px-3 py-1 text-black"
            >
              {products.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.name} - ₹{prod.price}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-300">
              Amount payable
            </p>
            <p className="mt-1 text-xl font-semibold">
              {currency}{" "}
              <span className="tabular-nums tracking-tight">
                {amount.toLocaleString("en-IN")}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <img src={visa} alt="Visa" className="h-6" />
            <img src={mastercard} alt="Mastercard" className="h-6" />
            <img src={rupay} alt="RuPay" className="h-6" />
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Tabs */}
          <div className="inline-flex rounded-full bg-slate-100 p-1 text-sm">
            <button
              onClick={() => setMethod("card")}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 transition text-xs sm:text-sm ${
                isCardSelected
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                1
              </span>
              Card
            </button>
            <button
              onClick={() => setMethod("upi")}
              className={`ml-1 flex items-center gap-2 rounded-full px-4 py-1.5 transition text-xs sm:text-sm ${
                isUpiSelected
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <FaPhone className="h-3.5 w-3.5" />
              UPI
            </button>
          </div>

          {/* CARD PAYMENT UI */}
          {isCardSelected && (
            <div className="space-y-4 animate-fadeIn">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 text-slate-50 shadow-lg">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="uppercase tracking-[0.18em] text-slate-400">
                    Credit / Debit Card
                  </span>
                  <div className="flex gap-1">
                    <span className="h-5 w-5 rounded-full bg-amber-400/90" />
                    <span className="h-5 w-5 -ml-2 rounded-full bg-red-500/90" />
                  </div>
                </div>
                <p className="mt-6 text-sm tracking-[0.24em] tabular-nums">
                  {cardDetails.number
                    ? cardDetails.number.replace(/(.{4})/g, "$1 ").trim()
                    : "•••• •••• •••• ••••"}
                </p>
                <div className="mt-5 flex items-end justify-between text-xs text-slate-300">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em]">
                      Card Holder
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-50">
                      {cardDetails.name || "FULL NAME"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em]">
                      Expires
                    </p>
                    <p className="mt-1 text-xs font-medium">
                      {cardDetails.expiry || "MM / YY"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Card number
                  </label>
                  <input
                    type="text"
                    maxLength={19}
                    inputMode="numeric"
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.number}
                    onChange={(e) =>
                      setCardDetails({
                        ...cardDetails,
                        number: e.target.value
                          .replace(/\D/g, "")
                          .replace(/(.{4})/g, "$1 ")
                          .trim(),
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600">
                      Expiry (MM/YY)
                    </label>
                    <input
                      type="text"
                      placeholder="08/27"
                      maxLength={5}
                      value={cardDetails.expiry}
                      onChange={(e) =>
                        setCardDetails({
                          ...cardDetails,
                          expiry: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                  <div>
                    <label className="flex items-center justify-between text-xs font-medium text-slate-600">
                      CVV
                      <span className="text-[10px] font-normal text-slate-400">
                        3 digits on back
                      </span>
                    </label>
                    <input
                      type="password"
                      maxLength={3}
                      inputMode="numeric"
                      placeholder="•••"
                      value={cardDetails.cvv}
                      onChange={(e) =>
                        setCardDetails({
                          ...cardDetails,
                          cvv: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Cardholder name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={cardDetails.name}
                    onChange={(e) =>
                      setCardDetails({
                        ...cardDetails,
                        name: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* UPI PAYMENT UI */}
          {isUpiSelected && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">
                  Choose your UPI app
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {upiApps.map((app) => (
                    <button
                      key={app.name}
                      type="button"
                      onClick={() => setUpiApp(app.name)}
                      className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-2 text-xs transition ${
                        upiApp === app.name
                          ? "border-slate-900 bg-slate-900/5 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      {app.icon}
                      <span className="line-clamp-1 text-[11px] text-slate-600">
                        {app.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">
                  UPI ID
                </label>
                <input
                  type="text"
                  placeholder="mobile-number@upi or name@bank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  You will be redirected to your UPI app to approve this collect
                  request.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-slate-200/70 bg-slate-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/10 text-[9px] font-semibold text-emerald-600">
              ✓
            </span>
            <span>256‑bit SSL encryption. Your card details are never stored.</span>
          </div>

          <button
            onClick={handlePay}
            disabled={!selectedProduct}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
          >
            Pay {currency} {amount.toLocaleString("en-IN")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
