import React from "react";
import { App, Button, Input, Modal, Space, Table } from "antd";
import { PersonsApi } from "../../api/client.js";
import { useData } from "../../context/DataContext.jsx";
import { useHashRoute } from "../../Router.jsx";
import { readDeputiesOverrides, writeDeputiesOverrides } from "./deputiesOverrides.js";
import { toPersonsApiBody } from "../../api/personsPayload.js";
import { APPARATUS_SECTIONS } from "../../utils/apparatusContent.js";

const KHURAL_UPLOAD_BASE = "https://khural.rtyva.ru";

/** Преобразует путь фото в полный URL через khural.rtyva.ru */
function normalizePhotoUrl(pic) {
  if (!pic) return "";
  const s = String(pic).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s) || s.startsWith("//")) return s;
  if (s.startsWith("/upload/") || s.startsWith("upload/")) {
    const path = s.startsWith("/") ? s : `/${s}`;
    return `${KHURAL_UPLOAD_BASE}${path}`;
  }
  return s.startsWith("/") ? s : `/${s}`;
}

function normalizePersonName(s) {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Извлекает телефон из текста */
function extractPhoneFromText(text) {
  if (!text) return "";
  const cleanText = text.replace(/&nbsp;/g, " ").replace(/<[^>]*>/g, " ");
  const telMatch = cleanText.match(/тел[.:]\s*([+\d\s\-(),]+)/i);
  if (telMatch) {
    const phones = telMatch[1].split(",")[0].trim();
    const phone = phones.replace(/\s+/g, "").replace(/[^\d+\-()]/g, "");
    if (phone.length >= 8) return phone;
  }
  const phonePattern = /(\+?\d[\d\s\-()]{8,})/g;
  const match = cleanText.match(phonePattern);
  if (match) {
    const phone = match[0].replace(/\s+/g, "").replace(/[^\d+\-()]/g, "");
    if (phone.length >= 8) return phone;
  }
  return "";
}

/** Извлекает email из текста */
function extractEmailFromText(text) {
  if (!text) return "";
  const emailPattern = /[\w.-]+@[\w.-]+\.\w+/gi;
  const match = text.match(emailPattern);
  return match ? match[0] : "";
}

/** Извлекает адрес из текста */
function extractAddressFromText(text) {
  if (!text) return "";
  const cleanText = text.replace(/&nbsp;/g, " ").replace(/<[^>]*>/g, " ");
  const addressMatch = cleanText.match(/(г\.\s*[^,\n]+(?:,\s*ул\.\s*[^,\n]+(?:,\s*д\.\s*\d+)?)?)/i);
  return addressMatch ? addressMatch[1].trim() : "";
}

/** Парсит одну запись из JSON файлов */
function parsePersonInfoRow(row) {
  const id = row?.IE_ID ?? row?.IE_XML_ID;
  if (id == null) return null;
  const name = String(row?.IE_NAME ?? "").trim();
  if (!name) return null;
  const pic = String(row?.IE_PREVIEW_PICTURE ?? "").trim();
  const bio = String(row?.IE_DETAIL_TEXT ?? "").trim();
  const preview = String(row?.IE_PREVIEW_TEXT ?? "").trim();
  const phoneFromProp = String(row?.IP_PROP8 ?? "").trim();
  const phoneFromText = extractPhoneFromText(preview);
  const phone = phoneFromProp || phoneFromText || "";
  const emailFromProp = String(row?.IP_PROP9 ?? "").trim();
  const emailFromText = extractEmailFromText(preview);
  const email = emailFromProp || emailFromText || "";
  const conv = String(row?.IP_PROP15 ?? "").trim();
  const pos = String(row?.IP_PROP22 ?? "").trim();
  const pos128 = String(row?.IP_PROP128 ?? "").trim();
  const pos132 = String(row?.IP_PROP132 ?? "").trim();
  const position = pos || pos128 || pos132 || "";
  const address = extractAddressFromText(preview);
  
  return {
    ieId: String(id),
    name,
    photo: normalizePhotoUrl(pic),
    bio: bio || "",
    reception: preview || "",
    phone: phone || "",
    email: email || "",
    convocation: conv || "",
    position: position || "",
    address: address || "",
  };
}

/** Строит Map из массива записей */
function buildPersonInfoMap(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  const byId = new Map();
  for (const row of arr) {
    const v = parsePersonInfoRow(row);
    if (!v) continue;
    if (byId.has(v.ieId)) continue;
    byId.set(v.ieId, v);
  }
  const byName = new Map();
  for (const v of byId.values()) {
    const n = normalizePersonName(v.name);
    if (!n) continue;
    if (!byName.has(n)) byName.set(n, v);
  }
  return { byName, byId };
}

/** Объединяет две персон-мапы */
function mergePersonInfoMaps(base, overlay) {
  const byName = new Map(base.byName);
  for (const [n, ov] of overlay.byName) {
    const cur = byName.get(n);
    if (!cur) {
      byName.set(n, { ...ov });
      continue;
    }
    const merged = { ...cur };
    if (!merged.photo && ov.photo) merged.photo = ov.photo;
    if (!merged.bio && ov.bio) merged.bio = ov.bio;
    if (!merged.reception && ov.reception) merged.reception = ov.reception;
    if (!merged.phone && ov.phone) merged.phone = ov.phone;
    if (!merged.email && ov.email) merged.email = ov.email;
    if (!merged.convocation && ov.convocation) merged.convocation = ov.convocation;
    if (!merged.position && ov.position) merged.position = ov.position;
    if (!merged.address && ov.address) merged.address = ov.address;
    byName.set(n, merged);
  }
  const byId = new Map();
  for (const v of byName.values()) {
    byId.set(v.ieId, v);
  }
  return { byName, byId };
}

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
  const [seeded, setSeeded] = React.useState([]);

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
    const base = Array.isArray(items) ? items : [];
    const extra = Array.isArray(seeded) ? seeded : [];
    const byId = new Map();
    for (const it of [...base, ...extra]) {
      const id = String(it?.id ?? it?._id ?? "");
      if (!id) continue;
      if (!byId.has(id)) byId.set(id, it);
    }
    return mergeItemsWithOverrides(Array.from(byId.values()), overrides);
  }, [items, overrides, seeded]);

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

  // Kept for reference; button is commented out below.
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

  const importApparatusToApi = React.useCallback(() => {
    if (!canWrite) return;

    const mapByName = new Map();
    const sections = APPARATUS_SECTIONS && typeof APPARATUS_SECTIONS === "object" ? APPARATUS_SECTIONS : {};
    for (const key of Object.keys(sections)) {
      const people = sections?.[key]?.people;
      if (!Array.isArray(people)) continue;
      for (const p of people) {
        const fullName = String(p?.name || "").trim();
        if (!fullName) continue;
        const k = normKey(fullName);
        if (!k) continue;
        if (!mapByName.has(k)) mapByName.set(k, { section: key, ...p, fullName });
      }
    }
    const list = Array.from(mapByName.values());

    if (!list.length) {
      message.error("В данных Аппарата не найдено сотрудников для импорта");
      return;
    }

    Modal.confirm({
      title: "Импортировать сотрудников Аппарата в API?",
      content:
        "Создадим в базе отсутствующих людей из структуры Аппарата. Если человек с таким ФИО уже существует — пропустим (без дублей).",
      okText: "Импортировать",
      cancelText: "Отмена",
      onOk: async () => {
        setBusyLocal(true);
        try {
          const server = await PersonsApi.list().catch(() => []);
          const serverList = Array.isArray(server) ? server : [];
          const existingByName = new Set(
            serverList.map((p) => normKey(p?.fullName || p?.full_name || p?.name))
          );

          let createdCount = 0;
          let skippedCount = 0;
          let failedCount = 0;
          let photoCount = 0;
          const createdItems = [];

          for (const p of list) {
            const fullName = String(p?.fullName || "").trim();
            const key = normKey(fullName);
            if (!key) {
              skippedCount += 1;
              continue;
            }
            if (existingByName.has(key)) {
              skippedCount += 1;
              continue;
            }

            const position = String(p?.role || "").trim();
            const body = toPersonsApiBody({
              fullName,
              electoralDistrict: "",
              faction: "",
              phoneNumber: String(p?.phone || "").replace(/\u00A0/g, " ").trim(),
              email: String(p?.email || "").trim(),
              address: String(p?.address || "").trim(),
              biography: "",
              description: position,
              convocationNumber: "",
              structureType: "apparatus",
              role: "",
              receptionSchedule: "",
              legislativeActivity: [],
              incomeDeclarations: [],
            });

            try {
              const created = await PersonsApi.create(body);
              createdCount += 1;
              createdItems.push(created);
              existingByName.add(key);

              const createdId = created?.id ?? created?._id ?? created?.personId;
              const photo = String(p?.photo || "").trim();
              if (createdId && photo) {
                try {
                  const abs = new URL(photo, window.location.origin).toString();
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
              console.warn("Import apparatus person failed", e);
            }
          }

          if (createdItems.length) {
            setSeeded((prev) => {
              const next = Array.isArray(prev) ? prev.slice() : [];
              for (const it of createdItems) {
                const id = String(it?.id ?? it?._id ?? "");
                if (!id) continue;
                if (next.some((x) => String(x?.id ?? x?._id ?? "") === id)) continue;
                next.push(it);
              }
              return next;
            });
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
  }, [canWrite, message, reloadPublicData]);

  const importDeputiesFromJson = React.useCallback(() => {
    if (!canWrite) return;

    Modal.confirm({
      title: "Импортировать депутатов из JSON файлов?",
      content:
        "Загрузим всех депутатов из deputies.json, deputaty.json и deputaty_vseh_sozyvov.json и создадим отсутствующих в базе через API. Если депутат с таким ФИО уже существует — пропустим (без дублей).",
      okText: "Импортировать",
      cancelText: "Отмена",
      onOk: async () => {
        setBusyLocal(true);
        try {
          // Загружаем все три JSON файла
          const [deputiesBase, personInfoVseh, personInfoDeputaty] = await Promise.all([
            fetch("/data/deputies.json").then((r) => r.ok ? r.json() : []).catch(() => []),
            fetch("/persons_info/deputaty_vseh_sozyvov.json").then((r) => r.ok ? r.json() : []).catch(() => []),
            fetch("/persons_info/deputaty.json").then((r) => r.ok ? r.json() : []).catch(() => []),
          ]);

          const mapVseh = buildPersonInfoMap(personInfoVseh);
          const mapDep = buildPersonInfoMap(personInfoDeputaty);
          const personInfoMap = mergePersonInfoMaps(mapDep, mapVseh);

          // Получаем список существующих депутатов из API
          const server = await PersonsApi.list().catch(() => []);
          const serverList = Array.isArray(server) ? server : [];
          const existingByName = new Set(
            serverList.map((p) => normalizePersonName(p?.fullName || p?.full_name || p?.name))
          );

          let createdCount = 0;
          let skippedCount = 0;
          let failedCount = 0;
          let photoCount = 0;
          const createdItems = [];

          // Сначала импортируем из deputies.json (базовый файл с Даваа, Арланмай и т.д.)
          const deputiesList = Array.isArray(deputiesBase) ? deputiesBase : [];
          for (const d of deputiesList) {
            const fullName = String(d?.name || "").trim();
            const key = normalizePersonName(fullName);
            if (!key) {
              skippedCount += 1;
              continue;
            }
            if (existingByName.has(key)) {
              skippedCount += 1;
              continue;
            }

            // Обогащаем данными из personInfoMap если есть
            const personInfo = personInfoMap.byName.get(key);
            const photo = normalizePhotoUrl(d?.photo || personInfo?.photo || "");
            const bio = d?.bio || personInfo?.bio || "";
            const phone = d?.contacts?.phone || personInfo?.phone || "";
            const email = d?.contacts?.email || personInfo?.email || "";
            const address = d?.address || personInfo?.address || "";
            const district = d?.district || d?.electoralDistrict || personInfo?.position || "";
            const faction = d?.faction || "";
            const convocation = d?.convocation || d?.convocationNumber || personInfo?.convocation || "";
            const position = d?.position || personInfo?.position || "Депутат";
            const receptionSchedule = d?.reception || toReceptionScheduleText(d?.schedule) || personInfo?.reception || "";
            const legislativeActivity = Array.isArray(d?.laws) ? toLegislativeActivity(d.laws) : [];
            const incomeDeclarations = Array.isArray(d?.incomeDocs) ? d.incomeDocs : [];

            const body = toPersonsApiBody({
              fullName,
              electoralDistrict: district,
              faction: faction,
              phoneNumber: phone,
              email: email,
              address: address,
              biography: bio,
              description: position,
              convocationNumber: convocation,
              structureType: "deputy",
              role: "",
              receptionSchedule: receptionSchedule,
              legislativeActivity: legislativeActivity,
              incomeDeclarations: incomeDeclarations,
            });

            try {
              const created = await PersonsApi.create(body);
              createdCount += 1;
              createdItems.push(created);
              existingByName.add(key);

              const createdId = created?.id ?? created?._id ?? created?.personId;
              if (createdId && photo) {
                try {
                  const abs = new URL(photo, window.location.origin).toString();
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
              console.warn("Import deputy from deputies.json failed", e, d);
            }
          }

          // Затем импортируем из personInfoMap (deputaty.json и deputaty_vseh_sozyvov.json)
          for (const v of personInfoMap.byId.values()) {
            const fullName = String(v.name || "").trim();
            const key = normalizePersonName(fullName);
            if (!key) {
              skippedCount += 1;
              continue;
            }
            if (existingByName.has(key)) {
              skippedCount += 1;
              continue;
            }

            // Проверяем, что reception не является биографией
            const receptionPlain = String(v.reception || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
            const isReceptionBiography = receptionPlain.length > 200 || 
              /родился|родилась|окончил|окончила|работал|работала|награды|награжден|избран|назначен/i.test(receptionPlain);
            const receptionSchedule = !isReceptionBiography ? v.reception : "";

            const body = toPersonsApiBody({
              fullName,
              electoralDistrict: v.position || "",
              faction: "",
              phoneNumber: v.phone || "",
              email: v.email || "",
              address: v.address || "",
              biography: v.bio || "",
              description: v.position || "Депутат",
              convocationNumber: v.convocation || "",
              structureType: "deputy",
              role: "",
              receptionSchedule: receptionSchedule || "",
              legislativeActivity: [],
              incomeDeclarations: [],
            });

            try {
              const created = await PersonsApi.create(body);
              createdCount += 1;
              createdItems.push(created);
              existingByName.add(key);

              const createdId = created?.id ?? created?._id ?? created?.personId;
              const photo = v.photo || "";
              if (createdId && photo) {
                try {
                  const abs = new URL(photo, window.location.origin).toString();
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
              console.warn("Import deputy from JSON failed", e, v);
            }
          }

          if (createdItems.length) {
            setSeeded((prev) => {
              const next = Array.isArray(prev) ? prev.slice() : [];
              for (const it of createdItems) {
                const id = String(it?.id ?? it?._id ?? "");
                if (!id) continue;
                if (next.some((x) => String(x?.id ?? x?._id ?? "") === id)) continue;
                next.push(it);
              }
              return next;
            });
          }

          message.success(
            `Готово: создано ${createdCount}, пропущено ${skippedCount}, фото ${photoCount}, ошибок ${failedCount}`
          );
          reloadPublicData();
        } catch (e) {
          message.error(`Ошибка импорта: ${e.message}`);
          console.error("Import deputies from JSON failed", e);
        } finally {
          setBusyLocal(false);
        }
      },
    });
  }, [canWrite, message, reloadPublicData]);

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
          <Button
            disabled={!canWrite}
            onClick={() => navigate(`/admin/deputies/edit/${encodeURIComponent(String(row.id))}`)}
          >
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
              }  finally {
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
          <Button
            type="primary"
            onClick={() => navigate("/admin/deputies/create")}
            disabled={!canWrite}
            loading={busy}
          >
            + Добавить депутата
          </Button>
          {/* <Button onClick={importApparatusToApi} disabled={!canWrite} loading={Boolean(busyLocal)}>
            Импортировать Аппарат
          </Button>
          <Button onClick={importDeputiesFromJson} disabled={!canWrite} loading={Boolean(busyLocal)}>
            Синхронизировать депутатов
          </Button> */}
          {/* <Button onClick={syncFromCodeToApi} disabled={!canWrite} loading={Boolean(busyLocal)}>
            Синхронизировать из кода в API
          </Button> */}
        </Space>
      </div>

      <div className="admin-card admin-table">
        <Table rowKey={(r) => String(r.id)} columns={columns} dataSource={filtered} pagination={{ pageSize: 10 }} />
      </div>
    </div>
  );
}

