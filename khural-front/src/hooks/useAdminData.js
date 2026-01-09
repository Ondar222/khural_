import React from "react";
import { App, Button, Input } from "antd";
import { useData } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  API_BASE_URL,
  NewsApi,
  PersonsApi,
  DocumentsApi,
  EventsApi,
  AppealsApi,
  SliderApi,
} from "../api/client.js";
import { addDeletedNewsId } from "../utils/newsOverrides.js";
import { readAdminTheme, writeAdminTheme } from "../pages/admin/adminTheme.js";
import { toPersonsApiBody } from "../api/personsPayload.js";
import { addCreatedEvent, updateEventOverride, addDeletedEventId } from "../utils/eventsOverrides.js";

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
  // Fallback should preserve rich local fields from DataContext (bio/laws/schedule/etc)
  // while normalizing to the shape AdminDeputies UI expects.
  return (items || []).map((p) => {
    const id = String(p?.id || p?._id || p?.personId || Math.random().toString(36).slice(2));
    const fullName = p?.fullName || p?.full_name || p?.name || "";
    const district = p?.electoralDistrict || p?.electoral_district || p?.district || "";
    const phone = p?.phoneNumber || p?.phone_number || p?.phone || p?.contacts?.phone || "";
    const email = p?.email || p?.contacts?.email || "";
    const image = p?.image || (p?.photo ? { link: p.photo } : null);
    return {
      ...p,
      id,
      fullName,
      name: p?.name || fullName,
      electoralDistrict: p?.electoralDistrict || district,
      district: p?.district || district,
      faction: p?.faction || "",
      phoneNumber: p?.phoneNumber || phone,
      email,
      description: p?.description || p?.position || "",
      image,
    };
  });
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

function pickSlideImage(s) {
  const img = s?.image;
  if (!img) return "";
  if (typeof img === "string") return img;
  if (img?.link) return img.link;
  if (img?.file?.link) return img.file.link;
  if (img?.url) return img.url;
  return "";
}

function toSliderRow(s) {
  // Supports both API slider items and DataContext slides (title/desc/link/image).
  const fromContext = s && (s.desc !== undefined || s.link !== undefined);
  return {
    id: String(s?.id ?? Math.random().toString(36).slice(2)),
    title: String(s?.title || ""),
    description: String(s?.description ?? s?.desc ?? s?.subtitle ?? ""),
    url: String(s?.url ?? s?.link ?? s?.href ?? ""),
    isActive: s?.isActive !== false,
    order: Number(s?.order ?? 0),
    image: fromContext ? String(s?.image || "") : pickSlideImage(s),
    __raw: s,
  };
}

function normalizeServerList(payload) {
  if (Array.isArray(payload)) return payload;
  const p = payload?.data ? payload.data : payload;
  if (Array.isArray(p?.items)) return p.items;
  if (Array.isArray(p?.results)) return p.results;
  if (Array.isArray(p)) return p;
  return [];
}

