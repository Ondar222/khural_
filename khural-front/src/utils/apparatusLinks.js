// Функция для получения ссылок бокового меню с переводами
export const getApparatusNavLinks = (t) => [
  { label: t("Структура"), href: "/about?tab=structure&focus=overview" },
  {
    label: t("Руководитель Аппарата"),
    href: "/section?title=" + encodeURIComponent("Руководитель Аппарата"),
  },
  {
    label: t("Заместитель Руководителя Аппарата"),
    href: "/section?title=" + encodeURIComponent("Заместитель Руководителя Аппарата"),
  },
  {
    label: t("Первый помощник Председателя"),
    href: "/section?title=" + encodeURIComponent("Первый помощник Председателя"),
  },
  {
    label: t("Помощник Председателя"),
    href: "/section?title=" + encodeURIComponent("Помощник Председателя"),
  },
  {
    label: t("Помощник заместителя Председателя"),
    href: "/section?title=" + encodeURIComponent("Помощник заместителя Председателя"),
  },
  {
    label: t("Организационное управление"),
    href: "/section?title=" + encodeURIComponent("Организационное управление"),
  },
  {
    label: t("Информационно-аналитическое управление"),
    href: "/section?title=" + encodeURIComponent("Информационно-аналитическое управление"),
  },
  {
    label: t("Государственно-правовое управление"),
    href: "/section?title=" + encodeURIComponent("Государственно-правовое управление"),
  },
  {
    label: t("Управление финансов, бухгалтерского учета и отчетности"),
    href:
      "/section?title=" +
      encodeURIComponent("Управление финансов, бухгалтерского учета и отчетности"),
  },
  {
    label: t("Управление делами"),
    href: "/section?title=" + encodeURIComponent("Управление делами"),
  },
  {
    label: t("Отдел технического и программного обеспечения"),
    href:
      "/section?title=" +
      encodeURIComponent("Отдел технического и программного обеспечения"),
  },
  {
    label: t("Отдел кадров и государственной службы"),
    href:
      "/section?title=" + encodeURIComponent("Отдел кадров и государственной службы"),
  },
];
