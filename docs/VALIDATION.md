# Validation report — 29 October 2026

## Connected Neon verification

Verified the connected Neon organization is on the Free plan, then created `sindh-flood-watch` in Singapore with PostgreSQL 18 and fixed 0.25 CU compute. The provider rejected an explicit suspend-timeout setting on this plan; the successful creation retained the provider's plan-managed defaults without changing the account plan.

Generated migration SQL from the existing Alembic revisions and applied it in a transaction to a separate `schema-validation` branch. Verified revision `0002`, eight public tables, `advisories.supersedes`, and the outbox uniqueness constraint. Confirmed production was empty, applied the same generated SQL there, and verified revision `0002`, eight tables, zero advisories and zero administrators. No seed warnings, subscriber data or credentials were copied from the local database. The validation branch is retained for subsequent tests; no persistent notification worker was started.

Render workspace discovery returned an unavailable-tool error, and its Dashboard requires sign-in. The GitHub browser session also requires sign-in, and this local folder has no Git remote. No remote application service or public application URL has been created. Hosting still requires these account/source prerequisites.

## Free-hosting preparation

Prepared Render Free web/API configuration with Neon, migration-on-start, disabled external notifications and no persistent worker. Added a same-origin Next.js API proxy and verified the production build emits its expected rewrite using a non-routable test origin. Default local builds, lint/type checks and all 17 integration tests pass. Parsed `render.yaml` and checked that it defines only two free web services and no managed paid database/worker. Created a source-only ZIP excluding real environment files, local databases, dependencies and build output.

This remains preparation, not a verified internet deployment. Render and Neon integrations have been suggested but were not connected at the time of validation. The GitHub connection returned no visible repositories, and no remote repository has been selected or created. Remote account/project creation, actual Neon credentials, deployment URLs, proxy-cookie behavior on the hosted services and cold-start performance remain to be verified after account connections.

## Green theme and Neon follow-up

Applied the supplied dark-green/cream visual reference, a horizontal responsive web masthead, the supplied emblem in both clients, and explicit independent-service/no-endorsement labels. Browser-inspected the web masthead and Expo interface with the actual local API. Preserved demo labels and source-staleness notices.

Neon-compatible PostgreSQL URLs now use the installed psycopg 3 driver while preserving the source URL's TLS options. Connection pre-ping and recycling handle reused serverless connections. Three parameterized URL tests raise the suite total to **17 tests**. Remote Neon connection remains untested: no project credentials have been configured. See `NEON.md` for setup and the effect of continuous worker polling on free compute.

## Deployment preparation follow-up

Added a standalone production Compose configuration with Next.js, Caddy HTTPS, private API/PostgreSQL, a worker, migration job, database/schema readiness and worker heartbeat probes. Production web builds default to live view and use same-origin `/api`. Added a non-mutating remote smoke-check script and an actionable live-data/hosting guide in `DEPLOYMENT.md`.

The suite now has **14 passing integration tests**: the original 12 plus database readiness/unmigrated-schema behavior and manually approved live-record/chatbot isolation from demo data. Both app type checks, ESLint, Ruff and the Next.js production build pass after these changes. Docker remains unavailable here, so the container build/startup, Linux standalone output, TLS certificate issuance and remote deployment have not been executed. No hosting account/domain has been supplied or provisioned. Live source adapters remain pending a documented feed and permission.

## Working and exercised

- FastAPI runs locally on port 8000; Next.js on 3000; the actual Expo React Native interface on 8081; a separate worker processes durable outbox records.
- Alembic migration through `0002` applied successfully to the local SQLite development database. Fictional Sukkur, Dadu and Thatta seed records are separate from live queries and clearly labelled.
- **12 integration tests pass**, exercising administrator login/authorization, CSRF origin restriction, draft approval/publication, edits resetting approval, intended district matching, demo/live separation, demo external-adapter suppression, withdrawal/expiry, persistent duplicate suppression, scheduled retry/restart, changed preferences suppressing queued messages, missing/stale sources, chatbot supported/unsupported questions and citations, translation approval checks, upload type/size limits, subscriber token ownership and deletion, approved superseding updates, and pending source adapter status.
- Browser inspected: dashboard, cited chatbot answer, subscription consent/save state and Expo advisory detail screen. Both interfaces fetch from the same API. Stopped the actual API and refreshed both interfaces: cached information persisted, the connection-unavailable notice appeared, and cached records explicitly required validity verification. API restored afterward.
- Next.js production compilation passes; TypeScript checks pass for both apps; ESLint and Ruff pass.
- Expo exports Android and iOS Hermes bundles plus web JavaScript successfully. This is bundle validation, not a signed installable app or proof of native runtime/device notification behavior.
- Local queue integration tests verify one matching Dadu mock delivery, no Thatta/live subscription delivery, and no second record after repeated worker runs. No external push/Telegram messages were sent.

## Verification limits and integration status

- Docker is not installed on this computer. PostgreSQL Compose runtime and PostgreSQL concurrent-worker locking were not executed; the migration/schema and row-lock paths are provided. Run the same workflow against PostgreSQL before deployment. SQLite local mode supports one worker only.
- Native Android/iOS installation, physical-device background/killed-app behavior, notification permissions, FCM/APNs credentials, provider rate-limit responses and receipt reconciliation were not tested with real providers. The provider adapters are opt-in; accepted tickets are explicitly not labelled delivered.
- Full offline cold-start service-worker behavior is implemented for the production website but was not tested with the entire browser network disconnected. The verified outage test stopped the API while keeping the interface server reachable. Installed native app offline startup/storage also requires physical-device validation.
- Web UI was inspected in the desktop browser's constrained viewport and Expo preview at phone width. Automated viewport overrides were not reliable for the existing web tab; full real-device responsive/accessibility testing remains appropriate before release. CSS includes 650/900/1180px breakpoints and manual keyboard-focus styling.
- Official live collection is **pending**, not silently replaced with fixtures. FFD's homepage was reachable; PDMA timed out; supported feeds, robots policy and collection/reuse permission were not verified. `last_success` remains unavailable. Source adapters do not scrape.
- The server-only optional LLM provider interface exists, but public chat uses structured retrieval exclusively. No LLM provider request was made. Urdu/Sindhi navigation is draft; reviewed translated emergency guidance is not supplied.
- PDF extraction accepts bounded PDF/text files but is not sandboxed against pathological parser workloads. Production requires an isolated resource-limited extraction service and a gateway body limit.
- Subscription management credentials persist in browser storage or native SecureStore. Recovery from a lost token, admin MFA and two-person approval are not implemented.

## Dependency findings

Exact resolutions: `package-lock.json` and `requirements.lock.txt`. Official Expo native-module compatibility map used with SDK 58.0.21, React 19.3.0 and React Native 0.88.1. Next.js 16.4.3 compiled successfully on Node 24.18.0; backend tested on Python 3.14.6.

`npm audit` reports **7 low-severity findings**, all through Expo development/build tooling's `deepmerge` dependency chain. A compatible published patch was not available (registry latest 4.3.1). No forced Expo major-version downgrade was applied. The high-severity Zod finding was removed using a patched 4.6.x override; Expo CLI start and Android/iOS/web exports were then exercised successfully. See `dependency-audit.json` for the saved findings. npm blocked the optional `unrs-resolver` postinstall script; lint and builds still passed. Expo's optional latest React Native DevTools download was denied by the sandbox and it used the bundled fallback.

Pytest emits one upstream Starlette/httpx deprecation warning; all assertions pass. This is a local prototype with explicit reliability limits, not an operational public warning service.
