// Temporary CDP probe: inspect admin deputy editor form values.
import { spawn } from "node:child_process";

const CHROME = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const PORT = 9344;

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    `--remote-debugging-port=${PORT}`,
    "--user-data-dir=/tmp/khural-cdp-probe-profile",
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
  if (msg.method === "Runtime.exceptionThrown") {
    logs.push("EXCEPTION: " + JSON.stringify(msg.params.exceptionDetails).slice(0, 300));
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

const target = process.argv[2] || "http://localhost:5173/admin/deputies/edit/2";
await send("Page.navigate", { url: target });
await sleep(9000);

const snap = `(() => {
  const out = { url: location.pathname + location.search, fields: {} };
  document.querySelectorAll('.admin-deputy-editor .ant-form-item').forEach((it) => {
    const label = (it.querySelector('.ant-form-item-label label') || {}).innerText || it.querySelector('label')?.innerText || '?';
    const input = it.querySelector('input, textarea');
    const sel = it.querySelector('.ant-select');
    let value = null;
    if (input) value = input.value;
    else if (sel) value = Array.from(sel.querySelectorAll('.ant-select-selection-item')).map(x=>x.textContent).join(', ');
    out.fields[label.trim()] = value === null ? null : String(value).slice(0, 120);
  });
  const img = document.querySelector('.admin-deputy-editor img');
  out.photo = img ? img.getAttribute('src') : null;
  out.bodySnippets = (document.body.innerText || '').slice(0, 200).replace(/\\s+/g,' ');
  return out;
})()`;

console.log(JSON.stringify(await evalJs(snap), null, 2));
console.log("LOGS:", JSON.stringify(logs.slice(-25), null, 2));
ws.close();
chrome.kill();
process.exit(0);
