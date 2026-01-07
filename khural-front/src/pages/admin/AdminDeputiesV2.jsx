import React from "react";
import { App, Button, Input, Modal, Form, Upload, Space, Table, Select } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { PersonsApi } from "../../api/client.js";
import { useData } from "../../context/DataContext.jsx";
import { toPersonsApiBody } from "../../api/personsPayload.js";

const STORAGE_KEY = "khural_deputies_overrides_v1";

function normKey(v) {
  return String(v || "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function toReceptionScheduleText(schedule) {
  if (typeof schedule === "string") return schedule;
  if (!Array.isArray(schedule)) return "";
  return schedule
    .map((x) => {
      const day = x?.day ? String(x.day) : "";
      const time = x?.time ? String(x.time) : "";
      return [day, time].filter(Boolean).join(": ");
    })
    .filter(Boolean)
    .join("\n");
}

function toLegislativeActivity(laws) {
  if (!Array.isArray(laws)) return [];
  return laws.map((x) => ({
    number: x?.title || x?.number || "",
    title: x?.desc || x?.title || "",
    status: x?.status || "",
    document: x?.url || x?.id || "",
  }));
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function readOverrides() {
  if (typeof window === "undefined") return { created: [], updatedById: {}, deletedIds: [] };
  const raw = window.localStorage?.getItem(STORAGE_KEY) || "";
  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== "object") return { created: [], updatedById: {}, deletedIds: [] };
  return {
    created: Array.isArray(parsed.created) ? parsed.created : [],
    updatedById: parsed.updatedById && typeof parsed.updatedById === "object" ? parsed.updatedById : {},
    deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
  };
}

function writeOverrides(next) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("khural:deputies-updated"));
  } catch {
    // ignore
  }
}

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

