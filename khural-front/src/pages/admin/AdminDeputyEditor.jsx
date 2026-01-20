import React from "react";
import { App, Button, Form, Input, Select, Upload, Modal, Checkbox } from "antd";
import { useHashRoute } from "../../Router.jsx";
import { CommitteesApi, PersonsApi } from "../../api/client.js";
import { useData } from "../../context/DataContext.jsx";
import { toPersonsApiBody } from "../../api/personsPayload.js";
import { readDeputiesOverrides, writeDeputiesOverrides } from "./deputiesOverrides.js";
import { decodeHtmlEntities } from "../../utils/html.js";
import {
  COMMITTEES_OVERRIDES_EVENT_NAME,
  COMMITTEES_OVERRIDES_STORAGE_KEY,
  readCommitteesOverrides,
  writeCommitteesOverrides,
} from "../../utils/committeesOverrides.js";

const STRUCTURE_TYPE_OPTIONS = [
  { value: "committee", label: "Комитет" },
  { value: "parliament_leadership", label: "Руководство парламента" },
  { value: "commission", label: "Комиссия" },
  { value: "apparatus", label: "Аппарат" },
  {
    value: "municipal_council",
    label: "Совет по взаимодействию с представительными органами муниципальных образований",
  },
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

function getLocalDeputyById(list, id) {
  const arr = Array.isArray(list) ? list : [];
  return arr.find((x) => String(x?.id ?? "") === String(id)) || null;
}

function normalizeInitial(d) {
  const row = d && typeof d === "object" ? d : {};
  const biographyRaw = row.biography || row.bio || row.description || "";
  const receptionRaw = row.receptionSchedule || row.reception_schedule || "";
  const receptionText =
    typeof receptionRaw === "string"
      ? receptionRaw
      : receptionRaw && typeof receptionRaw === "object" && typeof receptionRaw.notes === "string"
        ? receptionRaw.notes
        : "";
  return {
    fullName: row.fullName || row.full_name || row.name || "",
    faction: row.faction || "",
    electoralDistrict: row.electoralDistrict || row.electoral_district || row.district || "",
    convocationIds: (() => {
      // Prefer explicit IDs
      if (Array.isArray(row.convocationIds)) return row.convocationIds.map(String).filter(Boolean);
      if (Array.isArray(row.convocation_ids)) return row.convocation_ids.map(String).filter(Boolean);
      // From relation
      const fromRel = Array.isArray(row.convocations)
        ? row.convocations
            .map((c) => (typeof c === "string" ? "" : c?.id))
            .map((x) => String(x || "").trim())
            .filter(Boolean)
        : [];
      return [...new Set(fromRel)];
    })(),
    committeeIds: (() => {
      if (Array.isArray(row.committeeIds)) return row.committeeIds.map(String);
      if (Array.isArray(row.committees)) {
        return row.committees
          .map((c) => (typeof c === "string" ? c : c?.id || c?.name || ""))
          .map((x) => String(x || "").trim())
          .filter(Boolean);
      }
      return [];
    })(),
    mandateEnded: Boolean(row.mandateEnded ?? row.mandate_ended),
    isDeceased: Boolean(row.isDeceased ?? row.is_deceased),
    isActive: row.isActive !== undefined ? Boolean(row.isActive) : (row.is_active !== undefined ? Boolean(row.is_active) : true),
    structureType: row.structureType || row.structure_type || "",
    role: row.role || "",
    // API can store HTML as escaped text; decode so admin sees real tags (<p>..</p>).
    biography: decodeHtmlEntities(biographyRaw),
    email: row.email || row.contacts?.email || "",
    phoneNumber: row.phoneNumber || row.phone_number || row.contacts?.phone || row.phone || "",
    address: row.address || row.contacts?.address || "",
    receptionSchedule: decodeHtmlEntities(receptionText),
  };
}

export default function AdminDeputyEditor({ mode, deputyId, canWrite }) {
  const { message } = App.useApp();
  const { navigate } = useHashRoute();
  const { reload, deputies, factions, districts, committees, setFactions, setCommittees } = useData();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(mode === "edit");
  const [saving, setSaving] = React.useState(false);
  const [photoFile, setPhotoFile] = React.useState(null);
  const structureType = Form.useWatch("structureType", form);
  const isDeceased = Form.useWatch("isDeceased", form);
  const fullNameValue = Form.useWatch("fullName", form);
  const initialStatusRef = React.useRef(null);
  const [newFactionOpen, setNewFactionOpen] = React.useState(false);
  const [newFactionName, setNewFactionName] = React.useState("");
  const [newDistrictOpen, setNewDistrictOpen] = React.useState(false);
  const [newDistrictName, setNewDistrictName] = React.useState("");
  const [newConvocationOpen, setNewConvocationOpen] = React.useState(false);
  const [newConvocationName, setNewConvocationName] = React.useState("");
  const [newCommitteeOpen, setNewCommitteeOpen] = React.useState(false);
  const [newCommitteeName, setNewCommitteeName] = React.useState("");
  const [lookupBusy, setLookupBusy] = React.useState(false);
  const [factionEntities, setFactionEntities] = React.useState([]);
  const [districtEntities, setDistrictEntities] = React.useState([]);
  const [convocationEntities, setConvocationEntities] = React.useState([]);

  const deputyIdNum = React.useMemo(() => {
    const n = Number(deputyId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [deputyId]);

  const [committeesOverridesSeq, setCommitteesOverridesSeq] = React.useState(0);
  React.useEffect(() => {
    const bump = () => setCommitteesOverridesSeq((x) => x + 1);
    const onStorage = (e) => {
      if (e?.key === COMMITTEES_OVERRIDES_STORAGE_KEY) bump();
    };
    window.addEventListener(COMMITTEES_OVERRIDES_EVENT_NAME, bump);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(COMMITTEES_OVERRIDES_EVENT_NAME, bump);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const mergeCommitteesWithOverrides = React.useCallback((base, overrides) => {
    const created = Array.isArray(overrides?.created) ? overrides.created : [];
    const updatedById =
      overrides?.updatedById && typeof overrides.updatedById === "object"
        ? overrides.updatedById
        : {};
    const deletedIds = new Set(
      Array.isArray(overrides?.deletedIds) ? overrides.deletedIds.map(String) : []
    );
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
      const override = updatedById[id];
      out.push(override ? { ...it, ...override } : it);
      seen.add(id);
    }
    return out;
  }, []);

  const committeesMerged = React.useMemo(() => {
    void committeesOverridesSeq;
    const base = Array.isArray(committees) ? committees : [];
    return mergeCommitteesWithOverrides(base, readCommitteesOverrides());
  }, [committees, committeesOverridesSeq, mergeCommitteesWithOverrides]);

  const [participationConvocationId, setParticipationConvocationId] = React.useState("all");
  const [participationCommitteeId, setParticipationCommitteeId] = React.useState(null);
  const [participationRole, setParticipationRole] = React.useState("Член комитета");

  const deputyConvocationIds = Form.useWatch("convocationIds", form);

  const convocationsForParticipation = React.useMemo(() => {
    const ids = Array.isArray(deputyConvocationIds) ? deputyConvocationIds.map(String) : [];
    const all = Array.isArray(convocationEntities) ? convocationEntities : [];
    const filtered = ids.length ? all.filter((c) => ids.includes(String(c?.id))) : all;
    return filtered;
  }, [convocationEntities, deputyConvocationIds]);

  const committeesForSelectedConvocation = React.useMemo(() => {
    const list = Array.isArray(committeesMerged) ? committeesMerged : [];
    if (!participationConvocationId || participationConvocationId === "all") return list;
    return list.filter(
      (c) =>
        String(c?.convocation?.id || c?.convocationId || "") ===
        String(participationConvocationId)
    );
  }, [committeesMerged, participationConvocationId]);

  const myCommitteeMemberships = React.useMemo(() => {
    if (!deputyIdNum) return [];
    const list = Array.isArray(committeesMerged) ? committeesMerged : [];
    const out = [];
    for (const c of list) {
      const members = Array.isArray(c?.members) ? c.members : [];
      const found = members.find((m) => Number(m?.personId) === deputyIdNum || Number(m?.person?.id) === deputyIdNum);
      if (found) out.push({ committee: c, member: found });
    }
    return out;
  }, [committeesMerged, deputyIdNum]);

  const upsertMembershipLocal = React.useCallback(async () => {
    if (!canWrite) return;
    if (!deputyIdNum) {
      message.error("Для участия нужен сохранённый депутат (ID)");
      return;
    }
    const cid = String(participationCommitteeId || "");
    if (!cid) return;
    const role = String(participationRole || "").trim() || "Член комитета";
    const c = (Array.isArray(committeesMerged) ? committeesMerged : []).find(
      (x) => String(x?.id ?? "") === cid
    );
    if (!c) return;

    // Ensure deputy has this convocation selected
    const convIdFromCommittee = c?.convocation?.id || c?.convocationId || participationConvocationId;
    if (convIdFromCommittee && convIdFromCommittee !== "all") {
      const nextIds = Array.isArray(form.getFieldValue("convocationIds"))
        ? form.getFieldValue("convocationIds").map(String)
        : [];
      if (!nextIds.includes(String(convIdFromCommittee))) {
        form.setFieldValue("convocationIds", [...nextIds, String(convIdFromCommittee)]);
      }
    }
    const members = Array.isArray(c.members) ? c.members.slice() : [];
    const idx = members.findIndex(
      (m) => Number(m?.personId) === deputyIdNum || Number(m?.person?.id) === deputyIdNum
    );
    const nextMember = { personId: deputyIdNum, role, order: idx >= 0 ? (members[idx]?.order ?? idx) : members.length };
    if (idx >= 0) members[idx] = { ...members[idx], ...nextMember };
    else members.push(nextMember);

    // Try API first for real committees, then local override
    const looksServerId = /^\d+$/.test(cid);
    if (looksServerId) {
      try {
        await CommitteesApi.addMembers(cid, [{ personId: deputyIdNum, role, order: nextMember.order }]);
        message.success("Участие добавлено");
        return;
      } catch {
        // fall back to local override below
      }
    }

    const ov = readCommitteesOverrides();
    const updatedById =
      ov.updatedById && typeof ov.updatedById === "object" ? ov.updatedById : {};
    writeCommitteesOverrides({
      ...ov,
      updatedById: { ...updatedById, [cid]: { ...(updatedById[cid] || {}), members } },
    });
    message.warning("Сервер недоступен. Участие сохранено локально.");
  }, [canWrite, committeesMerged, deputyIdNum, message, participationCommitteeId, participationRole, form, participationConvocationId]);

  const removeMembershipLocal = React.useCallback(async (committeeIdToUpdate) => {
    if (!canWrite) return;
    if (!deputyIdNum) return;
    const cid = String(committeeIdToUpdate || "");
    if (!cid) return;
    const c = (Array.isArray(committeesMerged) ? committeesMerged : []).find(
      (x) => String(x?.id ?? "") === cid
    );
    if (!c) return;
    const members = (Array.isArray(c.members) ? c.members : []).filter(
      (m) => Number(m?.personId) !== deputyIdNum && Number(m?.person?.id) !== deputyIdNum
    );

    const looksServerId = /^\d+$/.test(cid);
    if (looksServerId) {
      // If backend supports removing by memberId, we'd need memberId; fallback to patch via overrides.
      // Keeping it local for now.
    }

    const ov = readCommitteesOverrides();
    const updatedById =
      ov.updatedById && typeof ov.updatedById === "object" ? ov.updatedById : {};
    writeCommitteesOverrides({
      ...ov,
      updatedById: { ...updatedById, [cid]: { ...(updatedById[cid] || {}), members } },
    });
    message.success("Участие удалено (локально)");
  }, [canWrite, committeesMerged, deputyIdNum, message]);

  const refreshLookups = React.useCallback(async () => {
    setLookupBusy(true);
    try {
      const [fs, ds, cs] = await Promise.all([
        PersonsApi.listFactionsAll().catch(() => []),
        PersonsApi.listDistrictsAll().catch(() => []),
        PersonsApi.listConvocationsAll().catch(() => []),
      ]);
      setFactionEntities(Array.isArray(fs) ? fs : []);
      setDistrictEntities(Array.isArray(ds) ? ds : []);
      setConvocationEntities(Array.isArray(cs) ? cs : []);
    } finally {
      setLookupBusy(false);
    }
  }, []);

  React.useEffect(() => {
    refreshLookups();
  }, [refreshLookups]);

  const isActive = Form.useWatch("isActive", form);
  
  React.useEffect(() => {
    if (isDeceased) {
      form.setFieldValue("mandateEnded", true);
      form.setFieldValue("isActive", false);
    }
  }, [isDeceased, form]);
  
  React.useEffect(() => {
    if (isActive === false) {
      form.setFieldValue("mandateEnded", true);
    }
  }, [isActive, form]);

  const normKey = React.useCallback((v) => {
    return String(v || "")
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }, []);

  const findEntityByName = React.useCallback(
    (list, name) => {
      const n = normKey(name);
      if (!n) return null;
      const arr = Array.isArray(list) ? list : [];
      return arr.find((x) => normKey(x?.name) === n) || null;
    },
    [normKey]
  );

  const ensureFaction = React.useCallback(
    async (name) => {
      const s = String(name || "").trim();
      if (!s) return null;
      const found = findEntityByName(factionEntities, s);
      if (found) return found;
      if (!canWrite) return null;
      await PersonsApi.createFaction({ name: s });
      await refreshLookups();
      return findEntityByName(factionEntities, s);
    },
    [canWrite, factionEntities, findEntityByName, refreshLookups]
  );

  const ensureDistrict = React.useCallback(
    async (name) => {
      const s = String(name || "").trim();
      if (!s) return null;
      const found = findEntityByName(districtEntities, s);
      if (found) return found;
      if (!canWrite) return null;
      await PersonsApi.createDistrict({ name: s });
      await refreshLookups();
      return findEntityByName(districtEntities, s);
    },
    [canWrite, districtEntities, findEntityByName, refreshLookups]
  );

  const enrichRelations = React.useCallback(
    async (raw) => {
      const body = raw && typeof raw === "object" ? { ...raw } : {};

      // Explicitly preserve status fields as booleans
      body.mandateEnded = Boolean(body.mandateEnded);
      body.isDeceased = Boolean(body.isDeceased);
      body.isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;
      if (body.isDeceased) {
        body.mandateEnded = true;
        body.isActive = false;
      }
      if (!body.isActive) {
        body.mandateEnded = true;
      }

      // factionIds
      const factionName = String(body.faction || "").trim();
      if (factionName) {
        const f = await ensureFaction(factionName).catch(() => null);
        if (f?.id) body.factionIds = [String(f.id)];
      }

      // districtIds
      const districtName = String(body.electoralDistrict || "").trim();
      if (districtName) {
        const d = await ensureDistrict(districtName).catch(() => null);
        if (d?.id) body.districtIds = [String(d.id)];
      }

      // convocationIds (multi) - prefer IDs from UI
      if (Array.isArray(body.convocationIds)) {
        body.convocationIds = body.convocationIds.map(String).filter(Boolean);
      } else if (Array.isArray(body.convocation_ids)) {
        body.convocationIds = body.convocation_ids.map(String).filter(Boolean);
      }

      // committeeIds (multi) - сохраняем как есть, если это массив ID
      if (Array.isArray(body.committeeIds)) {
        body.committeeIds = body.committeeIds.map(String).filter(Boolean);
      }

      return body;
    },
    [ensureFaction, ensureDistrict]
  );

  React.useEffect(() => {
    if (mode !== "edit") return;
    const id = String(deputyId || "");
    if (!id) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        // Try API; fallback to local list
        const fromApi = await PersonsApi.getById(id).catch(() => null);
        const fromLocal = getLocalDeputyById(deputies, id);
        // Merge local overrides so status checkbox remains consistent even if backend ignores these fields.
        const ov = readDeputiesOverrides();
        const patch = ov?.updatedById && typeof ov.updatedById === "object" ? ov.updatedById[String(id)] : null;
        const base = fromApi || fromLocal || patch;
        const src = patch && base && typeof base === "object" ? { ...base, ...patch } : base;
        if (!alive) return;
        const normalized = normalizeInitial(src);
        form.setFieldsValue(normalized);
        initialStatusRef.current = {
          mandateEnded: Boolean(normalized?.mandateEnded),
          isDeceased: Boolean(normalized?.isDeceased),
          isActive: normalized?.isActive !== undefined ? Boolean(normalized?.isActive) : true,
        };
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [mode, deputyId, deputies, form]);

  React.useEffect(() => {
    if (!structureType) return;
    const allowed = new Set((ROLE_OPTIONS_BY_STRUCTURE[structureType] || []).map((o) => o.value));
    const current = form.getFieldValue("role");
    if (current && !allowed.has(current)) form.setFieldValue("role", undefined);
  }, [structureType, form]);

  const saveOverridesUpdate = React.useCallback((id, body) => {
    const next = readDeputiesOverrides();
    const updatedById = next.updatedById && typeof next.updatedById === "object" ? next.updatedById : {};
    writeDeputiesOverrides({
      ...next,
      updatedById: {
        ...updatedById,
        [String(id)]: { ...body, id: String(id) },
      },
    });
  }, []);

  // Persist status fields locally so the checkbox "works" even if backend ignores these fields.
  const saveOverridesStatus = React.useCallback((id, statusPatch) => {
    const key = String(id || "");
    if (!key) return;
    const next = readDeputiesOverrides();
    const updatedById = next.updatedById && typeof next.updatedById === "object" ? next.updatedById : {};
    const prev = updatedById[key] && typeof updatedById[key] === "object" ? updatedById[key] : {};
    writeDeputiesOverrides({
      ...next,
      updatedById: {
        ...updatedById,
        [key]: { ...prev, ...statusPatch, id: key },
      },
    });
  }, []);

  const saveOverridesCreate = React.useCallback((item) => {
    const next = readDeputiesOverrides();
    const created = Array.isArray(next.created) ? next.created : [];
    writeDeputiesOverrides({ ...next, created: [item, ...created] });
  }, []);

  const onSave = async () => {
    if (!canWrite) return;
    setSaving(true);
    try {
      const values = await form.validateFields();
      const bodyRaw = {
        ...values,
        // Для API отправляем description, локально храним biography
        description: values.biography || "",
        bio: undefined,
      };
      const body = await enrichRelations(bodyRaw);

      if (mode === "create") {
        try {
          const created = await PersonsApi.create(toPersonsApiBody(body));
          const id = created?.id ?? created?._id ?? created?.personId;
          if (id && photoFile) await PersonsApi.uploadMedia(id, photoFile);
          // If admin set any non-default status, persist it locally too (backend may ignore these fields).
          const statusPatch = {
            mandateEnded: Boolean(body?.mandateEnded),
            isDeceased: Boolean(body?.isDeceased),
            isActive: body?.isActive !== undefined ? Boolean(body?.isActive) : true,
          };
          if (id && (statusPatch.mandateEnded || statusPatch.isDeceased || statusPatch.isActive === false)) {
            saveOverridesStatus(id, statusPatch);
          }
          message.success("Депутат создан");
          reload();
          navigate("/admin/deputies");
        } catch {
          const localId = `local-${Date.now()}`;
          saveOverridesCreate({ ...body, id: localId });
          message.warning("Создано локально (сервер недоступен или нет прав)");
          reload();
          navigate("/admin/deputies");
        }
        return;
      }

      // edit
      const id = String(deputyId || "");
      if (!id) throw new Error("Не удалось определить ID депутата");
      try {
        const payload = toPersonsApiBody(body);
        console.log("[AdminDeputyEditor] Sending PATCH payload:", { mandateEnded: payload.mandateEnded, isDeceased: payload.isDeceased, ...payload });
        await PersonsApi.patch(id, payload);
        if (photoFile) await PersonsApi.uploadMedia(id, photoFile);
        // Persist status locally when it changes (backend may not store these fields).
        const statusPatch = {
          mandateEnded: Boolean(body?.mandateEnded),
          isDeceased: Boolean(body?.isDeceased),
          isActive: body?.isActive !== undefined ? Boolean(body?.isActive) : true,
        };
        const prev = initialStatusRef.current;
        const changed =
          !prev ||
          Boolean(prev.mandateEnded) !== Boolean(statusPatch.mandateEnded) ||
          Boolean(prev.isDeceased) !== Boolean(statusPatch.isDeceased) ||
          Boolean(prev.isActive) !== Boolean(statusPatch.isActive);
        if (changed) saveOverridesStatus(id, statusPatch);
        message.success("Депутат обновлён");
        reload();
        navigate("/admin/deputies");
      } catch {
        // If data patch fails (often due to validation), still try to upload photo so it appears on the site.
        if (photoFile) {
          try {
            await PersonsApi.uploadMedia(id, photoFile);
            message.success("Фото загружено");
            reload();
            navigate("/admin/deputies");
            return;
          } catch {
            // fall through to local override warning
          }
        }
        saveOverridesUpdate(id, { ...body, id });
        message.warning("Обновлено локально (сервер недоступен или нет прав)");
        reload();
        navigate("/admin/deputies");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-deputy-editor">
      <div className="admin-deputy-editor__hero">
        <div className="admin-deputy-editor__hero-row">
          <div className="admin-deputy-editor__hero-left">
            <div className="admin-deputy-editor__kicker">Депутаты</div>
            <div className="admin-deputy-editor__title">
              {mode === "create" ? "Создание депутата" : "Редактирование депутата"}
            </div>
            {mode === "edit" && fullNameValue ? (
              <div className="admin-deputy-editor__subtitle">{String(fullNameValue)}</div>
            ) : null}
          </div>
          <div className="admin-deputy-editor__hero-actions">
            <Button onClick={() => navigate("/admin/deputies")}>Отмена</Button>
            <Button type="primary" onClick={onSave} disabled={!canWrite} loading={saving}>
              Сохранить
            </Button>
          </div>
        </div>
      </div>

      <Form
        layout="vertical"
        form={form}
        initialValues={{
          biography: "",
          structureType: undefined,
          role: undefined,
          convocationIds: [],
          mandateEnded: false,
          isDeceased: false,
          isActive: true,
        }}
      >
        <div className="admin-deputy-editor__grid">
          <div className="admin-card">
            <div className="admin-deputy-editor__section-title">Основное</div>
            <Form.Item label="ФИО" name="fullName" rules={[{ required: true, message: "Укажите ФИО" }]}>
              <Input disabled={loading || saving} />
            </Form.Item>
            <div className="admin-split">
              <Form.Item label="Фракция" name="faction">
                <Select
                  disabled={loading || saving}
                  placeholder="Выберите фракцию"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={(Array.isArray(factions) ? factions : [])
                    .filter((x) => x && String(x).trim() !== "")
                    .map((x) => ({ value: String(x), label: String(x) }))}
                  dropdownRender={(menu) => (
                    <div>
                      {menu}
                      <div style={{ padding: 8, borderTop: "1px solid #f0f0f0" }}>
                        <Button type="dashed" block onClick={() => setNewFactionOpen(true)} disabled={!canWrite}>
                          + Добавить новую фракцию
                        </Button>
                      </div>
                    </div>
                  )}
                />
              </Form.Item>
              <Form.Item label="Округ" name="electoralDistrict">
                <Select
                  disabled={loading || saving}
                  placeholder="Выберите округ"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={(Array.isArray(districts) ? districts : [])
                    .filter((x) => x && String(x).trim() !== "")
                    .map((x) => ({ value: String(x), label: String(x) }))}
                  dropdownRender={(menu) => (
                    <div>
                      {menu}
                      <div style={{ padding: 8, borderTop: "1px solid #f0f0f0" }}>
                        <Button type="dashed" block onClick={() => setNewDistrictOpen(true)} disabled={!canWrite}>
                          + Добавить округ
                        </Button>
                      </div>
                    </div>
                  )}
                />
              </Form.Item>
            </div>
          </div>

          {mode === "edit" ? (
            <div className="admin-card">
              <div className="admin-deputy-editor__section-title">Участие в комитетах</div>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ opacity: 0.75, fontSize: 13, lineHeight: 1.45 }}>
                  Выберите созыв → комитет → роль, чтобы добавить участие депутата.
                </div>

                <div className="admin-split">
                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>Созыв</div>
                    <Select
                      value={participationConvocationId}
                      onChange={setParticipationConvocationId}
                      disabled={saving || loading}
                      options={[
                        { value: "all", label: "Все созывы" },
                        ...(Array.isArray(convocationsForParticipation) ? convocationsForParticipation : []).map((c) => ({
                          value: String(c?.id),
                          label: String(c?.name || `Созыв ${c?.id}`),
                        })),
                      ]}
                    />
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>Комитет</div>
                    <Select
                      value={participationCommitteeId}
                      onChange={setParticipationCommitteeId}
                      disabled={saving || loading}
                      placeholder="Выберите комитет"
                      showSearch
                      optionFilterProp="label"
                      options={(Array.isArray(committeesForSelectedConvocation) ? committeesForSelectedConvocation : [])
                        .map((c) => ({
                          value: String(c?.id),
                          label: String(c?.name || c?.title || `Комитет ${c?.id}`),
                        }))}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Роль</div>
                  <Select
                    value={participationRole}
                    onChange={setParticipationRole}
                    disabled={saving || loading}
                    options={[
                      { value: "Председатель комитета", label: "Председатель комитета" },
                      { value: "Заместитель председателя комитета", label: "Заместитель председателя" },
                      { value: "Член комитета", label: "Член комитета" },
                    ]}
                  />
                </div>

                <Button
                  type="primary"
                  disabled={!canWrite || !participationCommitteeId}
                  onClick={upsertMembershipLocal}
                  style={{ color: "#fff" }}
                >
                  Добавить / обновить участие
                </Button>

                <div style={{ marginTop: 6, fontWeight: 800 }}>Текущее участие</div>
                {myCommitteeMemberships.length ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    {myCommitteeMemberships.map(({ committee: c, member: m }) => (
                      <div
                        key={String(c?.id)}
                        style={{
                          border: "1px solid rgba(10, 31, 68, 0.08)",
                          borderRadius: 12,
                          padding: 12,
                          background: "rgba(255,255,255,0.55)",
                          display: "grid",
                          gap: 8,
                        }}
                      >
                        <div style={{ fontWeight: 900 }}>{c?.name || c?.title || "Комитет"}</div>
                        <div style={{ opacity: 0.8 }}>
                          <strong>Роль:</strong> {String(m?.role || "—")}
                        </div>
                        <Button
                          danger
                          disabled={!canWrite}
                          onClick={() => removeMembershipLocal(String(c?.id))}
                        >
                          Удалить из комитета
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ opacity: 0.65 }}>Пока не добавлено</div>
                )}
              </div>
            </div>
          ) : null}

          <div className="admin-card">
            <div className="admin-deputy-editor__section-title">Статус</div>
            <div className="admin-split">
              <Form.Item
                label="Созывы"
                name="convocationIds"
                tooltip="Выберите один или несколько созывов, в которых участвует депутат."
              >
                <Select
                  disabled={loading || saving || lookupBusy}
                  mode="multiple"
                  placeholder="Выберите созывы"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={(Array.isArray(convocationEntities) ? convocationEntities : [])
                    .filter((c) => c && c.id)
                    .map((c) => ({ value: String(c.id), label: String(c.name || `Созыв ${c.id}`) }))}
                />
              </Form.Item>
              <Form.Item label="Тип структуры" name="structureType">
                <Select disabled={loading || saving} placeholder="Выберите тип структуры" allowClear>
                  {STRUCTURE_TYPE_OPTIONS.map((opt) => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            <div className="admin-split" style={{ marginTop: 6 }}>
              <Form.Item name="mandateEnded" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Checkbox disabled={loading || saving}>Созыв завершен (прекратил полномочия)</Checkbox>
              </Form.Item>
        
            </div>
            {structureType ? (
              <Form.Item label="Роль" name="role">
                <Select disabled={loading || saving} placeholder="Выберите роль" allowClear>
                  {(ROLE_OPTIONS_BY_STRUCTURE[structureType] || []).map((opt) => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            ) : null}
            {/* Комитеты задаются через блок "Участие в комитетах" (созыв → комитет → роль) */}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-deputy-editor__section-title">Биография</div>
          <Form.Item
            label="Биография (HTML)"
            name="biography"
            tooltip="Любой HTML: p, h1-h6, strong/em, ul/ol/li, a, img и т.д. Сохраняется как есть."
          >
            <Input.TextArea
              autoSize={{ minRows: 12, maxRows: 28 }}
              placeholder="<p>Биография</p>\n<h2>Заголовок блока</h2>\n<ul><li>Пункт</li></ul>"
              style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
            />
          </Form.Item>
        </div>

        <div className="admin-deputy-editor__grid">
          <div className="admin-card">
            <div className="admin-deputy-editor__section-title">Контакты</div>
            <div className="admin-split">
              <Form.Item label="Email" name="email">
                <Input type="email" disabled={loading || saving} />
              </Form.Item>
              <Form.Item label="Телефон" name="phoneNumber">
                <Input disabled={loading || saving} />
              </Form.Item>
            </div>
            <Form.Item label="Адрес" name="address">
              <Input.TextArea disabled={loading || saving} autoSize={{ minRows: 2, maxRows: 4 }} />
            </Form.Item>
          </div>

          <div className="admin-card">
            <div className="admin-deputy-editor__section-title">Приём граждан</div>
            <Form.Item
              label="График приема граждан (HTML)"
              name="receptionSchedule"
              tooltip="Любой HTML: p, h1-h6, strong/em, ul/ol/li, a и т.д. Сохраняется как есть (в notes)."
            >
              <Input.TextArea
                disabled={loading || saving}
                autoSize={{ minRows: 6, maxRows: 14 }}
                placeholder="<p>Пн–Пт: 09:00–18:00</p>\n<p>Сб: 10:00–14:00</p>"
                style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
              />
            </Form.Item>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-deputy-editor__section-title">Фото</div>
          <Form.Item
            label="Фото"
            tooltip="Фото загружается через API /persons/{id}/media (после сохранения)"
          >
            <Upload
              accept="image/*"
              maxCount={1}
              beforeUpload={(file) => {
                setPhotoFile(file);
                return false;
              }}
              showUploadList={true}
            >
              <Button disabled={loading || saving}>Выбрать фото</Button>
            </Upload>
            <div className="admin-hint">
              Для режима “создать” фото загрузится сразу после создания записи на сервере. Если запись создана локально —
              фото не загрузится, пока не будет синхронизации в API.
            </div>
          </Form.Item>
        </div>
      </Form>

      <Modal
        title="Добавить новую фракцию"
        open={newFactionOpen}
        onCancel={() => {
          setNewFactionOpen(false);
          setNewFactionName("");
        }}
        okText="Добавить"
        cancelText="Отмена"
        okButtonProps={{ disabled: !canWrite || !String(newFactionName || "").trim() }}
        onOk={async () => {
          const name = String(newFactionName || "").trim();
          if (!name) return;
          try {
            await PersonsApi.createFaction({ name });
            await refreshLookups();
            setFactions((prev) => {
              const arr = Array.isArray(prev) ? prev : [];
              const next = Array.from(new Set([...arr.map(String), name]));
              return next;
            });
            form.setFieldValue("faction", name);
            message.success("Фракция добавлена");
            setNewFactionOpen(false);
            setNewFactionName("");
          } catch (e) {
            message.error(e?.message || "Не удалось добавить фракцию");
          }
        }}
      >
        <Input
          placeholder="Например: Фракция «Единая Тыва»"
          value={newFactionName}
          onChange={(e) => setNewFactionName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
        />
        <div className="admin-hint" style={{ marginTop: 8 }}>
          Фракция будет сохранена в API и появится в выпадающем списке.
        </div>
      </Modal>

      <Modal
        title="Добавить округ"
        open={newDistrictOpen}
        onCancel={() => {
          setNewDistrictOpen(false);
          setNewDistrictName("");
        }}
        okText="Добавить"
        cancelText="Отмена"
        okButtonProps={{ disabled: !canWrite || !String(newDistrictName || "").trim() }}
        onOk={async () => {
          const name = String(newDistrictName || "").trim();
          if (!name) return;
          try {
            await PersonsApi.createDistrict({ name });
            await refreshLookups();
            form.setFieldValue("electoralDistrict", name);
            message.success("Округ добавлен");
            setNewDistrictOpen(false);
            setNewDistrictName("");
          } catch (e) {
            message.error(e?.message || "Не удалось добавить округ");
          }
        }}
      >
        <Input
          placeholder="Например: Тере-Холь"
          value={newDistrictName}
          onChange={(e) => setNewDistrictName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
        />
        <div className="admin-hint" style={{ marginTop: 8 }}>
          Округ будет сохранен в API и появится в выпадающем списке.
        </div>
      </Modal>

      <Modal
        title="Добавить созыв"
        open={newConvocationOpen}
        onCancel={() => {
          setNewConvocationOpen(false);
          setNewConvocationName("");
        }}
        okText="Добавить"
        cancelText="Отмена"
        okButtonProps={{ disabled: !canWrite || !String(newConvocationName || "").trim() }}
        onOk={async () => {
          const name = String(newConvocationName || "").trim();
          if (!name) return;
          try {
            await PersonsApi.createConvocation({ name });
            await refreshLookups();
            const currentConvocations = form.getFieldValue("convocations") || [];
            form.setFieldValue("convocations", [...currentConvocations, name]);
            message.success("Созыв добавлен");
            setNewConvocationOpen(false);
            setNewConvocationName("");
          } catch (e) {
            message.error(e?.message || "Не удалось добавить созыв");
          }
        }}
      >
        <Input
          placeholder="Например: VIII"
          value={newConvocationName}
          onChange={(e) => setNewConvocationName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
        />
        <div className="admin-hint" style={{ marginTop: 8 }}>
          Созыв будет сохранен в API и появится в выпадающем списке.
        </div>
      </Modal>

      <Modal
        title="Добавить комитет"
        open={newCommitteeOpen}
        onCancel={() => {
          setNewCommitteeOpen(false);
          setNewCommitteeName("");
        }}
        okText="Добавить"
        cancelText="Отмена"
        okButtonProps={{ disabled: !canWrite || !String(newCommitteeName || "").trim() }}
        onOk={async () => {
          const name = String(newCommitteeName || "").trim();
          if (!name) return;
          try {
            // Коммитеты обычно хранятся в DataContext, добавим в локальный список
            const newCommittee = {
              id: `committee-${Date.now()}`,
              name: name,
              title: name,
            };
            // Обновим список комитетов в контексте
            setCommittees((prev) => {
              const arr = Array.isArray(prev) ? prev : [];
              // Проверяем, не существует ли уже такой комитет
              const exists = arr.some(
                (c) =>
                  String(c?.id || "") === String(newCommittee.id) ||
                  String(c?.name || "").toLowerCase() === name.toLowerCase() ||
                  String(c?.title || "").toLowerCase() === name.toLowerCase()
              );
              if (exists) return prev;
              return [...arr, newCommittee];
            });
            // Добавим выбранный комитет в форму
            const currentCommittees = form.getFieldValue("committeeIds") || [];
            form.setFieldValue("committeeIds", [...currentCommittees, newCommittee.id]);
            message.success("Комитет добавлен");
            setNewCommitteeOpen(false);
            setNewCommitteeName("");
          } catch (e) {
            message.error(e?.message || "Не удалось добавить комитет");
          }
        }}
      >
        <Input
          placeholder="Например: Комитет по экономике"
          value={newCommitteeName}
          onChange={(e) => setNewCommitteeName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
        />
        <div className="admin-hint" style={{ marginTop: 8 }}>
          Комитет будет добавлен в список и появится в выпадающем списке.
        </div>
      </Modal>
    </div>
  );
}


