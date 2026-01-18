import React from "react";
import { App, Button, Form, Input, Switch, Select } from "antd";
import { useHashRoute } from "../../Router.jsx";

export default function AdminCommitteesEditor({
  mode,
  committeeId,
  items,
  convocations,
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

  const nameValue = Form.useWatch("name", form);

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
        isActive: found.isActive !== false,
        convocationId: found.convocation?.id || found.convocationId || null,
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
      
      // ВАЖНО: Временно делаем convocationId необязательным для диагностики
      // Если бэкенд не поддерживает это поле, его отправка может вызвать 500 ошибку
      let convocationId = null;
      if (values.convocationId) {
        convocationId = Number(values.convocationId);
        if (isNaN(convocationId) || convocationId <= 0) {
          console.warn("[AdminCommitteesEditor] Неверный ID созыва:", values.convocationId);
          convocationId = null;
        } else {
          // Проверяем, существует ли созыв в списке
          const convocationExists = (convocations || []).some(c => Number(c.id) === convocationId);
          if (!convocationExists) {
            console.warn("[AdminCommitteesEditor] Созыв не найден в списке:", convocationId, convocations);
          }
        }
      }
      
      // Формируем payload для отправки на бэкенд
      // Используем такой же формат, как в других успешно работающих формах
      const payload = {
        name: String(values.name).trim(),
        isActive: values.isActive !== false,
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
      
      // ВАЖНО: Не отправляем convocationId, т.к. бэкенд может его не поддерживать
      // и это вызывает 500 ошибку. Поле можно будет добавить позже, когда бэкенд будет готов.
      // if (convocationId) {
      //   payload.convocationId = convocationId;
      // }
      
      console.log("[AdminCommitteesEditor] ⚠️ Отправка payload на https://someshit.yurta.site/committees:");
      console.log("[AdminCommitteesEditor] Payload:", JSON.stringify(payload, null, 2));
      console.log("[AdminCommitteesEditor] Типы данных:", {
        name: typeof payload.name + " = " + payload.name,
        isActive: typeof payload.isActive + " = " + payload.isActive,
        description: payload.description ? typeof payload.description + " (length: " + payload.description.length + ")" : "undefined",
        phone: payload.phone ? typeof payload.phone : "undefined",
        email: payload.email ? typeof payload.email : "undefined",
        address: payload.address ? typeof payload.address : "undefined",
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
          initialValues={{ isActive: true }}
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
              rules={[{ required: false, message: "Выберите созыв" }]}
              // ВРЕМЕННО необязательное поле для диагностики проблемы 500 на бэкенде
              // Если комитет создастся без convocationId, значит проблема была в этом поле
              style={{ marginBottom: 0 }}
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
                {(convocations || []).map((c) => (
                  <Select.Option key={c.id} value={c.id}>
                    {c.name || c.number || `Созыв ${c.id}`}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

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
              <Input.TextArea
                autoSize={{ minRows: 4, maxRows: 8 }}
                placeholder="Введите описание комитета, его функции и обязанности..."
                disabled={loading || saving}
                showCount
                maxLength={500}
                style={{ resize: 'vertical' }}
              />
            </Form.Item>
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
              name="isActive"
              valuePropName="checked"
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
                <Switch 
                  disabled={loading || saving}
                  checkedChildren="Активен"
                  unCheckedChildren="Неактивен"
                />
                <span style={{ 
                  fontSize: 14, 
                  color: form.getFieldValue("isActive") ? '#52c41a' : '#8c8c8c',
                  fontWeight: form.getFieldValue("isActive") ? 600 : 400
                }}>
                  {form.getFieldValue("isActive") ? "Комитет отображается на сайте" : "Комитет скрыт"}
                </span>
              </div>
            </Form.Item>
          </div>
        </Form>
      </div>
    </div>
  );
}

