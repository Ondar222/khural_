import React from "react";
import { App, Button, Input } from "antd";
import { useData } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useHashRoute } from "../Router.jsx";
import {
  API_BASE_URL,
  NewsApi,
  PersonsApi,
  DocumentsApi,
  EventsApi,
} from "../api/client.js";

import AdminShell from "./admin/AdminShell.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";
import AdminNews from "./admin/AdminNews.jsx";
import AdminDeputies from "./admin/AdminDeputies.jsx";
import AdminDocuments from "./admin/AdminDocuments.jsx";
import AdminEvents from "./admin/AdminEvents.jsx";
import AdminEnvDocs from "./admin/AdminEnvDocs.jsx";
import { readAdminTheme, writeAdminTheme } from "./admin/adminTheme.js";

function toNewsFallback(items) {
  return (items || []).map((n) => ({
    id: n.id || n._id || Math.random().toString(36).slice(2),
    createdAt: n.date || n.createdAt || new Date().toISOString(),
    images: n.image ? [{ file: { id: "local", link: n.image } }] : [],
    content: [
      {
        lang: "ru",
        title: n.title || "",
        description: n.excerpt || "",
      },
    ],
  }));
}

function toPersonsFallback(items) {
  return (items || []).map((p) => ({
    id: p.id || p._id || Math.random().toString(36).slice(2),
    fullName: p.fullName || p.name || "",
    electoralDistrict: p.electoralDistrict || p.district || "",
    faction: p.faction || "",
    phoneNumber: p.phoneNumber || p?.contacts?.phone || "",
    email: p.email || p?.contacts?.email || "",
    description: p.description || "",
    image: p.image || (p.photo ? { link: p.photo } : null),
  }));
}

function toDocumentsFallback(items) {
  return (items || []).map((d) => ({
    id: d.id || d._id || Math.random().toString(36).slice(2),
    title: d.title || d.name || "",
    description: d.description || "",
    type: d.type || d.category || "other",
    file: d.file || (d.url ? { link: d.url } : null),
  }));
}

function toEventRow(e) {
  const start = e?.startDate ? new Date(Number(e.startDate)) : null;
  const date = start && !isNaN(start.getTime()) ? start.toISOString().slice(0, 10) : (e?.date || "");
  const time = start && !isNaN(start.getTime()) ? start.toISOString().slice(11, 16) : (e?.time || "");
  return {
    id: e?.id ?? Math.random().toString(36).slice(2),
    date,
    time,
    place: e?.location || e?.place || "",
    title: e?.title || "",
    desc: e?.description || e?.desc || "",
    __raw: e,
  };
}

function toCalendarDto(values) {
  const date = String(values?.date || "");
  const time = String(values?.time || "00:00");
  const [hh, mm] = time.split(":").map((x) => parseInt(x, 10));
  const dt = new Date(`${date}T00:00:00.000Z`);
  if (!isNaN(hh)) dt.setUTCHours(hh);
  if (!isNaN(mm)) dt.setUTCMinutes(mm);
  return {
    title: values?.title || "",
    description: values?.desc || "",
    location: values?.place || "",
    startDate: dt.getTime(),
    isPublic: true,
  };
}

function mapDocType(type) {
  // UI legacy -> backend enum
  const t = String(type || "").toLowerCase();
  if (t === "laws") return "law";
  if (t === "resolutions") return "resolution";
  if (t === "bills") return "decision";
  if (t === "initiatives") return "order";
  if (t === "civic") return "other";
  if (t === "constitution") return "other";
  return type || "other";
}

