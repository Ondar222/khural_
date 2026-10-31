import React from "react";
import { useData } from "../context/DataContext.jsx";
import SideNav from "../components/SideNav.jsx";
import DataState from "../components/DataState.jsx";
import { ConvocationsApi, CommitteesApi } from "../api/client.js";
import { normalizeBool } from "../utils/bool.js";
import {
  getConvocationNumber,
  mergeConvocationsPreferApi,
} from "../utils/convocationIdentity.js";

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

function convocationKey(c) {
  if (!c) return "";
  const ordinal = getConvocationNumber(c);
  if (ordinal) return ordinal;
  if (typeof c === "string") return normalizeConvocationToken(c) || String(c).trim();
  const name = String(c?.name || c?.number || "").trim();
  const token = normalizeConvocationToken(name);
  if (token) return token;
  const id = c?.id ?? "";
  return String(id).trim();
}

function toConvocationIdStrFromCommittee(c) {
  const v = c?.convocationComittees?.id ?? c?.convocation?.id ?? c?.convocationId ?? null;
  if (v === null || v === undefined || v === "") return "";
  return String(v);
}

function convocationMatchKeys(c) {
  const keys = new Set();
  if (!c) return [];
  const id = String(c?.id ?? "").trim();
  if (id) keys.add(id);
  const ordinal = getConvocationNumber(c);
  if (ordinal) keys.add(ordinal);
  const token = normalizeConvocationToken(c?.name || c?.number || c?.id || "");
  if (token) keys.add(token);
  return Array.from(keys);
}

function committeeConvocationMatchKeys(c) {
  const keys = new Set();
  if (!c) return [];
  const idStr = toConvocationIdStrFromCommittee(c);
  if (idStr) keys.add(idStr);
  const relation = c?.convocationComittees ?? c?.convocation;
  const ordinal = getConvocationNumber(relation ?? idStr);
  if (ordinal) keys.add(ordinal);
  const token = normalizeConvocationToken(relation?.name || relation?.number || "");
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
  const chairman = members.find(
    (m) => m && typeof m.role === "string" && m.role.toLowerCase().includes("председатель")
  );
  if (!chairman) return "";
  if (typeof chairman.name === "string" && chairman.name.trim()) return chairman.name.trim();
  const pn = chairman?.person?.fullName || chairman?.person?.name;
  return typeof pn === "string" ? pn.trim() : "";
}

function isCommitteeActive(c) {
  // If backend doesn't provide isActive, show it.
  return normalizeBool(c?.isActive, true) !== false;
}

function getDeputyConvocationTokens(d) {
  const out = [];
  const pushToken = (raw) => {
    const token = normalizeConvocationToken(raw);
    if (token) out.push(token);
  };
  if (Array.isArray(d?.convocations)) {
    d.convocations.forEach((c) => {
      if (typeof c === "string") pushToken(c);
      else if (c && typeof c === "object") pushToken(c?.name || c?.title || c?.label || c?.id || "");
    });
  }
  if (d?.convocation) pushToken(d.convocation);
  if (d?.convocationNumber) pushToken(d.convocationNumber);
  if (d?.convocation_number) pushToken(d.convocation_number);
  return Array.from(new Set(out));
}

