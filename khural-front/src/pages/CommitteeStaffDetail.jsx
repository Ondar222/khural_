import React from "react";
import { useHashRoute } from "../Router.jsx";
import { useData } from "../context/DataContext.jsx";
import DataState from "../components/DataState.jsx";
import { normalizeFilesUrl } from "../utils/filesUrl.js";

export default function CommitteeStaffDetail() {
  const { route, navigate } = useHashRoute();
  const { committees, loading, errors, reload } = useData();
  const staffId = route.params?.id;
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
    const c = (committees || []).find((x) => x.id === committeeId);
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

