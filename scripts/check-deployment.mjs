// Read-only checks; does not create accounts, subscribers, advisories or alerts.
const target = new URL(process.argv[2] || "https://example.invalid");
if (
  target.protocol !== "https:" ||
  target.username ||
  target.password ||
  target.pathname !== "/" ||
  target.search ||
  target.hash
) {
  throw new Error(
    "Pass a bare HTTPS origin, for example https://floodwatch.example.org",
  );
}
async function get(path, json = true) {
  const response = await fetch(new URL(path, target), {
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  console.log(`PASS ${path}: HTTP ${response.status}`);
  return json ? response.json() : response.text();
}
const html = await get("/", false);
if (!html.includes("Sindh Flood Watch")) throw new Error("Unexpected website");
const health = await get("/api/health/ready");
if (health.status !== "ready") throw new Error("API is not ready");
const districts = await get("/api/districts");
if (!districts.includes("Dadu"))
  throw new Error("District API returned unexpected data");
const records = await get("/api/advisories?demo=false");
if (records.some((a) => a.demo))
  throw new Error("Demo data appeared in live collection");
const sources = await get("/api/sources");
for (const source of sources)
  console.log(
    `SOURCE ${source.name}: ${source.stale ? "unavailable/stale" : "recently checked"}; last successful retrieval=${source.last_success ?? "none"}`,
  );
console.log(
  "Web/API smoke checks passed. This does not verify live data, worker delivery, native apps or source freshness.",
);
