import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Disable React Query DevTools if present to prevent polling
if (typeof window !== 'undefined') {
  window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__?.setConfig?.({
    defaultOptions: { queries: { refetchInterval: false } }
  });
}

createRoot(document.getElementById("root")!).render(<App />);