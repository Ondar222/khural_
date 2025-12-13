import React from "react";
import { useData } from "../context/DataContext.jsx";

export default function Committee() {
  const { committees, deputies } = useData();
  const [committee, setCommittee] = React.useState(null);

  React.useEffect(() => {
    const h = window.location.hash;
    const sp = new URLSearchParams(h.split("?")[1]);
    const id = sp.get("id") || "agro";
    const c = (committees || []).find((x) => x.id === id);
    setCommittee(c || null);
  }, [committees]);

  React.useEffect(() => {
    const onHash = () => {
      const h = window.location.hash;
      const sp = new URLSearchParams(h.split("?")[1]);
      const id = sp.get("id") || "agro";
      const c = (committees || []).find((x) => x.id === id);
      setCommittee(c || null);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [committees]);

  if (!committee) {
    return (
      <section className="section">
        <div className="container">
          <h1>Комитет</h1>
          <p>Комитет не найден.</p>
        </div>
      </section>
    );
  }

  const resolveMember = (m) => {
    if (!m) return null;
    // Try resolve by id first, then by full name (case-insensitive)
    let d = m.id ? (deputies || []).find((x) => x.id === m.id) : null;
    if (!d && m.name) {
      const target = m.name.trim().toLowerCase();
      d = (deputies || []).find(
        (x) => (x.name || "").trim().toLowerCase() === target
      );
    }
    const PLACEHOLDER =
      "https://www.shutterstock.com/image-vector/default-avatar-profile-icon-vector-600nw-2027875490.jpg";
    return {
      id: m.id || d?.id || m.name,
      name: d?.name || m.name,
      role: m.role,
      photo: d?.photo || m.photo || PLACEHOLDER,
      phone: d?.contacts?.phone || m.phone,
      email: d?.contacts?.email || m.email,
      address: d?.address || m.address,
    };
  };

  const members = (committee.members || []).map(resolveMember).filter(Boolean);
  const leader = members[0];
  const rest = members.slice(1);
  const staff = Array.isArray(committee.staff) ? committee.staff : [];

  return (
    <section className="section">
      <div className="container">
        <h1>{committee.title}</h1>
        {leader ? (
          <>
            <h2 style={{ marginTop: 12 }}>Председатель</h2>
            <div className="orgv2__chain" style={{ marginTop: 8 }}>
              <div className="orgv2__line" />
              <div className="person-card person-card--committee">
                <img
                  className="person-card__photo"
                  src={leader.photo}
                  alt=""
                  loading="lazy"
                />
                <div className="person-card__body">
                  <div className="person-card__name">{leader.name}</div>
                  <div className="person-card__role">{leader.role}</div>
                  <ul className="person-card__meta">
                    {leader.phone && <li>+ {leader.phone}</li>}
                    {leader.email && <li>{leader.email}</li>}
                    {leader.address && <li>{leader.address}</li>}
                  </ul>
                  <a
                    className="btn btn--primary btn--compact"
                    href={
                      leader.id ? `#/government?type=dep&id=${leader.id}` : "#"
                    }
                  >
                    Подробнее
                  </a>
                </div>
              </div>
            </div>
          </>
        ) : null}
        {rest.length ? (
          <>
            <h2 style={{ marginTop: 16 }}>Члены Комитета</h2>
            <div className="orgv2__chain" style={{ marginTop: 8 }}>
              <div className="orgv2__line" />
              {rest.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="person-card person-card--committee"
                >
                  <img
                    className="person-card__photo"
                    src={p.photo}
                    alt=""
                    loading="lazy"
                  />
                  <div className="person-card__body">
                    <div className="person-card__name">{p.name}</div>
                    <div className="person-card__role">{p.role}</div>
                    <ul className="person-card__meta">
                      {p.phone && <li>+ {p.phone}</li>}
                      {p.email && <li>{p.email}</li>}
                      {p.address && <li>{p.address}</li>}
                    </ul>
                    <a
                      className="btn btn--primary btn--compact"
                      href={p.id ? `#/government?type=dep&id=${p.id}` : "#"}
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
    </section>
  );
}
