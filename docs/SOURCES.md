# Official sources and collection status

Reviewed 29 October 2026. These observations describe availability during development, not current flood conditions.

| Source | Observation | Integration |
|---|---|---|
| [PDMA Sindh](https://pdma.gos.pk/) | Website request timed out; robots request unavailable | Manual upload only; permission and supported feed pending |
| [PMD Flood Forecasting Division](https://ffd.pmd.gov.pk/) | Public homepage and publications links reachable; robots request unavailable | Manual upload only; no supported feed or collection permission verified |

No robots result, terms/licence, or published supported API was verified that authorizes automated collection. Public availability alone does not grant permission. Adapters in `services/worker/sources.py` intentionally perform no scraping and never record successful retrieval. Their check timestamps mean the adapter ran, not the authority was contacted. The user interface separately displays last successful retrieval as unavailable. Do not substitute homepage availability for bulletin freshness.

For an actual integration: obtain documented permitted feed access, record terms and attribution requirements, define update cadence and outage handling with the authority, write bounded allowlisted HTTPS fetching (disable redirects or revalidate every redirect, reject private/reserved IPs and DNS rebinding), preserve permitted originals/hashes and publication vs ingestion timestamps, test parsing against real fixtures, and retain human publication approval. No arbitrary URL fetching exists in this prototype; source reference URLs are validated and stored only.

Demo records reference an authority homepage solely for navigational context. Their authority is explicitly the demo fixture and they were not issued by PDMA or PMD. They never appear in live collection queries or external delivery adapters.

Preparedness content is conservative product editorial guidance with its own review date, not an extracted government emergency bulletin. Linked official channels are contextual references. Urdu/Sindhi navigation is a draft; emergency translations must receive human review before publication.

Documentation consulted: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Expo SDK reference](https://docs.expo.dev/versions/latest/), [Expo notifications](https://docs.expo.dev/versions/latest/sdk/notifications/), [FastAPI](https://fastapi.tiangolo.com/), [PostgreSQL 18](https://www.postgresql.org/docs/18/). Installed Expo's `bundledNativeModules.json` was used for native package alignment. Exact JS resolution is in `package-lock.json`; exact tested Python resolution is in `requirements.lock.txt`.
