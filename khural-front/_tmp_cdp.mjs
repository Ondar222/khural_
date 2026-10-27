// Temporary CDP driver to reproduce SPA navigation bugs.
import { spawn } from "node:child_process";

const CHROME = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const PORT = 9333;

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    `--remote-debugging-port=${PORT}`,
    "--user-data-dir=/tmp/khural-cdp-profile",
    "about:blank",
  ],
  { stdio: "ignore" },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(300);
  }
  throw new Error("no ws");
}

const wsUrl = await getWsUrl();
const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener("open", r));

let idc = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
});
function send(method, params = {}) {
  const id = ++idc;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evalJs(expression) {
  const r = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails) return { ERR: JSON.stringify(r.exceptionDetails).slice(0, 400) };
  return r.result.value;
}

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");

const logs = [];
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.method === "Runtime.consoleAPICalled") {
    logs.push(
      (msg.params.args || []).map((a) => a.value ?? a.description ?? a.type).join(" "),
    );
  }
  if (msg.method === "Runtime.exceptionThrown") {
    logs.push("EXCEPTION: " + JSON.stringify(msg.params.exceptionDetails).slice(0, 300));
  }
});

const target = process.argv[2] || "http://localhost:5173/info";
const clicks = process.argv[3] ? (process.argv[3] === "auto" ? "auto" : process.argv[3].split("|").filter(Boolean)) : [];

await send("Page.navigate", { url: target });
await sleep(6000);

const snap = `(() => {
  const q = (s) => document.querySelector(s);
  const nav = q('.sidenav');
  const links = nav ? Array.from(nav.querySelectorAll('a.tile')).length : -1;
  const hrefs = nav ? Array.from(nav.querySelectorAll('a.tile')).map(a=>a.getAttribute('href')).join('|') : null;
  const card = q('.page-grid > div .card');
  const cardLinks = card ? Array.from(card.querySelectorAll('a')).map(a=>a.getAttribute('href')).join('|') : null;
  const txt = card ? (card.innerText || '').trim().slice(0, 90).replace(/\s+/g, ' ') : null;
  return {
    path: location.pathname + location.search,
    h1: q('h1') ? q('h1').innerText.trim() : null,
    sidenavTitle: nav ? (nav.querySelector('h3') || {}).innerText : null,
    sidenavLinks: links,
    sidenavHrefs: hrefs,
    cardLinks: cardLinks,
    contentLen: card ? (card.innerText || '').trim().length : -1,
    contentStart: txt,
    empty: /Страница не найдена|Страниц нет|Сведения отсутствуют/.test(document.body.innerText),
  };
})()`;

const out = [];
out.push({ step: "load " + target, state: await evalJs(snap) });

for (const sel of clicks) {
  const clicked = await evalJs(`(() => {
    const allLinks = Array.from(document.querySelectorAll('a.tile, a'));
    const el = allLinks.find(e => (e.getAttribute('href')||'') === ${JSON.stringify(sel)});
    if (!el) return 'NOT FOUND ' + ${JSON.stringify(sel)};
    el.click();
    return 'clicked ' + (el.getAttribute('href') || el.textContent.trim().slice(0,40));
  })()`);
  await sleep(2500);
  out.push({ step: clicked, state: await evalJs(snap) });
}

console.log(JSON.stringify(out, null, 2));
console.log("LOGS:", JSON.stringify(logs.slice(-15), null, 2));
ws.close();
chrome.kill();
process.exit(0);
