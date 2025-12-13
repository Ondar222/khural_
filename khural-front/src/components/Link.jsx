import React from "react";

export default function Link({ to, children, onClick, ...rest }) {
  const handle = (e) => {
    if (onClick) onClick(e);
    if (e.defaultPrevented) return;
    e.preventDefault();
    const target = typeof to === "string" ? to : String(to || "");
    window.location.hash = target.startsWith("#") ? target : `#${target}`;
  };
  return (
    <a href={to} onClick={handle} {...rest}>
      {children}
    </a>
  );
}
