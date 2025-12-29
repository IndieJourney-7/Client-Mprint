import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Step 1: Get Sanctum CSRF cookie
      await api.get("/sanctum/csrf-cookie");

      // Step 2: Register new user
      const res = await api.post("/api/auth/register", formData);

      if (res.data?.success) {
        setSuccess("Account created successfully! Logging you in...");

        // Step 3: Automatically log in after successful registration
        try {
          const loginRes = await api.post("/api/auth/login", {
            email: formData.email,
            password: formData.password,
          });

          if (loginRes.data?.success) {
            if (loginRes.data.token) {
              localStorage.setItem("auth_token", loginRes.data.token);
            }
            navigate("/", { replace: true }); // Redirect to home or dashboard
          } else {
            setError(
              "Account created, but login failed. Please log in manually."
            );
            setTimeout(() => navigate("/login"), 1500);
          }
        } catch (loginErr) {
          console.error("Auto-login error:", loginErr);
          setError("Account created, but auto-login failed. Please log in.");
          setTimeout(() => navigate("/login"), 1500);
        }
      } else {
        setError(res.data?.message || "Signup failed. Please try again.");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
          Create an Account
        </h2>

        {/* Show messages */}
        {error && (
          <div className="text-red-600 bg-red-50 p-2 rounded mb-3 text-sm text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-600 bg-green-50 p-2 rounded mb-3 text-sm text-center">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            required
            placeholder="Full name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

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

          <input
            name="password_confirmation"
            type="password"
            required
            placeholder="Confirm password"
            value={formData.password_confirmation}
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
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        {/* 👇 Link to login if user already registered */}
        <p className="text-sm text-center mt-4 text-gray-600">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-indigo-600 hover:underline font-medium"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default Signup;
