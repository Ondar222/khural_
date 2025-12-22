import React from "react";
import { Button, Result } from "antd";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep console error for debugging; optionally send to backend later
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      const message =
        (this.state.error && (this.state.error.message || String(this.state.error))) ||
        "Неизвестная ошибка";

      return (
        <div className="section">
          <div className="container">
            <Result
              status="error"
              title="Произошла ошибка"
              subTitle={message}
              extra={[
                <Button key="reload" type="primary" onClick={() => window.location.reload()}>
                  Обновить страницу
                </Button>,
                <Button
                  key="home"
                  onClick={() => {
                    window.history.pushState({}, "", "/");
                    window.dispatchEvent(new Event("app:navigate"));
                  }}
                >
                  На главную
                </Button>,
              ]}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

