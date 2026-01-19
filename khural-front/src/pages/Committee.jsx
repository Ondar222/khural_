import React from "react";
import { useData } from "../context/DataContext.jsx";
import SideNav from "../components/SideNav.jsx";
import DataState from "../components/DataState.jsx";
import { normalizeFilesUrl } from "../utils/filesUrl.js";
import { CommitteesApi } from "../api/client.js";
import {
  COMMITTEES_OVERRIDES_EVENT_NAME,
  COMMITTEES_OVERRIDES_STORAGE_KEY,
  readCommitteesOverrides,
} from "../utils/committeesOverrides.js";

function mergeCommitteesWithOverrides(base, overrides) {
  const created = Array.isArray(overrides?.created) ? overrides.created : [];
  const updatedById =
    overrides?.updatedById && typeof overrides.updatedById === "object"
      ? overrides.updatedById
      : {};
  const deletedIds = new Set(
    Array.isArray(overrides?.deletedIds) ? overrides.deletedIds.map(String) : []
  );

  const out = [];
  const seen = new Set();

  for (const it of Array.isArray(base) ? base : []) {
    const idStr = String(it?.id ?? "");
    if (!idStr) continue;
    if (deletedIds.has(idStr)) continue;
    const override = updatedById[idStr];
    out.push(override ? { ...it, ...override } : it);
    seen.add(idStr);
  }

  for (const it of created) {
    const idStr = String(it?.id ?? "");
    if (!idStr) continue;
    if (deletedIds.has(idStr)) continue;
    if (seen.has(idStr)) continue;
    const override = updatedById[idStr];
    out.push(override ? { ...it, ...override } : it);
    seen.add(idStr);
  }

  return out.sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
}

