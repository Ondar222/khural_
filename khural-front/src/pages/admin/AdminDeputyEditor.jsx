import React from "react";
import { App, Button, Form, Input, Select, Space, Upload, Modal } from "antd";
import { useHashRoute } from "../../Router.jsx";
import { PersonsApi } from "../../api/client.js";
import { useData } from "../../context/DataContext.jsx";
import { toPersonsApiBody } from "../../api/personsPayload.js";
import { readDeputiesOverrides, writeDeputiesOverrides } from "./deputiesOverrides.js";
import { decodeHtmlEntities } from "../../utils/html.js";

const STRUCTURE_TYPE_OPTIONS = [
  { value: "committee", label: "Комитет" },
  { value: "parliament_leadership", label: "Руководство парламента" },
  { value: "commission", label: "Комиссия" },
  { value: "apparatus", label: "Аппарат" },
  {
    value: "municipal_council",
    label: "Совет по взаимодействию с представительными органами муниципальных образований",
  },
  { value: "youth_khural", label: "Молодежный Хурал" },
  { value: "federation_council", label: "Представительство в Совете Федерации" },
];

const ROLE_OPTIONS_BY_STRUCTURE = {
  committee: [
    { value: "member", label: "Член комитета" },
    { value: "chairman", label: "Председатель комитета" },
    { value: "vice_chairman", label: "Заместитель председателя комитета" },
  ],
  parliament_leadership: [
    { value: "member", label: "Член руководства" },
    { value: "chairman", label: "Председатель" },
    { value: "vice_chairman", label: "Заместитель председателя" },
  ],
  commission: [
    { value: "member", label: "Член комиссии" },
    { value: "chairman", label: "Председатель комиссии" },
    { value: "vice_chairman", label: "Заместитель председателя комиссии" },
  ],
  apparatus: [
    { value: "member", label: "Член аппарата" },
    { value: "leader", label: "Руководитель аппарата" },
  ],
  municipal_council: [
    { value: "member", label: "Член совета" },
    { value: "chairman", label: "Председатель совета" },
    { value: "vice_chairman", label: "Заместитель председателя совета" },
  ],
  youth_khural: [
    { value: "member", label: "Член Молодежного Хурала" },
    { value: "chairman", label: "Председатель Молодежного Хурала" },
    { value: "vice_chairman", label: "Заместитель председателя Молодежного Хурала" },
  ],
  federation_council: [
    { value: "member", label: "Член представительства" },
    { value: "leader", label: "Руководитель представительства" },
  ],
};

function getLocalDeputyById(list, id) {
  const arr = Array.isArray(list) ? list : [];
  return arr.find((x) => String(x?.id ?? "") === String(id)) || null;
}

function normalizeInitial(d) {
  const row = d && typeof d === "object" ? d : {};
  const biographyRaw = row.biography || row.bio || row.description || "";
  return {
    fullName: row.fullName || row.full_name || row.name || "",
    faction: row.faction || "",
    electoralDistrict: row.electoralDistrict || row.electoral_district || row.district || "",
    convocationNumber: row.convocationNumber || row.convocation || row.convocation_number || "",
    structureType: row.structureType || row.structure_type || "",
    role: row.role || "",
    // API can store HTML as escaped text; decode so admin sees real tags (<p>..</p>).
    biography: decodeHtmlEntities(biographyRaw),
    email: row.email || row.contacts?.email || "",
    phoneNumber: row.phoneNumber || row.phone_number || row.contacts?.phone || row.phone || "",
    address: row.address || row.contacts?.address || "",
    receptionSchedule: row.receptionSchedule || row.reception_schedule || "",
  };
}

