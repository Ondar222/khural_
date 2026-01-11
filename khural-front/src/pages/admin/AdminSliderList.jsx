import React from "react";
import { App, Button, Input, Modal, Space, Table, Switch, Upload } from "antd";
import { useHashRoute } from "../../Router.jsx";
import { useData } from "../../context/DataContext.jsx";
import { SliderApi } from "../../api/client.js";

export default function AdminSliderList({
  items,
  onUpdate,
  onDelete,
  onUploadImage,
  onReorder,
  busy,
  canWrite,
}) {
  const { message } = App.useApp();
  const { navigate } = useHashRoute();
  const publicData = useData();
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState([]);

  React.useEffect(() => {
    const sorted = (Array.isArray(items) ? items : [])
      .slice()
      .sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0));
    setRows(sorted);
  }, [items]);

  const maxReached = rows.length >= 5;

  const syncFromCodeToApi = React.useCallback(() => {
    if (!canWrite) return;
    const codeSlides = (Array.isArray(publicData?.slides) ? publicData.slides : []).slice(0, 5);
    if (!codeSlides.length) {
      message.error("Кодовые слайды не найдены (public/data/slides.json)");
      return;
    }
    Modal.confirm({
      title: "Синхронизировать 5 слайдов из кода в API?",
      content:
        "Создаст слайды на сервере и загрузит картинки, чтобы они работали на проде (не локально). Если API отвечает ошибками/429 — синхронизация может частично не выполниться.",
      okText: "Синхронизировать",
      cancelText: "Отмена",
      onOk: async () => {
        const key = `sync-${Date.now()}`;
        message.loading({ content: "Синхронизация…", key, duration: 0 });
        let created = 0;
        let uploaded = 0;
        let failed = 0;

        for (const s of codeSlides) {
          try {
            // eslint-disable-next-line no-await-in-loop
            const createdSlide = await SliderApi.create({
              title: String(s?.title || ""),
              description: String(s?.desc || ""),
              url: String(s?.link || ""),
              isActive: true,
            });
            created += 1;
            const createdId = createdSlide?.id;

            const imgSrc = String(s?.image || "").trim();
            if (createdId && imgSrc) {
              try {
                const abs = new URL(imgSrc, window.location.origin).toString();
                // eslint-disable-next-line no-await-in-loop
                const res = await fetch(abs);
                if (res.ok) {
                  // eslint-disable-next-line no-await-in-loop
                  const blob = await res.blob();
                  const ext = blob.type && blob.type.includes("/") ? blob.type.split("/")[1] : "jpg";
                  const file = new File([blob], `slide.${ext}`, { type: blob.type || "image/jpeg" });
                  // eslint-disable-next-line no-await-in-loop
                  await SliderApi.uploadImage(createdId, file);
                  uploaded += 1;
                }
              } catch {
                // ignore upload errors
              }
            }
          } catch (e) {
            failed += 1;
          }
        }

        try {
          // Refresh order best-effort: pull list and reorder by current order
          const list = await SliderApi.list({ all: true }).catch(() => null);
          const arr = Array.isArray(list) ? list : [];
          const ids = arr
            .filter((x) => x && x.isActive !== false)
            .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
            .map((x) => String(x.id));
          if (ids.length) await onReorder?.(ids);
        } catch {
          // ignore
        }

        if (failed === 0) message.success({ content: `Готово: создано ${created}, картинок ${uploaded}`, key });
        else message.warning({ content: `Готово частично: создано ${created}, картинок ${uploaded}, ошибок ${failed}`, key });
      },
    });
  }, [canWrite, publicData?.slides, message, onReorder]);

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return rows;
    return rows.filter((s) => String(s?.title || "").toLowerCase().includes(qq));
  }, [rows, q]);

  const applyReorder = React.useCallback(
    async (nextRows) => {
      setRows(nextRows);
      const ids = nextRows.map((r) => String(r.id));
      try {
        await onReorder?.(ids);
      } catch (e) {
        message.error(e?.message || "Не удалось сохранить порядок");
      }
    },
    [onReorder, message]
  );

  const moveRow = React.useCallback(
    async (id, dir) => {
      const idx = rows.findIndex((r) => String(r.id) === String(id));
      if (idx < 0) return;
      const j = idx + dir;
      if (j < 0 || j >= rows.length) return;
      const next = rows.slice();
      const tmp = next[idx];
      next[idx] = next[j];
      next[j] = tmp;
      await applyReorder(next);
    },
    [rows, applyReorder]
  );

  const columns = [
    {
      title: "#",
      width: 64,
      render: (_, __, i) => <span style={{ opacity: 0.75 }}>{i + 1}</span>,
    },
    {
      title: "Картинка",
      dataIndex: "image",
      width: 120,
      render: (v) =>
        v ? (
          <img
            src={v}
            alt=""
            style={{ width: 96, height: 54, objectFit: "cover", borderRadius: 8 }}
            loading="lazy"
            decoding="async"
          />
        ) : (
          "—"
        ),
    },
    {
      title: "Слайд",
      dataIndex: "title",
      render: (_, row) => (
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 800 }}>{row.title || "(без заголовка)"}</div>
          {row.description ? (
            <div style={{ opacity: 0.75, fontSize: 13 }}>{String(row.description).slice(0, 140)}</div>
          ) : null}
          {row.url ? (
            <div style={{ opacity: 0.65, fontSize: 12 }}>
              Ссылка: <code>{row.url}</code>
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Активен",
      dataIndex: "isActive",
      width: 120,
      render: (v, row) => (
        <Switch
          checked={Boolean(v)}
          disabled={!canWrite}
          onChange={(checked) =>
            onUpdate?.(row.id, {
              title: row.title,
              description: row.description,
              url: row.url,
              isActive: checked,
            })
          }
        />
      ),
    },
    {
      title: "Действия",
      key: "actions",
      width: 420,
      render: (_, row) => (
        <Space wrap>
          <Button disabled={!canWrite} onClick={() => navigate(`/admin/slider/edit/${encodeURIComponent(String(row.id))}`)}>
            Редактировать
          </Button>

          <Upload
            showUploadList={false}
            accept={undefined}
            beforeUpload={(file) => {
              if (!canWrite) return false;
              onUploadImage?.(row.id, file);
              return false;
            }}
          >
            <Button disabled={!canWrite}>Картинка</Button>
          </Upload>

          <Button disabled={!canWrite} onClick={() => moveRow(row.id, -1)}>
            ↑
          </Button>
          <Button disabled={!canWrite} onClick={() => moveRow(row.id, +1)}>
            ↓
          </Button>

          <Button danger disabled={!canWrite} onClick={() => onDelete?.(row.id)}>
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-grid">
      <div className="admin-card admin-toolbar">
        <Input
          placeholder="Поиск по заголовку..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-input"
        />
        <Space wrap>
          <Button
            type="primary"
            onClick={() => {
              if (maxReached) {
                message.error("Максимум 5 слайдов. Удалите существующий слайд, чтобы добавить новый.");
                return;
              }
              navigate("/admin/slider/create");
            }}
            disabled={!canWrite || maxReached}
            loading={busy}
          >
            + Добавить слайд
          </Button>
          <Button onClick={syncFromCodeToApi} disabled={!canWrite}>
            Синхронизировать из кода в API
          </Button>
        </Space>
      </div>

      <div className="admin-card admin-table">
        <Table rowKey={(r) => String(r.id)} columns={columns} dataSource={filtered} pagination={{ pageSize: 10 }} />
      </div>
    </div>
  );
}


