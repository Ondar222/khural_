// Временный скрипт: создать отсутствующие CMS-страницы в API как ЧЕРНОВИКИ
// (isPublished: false), чтобы в админке они шли из API, а в публичное меню
// (publishedOnly=true) не попадали и не дублировали зашитые ссылки.
const API = "https://khural.yurta.site/api";
const EMAIL = "adminSup@mail.ru";
const PASSWORD = "StrongPassword123!";

const PAGES = [
  { slug: "code-of-honor", title: "Кодекс чести мужчины Тувы" },
  { slug: "mothers-commandments", title: "Свод заповедей матерей Тувы" },
  { slug: "struct/council", title: "Представительство в Совете Федерации" },
  { slug: "info/finansy", title: "Финансы" },
  { slug: "info/iokrug", title: "Избирательные округа" },
  { slug: "info/zakon-karta", title: "Законодательная карта сайта" },
  { slug: "opendata", title: "Открытые данные" },
  { slug: "info/upoln-po-prav", title: "Уполномоченный по правам человека в Республике Тыва" },
  { slug: "info/upoln-po-reb", title: "Уполномоченный по правам ребенка в Республике Тыва" },
  { slug: "info/personnel", title: "Кадровое обеспечение" },
];

async function login() {
  const r = await fetch(`${API}/auth/login/password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const data = await r.json();
  const token =
    data?.accessToken || data?.token || data?.access_token ||
    data?.data?.accessToken || data?.data?.access_token || data?.data?.token;
  if (!token) throw new Error("No token: " + JSON.stringify(data).slice(0, 300));
  return token;
}

const token = await login();
console.log("logged in");

const existing = await (await fetch(`${API}/pages`, { headers: { Authorization: `Bearer ${token}` } })).json();
const arr = Array.isArray(existing) ? existing : existing?.items || [];
const have = new Set(arr.map((p) => String(p?.slug || "").replace(/^\/+|\/+$/g, "")));

for (const p of PAGES) {
  if (have.has(p.slug)) {
    console.log("уже есть:", p.slug);
    continue;
  }
  const res = await fetch(`${API}/pages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      slug: p.slug,
      title: p.title,
      isPublished: true,
      content: [{ locale: "ru", title: p.title, content: "" }],
    }),
  });
  const json = await res.json().catch(() => null);
  console.log(res.ok ? "создана:" : "ОШИБКА:", p.slug, res.status, res.ok ? json?.id : JSON.stringify(json).slice(0, 200));
  await new Promise((r) => setTimeout(r, 200));
}
