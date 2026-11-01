// Временный скрипт: логин админа + PATCH страницы комиссии + GET для проверки
import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const email = (env.match(/^VITE_ADMIN_EMAIL=(.*)$/m) || [])[1]?.trim();
const pass = (env.match(/^VITE_ADMIN_PASSWORD=(.*)$/m) || [])[1]?.trim();
console.log("email из .env:", email ? email : "НЕ НАЙДЕН");

const API = "https://khural.yurta.site/api";

async function main() {
  // 1. Логин
  let token = "";
  const loginRes = await fetch(API + "/auth/login/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  });
  const loginJson = await loginRes.json().catch(() => null);
  console.log("login status:", loginRes.status);
  token = loginJson?.access_token || loginJson?.accessToken || loginJson?.token || loginJson?.data?.access_token || "";
  if (!token) {
    console.log("login body:", JSON.stringify(loginJson).slice(0, 300));
    return;
  }
  console.log("token получен:", token.slice(0, 25) + "...");

  // 2. GET текущей страницы
  const getPage = await fetch(API + "/pages/slug/commission-data-schetnaya").then((r) => r.json());
  const page = getPage?.data || getPage;
  console.log("page id:", page.id, "| updatedAt:", page.updatedAt);

  // 3. PATCH с новым тестовым bodyHtml
  const marker = "ТЕСТ-PATCH-" + new Date().toISOString();
  const inner = JSON.stringify({
    type: "khural-commission",
    version: 1,
    id: "schetnaya",
    deleted: false,
    commission: {
      id: "schetnaya",
      name: page.title || "Счетная комиссия Верховного Хурала",
      parentBody: "",
      documentType: "",
      resolutionDate: "",
      resolutionNumber: "",
      resolutionSubject: "",
      bodyHtml: "<p>" + marker + "</p>",
    },
  });
  const patchRes = await fetch(API + "/pages/" + page.id, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({
      content: [
        { locale: "ru", title: page.title, content: inner },
        { locale: "tyv", title: page.title, content: inner },
      ],
    }),
  });
  const patchJson = await patchRes.json().catch(() => null);
  console.log("PATCH status:", patchRes.status);
  console.log("PATCH ответ:", JSON.stringify(patchJson).slice(0, 400));

  // 4. GET снова — проверили, что сохранилось
  await new Promise((r) => setTimeout(r, 800));
  const after = await fetch(API + "/pages/slug/commission-data-schetnaya").then((r) => r.json());
  const ap = after?.data || after;
  console.log("after updatedAt:", ap.updatedAt);
  for (const e of ap.content || []) {
    if (e.locale !== "ru") continue;
    const parsed = JSON.parse(e.content || "{}");
    console.log("after bodyHtml:", (parsed?.commission?.bodyHtml || "").slice(0, 120));
  }
}
main().catch((e) => console.error("ERR:", e.message));
