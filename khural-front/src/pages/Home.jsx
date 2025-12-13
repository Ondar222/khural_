import React from "react";
import HeroCarousel from "../components/HeroCarousel.jsx";
import Resources from "../components/Resources.jsx";
import NewsBlock from "../components/NewsBlock.jsx";
import CalendarWidget from "../components/CalendarWidget.jsx";

export default function Home() {
  return (
    <>
      <HeroCarousel />
      <NewsBlock />
      <CalendarWidget />
      <Resources />
      {/* Удалён дублирующий блок новостей */}
    </>
  );
}
