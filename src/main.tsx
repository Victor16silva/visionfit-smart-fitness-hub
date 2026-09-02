import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as amplitude from "@amplitude/unified";
import App from "./App.tsx";
import "./index.css";
import { initNative } from "./lib/native";

initNative();

const AMPLITUDE_API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY;
if (!AMPLITUDE_API_KEY) {
  console.warn("Amplitude API key missing — analytics disabled");
} else {
  amplitude.initAll(AMPLITUDE_API_KEY, {
    analytics: { autocapture: true },
    sessionReplay: { sampleRate: 1 },
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
