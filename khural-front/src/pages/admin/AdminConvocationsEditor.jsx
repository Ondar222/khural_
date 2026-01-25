import React from "react";
import { App, Button, Form, Input, Switch, Select, Space, Tag, Empty } from "antd";
import { useHashRoute } from "../../Router.jsx";
import { normalizeBool } from "../../utils/bool.js";
import TinyMCEEditor from "../../components/TinyMCEEditor.jsx";

export default function AdminConvocationsEditor({
  mode,
  convocationId,
  items,
  committees,
  onUpdateCommittee,
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

  const numberValue = Form.useWatch("number", form);
  const isActiveValue = Form.useWatch("isActive", form);
  const descriptionValue = Form.useWatch("description", form);

  const extractNumber = React.useCallback((raw) => {
    const s = String(raw || "").trim();
    if (!s) return "";
    // Examples supported: "VII", "VII созыв", "Созыв VII", "Созыв VII (парламент)" etc
    const m =
      s.match(/\b([IVXLCDM]+)\b/i) || // roman
      s.match(/\b(\d+)\b/); // arabic
    return m ? String(m[1] || "").toUpperCase() : s;
  }, []);

  React.useEffect(() => {
    if (mode !== "edit") return;
    const id = String(convocationId || "");
    if (!id) return;
    const found =
      (Array.isArray(items) ? items : []).find((e) => String(e?.id) === id) || null;
    setLoading(true);
    try {
      if (!found) return;
      // API использует поле "name" (например, "VII созыв" / "Созыв VII" / "VII")
      form.setFieldsValue({
        number: extractNumber(found.name || found.number || ""),
        description: found.description || "",
        isActive: normalizeBool(found.isActive, true),
      });
    } finally {
      setLoading(false);
    }
  }, [mode, convocationId, items, form, extractNumber]);

  const onSave = async () => {
    if (!canWrite) return;
    setSaving(true);
    try {
      const values = await form.validateFields();
      // Отправляем все поля: name, description, isActive
      const number = String(values.number || "").trim();
      const isActive = normalizeBool(values.isActive, true);
      const payload = {
        name: number,
        description: values.description || "",
        isActive,
        // Some deployments expect snake_case
        is_active: isActive,
      };
      if (mode === "create") {
        await onCreate?.(payload);
        message.success("Созыв создан");
      } else {
        await onUpdate?.(String(convocationId), payload);
        message.success("Созыв обновлен");
      }
      navigate("/admin/convocations");
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Не удалось сохранить созыв");
    } finally {
      setSaving(false);
    }
  };

  const convIdNum = React.useMemo(() => {
    const n = Number(convocationId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [convocationId]);

  const committeesForThisConvocation = React.useMemo(() => {
    if (!convIdNum) return [];
    const list = Array.isArray(committees) ? committees : [];
    return list.filter((c) => String(c?.convocation?.id || c?.convocationId || "") === String(convIdNum));
  }, [committees, convIdNum]);

  const availableToAttach = React.useMemo(() => {
    if (!convIdNum) return [];
    const list = Array.isArray(committees) ? committees : [];
    return list.filter((c) => String(c?.convocation?.id || c?.convocationId || "") !== String(convIdNum));
  }, [committees, convIdNum]);

  const [attachCommitteeId, setAttachCommitteeId] = React.useState(null);

  const attachExisting = React.useCallback(async () => {
    if (!canWrite) return;
    if (!convIdNum) return;
    const id = attachCommitteeId ? String(attachCommitteeId) : "";
    if (!id) return;
    await onUpdateCommittee?.(id, { convocationId: convIdNum });
    setAttachCommitteeId(null);
  }, [attachCommitteeId, canWrite, convIdNum, onUpdateCommittee]);

  const detach = React.useCallback(async (committeeIdToDetach) => {
    if (!canWrite) return;
    const id = String(committeeIdToDetach || "");
    if (!id) return;
    await onUpdateCommittee?.(id, { convocationId: null });
  }, [canWrite, onUpdateCommittee]);

  return (
    <div className="admin-events-editor">
      <div className="admin-events-editor__hero">
        <div className="admin-events-editor__hero-row">
          <div className="admin-events-editor__hero-left">
            <div className="admin-events-editor__kicker">Созывы</div>
            <div className="admin-events-editor__title">
              {mode === "create" ? "Добавить созыв" : "Редактировать созыв"}
            </div>
            {mode === "edit" && numberValue ? (
              <div className="admin-events-editor__subtitle">{`Созыв ${String(numberValue)}`}</div>
            ) : (
              <div className="admin-events-editor__subtitle">Управление созывами</div>
            )}
          </div>
          <div className="admin-events-editor__hero-actions">
            <Button onClick={() => navigate("/admin/convocations")}>Отмена</Button>
            <Button
              type="primary"
              onClick={onSave}
              disabled={!canWrite}
              loading={Boolean(busy || saving)}
            >
              Сохранить
            </Button>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-events-editor__section-title">Детали созыва</div>
        <Form layout="vertical" form={form} initialValues={{ isActive: true }}>
          <Form.Item
            label="Номер созыва"
            name="number"
            rules={[{ required: true, message: "Укажите номер созыва" }]}
            tooltip="Например: 'VII' или '8'"
          >
            <Input placeholder="VII" disabled={loading || saving} />
          </Form.Item>

          <Form.Item label="Краткое описание" name="description">
            <TinyMCEEditor
              value={descriptionValue || ""}
              onChange={(content) => {
                form.setFieldsValue({ description: content });
              }}
              placeholder="Введите описание созыва..."
              disabled={loading || saving}
              height={300}
            />
          </Form.Item>

          <Form.Item
            label="Статус"
            tooltip="Активный - текущий созыв, Архив - прошлые созывы"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <Form.Item name="isActive" valuePropName="checked" noStyle>
                <Switch disabled={loading || saving} />
              </Form.Item>
              <div style={{ opacity: 0.7, fontSize: 13 }}>
                {normalizeBool(isActiveValue, true) ? "Активный" : "Архив"}
              </div>
            </div>
          </Form.Item>
        </Form>
      </div>

      {mode === "edit" && convIdNum ? (
        <div className="admin-card" style={{ marginTop: 16 }}>
          <div className="admin-events-editor__section-title">Комитеты созыва</div>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Button
                type="primary"
                disabled={!canWrite}
                onClick={() => navigate(`/admin/committees/create?convocationId=${encodeURIComponent(String(convIdNum))}`)}
              >
                + Создать комитет в этом созыве
              </Button>
              <Space.Compact style={{ minWidth: 320, flex: "1 1 320px" }}>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Прикрепить существующий комитет…"
                  value={attachCommitteeId}
                  onChange={setAttachCommitteeId}
                  allowClear
                  disabled={!canWrite}
                  showSearch
                  optionFilterProp="label"
                  options={(availableToAttach || []).map((c) => ({
                    value: String(c?.id),
                    label: String(c?.name || c?.title || c?.id),
                  }))}
                />
                <Button type="default" disabled={!canWrite || !attachCommitteeId} onClick={attachExisting}>
                  Добавить
                </Button>
              </Space.Compact>
            </div>

            {committeesForThisConvocation.length ? (
              <div style={{ display: "grid", gap: 10 }}>
                {committeesForThisConvocation.map((c) => {
                  const id = String(c?.id ?? "");
                  const localStatic = id.startsWith("local-static-");
                  return (
                    <div
                      key={id}
                      style={{
                        border: "1px solid rgba(15, 23, 42, 0.08)",
                        borderRadius: 14,
                        padding: 14,
                        background: "rgba(255,255,255,0.55)",
                        display: "grid",
                        gap: 10,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 900 }}>{c?.name || c?.title || "Комитет"}</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          {localStatic ? <Tag color="blue">Локально (файл)</Tag> : id.startsWith("local-") ? <Tag color="blue">Локально</Tag> : null}
                          {c?.isActive ? <Tag color="green">Активный</Tag> : <Tag color="default">Неактивный</Tag>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <Button
                          disabled={!canWrite || localStatic}
                          onClick={() => navigate(`/admin/committees/edit/${encodeURIComponent(id)}`)}
                        >
                          Редактировать
                        </Button>
                        <Button danger disabled={!canWrite || localStatic} onClick={() => detach(id)}>
                          Убрать из созыва
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty description="В этом созыве пока нет комитетов" />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

