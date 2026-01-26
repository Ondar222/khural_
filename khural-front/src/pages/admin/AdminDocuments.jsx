import React from "react";
import { App, Button, Input, Modal, Space, Table, Tag } from "antd";
import { useHashRoute } from "../../Router.jsx";
import { DocumentsApi } from "../../api/client.js";
import { useData } from "../../context/DataContext.jsx";
import { normalizeFilesUrl } from "../../utils/filesUrl.js";

const TYPE_OPTIONS = [
  { value: "laws", label: "Законы" },
  { value: "resolutions", label: "Постановления" },
  { value: "initiatives", label: "Инициативы" },
  { value: "bills", label: "Законопроекты" },
  { value: "civic", label: "Обращения" },
  { value: "constitution", label: "Конституция" },
  { value: "other", label: "Другое" },
];

export default function AdminDocuments({ items, onCreate, onUpdate, onDelete, busy, canWrite }) {
  const { message } = App.useApp();
  const { navigate } = useHashRoute();
  const { documents: publicDocuments, reload: reloadPublicData } = useData();
  const [q, setQ] = React.useState("");
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const [busyLocal, setBusyLocal] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return (items || []).filter((d) =>
      String(d.title || "")
        .toLowerCase()
        .includes(qq)
    );
  }, [items, q]);

  const renderTypeTag = React.useCallback((v) => {
    const opt = TYPE_OPTIONS.find((x) => x.value === v);
    return opt ? <Tag color="blue">{opt.label}</Tag> : v || "—";
  }, []);

  const renderFilesTag = React.useCallback((row) => {
    const hasRu = row?.pdfFile?.link || row?.pdfFile?.id;
    const hasTy = row?.metadata?.pdfFileTyId || row?.metadata?.pdfFileTyLink;
    if (hasRu && hasTy) return <Tag color="green">RU + TY</Tag>;
    if (hasRu) return <Tag color="blue">RU</Tag>;
    if (hasTy) return <Tag color="orange">TY</Tag>;
    return "—";
  }, []);

  const confirmDelete = React.useCallback(
    (row) => {
      Modal.confirm({
        title: "Удалить документ?",
        content: "Действие необратимо. Если сервер недоступен — документ будет скрыт локально.",
        okText: "Удалить",
        okType: "danger",
        cancelText: "Отмена",
        onOk: async () => {
          try {
            await onDelete?.(row.id);
          } catch (e) {
            message.error(e?.message || "Не удалось удалить документ");
          }
        },
      });
    },
    [message, onDelete]
  );

  const columns = [
    {
      title: "Название",
      dataIndex: "title",
      width: windowWidth > 1024 ? 600 : undefined,
      ellipsis: false,
      render: (v) => (
        <div 
          className="admin-docs-title-cell"
          style={{ 
            maxWidth: windowWidth > 1024 ? "600px" : "100%",
            width: windowWidth > 1024 ? "600px" : "100%",
            overflowWrap: "break-word", 
            wordWrap: "break-word",
            wordBreak: "break-word",
            lineHeight: "1.4",
            whiteSpace: "normal",
            overflow: "hidden",
            boxSizing: "border-box"
          }}
        >
          {v || "—"}
        </div>
      ),
    },
    {
      title: "№ / Дата",
      key: "meta",
      width: 140,
      render: (_, row) => (
        <div style={{ fontSize: "13px", lineHeight: "1.4" }}>
          <div>{row.number || "—"}</div>
          <div style={{ opacity: 0.8, marginTop: "2px" }}>
            {row.publishedAt ? new Date(row.publishedAt).toLocaleDateString("ru-RU") : "—"}
          </div>
        </div>
      ),
    },
    {
      title: "Тип",
      dataIndex: "type",
      width: 150,
      render: (v) => renderTypeTag(v),
    },
    {
      title: "Файлы",
      key: "files",
      width: 100,
      render: (_, row) => renderFilesTag(row),
    },
    {
      title: "Действия",
      key: "actions",
      width: 180,
      render: (_, row) => (
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <Button
            size="small"
            onClick={() => {
              navigate(`/admin/documents/${row.id}`);
            }}
            disabled={!canWrite}
            block
          >
            Редактировать
          </Button>
          <Button 
            danger 
            size="small"
            onClick={() => confirmDelete(row)} 
            disabled={!canWrite}
            block
          >
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  const importDocumentsFromJson = React.useCallback(() => {
    if (!canWrite) return;

    Modal.confirm({
      title: "Импортировать документы из JSON файлов?",
      content:
        "Загрузим все документы из zakony.json, zakony2.json и postamovleniya_VH.json и создадим отсутствующих в базе через API. Если документ с таким названием уже существует — пропустим (без дублей).",
      okText: "Импортировать",
      cancelText: "Отмена",
      onOk: async () => {
        setBusyLocal(true);
        try {
          // Загружаем все три JSON файла
          const [zakonyData, zakony2Data, postamovleniyaData] = await Promise.all([
            fetch("/persons_doc/zakony.json").then((r) => r.ok ? r.json() : []).catch(() => []),
            fetch("/persons_doc/zakony2.json").then((r) => r.ok ? r.json() : []).catch(() => []),
            fetch("/persons_doc/postamovleniya_VH.json").then((r) => r.ok ? r.json() : []).catch(() => []),
          ]);

          // Парсим документы из zakony.json и zakony2.json
          const parseZakonyDoc = (row) => {
            if (!row || !row.IE_NAME) return null;
            const fileUrl = String(row.IP_PROP28 || "").trim();
            if (!fileUrl) return null;
            
            const normalizedUrl = normalizeFilesUrl(
              fileUrl.startsWith("http") ? fileUrl : `/upload/${fileUrl.replace(/^\/?upload\//i, "")}`
            );
            
            return {
              title: String(row.IE_NAME || "").trim(),
              date: String(row.IP_PROP27 || "").trim(),
              number: String(row.IP_PROP26 || "").trim(),
              category: "Законы Республики Тыва",
              type: "laws",
              url: normalizedUrl,
            };
          };
          
          // Парсим документы из postamovleniya_VH.json
          const parsePostamovleniyaDoc = (row) => {
            if (!row || !row.IE_NAME) return null;
            const fileUrl = String(row.IP_PROP59 || "").trim();
            if (!fileUrl) return null;
            
            const normalizedUrl = normalizeFilesUrl(
              fileUrl.startsWith("http") ? fileUrl : `/upload/${fileUrl.replace(/^\/?upload\//i, "")}`
            );
            
            return {
              title: String(row.IE_NAME || "").trim(),
              date: String(row.IP_PROP58 || "").trim(),
              number: String(row.IP_PROP57 || "").trim(),
              category: "Постановления ВХ РТ",
              type: "resolutions",
              url: normalizedUrl,
            };
          };
          
          const zakonyDocs = (Array.isArray(zakonyData) ? zakonyData : [])
            .map(parseZakonyDoc)
            .filter(Boolean);
          
          const zakony2Docs = (Array.isArray(zakony2Data) ? zakony2Data : [])
            .map(parseZakonyDoc)
            .filter(Boolean);
          
          const postamovleniyaDocs = (Array.isArray(postamovleniyaData) ? postamovleniyaData : [])
            .map(parsePostamovleniyaDoc)
            .filter(Boolean);
          
          const allDocs = [...zakonyDocs, ...zakony2Docs, ...postamovleniyaDocs];
          
          if (!allDocs.length) {
            message.error("В JSON файлах не найдено документов для импорта");
            return;
          }

          // Получаем список существующих документов из API
          const server = await DocumentsApi.listAll().catch(() => []);
          const serverList = Array.isArray(server) ? server : [];
          const existingByTitle = new Set(
            serverList.map((d) => String(d?.title || "").trim().toLowerCase())
          );

          let createdCount = 0;
          let skippedCount = 0;
          let failedCount = 0;

          for (const doc of allDocs) {
            const title = String(doc.title || "").trim();
            const titleKey = title.toLowerCase();
            if (!title) {
              skippedCount += 1;
              continue;
            }
            if (existingByTitle.has(titleKey)) {
              skippedCount += 1;
              continue;
            }

            try {
              // Создаем документ в API
              const body = {
                title: title,
                description: "",
                descriptionRu: "",
                descriptionTy: "",
                type: doc.type || "laws",
                category: doc.category || "",
                number: doc.number || "",
                date: doc.date || "",
                isPublished: true,
              };
              
              const created = await DocumentsApi.create(body);
              const createdId = created?.id ?? created?._id;
              
              if (createdId && doc.url) {
                // Пробуем загрузить файл по URL
                try {
                  const fileRes = await fetch(doc.url);
                  if (fileRes.ok) {
                    const blob = await fileRes.blob();
                    const fileName = doc.url.split("/").pop() || "document.pdf";
                    const file = new File([blob], fileName, { type: blob.type || "application/pdf" });
                    await DocumentsApi.uploadFile(createdId, file);
                  }
                } catch (fileError) {
                  console.warn("Failed to upload file for document:", fileError);
                  // Продолжаем даже если файл не загрузился
                }
              }
              
              createdCount += 1;
              existingByTitle.add(titleKey);
            } catch (e) {
              failedCount += 1;
              console.warn("Import document failed", e, doc);
            }
          }

          message.success(
            `Готово: создано ${createdCount}, пропущено ${skippedCount}, ошибок ${failedCount}`
          );
          reloadPublicData();
        } catch (e) {
          message.error(`Ошибка импорта: ${e.message}`);
          console.error("Import documents from JSON failed", e);
        } finally {
          setBusyLocal(false);
        }
      },
    });
  }, [canWrite, message, reloadPublicData]);

  const toolbar = (
    <div className="admin-card admin-toolbar">
      <Input
        placeholder="Поиск по названию..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="admin-input"
      />
      <Space wrap>
        <Button
          type="primary"
          onClick={() => navigate("/admin/documents/create")}
          disabled={!canWrite}
          loading={busy}
        >
          + Создать документ
        </Button>
        <Button 
          onClick={importDocumentsFromJson} 
          disabled={!canWrite} 
          loading={Boolean(busyLocal)}
        >
          Импортировать документы из JSON
        </Button>
      </Space>
    </div>
  );

  return (
    <div className="admin-grid">
      {toolbar}

      <div className="admin-card admin-table">
        <Table
          rowKey={(r) => String(r.id)}
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10 }}
          scroll={windowWidth > 1024 ? { x: "max-content" } : undefined}
        />
      </div>
    </div>
  );
}



