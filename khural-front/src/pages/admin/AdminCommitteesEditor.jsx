import React from "react";
import { App, Button, Form, Input, Switch, Select, Space, Divider, InputNumber, Tag, Upload } from "antd";
import { UploadOutlined, FileOutlined } from "@ant-design/icons";
import { useHashRoute } from "../../Router.jsx";
import { normalizeBool } from "../../utils/bool.js";
import TinyMCEEditor from "../../components/TinyMCEEditor.jsx";
import { DocumentsApi, API_BASE_URL } from "../../api/client.js";

export default function AdminCommitteesEditor({
  mode,
  committeeId,
  items,
  convocations,
  persons,
  onCreate,
  onUpdate,
  busy,
  canWrite,
}) {
  const { message } = App.useApp();
  const { navigate } = useHashRoute();
  const [form] = Form.useForm();
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(mode === "edit");
  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const [uploadingPlanIndex, setUploadingPlanIndex] = React.useState(null);

  const nameValue = Form.useWatch("name", form);
  const descriptionValue = Form.useWatch("description", form);
  const convocationIdValue = Form.useWatch("convocationId", form);
  const isActiveValue = Form.useWatch("isActive", form);
  const plansValue = Form.useWatch("plans", form);

  const handlePlanFileUpload = React.useCallback(
    async (planIndex, file) => {
      if (!file || !(file instanceof File)) return;
      setUploadingPlanIndex(planIndex);
      try {
        const tempDoc = await DocumentsApi.create({
          title: `[План комитета] ${file.name}`,
          type: "other",
          isPublished: false,
        });
        if (!tempDoc?.id) throw new Error("Не удалось создать документ для загрузки");
        await DocumentsApi.uploadFile(tempDoc.id, file);
        const updated = await DocumentsApi.getById(tempDoc.id);
        const fileId = updated?.pdfFile?.id;
        if (!fileId) throw new Error("Не удалось получить ID файла");
        form.setFieldValue(["plans", planIndex, "fileId"], fileId);
        message.success("Документ загружен");
      } catch (err) {
        console.error("Plan file upload error:", err);
        message.error(err?.message || "Не удалось загрузить файл");
      } finally {
        setUploadingPlanIndex(null);
      }
    },
    [form, message]
  );

  const formatConvocationLabel = React.useCallback((c) => {
    const raw = String(c?.name || c?.number || "").trim();
    if (!raw) return `Созыв ${c?.id ?? ""}`.trim();
    const low = raw.toLowerCase();
    if (low.includes("созыв")) return raw;
    return `Созыв ${raw}`;
  }, []);

  const selectedConvocation = React.useMemo(() => {
    const list = Array.isArray(convocations) ? convocations : [];
    if (!convocationIdValue) return null;
    const raw = String(convocationIdValue);
    for (const c of list) {
      if (c == null) continue;
      if (typeof c === "string") {
        if (String(c) === raw) return { id: c, name: c };
        continue;
      }
      if (String(c?.id) === raw) return c;
      if (String(c?.name || c?.number || "") === raw) return c;
    }
    return null;
  }, [convocations, convocationIdValue]);

  // Prefill convocationId when coming from convocation page
  React.useEffect(() => {
    if (mode !== "create") return;
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search || "");
    const cid = sp.get("convocationId");
    if (!cid) return;
    form.setFieldsValue({ convocationId: cid });
  }, [mode, form]);

  // Отслеживание размера окна для адаптивности
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (mode !== "edit") return;
    const id = String(committeeId || "");
    if (!id) return;
    const found =
      (Array.isArray(items) ? items : []).find((e) => String(e?.id) === id) || null;
    setLoading(true);
    try {
      if (!found) return;
      form.setFieldsValue({
        name: found.name || "",
        description: found.description || "",
        phone: found.phone || "",
        email: found.email || "",
        address: found.address || "",
        website: found.website || "",
        head: found.head || "",
        isActive: normalizeBool(found.isActive, true),
        convocationId: found.convocation?.id || found.convocationId || null,
        members: Array.isArray(found.members)
          ? found.members.map((m, idx) => ({
              personId: m?.person?.id ?? m?.personId ?? null,
              name: m?.name || m?.person?.fullName || m?.person?.name || "",
              role: m?.role || "Член комитета",
              order: m?.order ?? idx,
            }))
          : [],
        plans: Array.isArray(found.plans)
          ? found.plans.map((p) => ({
              title: p?.title || "",
              date: p?.date || "",
              description: p?.description || "",
              fileLink: p?.fileLink || "",
              fileId: p?.fileId ?? "",
            }))
          : [],
        activities: Array.isArray(found.activities)
          ? found.activities.map((a) => ({
              title: a?.title || "",
              date: a?.date || "",
              type: a?.type || "",
              description: a?.description || "",
            }))
          : [],
      });
    } finally {
      setLoading(false);
    }
  }, [mode, committeeId, items, form]);

  const onSave = async () => {
    if (!canWrite) return;
    setSaving(true);
    try {
      const values = await form.validateFields();
      
      // Проверка обязательных полей
      if (!values.name || !values.name.trim()) {
        message.error("Название комитета обязательно");
        return;
      }
      
      let convocationId = null;
      if (values.convocationId) {
        const raw = String(values.convocationId).trim();
        if (!raw) {
          convocationId = null;
        } else if (/^\d+$/.test(raw)) {
          const num = Number(raw);
          if (!Number.isFinite(num) || num <= 0) {
            console.warn("[AdminCommitteesEditor] Неверный ID созыва:", values.convocationId);
            message.error("Неверный созыв. Выберите созыв из списка.");
            return;
          }
          convocationId = num;
        } else {
          convocationId = raw;
        }

        if (convocationId != null) {
          const convocationExists = (convocations || []).some((c) => {
            if (c == null) return false;
            if (typeof c === "string") return String(c) === String(convocationId);
            return (
              String(c.id) === String(convocationId) ||
              String(c.name || c.number || "") === String(convocationId)
            );
          });
          if (!convocationExists) {
            console.warn("[AdminCommitteesEditor] Созыв не найден в списке:", convocationId, convocations);
          }
        }
      }
      
      // Формируем payload для отправки на бэкенд
      // Используем такой же формат, как в других успешно работающих формах
      const payload = {
        name: String(values.name).trim(),
        isActive: normalizeBool(values.isActive, true),
      };
      
      // Добавляем остальные поля, только если они заполнены
      if (values.description?.trim()) {
        payload.description = values.description.trim();
      }
      if (values.phone?.trim()) {
        payload.phone = values.phone.trim();
      }
      if (values.email?.trim()) {
        payload.email = values.email.trim();
      }
      if (values.address?.trim()) {
        payload.address = values.address.trim();
      }
      if (values.website?.trim()) {
        payload.website = values.website.trim();
      }
      if (values.head?.trim()) {
        payload.head = values.head.trim();
      }
      
      if (convocationId != null && convocationId !== "") {
        payload.convocationId = convocationId;
      }

      // Members (deputies)
      const rawMembers = Array.isArray(values.members) ? values.members : [];
      const normalizedMembers = rawMembers
        .map((m, idx) => {
          const role = String(m?.role || "").trim() || "Член комитета";
          const order = Number.isFinite(Number(m?.order)) ? Number(m.order) : idx;
          const pid =
            m?.personId === null || m?.personId === undefined || String(m.personId).trim() === ""
              ? null
              : Number(m.personId);
          const name = String(m?.name || "").trim();
          if (pid && Number.isFinite(pid) && pid > 0) return { personId: pid, role, order };
          if (name) return { name, role, order };
          return null;
        })
        .filter(Boolean);
      payload.members = normalizedMembers;

      // Планы комитета
      const rawPlans = Array.isArray(values.plans) ? values.plans : [];
      payload.plans = rawPlans
        .map((p) => {
          const title = String(p?.title || "").trim();
          if (!title) return null;
          const plan = { title };
          if (p?.date?.trim()) plan.date = p.date.trim();
          if (p?.description?.trim()) plan.description = p.description.trim();
          if (p?.fileLink?.trim()) plan.fileLink = p.fileLink.trim();
          if (p?.fileId != null && String(p.fileId).trim() !== "") plan.fileId = p.fileId;
          return plan;
        })
        .filter(Boolean);

      // Деятельность комитета
      const rawActivities = Array.isArray(values.activities) ? values.activities : [];
      payload.activities = rawActivities
        .map((a) => {
          const title = String(a?.title || "").trim();
          if (!title) return null;
          const activity = { title };
          if (a?.date?.trim()) activity.date = a.date.trim();
          if (a?.type?.trim()) activity.type = a.type.trim();
          if (a?.description?.trim()) activity.description = a.description.trim();
          return activity;
        })
        .filter(Boolean);
      
      console.log("[AdminCommitteesEditor] ⚠️ Отправка payload на https://someshit.yurta.site/committees:");
      console.log("[AdminCommitteesEditor] Payload:", JSON.stringify(payload, null, 2));
      console.log("[AdminCommitteesEditor] Типы данных:", {
        name: typeof payload.name + " = " + payload.name,
        isActive: typeof payload.isActive + " = " + payload.isActive,
        description: payload.description ? typeof payload.description + " (length: " + payload.description.length + ")" : "undefined",
        phone: payload.phone ? typeof payload.phone : "undefined",
        email: payload.email ? typeof payload.email : "undefined",
        address: payload.address ? typeof payload.address : "undefined",
        website: payload.website ? typeof payload.website : "undefined",
        head: payload.head ? typeof payload.head : "undefined",
        convocationId: payload.convocationId ? typeof payload.convocationId + " = " + payload.convocationId : "undefined",
      });
      console.log("[AdminCommitteesEditor] Payload size:", JSON.stringify(payload).length, "bytes");
      
      if (mode === "create") {
        try {
          await onCreate?.(payload);
          message.success("Комитет создан");
          navigate("/admin/committees");
        } catch (createError) {
          console.error("[AdminCommitteesEditor] Ошибка создания комитета:", createError);
          console.error("[AdminCommitteesEditor] Ответ сервера:", createError?.data);
          throw createError; // Пробрасываем дальше для обработки в catch блоке
        }
      } else {
        try {
          await onUpdate?.(String(committeeId), payload);
          message.success("Комитет обновлен");
          navigate("/admin/committees");
        } catch (updateError) {
          console.error("[AdminCommitteesEditor] Ошибка обновления комитета:", updateError);
          console.error("[AdminCommitteesEditor] Ответ сервера:", updateError?.data);
          throw updateError;
        }
      }
    } catch (e) {
      if (e?.errorFields) return;
      console.error("[AdminCommitteesEditor] Ошибка сохранения:", e);
      console.error("[AdminCommitteesEditor] Статус ошибки:", e?.status);
      console.error("[AdminCommitteesEditor] Данные ошибки:", e?.data);
      console.error("[AdminCommitteesEditor] URL ошибки:", e?.url);
      
      // Более детальное сообщение об ошибке
      let errorMessage = "Не удалось сохранить комитет";
      if (e?.status === 500) {
        errorMessage = "Внутренняя ошибка сервера (500). Возможно, проблема на стороне бэкенда. Проверьте логи сервера или обратитесь к администратору.";
      } else if (e?.status === 400) {
        errorMessage = `Ошибка валидации (400): ${e?.data?.message || e?.message || "Проверьте правильность заполненных данных"}`;
      } else if (e?.status === 401) {
        errorMessage = "Ошибка авторизации (401). Возможно, истек токен. Попробуйте выйти и войти заново.";
      } else if (e?.status === 403) {
        errorMessage = "Нет доступа (403). У вас недостаточно прав для выполнения этого действия.";
      } else if (e?.data?.message) {
        errorMessage = `Ошибка: ${e.data.message}`;
      } else if (e?.message) {
        errorMessage = `Ошибка: ${e.message}`;
      }
      
      message.error(errorMessage);
      // Не переходим на другую страницу при ошибке
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-events-editor">
      {/* Header Section */}
      <div className="admin-events-editor__hero">
        <div className="admin-events-editor__hero-row">
          <div className="admin-events-editor__hero-left">
            <div className="admin-events-editor__kicker">Комитеты</div>
            <div className="admin-events-editor__title">
              {mode === "create" ? "Добавить комитет" : "Редактировать комитет"}
            </div>
            {mode === "edit" && nameValue ? (
              <div className="admin-events-editor__subtitle">{String(nameValue)}</div>
            ) : (
              <div className="admin-events-editor__subtitle">Управление комитетами</div>
            )}
          </div>
          <div className="admin-events-editor__hero-actions" style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center',
            width: windowWidth <= 640 ? '100%' : 'auto'
          }}>
            <Button 
              onClick={() => navigate("/admin/committees")}
              size="large"
              block={windowWidth <= 640}
              style={{ 
                minWidth: windowWidth <= 640 ? 'auto' : '100px',
                flex: windowWidth <= 640 ? '1 1 auto' : '0 1 auto'
              }}
            >
              Отмена
            </Button>
            <Button
              type="primary"
              onClick={onSave}
              disabled={!canWrite}
              loading={Boolean(busy || saving)}
              size="large"
              block={windowWidth <= 640}
              style={{ 
                minWidth: windowWidth <= 640 ? 'auto' : '120px',
                flex: windowWidth <= 640 ? '1 1 auto' : '0 1 auto'
              }}
            >
              Сохранить
            </Button>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ 
          padding: windowWidth <= 768 ? '20px 16px 16px' : '24px 24px 20px',
          borderBottom: '1px solid rgba(10, 31, 68, 0.08)',
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.05) 0%, transparent 100%)'
        }}>
          <div className="admin-events-editor__section-title" style={{ 
            fontSize: windowWidth <= 768 ? 16 : 18, 
            fontWeight: 700,
            margin: 0 
          }}>
            Детали комитета
          </div>
        </div>
        
        <Form 
          layout="vertical" 
          form={form} 
          initialValues={{ isActive: true, members: [], plans: [], activities: [] }}
          style={{ padding: windowWidth <= 768 ? '16px' : '24px' }}
        >
          {/* Основная информация */}
          <div style={{ 
            display: 'grid', 
            gap: '24px',
            marginBottom: '8px'
          }}>
            <Form.Item
              label={
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  Созыв <span style={{ color: '#ff4d4f' }}>*</span>
                </span>
              }
              name="convocationId"
              rules={[{ required: true, message: "Выберите созыв" }]}
              style={{ marginBottom: 0 }}
              extra={
                <span style={{ opacity: 0.75 }}>
                  Комитет принадлежит конкретному созыву. В выпадающем списке показан статус (Активный/Архив).
                </span>
              }
            >
              <Select
                placeholder="Выберите созыв"
                disabled={loading || saving}
                showSearch
                size="large"
                style={{ width: '100%' }}
                filterOption={(input, option) =>
                  (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                }
              >
                {(convocations || []).map((c, idx) => {
                  if (typeof c === "string") {
                    return (
                      <Select.Option key={`conv-${c}-${idx}`} value={c}>
                        <span style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span>{String(c)}</span>
                        </span>
                      </Select.Option>
                    );
                  }
                  return (
                    <Select.Option key={c.id ?? idx} value={c.id ?? c?.name ?? c?.number ?? String(idx)}>
                      <span style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span>{formatConvocationLabel(c)}</span>
                        {c?.isActive !== false ? (
                          <Tag color="green" style={{ margin: 0 }}>Активный</Tag>
                        ) : (
                          <Tag color="default" style={{ margin: 0 }}>Архив</Tag>
                        )}
                      </span>
                    </Select.Option>
                  );
                })}
              </Select>
            </Form.Item>

            {selectedConvocation ? (
              <div
                style={{
                  marginTop: -8,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(10, 31, 68, 0.08)",
                  background: "rgba(255,255,255,0.55)",
                  display: "grid",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ fontWeight: 800 }}>{formatConvocationLabel(selectedConvocation)}</div>
                  {selectedConvocation?.isActive !== false ? (
                    <Tag color="green" style={{ margin: 0 }}>Активный</Tag>
                  ) : (
                    <Tag color="default" style={{ margin: 0 }}>Архив</Tag>
                  )}
                </div>
                {selectedConvocation?.description ? (
                  <div style={{ opacity: 0.8, fontSize: 13, lineHeight: 1.45 }}>
                    {String(selectedConvocation.description).slice(0, 220)}
                    {String(selectedConvocation.description).length > 220 ? "…" : ""}
                  </div>
                ) : (
                  <div style={{ opacity: 0.65, fontSize: 13 }}>Описание не заполнено</div>
                )}
              </div>
            ) : null}

            <Form.Item
              label={
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  Название комитета <span style={{ color: '#ff4d4f' }}>*</span>
                </span>
              }
              name="name"
              rules={[{ required: true, message: "Укажите название комитета" }]}
              style={{ marginBottom: 0 }}
            >
              <Input 
                placeholder="Например: Комитет по бюджету" 
                disabled={loading || saving}
                size="large"
              />
            </Form.Item>

            <Form.Item 
              label={<span style={{ fontWeight: 600, fontSize: 14 }}>Краткое описание</span>}
              name="description"
              style={{ marginBottom: 0 }}
            >
              <TinyMCEEditor
                value={descriptionValue || ""}
                onChange={(content) => {
                  form.setFieldsValue({ description: content });
                }}
                placeholder="Введите описание комитета..."
                disabled={loading || saving}
                height={300}
              />
            </Form.Item>
          </div>

          <Divider style={{ margin: "18px 0 14px" }} />

          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Состав комитета</div>
            <div style={{ opacity: 0.75, fontSize: 13, lineHeight: 1.45 }}>
              Добавьте депутатов и роли. Один депутат может состоять в разных комитетах и созывах.
            </div>

            <Form.List name="members">
              {(fields, { add, remove }) => (
                <div style={{ display: "grid", gap: 12 }}>
                  {fields.map((field, idx) => (
                    <div
                      key={field.key}
                      style={{
                        border: "1px solid rgba(10, 31, 68, 0.08)",
                        borderRadius: 12,
                        padding: 12,
                        background: "rgba(255,255,255,0.55)",
                        display: "grid",
                        gap: 10,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 800 }}>Участник #{idx + 1}</div>
                        <Button danger size="small" onClick={() => remove(field.name)} disabled={loading || saving}>
                          Удалить
                        </Button>
                      </div>

                      <div style={{ display: "grid", gap: 10 }}>
                        <Form.Item
                          {...field}
                          label="Депутат"
                          name={[field.name, "personId"]}
                          style={{ marginBottom: 0 }}
                        >
                          <Select
                            placeholder="Выберите депутата (или оставьте пустым и заполните имя)"
                            disabled={loading || saving}
                            showSearch
                            allowClear
                            optionFilterProp="label"
                            options={(Array.isArray(persons) ? persons : []).map((p) => ({
                              value: String(p?.id),
                              label: String(p?.fullName || p?.name || `ID ${p?.id}`),
                            }))}
                          />
                        </Form.Item>

                        <Form.Item
                          {...field}
                          label="Имя (если не депутат)"
                          name={[field.name, "name"]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="ФИО" disabled={loading || saving} />
                        </Form.Item>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10 }}>
                          <Form.Item
                            {...field}
                            label="Роль"
                            name={[field.name, "role"]}
                            rules={[{ required: true, message: "Укажите роль" }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Input placeholder="Председатель / Член комитета" disabled={loading || saving} />
                          </Form.Item>
                          <Form.Item
                            {...field}
                            label="Порядок"
                            name={[field.name, "order"]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber min={0} style={{ width: "100%" }} disabled={loading || saving} />
                          </Form.Item>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Space wrap>
                    <Button
                      onClick={() => add({ role: "Член комитета", order: fields.length })}
                      disabled={loading || saving}
                    >
                      + Добавить участника
                    </Button>
                  </Space>
                </div>
              )}
            </Form.List>
          </div>

          <Divider style={{ margin: "24px 0 16px" }} />

          {/* Планы комитета */}
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Планы комитета</div>
            <div style={{ opacity: 0.75, fontSize: 13, lineHeight: 1.45 }}>
              Планы работы, документы. Отображаются на странице комитета во вкладке «Планы».
            </div>
            <Form.List name="plans">
              {(fields, { add, remove }) => (
                <div style={{ display: "grid", gap: 12 }}>
                  {fields.map((field, idx) => (
                    <div
                      key={field.key}
                      style={{
                        border: "1px solid rgba(10, 31, 68, 0.08)",
                        borderRadius: 12,
                        padding: 12,
                        background: "rgba(255,255,255,0.55)",
                        display: "grid",
                        gap: 10,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 800 }}>План #{idx + 1}</div>
                        <Button danger size="small" onClick={() => remove(field.name)} disabled={loading || saving}>
                          Удалить
                        </Button>
                      </div>
                      <Form.Item {...field} label="Название" name={[field.name, "title"]} style={{ marginBottom: 0 }} rules={[{ required: true, message: "Укажите название" }]}>
                        <Input placeholder="Например: План работы на 2024 год" disabled={loading || saving} />
                      </Form.Item>
                      <Form.Item {...field} label="Дата" name={[field.name, "date"]} style={{ marginBottom: 0 }}>
                        <Input placeholder="2024" disabled={loading || saving} />
                      </Form.Item>
                      <Form.Item {...field} label="Описание" name={[field.name, "description"]} style={{ marginBottom: 0 }}>
                        <Input.TextArea rows={2} placeholder="Краткое описание" disabled={loading || saving} />
                      </Form.Item>
                      <Form.Item {...field} label="Ссылка на файл" name={[field.name, "fileLink"]} style={{ marginBottom: 0 }}>
                        <Input placeholder="https://... или /upload/... (если не загружаете документ)" disabled={loading || saving} />
                      </Form.Item>
                      <Form.Item {...field} name={[field.name, "fileId"]} style={{ marginBottom: 0 }} hidden>
                        <Input type="hidden" />
                      </Form.Item>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
                        <Upload
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                          showUploadList={false}
                          beforeUpload={(file) => {
                            handlePlanFileUpload(field.name, file);
                            return Upload.LIST_IGNORE;
                          }}
                          disabled={loading || saving || uploadingPlanIndex === field.name}
                        >
                          <Button icon={<UploadOutlined />} loading={uploadingPlanIndex === field.name}>
                            {uploadingPlanIndex === field.name ? "Загрузка…" : "Загрузить документ"}
                          </Button>
                        </Upload>
                        {(plansValue?.[field.name]?.fileId || form.getFieldValue(["plans", field.name, "fileId"])) && (
                          <span style={{ fontSize: 13, color: "#52c41a", display: "flex", alignItems: "center", gap: 8 }}>
                            <FileOutlined /> Документ загружен (
                            <a href={`${API_BASE_URL.replace(/\/+$/, "")}/files/v2/${plansValue?.[field.name]?.fileId || form.getFieldValue(["plans", field.name, "fileId"])}`} target="_blank" rel="noopener noreferrer">
                              открыть
                            </a>
                            )
                            <Button type="link" size="small" style={{ padding: 0, height: "auto" }} onClick={() => form.setFieldValue(["plans", field.name, "fileId"], "")}>
                              Сбросить
                            </Button>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button onClick={() => add({ title: "", date: "", description: "", fileLink: "", fileId: "" })} disabled={loading || saving}>
                    + Добавить план
                  </Button>
                </div>
              )}
            </Form.List>
          </div>

          <Divider style={{ margin: "24px 0 16px" }} />

          {/* Деятельность комитета */}
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Деятельность комитета</div>
            <div style={{ opacity: 0.75, fontSize: 13, lineHeight: 1.45 }}>
              События, мероприятия. Отображаются на странице комитета во вкладке «Деятельность».
            </div>
            <Form.List name="activities">
              {(fields, { add, remove }) => (
                <div style={{ display: "grid", gap: 12 }}>
                  {fields.map((field, idx) => (
                    <div
                      key={field.key}
                      style={{
                        border: "1px solid rgba(10, 31, 68, 0.08)",
                        borderRadius: 12,
                        padding: 12,
                        background: "rgba(255,255,255,0.55)",
                        display: "grid",
                        gap: 10,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 800 }}>Деятельность #{idx + 1}</div>
                        <Button danger size="small" onClick={() => remove(field.name)} disabled={loading || saving}>
                          Удалить
                        </Button>
                      </div>
                      <Form.Item {...field} label="Название" name={[field.name, "title"]} style={{ marginBottom: 0 }} rules={[{ required: true, message: "Укажите название" }]}>
                        <Input placeholder="Например: Заседание комитета" disabled={loading || saving} />
                      </Form.Item>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <Form.Item {...field} label="Дата" name={[field.name, "date"]} style={{ marginBottom: 0 }}>
                          <Input placeholder="01.12.2024" disabled={loading || saving} />
                        </Form.Item>
                        <Form.Item {...field} label="Тип" name={[field.name, "type"]} style={{ marginBottom: 0 }}>
                          <Input placeholder="Заседание / Совещание / и т.д." disabled={loading || saving} />
                        </Form.Item>
                      </div>
                      <Form.Item {...field} label="Описание" name={[field.name, "description"]} style={{ marginBottom: 0 }}>
                        <Input.TextArea rows={3} placeholder="Описание мероприятия" disabled={loading || saving} />
                      </Form.Item>
                    </div>
                  ))}
                  <Button onClick={() => add({ title: "", date: "", type: "", description: "" })} disabled={loading || saving}>
                    + Добавить деятельность
                  </Button>
                </div>
              )}
            </Form.List>
          </div>

          {/* Контактная информация */}
          <div style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(10, 31, 68, 0.08)'
          }}>
            <div style={{
              fontSize: 16,
              fontWeight: 700,
              marginBottom: '20px',
              color: 'rgba(10, 31, 68, 0.9)'
            }}>
              Контактная информация
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: windowWidth <= 640 
                ? '1fr' 
                : 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: windowWidth <= 640 ? '16px' : '20px',
              marginBottom: '24px'
            }}>
              <Form.Item 
                label={<span style={{ fontWeight: 600, fontSize: 14 }}>Телефон</span>}
                name="phone"
                style={{ marginBottom: 0 }}
              >
                <Input 
                  placeholder="+7 (3012) 21-47-47" 
                  disabled={loading || saving}
                  size="large"
                  prefix={<span style={{ opacity: 0.5 }}>📞</span>}
                />
              </Form.Item>
              <Form.Item 
                label={<span style={{ fontWeight: 600, fontSize: 14 }}>Email</span>}
                name="email"
                style={{ marginBottom: 0 }}
              >
                <Input 
                  placeholder="budget@khural.ru" 
                  disabled={loading || saving}
                  size="large"
                  type="email"
                  prefix={<span style={{ opacity: 0.5 }}>✉️</span>}
                />
              </Form.Item>
            </div>

            <Form.Item 
              label={<span style={{ fontWeight: 600, fontSize: 14 }}>Адрес</span>}
              name="address"
              style={{ marginBottom: 0 }}
            >
              <Input 
                placeholder="г. Кызыл, ул. Ленина, 54" 
                disabled={loading || saving}
                size="large"
                prefix={<span style={{ opacity: 0.5 }}>📍</span>}
              />
            </Form.Item>
            <Form.Item 
              label={<span style={{ fontWeight: 600, fontSize: 14 }}>Сайт</span>}
              name="website"
              style={{ marginBottom: 0 }}
            >
              <Input 
                placeholder="https://komitet.khural.ru" 
                disabled={loading || saving}
                size="large"
                type="url"
                prefix={<span style={{ opacity: 0.5 }}>🌐</span>}
              />
            </Form.Item>
            <Form.Item 
              label={<span style={{ fontWeight: 600, fontSize: 14 }}>Руководитель</span>}
              name="head"
              style={{ marginBottom: 0 }}
            >
              <Input 
                placeholder="Иванов Иван Иванович" 
                disabled={loading || saving}
                size="large"
                prefix={<span style={{ opacity: 0.5 }}>👤</span>}
              />
            </Form.Item>
          </div>

          {/* Настройки */}
          <div style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(10, 31, 68, 0.08)'
          }}>
            <div style={{
              fontSize: 16,
              fontWeight: 700,
              marginBottom: '20px',
              color: 'rgba(10, 31, 68, 0.9)'
            }}>
              Настройки
            </div>
            
            <Form.Item
              label={<span style={{ fontWeight: 600, fontSize: 14 }}>Статус комитета</span>}
              tooltip="Активный комитет отображается на сайте"
              style={{ marginBottom: 0 }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: windowWidth <= 640 ? 'flex-start' : 'center',
                flexDirection: windowWidth <= 640 ? 'column' : 'row',
                gap: '12px',
                padding: windowWidth <= 640 ? '12px' : '12px 16px',
                background: 'rgba(10, 31, 68, 0.02)',
                borderRadius: '8px',
                border: '1px solid rgba(10, 31, 68, 0.08)',
                flexWrap: 'wrap'
              }}>
                <Form.Item name="isActive" valuePropName="checked" noStyle>
                  <Switch 
                    disabled={loading || saving}
                    checkedChildren="Активен"
                    unCheckedChildren="Неактивен"
                  />
                </Form.Item>
                <span style={{ 
                  fontSize: 14, 
                  color: normalizeBool(isActiveValue, true) ? '#52c41a' : '#8c8c8c',
                  fontWeight: normalizeBool(isActiveValue, true) ? 600 : 400
                }}>
                  {normalizeBool(isActiveValue, true) ? "Комитет отображается на сайте" : "Комитет скрыт"}
                </span>
              </div>
            </Form.Item>
          </div>
        </Form>
      </div>
    </div>
  );
}

