import React from "react";
import BroadcastWidget from "../components/BroadcastWidget.jsx";
import SideNav from "../components/SideNav.jsx";
import DataState from "../components/DataState.jsx";
import { useI18n } from "../context/I18nContext.jsx";

export default function Broadcast() {
  const { t } = useI18n();
  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div className="page-grid__main">
            <h1>{t("Трансляции")}</h1>
            <div style={{ marginTop: 24 }}>
              <BroadcastWidget />
            </div>
          </div>
          <SideNav
            title={t("Трансляции")}
            links={[
              { label: t("Трансляция"), href: "/broadcast" },
            ]}
          />
        </div>
      </div>
    </section>
  );
}

