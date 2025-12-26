import React from "react";
import { Form, Input, Button, Result, Alert, Tabs, Tag, Checkbox } from "antd";
import { useAuth } from "../context/AuthContext.jsx";
import { AppealsApi } from "../api/client.js";

function storageKey(user) {
  const id = user?.id || user?.email || "anon";
  return `appeals_history_${String(id)}`;
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

function normalizeServerList(payload) {
  // Accept: array OR {items} OR {data:{items}} etc.
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
    message: a?.message || a?.text || "",
    status: String(status),
    createdAt: String(createdAt),
  };
}

export default function Appeals() {
  const { isAuthenticated, user } = useAuth();
  const [tab, setTab] = React.useState("create");
  const [ok, setOk] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [historyBusy, setHistoryBusy] = React.useState(false);
  const [history, setHistory] = React.useState(() => loadLocal(user));

  React.useEffect(() => {
    // keep local history isolated per user
    setHistory(loadLocal(user));
  }, [user?.id, user?.email]);

  const loadHistory = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setHistoryBusy(true);
    try {
      const res = await AppealsApi.listMine({ page: 1, limit: 50 });
      const items = normalizeServerList(res).map(normalizeAppeal);
      if (items.length) {
        setHistory(items);
        saveLocal(user, items);
      } else {
        // if backend returns empty, keep local cache
        setHistory(loadLocal(user));
      }
    } catch {
      setHistory(loadLocal(user));
    } finally {
      setHistoryBusy(false);
    }
  }, [isAuthenticated, user]);

  React.useEffect(() => {
    if (isAuthenticated) loadHistory();
  }, [isAuthenticated, loadHistory]);

  const onSubmit = async (values) => {
    if (!isAuthenticated) return;
    setBusy(true);
    try {
      await AppealsApi.create({ subject: values.subject, message: values.message });
      setOk(true);
      // Save to local history immediately (status workflow in UI)
      const localItem = normalizeAppeal({
        id: `local-${Date.now()}`,
        number: `A-${Date.now().toString().slice(-6)}`,
        subject: values.subject,
        message: values.message,
        status: "Принято",
        createdAt: new Date().toISOString(),
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

  return (
    <section className="section">
      <div className="container">
        <h1 className="h1-compact">Обращения граждан</h1>

        {!isAuthenticated ? (
          <Alert
            type="info"
            showIcon
            message="Для отправки обращения требуется авторизация"
            description={
              <span>
                Перейдите на страницу <a href="/login">входа</a> или{" "}
                <a href="/register">регистрации</a>, затем вернитесь сюда.
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
              label: "Подать обращение",
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
                          label="Фамилия"
                          name="surname"
                          rules={[{ required: true, message: "Укажите фамилию" }]}
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item
                          label="Имя"
                          name="name"
                          rules={[{ required: true, message: "Укажите имя" }]}
                        >
                          <Input />
                        </Form.Item>
                      </div>

                      <Form.Item label="Отчество (если есть)" name="patronymic">
                        <Input />
                      </Form.Item>

                      <div className="admin-split">
                        <Form.Item
                          label="Телефон"
                          name="phone"
                          rules={[{ required: true, message: "Укажите телефон" }]}
                        >
                          <Input placeholder="+7..." />
                        </Form.Item>
                        <Form.Item
                          label="Email"
                          name="email"
                          rules={[
                            { required: true, message: "Укажите email" },
                            { type: "email", message: "Некорректный email" },
                          ]}
                        >
                          <Input type="email" />
                        </Form.Item>
                      </div>

            <Form.Item
              label="Тема"
              name="subject"
              rules={[{ required: true, message: "Укажите тему" }]}
            >
                        <Input />
            </Form.Item>

            <Form.Item
              label="Текст обращения"
              name="message"
              rules={[{ required: true, message: "Введите текст обращения" }]}
            >
                        <Input.TextArea rows={8} />
                      </Form.Item>

                      <Form.Item
                        name="consent"
                        valuePropName="checked"
                        rules={[
                          {
                            validator: (_, v) =>
                              v ? Promise.resolve() : Promise.reject(new Error("Требуется согласие")),
                          },
                        ]}
                      >
                        <Checkbox disabled={!isAuthenticated}>
                          <span style={{ lineHeight: 1.35 }}>
                            Я согласен(на) на обработку персональных данных и подтверждаю достоверность
                            сведений.{" "}
                            <a className="link" href="/pd-policy">
                              Политика обработки ПДн
                            </a>
                          </span>
                        </Checkbox>
            </Form.Item>

                      <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" disabled={!isAuthenticated} loading={busy}>
                Отправить
              </Button>
              {!isAuthenticated && (
                <div style={{ marginTop: 12, fontSize: 13, color: "#6b7280" }}>
                  Для отправки обращения необходимо{" "}
                  <a href="/login" className="link">войти</a> или{" "}
                  <a href="/register" className="link">зарегистрироваться</a>
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
              label: "Мои обращения",
              children: (
                <div className="tile">
                  {!isAuthenticated ? (
                    <div style={{ opacity: 0.8 }}>
                      Войдите, чтобы видеть историю обращений.
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
                              {a.message ? (
                                <div style={{ marginTop: 8, whiteSpace: "pre-wrap", opacity: 0.9 }}>
                                  {a.message}
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
        <a href="/feedback">Правила о приеме обращений граждан</a>
        </div>
      </div>
    </section>
  );
}
