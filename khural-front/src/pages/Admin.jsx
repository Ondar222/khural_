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
      setEvents(Array.isArray(apiEvents) ? apiEvents : (data.events || []));
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
    if (Array.isArray(apiEvents)) setEvents(apiEvents);
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
        description,
        type,
        category,
        number,
        date,
        url,
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
        description,
        type,
        category,
        number,
        date,
        url,
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
      await EventsApi.create(payload);
      message.success("Событие создано");
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const updateEvent = async (id, payload) => {
    setBusy(true);
    try {
      await EventsApi.patch(id, payload);
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
    ) : (
      <AdminDashboard stats={stats} />
    );

  const titleMap = {
    dashboard: "Панель управления",
    deputies: "Депутаты",
    documents: "Документы",
    events: "События",
    news: "Новости",
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
