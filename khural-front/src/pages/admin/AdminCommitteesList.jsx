import React from "react";
import { App, Button, Input, Space, Table, Tag, Select, Empty, Modal } from "antd";
import { useHashRoute } from "../../Router.jsx";
import { normalizeBool } from "../../utils/bool.js";
import { CommitteesApi } from "../../api/client.js";
import { SYSTEM_COMMITTEE_IDS, COMMITTEE_DEFAULT_CONVOCATION } from "../../utils/committeesOverrides.js";
import { MailIcon, PhoneIcon, PinIcon, GlobeIcon } from "../../components/icons/LinearIcons.jsx";

function normalizeCommitteeName(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getCommitteeTitle(row) {
  return String(row?.name || row?.title || row?.label || row?.description || "").trim();
}

/** ID созыва комитета (API может вернуть convocationId, convocation_id или вложенный convocation) */
function getCommitteeConvocationId(row) {
  return (
    row?.convocation?.id ??
    row?.convocationId ??
    row?.convocation_id ??
    row?.convocation
  );
}

function resolveConvocationLabel(list, row) {
  // Если у комитета уже есть объект созыва с названием — показываем его (API или обогащение)
  const conv = row?.convocation;
  if (conv && typeof conv === "object") {
    const name = conv?.name ?? conv?.number ?? conv?.title;
    if (name != null && String(name).trim() !== "") return String(name).trim();
  }
  const convId = getCommitteeConvocationId(row);
  if (convId == null || convId === "") return "";
  const items = Array.isArray(list) ? list : [];
  for (const it of items) {
    if (it == null) continue;
    if (typeof it === "string") {
      if (String(it) === String(convId)) return it;
      continue;
    }
    const id = it?.id ?? it?.value;
    const name = it?.name ?? it?.number ?? it?.title;
    if (id != null && String(id) === String(convId)) return String(name || id);
    if (name != null && String(name) === String(convId)) return String(name);
  }
  // Есть ID созыва, но нет в списке — показываем хотя бы ID вместо «—»
  if (convId != null && convId !== "") return String(convId);
  // Подстановка из кода для комитетов структуры (из /data/committees.json)
  const defaultNum = row?.id != null ? COMMITTEE_DEFAULT_CONVOCATION[String(row.id)] : undefined;
  if (defaultNum != null && defaultNum !== "") return String(defaultNum);
  return "";
}

/** Пустой комитет: нет описания, созыва и депутатов (не считаем системные комитеты структуры) */
function isCommitteeEmpty(row, isSystem) {
  if (isSystem) return false;
  const hasDesc = String(row?.description ?? "").trim().length > 0;
  const hasConv = getCommitteeConvocationId(row) != null && getCommitteeConvocationId(row) !== "";
  const members = Array.isArray(row?.members) ? row.members : [];
  const hasMembers = members.length > 0;
  return !hasDesc && !hasConv && !hasMembers;
}

/** Очки «полноты» комитета: больше = оставляем при дедупликации */
function committeeRichness(row) {
  let score = 0;
  if (String(row?.description ?? "").trim().length > 0) score += 2;
  if (getCommitteeConvocationId(row) != null && getCommitteeConvocationId(row) !== "") score += 2;
  const members = Array.isArray(row?.members) ? row.members : [];
  if (members.length > 0) score += members.length;
  return score;
}

export default function AdminCommitteesList({
  items,
  convocations,
  selectedConvocationId,
  onConvocationChange,
  onToggleActive,
  onReload,
  busy,
  canWrite,
}) {
  const { navigate } = useHashRoute();
  const { message } = App.useApp();
  const [q, setQ] = React.useState("");
  const [busyLocal, setBusyLocal] = React.useState(false);
  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = windowWidth <= 820;

  const isSystemCommittee = (row) =>
    SYSTEM_COMMITTEE_IDS.includes(String(row?.id ?? ""));

  const filtered = React.useMemo(() => {
    let list = Array.isArray(items) ? items.slice() : [];

    // 1) Нормализация: подставить convocationId из convocation_id для отображения и фильтра
    list = list.map((c) => {
      const convId = getCommitteeConvocationId(c);
      if (convId != null && (c.convocationId === undefined && c.convocation?.id === undefined)) {
        return { ...c, convocationId: convId };
      }
      return c;
    });

    // 2) Убрать пустые комитеты (нет описания, созыва и депутатов), кроме системных
    list = list.filter((c) => !isCommitteeEmpty(c, isSystemCommittee(c)));

    // 3) Дедупликация по нормализованному названию: оставить один с большей «полнотой»
    const byName = new Map();
    for (const c of list) {
      const key = normalizeCommitteeName(getCommitteeTitle(c));
      if (!key) continue;
      const existing = byName.get(key);
      if (!existing || committeeRichness(c) > committeeRichness(existing)) {
        byName.set(key, c);
      }
    }
    list = Array.from(byName.values());

    // 4) Фильтр по созыву
    if (selectedConvocationId && selectedConvocationId !== "all") {
      list = list.filter(
        (c) => String(getCommitteeConvocationId(c)) === String(selectedConvocationId)
      );
    }

    // 5) Поиск по названию/описанию
    const qq = q.trim().toLowerCase();
    if (qq) {
      list = list.filter((c) => {
        const title = getCommitteeTitle(c);
        return (
          String(title || "").toLowerCase().includes(qq) ||
          String(c.description || "").toLowerCase().includes(qq)
        );
      });
    }

    return list;
  }, [items, selectedConvocationId, q]);

  const isLocalStatic = (row) => String(row?.id || "").startsWith("local-static-");
  const isLocal = (row) =>
    !isLocalStatic(row) && String(row?.id || "").startsWith("local-");
  const isCommitteeActive = (row) => normalizeBool(row?.isActive, true) !== false;

  const importCommitteesFromJson = React.useCallback(() => {
    if (!canWrite) return;
    Modal.confirm({
      title: "Импортировать комитеты из кода?",
      content:
        "Загрузим комитеты из /public/data/committees.json и создадим отсутствующие в базе. " +
        "Удаление не выполняется, только создание новых.",
      okText: "Импортировать",
      cancelText: "Отмена",
      onOk: async () => {
        setBusyLocal(true);
        try {
          const [staticCommittees, apiCommittees] = await Promise.all([
            fetch("/data/committees.json").then((r) => (r.ok ? r.json() : [])).catch(() => []),
            CommitteesApi.list({ all: true }).catch(() => []),
          ]);
          const apiList = Array.isArray(apiCommittees) ? apiCommittees : [];
          const existingByName = new Set(
            apiList.map((c) => normalizeCommitteeName(c?.name || c?.title || c?.label || c?.description))
          );

          let createdCount = 0;
          let skippedCount = 0;
          let failedCount = 0;
          const srcList = Array.isArray(staticCommittees) ? staticCommittees : [];

          for (const [idx, c] of srcList.entries()) {
            const title = String(c?.title || c?.name || "").trim();
            const key = normalizeCommitteeName(title);
            if (!key) {
              skippedCount += 1;
              continue;
            }
            if (existingByName.has(key)) {
              skippedCount += 1;
              continue;
            }

            const payload = {
              name: title || `Комитет ${idx + 1}`,
              isActive: true,
            };
            if (c?.description) payload.description = String(c.description).trim();

            const convRaw = c?.convocation?.id ?? c?.convocationId ?? c?.convocation;
            const convId = Number(convRaw);
            if (Number.isFinite(convId) && convId > 0) payload.convocationId = convId;

            const rawMembers = Array.isArray(c?.members) ? c.members : [];
            const members = rawMembers
              .map((m, order) => {
                const name = String(m?.name || "").trim();
                if (!name) return null;
                const role = String(m?.role || "Член комитета").trim();
                return { name, role, order };
              })
              .filter(Boolean);
            if (members.length) payload.members = members;

            try {
              await CommitteesApi.create(payload);
              createdCount += 1;
              existingByName.add(key);
            } catch (e) {
              failedCount += 1;
              console.warn("Import committee failed", e);
            }
          }

          message.success(
            `Готово: создано ${createdCount}, пропущено ${skippedCount}, ошибок ${failedCount}`
          );
          onReload?.();
        } catch (e) {
          message.error(`Ошибка импорта: ${e?.message || "неизвестно"}`);
        } finally {
          setBusyLocal(false);
        }
      },
    });
  }, [canWrite, message, onReload]);

  // Функция для обрезки текста с удалением HTML тегов
  const stripHtml = React.useCallback((html) => {
    if (!html) return "";
    const str = String(html);
    // Простое удаление HTML тегов через regex (безопасно для отображения)
    const cleanText = str.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
    return cleanText;
  }, []);

  const truncateText = React.useCallback((text, maxLength = 60) => {
    const cleanText = stripHtml(String(text || ""));
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.slice(0, maxLength) + "…";
  }, [stripHtml]);

  const columns = [
    {
      title: "Комитет",
      dataIndex: "name",
      width: 400,
      ellipsis: true,
      render: (_, row) => (
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: 4,
          minWidth: 0,
          maxWidth: "100%"
        }}>
          <div style={{ 
            fontWeight: 600, 
            fontSize: 13,
            lineHeight: 1.4,
            display: "flex", 
            alignItems: "flex-start", 
            gap: 6,
            minWidth: 0
          }}>
            <span style={{ 
              flex: "1 1 auto", 
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}>
              {truncateText(getCommitteeTitle(row), 60)}
            </span>
            {null}
          </div>
          {row.description ? (
            <div style={{ 
              opacity: 0.7, 
              fontSize: 11,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              wordBreak: "break-word"
            }}>
              {truncateText(row.description, 80)}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Созыв",
      dataIndex: "convocation",
      width: 120,
      align: "center",
      render: (convocation, row) => {
        const label = resolveConvocationLabel(convocations, row);
        return (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            {label ? (
              <Tag style={{ fontSize: 11, margin: 0 }}>{label}</Tag>
            ) : (
              <Tag color="default" style={{ fontSize: 11, margin: 0 }}>—</Tag>
            )}
          </div>
        );
      },
    },
    {
      title: "Статус",
      dataIndex: "isActive",
      width: 110,
      align: "center",
      render: (isActive) => (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          {normalizeBool(isActive, true) !== false ? (
            <Tag color="green" style={{ fontSize: 11, margin: 0 }}>Активный</Tag>
          ) : (
            <Tag color="default" style={{ fontSize: 11, margin: 0 }}>Неактивный</Tag>
          )}
        </div>
      ),
    },
    {
      title: () => <div style={{ textAlign: "center" }}>Действия</div>,
      key: "actions",
      width: 200,
      fixed: "right",
      align: "center",
      render: (_, row) => (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Space size="small" wrap>
            <Button
              size="small"
              disabled={!canWrite}
              onClick={() =>
                navigate(`/admin/committees/edit/${encodeURIComponent(String(row.id))}`)
              }
              style={{ fontSize: 12 }}
            >
              Редактировать
            </Button>
            <Button
              size="small"
              disabled={!canWrite || (isSystemCommittee(row) && isCommitteeActive(row))}
              title={isSystemCommittee(row) ? "Комитеты структуры нельзя отключить" : undefined}
              onClick={() => onToggleActive?.(row, !isCommitteeActive(row))}
              style={{ fontSize: 12 }}
            >
              {isCommitteeActive(row) ? "Отключить" : "Включить"}
            </Button>
          </Space>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-grid">
      <div className="admin-card admin-toolbar">
        <div className="admin-committees-list__toolbar-left">
          <Select
            style={{ 
              minWidth: isMobile ? 140 : 200, 
              flex: isMobile ? "1 1 100%" : "0 0 auto",
              maxWidth: isMobile ? "100%" : "none",
              width: isMobile ? "100%" : "auto"
            }}
            placeholder="Выберите созыв"
            value={selectedConvocationId}
            onChange={onConvocationChange}
            allowClear
            size={isMobile ? "small" : "middle"}
          >
            <Select.Option value="all">Все созывы</Select.Option>
            {(convocations || []).map((c) => (
              <Select.Option key={c.id} value={String(c.id)}>
                {c.name || c.number || `Созыв ${c.id}`}
              </Select.Option>
            ))}
          </Select>
          <Input
            placeholder="Поиск по названию или описанию..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="admin-input admin-committees-search"
            style={{ 
              flex: isMobile ? "1 1 200px" : "1 1 320px", 
              minWidth: isMobile ? 150 : 220,
              maxWidth: isMobile ? "100%" : "none",
              ...(isMobile && {
                height: "28px",
                minHeight: "28px",
                maxHeight: "28px"
              })
            }}
            size="small"
          />
        </div>
        <div className="admin-committees-list__toolbar-right">
          <Button
            type="primary"
            onClick={() => navigate("/admin/committees/create")}
            disabled={!canWrite}
            loading={busy}
            block={isMobile}
          >
            + Добавить комитет
          </Button>
          {/* <Button
            onClick={importCommitteesFromJson}
            disabled={!canWrite}
            loading={busyLocal}
            block={isMobile}
          >
            Импортировать комитеты
          </Button> */}
       
        </div>
      </div>

      <div className="admin-card admin-table">
        {isMobile ? (
          <div className="admin-committees-cards">
            {filtered && filtered.length ? (
              filtered.map((row) => {
                const convName = row?.convocation?.name || row?.convocation?.number || "";
                const desc = row?.description ? String(row.description).trim() : "";
                const phone = row?.phone ? String(row.phone).trim() : "";
                const email = row?.email ? String(row.email).trim() : "";
                const address = row?.address ? String(row.address).trim() : "";
                const website = row?.website ? String(row.website).trim() : "";
                const disabled = !canWrite;
                return (
                  <div key={String(row?.id ?? "")} className="admin-committee-card">
                    <div className="admin-committee-card__header">
                      <div className="admin-committee-card__title">{row?.name || "Комитет"}</div>
                      <div className="admin-committee-card__tags">
                        {null}
                        {row?.isActive ? (
                          <Tag color="green">Активный</Tag>
                        ) : (
                          <Tag color="default">Неактивный</Tag>
                        )}
                      </div>
                    </div>
                    {convName ? (
                      <div className="admin-committee-card__meta">
                        <span style={{ opacity: 0.7 }}>Созыв:</span> {convName}
                      </div>
                    ) : null}
                    {desc ? (
                      <div className="admin-committee-card__desc">
                        {desc.length > 220 ? `${desc.slice(0, 220)}…` : desc}
                      </div>
                    ) : null}
                    {phone || email || address || website ? (
                      <div className="admin-committee-card__contacts">
                        {phone ? <div><PhoneIcon size={14} /> {phone}</div> : null}
                        {email ? <div><MailIcon size={14} /> {email}</div> : null}
                        {address ? <div><PinIcon size={14} /> {address}</div> : null}
                        {website ? <div><GlobeIcon size={14} /> {website}</div> : null}
                      </div>
                    ) : null}
                    <div className="admin-committee-card__actions">
                      <Button
                        block
                        onClick={() =>
                          navigate(`/admin/committees/edit/${encodeURIComponent(String(row.id))}`)
                        }
                        disabled={disabled}
                      >
                        Редактировать
                      </Button>
                      <Button
                        block
                        disabled={!canWrite || (isSystemCommittee(row) && isCommitteeActive(row))}
                        title={isSystemCommittee(row) ? "Комитеты структуры нельзя отключить" : undefined}
                        onClick={() => onToggleActive?.(row, !isCommitteeActive(row))}
                      >
                        {isCommitteeActive(row) ? "Отключить" : "Включить"}
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: 18 }}>
                <Empty description="Нет данных" />
              </div>
            )}
          </div>
        ) : (
          <Table
            rowKey={(r) => String(r.id)}
            columns={columns}
            dataSource={filtered}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 900 }}
            size="small"
            style={{ tableLayout: "fixed" }}
          />
        )}
      </div>
    </div>
  );
}

