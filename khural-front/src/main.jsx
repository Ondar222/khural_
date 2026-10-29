import React from "react";
import { createRoot } from "react-dom/client";
import "./setApiBaseUrl.js";
import App from "./App.jsx";
import "./styles/index.css";

// Подавляем ошибки от внешних скриптов мониторинга (VK, etc.)
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    const msg = String(event?.message || "");
    const src = String(event?.target?.src || "");
    const href = String(event?.target?.href || "");
    if (
      msg.includes("stats.vk-portal.net") ||
      src.includes("stats.vk-portal.net") ||
      href.includes("stats.vk-portal.net") ||
      msg.includes("vk-portal") ||
      src.includes("vk-portal")
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  window.addEventListener("unhandledrejection", (event) => {
    const msg = String(event?.reason?.message || event?.reason || "");
    if (
      msg.includes("stats.vk-portal.net") ||
      msg.includes("vk-portal")
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
