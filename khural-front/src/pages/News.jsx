import React from "react";
import { Pagination } from "antd";
import SideNav from "../components/SideNav.jsx";

const NEWS_PAGE_SIZE = 12;

export default function News() {
  const [currentPage, setCurrentPage] = React.useState(1);

  // Get initial page from URL
  React.useEffect(() => {
    const pageParam = new URLSearchParams(window.location.search || "").get("page");
    const p = parseInt(pageParam, 10);
    if (Number.isFinite(p) && p >= 1) {
      setCurrentPage(p);
    }
  }, []);

  // Update URL when page changes
  const handlePageChange = (page) => {
    setCurrentPage(page);
    const sp = new URLSearchParams(window.location.search || "");
    if (page > 1) {
      sp.set("page", String(page));
    } else {
      sp.delete("page");
    }
    const qs = sp.toString();
    const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    window.history.replaceState(null, "", newUrl);
    // Scroll to top of news section
    const newsEl = document.querySelector(".news-page");
    if (newsEl) {
      newsEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="section news-page">
      <div className="container">
        <div className="page-grid">
          <div>
            <h1>Новости</h1>
            <p>Здесь будет лента новостей и фильтры по темам.</p>

            {/* Pagination placeholder - will be implemented with real news data */}
            <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
              <Pagination
                current={currentPage}
                total={0}
                pageSize={NEWS_PAGE_SIZE}
                showSizeChanger={false}
                showTotal={(total, range) => `${range[0]}–${range[1]} из ${total}`}
                onChange={handlePageChange}
              />
            </div>
          </div>
          <SideNav title="Разделы" loadPages={true} autoSection={true} />
        </div>
      </div>
    </section>
  );
}
