import { useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

export function useHealth(pollMs = 30000) {
  const [result, setResult] = useState({ state: "unknown" });

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const start = performance.now();
      try {
        await axios.get(`${API}/health`, { timeout: 5000 });
        const latencyMs = performance.now() - start;

        if (cancelled) return;

        let state = "ok";
        if (latencyMs > 1500) state = "degraded";

        setResult({
          state,
          latencyMs,
          lastChecked: new Date(),
        });
      } catch {
        if (cancelled) return;
        setResult({
          state: "down",
          lastChecked: new Date(),
        });
      }
    };

    check();
    const id = setInterval(check, pollMs);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pollMs]);

  return result;
}
