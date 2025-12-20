import React from "react";

export default function Link({ to, children, onClick, ...rest }) {
  const handle = (e) => {
    if (onClick) onClick(e);
    if (e.defaultPrevented) return;
    // Let browser handle modified clicks (new tab, etc.)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const target = typeof to === "string" ? to : String(to || "");
    if (!target) return;
    if (target.startsWith("http://") || target.startsWith("https://")) {
      window.location.href = target;
      return;
    }
    if (target.startsWith("#")) {
      window.location.hash = target;
      return;
    }
    window.history.pushState({}, "", target);
    window.dispatchEvent(new Event("app:navigate"));
  };
  return (
    <a href={to} onClick={handle} {...rest}>
      {children}
    </a>
  );
}