export default function AdminDeputyEditor({ mode, deputyId, canWrite }) {
  const { message } = App.useApp();
  const { navigate } = useHashRoute();
  const { reload, deputies, factions, districts, setFactions } = useData();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(mode === "edit");
  const [saving, setSaving] = React.useState(false);
  const [photoFile, setPhotoFile] = React.useState(null);
  const structureType = Form.useWatch("structureType", form);
  const biographyHtml = Form.useWatch("biography", form);
  const fullNameValue = Form.useWatch("fullName", form);
  const [newFactionOpen, setNewFactionOpen] = React.useState(false);
  const [newFactionName, setNewFactionName] = React.useState("");

  React.useEffect(() => {
    if (mode !== "edit") return;
    const id = String(deputyId || "");
    if (!id) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        // Try API; fallback to local list
        const fromApi = await PersonsApi.getById(id).catch(() => null);
        const fromLocal = getLocalDeputyById(deputies, id);
        const src = fromApi || fromLocal;
        if (!alive) return;
        form.setFieldsValue(normalizeInitial(src));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [mode, deputyId, deputies, form]);

  React.useEffect(() => {
    if (!structureType) return;
    const allowed = new Set((ROLE_OPTIONS_BY_STRUCTURE[structureType] || []).map((o) => o.value));
    const current = form.getFieldValue("role");
    if (current && !allowed.has(current)) form.setFieldValue("role", undefined);
  }, [structureType, form]);

  const saveOverridesUpdate = React.useCallback((id, body) => {
    const next = readDeputiesOverrides();
    const updatedById = next.updatedById && typeof next.updatedById === "object" ? next.updatedById : {};
    writeDeputiesOverrides({
      ...next,
      updatedById: {
        ...updatedById,
        [String(id)]: { ...body, id: String(id) },
      },
    });
  }, []);

  const saveOverridesCreate = React.useCallback((item) => {
    const next = readDeputiesOverrides();
    const created = Array.isArray(next.created) ? next.created : [];
    writeDeputiesOverrides({ ...next, created: [item, ...created] });
  }, []);

  const onSave = async () => {
    if (!canWrite) return;
    setSaving(true);
    try {
      const values = await form.validateFields();
      const body = {
        ...values,
        // Для API отправляем description, локально храним biography
        description: values.biography || "",
        bio: undefined,
      };

      if (mode === "create") {
        try {
          const created = await PersonsApi.create(toPersonsApiBody(body));
          const id = created?.id ?? created?._id ?? created?.personId;
          if (id && photoFile) await PersonsApi.uploadMedia(id, photoFile);
          message.success("Депутат создан");
          reload();
          navigate("/admin/deputies");
        } catch (e) {
          const localId = `local-${Date.now()}`;
          saveOverridesCreate({ ...body, id: localId });
          message.warning("Создано локально (сервер недоступен или нет прав)");
          reload();
          navigate("/admin/deputies");
        }
        return;
      }

      // edit
      const id = String(deputyId || "");
      if (!id) throw new Error("Не удалось определить ID депутата");
      try {
        await PersonsApi.patch(id, toPersonsApiBody(body));
        if (photoFile) await PersonsApi.uploadMedia(id, photoFile);
        message.success("Депутат обновлён");
        reload();
        navigate("/admin/deputies");
      } catch (e) {
        saveOverridesUpdate(id, { ...body, id });
        message.warning("Обновлено локально (сервер недоступен или нет прав)");
        reload();
        navigate("/admin/deputies");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-deputy-editor">
      <div className="admin-deputy-editor__hero">
        <div className="admin-deputy-editor__hero-row">
          <div className="admin-deputy-editor__hero-left">
            <div className="admin-deputy-editor__kicker">Депутаты</div>
            <div className="admin-deputy-editor__title">
              {mode === "create" ? "Создание депутата" : "Редактирование депутата"}
            </div>
            {mode === "edit" && fullNameValue ? (
              <div className="admin-deputy-editor__subtitle">{String(fullNameValue)}</div>
            ) : null}
          </div>
          <div className="admin-deputy-editor__hero-actions">
            <Button onClick={() => navigate("/admin/deputies")}>Отмена</Button>
            <Button type="primary" onClick={onSave} disabled={!canWrite} loading={saving}>
              Сохранить
            </Button>
          </div>
        </div>
      </div>

      <Form
        layout="vertical"
        form={form}
        initialValues={{ biography: "", structureType: undefined, role: undefined }}
      >
        <div className="admin-deputy-editor__grid">
          <div className="admin-card">
            <div className="admin-deputy-editor__section-title">Основное</div>
            <Form.Item label="ФИО" name="fullName" rules={[{ required: true, message: "Укажите ФИО" }]}>
              <Input disabled={loading || saving} />
            </Form.Item>
            <div className="admin-split">
              <Form.Item label="Фракция" name="faction">
                <Select
                  disabled={loading || saving}
                  placeholder="Выберите фракцию"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={(Array.isArray(factions) ? factions : [])
                    .filter((x) => x && String(x).trim() !== "")
                    .map((x) => ({ value: String(x), label: String(x) }))}
                  dropdownRender={(menu) => (
                    <div>
                      {menu}
                      <div style={{ padding: 8, borderTop: "1px solid #f0f0f0" }}>
                        <Button type="dashed" block onClick={() => setNewFactionOpen(true)} disabled={!canWrite}>
                          + Добавить новую фракцию
                        </Button>
                      </div>
                    </div>
                  )}
                />
              </Form.Item>
              <Form.Item label="Округ" name="electoralDistrict">
                <Select
                  disabled={loading || saving}
                  placeholder="Выберите округ"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={(Array.isArray(districts) ? districts : [])
                    .filter((x) => x && String(x).trim() !== "")
                    .map((x) => ({ value: String(x), label: String(x) }))}
                />
              </Form.Item>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-deputy-editor__section-title">Статус</div>
            <div className="admin-split">
              <Form.Item label="Созыв (номер)" name="convocationNumber">
                <Input disabled={loading || saving} />
              </Form.Item>
              <Form.Item label="Тип структуры" name="structureType">
                <Select disabled={loading || saving} placeholder="Выберите тип структуры" allowClear>
                  {STRUCTURE_TYPE_OPTIONS.map((opt) => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            {structureType ? (
              <Form.Item label="Роль" name="role">
                <Select disabled={loading || saving} placeholder="Выберите роль" allowClear>
                  {(ROLE_OPTIONS_BY_STRUCTURE[structureType] || []).map((opt) => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            ) : null}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-deputy-editor__section-title">Биография</div>
          <Form.Item
            label="Биография (HTML)"
            name="biography"
            tooltip="Любой HTML: p, h1-h6, strong/em, ul/ol/li, a, img и т.д. Сохраняется как есть."
          >
            <Input.TextArea
              autoSize={{ minRows: 12, maxRows: 28 }}
              placeholder="<p>Биография</p>\n<h2>Заголовок блока</h2>\n<ul><li>Пункт</li></ul>"
              style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
            />
          </Form.Item>
        </div>

        <div className="admin-deputy-editor__grid">
          <div className="admin-card">
            <div className="admin-deputy-editor__section-title">Контакты</div>
            <div className="admin-split">
              <Form.Item label="Email" name="email">
                <Input type="email" disabled={loading || saving} />
              </Form.Item>
              <Form.Item label="Телефон" name="phoneNumber">
                <Input disabled={loading || saving} />
              </Form.Item>
            </div>
            <Form.Item label="Адрес" name="address">
              <Input.TextArea disabled={loading || saving} autoSize={{ minRows: 2, maxRows: 4 }} />
            </Form.Item>
          </div>

          <div className="admin-card">
            <div className="admin-deputy-editor__section-title">Приём граждан</div>
            <Form.Item label="График приема граждан" name="receptionSchedule">
              <Input.TextArea disabled={loading || saving} autoSize={{ minRows: 6, maxRows: 10 }} />
            </Form.Item>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-deputy-editor__section-title">Фото</div>
          <Form.Item
            label="Фото"
            tooltip="Фото загружается через API /persons/{id}/media (после сохранения)"
          >
            <Upload
              accept="image/*"
              maxCount={1}
              beforeUpload={(file) => {
                setPhotoFile(file);
                return false;
              }}
              showUploadList={true}
            >
              <Button disabled={loading || saving}>Выбрать фото</Button>
            </Upload>
            <div className="admin-hint">
              Для режима “создать” фото загрузится сразу после создания записи на сервере. Если запись создана локально —
              фото не загрузится, пока не будет синхронизации в API.
            </div>
          </Form.Item>
        </div>
      </Form>

      <Modal
        title="Добавить новую фракцию"
        open={newFactionOpen}
        onCancel={() => {
          setNewFactionOpen(false);
          setNewFactionName("");
        }}
        okText="Добавить"
        cancelText="Отмена"
        okButtonProps={{ disabled: !canWrite || !String(newFactionName || "").trim() }}
        onOk={async () => {
          const name = String(newFactionName || "").trim();
          if (!name) return;
          try {
            await PersonsApi.createFaction({ name });
            setFactions((prev) => {
              const arr = Array.isArray(prev) ? prev : [];
              const next = Array.from(new Set([...arr.map(String), name]));
              return next;
            });
            form.setFieldValue("faction", name);
            message.success("Фракция добавлена");
            setNewFactionOpen(false);
            setNewFactionName("");
          } catch (e) {
            message.error(e?.message || "Не удалось добавить фракцию");
          }
        }}
      >
        <Input
          placeholder="Например: Фракция «Единая Тыва»"
          value={newFactionName}
          onChange={(e) => setNewFactionName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
        />
        <div className="admin-hint" style={{ marginTop: 8 }}>
          Фракция будет сохранена в API и появится в выпадающем списке.
        </div>
      </Modal>
    </div>
  );
}


