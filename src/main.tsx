import "./utils/requestTracker";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "katex/dist/katex.min.css";
import "./index.css";
import AppRouter from "./app/router";
import ErrorBoundary from "./components/common/ErrorBoundary";
import NetworkStatus from "./components/common/NetworkStatus";
import UpdatePrompt from "./components/common/UpdatePrompt";
import { ThemeProvider } from "./context/ThemeContext";
import { registerServiceWorker } from "./lib/serviceWorkerRegistration";

// Initialize service worker with update detection & stale-cache protection
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AppRouter />
        <NetworkStatus />
        <UpdatePrompt />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
