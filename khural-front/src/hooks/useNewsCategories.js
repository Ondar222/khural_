/** Категории новостей: грузим из API, при пустом ответе — собираем из самих новостей.
 * Кэш на 5 минут, чтобы не дёргать бэкенд на каждой странице. */
import React from "react";
import { NewsApi } from "../api/client.js";

const CACHE = { cats: null, ts: 0 };
const TTL = 5 * 60 * 1000;

function normalize(raw) {
  const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
  const out = [];
  const seen = new Set();
  arr.forEach((c) => {
    if (!c) return;
    const name = typeof c === "string" ? c : String(c.name || c.title || "").trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const rawId = typeof c === "string" ? null : c.id ?? c._id ?? null;
    const id = Number.isFinite(Number(rawId)) && Number(rawId) > 0 ? Number(rawId) : key;
    out.push({ id, name });
  });
  return out;
}

export function categoriesFromNews(news) {
  const names = [];
  (news || []).forEach((n) => {
    const c = n?.category;
    if (!c) return;
    const name = typeof c === "string" ? c : String(c.name || c.title || "").trim();
    if (name) names.push({ name });
  });
  return normalize(names);
}

export function useNewsCategories() {
  const [categories, setCategories] = React.useState(() => CACHE.cats || []);
  const [loading, setLoading] = React.useState(!CACHE.cats);
  const [error, setError] = React.useState(null);

  const load = React.useCallback(async (force = false) => {
    if (!force && CACHE.cats && CACHE.cats.length && Date.now() - CACHE.ts < TTL) {
      setCategories(CACHE.cats);
      setLoading(false);
      return CACHE.cats;
    }
    setLoading(true);
    setError(null);
    let cats = [];
    try {
      cats = normalize(await NewsApi.getAllCategories());
    } catch (err) {
      setError(err?.message || "Не удалось загрузить категории");
    }
    CACHE.cats = cats.length ? cats : CACHE.cats || [];
    if (cats.length) CACHE.ts = Date.now();
    setCategories(cats);
    setLoading(false);
    return cats;
  }, []);

  React.useEffect(() => {
    load(false);
  }, [load]);

  return { categories, loading, error, reload: (force = true) => load(force) };
}