import React from "react";
import { App, Button, Card, Collapse, Input, Modal, Select, Upload } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import AdminShell from "./AdminShell.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";
import { ConvocationsApi, DocumentsApi } from "../../api/client.js";
import { normalizeFilesUrl } from "../../utils/filesUrl.js";
import {
  getCommitteeReportsMeta,
  buildInitialCommitteeReports,
  getConvocationNumber,
} from "../../data/committeeReportsAdmin.js";

/** Генерируем id для нового документа */
function nextDocId() {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function AdminCommitteeReportsPage() {
  const adminData = useAdminData();
  const { message } = App.useApp();
  const [convocations, setConvocations] = React.useState([]);
  const [selectedConvocationId, setSelectedConvocationId] = React.useState("");
  const [convocation, setConvocation] = React.useState(null);
  const [committeeReports, setCommitteeReports] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalDoc, setModalDoc] = React.useState(null);
  const [modalContext, setModalContext] = React.useState(null); // { committeeIndex, year, type }
  const [modalTitle, setModalTitle] = React.useState("");
  const [modalFile, setModalFile] = React.useState(null);
  const [modalUrl, setModalUrl] = React.useState("");
  /** При неавторизованном просмотре — выбор «3 созыв» / «4 созыв» для отображения данных из кода */
  const [selectedStaticConv, setSelectedStaticConv] = React.useState("3");

  const convNumber = adminData.authenticated
    ? getConvocationNumber(convocation)
    : (selectedStaticConv ? Number(selectedStaticConv) : null);
  const { committees, years } = getCommitteeReportsMeta(convNumber);

  // Загрузка списка созывов (только для авторизованных)
  React.useEffect(() => {
    if (!adminData.authenticated) return;
    let alive = true;
    (async () => {
      try {
        const list = await ConvocationsApi.list({ activeOnly: false }).catch(() => []);
        if (!alive) return;
        const arr = Array.isArray(list) ? list : [];
        setConvocations(arr);
        if (arr.length && !selectedConvocationId) {
          const withNum = arr.find((c) => getConvocationNumber(c) != null);
          if (withNum) setSelectedConvocationId(String(withNum.id));
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { alive = false; };
  }, [adminData.authenticated]);

  // Загрузка выбранного созыва и committeeReports из API (только для авторизованных)
  React.useEffect(() => {
    if (!adminData.authenticated) return;
    if (!selectedConvocationId) {
      setConvocation(null);
      setCommitteeReports(null);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const conv = await ConvocationsApi.getById(selectedConvocationId).catch(() => null);
        if (!conv) {
          setConvocation(null);
          setCommitteeReports(null);
          return;
        }
        setConvocation(conv);
        const num = getConvocationNumber(conv);
        if (num !== 3 && num !== 4) {
          setCommitteeReports({ committees: [], documentsByCommittee: [] });
          return;
        }
        const apiData = conv.committeeReports;
        if (apiData && Array.isArray(apiData.committees) && Array.isArray(apiData.documentsByCommittee)) {
          setCommitteeReports(apiData);
        } else {
          setCommitteeReports(buildInitialCommitteeReports(num));
        }
      } catch (e) {
        console.error(e);
        setConvocation(null);
        setCommitteeReports(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [adminData.authenticated, selectedConvocationId]);

  // Без входа: показываем данные из кода (статичные отчёты 3/4 созыва)
  React.useEffect(() => {
    if (!adminData.authenticated && (selectedStaticConv === "3" || selectedStaticConv === "4")) {
      setCommitteeReports(buildInitialCommitteeReports(Number(selectedStaticConv)));
      setConvocation({ number: Number(selectedStaticConv), name: `${selectedStaticConv} созыв` });
      setLoading(false);
    }
  }, [adminData.authenticated, selectedStaticConv]);

  const openAddDoc = (committeeIndex, year, type) => {
    setModalContext({ committeeIndex, year, type });
    setModalDoc(null);
    setModalTitle("");
    setModalFile(null);
    setModalUrl("");
    setModalOpen(true);
  };

  const openEditDoc = (committeeIndex, year, type, doc) => {
    setModalContext({ committeeIndex, year, type });
    setModalDoc(doc);
    setModalTitle(doc.title || "");
    setModalFile(null);
    setModalUrl(doc.url || "");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalDoc(null);
    setModalContext(null);
    setModalTitle("");
    setModalFile(null);
    setModalUrl("");
  };

  const saveDoc = async () => {
    if (!committeeReports || !modalContext || !adminData.canWrite || !convocation) return;
    const { committeeIndex, year, type } = modalContext;
    const title = (modalTitle || "").trim();
    if (!title) {
      message.warning("Введите название документа");
      return;
    }
    let fileId = modalDoc?.fileId;
    let url = modalUrl?.trim() || undefined;
    if (modalFile) {
      setSaving(true);
      try {
        const tempDoc = await DocumentsApi.create({
          title: `[Отчеты комитетов] ${title}`,
          type: "other",
          isPublished: false,
        });
        if (!tempDoc?.id) throw new Error("Не удалось создать документ для загрузки");
        await DocumentsApi.uploadFile(tempDoc.id, modalFile);
        const updated = await DocumentsApi.getById(tempDoc.id);
        fileId = updated?.pdfFile?.id;
        if (!fileId) throw new Error("Не удалось получить ID файла");
        url = undefined;
        message.success("Файл загружен");
      } catch (e) {
        message.error(e?.message || "Ошибка загрузки файла");
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    const next = JSON.parse(JSON.stringify(committeeReports));
    const docList = next.documentsByCommittee[committeeIndex][type][year] || [];
    const newDoc = {
      id: modalDoc?.id || nextDocId(),
      title,
      ...(url && { url }),
      ...(fileId && { fileId }),
    };
    let newDocs;
    if (modalDoc) {
      newDocs = docList.map((d) => (d.id === modalDoc.id ? newDoc : d));
    } else {
      newDocs = [...docList, newDoc];
    }
    if (!next.documentsByCommittee[committeeIndex][type][year]) {
      next.documentsByCommittee[committeeIndex][type][year] = [];
    }
    next.documentsByCommittee[committeeIndex][type][year] = newDocs;
    setCommitteeReports(next);
    closeModal();
  };

  const deleteDoc = (committeeIndex, year, type, docId) => {
    if (!committeeReports || !adminData.canWrite) return;
    Modal.confirm({
      title: "Удалить документ?",
      okText: "Удалить",
      okType: "danger",
      cancelText: "Отмена",
      onOk: () => {
        const next = JSON.parse(JSON.stringify(committeeReports));
        const list = (next.documentsByCommittee[committeeIndex][type][year] || []).filter(
          (d) => d.id !== docId
        );
        next.documentsByCommittee[committeeIndex][type][year] = list;
        setCommitteeReports(next);
      },
    });
  };

  const saveToServer = async () => {
    if (!convocation || !committeeReports || !adminData.canWrite) return;
    setSaving(true);
    try {
      await ConvocationsApi.patch(convocation.id, {
        ...convocation,
        committeeReports,
      });
      message.success("Сохранено");
    } catch (e) {
      message.error(e?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const convocationOptions = React.useMemo(() => {
    if (!adminData.authenticated) {
      return [
        { value: "3", label: "3 созыв" },
        { value: "4", label: "4 созыв" },
      ];
    }
    return convocations
      .filter((c) => getConvocationNumber(c) === 3 || getConvocationNumber(c) === 4)
      .map((c) => ({
        value: String(c.id),
        label: c.name || c.number != null ? `${c.number} созыв` : `Созыв ${c.id}`,
      }));
  }, [adminData.authenticated, convocations]);

  const selectValue = adminData.authenticated ? selectedConvocationId : selectedStaticConv;
  const onSelectChange = adminData.authenticated ? setSelectedConvocationId : setSelectedStaticConv;

  return (
    <AdminShell
      activeKey="committee-reports"
      title="Отчеты комитетов"
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      <div className="admin-committee-reports">
        <div className="admin-card" style={{ marginBottom: 16 }}>
          <div className="admin-committee-reports__convocation-wrap">
            <div style={{ fontWeight: 700, fontSize: 15 }}>Созыв</div>
            <Select
              placeholder="Выберите созыв"
              value={selectValue || undefined}
              onChange={onSelectChange}
              options={convocationOptions}
              allowClear={adminData.authenticated}
            />
          </div>
        </div>

        {loading && (
          <div className="admin-card" style={{ padding: 40, textAlign: "center" }}>
            Загрузка…
          </div>
        )}

        {!loading && convocation && committeeReports && (convNumber === 3 || convNumber === 4) && (
          <>
            <div className="admin-card admin-committee-reports__toolbar" style={{ marginBottom: 16 }}>
              <div className="admin-committee-reports__toolbar-title">
                {convocation.name || `${convNumber} созыв`}
              </div>
              {adminData.authenticated && (
                <Button type="primary" loading={saving} onClick={saveToServer} disabled={!adminData.canWrite}>
                  Сохранить на сервер
                </Button>
              )}
            </div>

            <Collapse
              className="admin-committee-reports__collapse"
              defaultActiveKey={[0]}
              items={committeeReports.committees.map((name, committeeIndex) => ({
                key: committeeIndex,
                label: name,
                children: (
                  <div className="admin-committee-reports__years">
                    {years.map((year) => (
                      <Card
                        key={year}
                        size="small"
                        title={`${year} год`}
                        className="admin-committee-reports__year-card"
                      >
                        <div className="admin-committee-reports__cols">
                          <div className="admin-committee-reports__section">
                            <div className="admin-committee-reports__section-title">Повестки</div>
                            <DocList
                              docs={(committeeReports.documentsByCommittee[committeeIndex]?.agendas?.[year]) || []}
                              onAdd={() => openAddDoc(committeeIndex, year, "agendas")}
                              onEdit={(d) => openEditDoc(committeeIndex, year, "agendas", d)}
                              onDelete={(id) => deleteDoc(committeeIndex, year, "agendas", id)}
                              canWrite={adminData.canWrite}
                            />
                          </div>
                          <div className="admin-committee-reports__section">
                            <div className="admin-committee-reports__section-title">Отчеты</div>
                            <DocList
                              docs={(committeeReports.documentsByCommittee[committeeIndex]?.reports?.[year]) || []}
                              onAdd={() => openAddDoc(committeeIndex, year, "reports")}
                              onEdit={(d) => openEditDoc(committeeIndex, year, "reports", d)}
                              onDelete={(id) => deleteDoc(committeeIndex, year, "reports", id)}
                              canWrite={adminData.canWrite}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ),
              }))}
            />
          </>
        )}

        {adminData.authenticated && !loading && selectedConvocationId && convocation && convNumber !== 3 && convNumber !== 4 && (
          <div className="admin-card" style={{ padding: 24, color: "#888" }}>
            Для этого созыва управление отчётами комитетов не настроено (поддерживаются только 3 и 4 созыв).
          </div>
        )}

        {!adminData.authenticated && committeeReports && (
          <div className="admin-card admin-committee-reports__guest-notice">
            Просмотр данных из раздела «Отчеты комитетов». Чтобы редактировать и сохранять изменения, войдите в админку.
          </div>
        )}
      </div>

      <Modal
        title={modalDoc ? "Редактировать документ" : "Добавить документ"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={saveDoc}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnClose
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>Название</div>
            <Input
              value={modalTitle}
              onChange={(e) => setModalTitle(e.target.value)}
              placeholder="Название документа"
            />
          </div>
          <div>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>Файл (загрузить)</div>
            <Upload
              accept=".pdf,.doc,.docx"
              maxCount={1}
              fileList={modalFile ? [{ uid: "1", name: modalFile.name }] : []}
              beforeUpload={(file) => {
                setModalFile(file);
                return false;
              }}
              onRemove={() => setModalFile(null)}
            >
              <Button icon={<UploadOutlined />}>Выбрать файл</Button>
            </Upload>
          </div>
          <div>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>Или ссылка на документ (URL)</div>
            <Input
              value={modalUrl}
              onChange={(e) => setModalUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      </Modal>
    </AdminShell>
  );
}

function DocList({ docs, onAdd, onEdit, onDelete, canWrite }) {
  const fileUrl = (d) => {
    if (d.url) return d.url;
    if (d.fileId) return normalizeFilesUrl(`/files/v2/${d.fileId}`);
    return null;
  };
  return (
    <>
      <ul className="admin-committee-reports__doc-list">
        {docs.map((d) => (
          <li key={d.id} className="admin-committee-reports__doc-item">
            <span className="admin-committee-reports__doc-link">
              {fileUrl(d) ? (
                <a href={fileUrl(d)} target="_blank" rel="noopener noreferrer" className="link">
                  {d.title}
                </a>
              ) : (
                <span>{d.title}</span>
              )}
            </span>
            {canWrite && (
              <span className="admin-committee-reports__doc-actions">
                <Button type="link" size="small" onClick={() => onEdit(d)}>
                  Изменить
                </Button>
                <Button type="link" size="small" danger onClick={() => onDelete(d.id)}>
                  Удалить
                </Button>
              </span>
            )}
          </li>
        ))}
      </ul>
      {canWrite && (
        <div className="admin-committee-reports__add-doc">
          <Button type="dashed" block icon={<PlusOutlined />} onClick={onAdd}>
            Добавить документ
          </Button>
        </div>
      )}
    </>
  );
}