export default function Admin() {
  const { message } = App.useApp();
  const data = useData();
  const { isAuthenticated, user, logout, login } = useAuth();
  const { route } = useHashRoute();

  const apiBase = API_BASE_URL || "";

  const base = (route || "/").split("?")[0];
  const sub = base.replace(/^\/admin\/?/, "") || "dashboard";

  const [themeMode, setThemeMode] = React.useState(() => readAdminTheme());

  const [busy, setBusy] = React.useState(false);
  const [loginBusy, setLoginBusy] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [news, setNews] = React.useState([]);
  const [persons, setPersons] = React.useState([]);
  const [documents, setDocuments] = React.useState([]);
  const [events, setEvents] = React.useState([]);

  const canWrite = isAuthenticated;

  React.useEffect(() => {
    document.body.classList.add("admin-mode");
    document.body.dataset.adminTheme = themeMode;
    return () => {
      document.body.classList.remove("admin-mode");
      delete document.body.dataset.adminTheme;
    };
  }, [themeMode]);

  React.useEffect(() => {
    (async () => {
      const [apiNews, apiPersons, apiDocs] = await Promise.all([
        NewsApi.list().catch(() => null),
        PersonsApi.list().catch(() => null),
        DocumentsApi.list().catch(() => null),
      ]);
      setNews(Array.isArray(apiNews) ? apiNews : toNewsFallback(data.news));
      setPersons(
        Array.isArray(apiPersons) ? apiPersons : toPersonsFallback(data.deputies)
      );
      setDocuments(
        Array.isArray(apiDocs) ? apiDocs : toDocumentsFallback(data.documents)
      );
      const apiEvents = await EventsApi.list().catch(() => null);
      setEvents(
        Array.isArray(apiEvents)
          ? apiEvents.map(toEventRow)
          : (data.events || [])
      );
    })();
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTheme = () => {
    const next = themeMode === "light" ? "dark" : "light";
    setThemeMode(next);
    writeAdminTheme(next);
  };

  const reload = async () => {
    const [apiNews, apiPersons, apiDocs] = await Promise.all([
      NewsApi.list().catch(() => null),
      PersonsApi.list().catch(() => null),
      DocumentsApi.list().catch(() => null),
    ]);
    if (Array.isArray(apiNews)) setNews(apiNews);
    if (Array.isArray(apiPersons)) setPersons(apiPersons);
    if (Array.isArray(apiDocs)) setDocuments(apiDocs);
    const apiEvents = await EventsApi.list().catch(() => null);
    if (Array.isArray(apiEvents)) setEvents(apiEvents.map(toEventRow));
  };

  const createNews = async ({ titleRu, descRu, titleTu, descTu, imageFile }) => {
    setBusy(true);
    try {
      const created = await NewsApi.create({
        content: [
          { lang: "ru", title: titleRu, description: descRu },
          ...(titleTu || descTu
            ? [{ lang: "tu", title: titleTu || "", description: descTu || "" }]
            : []),
        ],
      });
      if (created?.id && imageFile) {
        await NewsApi.uploadMedia(created.id, imageFile);
      }
      message.success("Новость создана");
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const updateNews = async (id, { titleRu, descRu, titleTu, descTu, imageFile }) => {
    setBusy(true);
    try {
      await NewsApi.patch(id, {
        content: [
          { lang: "ru", title: titleRu, description: descRu },
          ...(titleTu || descTu
            ? [{ lang: "tu", title: titleTu || "", description: descTu || "" }]
            : []),
        ],
      });
      if (imageFile) await NewsApi.uploadMedia(id, imageFile);
      message.success("Новость обновлена");
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const deleteNews = async (id) => {
    setBusy(true);
    try {
      await NewsApi.remove(id);
      message.success("Новость удалена");
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const createDeputy = async (payload) => {
    setBusy(true);
    try {
      const { imageFile, ...body } = payload || {};
      const created = await PersonsApi.create(body);
      if (created?.id && imageFile) {
        await PersonsApi.uploadMedia(created.id, imageFile);
      }
      message.success("Депутат создан");
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const updateDeputy = async (id, payload) => {
    setBusy(true);
    try {
      const { imageFile, ...body } = payload || {};
      await PersonsApi.patch(id, body);
      if (imageFile) await PersonsApi.uploadMedia(id, imageFile);
      message.success("Депутат обновлён");
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const deleteDeputy = async (id) => {
    setBusy(true);
    try {
      await PersonsApi.remove(id);
      message.success("Депутат удалён");
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const createDocument = async ({ title, description, type, category, number, date, url, file }) => {
    setBusy(true);
    try {
      const created = await DocumentsApi.create({
        title,
        content: description || "",
        type: mapDocType(type),
        // backend expects categoryId; keep optional free-text in metadata
        metadata: category ? { category } : undefined,
        number,
        publishedAt: date ? Date.parse(date) : undefined,
        // NOTE: backend doesn't have "url" in dto; keep in metadata so we don't lose it
        ...(url ? { metadata: { ...(category ? { category } : {}), url } } : {}),
      });
      if (created?.id && file) await DocumentsApi.uploadFile(created.id, file);
      message.success("Документ создан");
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const updateDocument = async (id, { title, description, type, category, number, date, url, file }) => {
    setBusy(true);
    try {
      await DocumentsApi.patch(id, {
        title,
        content: description || "",
        type: mapDocType(type),
        metadata: { ...(category ? { category } : {}), ...(url ? { url } : {}) },
        number,
        publishedAt: date ? Date.parse(date) : undefined,
      });
      if (file) await DocumentsApi.uploadFile(id, file);
      message.success("Документ обновлён");
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const deleteDocument = async (id) => {
    setBusy(true);
    try {
      await DocumentsApi.remove(id);
      message.success("Документ удалён");
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const createEvent = async (payload) => {
    setBusy(true);
    try {
      await EventsApi.create(toCalendarDto(payload));
      message.success("Событие создано");
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const updateEvent = async (id, payload) => {
    setBusy(true);
    try {
      await EventsApi.patch(id, toCalendarDto(payload));
      message.success("Событие обновлено");
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const deleteEvent = async (id) => {
    setBusy(true);
    try {
      await EventsApi.remove(id);
      message.success("Событие удалено");
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const stats = {
    deputies: Array.isArray(persons) ? persons.length : 0,
    documents: Array.isArray(documents) ? documents.length : 0,
    news: Array.isArray(news) ? news.length : 0,
    events: Array.isArray(events) ? events.length : 0,
  };

  const loginCard =
    !isAuthenticated ? (
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Вход в админку</div>
          <div style={{ opacity: 0.8, fontSize: 13, lineHeight: 1.45 }}>
            Чтобы редактировать, добавлять и удалять записи, выполните вход.
          </div>
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input.Password
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="primary"
            loading={loginBusy}
            onClick={async () => {
              setLoginBusy(true);
              try {
                await login({ email, password });
                message.success("Вход выполнен");
              } catch (e) {
                message.error(e?.message || "Ошибка входа");
              } finally {
                setLoginBusy(false);
              }
            }}
          >
            Войти
          </Button>
        </div>
      </div>
    ) : null;

  const page =
    sub === "news" ? (
      <AdminNews
        items={news}
        onCreate={createNews}
        onUpdate={updateNews}
        onDelete={deleteNews}
        busy={busy}
        canWrite={canWrite}
      />
    ) : sub === "deputies" ? (
      <AdminDeputies
        items={persons}
        onCreate={createDeputy}
        onUpdate={updateDeputy}
        onDelete={deleteDeputy}
        busy={busy}
        canWrite={canWrite}
      />
    ) : sub === "documents" ? (
      <AdminDocuments
        items={documents}
        onCreate={createDocument}
        onUpdate={updateDocument}
        onDelete={deleteDocument}
        busy={busy}
        canWrite={canWrite}
      />
    ) : sub === "events" ? (
      <AdminEvents
        items={events}
        onCreate={createEvent}
        onUpdate={updateEvent}
        onDelete={deleteEvent}
        busy={busy}
        canWrite={canWrite}
      />
    ) : sub === "env" ? (
      <AdminEnvDocs />
    ) : (
      <AdminDashboard stats={stats} />
    );

  const titleMap = {
    dashboard: "Панель управления",
    deputies: "Депутаты",
    documents: "Документы",
    events: "События",
    news: "Новости",
    env: "ENV документация",
  };

  return (
    <AdminShell
      activeKey={sub}
      title={titleMap[sub] || "Админ"}
      subtitle={`API: ${apiBase || "—"} • ${canWrite ? "доступ на запись" : "только просмотр"}`}
      user={user}
      themeMode={themeMode}
      onToggleTheme={toggleTheme}
      onLogout={() => {
        logout();
        message.success("Вы вышли");
      }}
    >
      {loginCard}
      {page}
    </AdminShell>
  );
}