export default function Committee() {
  const { committees: committeesFromContext, deputies, loading, errors, reload } = useData();
  const [committee, setCommittee] = React.useState(null);
  const [apiCommittees, setApiCommittees] = React.useState(null);
  const [overridesSeq, setOverridesSeq] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const list = await CommitteesApi.list({ all: true }).catch(() => null);
      if (!alive) return;
      if (Array.isArray(list)) setApiCommittees(list);
    })();
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    const bump = () => setOverridesSeq((x) => x + 1);
    const onStorage = (e) => {
      if (e?.key === COMMITTEES_OVERRIDES_STORAGE_KEY) bump();
    };
    window.addEventListener(COMMITTEES_OVERRIDES_EVENT_NAME, bump);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(COMMITTEES_OVERRIDES_EVENT_NAME, bump);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const committees = React.useMemo(() => {
    const base = Array.isArray(apiCommittees) ? apiCommittees : committeesFromContext;
    return mergeCommitteesWithOverrides(base, readCommitteesOverrides());
  }, [apiCommittees, committeesFromContext, overridesSeq]);
  
  // Get current section from URL hash or default to "about"
  const [currentSection, setCurrentSection] = React.useState(() => {
    const hash = window.location.hash;
    if (hash.includes("#reports")) return "reports";
    if (hash.includes("#plans")) return "plans";
    if (hash.includes("#activities")) return "activities";
    if (hash.includes("#staff")) return "staff";
    return "about";
  });

  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search || "");
    const id = sp.get("id");
    if (id) {
    const c = (committees || []).find((x) => String(x?.id ?? "") === String(id));
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
      const c = (committees || []).find((x) => String(x?.id ?? "") === String(id));
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

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes("#reports")) setCurrentSection("reports");
      else if (hash.includes("#plans")) setCurrentSection("plans");
      else if (hash.includes("#activities")) setCurrentSection("activities");
      else if (hash.includes("#staff")) setCurrentSection("staff");
      else setCurrentSection("about");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Resolve members only if committee exists (moved before conditional return)
  const resolveMember = React.useCallback((m) => {
    if (!m || typeof m !== "object") return null;
    // Try resolve by id first, then by full name (case-insensitive)
    let d = m.id ? (deputies || []).find((x) => x && x.id === m.id) : null;
    if (!d && m.name && typeof m.name === "string") {
      const target = m.name.trim().toLowerCase();
      d = (deputies || []).find((x) => x && x.name && typeof x.name === "string" && x.name.trim().toLowerCase() === target);
    }
    return {
      id: d?.id || m.id || (typeof m.name === "string" ? m.name : String(m.id || "")),
      name: (d?.name && typeof d.name === "string") ? d.name : (typeof m.name === "string" ? m.name : ""),
      role: typeof m.role === "string" ? m.role : "",
      photo: normalizeFilesUrl(
        (d?.photo && typeof d.photo === "string" ? d.photo : "") ||
          (typeof m.photo === "string" ? m.photo : "") ||
          ""
      ),
      phone: (d?.contacts?.phone && typeof d.contacts.phone === "string") ? d.contacts.phone : (typeof m.phone === "string" ? m.phone : ""),
      email: (d?.contacts?.email && typeof d.contacts.email === "string") ? d.contacts.email : (typeof m.email === "string" ? m.email : ""),
      address: (d?.address && typeof d.address === "string") ? d.address : (typeof m.address === "string" ? m.address : ""),
      faction: typeof d?.faction === "string" ? d.faction : "",
      district: typeof d?.district === "string" ? d.district : "",
      convocation: typeof d?.convocation === "string" ? d.convocation : "",
      position: typeof d?.position === "string" ? d.position : "",
    };
  }, [deputies]);

  // Если нет id - показываем список комитетов
  if (!committee) {
    const getChairman = (c) => {
      if (!c) return null;
      if (typeof c.head === "string" && c.head.trim()) return c.head.trim();
      if (!Array.isArray(c.members)) return null;
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
                  {(committees || []).filter((c) => c && c.id && (c.name || c.title)).map((c) => {
                    const chairman = getChairman(c);
                    const title = typeof c.name === "string" ? c.name : (typeof c.title === "string" ? c.title : "Комитет");
                    const desc =
                      (typeof c.shortDescription === "string" && c.shortDescription.trim())
                        ? c.shortDescription.trim()
                        : (typeof c.description === "string" && c.description.trim())
                          ? c.description.trim()
                          : "";
                    const phone = typeof c.phone === "string" ? c.phone.trim() : "";
                    const email = typeof c.email === "string" ? c.email.trim() : "";
                    const address = typeof c.address === "string" ? c.address.trim() : "";
                    const website = typeof c.website === "string" ? c.website.trim() : "";
                    return (
                      <a
                        key={String(c.id)}
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
                        {desc ? (
                          <div style={{ opacity: 0.8, fontSize: 13, lineHeight: 1.45, color: "#4b5563" }}>
                            {desc.length > 180 ? `${desc.slice(0, 180)}…` : desc}
                          </div>
                        ) : null}
                        {chairman && typeof chairman === "string" && (
                          <div style={{ color: "#6b7280", fontSize: 14, marginTop: 10, lineHeight: 1.5 }}>
                            <strong style={{ color: "#374151" }}>Председатель:</strong> {chairman}
                          </div>
                        )}
                        {phone || email || address || website ? (
                          <div style={{ marginTop: 10, color: "#6b7280", fontSize: 13, lineHeight: 1.55 }}>
                            {phone ? (
                              <div>
                                <strong style={{ color: "#374151" }}>Телефон:</strong> {phone}
                              </div>
                            ) : null}
                            {email ? (
                              <div>
                                <strong style={{ color: "#374151" }}>Email:</strong> {email}
                              </div>
                            ) : null}
                            {address ? (
                              <div>
                                <strong style={{ color: "#374151" }}>Адрес:</strong> {address}
                              </div>
                            ) : null}
                            {website ? (
                              <div>
                                <strong style={{ color: "#374151" }}>Сайт:</strong> {website}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
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

  // Resolve members only if committee exists
  const members = committee ? ((committee.members || []).map(resolveMember).filter(Boolean)) : [];
  // Находим председателя (тот, у кого роль содержит "председатель")
  const leader = members.find((m) => 
    m.role && m.role.toLowerCase().includes("председатель")
  ) || members[0];
  // Остальные члены (исключаем председателя)
  const rest = members.filter((m) => m.id !== leader?.id);
  // Get reports, plans, activities, staff (only if committee exists)
  const reports = committee ? (Array.isArray(committee.reports) ? committee.reports : []) : [];
  const plans = committee ? (Array.isArray(committee.plans) ? committee.plans : []) : [];
  const activities = committee ? (Array.isArray(committee.activities) ? committee.activities : []) : [];
  const staff = committee ? (Array.isArray(committee.staff) ? committee.staff : []) : [];
  const backToCommittee = committee ? encodeURIComponent(`/committee?id=${encodeURIComponent(committee.id)}`) : "";

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
            <h1 className="h1-compact">{committee.name || committee.title}</h1>

            {/* Краткая информация о комитете */}
            {(committee.shortDescription || committee.description) && (
              <div style={{ marginTop: 16, padding: 20, background: "#f9fafb", borderRadius: 8 }}>
                <div style={{ fontSize: 16, lineHeight: 1.6, color: "#374151" }}>
                  {committee.shortDescription || committee.description}
                </div>
              </div>
            )}

            {/* Контент в зависимости от выбранной секции */}
            {currentSection === "about" && (
              <>
                {/* Контакты комитета */}
                {(committee.phone || committee.email || committee.address || committee.website) ? (
                  <div className="card" style={{ marginTop: 18, padding: 18 }}>
                    <div style={{ fontWeight: 800, marginBottom: 10 }}>Контакты</div>
                    <ul className="gov-meta" style={{ marginTop: 0 }}>
                      {committee.phone ? (
                        <li>
                          <span>📞</span>
                          <span>{committee.phone}</span>
                        </li>
                      ) : null}
                      {committee.email ? (
                        <li>
                          <span>✉️</span>
                          <span>{committee.email}</span>
                        </li>
                      ) : null}
                      {committee.address ? (
                        <li>
                          <span>📍</span>
                          <span>{committee.address}</span>
                        </li>
                      ) : null}
                      {committee.website ? (
                        <li>
                          <span>🌐</span>
                          <span>{committee.website}</span>
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}

                {/* Руководитель (если задан вручную в админке и нет членов) */}
                {!leader && committee.head ? (
                  <div style={{ marginTop: 24 }}>
                    <h2 style={{ marginTop: 0 }}>Руководитель</h2>
                    <div className="card" style={{ padding: 18 }}>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{committee.head}</div>
                      <div style={{ marginTop: 6, color: "#6b7280" }}>
                        Руководитель комитета (указан в админке)
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Председатель */}
            {leader ? (
              <>
                <h2 style={{ marginTop: 24 }}>Председатель</h2>
                <div className="orgv2__chain" style={{ marginTop: 8 }}>
                  <div className="orgv2__line" />
                  <div className="person-card person-card--committee">
                    {leader.photo ? (
                      <img className="person-card__photo" src={leader.photo} alt="" loading="lazy" />
                    ) : (
                      <div className="person-card__photo" aria-hidden="true" />
                    )}
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
                        {m.photo ? (
                          <img className="gov-card__avatar" src={m.photo} alt="" loading="lazy" />
                        ) : (
                          <div className="gov-card__avatar" aria-hidden="true" />
                        )}
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
              </>
            )}

            {/* Отчеты */}
            {currentSection === "reports" && (
              <div>
                <h2 style={{ marginTop: 24 }}>Отчеты комитета</h2>
                {reports.length > 0 ? (
                  <div style={{ marginTop: 16 }}>
                    {reports.map((report, idx) => (
                      <div key={idx} className="card" style={{ marginBottom: 16, padding: 20 }}>
                        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
                          {report.title || `Отчет ${idx + 1}`}
                        </div>
                        {report.date && (
                          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
                            Дата: {report.date}
                          </div>
                        )}
                        {report.description && (
                          <div style={{ marginBottom: 12, lineHeight: 1.6 }}>
                            {report.description}
                          </div>
                        )}
                        {(report.fileLink || report.fileId) && (
                          <a
                            href={report.fileLink || `/files/${report.fileId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn--primary"
                          >
                            Скачать отчет
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginTop: 16, padding: 40, textAlign: "center", color: "#6b7280" }}>
                    Отчеты пока не добавлены
                  </div>
                )}
              </div>
            )}

            {/* Планы */}
            {currentSection === "plans" && (
              <div>
                <h2 style={{ marginTop: 24 }}>Планы комитета</h2>
                {plans.length > 0 ? (
                  <div style={{ marginTop: 16 }}>
                    {plans.map((plan, idx) => (
                      <div key={idx} className="card" style={{ marginBottom: 16, padding: 20 }}>
                        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
                          {plan.title || `План ${idx + 1}`}
                        </div>
                        {plan.date && (
                          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
                            Дата: {plan.date}
                          </div>
                        )}
                        {plan.description && (
                          <div style={{ marginBottom: 12, lineHeight: 1.6 }}>
                            {plan.description}
                          </div>
                        )}
                        {(plan.fileLink || plan.fileId) && (
                          <a
                            href={plan.fileLink || `/files/${plan.fileId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn--primary"
                          >
                            Скачать план
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginTop: 16, padding: 40, textAlign: "center", color: "#6b7280" }}>
                    Планы пока не добавлены
                  </div>
                )}
              </div>
            )}

            {/* Деятельность */}
            {currentSection === "activities" && (
              <div>
                <h2 style={{ marginTop: 24 }}>Деятельность комитета</h2>
                {activities.length > 0 ? (
                  <div style={{ marginTop: 16 }}>
                    {activities.map((activity, idx) => (
                      <div key={idx} className="card" style={{ marginBottom: 16, padding: 20 }}>
                        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
                          {activity.title || `Деятельность ${idx + 1}`}
                        </div>
                        {activity.date && (
                          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
                            Дата: {activity.date}
                          </div>
                        )}
                        {activity.type && (
                          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
                            Тип: {activity.type}
                          </div>
                        )}
                        {activity.description && (
                          <div style={{ lineHeight: 1.6 }}>
                            {activity.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginTop: 16, padding: 40, textAlign: "center", color: "#6b7280" }}>
                    Информация о деятельности пока не добавлена
                  </div>
                )}
              </div>
            )}

            {/* Сотрудники */}
            {currentSection === "staff" && (
              <div>
                <h2 style={{ marginTop: 24 }}>Сотрудники комитета</h2>
                {staff.length > 0 ? (
                  <div className="grid cols-3" style={{ marginTop: 16, gap: 16 }}>
                    {staff.map((s, i) => (
                      <div key={i} className="gov-card">
                        <div className="gov-card__body">
                          <div className="gov-card__name">{s.name || "Сотрудник"}</div>
                          {s.role && <div className="gov-card__role">{s.role}</div>}
                          {s.phone && (
                            <ul className="gov-meta">
                              <li>
                                <span>📞</span>
                                <span>{s.phone}</span>
                              </li>
                            </ul>
                          )}
                          {s.email && (
                            <ul className="gov-meta">
                              <li>
                                <span>✉️</span>
                                <span>{s.email}</span>
                              </li>
                            </ul>
                          )}
                        </div>
                        {s.id && (
                          <div className="gov-card__actions">
                            <a
                              className="gov-card__btn"
                              href={`/committee/staff/${s.id}?committee=${encodeURIComponent(committee.id)}`}
                            >
                              Подробнее
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginTop: 16, padding: 40, textAlign: "center", color: "#6b7280" }}>
                    Сотрудники пока не добавлены
                  </div>
                )}
              </div>
            )}
          </div>
          <SideNav
            title={committee.name || committee.title}
            links={[
              { label: "О комитете", href: `/committee?id=${committee.id}#about` },
              { label: "Отчеты", href: `/committee?id=${committee.id}#reports` },
              { label: "Планы", href: `/committee?id=${committee.id}#plans` },
              { label: "Деятельность", href: `/committee?id=${committee.id}#activities` },
              { label: "Сотрудники", href: `/committee?id=${committee.id}#staff` },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
