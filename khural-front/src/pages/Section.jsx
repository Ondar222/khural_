import React from "react";
import { useData } from "../context/DataContext.jsx";
import { AboutApi, ConvocationsApi, CommitteesApi, apiFetch } from "../api/client.js";
import { useI18n } from "../context/I18nContext.jsx";
import SideNav from "../components/SideNav.jsx";
import PersonDetail from "../components/PersonDetail.jsx";
import { normalizeFilesUrl } from "../utils/filesUrl.js";
import { extractPageHtml, extractPageTitle, getPreferredLocaleToken } from "../utils/pages.js";
import { getApparatusNavLinks } from "../utils/apparatusLinks.js";
import { APPARATUS_SECTIONS } from "../utils/apparatusContent.js";
import { normalizeBool } from "../utils/bool.js";
import {
  DEFAULT_STRUCTURE_COMMITTEES,
  COMMITTEE_DEFAULT_CONVOCATION,
  COMMITTEES_OVERRIDES_EVENT_NAME,
  COMMITTEES_OVERRIDES_STORAGE_KEY,
  readCommitteesOverrides,
} from "../utils/committeesOverrides.js";
import {
  CONVOCATIONS_OVERRIDES_EVENT_NAME,
  CONVOCATIONS_OVERRIDES_STORAGE_KEY,
  readConvocationsOverrides,
} from "../utils/convocationsOverrides.js";
import { EnvironmentOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { buildFactionOptions } from "../utils/deputyFilterOptions.js";
import {
  COUNCIL_BASE_TITLE,
  COUNCIL_NAV,
  PRESIDIUM,
  COUNCIL_GROUPS,
  COUNCIL_AGENDAS,
  COUNCIL_RESOLUTION,
  COUNCIL_POLOZHENIE,
} from "../data/councilSovete.js";
import {
  CONV3_RESOLUTION,
  CONV3_COMMITTEES,
  getConv3DocsByCommittee,
} from "../data/committeeReportsConv3.js";
import {
  CONV4_COMMITTEES,
  getConv4DocsByCommittee,
} from "../data/committeeReportsConv4.js";
import {
  CODE_OF_HONOR_HTML,
  CODE_OF_HONOR_TITLE,
  MOTHERS_COMMANDMENTS_HTML,
  MOTHERS_COMMANDMENTS_TITLE,
} from "./PageBySlug.jsx";

const SECTION_TITLE_TO_SLUG = {
  "Кодекс чести мужчины Тувы": "code-of-honor",
  "Свод заповедей матерей Тувы": "mothers-commandments",

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
        // Timeout 10 seconds for page fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
          const page = await apiFetch(`/pages/slug/${encodeURIComponent(cmsSlug)}`, {
            method: 'GET',
            auth: false,
            signal: controller.signal
          }).catch(() => null);
          if (alive) setPageFromAdmin(page);
        } finally {
          clearTimeout(timeoutId);
        }
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
            <SideNav title="Разделы" loadPages={true} autoSection={true} />
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
            <SideNav title="Разделы" loadPages={true} autoSection={true} />
          </div>
        </div>
      </section>
    );
  }

  // Fallback to static content for known pages
  const isCodeOfHonor = title === CODE_OF_HONOR_TITLE;
  const isMothersCommandments = title === MOTHERS_COMMANDMENTS_TITLE;
  const staticHtml = isCodeOfHonor
    ? CODE_OF_HONOR_HTML
    : isMothersCommandments
      ? MOTHERS_COMMANDMENTS_HTML
      : null;

  if (staticHtml) {
    return (
      <section className="section section-page">
        <div className="container">
          <div className="page-grid">
            <div>
              <h1 className={noGoldUnderline ? "no-gold-underline" : undefined}>{title}</h1>
              <div className="card" style={{ padding: 18, marginTop: 20 }}>
                <div dangerouslySetInnerHTML={{ __html: staticHtml }} />
              </div>
            </div>
            <SideNav title="Разделы" loadPages={true} autoSection={true} />
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
          <SideNav title="Разделы" loadPages={true} />
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
  const v = c?.convocation?.id ?? c?.convocationId ?? c?.convocation_id ?? null;
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

// Точно такие же функции, как на странице /convocations — чтобы данные «Отчеты всех Созывов» совпадали с «Созывы»
function convocationKeyForMerge(c) {
  if (!c) return "";
  if (typeof c === "string") return normalizeConvocationToken(c) || String(c).trim();
  const name = String(c?.name || c?.number || "").trim();
  const token = normalizeConvocationToken(name);
  if (token) return token;
  const id = c?.id ?? "";
  return String(id).trim();
}

function mergeConvocationsWithOverridesByKey(base, overrides) {
  const created = Array.isArray(overrides?.created) ? overrides.created : [];
  const updatedById =
    overrides?.updatedById && typeof overrides.updatedById === "object" ? overrides.updatedById : {};
  const deletedIds = new Set(Array.isArray(overrides?.deletedIds) ? overrides.deletedIds.map(String) : []);
  const out = [];
  const seen = new Set();
  const pushOne = (it) => {
    if (!it) return;
    const key = convocationKeyForMerge(it);
    if (!key) return;
    if (deletedIds.has(String(it?.id ?? ""))) return;
    const override = updatedById[String(it?.id ?? "")] || updatedById[key];
    const merged = override ? { ...(typeof it === "string" ? { name: it } : it), ...override } : it;
    out.push(merged);
    seen.add(key);
  };
  for (const it of Array.isArray(base) ? base : []) pushOne(it);
  for (const it of created) {
    const key = convocationKeyForMerge(it);
    if (!key || seen.has(key)) continue;
    pushOne(it);
  }
  for (const patch of Object.values(updatedById || {})) {
    if (!patch || typeof patch !== "object") continue;
    const idStr = String(patch?.id ?? "").trim();
    if (idStr && deletedIds.has(idStr)) continue;
    const key = convocationKeyForMerge(patch);
    if (!key || seen.has(key)) continue;
    out.push(patch);
    seen.add(key);
  }
  return out;
}

function mergeCommitteesWithOverrides(base, overrides) {
  const created = Array.isArray(overrides?.created) ? overrides.created : [];
  const updatedById =
    overrides?.updatedById && typeof overrides.updatedById === "object" ? overrides.updatedById : {};
  const deletedIds = new Set(Array.isArray(overrides?.deletedIds) ? overrides.deletedIds.map(String) : []);
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
  for (const patch of Object.values(updatedById || {})) {
    if (!patch || typeof patch !== "object") continue;
    const idStr = String(patch?.id ?? "").trim();
    if (!idStr) continue;
    if (deletedIds.has(idStr)) continue;
    if (seen.has(idStr)) continue;
    out.push(patch);
    seen.add(idStr);
  }
  return out.sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
}

function convocationMatchKeysForReports(c) {
  const keys = new Set();
  if (!c) return [];
  const id = String(c?.id ?? "").trim();
  if (id) keys.add(id);
  const token = normalizeConvocationToken(c?.name || c?.number || c?.id || "");
  if (token) keys.add(token);
  return Array.from(keys);
}

function ReportsAllConvocationsPage() {
  const { committees: committeesFromContext } = useData();
  const [apiConvocations, setApiConvocations] = React.useState(null);
  const [apiCommittees, setApiCommittees] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [overridesSeq, setOverridesSeq] = React.useState(0);
  const [convOverridesSeq, setConvOverridesSeq] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [list, committeesList] = await Promise.all([
          ConvocationsApi.list({ activeOnly: false }).catch(() => null),
          CommitteesApi.list({ all: true }).catch(() => null),
        ]);
        if (!alive) return;
        setApiConvocations(Array.isArray(list) ? list : []);
        setApiCommittees(Array.isArray(committeesList) ? committeesList : null);
      } catch {
        if (alive) {
          setApiConvocations([]);
          setApiCommittees(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  React.useEffect(() => {
    const bump = () => setOverridesSeq((x) => x + 1);
    const onStorage = (e) => { if (e?.key === COMMITTEES_OVERRIDES_STORAGE_KEY) bump(); };
    window.addEventListener(COMMITTEES_OVERRIDES_EVENT_NAME, bump);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(COMMITTEES_OVERRIDES_EVENT_NAME, bump);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  React.useEffect(() => {
    const bump = () => setConvOverridesSeq((x) => x + 1);
    const onStorage = (e) => { if (e?.key === CONVOCATIONS_OVERRIDES_STORAGE_KEY) bump(); };
    window.addEventListener(CONVOCATIONS_OVERRIDES_EVENT_NAME, bump);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CONVOCATIONS_OVERRIDES_EVENT_NAME, bump);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Те же комитеты, что и на странице «Созывы»: API + контекст + overrides
  const committees = React.useMemo(() => {
    const base = Array.isArray(apiCommittees) ? apiCommittees : committeesFromContext;
    return mergeCommitteesWithOverrides(base, readCommitteesOverrides());
  }, [apiCommittees, committeesFromContext, overridesSeq]);

  // Сырой список созывов из API (нормализация как на странице Convocations)
  const convocationsRaw = React.useMemo(() => {
    const raw = apiConvocations;
    const base = Array.isArray(raw) && raw.length
      ? raw.map((x) => {
          if (typeof x === "string") {
            const token = normalizeConvocationToken(x);
            return { id: token || x, name: x, description: "", isActive: true };
          }
          if (x && typeof x === "object") {
            return {
              id: x.id ?? normalizeConvocationToken(x.name || x.number || ""),
              name: x.name || x.number || "",
              description: x.description || "",
              isActive: normalizeBool(x.isActive, true),
            };
          }
          return null;
        }).filter(Boolean)
      : [];
    return mergeConvocationsWithOverridesByKey(base, readConvocationsOverrides());
  }, [apiConvocations, convOverridesSeq]);

  // Созывы, извлечённые из комитетов — как на странице «Созывы»; у них id совпадает с committee.convocation.id
  const convocationsFromCommittees = React.useMemo(() => {
    const out = [];
    const seen = new Set();
    for (const k of Array.isArray(committees) ? committees : []) {
      const c = k?.convocation;
      if (!c || typeof c !== "object") continue;
      const idStr = String(c?.id ?? "").trim();
      if (!idStr || seen.has(idStr)) continue;
      out.push({
        id: c.id,
        name: c.name || c.number || "",
        description: c.description || "",
        isActive: normalizeBool(c.isActive, true),
      });
      seen.add(idStr);
    }
    return out;
  }, [committees]);

  // Объединённый список созывов: сначала из комитетов (чтобы id совпадали), потом из API + overrides
  const convocationsMerged = React.useMemo(() => {
    const base = [
      ...(Array.isArray(convocationsFromCommittees) ? convocationsFromCommittees : []),
      ...(Array.isArray(convocationsRaw) ? convocationsRaw : []),
    ];
    return mergeConvocationsWithOverridesByKey(base, readConvocationsOverrides());
  }, [convocationsFromCommittees, convocationsRaw, convOverridesSeq]);

  const isCommitteeActive = React.useCallback((c) => {
    if (!c) return false;
    return normalizeBool(c?.isActive, true) !== false;
  }, []);

  // Группировка комитетов по ключам созыва — идентично странице «Созывы»
  const committeesByConvocationKey = React.useMemo(() => {
    const map = new Map();
    for (const c of Array.isArray(committees) ? committees : []) {
      if (!isCommitteeActive(c)) continue;
      const keys = committeeConvocationMatchKeys(c);
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
    return map;
  }, [committees, isCommitteeActive]);

  const sortedConvocations = React.useMemo(() => {
    const romanOrder = ["VIII", "VII", "VI", "V", "IV", "III", "II", "I"];
    return [...convocationsMerged].sort((a, b) => {
      const aToken = normalizeConvocationToken(a.name || a.number || "");
      const bToken = normalizeConvocationToken(b.name || b.number || "");
      const aRomanIndex = romanOrder.indexOf(aToken);
      const bRomanIndex = romanOrder.indexOf(bToken);
      if (aRomanIndex !== -1 && bRomanIndex !== -1) return aRomanIndex - bRomanIndex;
      if (aRomanIndex !== -1) return -1;
      if (bRomanIndex !== -1) return 1;
      const aNum = parseInt(aToken, 10);
      const bNum = parseInt(bToken, 10);
      if (!isNaN(aNum) && !isNaN(bNum)) return bNum - aNum;
      if (!isNaN(aNum)) return -1;
      if (!isNaN(bNum)) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [convocationsMerged]);
  

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
                  const keys = convocationMatchKeysForReports(c);
                  const list = keys.flatMap((k) => committeesByConvocationKey.get(k) || []);
                  const uniq = new Map();
                  for (const it of list) {
                    const cid = String(it?.id ?? "");
                    if (!cid) continue;
                    if (!uniq.has(cid)) uniq.set(cid, it);
                  }
                  const committeesList = Array.from(uniq.values());
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
          <SideNav title="Разделы" loadPages={true} autoSection={true} />
        </div>
      </div>
    </section>
  );
}

const ROMAN_TO_NUM = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };

function ConvocationReportsPage({ convocationNumber }) {
  const { committees: committeesFromContext } = useData();
  const [convocation, setConvocation] = React.useState(null);
  const [apiCommittees, setApiCommittees] = React.useState(null);
  const [committees, setCommittees] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [currentView, setCurrentView] = React.useState("committees");
  const [reportsCategory, setReportsCategory] = React.useState("reports");
  const [selectedCommittee, setSelectedCommittee] = React.useState(null);
  const [selectedYear, setSelectedYear] = React.useState(null);
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [selectedYearForCategory, setSelectedYearForCategory] = React.useState(null);

  const extractYear = React.useCallback((dateStr) => {
    if (!dateStr) return null;
    const match = String(dateStr).match(/(\d{4})/);
    return match ? match[1] : null;
  }, []);

  // 1) Load convocation only
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const list = await ConvocationsApi.list({ activeOnly: false }).catch(() => []);
        if (!alive) return;

        const token = normalizeConvocationToken(convocationNumber);
        let convocationData = null;

        if (!isNaN(parseInt(convocationNumber, 10))) {
          const byId = await ConvocationsApi.getById(convocationNumber).catch(() => null);
          if (byId) convocationData = byId;
        }

        if (!convocationData && Array.isArray(list)) {
          convocationData = list.find((c) => {
            const cToken = typeof c === "string" ? normalizeConvocationToken(c) : normalizeConvocationToken(c?.name ?? c?.number ?? c?.id ?? "");
            const cId = typeof c === "object" && c !== null ? String(c?.id ?? "") : "";
            return cToken === token || cId === String(convocationNumber) ||
              (c?.name && String(c.name).toLowerCase().includes(String(convocationNumber).toLowerCase())) ||
              (c?.number && String(c.number) === String(convocationNumber));
          });
        }

        if (!convocationData && token) {
          for (const c of Array.isArray(list) ? list : []) {
            const cToken = typeof c === "string" ? normalizeConvocationToken(c) : normalizeConvocationToken(c?.name ?? c?.number ?? c?.id ?? "");
            if (cToken === token) {
              if (typeof c === "object" && c !== null && c.id != null) {
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

        if (!convocationData && token && (ROMAN_TO_NUM[token] != null || /^\d+$/.test(token))) {
          convocationData = { id: token, name: `Созыв ${token}`, number: token, documents: [] };
        }

        if (convocationData) {
          if (typeof convocationData === "string") {
            const t = normalizeConvocationToken(convocationData);
            convocationData = { id: t, name: `Созыв ${t}`, number: t, documents: [] };
          }
          const idToTry = convocationData.id;
          if (idToTry && (!Array.isArray(convocationData.documents) || convocationData.documents.length === 0)) {
            const byId = await ConvocationsApi.getById(idToTry).catch(() => null);
            if (byId && Array.isArray(byId.documents) && byId.documents.length > 0) {
              convocationData = byId;
            } else if (token) {
              const numId = ROMAN_TO_NUM[token] ?? (token.match(/^\d+$/) ? parseInt(token, 10) : null);
              if (numId != null) {
                const byNum = await ConvocationsApi.getById(numId).catch(() => null);
                if (byNum && Array.isArray(byNum.documents) && byNum.documents.length > 0) {
                  convocationData = byNum;
                }
              }
            }
          }
          setConvocation(convocationData);
        } else {
          setConvocation(null);
        }
      } catch (error) {
        console.error("Failed to load convocation:", error);
        if (alive) setConvocation(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [convocationNumber]);

  // 2) Load committees list once (same source as "Отчеты всех Созывов")
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const list = await CommitteesApi.list({ all: true }).catch(() => null);
      if (alive) setApiCommittees(Array.isArray(list) ? list : []);
    })();
    return () => { alive = false; };
  }, []);

  // 3) Список комитетов — тот же источник, что на «Созывы» и «Отчеты всех Созывов» (API + контекст + overrides)
  const committeesMerged = React.useMemo(() => {
    const base = Array.isArray(apiCommittees) ? apiCommittees : committeesFromContext;
    return mergeCommitteesWithOverrides(base, readCommitteesOverrides());
  }, [apiCommittees, committeesFromContext]);

  // 4) Отфильтровать комитеты по созыву (те же ключи, что на странице Созывы)
  React.useEffect(() => {
    if (!convocation) {
      setCommittees([]);
      return;
    }
    const token = normalizeConvocationToken(convocation.number ?? convocation.name ?? convocation.id);
    const documents = Array.isArray(convocation.documents) ? convocation.documents : [];
    const committeeIds = new Set();
    const hasDocumentsWithoutCommittee = documents.some((doc) => !doc.committeeId);
    documents.forEach((doc) => {
      if (doc.committeeId) committeeIds.add(String(doc.committeeId));
    });

    const all = Array.isArray(committeesMerged) ? committeesMerged : [];
    const convIdStr = convocation?.id != null ? String(convocation.id) : "";
    const numIdForToken = token ? (ROMAN_TO_NUM[token] ?? (token.match(/^\d+$/) ? parseInt(token, 10) : null)) : null;
    const convKeys = new Set([
      convocationNumber,
      normalizeConvocationToken(convocationNumber),
      convIdStr,
      numIdForToken != null ? String(numIdForToken) : "",
    ].filter(Boolean));

    const relevant = all.filter((c) => {
      if (!c) return false;
      if (committeeIds.has(String(c.id))) return true;
      const matchKeys = committeeConvocationMatchKeys(c);
      if (matchKeys.some((key) => convKeys.has(key))) return true;
      const committeeConvId = String(c?.convocation?.id ?? c?.convocationId ?? c?.convocation_id ?? "");
      const committeeConvToken = normalizeConvocationToken(c?.convocation?.name || c?.convocation?.number || "");
      if (committeeConvId && convKeys.has(committeeConvId)) return true;
      if (committeeConvToken && convKeys.has(committeeConvToken)) return true;
      return false;
    });

    const seen = new Set();
    const unique = relevant.filter((c) => {
      const id = String(c?.id ?? "");
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    if (hasDocumentsWithoutCommittee) {
      unique.push({ id: "general", title: "Общие документы", name: "Общие документы" });
    }
    committeeIds.forEach((cid) => {
      if (!unique.find((c) => String(c.id) === cid)) {
        unique.push({ id: cid, title: `Комитет (ID: ${cid})`, name: `Комитет (ID: ${cid})` });
      }
    });

    setCommittees(unique);
  }, [convocation, committeesMerged, convocationNumber]);

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

  if (loading) {
    return (
      <section className="section section-page">
        <div className="container">
          <div className="page-grid">
            <div>
              <h1>Отчеты о деятельности комитетов {convocationNumber} созыва</h1>
              <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Загрузка...</div>
            </div>
            <SideNav title="Разделы" loadPages={true} autoSection={true} />
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
            <SideNav title="Разделы" loadPages={true} autoSection={true} />
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
              <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
                <button
                  type="button"
                  className="section-tab-btn section-tab-btn--back"
                  onClick={() => {
                    setCurrentView("committees");
                    setSelectedCategory(null);
                    setSelectedYearForCategory(null);
                    window.location.hash = "";
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
                            className={`section-tab-btn ${selectedCategory === "agenda" ? "section-tab-btn--active" : ""}`}
                            onClick={() => {
                              setSelectedCategory("agenda");
                              setSelectedYearForCategory(null);
                              window.location.hash = "#documents-agenda";
                            }}
                          >
                            Повестки ({documentsByCategoryAndYear.agenda?.years?.reduce((sum, y) => sum + (documentsByCategoryAndYear.agenda.documents[y]?.length || 0), 0) || 0})
                          </button>
                        )}
                        {categories.includes("report") && (
                          <button
                            type="button"
                            className={`section-tab-btn ${selectedCategory === "report" ? "section-tab-btn--active" : ""}`}
                            onClick={() => {
                              setSelectedCategory("report");
                              setSelectedYearForCategory(null);
                              window.location.hash = "#documents-report";
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
                          className="section-tab-btn section-tab-btn--back"
                          onClick={() => {
                            setSelectedCategory(null);
                            setSelectedYearForCategory(null);
                            window.location.hash = "#documents";
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
            <SideNav title="Разделы" loadPages={true} autoSection={true} />
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
              
              <div style={{ display: "flex", gap: 12, marginTop: 20, marginBottom: 20 }}>
                <button
                  type="button"
                  className={`section-tab-btn ${currentView === "committees" ? "section-tab-btn--active" : ""}`}
                  onClick={() => {
                    setCurrentView("committees");
                    window.location.hash = "";
                  }}
                >
                  Комитеты
                </button>
                <button
                  type="button"
                  className={`section-tab-btn ${currentView === "documents" ? "section-tab-btn--active" : ""}`}
                  onClick={() => {
                    setCurrentView("documents");
                    setSelectedCategory(null);
                    setSelectedYearForCategory(null);
                    window.location.hash = "#documents";
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
            <SideNav title="Разделы" loadPages={true} autoSection={true} />
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
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
              <button
                type="button"
                className="section-tab-btn section-tab-btn--back"
                onClick={() => {
                  setSelectedCommittee(null);
                  setSelectedYear(null);
                  window.location.hash = "";
                }}
              >
                ← Назад к списку комитетов
              </button>
              <h1 style={{ margin: 0, fontSize: 24 }}>
                {selectedCommittee.title || selectedCommittee.name || "Комитет"}
              </h1>
            </div>

            <h2 style={{ marginTop: 24 }}>Повестки и отчеты</h2>
            <div style={{ display: "flex", gap: 12, marginTop: 20, marginBottom: 24 }}>
              <button
                type="button"
                className={`section-tab-btn ${reportsCategory === "agendas" ? "section-tab-btn--active" : ""}`}
                onClick={() => {
                  setReportsCategory("agendas");
                  setSelectedYear(null);
                  window.location.hash = "#agendas";
                }}
              >
                Повестки
              </button>
              <button
                type="button"
                className={`section-tab-btn ${reportsCategory === "reports" ? "section-tab-btn--active" : ""}`}
                onClick={() => {
                  setReportsCategory("reports");
                  setSelectedYear(null);
                  window.location.hash = "#reports";
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
          <SideNav title="Разделы" loadPages={true} autoSection={true} />
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
    const matched = list
      .filter((d) => d && String(d.structureType || "").trim() === String(structureType || "").trim());
    // Один депутат — одна карточка: убираем дубликаты по id
    const byId = new Map();
    for (const d of matched) {
      const id = d?.id != null ? String(d.id) : "";
      if (id && !byId.has(id)) byId.set(id, d);
      else if (!id) byId.set(`noid-${byId.size}`, d);
    }
    return Array.from(byId.values())
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
            <div className="gov-card__name">{d.name}</div>
            <div className="gov-card__role">Депутат</div>
            <ul className="gov-meta">
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

function ApparatusPersonCard({ p, href }) {
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

  const cardContent = (
    <>
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
              <a className="apparatus-person-card__metaItem" href={telHref} onClick={(e) => e.stopPropagation()}>
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
            <a className="apparatus-person-card__metaItem" href={`mailto:${String(p.email).trim()}`} onClick={(e) => e.stopPropagation()}>
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
    </>
  );

  const className = href ? "card apparatus-person-card apparatus-person-card--link" : "card apparatus-person-card";
  if (href) {
    return (
      <a className={className} href={href} style={{ textDecoration: "none", color: "inherit" }}>
        {cardContent}
      </a>
    );
  }
  return <div className={className}>{cardContent}</div>;
}

function ApparatusSectionDetail({ title, backHref, navLinks }) {
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
                  <ApparatusPersonCard
                    key={`${p.name || "p"}-${i}`}
                    p={p}
                    href={`/section?title=${encodeURIComponent(title)}&person=${i}`}
                  />
                ))}
              </div>
            ) : (
              <div className="card" style={{ padding: 18, marginTop: 14 }}>
                Информация о подразделении будет добавлена.
              </div>
            )}
          </div>
          <SideNav title="Разделы" links={navLinks} />
        </div>
      </div>
    </section>
  );
}

function getCommitteeTitle(c) {
  if (!c || typeof c !== "object") return "";
  return String(c.title || c.name || c.label || c.description || "").trim();
}

function normalizeCommitteeTitleKey(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function committeeRichness(c) {
  let score = 0;
  if (String(c?.description ?? "").trim().length > 0) score += 2;
  const convId = c?.convocation?.id ?? c?.convocationId ?? c?.convocation_id ?? c?.convocation;
  if (convId != null && convId !== "") score += 2;
  const members = Array.isArray(c?.members) ? c.members : [];
  score += members.length;
  if (c?.head && String(c.head).trim()) score += 1;
  const hasChairman = members.some((m) => m?.role && String(m.role).toLowerCase().includes("председатель"));
  if (hasChairman) score += 1;
  return score;
}

function deduplicateCommitteesByRichness(list) {
  const arr = Array.isArray(list) ? list : [];
  const byName = new Map();
  for (const c of arr) {
    const key = normalizeCommitteeTitleKey(getCommitteeTitle(c));
    if (!key) continue;
    const existing = byName.get(key);
    if (!existing || committeeRichness(c) > committeeRichness(existing)) {
      byName.set(key, c);
    }
  }
  return Array.from(byName.values());
}

export default function SectionPage() {
  const q = useQuery();
  const titleParam = q.get("title");
  const { committees, commissions, factions: structureFactions, government, deputies, convocations } = useData();
  const { t } = useI18n();
  const focus = q.get("focus");

  const navLinks = React.useMemo(() => getApparatusNavLinks(t), [t]);

  const committeesDeduped = React.useMemo(
    () => deduplicateCommitteesByRichness(committees || []),
    [committees]
  );

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

    // Prefilled (old) apparatus pages: show people/info or person detail.
    if (APPARATUS_SECTIONS?.[title]) {
      const personIndex = parseInt(q.get("person") ?? "", 10);
      const data = APPARATUS_SECTIONS[title];
      const people = Array.isArray(data.people) ? data.people : [];
      const person =
        Number.isInteger(personIndex) && personIndex >= 0 && personIndex < people.length
          ? people[personIndex]
          : null;
      const sectionBackHref = `/section?title=${encodeURIComponent(title)}`;
      if (person) {
        const item = {
          name: person.name,
          role: person.role,
          position: person.role,
          phone: person.phone,
          email: person.email,
          address: person.address,
          photo: person.photo,
        };
        return (
          <section className="section section-page">
            <div className="container">
              <div className="page-grid">
                <div className="page-grid__main">
                  <div className="section-page__topbar">
                    <a className="btn btn-back" href={sectionBackHref}>
                      ← Назад
                    </a>
                  </div>
                  <PersonDetail item={item} type="gov" backHref={sectionBackHref} />
                </div>
                <SideNav title="Разделы" links={navLinks} />
              </div>
            </div>
          </section>
        );
      }
      return (
        <ApparatusSectionDetail
          title={title}
          backHref={`/section?title=${encodeURIComponent("Структура Аппарата")}`}
          navLinks={navLinks}
        />
      );
    }

    const noGoldUnderline =
      title === "Представительство в Совете Федерации" ||
      title === "Депутатские фракции" ||
      title === "Фракции в Верховном Хурале" ||
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
                  {committeesDeduped.map((c) => {
                    const title = getCommitteeTitle(c);
                    return (
                      <a
                        key={c.id}
                        className="tile link"
                        href={`/committee?id=${encodeURIComponent(c.id)}`}
                      >
                        <span style={{ display: "grid", gap: 6 }}>
                          <span style={{ fontWeight: 900, color: "#0a1f44" }}>{title}</span>
                        <span style={{ color: "#6b7280", fontSize: 13 }}>
                          {(Array.isArray(c.members) ? c.members.length : 0)
                            ? `Состав: ${c.members.length}`
                            : "Состав: —"}
                        </span>
                      </span>
                      <span aria-hidden="true">›</span>
                    </a>
                    );
                  })}
                </div>
              </div>
              <SideNav title="Разделы" loadPages={true} autoSection={true} />
            </div>
          </div>
        </section>
      );
    }

    // Special handling for Комиссии page (данные из админки /admin/commissions)
    if (title === "Комиссии") {
      const commissionsList = Array.isArray(commissions) ? commissions : [];

      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div>
                <h1 className={noGoldUnderline ? "no-gold-underline" : undefined}>{title}</h1>

                <p style={{ marginTop: 16, lineHeight: 1.6, color: "#374151", maxWidth: 860 }}>
                  Комиссии Верховного Хурала (парламента) Республики Тыва являются постоянными органами,
                  образуемыми для предварительного рассмотрения и подготовки вопросов, относящихся к
                  ведению Верховного Хурала.
                </p>

                {commissionsList.length > 0 ? (
                  <div style={{ marginTop: 32 }}>
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}>
                      {commissionsList.map((item, index) => {
                        const commissionName = typeof item.name === "string" && /<[^>]+>/.test(item.name)
                          ? item.name.replace(/<[^>]*>/g, "").trim() || item.name
                          : item.name;

                        return (
                          <a
                            key={item.id}
                            href={`/commission?id=${item.id}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 16,
                              padding: "20px 24px",
                              background: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: 8,
                              textDecoration: "none",
                              color: "inherit",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 51, 102, 0.1)";
                              e.currentTarget.style.borderColor = "#003366";
                              e.currentTarget.style.transform = "translateX(4px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = "none";
                              e.currentTarget.style.borderColor = "#e5e7eb";
                              e.currentTarget.style.transform = "translateX(0)";
                            }}
                          >
                            <div style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              background: "linear-gradient(135deg, #003366 0%, #0055a5 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}>
                              <span style={{ fontSize: 20, color: "#fff" }}>📋</span>
                            </div>
                            <div style={{
                              flex: 1,
                              minWidth: 0,
                            }}>
                              <div style={{
                                fontSize: 16,
                                fontWeight: 600,
                                color: "#003366",
                                lineHeight: 1.4,
                                wordBreak: "break-word",
                              }}>
                                {commissionName}
                              </div>
                            </div>
                            <div style={{
                              color: "#0066cc",
                              fontSize: 18,
                              fontWeight: 600,
                              flexShrink: 0,
                            }}>
                              →
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="card" style={{ marginTop: 32, padding: 40, textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                    <p style={{ margin: 0, fontSize: 16, color: "#6b7280" }}>
                      Список комиссий пока не заполнен. Добавьте комиссии в админ-панели.
                    </p>
                  </div>
                )}
              </div>
              <SideNav title="Разделы" loadPages={true} autoSection={true} />
            </div>
          </div>
        </section>
      );
    }

    if (title === "Фракции в Верховном Хурале") {
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div>
                <a
                  href={"/section?title=" + encodeURIComponent("Депутатские фракции")}
                  className="link-back"
                  style={{ display: "block", marginBottom: 12 }}
                >
                  ← Депутатские фракции
                </a>
                <h1 className="no-gold-underline" style={{ marginTop: 0 }}>{title}</h1>
                <div className="content-block" style={{ marginTop: 24, lineHeight: 1.6 }}>
                  <p>
                    Согласно Регламенту Верховного Хурала (парламента) Республики Тыва фракцией является объединение депутатов Верховного Хурала, избранных в составе республиканского списка кандидатов, который был допущен к распределению депутатских мандатов в Верховном Хурале.
                  </p>
                  <p>
                    Во фракции могут входить также депутаты, избранные по одномандатным избирательным округам, написавшим заявление о вхождении во фракцию. Во фракцию обязательно входят все депутаты Верховного Хурала, избранные в составе соответствующего республиканского списка кандидатов.
                  </p>
                  <p>
                    Полное наименование фракции должно соответствовать наименованию политической партии, указанному в уставе политической партии, в составе республиканского списка кандидатов которой были избраны соответствующие депутаты. Фракция вправе иметь установленное положением о фракции краткое наименование, соответствующее ее полному наименованию.
                  </p>
                  <p>
                    Фракция избирает из своего состава руководителя фракции и заместителя (заместителей) руководителя фракции. В соответствии с положением о фракции фракция может образовывать руководящий орган (руководящие органы).
                  </p>
                  <p>
                    Деятельность фракции организуется ею в соответствии с Федеральным законом "О политических партиях", Законом Республики Тыва «О статусе депутатов Верховного Хурала (парламента) Республики Тыва», иными законами, Регламентом Верховного Хурала (парламента) Республики Тыва, Положением о фракции.
                  </p>
                  <p>
                    Фракция принимает Положение о фракции на организационном собрании большинством голосов от общего числа депутатов Верховного Хурала, избранных в Верховный Хурал в составе республиканского списка кандидатов от соответствующей партии и депутатов по одномандатным округам, написавшим заявление о вхождении во фракцию.
                  </p>
                  <p>
                    Решения фракции принимаются, как правило, открытым голосованием. Фракция может принять решение о проведении тайного голосования. Решения фракции принимаются большинством голосов от общего числа депутатов Верховного Хурала, входящих во фракцию, если иной порядок принятия решений не предусмотрен настоящим Регламентом, положением о фракции. Принятое решение фракции обязательно для исполнения членами фракции.
                  </p>
                  <p>
                    Фракции информируют председателя Верховного Хурала, Совет Верховного Хурала, комиссию Верховного Хурала по регламенту и депутатской этике о решениях по вопросам организации своей деятельности.
                  </p>
                  <p>
                    Для обеспечения деятельности фракции, в состав которой входит не менее десяти депутатов Верховного Хурала, создается аппарат фракции, входящий в структуру Аппарата Верховного Хурала.
                  </p>
                  <p>
                    Депутат вправе выйти из состава фракции, подав в Комиссию по регламенту и депутатской этике Верховного Хурала заявление о выходе из состава фракции. Днем выхода депутата из состава фракции считается день регистрации заявления депутата Верховного Хурала о выходе из состава фракции в Комиссию по регламенту и депутатской этике Верховного Хурала. Комиссия по регламенту и депутатской этике уведомляет руководство фракции о выходе депутата из состава фракции.
                  </p>
                  <p>
                    Депутат, избранный в составе списка кандидатов, допущенного к распределению депутатских мандатов в Верховном Хурале, не вправе выйти из фракции, в которой он состоит.
                  </p>
                  <p>
                    В случае выхода депутата Верховного Хурала, избранного в составе республиканского списка кандидатов, из состава фракции в соответствии с законом Республики Тыва об отзыве депутата Верховного Хурала полномочия депутата Верховного Хурала прекращаются. Проект постановления Верховного Хурала о досрочном прекращении полномочий депутата Верховного Хурала вносится на рассмотрение Верховного Хурала Комиссией по регламенту и депутатской этике. Днем прекращения полномочий депутата Верховного Хурала считается день принятия соответствующего решения Верховным Хуралом.
                  </p>
                </div>
              </div>
              <SideNav title="Разделы" loadPages={true} autoSection={true} />
            </div>
          </div>
        </section>
      );
    }

    if (title === "Депутатские фракции") {
      // Те же фракции, что в фильтре на странице «Депутаты»: API + структура + из депутатов (поле + биография)
      const mergedFactions = buildFactionOptions(structureFactions, deputies).filter((f) => f && f !== "Все");
      const factionsPageTitle = "Фракции в Верховном Хурале";
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
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                      >
                        <span>{f}</span>
                        <span aria-hidden="true">→</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="tile" style={{ marginTop: 12 }}>
                    Список фракций пока пуст.
                  </div>
                )}
                <a
                  className="tile link"
                  href={"/section?title=" + encodeURIComponent(factionsPageTitle)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 12,
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <span>{factionsPageTitle}</span>
                  <span aria-hidden="true">→</span>
                </a>
              </div>
              <SideNav title="Разделы" loadPages={true} autoSection={true} />
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
                    backHref="/deputies"
                  />
                </div>
                <SideNav title="Разделы" loadPages={true} autoSection={true} />
              </div>
            </div>
          </section>
        );
      }
      
      // Если сенатор не найден — показываем одного депутата (как на макете): приоритетно Ондар Онер Хулерович, иначе первый из списка
      const FEDERATION_COUNCIL_FALLBACK_NAME = "Ондар Онер Хулерович";
      const deputiesList = Array.isArray(deputies) ? deputies : [];
      const fallbackDeputy = deputiesList.find(
        (d) => d && String(d.name || "").trim() === FEDERATION_COUNCIL_FALLBACK_NAME
      ) || deputiesList[0];

      if (fallbackDeputy) {
        const representative = {
          ...fallbackDeputy,
          role:
            getDeputyTitle(fallbackDeputy, "federation_council") ||
            "Член Совета Федерации от Республики Тыва",
          type: "dep",
        };
        return (
          <section className="section section-page">
            <div className="container">
              <div className="page-grid">
                <div className="page-grid__main">
                  <h1 className={noGoldUnderline ? "no-gold-underline" : undefined}>{title}</h1>
                  <PersonDetail
                    item={representative}
                    type="dep"
                    backHref="/deputies"
                  />
                </div>
                <SideNav title="Разделы" loadPages={true} autoSection={true} />
              </div>
            </div>
          </section>
        );
      }

      // Нет ни сенатора, ни депутатов — короткая заглушка
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div>
                <h1 className={noGoldUnderline ? "no-gold-underline" : undefined}>{title}</h1>
                <div className="tile" style={{ padding: 24, marginTop: 20 }}>
                  <p style={{ margin: 0 }}>
                    Добавьте депутата с типом структуры «Представительство в Совете Федерации» в админке или
                    с позицией, содержащей «сенатор» или «Совет Федерации».
                  </p>
                </div>
              </div>
              <SideNav title="Разделы" loadPages={true} autoSection={true} />
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
              <SideNav title="Разделы" loadPages={true} autoSection={true} />
            </div>
          </div>
        </section>
      );
    }

    const councilBackHref = `/section?title=${encodeURIComponent(COUNCIL_BASE_TITLE)}`;

    if (title === "Постановление") {
      const R = COUNCIL_RESOLUTION;
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div className="page-grid__main">
                <a href={councilBackHref} className="link" style={{ display: "inline-block", marginBottom: 16 }}>
                  ← {COUNCIL_BASE_TITLE}
                </a>
                <h1 className="no-gold-underline">{R.title}</h1>
                <p style={{ fontWeight: 600, marginTop: 8 }}>{R.issuer}</p>
                <p style={{ color: "#374151", marginTop: 4 }}>{R.dateNumber}</p>
                <p style={{ fontWeight: 600, marginTop: 16 }}>{R.subject}</p>
                <p style={{ marginTop: 16 }}>{R.preamble}</p>
                <ol start={1} style={{ marginTop: 16 }}>
                  {R.points.map((text, i) => (
                    <li key={i} style={{ marginBottom: 8 }}>{text}</li>
                  ))}
                </ol>
                <p style={{ marginTop: 24 }}>{R.signatory}</p>
                <p style={{ color: "#374151", marginTop: 4 }}>{R.placeDate}</p>
              </div>
              <SideNav title="Разделы" loadPages={true} autoSection={true} />
            </div>
          </div>
        </section>
      );
    }

    if (title === COUNCIL_BASE_TITLE) {
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div className="page-grid__main">
                <h1 className="no-gold-underline">{title}</h1>
                <ul className="section-list" style={{ marginTop: 16, marginBottom: 24 }}>
                  {COUNCIL_NAV.map((item, i) => (
                    <li key={i} style={{ marginBottom: 8 }}>
                      <a
                        href={`/section?title=${encodeURIComponent(item.title)}`}
                        className="link"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <SideNav title="Разделы" loadPages={true} autoSection={true} />
            </div>
          </div>
        </section>
      );
    }

    if (title === "Положение о Совете") {
      const P = COUNCIL_POLOZHENIE;
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div className="page-grid__main">
                <a href={councilBackHref} className="link" style={{ display: "inline-block", marginBottom: 16 }}>
                  ← {COUNCIL_BASE_TITLE}
                </a>
                <div className="prose" style={{ marginTop: 0 }}>
                  <p style={{ textAlign: "center", marginBottom: 24, color: "#374151" }}>
                    {P.approvedBy.map((line, i) => (
                      <span key={i} style={{ display: "block" }}>{line}</span>
                    ))}
                  </p>
                  <h1 className="no-gold-underline" style={{ textAlign: "center", fontSize: "1.5rem", marginTop: 8 }}>{P.docTitle}</h1>
                  <p style={{ textAlign: "center", fontWeight: 600, marginTop: 8, marginBottom: 32 }}>
                    {P.docSubtitle}
                  </p>
                  {P.sections.map((sec, idx) => (
                    <React.Fragment key={idx}>
                      <h3 style={{ marginTop: idx > 0 ? 28 : 0, marginBottom: 12 }}>{sec.heading}</h3>
                      {sec.paragraphs.map((text, i) => (
                        <p key={i} style={{ marginBottom: 12 }}>{text}</p>
                      ))}
                    </React.Fragment>
                  ))}
                  <p style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #e5e7eb", color: "#6b7280" }}>
                    {P.documentUrl ? (
                      <a href={P.documentUrl} target="_blank" rel="noopener noreferrer" className="link">
                        {P.documentFooter}
                      </a>
                    ) : (
                      P.documentFooter
                    )}
                  </p>
                </div>
              </div>
              <SideNav title="Разделы" loadPages={true} autoSection={true} />
            </div>
          </div>
        </section>
      );
    }

    if (title === "Президиум Совета") {
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div className="page-grid__main">
                <a href={councilBackHref} className="link" style={{ display: "inline-block", marginBottom: 16 }}>
                  ← {COUNCIL_BASE_TITLE}
                </a>
                <h1 className="no-gold-underline">Президиум Совета</h1>
                <p style={{ marginTop: 8, color: "#6b7280" }}>
                  Руководители групп Совета Хуралов РТ.
                </p>
                <ul className="section-list" style={{ marginTop: 16, listStyle: "none", paddingLeft: 0 }}>
                  {PRESIDIUM.map((p, i) => (
                    <li key={i} style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #e5e7eb" }}>
                      <strong style={{ display: "block", marginBottom: 4 }}>{p.surname} {p.name}</strong>
                      <span style={{ color: "#374151" }}>{p.role}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <SideNav title="Разделы" loadPages={true} autoSection={true} />
            </div>
          </div>
        </section>
      );
    }

    if (title === "Структура Совета Хуралов") {
      const approvalLines = [
        "Утверждена",
        "решением Совета Верховного Хурала (парламента)",
        "Республики Тыва с представительными органами",
        "муниципальных образований Республики Тыва",
        "от 20 декабря 2019 г.",
      ];
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div className="page-grid__main">
                <a href={councilBackHref} className="link" style={{ display: "inline-block", marginBottom: 16 }}>
                  ← {COUNCIL_BASE_TITLE}
                </a>
                <div className="council-chart">
                  <div className="council-chart__header">
                    <h1 className="council-chart__page-title no-gold-underline">Структура Совета Хуралов</h1>
                    <div className="council-chart__approval">
                      {approvalLines.map((line, i) => (
                        <span key={i} style={{ display: "block" }}>{line}</span>
                      ))}
                    </div>
                  </div>
                  <h2 className="council-chart__chart-title">СТРУКТУРА СОВЕТА</h2>
                  <div className="council-chart__grid">
                    <div className="council-chart__box council-chart__box--chairman">
                      <span className="council-chart__box-title">ПРЕДСЕДАТЕЛЬ СОВЕТА</span>
                      по взаимодействию Верховного Хурала (парламента) Республики Тыва с представительными органами муниципальных образований Республики Тыва
                    </div>
                    <div className="council-chart__connector--h-wrap" style={{ minHeight: 28 }} />
                    <div className="council-chart__connector-v-three">
                      {[1, 2, 3].map((i) => (
                        <div key={i}><span aria-hidden="true" /></div>
                      ))}
                    </div>
                    <div className="council-chart__row council-chart__row--three">
                      <div className="council-chart__box council-chart__box--deputy">
                        <span className="council-chart__box-title">Заместитель председателя Совета</span>
                        по координации законотворческой деятельности представительных органов муниципальных образований
                      </div>
                      <div className="council-chart__box council-chart__box--presidium">
                        <span className="council-chart__box-title">ПРЕЗИДИУМ СОВЕТА</span>
                        по взаимодействию Верховного Хурала (парламента) Республики Тыва с представительными органами муниципальных образований Республики Тыва
                        <span style={{ display: "block", marginTop: 6, fontWeight: 500 }}>(Председатель, 2 заместителя, руководители групп)</span>
                      </div>
                      <div className="council-chart__box council-chart__box--deputy">
                        <span className="council-chart__box-title">Заместитель председателя Совета</span>
                        по вопросам местного самоуправления и общественной безопасности
                      </div>
                    </div>
                    <div className="council-chart__connector--six" style={{ minHeight: 28 }} />
                    <div className="council-chart__row council-chart__row--six">
                      {COUNCIL_GROUPS.map((g) => (
                        <div key={g.num} className="council-chart__box council-chart__box--leader">
                          Руководитель группы
                        </div>
                      ))}
                    </div>
                    <div className="council-chart__connector-v-six">
                      {COUNCIL_GROUPS.map((g) => (
                        <div key={g.num}><span aria-hidden="true" /></div>
                      ))}
                    </div>
                    <div className="council-chart__row council-chart__row--six">
                      {COUNCIL_GROUPS.map((g) => (
                        <div key={g.num} className="council-chart__box council-chart__box--group">
                          <span className="council-chart__box-title">ГРУППА № {g.num}</span>
                          {g.theme}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <SideNav title="Разделы" loadPages={true} autoSection={true} />
            </div>
          </div>
        </section>
      );
    }

    if (title === "Персональный состав ГРУПП") {
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div className="page-grid__main">
                <a href={councilBackHref} className="link" style={{ display: "inline-block", marginBottom: 16 }}>
                  ← {COUNCIL_BASE_TITLE}
                </a>
                <h1 className="no-gold-underline">Персональный состав ГРУПП</h1>
                <p style={{ marginTop: 8, color: "#6b7280" }}>
                  Утверждена решением Совета от 23 декабря 2020 г.
                </p>
                <div style={{ marginTop: 24 }}>
                  {COUNCIL_GROUPS.map((g) => (
                    <div key={g.num} className="card" style={{ marginBottom: 24, padding: 20 }}>
                      <h3 style={{ marginTop: 0 }}>ГРУППА № {g.num}</h3>
                      <p style={{ color: "#6b7280", marginBottom: 12 }}>{g.theme}</p>
                      <p><strong>Руководитель:</strong> {g.leader}</p>
                      {g.deputyLeader ? <p><strong>Заместитель:</strong> {g.deputyLeader}</p> : null}
                      <p><strong>Члены группы:</strong> {Array.isArray(g.members) ? g.members.join("; ") : g.members}</p>
                    </div>
                  ))}
                </div>
              </div>
              <SideNav title="Разделы" loadPages={true} autoSection={true} />
            </div>
          </div>
        </section>
      );
    }

    if (title === "Повестки заседаний Совета") {
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div className="page-grid__main">
                <a href={councilBackHref} className="link" style={{ display: "inline-block", marginBottom: 16 }}>
                  ← {COUNCIL_BASE_TITLE}
                </a>
                <h1 className="no-gold-underline">Повестки заседаний Совета</h1>
                <ul className="section-list" style={{ marginTop: 16 }}>
                  {COUNCIL_AGENDAS.map((item, i) => (
                    <li key={i} style={{ marginBottom: 8 }}>
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="link">
                          {item.label}
                        </a>
                      ) : (
                        <span>{item.label}</span>
                      )}
                      {item.size ? <span style={{ color: "#6b7280", marginLeft: 8 }}>({item.size})</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
              <SideNav title="Разделы" loadPages={true} autoSection={true} />
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
              <SideNav title="Разделы" links={navLinks} />
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
              <SideNav title="Разделы" loadPages={true} autoSection={true} />
            </div>
          </div>
        </section>
      );
    }

    // Страница «Отчеты комитетов» — внутри два пункта по созывам (не в сайдбаре)
    if (title === "Отчеты комитетов") {
      const committeeReportsLinks = [
        { label: "Отчеты комитетов 3 созыва", sectionTitle: "Отчеты комитетов 3 созыва" },
        { label: "Отчеты комитетов 4 созыва", sectionTitle: "Отчеты комитетов 4 созыва" },
      ];
      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div className="page-grid__main">
                <h1 className="no-gold-underline">Отчеты комитетов</h1>
                <p style={{ marginTop: 8, color: "#6b7280" }}>
                  Выберите созыв для просмотра отчётов комитетов.
                </p>
                <ul className="section-list" style={{ marginTop: 24, listStyle: "none", paddingLeft: 0 }}>
                  {committeeReportsLinks.map((item) => (
                    <li key={item.sectionTitle} style={{ marginBottom: 12 }}>
                      <a
                        href={`/section?title=${encodeURIComponent(item.sectionTitle)}`}
                        className="tile link"
                        style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 12 }}
                      >
                        <span aria-hidden="true">‹</span>
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <SideNav title="Разделы" loadPages={true} autoSection={true} />
            </div>
          </div>
        </section>
      );
    }

    // Отчеты комитетов 3 созыва — данные из committeeReportsConv3 (только ссылки на документы)
    if (title === "Отчеты комитетов 3 созыва") {
      const committees3 = CONV3_COMMITTEES;
      const committeeIndex = parseInt(q.get("committee") ?? "", 10);
      const hasCommittee = Number.isInteger(committeeIndex) && committeeIndex >= 0 && committeeIndex < committees3.length;
      const baseHref = `/section?title=${encodeURIComponent("Отчеты комитетов 3 созыва")}`;

      if (hasCommittee) {
        const committeeName = committees3[committeeIndex];
        const { agendas, reports } = getConv3DocsByCommittee(committeeIndex);
        const reportYears = [2023, 2022, 2021, 2020, 2019];
        const renderYearDocs = (list, year) => {
          const docs = list[year] || [];
          if (docs.length === 0) return <li key={year} style={{ marginBottom: 8 }}>{year} год</li>;
          return (
            <li key={year} style={{ marginBottom: 12 }}>
              <strong>{year} год</strong>
              <ul style={{ marginTop: 6, paddingLeft: 20, listStyle: "disc" }}>
                {docs.map((d, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="link">
                      {d.title}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          );
        };
        return (
          <section className="section section-page">
            <div className="container">
              <div className="page-grid">
                <div className="page-grid__main">
                  <a href={baseHref} className="link" style={{ display: "inline-block", marginBottom: 16 }}>
                    ← Отчеты о деятельности комитетов 3 созыва
                  </a>
                  <h1 className="no-gold-underline">{committeeName}</h1>
                  <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 32 }}>
                    <div>
                      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 16 }}>Повестки</h2>
                      <ul className="section-list" style={{ paddingLeft: 24, margin: 0 }}>
                        {reportYears.map((y) => renderYearDocs(agendas, y))}
                      </ul>
                    </div>
                    <div>
                      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 16 }}>Отчеты</h2>
                      <ul className="section-list" style={{ paddingLeft: 24, margin: 0 }}>
                        {reportYears.map((y) => renderYearDocs(reports, y))}
                      </ul>
                    </div>
                  </div>
                </div>
                <SideNav title="Разделы" loadPages={true} autoSection={true} />
              </div>
            </div>
          </section>
        );
      }

      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div className="page-grid__main">
                <a
                  href={`/section?title=${encodeURIComponent("Отчеты комитетов")}`}
                  className="link"
                  style={{ display: "inline-block", marginBottom: 16 }}
                >
                  ← Отчеты комитетов
                </a>
                <h1 className="no-gold-underline">Отчеты о деятельности комитетов 3 созыва</h1>
                <ul className="section-list" style={{ marginTop: 20, paddingLeft: 24 }}>
                  {committees3.map((name, i) => (
                    <li key={i} style={{ marginBottom: 10 }}>
                      <a href={`${baseHref}&committee=${i}`} className="link">
                        {name}
                      </a>
                    </li>
                  ))}
                </ul>
                <p style={{ marginTop: 24 }}>
                  <a href={CONV3_RESOLUTION.url} target="_blank" rel="noopener noreferrer" className="link">
                    {CONV3_RESOLUTION.title}
                  </a>
                  {CONV3_RESOLUTION.size ? (
                    <span style={{ color: "#6b7280", marginLeft: 8 }}>({CONV3_RESOLUTION.size})</span>
                  ) : null}
                </p>
              </div>
              <SideNav title="Разделы" loadPages={true} autoSection={true} />
            </div>
          </div>
        </section>
      );
    }

    // Отчеты комитетов 4 созыва — данные из committeeReportsConv4 (только ссылки на документы)
    if (title === "Отчеты комитетов 4 созыва") {
      const committees4 = CONV4_COMMITTEES;
      const committeeIndex = parseInt(q.get("committee") ?? "", 10);
      const hasCommittee = Number.isInteger(committeeIndex) && committeeIndex >= 0 && committeeIndex < committees4.length;
      const baseHref = `/section?title=${encodeURIComponent("Отчеты комитетов 4 созыва")}`;
      const reportYears4 = [2025, 2024];

      if (hasCommittee) {
        const committeeName = committees4[committeeIndex];
        const { agendas, reports } = getConv4DocsByCommittee(committeeIndex);
        const renderYearDocs = (list, year) => {
          const docs = list[year] || [];
          if (docs.length === 0) return <li key={year} style={{ marginBottom: 8 }}>{year} год</li>;
          return (
            <li key={year} style={{ marginBottom: 12 }}>
              <strong>{year} год</strong>
              <ul style={{ marginTop: 6, paddingLeft: 20, listStyle: "disc" }}>
                {docs.map((d, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="link">
                      {d.title}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          );
        };
        return (
          <section className="section section-page">
            <div className="container">
              <div className="page-grid">
                <div className="page-grid__main">
                  <a href={baseHref} className="link" style={{ display: "inline-block", marginBottom: 16 }}>
                    ← Отчеты о деятельности комитетов 4 созыва
                  </a>
                  <h1 className="no-gold-underline">{committeeName}</h1>
                  <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 32 }}>
                    <div>
                      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 16 }}>Повестки</h2>
                      <ul className="section-list" style={{ paddingLeft: 24, margin: 0 }}>
                        {reportYears4.map((y) => renderYearDocs(agendas, y))}
                      </ul>
                    </div>
                    <div>
                      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 16 }}>Отчеты</h2>
                      <ul className="section-list" style={{ paddingLeft: 24, margin: 0 }}>
                        {reportYears4.map((y) => renderYearDocs(reports, y))}
                      </ul>
                    </div>
                  </div>
                </div>
                <SideNav title="Разделы" loadPages={true} autoSection={true} />
              </div>
            </div>
          </section>
        );
      }

      return (
        <section className="section section-page">
          <div className="container">
            <div className="page-grid">
              <div className="page-grid__main">
                <a
                  href={`/section?title=${encodeURIComponent("Отчеты комитетов")}`}
                  className="link"
                  style={{ display: "inline-block", marginBottom: 16 }}
                >
                  ← Отчеты комитетов
                </a>
                <h1 className="no-gold-underline">Отчеты о деят��льности комитетов 4 ��озыва</h1>
                <ul className="section-list" style={{ marginTop: 20, paddingLeft: 24 }}>
                  {committees4.map((name, i) => (
                    <li key={i} style={{ marginBottom: 10 }}>
                      <a href={`${baseHref}&committee=${i}`} className="link">
                        {name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <SideNav title="Разделы" loadPages={true} autoSection={true} />
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
              {/* Три зоны: комитеты слева, два комитета по центру, комиссии справа */}
              <div className="org__row org__row--cols4">
                <div className="org__col" id="focus-committees">
                  <a
                    className="org__item org__item--blue"
                    href={"/section?title=" + encodeURIComponent("Комитеты")}
                  >
                    Комитеты Верховного Хурала (парламента) Республики Тыва
                  </a>
                  {(() => {
                    const fromContext = committeesDeduped;
                    const byId = new Map(fromContext.map((c) => [String(c?.id ?? ""), c]));
                    const seen = new Set();
                    const result = [];
                    for (const def of DEFAULT_STRUCTURE_COMMITTEES) {
                      const c = byId.get(def.id) || def;
                      const id = String(c?.id ?? "");
                      if (id && !seen.has(id)) {
                        seen.add(id);
                        result.push(c);
                      }
                    }
                    for (const c of fromContext) {
                      const id = String(c?.id ?? "");
                      if (id && !seen.has(id)) {
                        seen.add(id);
                        result.push(c);
                      }
                    }
                    // В первой колонке убираем дубли по названию (одно имя — одна карточка)
                    const byTitleKey = new Map();
                    for (const c of result) {
                      const key = normalizeCommitteeTitleKey(getCommitteeTitle(c));
                      if (!key) continue;
                      const existing = byTitleKey.get(key);
                      if (!existing || committeeRichness(c) > committeeRichness(existing)) {
                        byTitleKey.set(key, c);
                      }
                    }
                    const dedupedResult = Array.from(byTitleKey.values());
                    return dedupedResult.map((c) => {
                      const title = getCommitteeTitle(c);
                      return (
                        <a
                          key={c.id}
                          className="org__item org__item--green"
                          href={`/committee?id=${encodeURIComponent(c.id)}`}
                        >
                          {title}
                        </a>
                      );
                    });
                  })()}
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
                  {(Array.isArray(commissions) ? commissions : []).map((item) => (
                    <a
                      key={item.id}
                      className="org__item org__item--blue"
                      href={`/commission?id=${item.id}`}
                    >
                      {typeof item.name === "string" && /<[^>]+>/.test(item.name)
                        ? item.name.replace(/<[^>]*>/g, "").trim() || item.name
                        : item.name}
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
          <SideNav title="Разделы" loadPages={true} autoSection={true} />
        </div>
      </div>
    </section>
  );
}