export default function Convocations() {
  const {
    loading: ctxLoading,
    errors: ctxErrors,
    reload,
    committees: committeesFromContext,
    deputies,
  } = useData();
  const [tab, setTab] = React.useState("active"); // active | archive
  const [apiConvocations, setApiConvocations] = React.useState(null);
  const [staticConvocations, setStaticConvocations] = React.useState([]);
  const [apiCommittees, setApiCommittees] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [expandedByKey, setExpandedByKey] = React.useState({});

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setBusy(true);
      try {
        const [list, staticList] = await Promise.all([
          ConvocationsApi.list({ activeOnly: false }).catch(() => null),
          fetch("/data/convocations.json").then((response) =>
            response.ok ? response.json() : []
          ),
        ]);
        if (!alive) return;
        setApiConvocations(list);
        setStaticConvocations(Array.isArray(staticList) ? staticList : []);
      } catch (error) {
        console.error("[Convocations] Не удалось загрузить список созывов:", error);
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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

  const convocations = React.useMemo(
    () => mergeConvocationsPreferApi(apiConvocations, staticConvocations),
    [apiConvocations, staticConvocations]
  );

  const committees = React.useMemo(() => {
    return Array.isArray(apiCommittees) && apiCommittees.length
      ? apiCommittees
      : committeesFromContext;
  }, [apiCommittees, committeesFromContext]);

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

  const convocationsMerged = React.useMemo(() => {
    return mergeConvocationsPreferApi(convocations, convocationsFromCommittees);
  }, [convocationsFromCommittees, convocations]);

  const activeConvocations = React.useMemo(
    () => convocationsMerged.filter((c) => normalizeBool(c?.isActive, true) !== false),
    [convocationsMerged]
  );
  const archivedConvocations = React.useMemo(
    () => convocationsMerged.filter((c) => normalizeBool(c?.isActive, true) === false),
    [convocationsMerged]
  );

  const byId = React.useMemo(() => {
    const m = new Map();
    for (const c of convocationsMerged) {
      const id = String(c?.id ?? "");
      if (id) m.set(id, c);
    }
    return m;
  }, [convocationsMerged]);

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
  }, [committees]);

  const deputiesByConvocationKey = React.useMemo(() => {
    const map = new Map();
    const list = Array.isArray(deputies) ? deputies : [];
    for (const d of list) {
      const tokens = getDeputyConvocationTokens(d);
      if (!tokens.length) continue;
      for (const key of tokens) {
        const arr = map.get(key) || [];
        arr.push(d);
        map.set(key, arr);
      }
    }
    return map;
  }, [deputies]);

  const shownConvocations = tab === "archive" ? archivedConvocations : activeConvocations;

  const pageLoading = busy || (Boolean(ctxLoading?.committees) && (!committees || committees.length === 0));
  const pageError = ctxErrors?.committees || ctxErrors?.structure || null;

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div className="page-grid__main">
            <h1>Созывы</h1>
            <div style={{ marginTop: -6, marginBottom: 14, color: "var(--muted, #6b7280)" }}>
              {tab === "archive" ? "Прошлые созывы (архив)" : "Действующие созывы"}
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn"
                onClick={() => setTab("active")}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(17, 24, 39, 0.12)",
                  background: tab === "active" ? "rgba(0, 51, 102, 0.08)" : "#fff",
                  fontWeight: 700,
                }}
              >
                Действующие
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setTab("archive")}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(17, 24, 39, 0.12)",
                  background: tab === "archive" ? "rgba(0, 51, 102, 0.08)" : "#fff",
                  fontWeight: 700,
                }}
              >
                Архив созывов
              </button>
            </div>

            <DataState
              loading={pageLoading}
              error={pageError}
              onRetry={reload}
              empty={!pageLoading && (!shownConvocations || shownConvocations.length === 0)}
              emptyDescription={
                tab === "archive"
                  ? "Архивных созывов пока нет"
                  : "Действующих созывов пока нет"
              }
            >
              <div style={{ display: "grid", gap: 14 }}>
                {(Array.isArray(shownConvocations) ? shownConvocations : []).map((c) => {
                  const idStr = String(c?.id ?? "");
                  const title = formatConvocationLabel(c);
                  const keys = convocationMatchKeys(c);
                  const list = keys.flatMap((k) => committeesByConvocationKey.get(k) || []);
                  const uniq = new Map();
                  for (const it of list) {
                    const cid = String(it?.id ?? "");
                    if (!cid) continue;
                    if (!uniq.has(cid)) uniq.set(cid, it);
                  }
                  const committeesList = Array.from(uniq.values());
                  const token = normalizeConvocationToken(c?.name || c?.number || c?.id || "");
                  const deputiesHref = token ? `/deputies?convocation=${encodeURIComponent(token)}` : "/deputies";
                  const deputyKeys = Array.from(new Set([token, ...keys].filter(Boolean)));
                  const deputiesRaw = deputyKeys.flatMap((k) => deputiesByConvocationKey.get(k) || []);
                  const deputyUniq = new Map();
                  for (const d of deputiesRaw) {
                    const did = String(d?.id ?? "").trim();
                    const nameKey = String(d?.name || d?.fullName || "").trim();
                    const key = did || nameKey;
                    if (!key || deputyUniq.has(key)) continue;
                    deputyUniq.set(key, d);
                  }
                  const deputiesList = Array.from(deputyUniq.values()).sort((a, b) =>
                    String(a?.name || a?.fullName || "").localeCompare(
                      String(b?.name || b?.fullName || ""),
                      "ru"
                    )
                  );
                  const expandKey = token || idStr || title;
                  const isExpanded = Boolean(expandedByKey[expandKey]);

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
                        <a className="link" href={deputiesHref} style={{ whiteSpace: "nowrap" }}>
                          Депутаты →
                        </a>
                      </div>
                      {c?.description ? (
                        <div style={{ marginTop: 8, color: "var(--muted, #6b7280)", lineHeight: 1.45 }}>
                          {stripTags(String(c.description))}
                        </div>
                      ) : null}
                      {c?.stats ? (
                        <div style={{ marginTop: 8, display: "flex", gap: 16, flexWrap: "wrap", fontSize: 14 }}>
                          <div>
                            <span style={{ fontWeight: 600 }}>Депутатов:</span> {c.stats.deputies}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600 }}>Законов:</span> {c.stats.laws}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600 }}>Постановлений:</span> {c.stats.resolutions}
                          </div>
                        </div>
                      ) : null}

                      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontWeight: 700 }}>
                          Депутаты созыва{deputiesList.length ? ` (${deputiesList.length})` : ""}
                        </div>
                        {deputiesList.length ? (
                          <button
                            type="button"
                            className="btn"
                            style={{ padding: "6px 10px", borderRadius: 10, fontSize: 12 }}
                            onClick={() =>
                              setExpandedByKey((prev) => ({ ...prev, [expandKey]: !prev[expandKey] }))
                            }
                          >
                            {isExpanded ? "Скрыть список" : "Показать список"}
                          </button>
                        ) : null}
                      </div>
                      {deputiesList.length ? (
                        isExpanded ? (
                          <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                            {deputiesList.map((d) => {
                              const did = String(d?.id ?? "").trim();
                              const name = String(d?.name || d?.fullName || "").trim() || "Депутат";
                              const link = did ? `/government?type=dep&id=${encodeURIComponent(did)}` : null;
                              return link ? (
                                <a key={did || name} className="link" href={link} style={{ fontWeight: 600 }}>
                                  {name}
                                </a>
                              ) : (
                                <div key={name} style={{ fontWeight: 600 }}>
                                  {name}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ marginTop: 8, color: "var(--muted, #6b7280)" }}>
                            Список скрыт.
                          </div>
                        )
                      ) : (
                        <div style={{ marginTop: 8, color: "var(--muted, #6b7280)" }}>
                          Депутаты для этого созыва пока не указаны.
                        </div>
                      )}

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

                {/* Committees without convocation */}
                {tab === "active" && (committeesByConvocationKey.get("__none__") || []).length ? (
                  <div
                    className="tile"
                    style={{
                      borderRadius: 18,
                      padding: 16,
                      border: "1px solid rgba(17, 24, 39, 0.10)",
                      background: "#fff",
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 18 }}>Без созыва</div>
                    <div style={{ marginTop: 8, color: "var(--muted, #6b7280)" }}>
                      Эти комитеты пока не привязаны к созыву.
                    </div>
                    <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                      {(committeesByConvocationKey.get("__none__") || []).map((k) => {
                        const cid = String(k?.id ?? "");
                        const name = String(k?.name || k?.title || "").trim() || "Комитет";
                        return (
                          <a
                            key={cid || name}
                            className="tile link"
                            href={`/committee?id=${encodeURIComponent(cid)}`}
                            style={{ padding: 12, borderRadius: 14 }}
                          >
                            {name}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </DataState>
          </div>
          <SideNav />
        </div>
      </div>
    </section>
  );
}
