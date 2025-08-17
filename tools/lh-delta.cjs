// tools/lh-delta.cjs (CommonJS)
// Compare two Lighthouse JSON files and print deltas (ms/KB)
const fs = require("fs");

const [,, beforePath, afterPath] = process.argv;
if (!beforePath || !afterPath) {
  console.error("Usage: node tools/lh-delta.cjs before.json after.json");
  process.exit(1);
}

const load = p => JSON.parse(fs.readFileSync(p, "utf-8"));
const ms = v => `${Math.round(v)} ms`;
const kb = v => `${Math.round(v/1024)} KB`;

const pick = r => ({
  perf: (r.categories.performance.score ?? 0) * 100,
  lcp: r.audits["largest-contentful-paint"]?.numericValue ?? 0,
  fcp: r.audits["first-contentful-paint"]?.numericValue ?? 0,
  cls: r.audits["cumulative-layout-shift"]?.numericValue ?? 0,
  ttfb: r.audits["server-response-time"]?.numericValue ?? r.audits["time-to-first-byte"]?.numericValue ?? 0,
  bytes: r.audits["total-byte-weight"]?.numericValue ?? 0,
});

const A = pick(load(beforePath));
const B = pick(load(afterPath));

const rows = [
  ["Performance", `${A.perf}`, `${B.perf}`, `${B.perf - A.perf}`],
  ["LCP", ms(A.lcp), ms(B.lcp), ms(B.lcp - A.lcp)],
  ["FCP", ms(A.fcp), ms(B.fcp), ms(B.fcp - A.fcp)],
  ["CLS", A.cls.toFixed(3), B.cls.toFixed(3), (B.cls - A.cls).toFixed(3)],
  ["TTFB", ms(A.ttfb), ms(B.ttfb), ms(B.ttfb - A.ttfb)],
  ["Total Bytes", kb(A.bytes), kb(B.bytes), kb(B.bytes - A.bytes)],
];

const pad = (s,w)=>String(s).padEnd(w);
console.log("\nLighthouse Delta (after - before)\n");
console.log([pad("Metric",16), pad("Before",12), pad("After",12), "Δ"].join(" | "));
console.log("-".repeat(60));
for (const r of rows) console.log([pad(r[0],16), pad(r[1],12), pad(r[2],12), r[3]].join(" | "));
console.log("\nTargets: LCP≤2500ms, CLS≤0.1, INP≤200ms, TTFB≤800ms");
