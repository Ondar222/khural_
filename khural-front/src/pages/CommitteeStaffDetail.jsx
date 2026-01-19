import React from "react";
import { useHashRoute } from "../Router.jsx";
import { useData } from "../context/DataContext.jsx";
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

export default function CommitteeStaffDetail() {
  const { route, navigate } = useHashRoute();
  const { committees: committeesFromContext, loading, errors, reload } = useData();
  const staffId = route.params?.id;
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

  // Get committee ID from query string or hash
  const committeeId = React.useMemo(() => {
    const search = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const hashMatch = hash.match(/[?&]committee=([^&]+)/);
    return search.get("committee") || (hashMatch ? decodeURIComponent(hashMatch[1]) : null);
  }, []);
  const [staff, setStaff] = React.useState(null);
  const [committee, setCommittee] = React.useState(null);

  React.useEffect(() => {
    if (!committeeId || !committees) return;
    const c = (committees || []).find((x) => String(x?.id ?? "") === String(committeeId));
    if (c) {
      setCommittee(c);
      const staffList = Array.isArray(c.staff) ? c.staff : [];
      const s = staffList.find((s) => String(s.id || "") === String(staffId || ""));
      if (s) {
        setStaff(s);
      }
    }
  }, [committeeId, staffId, committees]);

  if (loading?.committees) {
    return (
      <section className="section">
        <div className="container">
          <DataState loading={true} />
        </div>
      </section>
    );
  }

  if (errors?.committees || !staff || !committee) {
    return (
      <section className="section">
        <div className="container">
          <DataState
            error={errors?.committees || "Сотрудник не найден"}
            onRetry={reload}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <a
            href={`/committee?id=${encodeURIComponent(committee.id)}#staff`}
            className="btn btn-back"
            style={{ marginBottom: 24, display: "inline-block" }}
          >
            ← К списку сотрудников
          </a>
          <h1>{staff.name || "Сотрудник комитета"}</h1>
          <div style={{ marginTop: 24 }}>
            <div className="person-card person-card--committee">
              {staff.photo ? (
                <img
                  className="person-card__photo"
                  src={normalizeFilesUrl(staff.photo)}
                  alt=""
                  loading="lazy"
                />
              ) : (
                <div className="person-card__photo" aria-hidden="true" />
              )}
              <div className="person-card__body">
                <div className="person-card__name">{staff.name}</div>
                {staff.role && (
                  <div className="person-card__role">{staff.role}</div>
                )}
                <ul className="person-card__meta">
                  {staff.phone && <li>📞 {staff.phone}</li>}
                  {staff.email && <li>✉️ {staff.email}</li>}
                  {staff.address && <li>📍 {staff.address}</li>}
                  {staff.department && <li>🏛️ {staff.department}</li>}
                </ul>
                {staff.biography && (
                  <div style={{ marginTop: 20, lineHeight: 1.6 }}>
                    <h3 style={{ marginBottom: 12 }}>Биография</h3>
                    <div>{staff.biography}</div>
                  </div>
                )}
                {staff.education && (
                  <div style={{ marginTop: 20, lineHeight: 1.6 }}>
                    <h3 style={{ marginBottom: 12 }}>Образование</h3>
                    <div>{staff.education}</div>
                  </div>
                )}
                {staff.experience && (
                  <div style={{ marginTop: 20, lineHeight: 1.6 }}>
                    <h3 style={{ marginBottom: 12 }}>Опыт работы</h3>
                    <div>{staff.experience}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

