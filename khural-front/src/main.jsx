import React from "react";
import { createRoot } from "react-dom/client";
import "./setApiBaseUrl.js";
import App from "./App.jsx";
import "./styles/index.css";

// Подавляем ошибки от внешних скриптов мониторинга (VK, etc.)
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    // Игнорируем ошибки от stats.vk-portal.net и подобных внешних скриптов
    if (event?.target?.src?.includes("stats.vk-portal.net")) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  window.addEventListener("unhandledrejection", (event) => {
    // Игнорируем rejected promises от внешних скриптов
    if (event?.reason?.message?.includes("stats.vk-portal.net")) {
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
