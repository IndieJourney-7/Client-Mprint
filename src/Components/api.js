import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export function useRequireAuth() {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await api.get("/sanctum/csrf-cookie");
        await api.get("/api/user"); // 401 => not authenticated
        setReady(true);
      } catch {
        navigate("/login", { replace: true });
      }
    })();
  }, [navigate]);

  return ready;
}
