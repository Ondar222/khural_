// Temporary scraper for khural.rtyva.ru/info
import * as cheerio from "cheerio";

const urls = process.argv.slice(2);
for (const url of urls) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  const $ = cheerio.load(html);
  $("script, style, header, footer, nav, #panel").remove();
  const main = $("#content, .content, main, article").first();
  const root = main.length ? main : $("body");
  console.log("=== " + url + " ===");
  const text = root.text().replace(/\s+/g, " ").trim();
  console.log(text.slice(0, 4000));
  console.log("");
}