function normalizeAppeal(a) {
  const createdAt = a?.createdAt || a?.created_at || a?.date || new Date().toISOString();
  const status = a?.status || a?.state || "Принято";
  const number = a?.number || a?.registrationNumber || a?.regNumber || a?.id || "";
  return {
    id: String(a?.id || a?._id || number || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    number: String(number || "").trim(),
    subject: a?.subject || a?.title || "",
    message: a?.message || a?.text || a?.content || "",
    status: String(status),
    createdAt: String(createdAt),
    userEmail: a?.userEmail || a?.user?.email || a?.email || "",
    userName: a?.userName || a?.user?.name || a?.name || "",
  };
}

function toCalendarDto(values) {
  const safeString = (v) => {
    if (v === undefined || v === null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (typeof v === "object") {
      // Tinymce editor instance (or similar) can be circular; extract HTML safely.
      if (typeof v.getContent === "function") {
        try {
          return String(v.getContent() || "");
        } catch {
          return "";
        }
      }
      // Typical DOM/event shapes
      if (typeof v?.target?.value === "string") return v.target.value;
      // Common content shapes
      if (typeof v?.content === "string") return v.content;
      if (typeof v?.html === "string") return v.html;
      // Last resort: try JSON, then fallback to empty to avoid circular refs
      try {
        return JSON.stringify(v);
      } catch {
        return "";
      }
    }
    return String(v);
  };

  const date = safeString(values?.date);
  const time = safeString(values?.time) || "00:00";
  const [hh, mm] = time.split(":").map((x) => parseInt(x, 10));
  const dt = new Date(`${date}T00:00:00.000Z`);
  if (!isNaN(hh)) dt.setUTCHours(hh);
  if (!isNaN(mm)) dt.setUTCMinutes(mm);
  return {
    title: safeString(values?.title),
    description: safeString(values?.desc),
    location: safeString(values?.place),
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
  const {
    reload: reloadDataContext,
    setEvents: setDataContextEvents,
    events: dataContextEvents,
  } = data;
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
  const [slider, setSlider] = React.useState([]);
  const [appeals, setAppeals] = React.useState([]);

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
      const [apiNews, apiPersons, apiDocsResponse, apiSlider] = await Promise.all([
        NewsApi.list().catch(() => null),
        PersonsApi.list().catch(() => null),
        DocumentsApi.listAll().catch(() => null),
        SliderApi.list({ all: true }).catch(() => null),
      ]);
      setNews(Array.isArray(apiNews) ? apiNews : toNewsFallback(data.news));
      setPersons(Array.isArray(apiPersons) && apiPersons.length ? apiPersons : toPersonsFallback(data.deputies));
      // Обрабатываем структуру ответа от бекенда (может быть { items } или массив)
      const apiDocs = apiDocsResponse?.items || (Array.isArray(apiDocsResponse) ? apiDocsResponse : []);
      setDocuments(Array.isArray(apiDocs) && apiDocs.length ? apiDocs : toDocumentsFallback(data.documents));
      if (Array.isArray(apiSlider) && apiSlider.length) {
        setSlider(apiSlider.map(toSliderRow));
      } else {
        // Fallback to DataContext slides (it already falls back to /public/data/slides.json)
        const fallback = (Array.isArray(data.slides) ? data.slides : [])
          .slice(0, 5)
          .map((s, i) => ({ ...toSliderRow(s), order: i + 1, isActive: true }));
        setSlider(fallback);
      }
      const apiEvents = await EventsApi.list().catch(() => null);
      setEvents(Array.isArray(apiEvents) ? apiEvents.map(toEventRow) : data.events || []);
      const apiAppealsResponse = await AppealsApi.listAll().catch(() => null);
      const apiAppeals = normalizeServerList(apiAppealsResponse);
      setAppeals(Array.isArray(apiAppeals) ? apiAppeals.map(normalizeAppeal) : []);
    })();
  }, [data]);

  const toggleTheme = React.useCallback(() => {
    const next = themeMode === "light" ? "dark" : "light";
    setThemeMode(next);
    writeAdminTheme(next);
  }, [themeMode]);

  const reload = React.useCallback(async () => {
    const [apiNews, apiPersons, apiDocsResponse, apiSlider] = await Promise.all([
      NewsApi.list().catch(() => null),
      PersonsApi.list().catch(() => null),
      DocumentsApi.listAll().catch(() => null),
      SliderApi.list({ all: true }).catch(() => null),
    ]);
    if (Array.isArray(apiNews)) setNews(apiNews);
    if (Array.isArray(apiPersons) && apiPersons.length) setPersons(apiPersons);
    else setPersons(toPersonsFallback(data.deputies));
    // Обрабатываем структуру ответа от бекенда (может быть { items } или массив)
    const apiDocs = apiDocsResponse?.items || (Array.isArray(apiDocsResponse) ? apiDocsResponse : []);
    if (Array.isArray(apiDocs)) setDocuments(apiDocs);
    if (Array.isArray(apiSlider) && apiSlider.length) {
      setSlider(apiSlider.map(toSliderRow));
    } else {
      const fallback = (Array.isArray(data.slides) ? data.slides : [])
        .slice(0, 5)
        .map((s, i) => ({ ...toSliderRow(s), order: i + 1, isActive: true }));
      setSlider(fallback);
    }
    const apiEvents = await EventsApi.list().catch(() => null);
    if (Array.isArray(apiEvents)) setEvents(apiEvents.map(toEventRow));
    const apiAppealsResponse = await AppealsApi.listAll().catch(() => null);
    const apiAppeals = normalizeServerList(apiAppealsResponse);
    if (Array.isArray(apiAppeals)) setAppeals(apiAppeals.map(normalizeAppeal));
  }, []);

  const createNews = React.useCallback(async (formData) => {
    setBusy(true);
    try {
      const created = await NewsApi.createMultipart(formData);
      message.success("Новость создана");
      await reload();
      // Обновляем публичные данные, чтобы новость сразу появилась на сайте
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext]);

  const updateNews = React.useCallback(async (id, formData) => {
    setBusy(true);
    try {
      await NewsApi.updateMultipart(id, formData);
      message.success("Новость обновлена");
      await reload();
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext]);

  const deleteNews = React.useCallback(async (id) => {
    setBusy(true);
    try {
      try {
        await NewsApi.remove(id);
        message.success("Новость удалена");
        await reload();
        reloadDataContext();
      } catch (e) {
        // Fallback: allow local delete when API is unavailable (dev without backend / no rights)
        addDeletedNewsId(id);
        setNews((prev) =>
          (Array.isArray(prev) ? prev : []).filter((n) => String(n?.id ?? "") !== String(id))
        );
        message.warning("Удалено локально (сервер недоступен или нет прав)");
        reloadDataContext();
      }
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext]);

  const createDeputy = React.useCallback(async (payload) => {
    setBusy(true);
    try {
      const { imageFile, ...body } = payload || {};
      const created = await PersonsApi.create(toPersonsApiBody(body));
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
      await PersonsApi.patch(id, toPersonsApiBody(body));
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
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext]);

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
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext]);

  const deleteDocument = React.useCallback(async (id) => {
    setBusy(true);
    try {
      await DocumentsApi.remove(id);
      message.success("Документ удалён");
      await reload();
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext]);

  const createEvent = React.useCallback(async (payload) => {
    setBusy(true);
    try {
      const created = await EventsApi.create(toCalendarDto(payload));
      message.success("Событие создано");
      
      // Оптимистично добавляем событие в DataContext, чтобы оно сразу появилось в календаре
      if (created) {
        const toText = (v) => {
          if (v === undefined || v === null) return "";
          if (typeof v === "string") return v;
          if (typeof v === "number" || typeof v === "boolean") return String(v);
          if (typeof v === "object") {
            if (typeof v.getContent === "function") {
              try {
                return String(v.getContent() || "");
              } catch {
                return "";
              }
            }
            if (typeof v?.target?.value === "string") return v.target.value;
            if (typeof v?.content === "string") return v.content;
            if (typeof v?.html === "string") return v.html;
            return "";
          }
          return String(v);
        };
        const newEvent = {
          id: String(created.id ?? Math.random().toString(36).slice(2)),
          date: (() => {
            const d = payload.date;
            if (d) return toText(d);
            const start = created.startDate;
            if (!start) return "";
            const dt = new Date(Number(start));
            return isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
          })(),
          title: toText(payload.title) || toText(created.title) || "",
          time: payload.time || (() => {
            const start = created.startDate;
            if (!start) return "";
            const dt = new Date(Number(start));
            if (isNaN(dt.getTime())) return "";
            return dt.toISOString().slice(11, 16);
          })(),
          place: toText(payload.place) || toText(created.location) || "",
          desc: toText(payload.desc) || toText(created.description) || "",
        };
        setDataContextEvents([...dataContextEvents, newEvent]);
        // Persist locally so it stays visible even if GET /calendar is rate-limited (429) temporarily
        addCreatedEvent(newEvent);
      }
      
      // Небольшая задержка, чтобы API успел обработать запрос
      await new Promise((resolve) => setTimeout(resolve, 100));
      await reload();
      // НЕ дергаем reloadDataContext здесь: при 429 GET /calendar DataContext упадет в fallback и затрет оптимистичное событие.
    } finally {
      setBusy(false);
    }
  }, [message, reload, setDataContextEvents, dataContextEvents]);

  const updateEvent = React.useCallback(async (id, payload) => {
    setBusy(true);
    try {
      try {
        await EventsApi.patch(id, toCalendarDto(payload));
        message.success("Событие обновлено");
      } catch (e) {
        // allow local update if API is unavailable/no rights
        message.warning("Обновлено локально (сервер недоступен или нет прав)");
      }

      // Оптимистично обновляем событие в DataContext + сохраняем в overrides, чтобы работало в календаре при 404/429
      if (dataContextEvents) {
        const toText = (v) => {
          if (v === undefined || v === null) return "";
          if (typeof v === "string") return v;
          if (typeof v === "number" || typeof v === "boolean") return String(v);
          if (typeof v === "object") {
            if (typeof v.getContent === "function") {
              try {
                return String(v.getContent() || "");
              } catch {
                return "";
              }
            }
            if (typeof v?.target?.value === "string") return v.target.value;
            if (typeof v?.content === "string") return v.content;
            if (typeof v?.html === "string") return v.html;
            return "";
          }
          return String(v);
        };
        const updatedEvent = {
          id: String(id),
          date: toText(payload.date) || "",
          title: toText(payload.title) || "",
          time: toText(payload.time) || "",
          place: toText(payload.place) || "",
          desc: toText(payload.desc) || "",
        };
        const updatedEvents = dataContextEvents.map((e) =>
          String(e.id) === String(id) ? updatedEvent : e
        );
        setDataContextEvents(updatedEvents);
        updateEventOverride(String(id), updatedEvent);
      }
      
      await reload();
      // Обновляем DataContext, чтобы календарь увидел обновленное событие (если API работает)
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext, setDataContextEvents, dataContextEvents]);

  const deleteEvent = React.useCallback(async (id) => {
    setBusy(true);
    try {
      try {
        await EventsApi.remove(id);
        message.success("Событие удалено");
      } catch (e) {
        message.warning("Удалено локально (сервер недоступен или нет прав)");
      }
      addDeletedEventId(String(id));
      
      // Оптимистично удаляем событие из DataContext
      if (dataContextEvents) {
        const filteredEvents = dataContextEvents.filter((e) => String(e.id) !== String(id));
        setDataContextEvents(filteredEvents);
      }
      
      await reload();
      // Обновляем DataContext, чтобы календарь обновился после удаления (если API работает)
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext, setDataContextEvents, dataContextEvents]);

  const createSlide = React.useCallback(async ({ title, description, url, isActive }) => {
    setBusy(true);
    try {
      if (Array.isArray(slider) && slider.length >= 5) {
        throw new Error("Максимум 5 слайдов");
      }
      await SliderApi.create({
        title: title || "",
        description: description || "",
        url: url || "",
        isActive: isActive ?? true,
      });
      message.success("Слайд создан");
      await reload();
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext, slider]);

  const updateSlide = React.useCallback(async (id, { title, description, url, isActive }) => {
    setBusy(true);
    try {
      await SliderApi.patch(id, {
        title: title || "",
        description: description || "",
        url: url || "",
        isActive: isActive ?? true,
      });
      message.success("Слайд обновлён");
      await reload();
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext]);

  const deleteSlide = React.useCallback(async (id) => {
    setBusy(true);
    try {
      await SliderApi.remove(id);
      message.success("Слайд удалён");
      await reload();
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext]);

  const uploadSlideImage = React.useCallback(async (id, file) => {
    setBusy(true);
    try {
      await SliderApi.uploadImage(id, file);
      message.success("Картинка загружена");
      await reload();
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext]);

  const reorderSlides = React.useCallback(async (ids) => {
    setBusy(true);
    try {
      await SliderApi.reorder(Array.isArray(ids) ? ids : []);
      message.success("Порядок слайдов обновлён");
      await reload();
      reloadDataContext();
    } finally {
      setBusy(false);
    }
  }, [message, reload, reloadDataContext]);

  const updateAppealStatus = React.useCallback(async (id, status) => {
    setBusy(true);
    try {
      await AppealsApi.updateStatus(id, status);
      message.success("Статус обращения обновлен");
      // Обновляем локальный список
      setAppeals((prev) =>
        prev.map((a) => (String(a.id) === String(id) ? { ...a, status } : a))
      );
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
    slides: Array.isArray(slider) ? slider.length : 0,
  }), [persons, documents, news, events, slider]);

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
    slider,
    appeals,
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

    // CRUD Slider
    createSlide,
    updateSlide,
    deleteSlide,
    uploadSlideImage,
    reorderSlides,
    
    // CRUD Appeals
    updateAppealStatus,
    
    // State
    busy,
  };
}


