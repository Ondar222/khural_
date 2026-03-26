import React from "react";
import { apiFetch } from "../api/client.js";

export default function DebugPersons() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch("/persons", { auth: false });
        setData(Array.isArray(res) ? res : []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Загрузка...</div>;
  if (error) return <div style={{ padding: 20, color: "red" }}>Ошибка: {error}</div>;
  if (!data || data.length === 0) return <div style={{ padding: 20 }}>Нет данных</div>;

  // Показываем первую персону и все её поля
  const first = data[0];
  const photoFields = Object.keys(first).filter(k => 
    k.toLowerCase().includes("photo") || 
    k.toLowerCase().includes("image") || 
    k.toLowerCase().includes("picture") ||
    k.toLowerCase().includes("avatar")
  );

  return (
    <div style={{ padding: 20, fontFamily: "monospace", fontSize: 12 }}>
      <h1>Debug: /persons API</h1>
      <p>Всего персон: {data.length}</p>
      
      <h2>Первая персона: {first.fullName || first.full_name || first.name}</h2>
      
      <h3>Поля связанные с фото ({photoFields.length}):</h3>
      <ul>
        {photoFields.map(key => (
          <li key={key}>
            <strong>{key}:</strong>{" "}
            {typeof first[key] === "object" 
              ? JSON.stringify(first[key], null, 2) 
              : String(first[key] ?? "null")}
          </li>
        ))}
      </ul>

      <h3>Все поля персоны:</h3>
      <pre style={{ background: "#f5f5f5", padding: 10, overflow: "auto" }}>
        {JSON.stringify(first, null, 2)}
      </pre>

      <h3>Список всех персон (кратко):</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
        <thead>
          <tr style={{ background: "#eee" }}>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>ID</th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Имя</th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Фото поля</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((p, i) => (
            <tr key={p.id ?? i}>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>{p.id}</td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                {p.fullName || p.full_name || p.name}
              </td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                {p.IE_PREVIEW_PICTURE ? "IE_PREVIEW_PICTURE ✓" : ""}
                {p.previewPictureUrl ? "previewPictureUrl ✓" : ""}
                {p.photo ? "photo ✓" : ""}
                {p.image?.link ? "image.link ✓" : ""}
                {p.photoUrl ? "photoUrl ✓" : ""}
                {!p.IE_PREVIEW_PICTURE && !p.previewPictureUrl && !p.photo && !p.image?.link && !p.photoUrl ? "нет фото" : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Показано {Math.min(10, data.length)} из {data.length}</p>
    </div>
  );
}
