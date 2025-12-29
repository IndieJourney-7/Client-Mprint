import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/api";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  useEffect(() => {
    // Check if there's a redirect message from the previous page
    if (location.state?.message) {
      setInfoMessage(location.state.message);
    }
  }, [location]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Ensure CSRF token is set for Sanctum
      await api.get("/sanctum/csrf-cookie");

      // Attempt login
      const res = await api.post("/api/auth/login", formData);

      if (res.data?.success) {
        // Store token if available
        if (res.data.token) {
          console.log('[Login] Token received from server:', res.data.token.substring(0, 20) + '...');
          localStorage.setItem("auth_token", res.data.token);

          // Verify token was stored
          const storedToken = localStorage.getItem("auth_token");
          console.log('[Login] Token stored in localStorage:', storedToken ? 'Success' : 'Failed');
          console.log('[Login] Stored token preview:', storedToken ? storedToken.substring(0, 20) + '...' : 'None');
        } else {
          console.error('[Login] No token in response:', res.data);
        }

        // Redirect to the page user came from, or home page
        const redirectTo = location.state?.from || "/";
        console.log('[Login] Redirecting to:', redirectTo);
        navigate(redirectTo, { replace: true });
      } else {
        // Handle invalid credentials or failed login
        setError(res.data?.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
          Login to Your Account
        </h2>

        {/* Info Message */}
        {infoMessage && (
          <div className="text-blue-600 bg-blue-50 p-3 rounded mb-4 text-sm text-center">
            {infoMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-red-600 bg-red-50 p-2 rounded mb-3 text-sm text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <input
            name="password"
            type="password"
            required
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 text-white rounded transition ${
              loading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* 👇 Add this section for users who are not registered */}
        <p className="text-sm text-center mt-4 text-gray-600">
          Don’t have an account?{" "}
          <button
            onClick={() => navigate("/signup")}
            className="text-indigo-600 hover:underline font-medium"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
