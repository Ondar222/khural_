import React from "react";
import { Button, Input, Form } from "antd";
import { useHashRoute } from "../../Router.jsx";
import AdminShell from "./AdminShell.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";
import TinyMCEEditor from "../../components/TinyMCEEditor.jsx";
import { stripHtmlTags } from "../../utils/html.js";

const DETAIL_FIELDS = [
  { name: "parentBody", label: "Орган (подзаголовок)", placeholder: "ВЕРХОВНЫЙ ХУРАЛ (ПАРЛАМЕНТ) РЕСПУБЛИКИ ТЫВА" },
  { name: "documentType", label: "Тип документа", placeholder: "ПОСТАНОВЛЕНИЕ" },
  { name: "resolutionDate", label: "Дата постановления", placeholder: "от 16 марта 2022 г." },
  { name: "resolutionNumber", label: "Номер постановления", placeholder: "№ 1388 ПВХ-III" },
];

export default function AdminCommissionsEditPage() {
  const adminData = useAdminData();
  const { navigate, route } = useHashRoute();
  const id = React.useMemo(() => {
    const match = route?.match(/\/admin\/commissions\/edit\/(.+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }, [route]);
  const [form] = Form.useForm();

  const commission = React.useMemo(
    () => (Array.isArray(adminData.commissions) ? adminData.commissions.find((c) => String(c?.id) === id) : null),
    [adminData.commissions, id]
  );

  React.useEffect(() => {
    if (commission) {
      form.setFieldsValue({
        id: commission.id,
        name: stripHtmlTags(commission.name || "").trim() || commission.name || "",
        parentBody: commission.parentBody ?? "",
        documentType: commission.documentType ?? "",
        resolutionDate: commission.resolutionDate ?? "",
        resolutionNumber: commission.resolutionNumber ?? "",
        resolutionSubject: commission.resolutionSubject ?? "",
        bodyHtml: commission.bodyHtml ?? "",
      });
    } else if (id) {
      form.setFieldsValue({
        id,
        name: "",
        parentBody: "",
        documentType: "",
        resolutionDate: "",
        resolutionNumber: "",
        resolutionSubject: "",
        bodyHtml: "",
      });
    }
  }, [commission, id, form]);

  const handleFinish = React.useCallback(
    async (values) => {
      const nameRaw = values.name != null ? String(values.name) : "";
      const name = stripHtmlTags(nameRaw).trim();
      if (!name) return;
      await adminData.updateCommission(id, {
        name,
        parentBody: values.parentBody != null ? String(values.parentBody).trim() : undefined,
        documentType: values.documentType != null ? String(values.documentType).trim() : undefined,
        resolutionDate: values.resolutionDate != null ? String(values.resolutionDate).trim() : undefined,
        resolutionNumber: values.resolutionNumber != null ? String(values.resolutionNumber).trim() : undefined,
        resolutionSubject: values.resolutionSubject != null ? String(values.resolutionSubject).trim() : undefined,
        bodyHtml: values.bodyHtml != null ? String(values.bodyHtml).trim() : undefined,
      });
      navigate("/admin/commissions");
    },
    [adminData, id, navigate]
  );

  if (!id) {
    return (
      <AdminShell
        activeKey="commissions"
        title="Редактирование комиссии"
        user={adminData.user}
        themeMode={adminData.themeMode}
        onToggleTheme={adminData.toggleTheme}
        onLogout={adminData.handleLogout}
      >
        <div className="admin-card">Не указан ID комиссии.</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      activeKey="commissions"
      title="Редактировать комиссию"
      subtitle={id}
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      <div className="admin-card admin-commissions-edit">
        <Form form={form} layout="vertical" onFinish={handleFinish} className="admin-commissions-edit-form">
          <Form.Item name="id" label="ID">
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="name"
            label="Название комиссии"
            rules={[{ required: true, message: "Введите название" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Например: Наградная комиссия Верховного Хурала (парламента) Республики Тыва"
              className="admin-commissions-edit__name"
            />
          </Form.Item>

          <div className="admin-commissions-edit__section-title">
            Контент страницы (постановление)
          </div>
          {DETAIL_FIELDS.map(({ name: fieldName, label, placeholder }) => (
            <Form.Item key={fieldName} name={fieldName} label={label}>
              <Input placeholder={placeholder} />
            </Form.Item>
          ))}
          <Form.Item
            name="resolutionSubject"
            label="Тема постановления"
            getValueFromEvent={(v) => v}
          >
            <TinyMCEEditor
              placeholder="О НАГРАДНОЙ КОМИССИИ ВЕРХОВНОГО ХУРАЛА..."
              height={100}
              minHeight={60}
            />
          </Form.Item>
          <Form.Item
            name="bodyHtml"
            label="Текст постановления"
            getValueFromEvent={(v) => v}
            tooltip="Основной текст постановления: абзацы, списки, ссылки"
          >
            <TinyMCEEditor
              placeholder="В соответствии с постановлением... 1. Утвердить..."
              height={420}
              minHeight={280}
            />
          </Form.Item>

          <Form.Item className="admin-commissions-edit__actions">
            <Button type="primary" htmlType="submit" loading={adminData.busy} disabled={!adminData.canWrite}>
              Сохранить
            </Button>
            <Button onClick={() => navigate("/admin/commissions")}>Отмена</Button>
            <Button
              type="link"
              onClick={() => window.open(`/commission?id=${encodeURIComponent(id)}`, "_blank")}
            >
              Открыть страницу комиссии
            </Button>
          </Form.Item>
        </Form>
      </div>
    </AdminShell>
  );
}
