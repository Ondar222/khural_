import React from "react";
import { Alert, App, Button, Collapse, Empty, Input, Select, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { CommitteesApi } from "../../api/client.js";
import { loadCommitteeApiDocuments } from "../../data/committeeReportsApi.js";
import {
  buildInitialCommitteeReports,
  getArchivedCommitteeReportIndexes,
  getCommitteeReportsFromApiData,
  getCommitteeReportsMeta,
  getConvocationNumber,
} from "../../data/committeeReportsAdmin.js";
import { normalizeFilesUrl } from "../../utils/filesUrl.js";

const CATEGORIES = [
  { key: "agendas", label: "Повестка" },
  { key: "reports", label: "Отчёт" },
];

function getArchiveItems(committeeName) {
  if (!committeeName) return [];
  const archiveItems = [];
  for (const convocationNumber of [3, 4]) {
    const { years } = getCommitteeReportsMeta(convocationNumber);
    const initialData = buildInitialCommitteeReports(convocationNumber);
    const committeeIndexes = getArchivedCommitteeReportIndexes(
      convocationNumber,
      committeeName
    );
    for (const committeeIndex of committeeIndexes) {
      const docs = getCommitteeReportsFromApiData(
        initialData,
        committeeIndex,
        years,
        (fileId) => normalizeFilesUrl(`/files/v2/${fileId}`)
      );
      if (!docs) continue;
      for (const category of CATEGORIES) {
        for (const year of years) {
          for (const [index, doc] of (docs[category.key]?.[year] || []).entries()) {
            if (!doc.url) continue;
            archiveItems.push({
              id: `${convocationNumber}-${category.key}-${year}-${index}-${doc.url}`,
              convocationNumber,
              category: category.key,
              categoryLabel: category.label,
              year,
              title: doc.title,
              url: normalizeFilesUrl(doc.url),
            });
          }
        }
      }
    }
  }
  return archiveItems;
}

export default function AdminCommitteeAttachments({
  committeeId,
  committeeName,
  convocation,
  convocations,
  canWrite,
}) {
  const { message } = App.useApp();
  const archiveItems = React.useMemo(
    () => getArchiveItems(committeeName),
    [committeeName]
  );
  const [apiDocuments, setApiDocuments] = React.useState({
    reports: [],
    agendas: [],
  });
  const [apiYears, setApiYears] = React.useState([]);
  const [activeCategory, setActiveCategory] = React.useState("agendas");
  const [selectedYear, setSelectedYear] = React.useState(String(new Date().getFullYear()));
  const [documentName, setDocumentName] = React.useState("");
  const [file, setFile] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [loadError, setLoadError] = React.useState("");
  const [documentConvocationId, setDocumentConvocationId] = React.useState(
    String(convocation?.id ?? "")
  );

  const numericCommitteeId = /^\d+$/.test(String(committeeId || ""))
    ? Number(committeeId)
    : null;
  const numericConvocationId = /^\d+$/.test(documentConvocationId)
    ? Number(documentConvocationId)
    : null;
  const documentConvocation = (Array.isArray(convocations) ? convocations : []).find(
    (item) => String(item?.id ?? "") === documentConvocationId
  ) || convocation;
  const convocationNumber = getConvocationNumber(documentConvocation);
  const staticYears = convocationNumber
    ? getCommitteeReportsMeta(convocationNumber).years
    : [];
  const uploadYears = [...new Set([
    ...staticYears,
    ...apiYears,
    new Date().getFullYear(),
  ])].sort((a, b) => b - a);

  const loadApiDocuments = React.useCallback(async () => {
    if (!numericCommitteeId || !numericConvocationId) {
      setApiDocuments({ reports: [], agendas: [] });
      setApiYears([]);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const result = await loadCommitteeApiDocuments(
        numericCommitteeId,
        numericConvocationId
      );
      setApiDocuments({
        reports: result.reports,
        agendas: result.agendas,
      });
      setApiYears(result.years);
    } catch (error) {
      setLoadError(error?.message || "Не удалось загрузить отчёты и повестки из API");
      message.error(error?.message || "Не удалось загрузить отчёты и повестки из API");
    } finally {
      setLoading(false);
    }
  }, [message, numericCommitteeId, numericConvocationId]);

  React.useEffect(() => {
    setDocumentConvocationId(String(convocation?.id ?? ""));
  }, [convocation?.id]);

  React.useEffect(() => {
    loadApiDocuments();
  }, [loadApiDocuments]);

  const selectedArchiveItems = archiveItems.filter(
    (item) => item.category === activeCategory
  );
  const selectedApiDocuments = apiDocuments[activeCategory];

  const uploadFile = async () => {
    if (!numericCommitteeId || !numericConvocationId || !file || !canWrite) return;
    setUploading(true);
    try {
      const details = {
        file,
        convocationId: numericConvocationId,
        year: Number(selectedYear),
        name: documentName.trim() || file.name,
      };
      if (activeCategory === "reports") {
        await CommitteesApi.uploadReport(numericCommitteeId, details);
      } else {
        await CommitteesApi.uploadAgenda(numericCommitteeId, details);
      }
      message.success(`${activeCategory === "reports" ? "Отчёт" : "Повестка"} загружен(а) в API`);
      setFile(null);
      setDocumentName("");
      await loadApiDocuments();
    } catch (error) {
      message.error(error?.message || "Не удалось загрузить документ в API");
    } finally {
      setUploading(false);
    }
  };

  const archiveGroups = React.useMemo(() => {
    const groups = new Map();
    for (const item of selectedArchiveItems) {
      const key = `${item.convocationNumber}-${item.year}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label: `${item.convocationNumber === 3 ? "III" : "IV"} созыв · ${item.year} год`,
          children: [],
        });
      }
      groups.get(key).children.push(item);
    }
    return [...groups.values()].map((group) => ({
      key: group.key,
      label: group.label,
      children: (
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {group.children.map((item) => (
            <li key={item.id} style={{ marginBottom: 8 }}>
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      ),
    }));
  }, [selectedArchiveItems]);

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Отчёты и повестки</div>
        <div style={{ marginTop: 4, opacity: 0.75, fontSize: 13, lineHeight: 1.45 }}>
          Документы API привязаны к этому комитету и выбранному созыву. Архивные ссылки ниже пока остаются на исходном сайте.
        </div>
      </div>

      {loadError ? <Alert type="error" showIcon message={loadError} /> : null}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {CATEGORIES.map((category) => (
          <Button
            key={category.key}
            type={activeCategory === category.key ? "primary" : "default"}
            onClick={() => setActiveCategory(category.key)}
          >
            {category.key === "reports" ? "Отчёты" : "Повестки"}
          </Button>
        ))}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Уже загружено в API</div>
        <Select
          aria-label="Созыв документов"
          value={documentConvocationId || undefined}
          onChange={setDocumentConvocationId}
          placeholder="Выберите созыв документов"
          options={(Array.isArray(convocations) ? convocations : [])
            .map((item) => ({
              value: String(item?.id ?? ""),
              label: item?.name || item?.title || `Созыв ${item?.number || item?.id || ""}`,
            }))
            .filter((option) => option.value)}
        />
        {loading ? (
          <div>Загрузка документов…</div>
        ) : selectedApiDocuments.length ? (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {selectedApiDocuments.map((doc) => (
              <li key={doc.id} style={{ marginBottom: 6 }}>
                {doc.url ? (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.title}</a>
                ) : (
                  doc.title
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ opacity: 0.7 }}>В API пока нет {activeCategory === "reports" ? "отчётов" : "повесток"}.</div>
        )}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Архивные материалы</div>
        {archiveGroups.length ? (
          <Collapse size="small" items={archiveGroups} />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Для этого комитета архивные документы не найдены"
          />
        )}
      </div>

      <div style={{ display: "grid", gap: 10, padding: 14, border: "1px solid rgba(10, 31, 68, 0.1)", borderRadius: 10 }}>
        <div style={{ fontWeight: 600 }}>Загрузить документ в API</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          <Select
            aria-label="Год документа"
            value={selectedYear}
            onChange={setSelectedYear}
            options={uploadYears.map((year) => ({ value: String(year), label: `${year} год` }))}
            disabled={!canWrite || uploading}
          />
          <Input
            aria-label="Название документа"
            placeholder="Название документа"
            value={documentName}
            onChange={(event) => setDocumentName(event.target.value)}
            disabled={!canWrite || uploading}
          />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <Upload
            accept=".pdf,.doc,.docx"
            maxCount={1}
            showUploadList={Boolean(file)}
            fileList={file ? [{ uid: file.uid, name: file.name, status: "done" }] : []}
            beforeUpload={(selectedFile) => {
              setFile(selectedFile);
              if (!documentName.trim()) setDocumentName(selectedFile.name);
              return false;
            }}
            onRemove={() => {
              setFile(null);
              return true;
            }}
            disabled={!canWrite || uploading}
          >
            <Button icon={<UploadOutlined />} disabled={!canWrite || uploading}>
              Выбрать файл
            </Button>
          </Upload>
          <Button
            type="primary"
            onClick={uploadFile}
            loading={uploading}
            disabled={!canWrite || !file || !numericCommitteeId || !numericConvocationId}
          >
            Загрузить в API
          </Button>
        </div>
        {!canWrite ? (
          <div style={{ color: "#b7791f", fontSize: 13 }}>
            Для загрузки необходимы права администратора.
          </div>
        ) : !numericCommitteeId || !numericConvocationId ? (
          <div style={{ color: "#b7791f", fontSize: 13 }}>
            Загрузка доступна только для комитета и созыва с числовыми ID в API.
          </div>
        ) : null}
      </div>
    </section>
  );
}
