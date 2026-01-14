import React from "react";
import { App, Button, Input, Modal, Form, Upload, Space, Table, Select } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";

const STRUCTURE_TYPE_OPTIONS = [
  { value: "committee", label: "Комитет" },
  { value: "parliament_leadership", label: "Руководство парламента" },
  { value: "commission", label: "Комиссия" },
  { value: "apparatus", label: "Аппарат" },
  { value: "municipal_council", label: "Совет по взаимодействию с представительными органами муниципальных образований" },
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

export default function AdminDeputies({ items, onCreate, onUpdate, onDelete, busy, canWrite }) {
  const { message } = App.useApp();
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [file, setFile] = React.useState(null);
  const [editFile, setEditFile] = React.useState(null);
  const [editing, setEditing] = React.useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  
  const structureType = Form.useWatch("structureType", editForm);
  const createStructureType = Form.useWatch("structureType", form);

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return (items || []).filter((p) =>
      String(p.fullName || p.name || "")
        .toLowerCase()
        .includes(qq)
    );
  }, [items, q]);

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
              const legislativeActivity = Array.isArray(row.legislativeActivity) ? row.legislativeActivity : [];
              const incomeDeclarations = Array.isArray(row.incomeDeclarations) ? row.incomeDeclarations : [];
              editForm.setFieldsValue({
                fullName: row.fullName || row.name || "",
                faction: row.faction || "",
                electoralDistrict: row.electoralDistrict || row.district || "",
                email: row.email || "",
                phoneNumber: row.phoneNumber || "",
                address: row.address || "",
                biography: row.biography || row.description || "",
                description: row.description || "",
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
          <Button danger onClick={() => onDelete(row.id)} disabled={!canWrite}>
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  const submit = async () => {
    try {
      const values = await form.validateFields();
      await onCreate({ ...values, imageFile: file });
      setOpen(false);
      form.resetFields();
      setFile(null);
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Не удалось создать депутата");
    }
  };

  const submitEdit = async () => {
    try {
      const values = await editForm.validateFields();
      await onUpdate?.(editing?.id, { ...values, imageFile: editFile });
      setEditOpen(false);
      setEditing(null);
      editForm.resetFields();
      setEditFile(null);
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Не удалось обновить депутата");
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
        confirmLoading={busy}
        okButtonProps={{ disabled: !canWrite }}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="ФИО"
            name="fullName"
            rules={[{ required: true, message: "Укажите ФИО" }]}
          >
            <Input />
          </Form.Item>

          <div className="admin-split">
            <Form.Item label="Фракция" name="faction">
              <Input />
            </Form.Item>
            <Form.Item label="Округ" name="electoralDistrict">
              <Input />
            </Form.Item>
          </div>

          <div className="admin-split">
            <Form.Item label="Email" name="email">
              <Input />
            </Form.Item>
            <Form.Item label="Телефон" name="phoneNumber">
              <Input />
            </Form.Item>
          </div>

          <Form.Item label="Описание" name="description">
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
        confirmLoading={busy}
        okButtonProps={{ disabled: !canWrite }}
        width={800}
        style={{ top: 20 }}
      >
        <Form layout="vertical" form={editForm} style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "8px" }}>
          <Form.Item
            label="ФИО"
            name="fullName"
            rules={[{ required: true, message: "Укажите ФИО" }]}
          >
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

          {structureType && (
            <Form.Item label="Роль" name="role">
              <Select placeholder="Выберите роль" allowClear>
                {(ROLE_OPTIONS_BY_STRUCTURE[structureType] || []).map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item label="Биография (HTML)" name="biography">
            <Input.TextArea 
              autoSize={{ minRows: 6, maxRows: 12 }} 
              placeholder="Введите HTML-код биографии"
            />
          </Form.Item>

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

          <Form.Item
            label="График приема граждан (HTML)"
            name="receptionSchedule"
            tooltip="Любой HTML: p, h1-h6, strong/em, ul/ol/li, a и т.д. Сохраняется как есть (в notes)."
          >
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 8 }}
              placeholder="<p>Пн–Пт: 09:00–18:00</p>\n<p>Сб: 10:00–14:00</p>"
              style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
            />
          </Form.Item>

          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "16px", marginTop: "16px" }}>
            <div style={{ marginBottom: "12px" }}>Законодательная деятельность</div>
            <Form.List name="legislativeActivity" initialValue={[]}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} style={{ display: "flex", marginBottom: 8, gap: 8, alignItems: "flex-start" }}>
                      <Form.Item
                        {...restField}
                        name={[name, "number"]}
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <Input placeholder="Номер" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "title"]}
                        style={{ flex: 2, marginBottom: 0 }}
                      >
                        <Input placeholder="Название" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "status"]}
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <Input placeholder="Статус" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "document"]}
                        style={{ flex: 1, marginBottom: 0 }}
                      >
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
                      <Form.Item
                        {...restField}
                        name={[name, "title"]}
                        style={{ flex: 2, marginBottom: 0 }}
                      >
                        <Input placeholder="Название" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "document"]}
                        style={{ flex: 2, marginBottom: 0 }}
                      >
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

          <Form.Item label="Описание" name="description">
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
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



