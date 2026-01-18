import React from "react";
import { App, Button, Input, Modal, Space, Table } from "antd";
import { PersonsApi } from "../../api/client.js";
import { useData } from "../../context/DataContext.jsx";
import { useHashRoute } from "../../Router.jsx";
import { readDeputiesOverrides, writeDeputiesOverrides } from "./deputiesOverrides.js";
import { toPersonsApiBody } from "../../api/personsPayload.js";

function normKey(v) {
  return String(v || "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function mergeItemsWithOverrides(base, overrides) {
  const created = Array.isArray(overrides?.created) ? overrides.created : [];
  const updatedById = overrides?.updatedById && typeof overrides.updatedById === "object" ? overrides.updatedById : {};
  const deletedIds = new Set(Array.isArray(overrides?.deletedIds) ? overrides.deletedIds.map(String) : []);

  const out = [];
  const seen = new Set();

  for (const it of Array.isArray(base) ? base : []) {
    const id = String(it?.id ?? "");
    if (!id) continue;
    if (deletedIds.has(id)) continue;
    const override = updatedById[id];
    out.push(override ? { ...it, ...override } : it);
    seen.add(id);
  }

  for (const it of created) {
    const id = String(it?.id ?? "");
    if (!id) continue;
    if (deletedIds.has(id)) continue;
    if (seen.has(id)) continue;
    out.push(it);
    seen.add(id);
  }

  return out;
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

export default function AdminDeputiesList({ items, busy, canWrite }) {
  const { message } = App.useApp();
  const { navigate } = useHashRoute();
  const { reload: reloadPublicData, deputies: publicDeputies } = useData();
  const [q, setQ] = React.useState("");
  const [busyLocal, setBusyLocal] = React.useState(false);
  const [overrides, setOverrides] = React.useState(() => readDeputiesOverrides());
  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  // Отслеживание размера окна для адаптивности
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;

  React.useEffect(() => {
    const onLocal = () => setOverrides(readDeputiesOverrides());
    window.addEventListener("khural:deputies-updated", onLocal);
    window.addEventListener("storage", onLocal);
    return () => {
      window.removeEventListener("khural:deputies-updated", onLocal);
      window.removeEventListener("storage", onLocal);
    };
  }, []);

  const displayItems = React.useMemo(() => {
    return mergeItemsWithOverrides(items, overrides);
  }, [items, overrides]);

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return displayItems;
    return displayItems.filter((p) =>
      String(p.fullName || p.full_name || p.name || "")
        .toLowerCase()
        .includes(qq)
    );
  }, [displayItems, q]);

  const deleteLocal = React.useCallback((id) => {
    const next = readDeputiesOverrides();
    const deleted = new Set(Array.isArray(next.deletedIds) ? next.deletedIds.map(String) : []);
    deleted.add(String(id));
    writeDeputiesOverrides({ ...next, deletedIds: Array.from(deleted) });
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

  const handleDelete = React.useCallback((id, fullName) => {
    Modal.confirm({
      title: 'Удалить депутата?',
      content: `Вы уверены, что хотите удалить депутата "${fullName || 'без имени'}"?`,
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        if (!id) return;
        setBusyLocal(true);
        try {
          await PersonsApi.remove(id);
          message.success("Депутат удалён");
        } catch {
          message.warning("Удалено локально (сервер недоступен или нет прав)");
        } finally {
          deleteLocal(id);
          reloadPublicData();
          setBusyLocal(false);
        }
      },
    });
  }, [deleteLocal, message, reloadPublicData]);

  const columns = [
    {
      title: "№",
      key: "index",
      width: 80,
      align: 'center',
      render: (_, __, index) => (
        <span style={{ textAlign: 'center', display: 'block' }}>
          {index + 1}
        </span>
      ),
    },
    {
      title: "ФИО",
      dataIndex: "fullName",
      align: 'center',
      render: (_, row) => <span style={{ textAlign: 'center', display: 'block' }}>{row.fullName || row.full_name || row.name || "—"}</span>,
    },
    {
      title: "Фракция",
      dataIndex: "faction",
      width: 180,
      align: 'center',
      render: (v) => <span style={{ textAlign: 'center', display: 'block' }}>{v || "—"}</span>,
    },
    {
      title: "Округ",
      dataIndex: "electoralDistrict",
      width: 200,
      align: 'center',
      render: (_, row) => <span style={{ textAlign: 'center', display: 'block' }}>{row.electoralDistrict || row.electoral_district || row.district || "—"}</span>,
    },
    {
      title: "Действия",
      key: "actions",
      width: 260,
      render: (_, row) => (
        <Space wrap>
          <Button
            size={isTablet ? "small" : "middle"}
            disabled={!canWrite}
            onClick={() => navigate(`/admin/deputies/edit/${encodeURIComponent(String(row.id))}`)}
          >
            Редактировать
          </Button>
          <Button
            danger
            size={isTablet ? "small" : "middle"}
            disabled={!canWrite}
            onClick={() => handleDelete(row.id, row.fullName || row.full_name || row.name)}
          >
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  // Адаптивные карточки для мобильных
  if (isMobile) {
    return (
      <div className="admin-grid" style={{
        maxWidth: '100%',
        width: '100%',
        margin: 0,
        padding: 0,
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}>
        <div className="admin-card admin-toolbar" style={{
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <Input
            placeholder="Поиск по ФИО..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="admin-input"
            size="large"
            style={{ width: '100%' }}
          />
          <Button
            type="primary"
            onClick={() => navigate("/admin/deputies/create")}
            disabled={!canWrite}
            loading={busy}
            block
            size="large"
            style={{ fontWeight: 600 }}
          >
            + Добавить депутата
          </Button>
          <Button
            onClick={syncFromCodeToApi}
            disabled={!canWrite}
            loading={Boolean(busyLocal)}
            block
            size="large"
          >
            Синхронизировать из кода в API
          </Button>
        </div>

        {filtered.length === 0 ? (
          <div className="admin-card" style={{
            padding: '32px 16px',
            textAlign: 'center',
            opacity: 0.6,
          }}>
            {q ? 'Депутаты не найдены' : 'Депутаты отсутствуют'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((row, index) => (
              <div
                key={String(row.id)}
                className="admin-card"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  textAlign: 'center',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                  flexWrap: 'wrap',
                }}>
                  <span style={{
                    opacity: 0.6,
                    fontSize: '12px',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>№{index + 1}</span>
                  <div style={{
                    fontWeight: 800,
                    fontSize: '16px',
                    lineHeight: 1.3,
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    textAlign: 'center',
                    flex: 1,
                    minWidth: 0,
                  }}>
                    {row.fullName || row.full_name || row.name || "—"}
                  </div>
                </div>

                {(row.faction || row.electoralDistrict || row.electoral_district || row.district) && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(0,0,0,0.08)',
                    fontSize: '14px',
                  }}>
                    {row.faction && (
                      <div style={{
                        opacity: 0.75,
                        textAlign: 'center',
                      }}>
                        <strong>Фракция:</strong> {row.faction}
                      </div>
                    )}
                    {(row.electoralDistrict || row.electoral_district || row.district) && (
                      <div style={{
                        opacity: 0.75,
                        textAlign: 'center',
                      }}>
                        <strong>Округ:</strong> {row.electoralDistrict || row.electoral_district || row.district}
                      </div>
                    )}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  justifyContent: 'center',
                  marginTop: '8px',
                }}>
                  <Button
                    size="small"
                    disabled={!canWrite}
                    onClick={() => navigate(`/admin/deputies/edit/${encodeURIComponent(String(row.id))}`)}
                    style={{ flex: '1 1 calc(50% - 4px)' }}
                  >
                    Редактировать
                  </Button>
                  <Button
                    danger
                    size="small"
                    disabled={!canWrite}
                    onClick={() => handleDelete(row.id, row.fullName || row.full_name || row.name)}
                    style={{ flex: '1 1 calc(50% - 4px)' }}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="admin-grid" style={{
      maxWidth: '100%',
      width: '100%',
      margin: 0,
      padding: 0,
      overflowX: 'hidden',
      boxSizing: 'border-box',
    }}>
      <div className="admin-card admin-toolbar" style={{
        padding: isTablet ? '16px' : '20px 24px',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '12px',
        alignItems: isMobile ? 'stretch' : 'center',
      }}>
        <Input
          placeholder="Поиск по ФИО..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-input"
          size={isTablet ? "middle" : "large"}
          style={{
            flex: 1,
            maxWidth: isMobile ? '100%' : '400px',
            width: '100%',
          }}
        />
        <Space wrap>
          <Button
            type="primary"
            onClick={() => navigate("/admin/deputies/create")}
            disabled={!canWrite}
            loading={busy}
            size={isTablet ? "middle" : "large"}
            style={{ fontWeight: 600 }}
          >
            + Добавить депутата
          </Button>
          <Button
            onClick={syncFromCodeToApi}
            disabled={!canWrite}
            loading={Boolean(busyLocal)}
            size={isTablet ? "middle" : "large"}
          >
            Синхронизировать из кода в API
          </Button>
        </Space>
      </div>

      <div className="admin-card admin-table" style={{
        padding: 0,
        overflowX: 'auto',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}>
        <Table
          rowKey={(r) => String(r.id)}
          columns={columns}
          dataSource={filtered}
          pagination={{
            pageSize: 10,
            showSizeChanger: !isTablet,
            showQuickJumper: !isTablet,
            size: isTablet ? 'small' : 'default',
          }}
          scroll={isTablet ? { x: 'max-content' } : undefined}
          size={isTablet ? 'small' : 'middle'}
        />
      </div>
    </div>
  );
}
