import React from "react";
import { useHashRoute } from "../Router.jsx";
import { resolveSectionTitle } from "../utils/sectionLinks.js";
import SectionPage from "./Section.jsx";
import PageBySlug from "./PageBySlug.jsx";

/**
 * Маршрут /section/:slug.
 *
 * Преобразует понятный адрес (/section/struktura-apparata) обратно в заголовок
 * раздела и открывает обычную страницу раздела. Если slug не известен,
 * отдаём страницу CMS на совместимость со старыми ссылками вида /section/<slug>.
 */
export default function SectionBySlug() {
  const { route } = useHashRoute();
  const path = String(route || "").split("?")[0];
  const rawSlug = path.startsWith("/section/") ? path.slice("/section/".length) : "";
  const title = resolveSectionTitle(rawSlug);

  if (!title) return <PageBySlug />;
  return <SectionPage title={title} />;
}
