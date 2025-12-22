import React from "react";
import { Alert, Button, Empty, Spin } from "antd";

export default function DataState({
  loading,
  error,
  empty,
  emptyDescription = "Нет данных",
  onRetry,
  children,
}) {
  if (loading) {
    return (
      <div style={{ padding: "18px 0" }}>
        <Spin />
      </div>
    );
  }

  if (error) {
    const msg = error?.message || String(error);
    return (
      <Alert
        type="error"
        showIcon
        message="Не удалось загрузить данные"
        description={msg}
        action={
          <Button
            size="small"
            onClick={() => {
              if (typeof onRetry === "function") onRetry();
              else window.location.reload();
            }}
          >
            Обновить
          </Button>
        }
      />
    );
  }

  if (empty) {
    return <Empty description={emptyDescription} />;
  }

  return <>{children}</>;
}



