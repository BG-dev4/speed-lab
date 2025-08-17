// Compare two Lighthouse JSON files and print deltas (ms/KB) + pass/fail
// usage: node tools/lh-delta.js before.json after.json
import fs from "node:fs";

const [,, beforePath, afterPath] = process.argv;
if (!beforePath || !afterPath) { console.error("Usage: node 
tools/lh-delta.js before.json after.json"); process.exit(1); }

const load = p => JSON.parse(fs.readFileSync(p, "utf-8"));
const ms = v => `${Math.round(v)} ms`;
const kb = v => `${Math.round(v/1024)} KB`;

const pick = r => ({
  perf: r.categories.performance.score * 100,
  lcp: r.audits["largest-contentful-paint"].numericValue,
  fcp: r.audits["first-contentful-paint"].numericValue,
  cls: r.audits["cumulative-layout-shift"].numericValue,
  inp: r.audits["interactive"].numericValue ?? 
r.audits["interactive"].numericValue, // Lighthouse legacy mapping
  ttfb: r.audits["server-response-time"]?.numericValue ?? 
r.audits["time-to-first-byte"]?.numericValue,
  jsBytes: 
r.audits["total-byte-weight"].details?.items?.find(i=>i.resourceType==="Script")?.transferSize 
?? 0,
  imgBytes: 
r.audits["total-byte-weight"].details?.items?.find(i=>i.resourceType==="Image")?.transferSize 
?? 0,
  cssBytes: 
r.audits["total-byte-weight"].details?.items?.find(i=>i.resourceType==="Stylesheet")?.transferSize 
?? 0,
});

const A = pick(load(beforePath));
const B = pick(load(afterPath));

const rows = [
  ["Performance", `${A.perf}`, `${B.perf}`, `${B.perf - A.perf}`],
  ["LCP", ms(A.lcp), ms(B.lcp), ms(B.lcp - A.lcp)],
  ["FCP", ms(A.fcp), ms(B.fcp), ms(B.fcp - A.fcp)],
  ["CLS", A.cls.toFixed(3), B.cls.toFixed(3), (B.cls - A.cls).toFixed(3)],
  ["TTFB", ms(A.ttfb), ms(B.ttfb), ms(B.ttfb - A.ttfb)],
  ["JS Bytes", kb(A.jsBytes), kb(B.jsBytes), kb(B.jsBytes - A.jsBytes)],
  ["IMG Bytes", kb(A.imgBytes), kb(B.imgBytes), kb(B.imgBytes - 
A.imgBytes)],
  ["CSS Bytes", kb(A.cssBytes), kb(B.cssBytes), kb(B.cssBytes - 
A.cssBytes)]
];

const pad = (s,w)=>String(s).padEnd(w);
console.log("\nLighthouse Delta (after - before)\n");
console.log([pad("Metric",16), pad("Before",12), pad("After",12), 
"Δ"].join(" | "));
console.log("-".repeat(60));
for (const r of rows) console.log([pad(r[0],16), pad(r[1],12), 
pad(r[2],12), r[3]].join(" | "));
console.log("\nTargets: LCP≤2500ms, CLS≤0.1, INP≤200ms, TTFB≤800ms, 
Total JS<150KB, Largest IMG<200KB");

