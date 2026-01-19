import React from "react";
import HeroCarousel from "../components/HeroCarousel.jsx";
import Resources from "../components/Resources.jsx";
import NewsBlock from "../components/NewsBlock.jsx";
import CalendarWidget from "../components/CalendarWidget.jsx";
import CmsSnippet from "../components/CmsSnippet.jsx";

export default function Home() {
  return (
    <>
      <HeroCarousel />
      <section className="section">
        <div className="container">
          <CmsSnippet slug="home" className="card" style={{ padding: 18, marginBottom: 16 }} />
        </div>
      </section>
      <NewsBlock />
      <CalendarWidget />
      <Resources />
      {/* Удалён дублирующий блок новостей */}
    </>
  );
}
