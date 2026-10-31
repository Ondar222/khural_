import React from "react";
import { useHashRoute } from "../Router.jsx";
import { useData } from "../context/DataContext.jsx";
import DataState from "../components/DataState.jsx";
import { normalizeFilesUrl } from "../utils/filesUrl.js";
import { MailIcon, PhoneIcon, PinIcon, BuildingIcon } from "../components/icons/LinearIcons.jsx";

export default function CommitteeStaffDetail() {
  const { route, navigate } = useHashRoute();
  const { committees: committeesFromContext, loading, errors, reload } = useData();
  const staffId = route.params?.id;
  const committees = committeesFromContext;

  // Get committee ID from query string or hash
  const committeeId = React.useMemo(() => {
    const search = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const hashMatch = hash.match(/[?&]committee=([^&]+)/);
    return search.get("committee") || (hashMatch ? decodeURIComponent(hashMatch[1]) : null);
  }, []);
  const [staff, setStaff] = React.useState(null);
  const [committee, setCommittee] = React.useState(null);

  // Stabilize committees length to prevent infinite loops
  const committeesLength = Array.isArray(committees) ? committees.length : 0;
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
  }, [committeeId, staffId, committeesLength, committees]);

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
                  onError={(e) => {
                    const img = e.target;
                    const currentSrc = img.src;
                    
                    if (/^https?:\/\/khural\.(?:yurta|rtyva)\.site/i.test(currentSrc) && !img.dataset.proxyTried) {
                      img.dataset.proxyTried = "true";
                      img.src = currentSrc.replace(/^https?:\/\/khural\.(?:yurta|rtyva)\.site/i, "");
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
                <div className="person-card__name">{staff.name}</div>
                {staff.role && (
                  <div className="person-card__role">{staff.role}</div>
                )}
                <ul className="person-card__meta">
                  {staff.phone && <li><PhoneIcon size={14} /> {staff.phone}</li>}
                  {staff.email && <li><MailIcon size={14} /> {staff.email}</li>}
                  {staff.address && <li><PinIcon size={14} /> {staff.address}</li>}
                  {staff.department && <li><BuildingIcon size={14} /> {staff.department}</li>}
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
