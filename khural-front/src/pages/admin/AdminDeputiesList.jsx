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

  const columns = [
    {
      title: "ФИО",
      dataIndex: "fullName",
      render: (_, row) => row.fullName || row.full_name || row.name || "—",
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
      render: (_, row) => row.electoralDistrict || row.electoral_district || row.district || "—",
    },
    {
      title: "Действия",
      key: "actions",
      width: 260,
      render: (_, row) => (
        <Space wrap>
          <Button disabled={!canWrite} onClick={() => navigate(`/admin/deputies/edit/${encodeURIComponent(String(row.id))}`)}>
            Редактировать
          </Button>
          <Button
            danger
            disabled={!canWrite}
            onClick={async () => {
              const id = String(row?.id ?? "");
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
            }}
          >
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
          placeholder="Поиск по ФИО..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-input"
        />
        <Space wrap>
          <Button type="primary" onClick={() => navigate("/admin/deputies/create")} disabled={!canWrite} loading={busy}>
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
    </div>
  );
}


