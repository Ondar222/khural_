import React from "react";
import { App, Button, Form, Input, Select, Space, Upload, Modal, Checkbox } from "antd";
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
  const receptionRaw = row.receptionSchedule || row.reception_schedule || "";
  const receptionText =
    typeof receptionRaw === "string"
      ? receptionRaw
      : receptionRaw && typeof receptionRaw === "object" && typeof receptionRaw.notes === "string"
        ? receptionRaw.notes
        : "";
  return {
    fullName: row.fullName || row.full_name || row.name || "",
    faction: row.faction || "",
    electoralDistrict: row.electoralDistrict || row.electoral_district || row.district || "",
    convocations: (() => {
      const fromRel = Array.isArray(row.convocations)
        ? row.convocations
            .map((c) => (typeof c === "string" ? c : c?.name || c?.title || c?.label || ""))
            .map((x) => String(x || "").trim())
            .filter(Boolean)
        : [];
      const one = String(row.convocationNumber || row.convocation || row.convocation_number || "").trim();
      return [...new Set([...fromRel, ...(one ? [one] : [])])];
    })(),
    mandateEnded: Boolean(row.mandateEnded ?? row.mandate_ended),
    isDeceased: Boolean(row.isDeceased ?? row.is_deceased),
    structureType: row.structureType || row.structure_type || "",
    role: row.role || "",
    // API can store HTML as escaped text; decode so admin sees real tags (<p>..</p>).
    biography: decodeHtmlEntities(biographyRaw),
    email: row.email || row.contacts?.email || "",
    phoneNumber: row.phoneNumber || row.phone_number || row.contacts?.phone || row.phone || "",
    address: row.address || row.contacts?.address || "",
    receptionSchedule: decodeHtmlEntities(receptionText),
  };
}

