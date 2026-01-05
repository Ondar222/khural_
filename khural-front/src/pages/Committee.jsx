import React from "react";
import { useData } from "../context/DataContext.jsx";
import SideNav from "../components/SideNav.jsx";
import DataState from "../components/DataState.jsx";

export default function Committee() {
  const { committees, deputies, loading, errors, reload } = useData();
  const [committee, setCommittee] = React.useState(null);

  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search || "");
    const id = sp.get("id");
    if (id) {
    const c = (committees || []).find((x) => x.id === id);
    setCommittee(c || null);
    } else {
      setCommittee(null);
    }
  }, [committees]);

  React.useEffect(() => {
    const onNav = () => {
      const sp = new URLSearchParams(window.location.search || "");
      const id = sp.get("id");
      if (id) {
      const c = (committees || []).find((x) => x.id === id);
      setCommittee(c || null);
      } else {
        setCommittee(null);
      }
    };
    window.addEventListener("popstate", onNav);
    window.addEventListener("app:navigate", onNav);
    return () => {
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("app:navigate", onNav);
    };
  }, [committees]);

  // Если нет id - показываем список комитетов
  if (!committee) {
    const getChairman = (c) => {
      if (!c || !Array.isArray(c.members)) return null;
      const chairman = c.members.find((m) => 
        m && m.role && typeof m.role === "string" && m.role.toLowerCase().includes("председатель")
      );
      return chairman && typeof chairman.name === "string" ? chairman.name : null;
    };

    return (
      <section className="section">
        <div className="container">
          <div className="page-grid">
            <div className="page-grid__main">
              <h1>Комитеты</h1>
              <DataState
                loading={Boolean(loading?.committees) && (!committees || committees.length === 0)}
                error={errors?.committees}
                onRetry={reload}
                empty={!loading?.committees && (!committees || committees.length === 0)}
                emptyDescription="Комитеты не найдены"
              >
                <div className="grid cols-2" style={{ marginTop: 20, gap: 16 }}>
                  {(committees || []).filter((c) => c && c.id && c.title).map((c) => {
                    const chairman = getChairman(c);
                    const title = typeof c.title === "string" ? c.title : "Комитет";
                    return (
                      <a
                        key={c.id}
                        href={`/committee?id=${encodeURIComponent(String(c.id))}`}
                        className="tile"
                        style={{
                          display: "block",
                          padding: 24,
                          textDecoration: "none",
                          transition: "transform 160ms ease, box-shadow 200ms ease",
                          border: "1px solid rgba(0, 51, 102, 0.1)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 51, 102, 0.15)";
                          e.currentTarget.style.borderColor = "rgba(0, 51, 102, 0.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "";
                          e.currentTarget.style.borderColor = "rgba(0, 51, 102, 0.1)";
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 14, color: "#003366", lineHeight: 1.3 }}>
                          {title}
                        </div>
                        {chairman && typeof chairman === "string" && (
                          <div style={{ color: "#6b7280", fontSize: 14, marginTop: 10, lineHeight: 1.5 }}>
                            <strong style={{ color: "#374151" }}>Председатель:</strong> {chairman}
                          </div>
                        )}
                        <div style={{ marginTop: 16, color: "#003366", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                          Подробнее <span style={{ fontSize: 16 }}>→</span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </DataState>
            </div>
            <SideNav />
          </div>
        </div>
      </section>
    );
  }

  const resolveMember = (m) => {
    if (!m || typeof m !== "object") return null;
    // Try resolve by id first, then by full name (case-insensitive)
    let d = m.id ? (deputies || []).find((x) => x && x.id === m.id) : null;
    if (!d && m.name && typeof m.name === "string") {
      const target = m.name.trim().toLowerCase();
      d = (deputies || []).find((x) => x && x.name && typeof x.name === "string" && x.name.trim().toLowerCase() === target);
    }
    const PLACEHOLDER =
      "https://www.shutterstock.com/image-vector/default-avatar-profile-icon-vector-600nw-2027875490.jpg";
    return {
      id: m.id || d?.id || (typeof m.name === "string" ? m.name : String(m.id || "")),
      name: (d?.name && typeof d.name === "string") ? d.name : (typeof m.name === "string" ? m.name : ""),
      role: typeof m.role === "string" ? m.role : "",
      photo: (d?.photo && typeof d.photo === "string") ? d.photo : ((typeof m.photo === "string" && m.photo) ? m.photo : PLACEHOLDER),
      phone: (d?.contacts?.phone && typeof d.contacts.phone === "string") ? d.contacts.phone : (typeof m.phone === "string" ? m.phone : ""),
      email: (d?.contacts?.email && typeof d.contacts.email === "string") ? d.contacts.email : (typeof m.email === "string" ? m.email : ""),
      address: (d?.address && typeof d.address === "string") ? d.address : (typeof m.address === "string" ? m.address : ""),
      faction: typeof d?.faction === "string" ? d.faction : "",
      district: typeof d?.district === "string" ? d.district : "",
      convocation: typeof d?.convocation === "string" ? d.convocation : "",
      position: typeof d?.position === "string" ? d.position : "",
    };
  };

  const members = (committee.members || []).map(resolveMember).filter(Boolean);
  // Находим председателя (тот, у кого роль содержит "председатель")
  const leader = members.find((m) => 
    m.role && m.role.toLowerCase().includes("председатель")
  ) || members[0];
  // Остальные члены (исключаем председателя)
  const rest = members.filter((m) => m.id !== leader?.id);
  const staff = Array.isArray(committee.staff) ? committee.staff : [];
  const backToCommittee = encodeURIComponent(`/committee?id=${encodeURIComponent(committee.id)}`);

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div className="page-grid__main">
            <a
              href="/committee"
              className="btn btn-back"
              style={{ marginBottom: 24, display: "inline-block" }}
            >
              ← К списку комитетов
            </a>
            <h1 className="h1-compact">{committee.title}</h1>

            {/* Председатель */}
            {leader ? (
              <>
                <h2 style={{ marginTop: 24 }}>Председатель</h2>
                <div className="orgv2__chain" style={{ marginTop: 8 }}>
                  <div className="orgv2__line" />
                  <div className="person-card person-card--committee">
                    <img className="person-card__photo" src={leader.photo} alt="" loading="lazy" />
                    <div className="person-card__body">
                      <div className="person-card__name">{leader.name}</div>
                      <div className="person-card__role">{leader.role || "Председатель Комитета"}</div>
                      <ul className="person-card__meta">
                        {leader.phone && <li>📞 {leader.phone}</li>}
                        {leader.email && <li>✉️ {leader.email}</li>}
                        {leader.address && <li>📍 {leader.address}</li>}
                      </ul>
                      {leader.id && (
                        <a
                          className="btn btn--primary btn--compact"
                          href={`/government?type=dep&id=${encodeURIComponent(leader.id)}&back=${backToCommittee}`}
                        >
                          Подробнее
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {/* Остальные члены комитета */}
            {rest.length > 0 ? (
              <>
                <h2 style={{ marginTop: 32 }}>Члены комитета</h2>
                <div className="grid cols-3" style={{ marginTop: 16, gap: 16 }}>
                  {rest.map((m, idx) => (
                    <div key={m.id || idx} className="gov-card">
                      <div className="gov-card__top">
                        <img className="gov-card__avatar" src={m.photo} alt="" loading="lazy" />
                      </div>
                      <div className="gov-card__body">
                        <div className="gov-card__name">{m.name}</div>
                        <div className="gov-card__role">
                          {m.role || "Член комитета"}
                        </div>
                        <ul className="gov-meta">
                          {m.convocation && (
                            <li>
                              <span>🎖️</span>
                              <span>Созыв: {m.convocation}</span>
                            </li>
                          )}
                          {m.district && (
                            <li>
                              <span>🏛️</span>
                              <span>{m.district}</span>
                            </li>
                          )}
                          {m.faction && (
                            <li>
                              <span>👥</span>
                              <span>{m.faction}</span>
                            </li>
                          )}
                          {m.phone && (
                            <li>
                              <span>📞</span>
                              <span>{m.phone}</span>
                            </li>
                          )}
                          {m.email && (
                            <li>
                              <span>✉️</span>
                              <span>{m.email}</span>
                            </li>
                          )}
                        </ul>
                      </div>
                      <div className="gov-card__actions">
                        <a
                          className="gov-card__btn"
                          href={
                            m.id
                              ? `/government?type=dep&id=${encodeURIComponent(
                                  m.id
                                )}&back=${backToCommittee}`
                              : "#"
                          }
                        >
                          Подробнее
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
            {staff.length ? (
              <>
                <h3 style={{ marginTop: 16 }}>Сотрудники комитета</h3>
                <ul className="person-card__meta">
                  {staff.map((s, i) => (
                    <li key={i}>
                      <strong>{s.name}</strong>
                      {s.role ? ` — ${s.role}` : ""}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
          <SideNav />
        </div>
      </div>
    </section>
  );
}
