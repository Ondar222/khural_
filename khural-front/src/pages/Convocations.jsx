import React from "react";
import { useData } from "../context/DataContext.jsx";
import SideNav from "../components/SideNav.jsx";
import DataState from "../components/DataState.jsx";
import { ConvocationsApi, CommitteesApi } from "../api/client.js";
import {
  COMMITTEES_OVERRIDES_EVENT_NAME,
  COMMITTEES_OVERRIDES_STORAGE_KEY,
  readCommitteesOverrides,
} from "../utils/committeesOverrides.js";
import {
  CONVOCATIONS_OVERRIDES_EVENT_NAME,
  CONVOCATIONS_OVERRIDES_STORAGE_KEY,
  readConvocationsOverrides,
} from "../utils/convocationsOverrides.js";
import { normalizeBool } from "../utils/bool.js";

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
    const key = convocationKey(it);
    if (!key) return;
    if (deletedIds.has(String(it?.id ?? ""))) return;
    const override = updatedById[String(it?.id ?? "")] || updatedById[key];
    const merged = override ? { ...(typeof it === "string" ? { name: it } : it), ...override } : it;
    out.push(merged);
    seen.add(key);
  };

  for (const it of Array.isArray(base) ? base : []) pushOne(it);
  for (const it of created) {
    const key = convocationKey(it);
    if (!key || seen.has(key)) continue;
    pushOne(it);
  }

  // Also add updates even if base list is only strings (no numeric ids),
  // so we keep full data (id/description/isActive) and can match committees by convocationId.
  for (const patch of Object.values(updatedById || {})) {
    if (!patch || typeof patch !== "object") continue;
    const idStr = String(patch?.id ?? "").trim();
    if (idStr && deletedIds.has(idStr)) continue;
    const key = convocationKey(patch);
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

  // Also add updated snapshots even if base list doesn't have them (API unavailable).
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

function toConvocationIdStrFromCommittee(c) {
  const v = c?.convocation?.id ?? c?.convocationId ?? null;
  if (v === null || v === undefined || v === "") return "";
  return String(v);
}

function convocationMatchKeys(c) {
  const keys = new Set();
  if (!c) return [];
  const id = String(c?.id ?? "").trim();
  if (id) keys.add(id);
  const token = normalizeConvocationToken(c?.name || c?.number || c?.id || "");
  if (token) keys.add(token);
  return Array.from(keys);
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

export default function Convocations() {
  const { loading: ctxLoading, errors: ctxErrors, reload, committees: committeesFromContext } = useData();
  const [tab, setTab] = React.useState("active"); // active | archive
  const [apiConvocations, setApiConvocations] = React.useState(null);
  const [apiCommittees, setApiCommittees] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [overridesSeq, setOverridesSeq] = React.useState(0);
  const [convOverridesSeq, setConvOverridesSeq] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setBusy(true);
      try {
        const list = await ConvocationsApi.list().catch(() => null);
        if (!alive) return;
        setApiConvocations(list);
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

  React.useEffect(() => {
    const bump = () => setConvOverridesSeq((x) => x + 1);
    const onStorage = (e) => {
      if (e?.key === CONVOCATIONS_OVERRIDES_STORAGE_KEY) bump();
    };
    window.addEventListener(CONVOCATIONS_OVERRIDES_EVENT_NAME, bump);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CONVOCATIONS_OVERRIDES_EVENT_NAME, bump);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const convocations = React.useMemo(() => {
    const raw = apiConvocations;
    const base =
      Array.isArray(raw) && raw.length
        ? raw
            // Some backends return strings (from /all), some return objects.
            .map((x) => {
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
            })
            .filter(Boolean)
        : [];
    return mergeConvocationsWithOverridesByKey(base, readConvocationsOverrides());
  }, [apiConvocations, convOverridesSeq]);

  const committees = React.useMemo(() => {
    const base = Array.isArray(apiCommittees) ? apiCommittees : committeesFromContext;
    return mergeCommitteesWithOverrides(base, readCommitteesOverrides());
  }, [apiCommittees, committeesFromContext, overridesSeq]);

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
    // Prefer convocations resolved from committees first (they include numeric ids),
    // then merge API list and local overrides.
    const base = [
      ...(Array.isArray(convocationsFromCommittees) ? convocationsFromCommittees : []),
      ...(Array.isArray(convocations) ? convocations : []),
    ];
    return mergeConvocationsWithOverridesByKey(base, readConvocationsOverrides());
  }, [convocationsFromCommittees, convocations, convOverridesSeq]);

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

