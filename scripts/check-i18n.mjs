// Fails if a translation key is used in the code but missing from a language,
// or if the languages have drifted apart. Run: npm run check:i18n
import fs from "node:fs";
import path from "node:path";

const load = async (l) => (await import(path.resolve(`src/locales/${l}.js`))).default;
const flat = (o, p = "") =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === "object" ? flat(v, `${p}${k}.`) : [`${p}${k}`]));

const langs = { en: await load("en"), es: await load("es"), pt: await load("pt") };
const keys = Object.fromEntries(Object.entries(langs).map(([l, d]) => [l, new Set(flat(d))]));
const has = (l, k) => keys[l].has(k) || keys[l].has(`${k}_one`) || keys[l].has(`${k}_other`);

const files = [];
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(jsx?|tsx?)$/.test(e.name) && !p.includes("locales")) files.push(p);
  });
walk("src");

const used = new Set();
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(/\bt\(\s*"([a-zA-Z0-9_.]+)"/g)) used.add(m[1]);
}
// Keys built at runtime
["how.s1Title", "how.s2Title", "how.s3Title", "how.s1Text", "how.s2Text", "how.s3Text"].forEach((k) => used.add(k));
["asap", "month", "later", "flexible"].forEach((k) => used.add(`inquiry.moveIn.${k}`));
["collect", "use", "share", "keep", "choices"].forEach(
  (s) => (used.add(`privacy.${s}Title`), used.add(`privacy.${s}Text`)),
);

let problems = 0;
for (const k of used)
  for (const l of Object.keys(langs)) if (!has(l, k)) (problems++, console.log(`missing ${l}: ${k}`));
for (const l of ["es", "pt"]) {
  for (const k of keys.en) if (!keys[l].has(k)) (problems++, console.log(`${l} lacks ${k}`));
  for (const k of keys[l]) if (!keys.en.has(k)) (problems++, console.log(`${l} has extra ${k}`));
}
for (const k of keys.en) {
  const base = k.replace(/_(one|other)$/, "");
  if (!used.has(base) && !used.has(k)) console.log(`(unused) ${k}`);
}
console.log(problems ? `\n${problems} translation problem(s)` : `i18n OK — ${used.size} keys, 3 languages`);
process.exit(problems ? 1 : 0);
