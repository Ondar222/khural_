// Temporary CDP probe: dump what the public person page shows for a deputy.
import { spawn } from "node:child_process";

const CHROME = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const PORT = 9355;

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    `--remote-debugging-port=${PORT}`,
    "--user-data-dir=/tmp/khural-cdp-pub-profile",
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
const logs = [];
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
  if (msg.method === "Runtime.consoleAPICalled") {
    logs.push((msg.params.args || []).map((a) => a.value ?? a.description ?? a.type).join(" "));
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
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) return { ERR: JSON.stringify(r.exceptionDetails).slice(0, 500) };
  return r.result.value;
}

await send("Page.enable");
await send("Runtime.enable");

const target = process.argv[2] || "http://localhost:5173/government?type=dep&id=2";
await send("Page.navigate", { url: target });
await sleep(10000);

const snap = `(() => {
  const txt = (el) => (el ? (el.innerText || '').trim() : null);
  const out = {
    url: location.pathname + location.search,
    name: txt(document.querySelector('.person-name')),
    meta: txt(document.querySelector('.person-meta')),
    photo: document.querySelector('.person-portrait') ? document.querySelector('.person-portrait').getAttribute('src') : null,
    bio: (txt(document.querySelector('#bio .prose')) || '').slice(0, 200),
    contacts: txt(document.querySelector('#contacts')) ? txt(document.querySelector('#contacts')).replace(/\\s+/g,' ').slice(0, 300) : null,
    laws: (txt(document.querySelector('#laws')) || '').slice(0, 150),
    income: (txt(document.querySelector('#income')) || '').slice(0, 150),
    schedule: (txt(document.querySelector('#schedule')) || '').slice(0, 150),
  };
  return out;
})()`;

console.log(JSON.stringify(await evalJs(snap), null, 2));
console.log("LOGS:", JSON.stringify(logs.slice(-10), null, 2));
ws.close();
chrome.kill();
process.exit(0);