export default function AdminDeputyEditor({ mode, deputyId, canWrite }) {
  const { message } = App.useApp();
  const { navigate } = useHashRoute();
  const { reload, deputies, factions, districts, convocations: structureConvocations, setFactions } = useData();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(mode === "edit");
  const [saving, setSaving] = React.useState(false);
  const [photoFile, setPhotoFile] = React.useState(null);
  const structureType = Form.useWatch("structureType", form);
  const isDeceased = Form.useWatch("isDeceased", form);
  const biographyHtml = Form.useWatch("biography", form);
  const fullNameValue = Form.useWatch("fullName", form);
  const [newFactionOpen, setNewFactionOpen] = React.useState(false);
  const [newFactionName, setNewFactionName] = React.useState("");
  const [lookupBusy, setLookupBusy] = React.useState(false);
  const [factionEntities, setFactionEntities] = React.useState([]);
  const [districtEntities, setDistrictEntities] = React.useState([]);
  const [convocationEntities, setConvocationEntities] = React.useState([]);

  const refreshLookups = React.useCallback(async () => {
    setLookupBusy(true);
    try {
      const [fs, ds, cs] = await Promise.all([
        PersonsApi.listFactionsAll().catch(() => []),
        PersonsApi.listDistrictsAll().catch(() => []),
        PersonsApi.listConvocationsAll().catch(() => []),
      ]);
      setFactionEntities(Array.isArray(fs) ? fs : []);
      setDistrictEntities(Array.isArray(ds) ? ds : []);
      setConvocationEntities(Array.isArray(cs) ? cs : []);
    } finally {
      setLookupBusy(false);
    }
  }, []);

  React.useEffect(() => {
    refreshLookups();
  }, [refreshLookups]);

  React.useEffect(() => {
    if (isDeceased) form.setFieldValue("mandateEnded", true);
  }, [isDeceased, form]);

  const normKey = React.useCallback((v) => {
    return String(v || "")
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }, []);

  const findEntityByName = React.useCallback(
    (list, name) => {
      const n = normKey(name);
      if (!n) return null;
      const arr = Array.isArray(list) ? list : [];
      return arr.find((x) => normKey(x?.name) === n) || null;
    },
    [normKey]
  );

  const ensureFaction = React.useCallback(
    async (name) => {
      const s = String(name || "").trim();
      if (!s) return null;
      const found = findEntityByName(factionEntities, s);
      if (found) return found;
      if (!canWrite) return null;
      await PersonsApi.createFaction({ name: s });
      await refreshLookups();
      return findEntityByName(factionEntities, s);
    },
    [canWrite, factionEntities, findEntityByName, refreshLookups]
  );

  const ensureDistrict = React.useCallback(
    async (name) => {
      const s = String(name || "").trim();
      if (!s) return null;
      const found = findEntityByName(districtEntities, s);
      if (found) return found;
      if (!canWrite) return null;
      await PersonsApi.createDistrict({ name: s });
      await refreshLookups();
      return findEntityByName(districtEntities, s);
    },
    [canWrite, districtEntities, findEntityByName, refreshLookups]
  );

  const ensureConvocation = React.useCallback(
    async (name) => {
      const s = String(name || "").trim();
      if (!s) return null;
      const found = findEntityByName(convocationEntities, s);
      if (found) return found;
      if (!canWrite) return null;
      await PersonsApi.createConvocation({ name: s });
      await refreshLookups();
      return findEntityByName(convocationEntities, s);
    },
    [canWrite, convocationEntities, findEntityByName, refreshLookups]
  );

  const enrichRelations = React.useCallback(
    async (raw) => {
      const body = raw && typeof raw === "object" ? { ...raw } : {};

      // Explicitly preserve status fields as booleans
      body.mandateEnded = Boolean(body.mandateEnded);
      body.isDeceased = Boolean(body.isDeceased);
      if (body.isDeceased) body.mandateEnded = true;

      // factionIds
      const factionName = String(body.faction || "").trim();
      if (factionName) {
        const f = await ensureFaction(factionName).catch(() => null);
        if (f?.id) body.factionIds = [String(f.id)];
      }

      // districtIds
      const districtName = String(body.electoralDistrict || "").trim();
      if (districtName) {
        const d = await ensureDistrict(districtName).catch(() => null);
        if (d?.id) body.districtIds = [String(d.id)];
      }

      // convocationIds (multi)
      const convNames = Array.isArray(body.convocations)
        ? body.convocations.map((x) => String(x || "").trim()).filter(Boolean)
        : [];
      if (convNames.length) {
        const ensured = await Promise.all(convNames.map((n) => ensureConvocation(n).catch(() => null)));
        const ids = ensured.filter((x) => x?.id).map((x) => String(x.id));
        if (ids.length) body.convocationIds = ids;
      }

      return body;
    },
    [ensureFaction, ensureDistrict, ensureConvocation]
  );

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
      const bodyRaw = {
        ...values,
        // Для API отправляем description, локально храним biography
        description: values.biography || "",
        bio: undefined,
      };
      const body = await enrichRelations(bodyRaw);

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
        const payload = toPersonsApiBody(body);
        console.log("[AdminDeputyEditor] Sending PATCH payload:", { mandateEnded: payload.mandateEnded, isDeceased: payload.isDeceased, ...payload });
        await PersonsApi.patch(id, payload);
        if (photoFile) await PersonsApi.uploadMedia(id, photoFile);
        message.success("Депутат обновлён");
        reload();
        navigate("/admin/deputies");
      } catch (e) {
        // If data patch fails (often due to validation), still try to upload photo so it appears on the site.
        if (photoFile) {
          try {
            await PersonsApi.uploadMedia(id, photoFile);
            message.success("Фото загружено");
            reload();
            navigate("/admin/deputies");
            return;
          } catch {
            // fall through to local override warning
          }
        }
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
        initialValues={{
          biography: "",
          structureType: undefined,
          role: undefined,
          convocations: [],
          mandateEnded: false,
          isDeceased: false,
        }}
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
              <Form.Item
                label="Созывы"
                name="convocations"
                tooltip="Можно выбрать несколько созывов. Теги можно вводить вручную."
              >
                <Select
                  disabled={loading || saving || lookupBusy}
                  mode="tags"
                  tokenSeparators={[","]}
                  placeholder="Например: VIII, VII"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={(
                    Array.isArray(convocationEntities) && convocationEntities.length
                      ? convocationEntities.map((c) => c?.name)
                      : Array.isArray(structureConvocations)
                        ? structureConvocations
                        : []
                  )
                    .filter((x) => x && String(x).trim() !== "")
                    .map((x) => ({ value: String(x), label: String(x) }))}
                />
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
            <div className="admin-split" style={{ marginTop: 6 }}>
              <Form.Item name="mandateEnded" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Checkbox disabled={loading || saving}>Созыв завершен (прекратил полномочия)</Checkbox>
              </Form.Item>
              <Form.Item name="isDeceased" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Checkbox disabled={loading || saving}>Умер</Checkbox>
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
            <Form.Item
              label="График приема граждан (HTML)"
              name="receptionSchedule"
              tooltip="Любой HTML: p, h1-h6, strong/em, ul/ol/li, a и т.д. Сохраняется как есть (в notes)."
            >
              <Input.TextArea
                disabled={loading || saving}
                autoSize={{ minRows: 6, maxRows: 14 }}
                placeholder="<p>Пн–Пт: 09:00–18:00</p>\n<p>Сб: 10:00–14:00</p>"
                style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
              />
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


