import React from "react";
import { useData } from "../context/DataContext.jsx";
import { AboutApi, ConvocationsApi, CommitteesApi } from "../api/client.js";
import { useI18n } from "../context/I18nContext.jsx";
import SideNav from "../components/SideNav.jsx";
import PersonDetail from "../components/PersonDetail.jsx";
import { normalizeFilesUrl } from "../utils/filesUrl.js";
import { extractPageHtml, extractPageTitle, getPreferredLocaleToken } from "../utils/pages.js";
import { APPARATUS_NAV_LINKS } from "../utils/apparatusLinks.js";
import { APPARATUS_SECTIONS } from "../utils/apparatusContent.js";
import { normalizeBool } from "../utils/bool.js";
import { EnvironmentOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";

const SECTION_TITLE_TO_SLUG = {
  "Кодекс чести мужчины Тувы": "code-of-honor",
  "Свод заповедей матерей Тувы": "mothers-commandments",
  "Подписка на новости": "news-subscription",
  "Для СМИ": "for-media",
};

function slugifyTitle(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\-а-яё]+/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleToCmsSlug(title) {
  return SECTION_TITLE_TO_SLUG[title] || slugifyTitle(title);
}

function SectionCmsDetail({ title, noGoldUnderline }) {
  const { lang } = useI18n();
  const [pageFromAdmin, setPageFromAdmin] = React.useState(null);
  const [loadingPage, setLoadingPage] = React.useState(true);

  const cmsSlug = React.useMemo(() => titleToCmsSlug(title), [title]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingPage(true);
      try {
        const locale = getPreferredLocaleToken(lang);
        const page = await AboutApi.getPageBySlug(cmsSlug, { locale }).catch(() => null);
        if (alive) setPageFromAdmin(page);
      } catch {
        if (alive) setPageFromAdmin(null);
      } finally {
        if (alive) setLoadingPage(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [cmsSlug, lang]);

  if (pageFromAdmin && !loadingPage) {
    const locale = getPreferredLocaleToken(lang);
    const html = extractPageHtml(pageFromAdmin, locale);
    const pageTitle = extractPageTitle(pageFromAdmin, locale, title);
    return (
      <section className="section section-page">
        <div className="container">
          <div className="page-grid">
            <div>
              <h1 className={noGoldUnderline ? "no-gold-underline" : undefined}>{pageTitle}</h1>
              <div className="card" style={{ padding: 18, marginTop: 20 }}>
                {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : <div>—</div>}
              </div>
              <div style={{ marginTop: 20 }}>
                <a href={`/admin/pages`} className="btn" style={{ fontSize: 14 }}>
                  Редактировать в админке →
                </a>
              </div>
            </div>
            <SideNav title="Разделы" />
          </div>
        </div>
      </section>
    );
  }

  if (loadingPage) {
    return (
      <section className="section section-page">
        <div className="container">
          <div className="page-grid">
            <div>
              <h1 className={noGoldUnderline ? "no-gold-underline" : undefined}>{title}</h1>
              <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Загрузка...</div>
            </div>
            <SideNav title="Разделы" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section section-page">
      <div className="container">
        <div className="page-grid">
          <div>
            <h1 className={noGoldUnderline ? "no-gold-underline" : undefined}>{title}</h1>
            <div className="card" style={{ padding: 24, marginTop: 20 }}>
              <p style={{ marginTop: 0, marginBottom: 16 }}>
                Раздел «{title}» пока не заполнен. Вы можете создать страницу в админке.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a
                  href={`/admin/pages/create?title=${encodeURIComponent(title)}`}
                  className="btn btn--primary"
                >
                  Создать страницу в админке
                </a>
                <a href="/admin/pages" className="btn">
                  Перейти в админку страниц
                </a>
              </div>
              <div
                style={{
                  marginTop: 20,
                  padding: 16,
                  background: "#f9fafb",
                  borderRadius: 8,
                  fontSize: 14,
                  color: "#6b7280",
                }}
              >
                <strong>Рекомендуемый slug:</strong> <code>{cmsSlug}</code>
              </div>
            </div>
          </div>
          <SideNav title="Разделы" />
        </div>
      </div>
    </section>
  );
}

function useQuery() {
  const [q, setQ] = React.useState(() => {
    return new URLSearchParams(window.location.search || "");
  });
  React.useEffect(() => {
    const onNav = () => setQ(new URLSearchParams(window.location.search || ""));
    window.addEventListener("popstate", onNav);
    window.addEventListener("app:navigate", onNav);
    return () => {
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("app:navigate", onNav);
    };
  }, []);
  return q;
}

function normalizeConvocationToken(raw) {
  const s = String(raw || "").replace(/\u00A0/g, " ").trim();
  if (!s) return "";
  // Strip common words to avoid "VIII созыв созыв"
  const cleaned = s
    .replace(/\(.*?\)/g, " ")
    .replace(/архив/gi, " ")
    .replace(/созыв(а|ы)?/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const roman = cleaned.match(/\b([IVX]{1,8})\b/i);
  if (roman) return roman[1].toUpperCase();
  const num = cleaned.match(/\b(\d{1,2})\b/);
  if (num) return num[1];
  return cleaned;
}

function formatConvocationLabel(c) {
  const name = String(c?.name || c?.number || "").trim();
  const token = normalizeConvocationToken(name || c?.id);
  if (!token) return name || "Созыв";
  const low = name.toLowerCase();
  if (low.includes("созыв")) return name;
  return `Созыв ${token}`;
}

function toConvocationIdStrFromCommittee(c) {
  const v = c?.convocation?.id ?? c?.convocationId ?? null;
  if (v === null || v === undefined || v === "") return "";
  return String(v);
}

function committeeConvocationMatchKeys(c) {
  const keys = new Set();
  if (!c) return [];
  const idStr = toConvocationIdStrFromCommittee(c);
  if (idStr) keys.add(idStr);
  const token = normalizeConvocationToken(c?.convocation?.name || c?.convocation?.number || "");
  if (token) keys.add(token);
  return Array.from(keys);
}

function stripTags(input) {
  return String(input || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function getChairman(c) {
  if (!c) return "";
  if (typeof c.head === "string" && c.head.trim()) return c.head.trim();
  const members = Array.isArray(c.members) ? c.members : [];
  const chair = members.find((m) => {
    const role = String(m?.role || "").toLowerCase();
    return role.includes("председатель") || role.includes("chairman");
  });
  if (chair?.name) return chair.name;
  return "";
}

function ReportsAllConvocationsPage() {
  const { committees: committeesFromContext, persons } = useData();
  const [convocations, setConvocations] = React.useState([]);
  const [committees, setCommittees] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const list = await ConvocationsApi.list({ activeOnly: false }).catch(() => []);
        if (!alive) return;
        
        // Нормализуем созывы и загружаем полные данные с документами (как в ConvocationReportsPage)
        const normalized = [];
        for (const x of Array.isArray(list) ? list : []) {
          let conv = null;
          if (typeof x === "string") {
            const token = normalizeConvocationToken(x);
            conv = { id: token || x, name: x, number: token, originalId: token || x };
          } else if (x && typeof x === "object") {
            const token = normalizeConvocationToken(x.name || x.number || "");
            conv = {
              ...x,
              id: x.id ?? token,
              name: x.name || x.number || "",
              number: token || x.number || "",
              originalId: x.id,
            };
          }
          
          if (conv && conv.id) {
            // Загружаем полные данные с документами, если их нет
            if (!conv.documents || conv.documents.length === 0) {
              try {
                const fullData = await ConvocationsApi.getById(conv.id).catch(() => null);
                if (fullData && Array.isArray(fullData.documents) && fullData.documents.length > 0) {
                  conv = { ...conv, documents: fullData.documents };
                } else if (fullData && fullData.documents) {
                  conv = { ...conv, documents: fullData.documents };
                }
              } catch (e) {
                console.warn(`[ReportsAllConvocationsPage] Ошибка загрузки документов для созыва ${conv.id}:`, e);
              }
            }
            normalized.push(conv);
          }
        }
        
        // Загружаем все комитеты один раз (как на странице Convocations)
        console.log("[ReportsAllConvocationsPage] Загрузка комитетов с API...");
        const apiCommittees = await CommitteesApi.list({ all: true }).catch((err) => {
          console.error("[ReportsAllConvocationsPage] Ошибка загрузки комитетов:", err);
          return null;
        });
        console.log("[ReportsAllConvocationsPage] Загружено комитетов с API:", apiCommittees ? (Array.isArray(apiCommittees) ? apiCommittees.length : "не массив") : "null");
        if (apiCommittees && Array.isArray(apiCommittees) && apiCommittees.length > 0) {
          console.log("[ReportsAllConvocationsPage] Первые 3 комитета:", apiCommittees.slice(0, 3).map(c => ({
            id: c.id,
            name: c.name || c.title,
            convocationId: c.convocationId,
            convocation: c.convocation,
          })));
        }
        
        if (!alive) return;
        
        // Ensure we have at least I, II, III, IV convocations
        const requiredConvocations = ["I", "II", "III", "IV"];
        const existingTokens = new Set(normalized.map(c => normalizeConvocationToken(c.name || c.number || "")));
        // Создаем маппинг римских цифр к числовым ID из API
        const romanToNumericId = {};
        normalized.forEach(c => {
          const token = normalizeConvocationToken(c.name || c.number || "");
          if (token && c.originalId) {
            romanToNumericId[token] = c.originalId;
          }
        });
        console.log("[ReportsAllConvocationsPage] Маппинг римских цифр к ID:", romanToNumericId);
        
        requiredConvocations.forEach(token => {
          if (!existingTokens.has(token)) {
            // Если есть числовой ID для этого токена, используем его
            const numericId = romanToNumericId[token];
            normalized.push({ 
              id: numericId || token, 
              name: `Созыв ${token}`, 
              number: token,
              originalId: numericId,
            });
          } else {
            // Обновляем существующий созыв, чтобы он имел и числовой ID, и токен
            const existing = normalized.find(c => normalizeConvocationToken(c.name || c.number || "") === token);
            if (existing && existing.originalId && !existing.id) {
              existing.id = existing.originalId;
            }
          }
        });
        
        setConvocations(normalized);
        
        // Объединяем комитеты из API и из контекста (как на странице Convocations)
        const fromContext = Array.isArray(committeesFromContext) ? committeesFromContext : [];
        const apiList = Array.isArray(apiCommittees) ? apiCommittees : [];
        const all = [...apiList, ...fromContext];
        console.log("[ReportsAllConvocationsPage] Итого комитетов после объединения:", all.length);
        console.log("[ReportsAllConvocationsPage] Из API:", apiList.length, "Из контекста:", fromContext.length);
        setCommittees(all);
      } catch (error) {
        console.error("Failed to load convocations:", error);
        if (alive) {
          setConvocations([]);
          setCommittees([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [committeesFromContext]);

  // Sort convocations: Roman numerals first (VIII, VII, VI, etc.), then numbers, then others
  const sortedConvocations = React.useMemo(() => {
    const romanOrder = ["VIII", "VII", "VI", "V", "IV", "III", "II", "I"];
    return [...convocations].sort((a, b) => {
      const aToken = normalizeConvocationToken(a.name || a.number || "");
      const bToken = normalizeConvocationToken(b.name || b.number || "");
      const aRomanIndex = romanOrder.indexOf(aToken);
      const bRomanIndex = romanOrder.indexOf(bToken);
      
      if (aRomanIndex !== -1 && bRomanIndex !== -1) {
        return aRomanIndex - bRomanIndex;
      }
      if (aRomanIndex !== -1) return -1;
      if (bRomanIndex !== -1) return 1;
      
      const aNum = parseInt(aToken, 10);
      const bNum = parseInt(bToken, 10);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return bNum - aNum; // Descending order
      }
      if (!isNaN(aNum)) return -1;
      if (!isNaN(bNum)) return 1;
      
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [convocations]);

  // Функция для получения ключей созыва (точно как на странице Convocations)
  const convocationMatchKeys = React.useCallback((c) => {
    const keys = new Set();
    if (!c) return [];
    const id = String(c?.id ?? "").trim();
    if (id) keys.add(id);
    const token = normalizeConvocationToken(c?.name || c?.number || c?.id || "");
    if (token) keys.add(token);
    return Array.from(keys);
  }, []);

  // Функция проверки активности комитета (как на странице Convocations)
  const isCommitteeActive = React.useCallback((c) => {
    if (!c) return false;
    return normalizeBool(c?.isActive, true) !== false;
  }, []);

  // Group committees by convocation - сначала по прямым связям, затем через документы
  const committeesByConvocationKey = React.useMemo(() => {
    const map = new Map();
    console.log("[ReportsAllConvocationsPage] Начало группировки комитетов");
    console.log("[ReportsAllConvocationsPage] Всего комитетов:", committees.length);
    console.log("[ReportsAllConvocationsPage] Всего созывов:", convocations.length);
    
    // Сначала группируем по прямым связям (convocationId)
    for (const c of Array.isArray(committees) ? committees : []) {
      if (!c) continue;
      const isActive = isCommitteeActive(c);
      if (!isActive) {
        console.log(`[ReportsAllConvocationsPage] Комитет "${c.name || c.title}" (ID: ${c.id}) пропущен - неактивен`);
        continue;
      }
      const keys = committeeConvocationMatchKeys(c);
      console.log(`[ReportsAllConvocationsPage] Комитет "${c.name || c.title}" (ID: ${c.id}):`, {
        keys,
        convocation: c.convocation,
        convocationId: c.convocationId,
        convocation_id: c.convocation_id,
        isActive: c.isActive,
      });
      
      if (!keys.length) {
        const list = map.get("__none__") || [];
        list.push(c);
        map.set("__none__", list);
        continue;
      }
      for (const key of keys) {
        const list = map.get(key) || [];
        if (!list.some((x) => String(x?.id ?? "") === String(c?.id ?? ""))) list.push(c);
        map.set(key, list);
      }
    }
    
    // Дополнительно связываем через документы (если у комитетов нет convocationId)
    for (const conv of Array.isArray(convocations) ? convocations : []) {
      if (!conv) continue;
      const convKeys = convocationMatchKeys(conv);
      const documents = Array.isArray(conv.documents) ? conv.documents : [];
      const committeeIdsFromDocs = new Set();
      
      documents.forEach((doc) => {
        if (doc.committeeId) {
          committeeIdsFromDocs.add(String(doc.committeeId));
        }
      });
      
      if (committeeIdsFromDocs.size > 0) {
        console.log(`[ReportsAllConvocationsPage] Созыв "${formatConvocationLabel(conv)}" имеет документы с комитетами:`, Array.from(committeeIdsFromDocs));
        
        // Находим комитеты по ID из документов
        for (const c of Array.isArray(committees) ? committees : []) {
          if (!c || !isCommitteeActive(c)) continue;
          const cid = String(c?.id ?? "");
          if (committeeIdsFromDocs.has(cid)) {
            // Добавляем комитет ко всем ключам созыва
            for (const key of convKeys) {
              const list = map.get(key) || [];
              if (!list.some((x) => String(x?.id ?? "") === cid)) {
                list.push(c);
                map.set(key, list);
                console.log(`[ReportsAllConvocationsPage] Добавлен комитет "${c.name || c.title}" к ключу "${key}" через документы`);
              }
            }
          }
        }
      }
    }
    
    console.log("[ReportsAllConvocationsPage] Ключи в Map:", Array.from(map.keys()));
    console.log("[ReportsAllConvocationsPage] Количество комитетов по ключам:", 
      Array.from(map.entries()).map(([key, list]) => `${key}: ${list.length}`).join(", "));
    
    return map;
  }, [committees, convocations, isCommitteeActive, convocationMatchKeys]);
  

  return (
    <section className="section section-page">
      <div className="container">
        <div className="page-grid">
          <div>
            <h1>Отчеты всех Созывов</h1>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Загрузка...</div>
            ) : sortedConvocations.length > 0 ? (
              <div style={{ marginTop: 20 }}>
                {sortedConvocations.map((c) => {
                  const idStr = String(c?.id ?? "");
                  const title = formatConvocationLabel(c);
                  const keys = convocationMatchKeys(c);
                  console.log(`[ReportsAllConvocationsPage] Созыв "${title}" (ID: ${c.id}, originalId: ${c.originalId}): ключи:`, keys);
                  const list = keys.flatMap((k) => {
                    const committees = committeesByConvocationKey.get(k) || [];
                    console.log(`[ReportsAllConvocationsPage] Для ключа "${k}" найдено комитетов:`, committees.length);
                    return committees;
                  });
                  const uniq = new Map();
                  for (const it of list) {
                    const cid = String(it?.id ?? "");
                    if (!cid) continue;
                    if (!uniq.has(cid)) uniq.set(cid, it);
                  }
                  const committeesList = Array.from(uniq.values());
                  console.log(`[ReportsAllConvocationsPage] Для созыва "${title}" итого комитетов:`, committeesList.length);
                  const token = normalizeConvocationToken(c?.name || c?.number || c?.id || "");
                  const reportTitle = `Отчеты о деятельности комитетов ${token} созыва`;
                  const href = `/section?title=${encodeURIComponent(reportTitle)}`;

                  return (
                    <div
                      key={idStr || title}
                      className="tile"
                      style={{
                        borderRadius: 18,
                        padding: 16,
                        border: "1px solid rgba(17, 24, 39, 0.10)",
                        background: "#fff",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 800, fontSize: 18 }}>{title}</div>
                        <a className="link" href={href} style={{ whiteSpace: "nowrap" }}>
                          Отчеты →
                        </a>
                      </div>
                      {c?.description ? (
                        <div style={{ marginTop: 8, color: "var(--muted, #6b7280)", lineHeight: 1.45 }}>
                          {stripTags(String(c.description))}
                        </div>
                      ) : null}

                      <div style={{ marginTop: 12, fontWeight: 700 }}>Комитеты созыва</div>
                      {committeesList.length ? (
                        <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                          {committeesList.map((k) => {
                            const cid = String(k?.id ?? "");
                            const name = String(k?.name || k?.title || "").trim() || "Комитет";
                            const chairman = getChairman(k);
                            const desc = stripTags(k?.description || "");
                            const phone = String(k?.phone || "").trim();
                            const email = String(k?.email || "").trim();
                            const website = String(k?.website || "").trim();
                            const address = String(k?.address || "").trim();
                            return (
                              <a
                                key={cid || name}
                                className="tile link"
                                href={`/committee?id=${encodeURIComponent(cid)}`}
                                style={{ padding: 12, borderRadius: 14, display: "grid", gap: 6 }}
                              >
                                <div style={{ fontWeight: 800 }}>{name}</div>
                                {chairman ? (
                                  <div style={{ opacity: 0.85 }}>
                                    <span style={{ opacity: 0.7 }}>Председатель: </span>
                                    {chairman}
                                  </div>
                                ) : null}
                                {desc ? (
                                  <div style={{ opacity: 0.75 }}>
                                    {desc.length > 220 ? `${desc.slice(0, 220)}…` : desc}
                                  </div>
                                ) : null}
                                {phone || email || website || address ? (
                                  <div style={{ opacity: 0.75, display: "grid", gap: 2 }}>
                                    {phone ? <div>Тел.: {phone}</div> : null}
                                    {email ? <div>Email: {email}</div> : null}
                                    {website ? <div>Сайт: {website}</div> : null}
                                    {address ? <div>Адрес: {address}</div> : null}
                                  </div>
                                ) : null}
                              </a>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ marginTop: 8, color: "var(--muted, #6b7280)" }}>
                          Комитеты для этого созыва пока не указаны.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card" style={{ padding: 24, marginTop: 20 }}>
                <p style={{ marginTop: 0 }}>Список созывов пока пуст.</p>
              </div>
            )}
          </div>
          <SideNav title="Разделы" />
        </div>
      </div>
    </section>
  );
}

function ConvocationReportsPage({ convocationNumber }) {
  const { committees: committeesFromContext } = useData();
  const [convocation, setConvocation] = React.useState(null);
  const [committees, setCommittees] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [currentView, setCurrentView] = React.useState("committees"); // "committees" or "documents"
  const [reportsCategory, setReportsCategory] = React.useState("reports");
  const [selectedCommittee, setSelectedCommittee] = React.useState(null);
  const [selectedYear, setSelectedYear] = React.useState(null);
  const [selectedCategory, setSelectedCategory] = React.useState(null); // For documents view
  const [selectedYearForCategory, setSelectedYearForCategory] = React.useState(null); // For documents view

  // Extract year from date string
  const extractYear = React.useCallback((dateStr) => {
    if (!dateStr) return null;
    const match = String(dateStr).match(/(\d{4})/);
    return match ? match[1] : null;
  }, []);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        
        // Load all convocations and find by number/name (not just ID)
        const list = await ConvocationsApi.list({ activeOnly: false }).catch(() => []);
        if (!alive) return;
        
        const token = normalizeConvocationToken(convocationNumber);
        let convocationData = null;
        
        // Try to find by ID first (if convocationNumber is numeric)
        if (!isNaN(parseInt(convocationNumber, 10))) {
          const byId = await ConvocationsApi.getById(convocationNumber).catch(() => null);
          if (byId) {
            convocationData = byId;
          }
        }
        
        // If not found by ID, search in list by token/name/number
        if (!convocationData && Array.isArray(list)) {
          convocationData = list.find((c) => {
            const cToken = normalizeConvocationToken(c.name || c.number || "");
            const cId = String(c.id || "");
            return cToken === token || 
                   cId === String(convocationNumber) ||
                   (c.name && String(c.name).toLowerCase().includes(String(convocationNumber).toLowerCase())) ||
                   (c.number && String(c.number) === String(convocationNumber));
          });
        }
        
        // If still not found, try to get full data by ID if we have it
        if (!convocationData && token) {
          // Try to find by matching token in any field
          for (const c of Array.isArray(list) ? list : []) {
            const cToken = normalizeConvocationToken(c.name || c.number || c.id || "");
            if (cToken === token) {
              // Try to get full data by ID
              if (c.id) {
                const full = await ConvocationsApi.getById(c.id).catch(() => null);
                if (full) {
                  convocationData = full;
                  break;
                }
              }
              convocationData = c;
              break;
            }
          }
        }
        
        if (convocationData) {
          // Ensure we have the latest data with documents
          // If we found by list, try to get full data by ID
          if (convocationData.id && (!convocationData.documents || convocationData.documents.length === 0)) {
            const fullData = await ConvocationsApi.getById(convocationData.id).catch(() => null);
            if (fullData && Array.isArray(fullData.documents) && fullData.documents.length > 0) {
              convocationData = fullData;
            }
          }
          
          setConvocation(convocationData);
          
          // Extract unique committee IDs from documents
          const documents = Array.isArray(convocationData.documents) ? convocationData.documents : [];
          const committeeIds = new Set();
          const hasDocumentsWithoutCommittee = documents.some(doc => !doc.committeeId);
          documents.forEach((doc) => {
            if (doc.committeeId) {
              committeeIds.add(String(doc.committeeId));
            }
          });
          
          // Load committees
          const allCommittees = await CommitteesApi.list({ all: true }).catch(() => []);
          const fromContext = Array.isArray(committeesFromContext) ? committeesFromContext : [];
          const all = [...allCommittees, ...fromContext];
          
          // Filter committees that match convocation OR have documents for this convocation
          const convKeys = new Set([convocationNumber, normalizeConvocationToken(convocationNumber)]);
          const relevant = all.filter((c) => {
            if (!c) return false;
            // Always include if has documents for this convocation
            if (committeeIds.has(String(c.id))) return true;
            // Always include if matches convocation (by convocationId or convocation name/number)
            const matchKeys = committeeConvocationMatchKeys(c);
            if (matchKeys.some(key => convKeys.has(key))) return true;
            // Also check if committee's convocation matches by ID
            const committeeConvId = String(c?.convocation?.id ?? "");
            const committeeConvToken = normalizeConvocationToken(c?.convocation?.name || c?.convocation?.number || "");
            if (committeeConvId && convKeys.has(committeeConvId)) return true;
            if (committeeConvToken && convKeys.has(committeeConvToken)) return true;
            return false;
          });
          
          // Deduplicate
          const seen = new Set();
          const unique = relevant.filter((c) => {
            const id = String(c?.id ?? "");
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
          });
          
          // Add virtual committee for documents without committeeId
          if (hasDocumentsWithoutCommittee) {
            unique.push({
              id: "general",
              title: "Общие документы",
              name: "Общие документы",
            });
          }
          
          // Also add committees that are referenced in documents but not found in list
          committeeIds.forEach((cid) => {
            if (!unique.find(c => String(c.id) === cid)) {
              unique.push({
                id: cid,
                title: `Комитет (ID: ${cid})`,
                name: `Комитет (ID: ${cid})`,
              });
            }
          });
          
          setCommittees(unique);
        } else {
          setConvocation(null);
          setCommittees([]);
        }
      } catch (error) {
        console.error("Failed to load convocation:", error);
        if (alive) {
          setConvocation(null);
          setCommittees([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [convocationNumber, committeesFromContext]);

  // Group documents by committee, category, and year
  const documentsByCommittee = React.useMemo(() => {
    if (!convocation || !Array.isArray(convocation.documents)) return {};
    
    const grouped = {};
    convocation.documents.forEach((doc) => {
      const committeeId = doc.committeeId || "general";
      if (!grouped[committeeId]) {
        grouped[committeeId] = { agendas: [], reports: [] };
      }
      const category = doc.category === "agenda" ? "agendas" : "reports";
      if (Array.isArray(grouped[committeeId][category])) {
        grouped[committeeId][category].push(doc);
      }
    });
    
    return grouped;
  }, [convocation]);

  // Get documents for selected committee and category
  const currentDocuments = React.useMemo(() => {
    if (!selectedCommittee) return [];
    const committeeId = String(selectedCommittee.id);
    const category = reportsCategory === "agendas" ? "agendas" : "reports";
    return documentsByCommittee[committeeId]?.[category] || [];
  }, [selectedCommittee, reportsCategory, documentsByCommittee]);

  // Group current documents by year
  const documentsByYear = React.useMemo(() => {
    const grouped = {};
    currentDocuments.forEach((doc) => {
      const year = extractYear(doc.date);
      if (year) {
        if (!grouped[year]) grouped[year] = [];
        grouped[year].push(doc);
      }
    });
    const sortedYears = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a));
    return { grouped, sortedYears };
  }, [currentDocuments, extractYear]);

  // Group all documents by category and year (for "Documents" view)
  const documentsByCategoryAndYear = React.useMemo(() => {
    if (!convocation || !Array.isArray(convocation.documents)) return {};
    
    const grouped = {};
    convocation.documents.forEach((doc) => {
      const category = doc.category === "agenda" ? "agenda" : "report";
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
  }, [convocation, extractYear]);

  // Handle URL hash for navigation
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      // Check if we're in documents view
      if (hash === "#documents" || hash.startsWith("#documents-")) {
        setCurrentView("documents");
        setSelectedCommittee(null);
        
        // Parse category and year from hash like #documents-agenda-2023
        const categoryMatch = hash.match(/#documents-(agenda|report)(?:-(\d{4}))?/);
        if (categoryMatch) {
          setSelectedCategory(categoryMatch[1]);
          setSelectedYearForCategory(categoryMatch[2] || null);
        } else {
          setSelectedCategory(null);
          setSelectedYearForCategory(null);
        }
      } else {
        setCurrentView("committees");
        setSelectedCategory(null);
        setSelectedYearForCategory(null);
        
        if (hash.includes("#agendas")) setReportsCategory("agendas");
        else if (hash.includes("#reports")) setReportsCategory("reports");
        
        const yearMatch = hash.match(/-(\d{4})/);
        if (yearMatch) setSelectedYear(yearMatch[1]);
        else setSelectedYear(null);
      }
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Debug logging
  React.useEffect(() => {
    if (convocation) {
      console.log("ConvocationReportsPage: convocation data:", {
        id: convocation.id,
        name: convocation.name,
        number: convocation.number,
        documentsCount: Array.isArray(convocation.documents) ? convocation.documents.length : 0,
        documents: convocation.documents,
      });
    }
  }, [convocation]);

  if (loading) {
    return (
      <section className="section section-page">
        <div className="container">
          <div className="page-grid">
            <div>
              <h1>Отчеты о деятельности комитетов {convocationNumber} созыва</h1>
              <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Загрузка...</div>
            </div>
            <SideNav title="Разделы" />
          </div>
        </div>
      </section>
    );
  }

  if (!convocation) {
    return (
      <section className="section section-page">
        <div className="container">
          <div className="page-grid">
            <div>
              <h1>Отчеты о деятельности комитетов {convocationNumber} созыва</h1>
              <div className="card" style={{ padding: 24, marginTop: 20 }}>
                <p style={{ marginTop: 0 }}>Созыв {convocationNumber} не найден.</p>
              </div>
            </div>
            <SideNav title="Разделы" />
          </div>
        </div>
      </section>
    );
  }

  // Show documents view if selected
  if (currentView === "documents" && !selectedCommittee) {
    const hasDocuments = convocation && Array.isArray(convocation.documents) && convocation.documents.length > 0;
    const categories = Object.keys(documentsByCategoryAndYear);
    
    return (
      <section className="section section-page">
        <div className="container">
          <div className="page-grid">
            <div>
              <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView("committees");
                    setSelectedCategory(null);
                    setSelectedYearForCategory(null);
                    window.location.hash = "";
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
                  ← Комитеты
                </button>
                <h1 style={{ margin: 0, fontSize: 24 }}>Документы {convocationNumber} созыва</h1>
              </div>

              {hasDocuments ? (
                <>
                  {!selectedCategory ? (
                    <div style={{ marginTop: 24 }}>
                      <h2 style={{ marginBottom: 20 }}>Категории документов</h2>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {categories.includes("agenda") && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory("agenda");
                              setSelectedYearForCategory(null);
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
                        {categories.includes("report") && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory("report");
                              setSelectedYearForCategory(null);
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
                            setSelectedCategory(null);
                            setSelectedYearForCategory(null);
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
                        <h2 style={{ margin: 0, fontSize: 20 }}>
                          {selectedCategory === "agenda" ? "Повестки" : "Отчеты"}
                        </h2>
                      </div>

                      {!selectedYearForCategory ? (
                        <div>
                          <h3 style={{ marginTop: 20, marginBottom: 16 }}>Годы</h3>
                          <ul style={{ listStyle: "disc", paddingLeft: 24 }}>
                            {documentsByCategoryAndYear[selectedCategory]?.years.map((year) => (
                              <li key={year} style={{ marginBottom: 8 }}>
                                <a
                                  href={`#documents-${selectedCategory}-${year}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedYearForCategory(year);
                                    window.location.hash = `#documents-${selectedCategory}-${year}`;
                                  }}
                                  style={{ color: "#2563eb", textDecoration: "none", fontSize: 16 }}
                                >
                                  {year} год ({documentsByCategoryAndYear[selectedCategory].documents[year]?.length || 0} документов)
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
                                setSelectedYearForCategory(null);
                                window.location.hash = `#documents-${selectedCategory}`;
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
                            <h3 style={{ margin: 0, fontSize: 18 }}>{selectedYearForCategory} год</h3>
                          </div>
                          <div className="law-list" style={{ marginTop: 20 }}>
                            {documentsByCategoryAndYear[selectedCategory]?.documents[selectedYearForCategory]?.map((doc, idx) => {
                              // Формируем URL файла: используем fileLink если есть, иначе формируем из fileId
                              let fileUrl = "";
                              if (doc.fileLink) {
                                fileUrl = normalizeFilesUrl(doc.fileLink);
                              } else if (doc.fileId) {
                                // Используем правильный формат API: /files/v2/{id}
                                fileUrl = normalizeFilesUrl(`/files/v2/${doc.fileId}`);
                              }
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
                <div className="card" style={{ padding: 24, marginTop: 20 }}>
                  <p style={{ marginTop: 0 }}>Документы для {convocationNumber} созыва пока отсутствуют.</p>
                </div>
              )}
            </div>
            <SideNav title="Разделы" />
          </div>
        </div>
      </section>
    );
  }

  // If no committee selected, show list of committees
  if (!selectedCommittee) {
    const hasDocuments = convocation && Array.isArray(convocation.documents) && convocation.documents.length > 0;
    
    return (
      <section className="section section-page">
        <div className="container">
          <div className="page-grid">
            <div>
              <h1>Отчеты о деятельности комитетов {convocationNumber} созыва</h1>
              
              {/* Navigation buttons */}
              <div style={{ display: "flex", gap: 12, marginTop: 20, marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView("committees");
                    window.location.hash = "";
                  }}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "1px solid rgba(0, 51, 102, 0.2)",
                    background: currentView === "committees" ? "rgba(0, 51, 102, 0.1)" : "#fff",
                    color: currentView === "committees" ? "#003366" : "#6b7280",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 15,
                  }}
                >
                  Комитеты
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView("documents");
                    setSelectedCategory(null);
                    setSelectedYearForCategory(null);
                    window.location.hash = "#documents";
                  }}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "1px solid rgba(0, 51, 102, 0.2)",
                    background: currentView === "documents" ? "rgba(0, 51, 102, 0.1)" : "#fff",
                    color: currentView === "documents" ? "#003366" : "#6b7280",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 15,
                  }}
                >
                  Документы
                </button>
              </div>

              {committees.length > 0 ? (
                <ul style={{ listStyle: "disc", paddingLeft: 24, marginTop: 20 }}>
                  {committees.map((committee) => {
                    const committeeId = String(committee.id);
                    const hasDocs = documentsByCommittee[committeeId] && 
                      (documentsByCommittee[committeeId].agendas.length > 0 || 
                       documentsByCommittee[committeeId].reports.length > 0);
                    
                    return (
                      <li key={committee.id} style={{ marginBottom: 8 }}>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedCommittee(committee);
                            setSelectedYear(null);
                            setReportsCategory("reports");
                            window.location.hash = "#reports";
                          }}
                          style={{ color: "#2563eb", textDecoration: "none", fontSize: 16 }}
                        >
                          {committee.title || committee.name || "Комитет"}
                          {hasDocs && <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>(есть документы)</span>}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : hasDocuments ? (
                <div className="card" style={{ padding: 24, marginTop: 20 }}>
                  <p style={{ marginTop: 0 }}>
                    Документы найдены, но не привязаны к комитетам. Пожалуйста, укажите комитеты в документах через админ-панель.
                  </p>
                  <p style={{ marginTop: 12, fontSize: 14, color: "#6b7280" }}>
                    Всего документов: {convocation.documents.length}
                  </p>
                </div>
              ) : (
                <div className="card" style={{ padding: 24, marginTop: 20 }}>
                  <p style={{ marginTop: 0 }}>
                    Список комитетов для {convocationNumber} созыва пока пуст.
                  </p>
                </div>
              )}
            </div>
            <SideNav title="Разделы" />
          </div>
        </div>
      </section>
    );
  }

  // Show documents for selected committee
  return (
    <section className="section section-page">
      <div className="container">
        <div className="page-grid">
          <div>
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedCommittee(null);
                  setSelectedYear(null);
                  window.location.hash = "";
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
                ← Назад к списку комитетов
              </button>
              <h1 style={{ margin: 0, fontSize: 24 }}>
                {selectedCommittee.title || selectedCommittee.name || "Комитет"}
              </h1>
            </div>

            <h2 style={{ marginTop: 24 }}>Повестки и отчеты</h2>
            
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

            {documentsByYear.sortedYears.length > 0 ? (
              <>
                {!selectedYear ? (
                  <ul style={{ listStyle: "disc", paddingLeft: 24, marginTop: 20 }}>
                    {documentsByYear.sortedYears.map((year) => (
                      <li key={year} style={{ marginBottom: 8 }}>
                        <a
                          href={`#${reportsCategory}-${year}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedYear(year);
                            window.location.hash = `#${reportsCategory}-${year}`;
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
                          window.location.hash = `#${reportsCategory}`;
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
                      {documentsByYear.grouped[selectedYear].map((doc, idx) => (
                        <li key={idx} style={{ marginBottom: 12, padding: 12, background: "#f9fafb", borderRadius: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", padding: "4px 8px", background: "#fff", borderRadius: 4 }}>
                              DOC
                            </span>
                            <div style={{ flex: 1 }}>
                              <a
                                href={doc.fileLink ? normalizeFilesUrl(doc.fileLink) : (doc.fileId ? normalizeFilesUrl(`/files/v2/${doc.fileId}`) : "#")}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "#2563eb", textDecoration: "none", fontSize: 15, fontWeight: 500 }}
                              >
                                {doc.title || `${reportsCategory === "agendas" ? "Повестка" : "Отчет"} от ${doc.date || ""} г.`}
                              </a>
                              {doc.size && (
                                <span style={{ marginLeft: 8, fontSize: 13, color: "#6b7280" }}>
                                  ({doc.size})
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
              <div className="card" style={{ padding: 24, marginTop: 20 }}>
                <p style={{ marginTop: 0 }}>
                  {reportsCategory === "agendas" ? "Повестки" : "Отчеты"} для этого комитета пока не добавлены.
                </p>
              </div>
            )}
          </div>
          <SideNav title="Разделы" />
        </div>
      </div>
    </section>
  );
}

const STRUCTURE_TYPE_LABELS = {
  committee: "Комитет",
  parliament_leadership: "Руководство парламента",
  commission: "Комиссия",
  apparatus: "Аппарат",
  municipal_council: "Совет по взаимодействию с представительными органами муниципальных образований",
  youth_khural: "Молодежный Хурал",
  federation_council: "Представительство в Совете Федерации",
};

const ROLE_LABELS_BY_STRUCTURE = {
  committee: {
    chairman: "Председатель комитета",
    vice_chairman: "Заместитель председателя комитета",
    member: "Член комитета",
  },
  parliament_leadership: {
    chairman: "Председатель",
    vice_chairman: "Заместитель председателя",
    member: "Член руководства",
  },
  commission: {
    chairman: "Председатель комиссии",
    vice_chairman: "Заместитель председателя комиссии",
    member: "Член комиссии",
  },
  apparatus: {
    leader: "Руководитель аппарата",
    member: "Сотрудник аппарата",
  },
  municipal_council: {
    chairman: "Председатель совета",
    vice_chairman: "Заместитель председателя совета",
    member: "Член совета",
  },
  youth_khural: {
    chairman: "Председатель Молодежного Хурала",
    vice_chairman: "Заместитель председателя Молодежного Хурала",
    member: "Член Молодежного Хурала",
  },
  federation_council: {
    leader: "Руководитель представительства",
    member: "Член представительства",
  },
};

function roleRank(structureType, role) {
  const r = String(role || "").trim();
  const type = String(structureType || "").trim();
  // Default ordering: leaders first, then deputies, then members.
  const ranks = {
    committee: { chairman: 0, vice_chairman: 1, member: 2 },
    parliament_leadership: { chairman: 0, vice_chairman: 1, member: 2 },
    commission: { chairman: 0, vice_chairman: 1, member: 2 },
    municipal_council: { chairman: 0, vice_chairman: 1, member: 2 },
    youth_khural: { chairman: 0, vice_chairman: 1, member: 2 },
    federation_council: { leader: 0, member: 1 },
    apparatus: { leader: 0, member: 1 },
  };
  const map = ranks[type] || {};
  return map[r] ?? 99;
}

function getDeputyTitle(d, structureType) {
  const fromPosition = typeof d?.position === "string" ? d.position.trim() : "";
  if (fromPosition) return fromPosition;
  const role = String(d?.role || "").trim();
  const byRole = ROLE_LABELS_BY_STRUCTURE?.[structureType]?.[role];
  if (byRole) return byRole;
  const stLabel = STRUCTURE_TYPE_LABELS?.[structureType];
  return stLabel ? stLabel : "Депутат";
}

function DeputyGrid({ deputies, structureType, backHref }) {
  const filtered = React.useMemo(() => {
    const list = Array.isArray(deputies) ? deputies : [];
    return list
      .filter((d) => d && String(d.structureType || "").trim() === String(structureType || "").trim())
      .slice()
      .sort((a, b) => {
        const ra = roleRank(structureType, a?.role);
        const rb = roleRank(structureType, b?.role);
        if (ra !== rb) return ra - rb;
        return String(a?.name || "").localeCompare(String(b?.name || ""), "ru");
      });
  }, [deputies, structureType]);

  if (!filtered.length) {
    return (
      <div className="tile" style={{ padding: 24, marginTop: 16 }}>
        Список пока пуст. Добавьте депутата с типом структуры «{STRUCTURE_TYPE_LABELS?.[structureType] || structureType}
        » в админке.
      </div>
    );
  }

  return (
    <div className="grid cols-3" style={{ marginTop: 16, gap: 16 }}>
      {filtered.map((d) => (
        <div key={d.id} className="gov-card">
          <div className="gov-card__top">
            {normalizeFilesUrl(d.photo || (d.image && d.image.link) || "") ? (
              <img
                className="gov-card__avatar"
                src={normalizeFilesUrl(d.photo || (d.image && d.image.link) || "")}
                alt=""
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="gov-card__avatar" aria-hidden="true" />
            )}
          </div>
          <div className="gov-card__body">
            <div className="gov-card__name">{d.name}</div>
            <div className="gov-card__role">{getDeputyTitle(d, structureType)}</div>
            <ul className="gov-meta">
              {(() => {
                const receptionInfo = extractReceptionInfo(d.reception);
                const address = d.address || receptionInfo.address;
                return address || receptionInfo.office ? (
                  <li>
                    <span>📍</span>
                    <span>{address}{receptionInfo.office ? (address ? `, ${receptionInfo.office}` : receptionInfo.office) : ""}</span>
                  </li>
                ) : null;
              })()}
              {(() => {
                const receptionInfo = extractReceptionInfo(d.reception);
                return receptionInfo.workTime ? (
                  <li>
                    <span>⏰</span>
                    <span>Время работы: {receptionInfo.workTime}</span>
                  </li>
                ) : null;
              })()}
              {d.contacts?.phone && (
                <li>
                  <span>📞</span>
                  <span>{d.contacts.phone}</span>
                </li>
              )}
              {d.contacts?.email && (
                <li>
                  <span>✉️</span>
                  <span>{d.contacts.email}</span>
                </li>
              )}
            </ul>
          </div>
          <div className="gov-card__actions">
            <a
              className="gov-card__btn"
              href={`/government?type=dep&id=${encodeURIComponent(String(d.id))}${
                backHref ? `&back=${encodeURIComponent(backHref)}` : ""
              }`}
            >
              Подробнее
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function ApparatusPersonCard({ p }) {
  const initials = React.useMemo(() => {
    const parts = String(p?.name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const a = parts[0]?.[0] || "";
    const b = parts[1]?.[0] || "";
    return (a + b).toUpperCase();
  }, [p?.name]);

  const telHref = React.useMemo(() => {
    const raw = String(p?.phone || "").trim();
    if (!raw) return "";
    const digits = raw.replace(/[^\d+]/g, "");
    return digits ? `tel:${digits}` : "";
  }, [p?.phone]);

  if (!p) return null;

  return (
    <div className="card apparatus-person-card">
      <div className="apparatus-person-card__avatarWrap">
        {p.photo ? (
          <img className="apparatus-person-card__avatar" src={p.photo} alt="" loading="lazy" />
        ) : (
          <div className="apparatus-person-card__avatar apparatus-person-card__avatar--placeholder" aria-hidden="true">
            {initials || "—"}
          </div>
        )}
      </div>

      <div className="apparatus-person-card__body">
        <div className="apparatus-person-card__name">{p.name}</div>
        {p.role ? <div className="apparatus-person-card__role">{p.role}</div> : null}

        <div className="apparatus-person-card__meta">
          {p.phone ? (
            telHref ? (
              <a className="apparatus-person-card__metaItem" href={telHref}>
                <PhoneOutlined />
                <span>{p.phone}</span>
              </a>
            ) : (
              <div className="apparatus-person-card__metaItem">
                <PhoneOutlined />
                <span>{p.phone}</span>
              </div>
            )
          ) : null}

          {p.email ? (
            <a className="apparatus-person-card__metaItem" href={`mailto:${String(p.email).trim()}`}>
              <MailOutlined />
              <span>{p.email}</span>
            </a>
          ) : null}

          {p.address ? (
            <div className="apparatus-person-card__metaItem">
              <EnvironmentOutlined />
              <span>{p.address}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ApparatusSectionDetail({ title, backHref }) {
  const data = APPARATUS_SECTIONS?.[title];
  if (!data) return null;
  const people = Array.isArray(data.people) ? data.people : [];
  return (
    <section className="section section-page">
      <div className="container">
        <div className="page-grid">
          <div className="page-grid__main">
            {backHref ? (
              <div className="section-page__topbar">
                <a className="btn btn-back" href={backHref}>
                  ← Назад
                </a>
              </div>
            ) : null}
            <h1 className="no-gold-underline section-page__title">{data.title || title}</h1>
            {data.description ? <p style={{ marginTop: 0, maxWidth: 860 }}>{data.description}</p> : null}

            {people.length ? (
              <div className="apparatus-person-grid">
                {people.map((p, i) => (
                  <ApparatusPersonCard key={`${p.name || "p"}-${i}`} p={p} />
                ))}
              </div>
            ) : (
              <div className="card" style={{ padding: 18, marginTop: 14 }}>
                Информация о подразделении будет добавлена.
              </div>
            )}
          </div>
          <SideNav title="Разделы" links={APPARATUS_NAV_LINKS} />
        </div>
      </div>
    </section>
  );
}

export default function SectionPage() {
  const q = useQuery();
  const titleParam = q.get("title");
  const { committees, factions: structureFactions, government, deputies } = useData();
  const focus = q.get("focus");

  // Scroll to a requested block from URL (e.g., /section?focus=committees)
  React.useEffect(() => {
    if (!focus) return;
    const id = `focus-${String(focus)}`;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focus]);

  // Detail stub when title is provided
  if (titleParam) {
    let title = titleParam;
    try {
      title = decodeURIComponent(titleParam);
    } catch {
      // ignore invalid URI encoding
    }

    // Prefilled (old) apparatus pages: show people/info instead of empty CMS.
    if (APPARATUS_SECTIONS?.[title]) {
      return (
        <ApparatusSectionDetail
          title={title}
          backHref={`/section?title=${encodeURIComponent("Структура Аппарата")}`}
        />
      );
    }

    const noGoldUnderline =
      title === "Представительство в Совете Федерации" ||
      title === "Депутатские фракции" ||
      title === "Комиссии" ||
      title === "Молодежный Хурал" ||
      title.startsWith("Подробнее о:");

    // Committees list page
    if (title === "Комитеты") {
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div>
                <h1>Комитеты</h1>
                <p style={{ marginTop: 0 }}>
                  Выберите комитет, чтобы посмотреть состав и информацию.
                </p>
                <div className="grid cols-2" style={{ marginTop: 12 }}>
                  {(committees || []).map((c) => (
                    <a
                      key={c.id}
                      className="tile link"
                      href={`/committee?id=${encodeURIComponent(c.id)}`}
                    >
                      <span style={{ display: "grid", gap: 6 }}>
                        <span style={{ fontWeight: 900, color: "#0a1f44" }}>{c.title}</span>
                        <span style={{ color: "#6b7280", fontSize: 13 }}>
                          {(Array.isArray(c.members) ? c.members.length : 0)
                            ? `Состав: ${c.members.length}`
                            : "Состав: —"}
                        </span>
                      </span>
                      <span aria-hidden="true">›</span>
                    </a>
                  ))}
                </div>
              </div>
              <SideNav title="Разделы" />
            </div>
          </div>
        </section>
      );
    }

    // Special handling for Комиссии page
    if (title === "Комиссии") {
      const commissionsList = [
        {
          id: "nagradnaya",
          name: "Наградная комиссия Верховного Хурала (парламента) Республики Тыва",
        },
        {
          id: "kontrol-dostovernost",
          name: "Комиссия Верховного Хурала (парламента) Республики Тыва по контролю за достоверностью сведений о доходах, об имуществе и обязательствах имущественного характера, представляемых депутатами Верховного Хурала (парламента) Республики Тыва",
        },
        {
          id: "schetnaya",
          name: "Счетная комиссия Верховного Хурала",
        },
        {
          id: "reglament-etika",
          name: "Комиссия Верховного Хурала (парламента) Республики Тыва по Регламенту Верховного Хурала (парламента) Республики Тыва и депутатской этике",
        },
        {
          id: "reabilitatsiya",
          name: "Республиканская комиссия по восстановлению прав реабилитированных жертв политических репрессий",
        },
        {
          id: "svo-podderzhka",
          name: "Комиссия Верховного Хурала (парламента) Республики Тыва по поддержке участников специальной военной операции и их семей",
        },
        {
          id: "smi-obshestvo",
          name: "Комитет Верховного Хурала (парламента) Республики Тыва по взаимодействию со средствами массовой информации и общественными организациями",
        },
        {
          id: "mezhregionalnye-svyazi",
          name: "Комитет Верховного Хурала (парламента) Республики Тыва по межрегиональным и международным связям",
        },
      ];

      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div>
                <h1 className={noGoldUnderline ? "no-gold-underline" : undefined}>{title}</h1>
                <ul>
                  {commissionsList.map((item) => (
                    <li key={item.id}>
                      <a href={`/commission?id=${item.id}`}>{item.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <SideNav title="Разделы" />
            </div>
          </div>
        </section>
      );
    }

    if (title === "Депутатские фракции") {
      const defaultFactions = ["Единая Россия", "КПРФ", "ЛДПР", "Новые люди"];
      const factions = (Array.isArray(structureFactions) ? structureFactions : [])
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") return item.name || item.title || item.label || String(item);
          return String(item || "");
        })
        .map((s) => String(s || "").trim())
        .filter((s) => s && s !== "Все");
      const mergedFactions = Array.from(new Set([...factions, ...defaultFactions]));
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div>
                <h1 className="no-gold-underline">{title}</h1>
                <p style={{ marginTop: 0 }}>
                  Выберите фракцию, чтобы перейти к списку депутатов по этой фракции.
                </p>
                {mergedFactions.length ? (
                  <div className="grid cols-2" style={{ marginTop: 12 }}>
                    {mergedFactions.map((f) => (
                      <a
                        key={String(f)}
                        className="tile link"
                        href={`/deputies?faction=${encodeURIComponent(String(f))}`}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                          <span aria-hidden="true">‹</span>
                          {f}
                        </span>
                        <span aria-hidden="true">›</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="tile" style={{ marginTop: 12 }}>
                    Список фракций пока пуст.
                  </div>
                )}
              </div>
              <SideNav title="Разделы" />
            </div>
          </div>
        </section>
      );
    }

    if (title === "Представительство в Совете Федерации") {
      // Ищем представителя/сенатора:
      // 1) приоритетно по structureType=federation_council (из админки)
      // 2) fallback по position/role (старый механизм)
      const findSenator = () => {
        const fromStructureType = (deputies || []).find(
          (d) => d && String(d.structureType || "").trim() === "federation_council"
        );
        if (fromStructureType) {
          return {
            ...fromStructureType,
            role:
              getDeputyTitle(fromStructureType, "federation_council") ||
              "Член Совета Федерации от Республики Тыва",
            type: "dep",
          };
        }
        // Сначала проверяем deputies
        const senatorFromDeputies = (deputies || []).find((d) => 
          d && (
            (d.position && typeof d.position === "string" && d.position.toLowerCase().includes("сенатор")) ||
            (d.role && typeof d.role === "string" && d.role.toLowerCase().includes("сенатор")) ||
            (d.position && typeof d.position === "string" && d.position.toLowerCase().includes("совет федерации"))
          )
        );
        
        if (senatorFromDeputies) {
          return {
            ...senatorFromDeputies,
            role: senatorFromDeputies.position || senatorFromDeputies.role || "Член Совета Федерации от Республики Тыва",
            type: "dep"
          };
        }
        
        // Проверяем government
        const senatorFromGov = (government || []).find((g) => 
          g && (
            (g.role && typeof g.role === "string" && g.role.toLowerCase().includes("сенатор")) ||
            (g.role && typeof g.role === "string" && g.role.toLowerCase().includes("совет федерации"))
          )
        );
        
        if (senatorFromGov) {
          return {
            ...senatorFromGov,
            type: "org"
          };
        }
        
        // Если не найден, возвращаем null (будет показана заглушка)
        return null;
      };
      
      const senator = findSenator();
      
      if (senator) {
        return (
          <section className="section section-page">
            <div className="container">
              <div className="page-grid">
                <div className="page-grid__main">
                  <h1 className={noGoldUnderline ? "no-gold-underline" : undefined}>{title}</h1>
                  <PersonDetail 
                    item={senator} 
                    type={senator.type || "dep"}
                    backHref={`/section?title=${encodeURIComponent("Представительство в Совете Федерации")}`}
                  />
                </div>
                <SideNav title="Разделы" />
              </div>
            </div>
          </section>
        );
      }
      
      // Если сенатор не найден, показываем заглушку с инструкцией
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div>
                <h1 className={noGoldUnderline ? "no-gold-underline" : undefined}>{title}</h1>
                <div className="tile" style={{ padding: 24, marginTop: 20 }}>
                  <p style={{ marginTop: 0 }}>
                    Для отображения информации о представителе в Совете Федерации необходимо добавить депутата 
                    с позицией, содержащей слово "сенатор" или "Совет Федерации" в данные депутатов.
                  </p>
                <p>
                    Или добавьте запись в файл government.json с ролью, содержащей "сенатор" или "Совет Федерации".
                </p>
                </div>
                <div className="tabs" style={{ marginTop: 20 }}>
                  <a className="btn" href="/contacts">
                    Контакты →
                  </a>
                  <a className="btn" href="/appeals">
                    Прием обращений →
                  </a>
                </div>
              </div>
              <SideNav title="Разделы" />
            </div>
          </div>
        </section>
      );
    }

    if (title === "Молодежный Хурал") {
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div className="page-grid__main">
                <h1 className="no-gold-underline">{title}</h1>
               
                <DeputyGrid
                  deputies={deputies}
                  structureType="youth_khural"
                  backHref={`/section?title=${encodeURIComponent("Молодежный Хурал")}`}
                />
              </div>
              <SideNav title="Разделы" />
            </div>
          </div>
        </section>
      );
    }

    if (title === "Совет по взаимодействию с представительными органами муниципальных образований") {
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div className="page-grid__main">
                <h1 className="no-gold-underline">{title}</h1>
                <p style={{ marginTop: 0 }}>
                  Состав формируется автоматически по полю <strong>Тип структуры</strong> у депутата.
                </p>
                <DeputyGrid
                  deputies={deputies}
                  structureType="municipal_council"
                  backHref={`/section?title=${encodeURIComponent(
                    "Совет по взаимодействию с представительными органами муниципальных образований"
                  )}`}
                />
              </div>
              <SideNav title="Разделы" />
            </div>
          </div>
        </section>
      );
    }

    if (title === "Структура Аппарата" || title === "Аппарат") {
      const toSectionHref = (t) => `/section?title=${encodeURIComponent(String(t || "").trim())}`;
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div className="page-grid__main">
                <h1 className="no-gold-underline">Структура Аппарата</h1>
                <div className="office-chart card">
                  <div className="office-chart__scroll" aria-label="Структура аппарата">
                    <div className="office-chart__grid" role="img" aria-label="Организационная структура аппарата">
                      <div className="office-chart__top">
                        <a
                          className="office-chart__node office-chart__node--top office-chart__node--link"
                          href={toSectionHref("Руководитель Аппарата")}
                        >
                          <div className="office-chart__node-title">
                            Руководитель Аппарата Верховного Хурала (парламента) Республики Тыва
                          </div>
                        </a>
                      </div>

                      <div className="office-chart__wires" aria-hidden="true">
                        <span className="office-chart__wire office-chart__wire--stem" />
                        <span className="office-chart__wire office-chart__wire--h" />
                        <span className="office-chart__wire office-chart__wire--v-left" />
                        <span className="office-chart__wire office-chart__wire--v-center" />
                        <span className="office-chart__wire office-chart__wire--v-right" />
                      </div>

                      <div className="office-chart__col office-chart__col--left">
                        <a
                          className="office-chart__node office-chart__node--link"
                          href={toSectionHref("Заместитель Руководителя Аппарата")}
                        >
                          <div className="office-chart__node-title">
                            Заместитель руководителя Аппарата Верховного Хурала – начальник организационного
                            управления Аппарата ВХ РТ
                          </div>
                        </a>
                        <div className="office-chart__stack office-chart__stack--down">
                          <a
                            className="office-chart__node office-chart__node--link"
                            href={toSectionHref("Организационное управление")}
                          >
                            <div className="office-chart__node-title">Организационное управление Аппарата ВХ РТ</div>
                          </a>
                        </div>
                      </div>

                      <div className="office-chart__col office-chart__col--center">
                        <div className="office-chart__stack">
                          <a
                            className="office-chart__node office-chart__node--link"
                            href={toSectionHref("Государственно-правовое управление")}
                          >
                            <div className="office-chart__node-title">Государственно-правовое управление Аппарата ВХ РТ</div>
                          </a>
                          <a className="office-chart__node office-chart__node--link" href={toSectionHref("Управление делами")}>
                            <div className="office-chart__node-title">Управление делами Аппарата ВХ РТ</div>
                          </a>
                          <a
                            className="office-chart__node office-chart__node--link"
                            href={toSectionHref("Информационно-аналитическое управление")}
                          >
                            <div className="office-chart__node-title">Информационно-аналитическое управление</div>
                          </a>
                          <a
                            className="office-chart__node office-chart__node--link"
                            href={toSectionHref("Управление финансов, бухгалтерского учета и отчетности")}
                          >
                            <div className="office-chart__node-title">
                              Управление финансов, бухгалтерского учета и отчетности Аппарата ВХ РТ
                            </div>
                          </a>
                          <a
                            className="office-chart__node office-chart__node--link"
                            href={toSectionHref("Отдел технического и программного обеспечения")}
                          >
                            <div className="office-chart__node-title">
                              Отдел технического и программного обеспечения Аппарата ВХ РТ
                            </div>
                          </a>
                          <a
                            className="office-chart__node office-chart__node--link"
                            href={toSectionHref("Отдел кадров и государственной службы")}
                          >
                            <div className="office-chart__node-title">
                              Отдел кадров и государственной службы Аппарата ВХ РТ
                            </div>
                          </a>
                        </div>
                      </div>

                      <div className="office-chart__col office-chart__col--right">
                        <div className="office-chart__stack">
                          <a
                            className="office-chart__node office-chart__node--link"
                            href={toSectionHref("Первый помощник Председателя")}
                          >
                            <div className="office-chart__node-title">
                              Первый помощник Председателя Верховного Хурала (парламента) Республики Тыва
                            </div>
                          </a>
                          <a
                            className="office-chart__node office-chart__node--link"
                            href={toSectionHref("Помощник Председателя")}
                          >
                            <div className="office-chart__node-title">
                              Помощник Председателя Верховного Хурала (парламента) Республики Тыва
                            </div>
                          </a>
                          <a
                            className="office-chart__node office-chart__node--link"
                            href={toSectionHref("Помощник заместителя Председателя")}
                          >
                            <div className="office-chart__node-title">
                              Помощник заместителя Председателя Верховного Хурала (парламента) Республики Тыва
                            </div>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <SideNav title="Разделы" links={APPARATUS_NAV_LINKS} />
            </div>
          </div>
        </section>
      );
    }

    if (title === "Руководство парламента" || title === "Руководство Верховного Хурала (парламента) Республики Тыва") {
      const back = `/section?title=${encodeURIComponent("Руководство парламента")}`;
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div className="page-grid__main">
                <h1 className="no-gold-underline">{title === "Руководство парламента" ? title : "Руководство парламента"}</h1>
                <p style={{ marginTop: 0 }}>
                  Состав формируется автоматически по полю <strong>Тип структуры</strong> у депутата.
                </p>
                <DeputyGrid deputies={deputies} structureType="parliament_leadership" backHref={back} />
              </div>
              <SideNav title="Разделы" />
            </div>
          </div>
        </section>
      );
    }

    // Special handling for "Отчеты всех Созывов" page
    if (title === "Отчеты всех Созывов") {
      return <ReportsAllConvocationsPage />;
    }

    // Special handling for "Отчеты о деятельности комитетов X созыва" pages
    const reportsMatch = title.match(/^Отчеты о деятельности комитетов\s+([IVX]+|\d+)\s+созыва$/i);
    if (reportsMatch) {
      const convNumber = normalizeConvocationToken(reportsMatch[1]);
      if (convNumber) {
        return <ConvocationReportsPage convocationNumber={convNumber} />;
      }
    }

    return <SectionCmsDetail title={title} noGoldUnderline={noGoldUnderline} />;
  }

  // Structure diagram view (as on the picture)
  return (
    <section className="section section-page">
      <div className="container">
        <div className="page-grid">
          <div className="page-grid__main" id="focus-overview">
            <h1 className="no-gold-underline h1-compact">
              Структура Верховного Хурала (парламента) Республики Тыва
            </h1>
            <div className="org org--khural">
              <div className="org__row org__row--center">
                {(() => {
                  const chairman = (government || []).find(
                    (g) =>
                      g &&
                      g.role &&
                      typeof g.role === "string" &&
                      g.role.toLowerCase().includes("председатель")
                  );
                  if (chairman && chairman.id) {
                    return (
                      <a
                        className="org__item org__item--blue org__item--xl"
                        href={`/government?type=gov&id=${encodeURIComponent(chairman.id)}`}
                      >
                        Председатель Верховного Хурала (парламента) Республики Тыва
                      </a>
                    );
                  }
                  return (
                    <div className="org__item org__item--blue org__item--xl">
                      Председатель Верховного Хурала (парламента) Республики Тыва
                    </div>
                  );
                })()}
              </div>
              {/* Factions row */}
              <div className="org__row org__row--factions" id="focus-factions">
                {["Единая Россия", "КПРФ", "ЛДПР", "Новые люди"].map((f) => (
                  <a
                    key={f}
                    className="org__item org__item--blue"
                    href={`/deputies?faction=${encodeURIComponent(f)}`}
                  >
                    Фракция
                    <br />
                    {f}
                  </a>
                ))}
              </div>
              {/* Three column zone: committees on the left, commissions/councils on right */}
              <div className="org__row org__row--cols4">
                <div className="org__col" id="focus-committees">
                  <a
                    className="org__item org__item--blue"
                    href={"/section?title=" + encodeURIComponent("Комитеты")}
                  >
                    Комитеты Верховного Хурала (парламента) Республики Тыва
                  </a>
                  {(committees || []).map((c) => (
                    <a
                      key={c.id}
                      className="org__item org__item--green"
                      href={`/committee?id=${encodeURIComponent(c.id)}`}
                    >
                      {c.title}
                    </a>
                  ))}
                </div>
                <div className="org__col">
                  <a
                    className="org__item org__item--blue"
                    href="/commission?id=mezhregionalnye-svyazi"
                  >
                    Комитет Верховного Хурала (парламента) Республики Тыва по межрегиональным связям
                  </a>
                  <a className="org__item org__item--blue" href="/commission?id=smi-obshestvo">
                    Комитет Верховного Хурала (парламента) Республики Тыва по взаимодействию со
                    средствами массовой информации и общественными организациями
                  </a>
                </div>
                <div className="org__col org__col--span2" id="focus-commissions">
                  {[
                    {
                      title:
                        "Комиссия Верховного Хурала (парламента) Республики Тыва по Регламенту Верховного Хурала (парламента) Республики Тыва и депутатской этике",
                      id: "reglament-etika",
                    },
                    {
                      title:
                        "Комиссия Верховного Хурала (парламента) Республики Тыва контрольно за достоверностью сведений о доходах, об имуществе и обязательствах имущественного характера, представляемых депутатами Верховного Хурала (парламента) Республики Тыва",
                      id: "kontrol-dostovernost",
                    },
                    {
                      title: "Наградная комиссия Верховного Хурала (парламента) Республики Тыва",
                      id: "nagradnaya",
                    },
                    {
                      title:
                        "Комиссия Верховного Хурала (парламента) Республики Тыва по поддержке участников специальной военной операции и их семей",
                      id: "svo-podderzhka",
                    },
                    {
                      title: "Счетная комиссия Верховного Хурала (парламента) Республики Тыва",
                      id: "schetnaya",
                    },
                  ].map((item, i) => (
                    <a
                      key={`wide-${i}`}
                      className="org__item org__item--blue"
                      href={`/commission?id=${item.id}`}
                    >
                      {item.title}
                    </a>
                  ))}
                </div>
              </div>
              {/* Councils anchor (same visual area for now) */}
              <div id="focus-councils" style={{ height: 1 }} />
              <div className="org__row org__row--center">
                <a className="org__item org__item--xl org__item--blue" href="/apparatus">
                  Аппарат Верховного Хурала (парламента) Республики Тыва
                </a>
              </div>
            </div>
          </div>
          <SideNav title="Разделы" />
        </div>
      </div>
    </section>
  );
}
