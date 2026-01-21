import React from "react";
import CabinetShell from "./CabinetShell.jsx";
import Appeals from "../Appeals.jsx";

export default function CabinetAppeals() {
  return (
    <CabinetShell active="appeals" title="Личный кабинет — Обращения">
      <Appeals embedded />
    </CabinetShell>
  );
}

