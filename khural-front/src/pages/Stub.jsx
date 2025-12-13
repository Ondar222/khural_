import React from "react";

export default function Stub({ title }) {
  return (
    <section className="section">
      <div className="container">
        <h1>{title}</h1>
        <p>Здесь будет содержимое страницы «{title}».</p>
      </div>
    </section>
  );
}
