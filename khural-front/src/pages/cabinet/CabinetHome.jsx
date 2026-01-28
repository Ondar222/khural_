import React from "react";
import { Card, Col, Row, Statistic } from "antd";
import CabinetShell from "./CabinetShell.jsx";
import { AppealsApi } from "../../api/client.js";

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  const p = payload?.data ? payload.data : payload;
  if (Array.isArray(p?.items)) return p.items;
  if (Array.isArray(p?.results)) return p.results;
  return [];
}

export default function CabinetHome() {
  const [appealsCount, setAppealsCount] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await AppealsApi.listMine({ page: 1, limit: 1 });
        const items = normalizeList(res);
        // Some backends return total in meta; if not, just show "есть/нет"
        const total =
          Number(res?.total) ||
          Number(res?.meta?.total) ||
          Number(res?.pagination?.total) ||
          (items.length ? 1 : 0);
        if (alive) setAppealsCount(total);
      } catch {
        if (alive) setAppealsCount(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <CabinetShell active="home">
      <Row gutter={[16, 16]}>
        {/* Карточка «Обращения» временно скрыта */}
        {false && (
          <Col xs={24} md={12}>
            <a href="/cabinet/appeals" style={{ textDecoration: "none" }}>
              <Card hoverable>
                <Statistic
                  title="Обращения"
                  value={appealsCount === null ? "—" : appealsCount}
                />
                <div style={{ marginTop: 8, color: "#6b7280" }}>
                  Подать обращение и посмотреть историю.
                </div>
              </Card>
            </a>
          </Col>
        )}
        <Col xs={24} md={12}>
          <a href="/cabinet/account" style={{ textDecoration: "none" }}>
            <Card hoverable>
              <Statistic title="Личный аккаунт" value="Профиль" />
              <div style={{ marginTop: 8, color: "#6b7280" }}>
                Данные аккаунта и выход из системы.
              </div>
            </Card>
          </a>
        </Col>
      </Row>
    </CabinetShell>
  );
}

