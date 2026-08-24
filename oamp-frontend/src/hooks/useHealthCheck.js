import { useState, useEffect } from "react";
import axios from "axios";

const HEALTH_URL =
  (import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1").replace(
    "/api/v1",
    ""
  ) + "/health";

export function useHealthCheck(intervalMs = 30000) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        await axios.get(HEALTH_URL, { timeout: 3000 });
        if (mounted) setIsOnline(true);
      } catch {
        if (mounted) setIsOnline(false);
      }
    }

    check();
    const id = setInterval(check, intervalMs);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return isOnline;
}
