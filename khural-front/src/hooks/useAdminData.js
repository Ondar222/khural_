import React from "react";
import { App, Button, Input } from "antd";
import { useData } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { API_BASE_URL, NewsApi, PersonsApi, DocumentsApi, EventsApi } from "../api/client.js";
import { readAdminTheme, writeAdminTheme } from "../pages/admin/adminTheme.js";

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
  const date = start && !isNaN(start.getTime()) ? start.toISOString().slice(0, 10) : e?.date || "";
  const time = start && !isNaN(start.getTime()) ? start.toISOString().slice(11, 16) : e?.time || "";
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
  const t = String(type || "").toLowerCase();
  if (t === "laws") return "law";
  if (t === "resolutions") return "resolution";
  if (t === "bills") return "decision";
  if (t === "initiatives") return "order";
  if (t === "civic") return "other";
  if (t === "constitution") return "other";
  return type || "other";
}

export function useAdminData() {
  const { message } = App.useApp();
  const data = useData();
  const { isAuthenticated, user, logout, login } = useAuth();

  const apiBase = API_BASE_URL || "";

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
      setPersons(Array.isArray(apiPersons) ? apiPersons : toPersonsFallback(data.deputies));
      setDocuments(Array.isArray(apiDocs) ? apiDocs : toDocumentsFallback(data.documents));
      const apiEvents = await EventsApi.list().catch(() => null);
      setEvents(Array.isArray(apiEvents) ? apiEvents.map(toEventRow) : data.events || []);
    })();
  }, [data]);

  const toggleTheme = React.useCallback(() => {
    const next = themeMode === "light" ? "dark" : "light";
    setThemeMode(next);
    writeAdminTheme(next);
  }, [themeMode]);

  const reload = React.useCallback(async () => {
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
  }, []);

  const createNews = React.useCallback(async (formData) => {
    setBusy(true);
    try {
      const created = await NewsApi.createMultipart(formData);
      message.success("Новость создана");
      await reload();
    } finally {
      setBusy(false);
    }
  }, [message, reload]);

  const updateNews = React.useCallback(async (id, formData) => {
    setBusy(true);
    try {
      await NewsApi.updateMultipart(id, formData);
      message.success("Новость обновлена");
      await reload();
    } finally {
      setBusy(false);
    }
  }, [message, reload]);

  const deleteNews = React.useCallback(async (id) => {
    setBusy(true);
    try {
      await NewsApi.remove(id);
      message.success("Новость удалена");
      await reload();
    } finally {
      setBusy(false);
    }
  }, [message, reload]);

  const createDeputy = React.useCallback(async (payload) => {
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
  }, [message, reload]);

  const updateDeputy = React.useCallback(async (id, payload) => {
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
  }, [message, reload]);

  const deleteDeputy = React.useCallback(async (id) => {
    setBusy(true);
    try {
      await PersonsApi.remove(id);
      message.success("Депутат удалён");
      await reload();
    } finally {
      setBusy(false);
    }
  }, [message, reload]);

  const createDocument = React.useCallback(async ({
    title,
    description,
    type,
    category,
    number,
    date,
    fileRu,
    fileTy,
    isPublished,
  }) => {
    setBusy(true);
    try {
      const created = await DocumentsApi.create({
        title,
        content: description || "",
        type: mapDocType(type),
        metadata: category ? { category } : undefined,
        number,
        publishedAt: date ? Date.parse(date) : undefined,
        isPublished: isPublished ?? false,
      });
      if (created?.id) {
        if (fileRu) await DocumentsApi.uploadFile(created.id, fileRu);
        if (fileTy) await DocumentsApi.uploadFileTy(created.id, fileTy);
      }
      message.success("Документ создан");
      await reload();
    } finally {
      setBusy(false);
    }
  }, [message, reload]);

  const updateDocument = React.useCallback(async (
    id,
    { title, description, type, category, number, date, fileRu, fileTy, isPublished }
  ) => {
    setBusy(true);
    try {
      await DocumentsApi.patch(id, {
        title,
        content: description || "",
        type: mapDocType(type),
        metadata: category ? { category } : undefined,
        number,
        publishedAt: date ? Date.parse(date) : undefined,
        isPublished: isPublished ?? false,
      });
      if (fileRu) await DocumentsApi.uploadFile(id, fileRu);
      if (fileTy) await DocumentsApi.uploadFileTy(id, fileTy);
      message.success("Документ обновлён");
      await reload();
    } finally {
      setBusy(false);
    }
  }, [message, reload]);

  const deleteDocument = React.useCallback(async (id) => {
    setBusy(true);
    try {
      await DocumentsApi.remove(id);
      message.success("Документ удалён");
      await reload();
    } finally {
      setBusy(false);
    }
  }, [message, reload]);

  const createEvent = React.useCallback(async (payload) => {
    setBusy(true);
    try {
      await EventsApi.create(toCalendarDto(payload));
      message.success("Событие создано");
      await reload();
    } finally {
      setBusy(false);
    }
  }, [message, reload]);

  const updateEvent = React.useCallback(async (id, payload) => {
    setBusy(true);
    try {
      await EventsApi.patch(id, toCalendarDto(payload));
      message.success("Событие обновлено");
      await reload();
    } finally {
      setBusy(false);
    }
  }, [message, reload]);

  const deleteEvent = React.useCallback(async (id) => {
    setBusy(true);
    try {
      await EventsApi.remove(id);
      message.success("Событие удалено");
      await reload();
    } finally {
      setBusy(false);
    }
  }, [message, reload]);

  const stats = React.useMemo(() => ({
    deputies: Array.isArray(persons) ? persons.length : 0,
    documents: Array.isArray(documents) ? documents.length : 0,
    news: Array.isArray(news) ? news.length : 0,
    events: Array.isArray(events) ? events.length : 0,
  }), [persons, documents, news, events]);

  const handleLogin = React.useCallback(async () => {
    setLoginBusy(true);
    try {
      await login({ email, password });
      message.success("Вход выполнен");
    } catch (e) {
      message.error(e?.message || "Ошибка входа");
    } finally {
      setLoginBusy(false);
    }
  }, [email, password, login, message]);

  const handleLogout = React.useCallback(() => {
    logout();
    message.success("Вы вышли");
  }, [logout, message]);

  return {
    // Auth
    isAuthenticated,
    user,
    canWrite,
    email,
    setEmail,
    password,
    setPassword,
    loginBusy,
    handleLogin,
    handleLogout,
    
    // Theme
    themeMode,
    toggleTheme,
    
    // Data
    news,
    persons,
    documents,
    events,
    stats,
    apiBase,
    
    // CRUD News
    createNews,
    updateNews,
    deleteNews,
    
    // CRUD Deputies
    createDeputy,
    updateDeputy,
    deleteDeputy,
    
    // CRUD Documents
    createDocument,
    updateDocument,
    deleteDocument,
    
    // CRUD Events
    createEvent,
    updateEvent,
    deleteEvent,
    
    // State
    busy,
  };
}


