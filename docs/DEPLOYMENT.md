# Connecting live data and deploying

Prepared 29 October 2026. No remote server has been provisioned or deployed. A hosting account/server, domain and any paid budget still need to be chosen. This guide adds a single-server deployment option while retaining the local development setup.

## 1. Live information: start with reviewed bulletins

Live mode is a separate database collection, not a switch that magically connects an authority's feed. You can publish real official information today using manual review:

1. Obtain an original current bulletin from [PDMA Sindh](https://pdma.gos.pk/) or [PMD FFD publications](https://ffd.pmd.gov.pk/bulletin). Confirm the material may be referenced/reused; store only permitted wording or a reference.
2. Sign in to the administrator workspace. Upload a text/PDF bulletin, or enter the details manually. Scanned PDFs require manual transcription and review; OCR is not implemented.
3. Review the extracted text against the original. Record the actual issuing authority, direct official source URL, affected districts explicitly supported by the bulletin, hazard, original severity wording, official issue time and expiry. Admin time fields are explicitly UTC; public screens format Asia/Karachi.
4. **Uncheck “Fictional demo — mock delivery only.”** Never relabel one of the sample fixtures as real. If the authority did not provide enough district/validity information, hold the draft for clarification rather than inventing an interpretation.
5. Save, inspect the preview, approve and publish. Both website and native app use `/advisories?demo=false` when in live mode; the chatbot retrieves the same collection.
6. Keep notifications mocked initially. Enable external adapters only after approving the intended real recipients, consent, language and on-device/provider tests.

An ingestion timestamp is not an official publication time. Uploading a bulletin does not make the automatic source-check status fresh. The application continues to show no successful automated source retrieval until a verified adapter exists.

## 2. Automatic collection: obtain a supported feed

During this review, FFD's homepage/publication pages were available; the PDMA request timed out again. No documented supported API/feed or permission for automated collection was verified. The placeholder adapters intentionally make no network requests. Do not connect an undocumented endpoint discovered in browser traffic or turn on unrestricted scraping.

Use [FFD's official contact page](https://ffd.pmd.gov.pk/contact-us) to request a documented bulletin feed/data-sharing arrangement; use PDMA's official contact channels when reachable. Suggested message for the project owner to send:

> We are developing Sindh Flood Watch, an independent public information service. We would like to display your official flood bulletins with attribution, publication/expiry times and original references, subject to human review. Can you provide a supported API, RSS/JSON feed, or permitted bulletin download method? Please confirm authentication, allowed polling frequency, reuse/redistribution conditions, required attribution, retention of original content, and how corrections, withdrawals and source outages are communicated. We will not generate flood predictions or imply government endorsement.

This draft has not been sent. Do not share a feed token in chat or commit it. Configure any eventual credential as a worker-only secret in the chosen hosting account.

After access is verified, implement the authority-specific adapter in `services/worker/sources.py`: bounded HTTPS requests to an exact allowlist; no redirects unless revalidated; private/reserved address and DNS-rebinding protection; size/time limits; persistent source ID/content-hash deduplication; original issue time separate from ingestion time; authority-specific expiry/withdrawal handling; and source-failure/backoff telemetry. Imported material must create **drafts**, never publish or notify automatically. Add real authority-provided fixtures and parser tests before enabling polling. Do not infer district or village safety from river station readings.

## 3. Deployment architecture

```text
Browser / mobile device
       |
  HTTPS public domain :443
       |
  Caddy reverse proxy
       |-- /api/* --> FastAPI --> PostgreSQL
       |                              ^
       |                         background worker
       |-- /* ------> Next.js
```

Only Caddy publishes network ports. Database, API, worker and Next.js have no direct host port mappings. Same-origin `/api` avoids third-party-cookie failures in administrator authentication. Public web builds default to live view; no demo seed command is part of production startup. Demo collection remains available for explicit exercises and can only use mock delivery.

Files: `compose.production.yaml`, `deploy/Caddyfile`, `apps/web/Dockerfile`, the backend `Dockerfile`, and `deploy/.env.production.example`. This is a **single-server starting point**, not high availability. Review the public-service limitations in README before enabling public emergency use.

The available Sites hosting tool does not directly host this Python worker/PostgreSQL Docker stack. A separate server or backend host is required to retain the requested architecture. A frontend-only publication would not deploy the complete application.

## 4. Existing Linux server: exact deployment steps

Prerequisites: an operator-controlled Linux server with Docker Engine and the Docker Compose plugin, SSH access, a domain whose A/AAAA records point to that server, and externally reachable TCP 80/443 (UDP 443 is optional). Do not create a new paid server until the owner has approved its price. Keep SSH restricted to authorized operators; do not open 3000/5432/8000 publicly.

Transfer the source using your private repository or a source-only archive. Exclude `.venv`, `node_modules`, `.next`, `.expo`, local databases, real `.env` files and tokens. Avoid uploading the working directory wholesale. Build Linux images on the server or CI; Windows-generated standalone output is not a portable deployment artifact.

The following commands run **on the Linux server**, in the repository root:

```bash
cp deploy/.env.production.example .env.production
chmod 600 .env.production
# Generate a password locally, then paste it into POSTGRES_PASSWORD in the file.
openssl rand -hex 32
# Edit DOMAIN, ACME_EMAIL and POSTGRES_PASSWORD with your editor.
# DOMAIN is a bare hostname, without https:// or a path.

# Validate interpolation without printing resolved secrets.
docker compose --env-file .env.production -f compose.production.yaml config --quiet

# Validate the HTTPS proxy configuration before startup.
docker compose --env-file .env.production -f compose.production.yaml run --rm --no-deps proxy caddy validate --config /etc/caddy/Caddyfile

docker compose --env-file .env.production -f compose.production.yaml up --build -d
docker compose --env-file .env.production -f compose.production.yaml ps

# Interactive, hidden-password prompt; no default administrator password.
docker compose --env-file .env.production -f compose.production.yaml run --rm api python -m services.api.manage create-admin --username admin
```

Do not seed the production database. Caddy obtains and renews TLS certificates after correct DNS/port configuration. Certificates and PostgreSQL state are stored in named volumes. Run only one worker initially; add fleet-wide provider rate limiting before scaling it. There is no geographic/precise-GPS requirement.

Open `https://YOUR_DOMAIN/` and `https://YOUR_DOMAIN/#admin`. Confirm the administrator cookie is Secure and HttpOnly. Sign in, use mock subscriptions for acceptance testing, and confirm a real approved record is visible only in live collection. No source should appear fresh if retrieval is unconfigured.

Read-only smoke checks (from a computer with Node 24):

```bash
node scripts/check-deployment.mjs https://YOUR_DOMAIN
```

The script checks the website, API readiness, districts, demo/live isolation and source status. It does not publish data, subscribe users or send alerts. `/api/health/ready` checks database connectivity and schema availability; worker health checks its persisted heartbeat separately. Container health status by itself does not restart an unhealthy running process; add external monitoring and an operator response procedure.

## 5. Mobile connection and distribution

In `apps/mobile/.env` on the build machine:

```dotenv
EXPO_PUBLIC_API_URL=https://YOUR_DOMAIN/api
EXPO_PUBLIC_DEMO_MODE=false
```

Restart Expo or rebuild the app; these public values are embedded at bundle time. Never set provider tokens in `EXPO_PUBLIC_*`. Test on physical Android/iOS devices against the public HTTPS API. Set the Expo project ID and configure FCM/APNs before enabling push. An Android development APK or TestFlight/internal iOS build is a separate distribution step. App-store submission and paid build/store accounts require their own authorization. iOS local builds require macOS/Xcode. See README for platform setup.

## 6. Operations and updates

- Source permission, review ownership, human-reviewed translations, actual device push tests, isolated PDF parsing, shared gateway rate limiting, administrator MFA/recovery and monitoring remain public-service requirements. This server configuration does not claim those are solved.
- Keep secrets only in the protected server environment or a hosting secret manager. Use `docker compose ... config --quiet`; the normal config command expands passwords into terminal output.
- Save encrypted off-server database backups and regularly test restoration. For example, on the Linux server, `docker compose --env-file .env.production -f compose.production.yaml exec -T db pg_dump -U sindh -Fc sindh > /YOUR_PROTECTED_BACKUP_DIRECTORY/sindh-YYYY-MM-DD.dump`. Replace the path with an existing restricted directory. This command is for a Linux shell; do not copy a binary dump through Windows PowerShell text redirection.
- Back up before migration/deploy. For source updates, rebuild and run `docker compose --env-file .env.production -f compose.production.yaml run --rm migrate` before `up --build -d`; a previously completed migration container may not rerun merely because images changed. Evaluate rollback compatibility before changing schemas.
- `docker compose ... down` preserves volumes; never add `--volumes` as a routine deployment step. Database restoration/deletion is a separate operator decision.
- Host providers may charge for servers, persistent databases, network traffic, backups or mobile build accounts. This preparation provisions nothing and makes no free-availability promise.

References: [Docker Compose production guidance](https://docs.docker.com/compose/how-tos/production/), [Next.js standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output), [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https), [Caddy reverse proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy).