export default function AdminDeputiesV2({
  items,
  // Keep props for compatibility with AdminDeputiesPage/useAdminData,
  // but we do CRUD here because the original hook/components are root-owned in this env.
  onCreate,
  onUpdate,
  onDelete,
  busy,
  canWrite,
}) {
  const { message } = App.useApp();
  const { reload: reloadPublicData, deputies: publicDeputies } = useData();
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [file, setFile] = React.useState(null);
  const [editFile, setEditFile] = React.useState(null);
  const [editing, setEditing] = React.useState(null);
  const [busyLocal, setBusyLocal] = React.useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [localCreated, setLocalCreated] = React.useState(() => readOverrides().created);
  const [localUpdated, setLocalUpdated] = React.useState(() => readOverrides().updatedById);
  const [localDeleted, setLocalDeleted] = React.useState(() => new Set(readOverrides().deletedIds));

  const structureType = Form.useWatch("structureType", editForm);
  const createStructureType = Form.useWatch("structureType", form);

  // Persist overrides so public site can show newly created/updated deputies immediately.
  React.useEffect(() => {
    writeOverrides({
      created: localCreated,
      updatedById: localUpdated,
      deletedIds: Array.from(localDeleted),
    });
  }, [localCreated, localUpdated, localDeleted]);

  // When structure type changes, clear role if it no longer applies
  React.useEffect(() => {
    if (!structureType) {
      editForm.setFieldValue("role", undefined);
      return;
    }
    const allowed = new Set((ROLE_OPTIONS_BY_STRUCTURE[structureType] || []).map((o) => o.value));
    const current = editForm.getFieldValue("role");
    if (current && !allowed.has(current)) editForm.setFieldValue("role", undefined);
  }, [structureType, editForm]);

  React.useEffect(() => {
    if (!createStructureType) {
      form.setFieldValue("role", undefined);
      return;
    }
    const allowed = new Set(
      (ROLE_OPTIONS_BY_STRUCTURE[createStructureType] || []).map((o) => o.value)
    );
    const current = form.getFieldValue("role");
    if (current && !allowed.has(current)) form.setFieldValue("role", undefined);
  }, [createStructureType, form]);

  const displayItems = React.useMemo(() => {
    const base = Array.isArray(items) ? items : [];
    const out = [];
    const seen = new Set();

    for (const it of base) {
      const id = String(it?.id ?? "");
      if (!id) continue;
      if (localDeleted.has(id)) continue;
      const override = localUpdated[id];
      out.push(override ? { ...it, ...override } : it);
      seen.add(id);
    }

    for (const it of localCreated) {
      const id = String(it?.id ?? "");
      if (!id) continue;
      if (localDeleted.has(id)) continue;
      if (seen.has(id)) continue;
      out.push(it);
      seen.add(id);
    }

    return out;
  }, [items, localCreated, localUpdated, localDeleted]);

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return displayItems;
    return (displayItems || []).filter((p) =>
      String(p.fullName || p.name || "")
        .toLowerCase()
        .includes(qq)
    );
  }, [displayItems, q]);

  const columns = [
    {
      title: "ФИО",
      dataIndex: "fullName",
      render: (_, row) => row.fullName || row.name || "—",
    },
    {
      title: "Фракция",
      dataIndex: "faction",
      width: 180,
      render: (v) => v || "—",
    },
    {
      title: "Округ",
      dataIndex: "electoralDistrict",
      width: 200,
      render: (_, row) => row.electoralDistrict || row.district || "—",
    },
    {
      title: "Действия",
      key: "actions",
      width: 220,
      render: (_, row) => (
        <Space wrap>
          <Button
            onClick={() => {
              setEditing(row);
              const legislativeActivity = Array.isArray(row.legislativeActivity)
                ? row.legislativeActivity
                : [];
              const incomeDeclarations = Array.isArray(row.incomeDeclarations)
                ? row.incomeDeclarations
                : [];
              editForm.setFieldsValue({
                fullName: row.fullName || row.name || "",
                faction: row.faction || "",
                electoralDistrict: row.electoralDistrict || row.district || "",
                email: row.email || row.contacts?.email || "",
                phoneNumber: row.phoneNumber || row.contacts?.phone || row.phone || "",
                address: row.address || row.contacts?.address || "",
                description: row.biography || row.bio || row.description || row.position || "",
                convocationNumber: row.convocationNumber || row.convocation || "",
                structureType: row.structureType || "",
                role: row.role || "",
                receptionSchedule: row.receptionSchedule || "",
                legislativeActivity: legislativeActivity.length > 0 ? legislativeActivity : undefined,
                incomeDeclarations: incomeDeclarations.length > 0 ? incomeDeclarations : undefined,
              });
              setEditFile(null);
              setEditOpen(true);
            }}
            disabled={!canWrite}
          >
            Редактировать
          </Button>
          <Button
            danger
            onClick={async () => {
              if (!canWrite) return;
              const id = String(row?.id ?? "");
              if (!id) return;
              setBusyLocal(true);
              try {
                await PersonsApi.remove(id);
                setLocalDeleted((prev) => new Set([...prev, id]));
                message.success("Депутат удалён");
                reloadPublicData();
              } catch (e) {
                // Fallback: allow local delete even if API is not available or user has no rights.
                setLocalDeleted((prev) => new Set([...prev, id]));
                message.warning("Удалено локально (сервер недоступен или нет прав)");
                reloadPublicData();
              } finally {
                setBusyLocal(false);
              }
            }}
            disabled={!canWrite}
          >
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  const normalizeForUi = React.useCallback((payload) => {
    const p = payload && typeof payload === "object" ? payload : {};
    const id = String(p.id ?? p._id ?? p.personId ?? "");
    const fullName = p.fullName || p.full_name || p.name || "";
    const district = p.electoralDistrict || p.electoral_district || p.district || "";
    const convocation = p.convocationNumber || p.convocation || p.convocation_number || "";
    return {
      ...p,
      id: id || p.id,
      fullName,
      name: p.name || fullName,
      electoralDistrict: p.electoralDistrict || district,
      district: p.district || district,
      convocationNumber: p.convocationNumber || convocation,
      convocation: p.convocation || convocation,
      contacts: p.contacts || {
        phone: p.phoneNumber || p.phone || "",
        email: p.email || "",
        address: p.address || "",
      },
    };
  }, []);

  const syncFromCodeToApi = React.useCallback(() => {
    if (!canWrite) return;
    const list = Array.isArray(publicDeputies) ? publicDeputies : [];
    if (!list.length) {
      message.error("Локальные данные депутатов не найдены (public/data/deputies.json)");
      return;
    }

    Modal.confirm({
      title: "Синхронизировать депутатов в API?",
      content:
        "Возьмём данные из кода (public/data/deputies.json) и создадим отсутствующих депутатов в базе через API. Это нужно для прода, чтобы CRUD работал через сервер.",
      okText: "Синхронизировать",
      cancelText: "Отмена",
      onOk: async () => {
        setBusyLocal(true);
        try {
          const server = await PersonsApi.list().catch(() => []);
          const serverList = Array.isArray(server) ? server : [];
          const existing = new Set(
            serverList.map(
              (p) =>
                `${normKey(p?.fullName || p?.full_name || p?.name)}|${normKey(
                  p?.electoralDistrict || p?.electoral_district || p?.district
                )}`
            )
          );

          let createdCount = 0;
          let skippedCount = 0;
          let photoCount = 0;
          let failedCount = 0;

          for (const d of list) {
            const fullName = d?.fullName || d?.name || "";
            const district = d?.electoralDistrict || d?.electoral_district || d?.district || "";
            const k = `${normKey(fullName)}|${normKey(district)}`;
            if (!normKey(fullName)) {
              skippedCount += 1;
              continue;
            }
            if (existing.has(k)) {
              skippedCount += 1;
              continue;
            }

            const body = toPersonsApiBody({
              fullName,
              electoralDistrict: district,
              faction: d?.faction || "",
              phoneNumber: d?.phoneNumber || d?.contacts?.phone || "",
              email: d?.email || d?.contacts?.email || "",
              address: d?.address || "",
              biography: d?.biography || d?.bio || "",
              description: d?.description || d?.position || "",
              convocationNumber: d?.convocationNumber || d?.convocation || "",
              structureType: d?.structureType || "",
              role: d?.role || "",
              receptionSchedule: d?.receptionSchedule || toReceptionScheduleText(d?.schedule),
              legislativeActivity: Array.isArray(d?.legislativeActivity)
                ? d.legislativeActivity
                : toLegislativeActivity(d?.laws),
              incomeDeclarations: Array.isArray(d?.incomeDeclarations) ? d.incomeDeclarations : [],
            });

            try {
              const created = await PersonsApi.create(body);
              const createdId = created?.id ?? created?._id ?? created?.personId;
              createdCount += 1;
              existing.add(k);

              const photo = d?.photo || d?.image?.link || "";
              if (createdId && photo) {
                try {
                  const abs = new URL(String(photo), window.location.origin).toString();
                  const res = await fetch(abs);
                  if (res.ok) {
                    const blob = await res.blob();
                    const ext = blob.type && blob.type.includes("/") ? blob.type.split("/")[1] : "jpg";
                    const file = new File([blob], `photo.${ext}`, { type: blob.type || "image/jpeg" });
                    await PersonsApi.uploadMedia(createdId, file);
                    photoCount += 1;
                  }
                } catch {
                  // ignore photo errors
                }
              }
            } catch (e) {
              failedCount += 1;
              console.warn("Seed person failed", e);
            }
          }

          message.success(
            `Готово: создано ${createdCount}, пропущено ${skippedCount}, фото ${photoCount}, ошибок ${failedCount}`
          );
          reloadPublicData();
        } finally {
          setBusyLocal(false);
        }
      },
    });
  }, [canWrite, message, publicDeputies, reloadPublicData]);

  const submit = async () => {
    try {
      if (!canWrite) return;
      const values = await form.validateFields();
      setBusyLocal(true);
      const { imageFile, ...body } = { ...values, imageFile: file };
      // Ensure defaults for list fields
      if (!Array.isArray(body.legislativeActivity)) body.legislativeActivity = [];
      if (!Array.isArray(body.incomeDeclarations)) body.incomeDeclarations = [];
      // Keep compatibility: treat "description" form field as biography content
      if (!body.biography) body.biography = body.description || "";
      if (!body.bio) body.bio = body.biography || "";

      let uiItem = null;
      try {
        const created = await PersonsApi.create(toPersonsApiBody(body));
        const createdId = created?.id ?? created?._id ?? created?.personId;
        if (createdId && imageFile) await PersonsApi.uploadMedia(createdId, imageFile);
        uiItem = normalizeForUi({
          ...body,
          ...created,
          id: String(createdId || created?.id || `tmp-${Date.now()}`),
        });
        message.success("Депутат создан");
      } catch (e) {
        // Local-only create (offline / no rights)
        uiItem = normalizeForUi({
          ...body,
          id: `local-${Date.now()}`,
        });
        message.warning("Создано локально (сервер недоступен или нет прав)");
      }

      setLocalCreated((prev) => [uiItem, ...prev]);
      reloadPublicData();
      setOpen(false);
      form.resetFields();
      setFile(null);
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Не удалось создать депутата");
    } finally {
      setBusyLocal(false);
    }
  };

  const submitEdit = async () => {
    try {
      if (!canWrite) return;
      const values = await editForm.validateFields();
      const id = String(editing?.id ?? "");
      if (!id) throw new Error("Не удалось определить ID депутата");
      setBusyLocal(true);

      const { imageFile, ...body } = { ...values, imageFile: editFile };
      if (!Array.isArray(body.legislativeActivity)) body.legislativeActivity = [];
      if (!Array.isArray(body.incomeDeclarations)) body.incomeDeclarations = [];
      // Keep compatibility: treat "description" form field as biography content
      if (!body.biography) body.biography = body.description || "";
      if (!body.bio) body.bio = body.biography || "";

      const uiItem = normalizeForUi({ ...body, id });
      try {
        await PersonsApi.patch(id, toPersonsApiBody(body));
        if (imageFile) await PersonsApi.uploadMedia(id, imageFile);
        setLocalUpdated((prev) => ({ ...prev, [id]: uiItem }));
        message.success("Депутат обновлён");
        reloadPublicData();
      } catch (e) {
        // Local-only update (offline / no rights)
        setLocalUpdated((prev) => ({ ...prev, [id]: uiItem }));
        message.warning("Обновлено локально (сервер недоступен или нет прав)");
        reloadPublicData();
      }
      setEditOpen(false);
      setEditing(null);
      editForm.resetFields();
      setEditFile(null);
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Не удалось обновить депутата");
    } finally {
      setBusyLocal(false);
    }
  };

  return (
    <div className="admin-grid">
      <div className="admin-card admin-toolbar">
        <Input
          placeholder="Поиск по ФИО..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-input"
        />
        <Space wrap>
          <Button type="primary" onClick={() => setOpen(true)} disabled={!canWrite} loading={busy}>
            + Добавить депутата
          </Button>
          <Button onClick={syncFromCodeToApi} disabled={!canWrite} loading={Boolean(busyLocal)}>
            Синхронизировать из кода в API
          </Button>
        </Space>
      </div>

      <div className="admin-card admin-table">
        <Table
          rowKey={(r) => String(r.id)}
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title="Добавить депутата"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={submit}
        okText="Добавить"
        confirmLoading={Boolean(busy || busyLocal)}
        okButtonProps={{ disabled: !canWrite }}
        width={800}
        style={{ top: 20 }}
      >
        <Form layout="vertical" form={form} style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "8px" }}>
          <Form.Item label="ФИО" name="fullName" rules={[{ required: true, message: "Укажите ФИО" }]}>
            <Input />
          </Form.Item>

          <div className="admin-split">
            <Form.Item label="Фракция" name="faction">
              <Input placeholder="Текст" />
            </Form.Item>
            <Form.Item label="Округ" name="electoralDistrict">
              <Input />
            </Form.Item>
          </div>

          <div className="admin-split">
            <Form.Item label="Созыв (номер)" name="convocationNumber">
              <Input type="number" placeholder="Номер созыва" />
            </Form.Item>
            <Form.Item label="Тип структуры" name="structureType">
              <Select placeholder="Выберите тип структуры" allowClear>
                {STRUCTURE_TYPE_OPTIONS.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {createStructureType ? (
            <Form.Item label="Роль" name="role">
              <Select placeholder="Выберите роль" allowClear>
                {(ROLE_OPTIONS_BY_STRUCTURE[createStructureType] || []).map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          ) : null}

          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "16px", marginTop: "16px" }}>
            <div style={{ marginBottom: "12px" }}>Контакты</div>
            <div className="admin-split">
              <Form.Item label="Email" name="email">
                <Input type="email" />
              </Form.Item>
              <Form.Item label="Телефон" name="phoneNumber">
                <Input />
              </Form.Item>
            </div>
            <Form.Item label="Адрес" name="address">
              <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
            </Form.Item>
          </div>

          <Form.Item label="График приема граждан" name="receptionSchedule">
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} placeholder="Текст графика приема" />
          </Form.Item>

          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "16px", marginTop: "16px" }}>
            <div style={{ marginBottom: "12px" }}>Законодательная деятельность</div>
            <Form.List name="legislativeActivity" initialValue={[]}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} style={{ display: "flex", marginBottom: 8, gap: 8, alignItems: "flex-start" }}>
                      <Form.Item {...restField} name={[name, "number"]} style={{ flex: 1, marginBottom: 0 }}>
                        <Input placeholder="Номер" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, "title"]} style={{ flex: 2, marginBottom: 0 }}>
                        <Input placeholder="Название" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, "status"]} style={{ flex: 1, marginBottom: 0 }}>
                        <Input placeholder="Статус" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, "document"]} style={{ flex: 1, marginBottom: 0 }}>
                        <Input placeholder="Документ (ссылка/ID)" />
                      </Form.Item>
                      <Button
                        type="text"
                        danger
                        onClick={() => remove(name)}
                        icon={<MinusCircleOutlined />}
                        style={{ marginTop: 4 }}
                      />
                    </div>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Добавить документ
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </div>

          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "16px", marginTop: "16px" }}>
            <div style={{ marginBottom: "12px" }}>Сведения о доходах</div>
            <Form.List name="incomeDeclarations" initialValue={[]}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} style={{ display: "flex", marginBottom: 8, gap: 8, alignItems: "flex-start" }}>
                      <Form.Item {...restField} name={[name, "title"]} style={{ flex: 2, marginBottom: 0 }}>
                        <Input placeholder="Название" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, "document"]} style={{ flex: 2, marginBottom: 0 }}>
                        <Input placeholder="Документ (ссылка/ID)" />
                      </Form.Item>
                      <Button
                        type="text"
                        danger
                        onClick={() => remove(name)}
                        icon={<MinusCircleOutlined />}
                        style={{ marginTop: 4 }}
                      />
                    </div>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Добавить сведение о доходах
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </div>

          <Form.Item label="Биография" name="description">
            <Input.TextArea autoSize={{ minRows: 4, maxRows: 10 }} />
          </Form.Item>

          <Form.Item label="Фото (опционально)">
            <Upload
              accept="image/*"
              maxCount={1}
              beforeUpload={(f) => {
                setFile(f);
                return false;
              }}
              onRemove={() => setFile(null)}
            >
              <Button>Загрузить</Button>
            </Upload>
          </Form.Item>
        </Form>

        {!canWrite ? (
          <div className="admin-hint">Для записи в API войдите (или настройте API базу).</div>
        ) : null}
      </Modal>

      <Modal
        title="Редактировать депутата"
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          setEditing(null);
          setEditFile(null);
        }}
        onOk={submitEdit}
        okText="Сохранить"
        confirmLoading={Boolean(busy || busyLocal)}
        okButtonProps={{ disabled: !canWrite }}
        width={800}
        style={{ top: 20 }}
      >
        <Form layout="vertical" form={editForm} style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "8px" }}>
          <Form.Item label="ФИО" name="fullName" rules={[{ required: true, message: "Укажите ФИО" }]}>
            <Input />
          </Form.Item>

          <div className="admin-split">
            <Form.Item label="Фракция" name="faction">
              <Input placeholder="Текст" />
            </Form.Item>
            <Form.Item label="Округ" name="electoralDistrict">
              <Input />
            </Form.Item>
          </div>

          <div className="admin-split">
            <Form.Item label="Созыв (номер)" name="convocationNumber">
              <Input type="number" placeholder="Номер созыва" />
            </Form.Item>
            <Form.Item label="Тип структуры" name="structureType">
              <Select placeholder="Выберите тип структуры" allowClear>
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
              <Select placeholder="Выберите роль" allowClear>
                {(ROLE_OPTIONS_BY_STRUCTURE[structureType] || []).map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          ) : null}

          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "16px", marginTop: "16px" }}>
            <div style={{ marginBottom: "12px" }}>Контакты</div>
            <div className="admin-split">
              <Form.Item label="Email" name="email">
                <Input type="email" />
              </Form.Item>
              <Form.Item label="Телефон" name="phoneNumber">
                <Input />
              </Form.Item>
            </div>
            <Form.Item label="Адрес" name="address">
              <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
            </Form.Item>
          </div>

          <Form.Item label="График приема граждан" name="receptionSchedule">
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} placeholder="Текст графика приема" />
          </Form.Item>

          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "16px", marginTop: "16px" }}>
            <div style={{ marginBottom: "12px" }}>Законодательная деятельность</div>
            <Form.List name="legislativeActivity" initialValue={[]}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} style={{ display: "flex", marginBottom: 8, gap: 8, alignItems: "flex-start" }}>
                      <Form.Item {...restField} name={[name, "number"]} style={{ flex: 1, marginBottom: 0 }}>
                        <Input placeholder="Номер" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, "title"]} style={{ flex: 2, marginBottom: 0 }}>
                        <Input placeholder="Название" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, "status"]} style={{ flex: 1, marginBottom: 0 }}>
                        <Input placeholder="Статус" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, "document"]} style={{ flex: 1, marginBottom: 0 }}>
                        <Input placeholder="Документ (ссылка/ID)" />
                      </Form.Item>
                      <Button
                        type="text"
                        danger
                        onClick={() => remove(name)}
                        icon={<MinusCircleOutlined />}
                        style={{ marginTop: 4 }}
                      />
                    </div>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Добавить документ
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </div>

          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "16px", marginTop: "16px" }}>
            <div style={{ marginBottom: "12px" }}>Сведения о доходах</div>
            <Form.List name="incomeDeclarations" initialValue={[]}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} style={{ display: "flex", marginBottom: 8, gap: 8, alignItems: "flex-start" }}>
                      <Form.Item {...restField} name={[name, "title"]} style={{ flex: 2, marginBottom: 0 }}>
                        <Input placeholder="Название" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, "document"]} style={{ flex: 2, marginBottom: 0 }}>
                        <Input placeholder="Документ (ссылка/ID)" />
                      </Form.Item>
                      <Button
                        type="text"
                        danger
                        onClick={() => remove(name)}
                        icon={<MinusCircleOutlined />}
                        style={{ marginTop: 4 }}
                      />
                    </div>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Добавить сведение о доходах
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </div>

          <Form.Item label="Биография" name="description">
            <Input.TextArea autoSize={{ minRows: 4, maxRows: 10 }} />
          </Form.Item>

          <Form.Item label="Фото (опционально)">
            <Upload
              accept="image/*"
              maxCount={1}
              beforeUpload={(f) => {
                setEditFile(f);
                return false;
              }}
              onRemove={() => setEditFile(null)}
            >
              <Button>Загрузить</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}


