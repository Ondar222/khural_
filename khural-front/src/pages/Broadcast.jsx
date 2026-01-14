import React from "react";
import BroadcastWidget from "../components/BroadcastWidget.jsx";
import SideNav from "../components/SideNav.jsx";
import DataState from "../components/DataState.jsx";

export default function Broadcast() {
  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div className="page-grid__main">
            <h1>Трансляции</h1>
            <div style={{ marginTop: 24 }}>
              <BroadcastWidget />
            </div>
          </div>
          <SideNav
            title="Трансляции"
            links={[
              { label: "Текущая трансляция", href: "/broadcast" },
            ]}
          />
        </div>
      </div>
    </section>
  );
}

