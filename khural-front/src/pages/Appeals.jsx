import React from "react";
import { createPortal } from "react-dom";
import { App, Form, Input, Button, Result, Alert, Tabs, Tag, Checkbox, Popconfirm } from "antd";
import { useAuth } from "../context/AuthContext.jsx";
import { AppealsApi } from "../api/client.js";
import { useI18n } from "../context/I18nContext.jsx";

function storageKey(user) {
  const id = user?.id || user?.email || "anon";
  return `appeals_history_${String(id)}`;
}

function hiddenKey(user) {
  const id = user?.id || user?.email || "anon";
  return `appeals_hidden_${String(id)}`;
}

function loadLocal(user) {
  try {
    const raw = localStorage.getItem(storageKey(user));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocal(user, items) {
  try {
    localStorage.setItem(storageKey(user), JSON.stringify(Array.isArray(items) ? items : []));
  } catch {
    // ignore
  }
}

function loadHiddenIds(user) {
  try {
    const raw = localStorage.getItem(hiddenKey(user));
    const parsed = raw ? JSON.parse(raw) : [];
    const arr = Array.isArray(parsed) ? parsed : [];
    return new Set(arr.map((x) => String(x)));
  } catch {
    return new Set();
  }
}

function saveHiddenIds(user, idsSet) {
  try {
    const arr = Array.from(idsSet || new Set()).map((x) => String(x));
    localStorage.setItem(hiddenKey(user), JSON.stringify(arr));
  } catch {
    // ignore
  }
}

function normalizeServerList(payload) {
  // Accept: array OR {items} OR {data:{items}} etc.
  if (Array.isArray(payload)) return payload;
  const p = payload?.data ? payload.data : payload;
  if (Array.isArray(p?.items)) return p.items;
  if (Array.isArray(p?.results)) return p.results;
  if (Array.isArray(p)) return p;
  return [];
}

function normalizeStatusText(status) {
  if (status == null) return "";
  let v = status;
  if (typeof v === "object") {
    v = v?.name ?? v?.title ?? v?.label ?? v?.code ?? v?.status ?? "";
  }
  const s = String(v || "").trim();
  if (!s) return "";
  const key = s.toLowerCase();
  return (
    {
      // common english codes → RU labels
      accepted: "Принято",
      new: "Принято",
      created: "Принято",
      in_progress: "В работе",
      processing: "В работе",
      work: "В работе",
      answered: "Ответ отправлен",
      sent: "Ответ отправлен",
      done: "Ответ отправлен",
    }[key] || s
  );
}

function getFullName(a) {
  // Try to get fullName directly
  if (a?.fullName || a?.user?.fullName) {
    return a.fullName || a.user.fullName;
  }
  
  // Try to construct from surname, name, patronymic
  const user = a?.user || {};
  const surname = a?.surname || user?.surname || user?.lastName || a?.lastName || "";
  const name = a?.name || user?.name || user?.firstName || a?.firstName || "";
  const patronymic = a?.patronymic || user?.patronymic || a?.patronymic || "";
  
  const parts = [surname, name, patronymic].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  
  // Fallback to userName
  return a?.userName || user?.name || "";
}

function normalizeAppeal(a) {
  const createdAt = a?.createdAt || a?.created_at || a?.date || new Date().toISOString();
  const statusRaw = a?.status || a?.state || a?.appealStatus || a?.statusInfo || "";
  const status = normalizeStatusText(statusRaw) || "Принято";
  const number = a?.number || a?.registrationNumber || a?.regNumber || a?.id || "";
  const user = a?.user || {};
  const userEmail = a?.userEmail || user?.email || a?.email || "";
  const userId = a?.userId || user?.id || a?.user_id || "";
  const fullName = getFullName(a);
  
  return {
    id: String(a?.id || a?._id || number || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    number: String(number || "").trim(),
    subject: a?.subject || a?.title || "",
    message: a?.message || a?.text || "",
    status: String(status),
    createdAt: String(createdAt),
    userEmail: String(userEmail),
    userId: String(userId || ""),
    fullName: String(fullName),
  };
}

// AppealDetailModal component in SpectrUM style
function AppealDetailModal({ open, onClose, appeal, t, onDelete }) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !appeal) return null;

  const getStatusColor = (status) => {
    if (status === "Ответ отправлен") return "green";
    if (status === "В работе") return "blue";
    return "gold";
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "800px" }}>
        <button className="modal__close icon-btn" onClick={onClose} aria-label={t("Закрыть")}>
          ✕
        </button>
        <div className="modal__content">
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>
            {appeal.subject || t("Обращения")}{" "}
            {appeal.number ? <span style={{ opacity: 0.7, fontWeight: 400 }}>({appeal.number})</span> : null}
          </h3>
          
          {(appeal.fullName || appeal.userEmail) && (
            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ marginBottom: 8 }}>
                <strong>{t("Автор обращения:")}</strong>
              </div>
              {appeal.fullName && (
                <div style={{ marginBottom: 4, fontSize: 15 }}>{appeal.fullName}</div>
              )}
              {appeal.userEmail && (
                <div style={{ fontSize: 14, opacity: 0.8, color: "#0a3b72" }}>{appeal.userEmail}</div>
              )}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>{t("Статус:")}</strong>{" "}
              <Tag color={getStatusColor(appeal.status)}>{appeal.status}</Tag>
            </div>
            <div style={{ opacity: 0.7, fontSize: 13, marginTop: 4 }}>
              <strong>{t("Дата создания:")}</strong>{" "}
              {appeal.createdAt
                ? new Date(appeal.createdAt).toLocaleString("ru-RU")
                : ""}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <strong style={{ display: "block", marginBottom: 8 }}>{t("Текст обращения")}:</strong>
            <div
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                lineHeight: "1.6",
                padding: "16px",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px",
                fontSize: 14,
              }}
            >
              {appeal.message || "—"}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
            {typeof onDelete === "function" ? (
              <button
                className="btn"
                style={{ borderColor: "#ef4444", color: "#ef4444", marginRight: 10 }}
                onClick={() => {
                  const ok = typeof window !== "undefined" ? window.confirm("Удалить обращение?") : false;
                  if (ok) onDelete(appeal);
                }}
              >
                {t("Удалить") || "Удалить"}
              </button>
            ) : null}
            <button className="btn btn--primary" onClick={onClose}>
              {t("Закрыть")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Appeals({ embedded = false } = {}) {
  const { isAuthenticated, user } = useAuth();
  const { t } = useI18n();
  const { message } = App.useApp();
  const [tab, setTab] = React.useState("create");
  const [ok, setOk] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [historyBusy, setHistoryBusy] = React.useState(false);
  const [history, setHistory] = React.useState(() => loadLocal(user));
  const [hiddenIds, setHiddenIds] = React.useState(() => loadHiddenIds(user));
  const [selectedAppeal, setSelectedAppeal] = React.useState(null);

  const isMineAppeal = React.useCallback(
    (appeal) => {
      if (!appeal) return false;
      const id = String(appeal?.id || "");
      if (id.startsWith("local-")) return true;
      const myEmail = String(user?.email || "").trim().toLowerCase();
      const email =
        String(appeal?.userEmail || appeal?.user?.email || appeal?.email || "")
          .trim()
          .toLowerCase();
      if (myEmail && email) return myEmail === email;
      const myId = String(user?.id || "").trim();
      const ownerId = String(appeal?.userId || appeal?.user?.id || "").trim();
      if (myId && ownerId) return myId === ownerId;
      return false;
    },
    [user?.email, user?.id]
  );

  React.useEffect(() => {
    // keep local history isolated per user
    const local = loadLocal(user);
    const hid = loadHiddenIds(user);
    setHiddenIds(hid);
    const filtered = (Array.isArray(local) ? local : [])
      .filter(isMineAppeal)
      .filter((a) => !hid.has(String(a?.id ?? "")));
    if (filtered.length !== (Array.isArray(local) ? local.length : 0)) {
      saveLocal(user, filtered);
    }
    setHistory(filtered);
  }, [user?.id, user?.email]);

  const loadHistory = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setHistoryBusy(true);
    try {
      const res = await AppealsApi.listMine({ page: 1, limit: 50 });
      const hid = loadHiddenIds(user);
      setHiddenIds(hid);
      const items = normalizeServerList(res)
        .map(normalizeAppeal)
        .filter(isMineAppeal)
        .filter((a) => !hid.has(String(a?.id ?? "")));
      if (items.length) {
        setHistory(items);
        saveLocal(user, items);
      } else {
        // if backend returns empty, keep local cache
        const local = loadLocal(user);
        const filtered = (Array.isArray(local) ? local : [])
          .filter(isMineAppeal)
          .filter((a) => !hid.has(String(a?.id ?? "")));
        if (filtered.length !== (Array.isArray(local) ? local.length : 0)) {
          saveLocal(user, filtered);
        }
        setHistory(filtered);
      }
    } catch {
      const local = loadLocal(user);
      const hid = loadHiddenIds(user);
      setHiddenIds(hid);
      const filtered = (Array.isArray(local) ? local : [])
        .filter(isMineAppeal)
        .filter((a) => !hid.has(String(a?.id ?? "")));
      if (filtered.length !== (Array.isArray(local) ? local.length : 0)) {
        saveLocal(user, filtered);
      }
      setHistory(filtered);
    } finally {
      setHistoryBusy(false);
    }
  }, [isAuthenticated, user, isMineAppeal]);

  React.useEffect(() => {
    if (isAuthenticated) loadHistory();
  }, [isAuthenticated, loadHistory]);

  const openModal = (appeal) => {
    setSelectedAppeal(appeal);
  };

  const closeModal = () => {
    setSelectedAppeal(null);
  };

  const canDeleteAppeal = React.useCallback(
    (appeal) => {
      if (!isAuthenticated) return false;
      const id = String(appeal?.id || "");
      if (!id) return false;
      // local drafts can always be deleted from local history
      if (id.startsWith("local-")) return true;
      // allow admin to delete (real server delete), but still only within "my appeals" context
      if (user?.admin || String(user?.role || "").toLowerCase() === "admin") return isMineAppeal(appeal);
      return isMineAppeal(appeal);
    },
    [isAuthenticated, user, isMineAppeal]
  );

  const deleteAppeal = React.useCallback(
    async (appeal) => {
      const id = String(appeal?.id || "");
      if (!id) return;
      if (!canDeleteAppeal(appeal)) {
        message.error("Можно удалить только своё обращение.");
        return;
      }

      const isAdmin = Boolean(user?.admin) || String(user?.role || "").toLowerCase() === "admin";
      const prevHistory = Array.isArray(history) ? history : [];

      // Optimistic UI remove (also removes local-only items)
      setHistory((prev) => {
        const next = (Array.isArray(prev) ? prev : []).filter((a) => String(a?.id) !== id);
        saveLocal(user, next);
        return next;
      });

      if (selectedAppeal && String(selectedAppeal?.id) === id) {
        closeModal();
      }

      // For locally created placeholder items, stop here
      if (id.startsWith("local-")) {
        message.success("Обращение удалено");
        return;
      }

      try {
        await AppealsApi.remove(id);
        message.success("Обращение удалено");
        // Refresh from backend to stay consistent
        loadHistory();
      } catch (e) {
        if (e?.status === 401) {
          message.error("Сессия истекла. Пожалуйста, войдите заново.");
        } else {
          if (isAdmin) {
            // Admin: do NOT hide. Restore list and show error.
            setHistory(prevHistory);
            saveLocal(user, prevHistory);
            message.error(e?.message || "Не удалось удалить обращение");
          } else {
            // Citizen fallback: if backend doesn't allow delete, hide locally to keep "My appeals" clean.
            const nextHidden = new Set(hiddenIds || []);
            nextHidden.add(id);
            setHiddenIds(nextHidden);
            saveHiddenIds(user, nextHidden);
            if (e?.status === 403 || e?.status === 405) {
              message.warning("Обращение скрыто из списка. Удалить на сервере может только администратор.");
            } else {
              message.warning("Обращение скрыто из списка (сервер не удалил).");
            }
          }
        }
        // Keep UI consistent with server/cache as much as possible
        loadHistory();
      }
    },
    [canDeleteAppeal, hiddenIds, history, loadHistory, message, selectedAppeal, user]
  );

  const onSubmit = async (values) => {
    if (!isAuthenticated) return;
    setBusy(true);
    try {
      await AppealsApi.create({ subject: values.subject, message: values.message });
      setOk(true);
      // Save to local history immediately (status workflow in UI)
      const fullName = [values.surname, values.name, values.patronymic].filter(Boolean).join(" ") || "";
      const localItem = normalizeAppeal({
        id: `local-${Date.now()}`,
        number: `A-${Date.now().toString().slice(-6)}`,
        subject: values.subject,
        message: values.message,
        status: "Принято",
        createdAt: new Date().toISOString(),
        userEmail: values.email || user?.email || "",
        fullName: fullName || user?.name || "",
        user: {
          email: values.email || user?.email || "",
          surname: values.surname,
          name: values.name,
          patronymic: values.patronymic,
        },
      });
      const next = [localItem, ...loadLocal(user)].slice(0, 100);
      setHistory(next);
      saveLocal(user, next);
      // Show success message for 3 seconds, then switch to history tab
      setTimeout(() => {
      setTab("history");
        setOk(false);
      }, 3000);
      // refresh from backend in background
      loadHistory();
    } finally {
      setBusy(false);
    }
  };

  const content = (
    <>
      <div className={embedded ? "" : "container"}>
        <h1 className="h1-compact">{t("Обращения граждан")}</h1>

        {!isAuthenticated ? (
          <Alert
            type="info"
            showIcon
            message={t("Для отправки обращения требуется авторизация")}
            description={
              <span>
                {t("Перейдите на страницу")} <a href="/login">{t("входа")}</a> {t("или")}{" "}
                <a href="/register">{t("регистрации")}</a>, {t("затем вернитесь сюда.")}
              </span>
            }
            style={{ marginBottom: 16 }}
          />
        ) : null}

        <Tabs
          activeKey={tab}
          onChange={setTab}
          items={[
            {
              key: "create",
              label: t("Подать обращение"),
              children: (
                <>
        {ok ? (
                    <div className="tile" style={{ padding: 24 }}>
                      <Result 
                        status="success" 
                        title="Ваше обращение успешно отправлено!"
                        subTitle="Обращение принято и зарегистрировано. Вы будете перенаправлены в раздел истории обращений."
                      />
                    </div>
                  ) : (
                    <Form
                      layout="vertical"
                      className="tile"
                      onFinish={onSubmit}
                      initialValues={{
                        surname: user?.surname || user?.lastName || "",
                        name: user?.firstName || (user?.name ? String(user.name).split(" ")[0] : "") || "",
                        patronymic: user?.patronymic || "",
                        phone: user?.phone || user?.phoneNumber || "",
                        email: user?.email || "",
                        consent: false,
                      }}
                    >
                      <div className="admin-split">
                        <Form.Item
                          label={t("Фамилия")}
                          name="surname"
                          rules={[{ required: true, message: t("Укажите фамилию") }]}
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item
                          label={t("Имя")}
                          name="name"
                          rules={[{ required: true, message: t("Укажите имя") }]}
                        >
                          <Input />
                        </Form.Item>
                      </div>

                      <Form.Item label={t("Отчество (если есть)") || "Отчество (если есть)"} name="patronymic">
                        <Input />
                      </Form.Item>

                      <div className="admin-split">
                        <Form.Item
                          label={t("Телефон")}
                          name="phone"
                          rules={[{ required: true, message: t("Укажите телефон") }]}
                        >
                          <Input placeholder="+7..." />
                        </Form.Item>
                        <Form.Item
                          label="Email"
                          name="email"
                          rules={[
                            { required: true, message: t("Укажите email") },
                            { type: "email", message: t("Некорректный email") },
                          ]}
                        >
                          <Input type="email" />
                        </Form.Item>
                      </div>

            <Form.Item
              label={t("Тема")}
              name="subject"
              rules={[{ required: true, message: t("Укажите тему") }]}
            >
                        <Input />
            </Form.Item>

            <Form.Item
              label={t("Текст обращения")}
              name="message"
              rules={[{ required: true, message: t("Введите текст обращения") }]}
            >
                        <Input.TextArea rows={8} />
                      </Form.Item>

                      <Form.Item
                        name="consent"
                        valuePropName="checked"
                        rules={[
                          {
                            validator: (_, v) =>
                              v ? Promise.resolve() : Promise.reject(new Error(t("Требуется согласие"))),
                          },
                        ]}
                      >
                        <Checkbox disabled={!isAuthenticated}>
                          <span style={{ lineHeight: 1.35 }}>
                            {t(
                              "Я согласен(на) на обработку персональных данных и подтверждаю достоверность сведений."
                            )}{" "}
                            <a className="link" href="/pd-policy">
                              {t("Политика обработки ПДн")}
                            </a>
                          </span>
                        </Checkbox>
            </Form.Item>

                      <Form.Item style={{ marginBottom: 0 }}>
                        <Button type="primary" htmlType="submit" disabled={!isAuthenticated} loading={busy}>
                          {t("Отправить")}
                        </Button>
                        {!isAuthenticated && (
                          <div style={{ marginTop: 12, fontSize: 13, color: "#6b7280" }}>
                            {t("Для отправки обращения необходимо войти или зарегистрироваться")}{" "}
                            <a href="/login" className="link">
                              {t("войти")}
                            </a>{" "}
                            {t("или")}{" "}
                            <a href="/register" className="link">
                              {t("зарегистрироваться")}
                            </a>
                          </div>
                        )}
                      </Form.Item>
          </Form>
        )}
                </>
              ),
            },
            {
              key: "history",
              label: t("Мои обращения"),
              children: (
                <div className="tile">
                  {!isAuthenticated ? (
                    <div style={{ opacity: 0.8 }}>
                      {t("Войдите, чтобы видеть историю обращений.")}
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ fontWeight: 900 }}>История обращений</div>
                        <Button onClick={loadHistory} loading={historyBusy}>
                          Обновить
                        </Button>
                      </div>
                      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                        {(history || []).length === 0 ? (
                          <div style={{ opacity: 0.75 }}>Пока обращений нет</div>
                        ) : (
                          (history || []).map((a) => (
                            <div key={a.id} className="card" style={{ padding: 12 }}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: 12,
                                  flexWrap: "wrap",
                                }}
                              >
                                <div style={{ fontWeight: 900 }}>
                                  {a.subject || "Обращение"}{" "}
                                  {a.number ? <span style={{ opacity: 0.7 }}>({a.number})</span> : null}
                                </div>
                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                  <Tag
                                    color={
                                      a.status === "Ответ отправлен"
                                        ? "green"
                                        : a.status === "В работе"
                                          ? "blue"
                                          : "gold"
                                    }
                                  >
                                    {a.status}
                                  </Tag>
                                  <div style={{ opacity: 0.7, fontSize: 12 }}>
                                    {a.createdAt ? new Date(a.createdAt).toLocaleString("ru-RU") : ""}
                                  </div>
                                </div>
                              </div>
                              {(a.fullName || a.userEmail) && (
                                <div style={{ marginTop: 8, marginBottom: 8, fontSize: 13, opacity: 0.8 }}>
                                  {a.fullName && <span>{a.fullName}</span>}
                                  {a.fullName && a.userEmail && <span> · </span>}
                                  {a.userEmail && <span>{a.userEmail}</span>}
                                </div>
                              )}
                              {a.message ? (
                                <div style={{ marginTop: 8 }}>
                                  <div
                                    style={{
                                      opacity: 0.9,
                                      wordBreak: "break-word",
                                      lineHeight: "1.5",
                                      display: "-webkit-box",
                                      WebkitLineClamp: 3,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {a.message}
                                  </div>
                                  <Button
                                    type="link"
                                    size="small"
                                    onClick={() => openModal(a)}
                                    style={{ padding: 0, marginTop: 6, height: "auto", fontSize: "13px" }}
                                  >
                                    Подробнее
                                  </Button>
                                  {canDeleteAppeal(a) ? (
                                    <Popconfirm
                                      title="Удалить обращение?"
                                      description="Действие необратимо."
                                      okText="Удалить"
                                      cancelText="Отмена"
                                      okButtonProps={{ danger: true }}
                                      onConfirm={() => deleteAppeal(a)}
                                    >
                                      <Button
                                        type="link"
                                        danger
                                        size="small"
                                        style={{ padding: 0, marginTop: 6, height: "auto", fontSize: "13px" }}
                                      >
                                        Удалить
                                      </Button>
                                    </Popconfirm>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          ))
                        )}
                      </div>
                      <div style={{ marginTop: 12, opacity: 0.7, fontSize: 12 }}>
                        Статусы: «Принято», «В работе», «Ответ отправлен».
                      </div>
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />

        <div style={{ marginTop: 12 }}>
          <a href="/feedback">{t("Правила о приеме обращений граждан")}</a>
        </div>
      </div>

      <AppealDetailModal
        open={!!selectedAppeal}
        onClose={closeModal}
        appeal={selectedAppeal}
        t={t}
        onDelete={selectedAppeal && canDeleteAppeal(selectedAppeal) ? deleteAppeal : undefined}
      />
    </>
  );

  if (embedded) return content;
  return <section className="section">{content}</section>;
}
