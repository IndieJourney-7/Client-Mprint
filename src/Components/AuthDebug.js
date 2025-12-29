import React, { useState, useEffect } from "react";
import api from "../api/api";

const AuthDebug = () => {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    setToken(storedToken || "No token found");
  }, []);

  const testAuth = async () => {
    setLoading(true);
    setError("");
    setUser(null);

    try {
      await api.get("/sanctum/csrf-cookie");
      const response = await api.get("/api/user");
      setUser(response.data?.user || response.data?.data);
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "401 Unauthorized - Token is invalid or expired"
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem("auth_token");
    setToken("Cleared");
    setUser(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          🔍 Authentication Debug Tool
        </h1>

        <div className="space-y-4">
          {/* Token Display */}
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold mb-2">Stored Token:</h2>
            <code className="text-xs break-all bg-white p-2 block rounded">
              {token}
            </code>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={testAuth}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Testing..." : "Test Authentication"}
            </button>
            <button
              onClick={clearAuth}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Clear Token
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Reload Page
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
              <h3 className="font-semibold">Error:</h3>
              <p>{error}</p>
            </div>
          )}

          {/* User Display */}
          {user && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded">
              <h3 className="font-semibold mb-2">✅ Authenticated User:</h3>
              <pre className="text-xs bg-white p-2 rounded overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded">
            <h3 className="font-semibold mb-2">📋 Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click "Clear Token" to remove stored authentication</li>
              <li>Go to /login and login with your credentials</li>
              <li>Come back to this page</li>
              <li>Click "Test Authentication"</li>
              <li>You should see your user data above</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDebug;
