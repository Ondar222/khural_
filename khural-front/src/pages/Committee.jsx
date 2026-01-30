import React from "react";
import { useData } from "../context/DataContext.jsx";
import SideNav from "../components/SideNav.jsx";
import DataState from "../components/DataState.jsx";
import { normalizeFilesUrl } from "../utils/filesUrl.js";
import { CommitteesApi, ConvocationsApi } from "../api/client.js";
import {
  COMMITTEES_OVERRIDES_EVENT_NAME,
  COMMITTEES_OVERRIDES_STORAGE_KEY,
  readCommitteesOverrides,
} from "../utils/committeesOverrides.js";
import { toCommitteeHtml } from "../utils/committeeHtml.js";

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

function normalizeCommitteeTitle(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function mergeCommitteesPreferApi(apiList, fallbackList) {
  const api = Array.isArray(apiList) ? apiList : [];
  const fallback = Array.isArray(fallbackList) ? fallbackList : [];
  const out = api.map((c) => ({ ...c }));
  const byId = new Map();
  const byName = new Map();

  for (const c of out) {
    const id = String(c?.id ?? "");
    if (id) byId.set(id, c);
    const nameKey = normalizeCommitteeTitle(c?.title || c?.name || c?.label || c?.description);
    if (nameKey) byName.set(nameKey, c);
  }

  for (const c of fallback) {
    const id = String(c?.id ?? "");
    const nameKey = normalizeCommitteeTitle(c?.title || c?.name || c?.label || c?.description);
    const target = (id && byId.get(id)) || (nameKey && byName.get(nameKey)) || null;
    if (target) {
      if (!target.title && c?.title) target.title = c.title;
      if (!target.name && c?.name) target.name = c.name;
      if (!target.description && c?.description) target.description = c.description;
      if (!Array.isArray(target.members) && Array.isArray(c?.members)) target.members = c.members;
      if (!Array.isArray(target.staff) && Array.isArray(c?.staff)) target.staff = c.staff;
      if (!target.convocation && c?.convocation) target.convocation = c.convocation;
      continue;
    }
    out.push(c);
  }

  return out;
}

function resolveConvocationName(list, convId) {
  if (!convId) return "";
  const items = Array.isArray(list) ? list : [];
  for (const it of items) {
    if (it == null) continue;
    if (typeof it === "string") {
      if (String(it) === String(convId)) return it;
      continue;
    }
    const id = it?.id ?? it?.value;
    const name = it?.name ?? it?.number ?? it?.title;
    if (id != null && String(id) === String(convId)) return String(name || id);
    if (name != null && String(name) === String(convId)) return String(name);
  }
  return "";
}

export default function Committee() {
  const { committees: committeesFromContext, deputies, convocations, loading, errors, reload } = useData();
  const [committee, setCommittee] = React.useState(null);
  const [apiCommittees, setApiCommittees] = React.useState(null);
  const [overridesSeq, setOverridesSeq] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        console.log("[Committee] Загрузка комитетов через API...");
        const list = await CommitteesApi.list({ all: true });
        console.log("[Committee] Ответ API:", list);
        console.log("[Committee] Тип ответа:", typeof list, Array.isArray(list));
        if (!alive) return;
        if (Array.isArray(list)) {
          console.log("[Committee] Установлено комитетов:", list.length);
          setApiCommittees(list);
        } else {
          console.warn("[Committee] API вернул не массив:", list);
          // Если API вернул объект с data, попробуем извлечь массив
          if (list && typeof list === "object" && Array.isArray(list.data)) {
            console.log("[Committee] Извлечен массив из list.data:", list.data.length);
            setApiCommittees(list.data);
          } else if (list && typeof list === "object" && Array.isArray(list.committees)) {
            console.log("[Committee] Извлечен массив из list.committees:", list.committees.length);
            setApiCommittees(list.committees);
          }
        }
      } catch (error) {
        console.error("[Committee] Ошибка загрузки комитетов:", error);
        if (!alive) return;
        // Не устанавливаем null, чтобы использовать данные из контекста
      }
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
    const base = mergeCommitteesPreferApi(apiCommittees, committeesFromContext);
    const merged = mergeCommitteesWithOverrides(base, readCommitteesOverrides());
    console.log("[Committee] Итоговый список комитетов:", {
      apiCommittees: apiCommittees?.length || 0,
      committeesFromContext: committeesFromContext?.length || 0,
      merged: merged?.length || 0,
      base: Array.isArray(base) ? base.length : "не массив",
    });
    return merged;
  }, [apiCommittees, committeesFromContext, overridesSeq]);
  
  // Get current section from URL hash or default to "about"
  const [currentSection, setCurrentSection] = React.useState(() => {
    const hash = window.location.hash;
    if (hash.includes("#documents")) return "documents";
    if (hash.includes("#reports")) return "reports";
    if (hash.includes("#plans")) return "plans";
    if (hash.includes("#activities")) return "activities";
    if (hash.includes("#staff")) return "staff";
    return "about";
  });

  // State for reports/agendas navigation (must be declared before useEffect that uses them)
  const [reportsCategory, setReportsCategory] = React.useState(() => {
    if (typeof window === "undefined") return "reports";
    const hash = window.location.hash;
    if (hash.includes("#agendas")) return "agendas";
    return "reports";
  });
  const [selectedYear, setSelectedYear] = React.useState(() => {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash;
    const yearMatch = hash.match(/#(?:reports|agendas)-(\d{4})/);
    return yearMatch ? yearMatch[1] : null;
  });

  // State for documents view (grouped by category and year)
  const [documentsCategory, setDocumentsCategory] = React.useState(() => {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash;
    if (hash.includes("#documents-agenda")) return "agenda";
    if (hash.includes("#documents-report")) return "report";
    return null;
  });
  const [documentsYear, setDocumentsYear] = React.useState(() => {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash;
    const yearMatch = hash.match(/#documents-(?:agenda|report)-(\d{4})/);
    return yearMatch ? yearMatch[1] : null;
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
    // Прокручиваем вверх при загрузке или изменении комитета
    window.scrollTo({ top: 0, behavior: "instant" });
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
      // Прокручиваем вверх при навигации
      window.scrollTo({ top: 0, behavior: "instant" });
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
      if (hash === "#documents" || hash.startsWith("#documents")) {
        setCurrentSection("documents");
        if (hash.includes("#documents-agenda")) {
          setDocumentsCategory("agenda");
          const yearMatch = hash.match(/#documents-agenda-(\d{4})/);
          setDocumentsYear(yearMatch ? yearMatch[1] : null);
        } else if (hash.includes("#documents-report")) {
          setDocumentsCategory("report");
          const yearMatch = hash.match(/#documents-report-(\d{4})/);
          setDocumentsYear(yearMatch ? yearMatch[1] : null);
        } else {
          setDocumentsCategory(null);
          setDocumentsYear(null);
        }
      } else if (hash === "#agendas" || hash.startsWith("#agendas")) {
        setCurrentSection("reports");
        setReportsCategory("agendas");
        const yearMatch = hash.match(/#agendas-(\d{4})/);
        setSelectedYear(yearMatch ? yearMatch[1] : null);
      } else if (hash === "#reports" || hash.startsWith("#reports")) {
        setCurrentSection("reports");
        setReportsCategory("reports");
        const yearMatch = hash.match(/#reports-(\d{4})/);
        setSelectedYear(yearMatch ? yearMatch[1] : null);
      } else if (hash === "#plans" || hash.startsWith("#plans")) {
        setCurrentSection("plans");
      } else if (hash === "#activities" || hash.startsWith("#activities")) {
        setCurrentSection("activities");
      } else if (hash === "#staff" || hash.startsWith("#staff")) {
        setCurrentSection("staff");
      } else {
        // Default to "about" section (including #about or empty hash)
        setCurrentSection("about");
        setSelectedYear(null);
        setDocumentsCategory(null);
        setDocumentsYear(null);
        setReportsCategory("reports"); // Reset to default
      }
      // Прокручиваем вверх при изменении hash
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    handleHashChange(); // Call immediately to set initial state
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);
  
  // Прокручиваем вверх при загрузке страницы комитета
  const committeeIdForScroll = committee?.id;
  React.useEffect(() => {
    if (committeeIdForScroll) {
      // Небольшая задержка, чтобы убедиться, что контент загружен
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [committeeIdForScroll]);

  // Resolve members only if committee exists (moved before conditional return)
  const resolveMember = React.useCallback((m) => {
    if (!m || typeof m !== "object") return null;
    // Try resolve by id/personId first, then by full name (case-insensitive)
    const refId = m.personId ?? m?.person?.id ?? m.id ?? "";
    let d = refId ? (deputies || []).find((x) => x && String(x.id) === String(refId)) : null;
    if (!d && m.name && typeof m.name === "string") {
      const target = m.name.trim().toLowerCase();
      d = (deputies || []).find((x) => x && x.name && typeof x.name === "string" && x.name.trim().toLowerCase() === target);
    }
    return {
      id: d?.id || refId || (typeof m.name === "string" ? m.name : String(refId || "")),
      name:
        (d?.name && typeof d.name === "string")
          ? d.name
          : (typeof m.name === "string"
              ? m.name
              : (typeof m?.person?.fullName === "string" ? m.person.fullName : "")),
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

  // Extract year from date string (must be before early return)
  const extractYear = React.useCallback((dateStr) => {
    if (!dateStr) return null;
    const match = String(dateStr).match(/(\d{4})/);
    return match ? match[1] : null;
  }, []);

  // Group documents by year (must be before early return)
  const groupByYear = React.useCallback((items) => {
    const grouped = {};
    items.forEach((item) => {
      const year = extractYear(item.date || item.year);
      if (year) {
        if (!grouped[year]) grouped[year] = [];
        grouped[year].push(item);
      }
    });
    // Sort years descending
    const sortedYears = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a));
    return { grouped, sortedYears };
  }, [extractYear]);

  // Load documents from convocations for this committee
  const [convocationDocuments, setConvocationDocuments] = React.useState([]);
  
  const committeeIdForDocs = committee?.id;
  React.useEffect(() => {
    if (!committeeIdForDocs) {
      setConvocationDocuments([]);
      return;
    }
    
    let alive = true;
    (async () => {
      try {
        // Load all convocations
        const convocations = await ConvocationsApi.list({ activeOnly: false }).catch(() => []);
        if (!alive) return;
        
        // Extract documents for this committee from all convocations
        const committeeId = String(committeeIdForDocs);
        const allDocs = [];
        
        (Array.isArray(convocations) ? convocations : []).forEach((conv) => {
          const docs = Array.isArray(conv.documents) ? conv.documents : [];
          docs.forEach((doc) => {
            if (doc.committeeId && String(doc.committeeId) === committeeId) {
              allDocs.push(doc);
            }
          });
        });
        
        setConvocationDocuments(allDocs);
      } catch (error) {
        console.error("Failed to load convocation documents:", error);
        if (alive) setConvocationDocuments([]);
      }
    })();
    
    return () => { alive = false; };
  }, [committeeIdForDocs]);

  // Get reports, plans, activities, staff (only if committee exists)
  // Combine committee's own reports/agendas with documents from convocations
  const committeeReports = committee ? (Array.isArray(committee.reports) ? committee.reports : []) : [];
  const committeeAgendas = committee ? (Array.isArray(committee.agendas) ? committee.agendas : []) : [];
  
  // Merge convocation documents with committee's own documents
  const reports = React.useMemo(() => {
    const convReports = convocationDocuments.filter(doc => doc.category === "report");
    return [...committeeReports, ...convReports];
  }, [committeeReports, convocationDocuments]);
  
  const agendas = React.useMemo(() => {
    const convAgendas = convocationDocuments.filter(doc => doc.category === "agenda");
    return [...committeeAgendas, ...convAgendas];
  }, [committeeAgendas, convocationDocuments]);
  
  const plans = committee ? (Array.isArray(committee.plans) ? committee.plans : []) : [];
  const activities = committee ? (Array.isArray(committee.activities) ? committee.activities : []) : [];
  const staff = committee ? (Array.isArray(committee.staff) ? committee.staff : []) : [];

  // Group by year (must be before early return)
  const { grouped: agendasByYear, sortedYears: agendaYears } = groupByYear(agendas);
  const { grouped: reportsByYear, sortedYears: reportYears } = groupByYear(reports);

  // Group all documents by category and year (for "Documents" view)
  const documentsByCategoryAndYear = React.useMemo(() => {
    if (!committee) return {};
    
    // Combine reports and agendas with category markers
    const allDocs = [
      ...reports.map(doc => ({ ...doc, category: "report" })),
      ...agendas.map(doc => ({ ...doc, category: "agenda" })),
    ];
    
    const grouped = {};
    allDocs.forEach((doc) => {
      const category = doc.category || "report";
      if (!grouped[category]) {
        grouped[category] = {};
      }
      const year = extractYear(doc.date);
      if (year) {
        if (!grouped[category][year]) {
          grouped[category][year] = [];
        }
        grouped[category][year].push(doc);
      }
    });
    
    // Sort years for each category
    const result = {};
    Object.keys(grouped).forEach((category) => {
      const years = Object.keys(grouped[category]).sort((a, b) => parseInt(b) - parseInt(a));
      result[category] = {
        years,
        documents: grouped[category],
      };
    });
    
    return result;
  }, [committee, reports, agendas, extractYear]);

  // Resolve members only if committee exists
  const members = committee ? ((committee.members || []).map(resolveMember).filter(Boolean)) : [];
  // Находим председателя (тот, у кого роль содержит "председатель")
  const leader = members.find((m) => 
    m.role && m.role.toLowerCase().includes("председатель")
  ) || members[0];
  // Остальные члены (исключаем председателя)
  const rest = members.filter((m) => m.id !== leader?.id);
  const backToCommittee = committee ? encodeURIComponent(`/committee?id=${encodeURIComponent(committee.id)}`) : "";

  // Если нет id - показываем список комитетов
  if (!committee) {
    const getChairman = (c) => {
      if (!c) return null;
      if (typeof c.head === "string" && c.head.trim()) return c.head.trim();
      if (!Array.isArray(c.members)) return null;
      const chairman = c.members.find((m) => 
        m && m.role && typeof m.role === "string" && m.role.toLowerCase().includes("председатель")
      );
      if (!chairman) return null;
      if (typeof chairman.name === "string" && chairman.name.trim()) return chairman.name.trim();
      const refId = chairman.personId ?? chairman?.person?.id ?? chairman.id ?? "";
      const d = refId ? (deputies || []).find((x) => x && String(x.id) === String(refId)) : null;
      const dn = d?.name || d?.fullName;
      return typeof dn === "string" && dn.trim() ? dn.trim() : null;
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
                        {(() => {
                          const convId = c?.convocation?.id || c?.convocationId || c?.convocation;
                          let convName = null;
                          
                          if (convId && Array.isArray(convocations)) {
                            convName = resolveConvocationName(convocations, convId) || null;
                          }
                          if (!convName && c?.convocation?.name) {
                            convName = c.convocation.name;
                          } else if (!convName && c?.convocation?.number) {
                            convName = c.convocation.number;
                          }
                          
                          return convName ? (
                            <div style={{ color: "#1e40af", fontSize: 13, marginTop: 8, fontWeight: 600 }}>
                              Созыв: {convName}
                            </div>
                          ) : null;
                        })()}
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


  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div className="page-grid__main">
            <div className="committee-detail__titlebar">
              <a href="/committee" className="btn btn-back committee-detail__back">
                ← К списку комитетов
              </a>
              <h1 className="h1-compact committee-detail__title">
                {committee.name || committee.title}
              </h1>
            </div>

            {/* Информация о созыве */}
            {(() => {
              const convId = committee?.convocation?.id || committee?.convocationId || committee?.convocation;
              let convName = null;
              
              if (convId) {
                // Пробуем найти созыв в списке созывов
                if (Array.isArray(convocations)) {
                  convName = resolveConvocationName(convocations, convId) || null;
                }
                // Если не нашли в списке, используем значение из комитета
                if (!convName && committee?.convocation?.name) {
                  convName = committee.convocation.name;
                } else if (!convName && committee?.convocation?.number) {
                  convName = committee.convocation.number;
                }
              }
              
              if (convName) {
                return (
                  <div style={{ marginTop: 16, padding: 16, background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#1e40af" }}>Созыв:</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#1e3a8a" }}>{convName}</span>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Краткая информация о комитете */}
            {(committee.shortDescription || committee.description) && (
              <div style={{ marginTop: 16, padding: 20, background: "#f9fafb", borderRadius: 8 }}>
                <div
                  style={{ fontSize: 16, lineHeight: 1.6, color: "#374151" }}
                  dangerouslySetInnerHTML={{
                    __html: toCommitteeHtml(committee.shortDescription || committee.description),
                  }}
                />
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
                      <img 
                        className="person-card__photo" 
                        src={leader.photo} 
                        alt="" 
                        loading="lazy"
                        onError={(e) => {
                          const img = e.target;
                          const currentSrc = img.src;
                          
                          if (currentSrc.includes("khural.rtyva.ru") && !img.dataset.proxyTried) {
                            img.dataset.proxyTried = "true";
                            img.src = currentSrc.replace("https://khural.rtyva.ru", "/img-proxy");
                          } else {
                            img.style.display = "";
                            img.removeAttribute("src");
                            img.classList.remove("person-card__photo");
                            img.classList.add("person-card__photo-placeholder");
                          }
                        }}
                      />
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
                          <img 
                            className="gov-card__avatar" 
                            src={m.photo} 
                            alt="" 
                            loading="lazy"
                            onError={(e) => {
                              const img = e.target;
                              const currentSrc = img.src;
                              
                              if (currentSrc.includes("khural.rtyva.ru") && !img.dataset.proxyTried) {
                                img.dataset.proxyTried = "true";
                                img.src = currentSrc.replace("https://khural.rtyva.ru", "/img-proxy");
                              } else {
                                img.style.display = "";
                                img.removeAttribute("src");
                                img.classList.remove("gov-card__avatar");
                                img.classList.add("gov-card__avatar-placeholder");
                              }
                            }}
                          />
                        ) : (
                          <div className="gov-card__avatar" aria-hidden="true" />
                        )}
                      </div>
                      <div className="gov-card__body">
                        <div className="gov-card__name">{m.name}</div>
                        <div className="gov-card__role">
                            {m.role && String(m.role).length <= 80 ? m.role : "Член комитета"}
                        </div>
                        <ul className="gov-meta">
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

            {/* Отчеты и Повестки */}
            {currentSection === "reports" && (
              <div>
                <h2 style={{ marginTop: 24 }}>Отчеты и повестки комитета</h2>
                
                {/* Category selector */}
                <div style={{ display: "flex", gap: 12, marginTop: 20, marginBottom: 24 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setReportsCategory("agendas");
                      setSelectedYear(null);
                      window.location.hash = "#agendas";
                    }}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 8,
                      border: "1px solid rgba(0, 51, 102, 0.2)",
                      background: reportsCategory === "agendas" ? "rgba(0, 51, 102, 0.1)" : "#fff",
                      color: reportsCategory === "agendas" ? "#003366" : "#6b7280",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 15,
                    }}
                  >
                    Повестки
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReportsCategory("reports");
                      setSelectedYear(null);
                      window.location.hash = "#reports";
                    }}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 8,
                      border: "1px solid rgba(0, 51, 102, 0.2)",
                      background: reportsCategory === "reports" ? "rgba(0, 51, 102, 0.1)" : "#fff",
                      color: reportsCategory === "reports" ? "#003366" : "#6b7280",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 15,
                    }}
                  >
                    Отчеты
                  </button>
                </div>

                {reportsCategory === "agendas" ? (
                  <>
                    {agendaYears.length > 0 ? (
                      <>
                        {!selectedYear ? (
                          <ul style={{ listStyle: "disc", paddingLeft: 24, marginTop: 20 }}>
                            {agendaYears.map((year) => (
                              <li key={year} style={{ marginBottom: 8 }}>
                                <a
                                  href={`#agendas-${year}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedYear(year);
                                    window.location.hash = `#agendas-${year}`;
                                  }}
                                  style={{ color: "#2563eb", textDecoration: "none", fontSize: 16 }}
                                >
                                  {year} год
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div>
                            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedYear(null);
                                  window.location.hash = "#agendas";
                                }}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 6,
                                  border: "1px solid rgba(0, 51, 102, 0.2)",
                                  background: "#fff",
                                  cursor: "pointer",
                                  fontSize: 14,
                                }}
                              >
                                ← Назад
                              </button>
                              <h3 style={{ margin: 0 }}>{selectedYear} год</h3>
                            </div>
                            <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
                              {agendasByYear[selectedYear].map((agenda, idx) => (
                                <li key={idx} style={{ marginBottom: 12, padding: 12, background: "#f9fafb", borderRadius: 6 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", padding: "4px 8px", background: "#fff", borderRadius: 4 }}>
                                      DOC
                                    </span>
                                    <div style={{ flex: 1 }}>
                                      <a
                                        href={agenda.fileLink ? normalizeFilesUrl(agenda.fileLink) : (agenda.fileId ? normalizeFilesUrl(`/files/v2/${agenda.fileId}`) : "#")}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: "#2563eb", textDecoration: "none", fontSize: 15, fontWeight: 500 }}
                                      >
                                        {agenda.title || `Повестка заседания комитета от ${agenda.date || ""} г.`}
                                      </a>
                                      {agenda.size && (
                                        <span style={{ marginLeft: 8, fontSize: 13, color: "#6b7280" }}>
                                          ({agenda.size})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ marginTop: 16, padding: 40, textAlign: "center", color: "#6b7280" }}>
                        Повестки пока не добавлены
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {reportYears.length > 0 ? (
                      <>
                        {!selectedYear ? (
                          <ul style={{ listStyle: "disc", paddingLeft: 24, marginTop: 20 }}>
                            {reportYears.map((year) => (
                              <li key={year} style={{ marginBottom: 8 }}>
                                <a
                                  href={`#reports-${year}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedYear(year);
                                    window.location.hash = `#reports-${year}`;
                                  }}
                                  style={{ color: "#2563eb", textDecoration: "none", fontSize: 16 }}
                                >
                                  {year} год
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div>
                            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedYear(null);
                                  window.location.hash = "#reports";
                                }}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 6,
                                  border: "1px solid rgba(0, 51, 102, 0.2)",
                                  background: "#fff",
                                  cursor: "pointer",
                                  fontSize: 14,
                                }}
                              >
                                ← Назад
                              </button>
                              <h3 style={{ margin: 0 }}>{selectedYear} год</h3>
                            </div>
                            <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
                              {reportsByYear[selectedYear].map((report, idx) => (
                                <li key={idx} style={{ marginBottom: 12, padding: 12, background: "#f9fafb", borderRadius: 6 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", padding: "4px 8px", background: "#fff", borderRadius: 4 }}>
                                      DOC
                                    </span>
                                    <div style={{ flex: 1 }}>
                                      <a
                                        href={report.fileLink ? normalizeFilesUrl(report.fileLink) : (report.fileId ? normalizeFilesUrl(`/files/v2/${report.fileId}`) : "#")}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: "#2563eb", textDecoration: "none", fontSize: 15, fontWeight: 500 }}
                                      >
                                        {report.title || `Отчет от ${report.date || ""} г.`}
                                      </a>
                                      {report.size && (
                                        <span style={{ marginLeft: 8, fontSize: 13, color: "#6b7280" }}>
                                          ({report.size})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ marginTop: 16, padding: 40, textAlign: "center", color: "#6b7280" }}>
                        Отчеты пока не добавлены
                      </div>
                    )}
                  </>
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

            {/* Документы */}
            {currentSection === "documents" && (
              <div>
                <h2 style={{ marginTop: 24 }}>Документы комитета</h2>
                
                {Object.keys(documentsByCategoryAndYear).length > 0 ? (
                  <>
                    {!documentsCategory ? (
                      <div style={{ marginTop: 24 }}>
                        <h3 style={{ marginBottom: 20 }}>Категории документов</h3>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          {Object.keys(documentsByCategoryAndYear).includes("agenda") && (
                            <button
                              type="button"
                              onClick={() => {
                                setDocumentsCategory("agenda");
                                setDocumentsYear(null);
                                window.location.hash = "#documents-agenda";
                              }}
                              style={{
                                padding: "12px 24px",
                                borderRadius: 8,
                                border: "1px solid rgba(0, 51, 102, 0.2)",
                                background: "#fff",
                                cursor: "pointer",
                                fontSize: 16,
                                fontWeight: 700,
                              }}
                            >
                              Повестки ({documentsByCategoryAndYear.agenda?.years?.reduce((sum, y) => sum + (documentsByCategoryAndYear.agenda.documents[y]?.length || 0), 0) || 0})
                            </button>
                          )}
                          {Object.keys(documentsByCategoryAndYear).includes("report") && (
                            <button
                              type="button"
                              onClick={() => {
                                setDocumentsCategory("report");
                                setDocumentsYear(null);
                                window.location.hash = "#documents-report";
                              }}
                              style={{
                                padding: "12px 24px",
                                borderRadius: 8,
                                border: "1px solid rgba(0, 51, 102, 0.2)",
                                background: "#fff",
                                cursor: "pointer",
                                fontSize: 16,
                                fontWeight: 700,
                              }}
                            >
                              Отчеты ({documentsByCategoryAndYear.report?.years?.reduce((sum, y) => sum + (documentsByCategoryAndYear.report.documents[y]?.length || 0), 0) || 0})
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: 24 }}>
                        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setDocumentsCategory(null);
                              setDocumentsYear(null);
                              window.location.hash = "#documents";
                            }}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              border: "1px solid rgba(0, 51, 102, 0.2)",
                              background: "#fff",
                              cursor: "pointer",
                              fontSize: 14,
                            }}
                          >
                            ← Категории
                          </button>
                          <h3 style={{ margin: 0, fontSize: 20 }}>
                            {documentsCategory === "agenda" ? "Повестки" : "Отчеты"}
                          </h3>
                        </div>

                        {!documentsYear ? (
                          <div>
                            <h4 style={{ marginTop: 20, marginBottom: 16 }}>Годы</h4>
                            <ul style={{ listStyle: "disc", paddingLeft: 24 }}>
                              {documentsByCategoryAndYear[documentsCategory]?.years.map((year) => (
                                <li key={year} style={{ marginBottom: 8 }}>
                                  <a
                                    href={`#documents-${documentsCategory}-${year}`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setDocumentsYear(year);
                                      window.location.hash = `#documents-${documentsCategory}-${year}`;
                                    }}
                                    style={{ color: "#2563eb", textDecoration: "none", fontSize: 16 }}
                                  >
                                    {year} год ({documentsByCategoryAndYear[documentsCategory].documents[year]?.length || 0} документов)
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div>
                            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setDocumentsYear(null);
                                  window.location.hash = `#documents-${documentsCategory}`;
                                }}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 6,
                                  border: "1px solid rgba(0, 51, 102, 0.2)",
                                  background: "#fff",
                                  cursor: "pointer",
                                  fontSize: 14,
                                }}
                              >
                                ← Годы
                              </button>
                              <h4 style={{ margin: 0, fontSize: 18 }}>{documentsYear} год</h4>
                            </div>
                            <div className="law-list" style={{ marginTop: 20 }}>
                              {documentsByCategoryAndYear[documentsCategory]?.documents[documentsYear]?.map((doc, idx) => {
                                const fileUrl = doc.fileLink ? normalizeFilesUrl(doc.fileLink) : (doc.fileId ? normalizeFilesUrl(`/files/v2/${doc.fileId}`) : "");
                                return (
                                  <div key={doc.id || idx} className="law-item" style={{ marginBottom: 16 }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                      {fileUrl ? (
                                        <a
                                          href={fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}
                                        >
                                          {doc.title || "Документ без названия"}
                                        </a>
                                      ) : (
                                        <span style={{ color: "#6b7280", fontWeight: 600 }}>
                                          {doc.title || "Документ без названия"}
                                        </span>
                                      )}
                                      {doc.size && (
                                        <span style={{ fontSize: 12, color: "#6b7280", marginLeft: "auto" }}>
                                          {doc.size}
                                        </span>
                                      )}
                                    </div>
                                    {doc.date && (
                                      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                                        Дата: {doc.date}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ marginTop: 16, padding: 40, textAlign: "center", color: "#6b7280" }}>
                    Документы пока не добавлены
                  </div>
                )}
              </div>
            )}
          </div>
          <SideNav
            className="sidenav--card"
            title={committee.name || committee.title}
            links={[
              { 
                label: "О комитете", 
                href: `/committee?id=${committee.id}#about`,
                onClick: (e) => {
                  e.preventDefault();
                  window.location.hash = "#about";
                  window.dispatchEvent(new Event("hashchange"));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              },
              { 
                label: "Документы", 
                href: `/committee?id=${committee.id}#documents`,
                onClick: (e) => {
                  e.preventDefault();
                  window.location.hash = "#documents";
                  window.dispatchEvent(new Event("hashchange"));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              },
              { 
                label: "Повестки", 
                href: `/committee?id=${committee.id}#agendas`,
                onClick: (e) => {
                  e.preventDefault();
                  window.location.hash = "#agendas";
                  window.dispatchEvent(new Event("hashchange"));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              },
              { 
                label: "Отчеты", 
                href: `/committee?id=${committee.id}#reports`,
                onClick: (e) => {
                  e.preventDefault();
                  window.location.hash = "#reports";
                  window.dispatchEvent(new Event("hashchange"));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              },
              { 
                label: "Планы", 
                href: `/committee?id=${committee.id}#plans`,
                onClick: (e) => {
                  e.preventDefault();
                  window.location.hash = "#plans";
                  window.dispatchEvent(new Event("hashchange"));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              },
              { 
                label: "Деятельность", 
                href: `/committee?id=${committee.id}#activities`,
                onClick: (e) => {
                  e.preventDefault();
                  window.location.hash = "#activities";
                  window.dispatchEvent(new Event("hashchange"));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              },
              { 
                label: "Сотрудники", 
                href: `/committee?id=${committee.id}#staff`,
                onClick: (e) => {
                  e.preventDefault();
                  window.location.hash = "#staff";
                  window.dispatchEvent(new Event("hashchange"));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              },
            ].map(link => {
              const isActive = 
                (link.href.includes("#about") && currentSection === "about") ||
                (link.href.includes("#documents") && currentSection === "documents") ||
                (link.href.includes("#agendas") && currentSection === "reports" && reportsCategory === "agendas") ||
                (link.href.includes("#reports") && currentSection === "reports" && reportsCategory === "reports") ||
                (link.href.includes("#plans") && currentSection === "plans") ||
                (link.href.includes("#activities") && currentSection === "activities") ||
                (link.href.includes("#staff") && currentSection === "staff");
              
              return {
                ...link,
                isActive,
              };
            })}
          />
        </div>
      </div>
    </section>
  );
}
