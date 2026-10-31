import React from "react";
import { App, Button, Form, Input, InputNumber, Switch, Select, Space, Tag, Empty } from "antd";
import { useHashRoute } from "../../Router.jsx";
import { normalizeBool } from "../../utils/bool.js";
import TinyMCEEditor from "../../components/TinyMCEEditor.jsx";
import { getConvocationNumber } from "../../utils/convocationIdentity.js";

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
  const nameValue = Form.useWatch("name", form);
  const isActiveValue = Form.useWatch("isActive", form);
  const descriptionValue = Form.useWatch("description", form);
  const yearsValue = Form.useWatch("years", form);

  const extractNumber = React.useCallback((raw) => {
    const s = String(raw || "").trim();
    if (!s) return "";
    const ordinal = getConvocationNumber(s);
    if (ordinal) return ordinal;
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
        number: extractNumber(found.number || found.name || ""),
        name: found.name || "",
        description: found.description || "",
        years: found.years || "",
        deputies: found.stats?.deputies ?? null,
        laws: found.stats?.laws ?? null,
        resolutions: found.stats?.resolutions ?? null,
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
      // Older API versions accept only name; the full static data also remains in local overrides.
      const number = String(values.number || "").trim();
      const name = String(values.name || "").trim() || number;
      const isActive = normalizeBool(values.isActive, true);
      const payload = {
        name,
        number,
        description: values.description || "",
        isActive,
        // Some deployments expect snake_case
        is_active: isActive,
      };
      const years = String(values.years || "").trim();
      if (years) payload.years = years;
      const stats = Object.fromEntries(
        ["deputies", "laws", "resolutions"]
          .filter((key) => values[key] != null && values[key] !== "")
          .map((key) => [key, Number(values[key])])
      );
      if (Object.keys(stats).length > 0) payload.stats = stats;
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

  const convIdStr = React.useMemo(() => {
    return String(convocationId || "");
  }, [convocationId]);

  const committeesForThisConvocation = React.useMemo(() => {
    if (!convIdStr) return [];
    const ordinal = getConvocationNumber(convIdStr);
    const list = Array.isArray(committees) ? committees : [];
    return list.filter((c) => {
      const committeeConvId = String(c?.convocationComittees?.id || c?.convocation?.id || c?.convocationId || "");
      return committeeConvId === convIdStr || (
        ordinal && getConvocationNumber(c?.convocation ?? committeeConvId) === ordinal
      );
    });
  }, [committees, convIdStr]);

  const availableToAttach = React.useMemo(() => {
    if (!convIdStr) return [];
    const ordinal = getConvocationNumber(convIdStr);
    const list = Array.isArray(committees) ? committees : [];
    return list.filter((c) => {
      const committeeConvId = String(c?.convocationComittees?.id || c?.convocation?.id || c?.convocationId || "");
      return committeeConvId !== convIdStr && !(
        ordinal && getConvocationNumber(c?.convocation ?? committeeConvId) === ordinal
      );
    });
  }, [committees, convIdStr]);

  const [attachCommitteeId, setAttachCommitteeId] = React.useState(null);

  const attachExisting = React.useCallback(async () => {
    if (!canWrite) return;
    if (!convIdStr) return;
    const id = attachCommitteeId ? String(attachCommitteeId) : "";
    if (!id) return;
    await onUpdateCommittee?.(id, { convocationId: convIdStr });
    setAttachCommitteeId(null);
  }, [attachCommitteeId, canWrite, convIdStr, onUpdateCommittee]);

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
              <div className="admin-events-editor__subtitle">
                {`${nameValue || `Созыв ${String(numberValue)}`}${yearsValue ? ` • ${yearsValue}` : ""}`}
              </div>
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
          <Form.Item label="Отображаемое название" name="name">
            <Input placeholder="Например: Седьмой созыв Верховного Хурала" disabled={loading || saving} />
          </Form.Item>
          <Form.Item label="Годы созыва" name="years">
            <Input placeholder="2024–2029" disabled={loading || saving} />
          </Form.Item>
          <div className="admin-events-editor__section-title">Статистика созыва</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <Form.Item label="Депутатов" name="deputies">
              <InputNumber min={0} style={{ width: "100%" }} disabled={loading || saving} />
            </Form.Item>
            <Form.Item label="Законов" name="laws">
              <InputNumber min={0} style={{ width: "100%" }} disabled={loading || saving} />
            </Form.Item>
            <Form.Item label="Постановлений" name="resolutions">
              <InputNumber min={0} style={{ width: "100%" }} disabled={loading || saving} />
            </Form.Item>
          </div>

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

      {mode === "edit" && convIdStr ? (
        <div className="admin-card" style={{ marginTop: 16 }}>
          <div className="admin-events-editor__section-title">Комитеты созыва</div>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Button
                type="primary"
                disabled={!canWrite}
                onClick={() => navigate(`/admin/committees/create?convocationId=${encodeURIComponent(convIdStr)}`)}
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
                      {Array.isArray(c?.members) && c.members.length > 0 ? (
                        <div style={{ display: "grid", gap: 4, fontSize: 13, color: "#475569" }}>
                          {c.members.map((member, index) => {
                            const memberName = String(
                              member?.name || member?.person?.fullName || member?.person?.name || ""
                            ).trim();
                            if (!memberName) return null;
                            return (
                              <div key={`${id}-member-${index}`}>
                                {memberName}
                                {member?.role ? ` — ${member.role}` : ""}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <Button
                          disabled={!canWrite}
                          onClick={() => navigate(`/admin/committees/edit/${encodeURIComponent(id)}`)}
                        >
                          Редактировать
                        </Button>
                        <Button danger disabled={!canWrite} onClick={() => detach(id)}>
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
