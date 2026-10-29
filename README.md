# Sindh Flood Watch

A local, working monorepo for district flood information, grounded retrieval and reviewed alerts. Independent information service; not a government warning authority. The initial experience is **DEMO — NOT A REAL WARNING**. No paid service, hosting deployment or app-store submission is required or performed.

## Repository

| Directory | Purpose |
|---|---|
| `apps/web` | Next.js responsive public interface and authenticated administrator workspace |
| `apps/mobile` | Expo / React Native Android, iOS and web preview |
| `packages/shared` | TypeScript models, API client, district timestamp formatting and draft interface labels |
| `services/api` | FastAPI, SQLAlchemy models, Alembic migrations, administrator CLI |
| `services/worker` | Durable outbox dispatcher and explicit pending source adapters |
| `tests` | API-to-worker integration tests using isolated temporary databases |

## Windows / VS Code quick start

Install Node.js 24 LTS, Python 3.13 or 3.14, Git and VS Code from their official distributors. Docker Desktop with its WSL2 backend is optional for the PostgreSQL path below. Open this folder in VS Code, then open PowerShell terminals at the repository root. Use `npm.cmd` if PowerShell execution policy blocks `npm.ps1`; activation of the Python venv is unnecessary.

```powershell
cd 'D:\MyDocs\Projects\Sindh AI Project'
Copy-Item .env.example .env
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.lock.txt
npm.cmd ci
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m services.api.manage seed
.\.venv\Scripts\python.exe -m services.api.manage create-admin --username admin
```

The CLI prompts twice for a hidden password of at least 14 characters. There is no bundled administrator password or public registration endpoint. The seed command is idempotent and creates only three fictional samples for Sukkur, Dadu and Thatta. Seed samples expire after 24 hours and re-running the seed does not renew existing records; use the admin lifecycle to create a fresh exercise.

Run each command in a separate root terminal:

```powershell
# Terminal 1: API (SQLite local fallback; no Docker needed)
.\.venv\Scripts\python.exe -m uvicorn services.api.main:app --host 0.0.0.0 --port 8000

# Terminal 2: durable queue worker — run ONE worker with SQLite
.\.venv\Scripts\python.exe -m services.worker.main

# Terminal 3: responsive website, including admin
npm.cmd run web

# Terminal 4: Expo app QR/development server
npm.cmd run mobile

# Optional browser preview of the actual React Native app
npm.cmd run web -w @sfw/mobile
```

Website: [localhost:3000](http://localhost:3000). Administrator: [localhost:3000/#admin](http://localhost:3000/#admin). Expo preview: [localhost:8081](http://localhost:8081). API docs: [localhost:8000/docs](http://localhost:8000/docs). Administration API calls require the trusted `Origin` header and HTTP-only session cookie; logging in from the website supplies both. Sessions expire after eight hours. `COOKIE_SECURE=false` is only for local HTTP; use `true` with HTTPS in deployment.

`.env` is used by Docker Compose, but Python commands do **not** automatically load it. Set any Python/worker override explicitly in that PowerShell terminal, e.g. `$env:DATABASE_URL='sqlite:///./sindh.db'`. Next.js reads `apps/web/.env.local`; Expo reads `apps/mobile/.env`. Copy only public URL settings there, never provider credentials.

For a production-mode local web build (also enables offline shell caching):

```powershell
npm.cmd run build
npm.cmd run start -w @sfw/web
```

Stop an existing Next.js dev server before using the same port. Open the production page online once and reload it before testing a fully disconnected launch. API data and guidance are independently cached with retrieval timestamps. Service workers cache only the public shell/static assets, never API or administrator responses. Offline chatbot responses are unavailable; saved advisory/guidance browsing remains available. Browser storage can be cleared by the browser; neither client promises permanent offline retention.

## PostgreSQL with Docker Compose

For public HTTPS deployment and connecting real bulletins, see [live data and deployment guide](docs/DEPLOYMENT.md). The local Compose file below serves development only; the new `compose.production.yaml` includes the website, HTTPS proxy, private API/database and worker.

For the chosen no-payment demo route, see [Render Free + Neon Free](docs/FREE-HOSTING.md). `render.yaml` defines only free web services and intentionally omits an automatic notification worker.

For the selected free managed database, follow [Neon setup](docs/NEON.md). No Neon credentials are embedded in this project.

Choose a strong random **URL-safe** `POSTGRES_PASSWORD` in `.env` (letters, numbers, hyphen or underscore; URL-encode other characters in connection strings). Do not retain the example value for a shared environment.

```powershell
docker compose up --build -d
docker compose run --rm api python -m services.api.manage seed
docker compose run --rm api python -m services.api.manage create-admin --username admin
docker compose logs -f api worker
```

Compose starts PostgreSQL 18, waits for database readiness, applies migrations, then starts API and worker. The database has a persistent volume; no database port is published. API is bound to local loopback. The web and Expo processes still run on the host using the commands above. Stop the host API first to avoid port 8000 conflict. `docker compose down` preserves database data; do not use `--volumes` unless you intend to delete it. Compose intentionally disables external notifications. To enable them, explicitly add the worker environment variables described below to your private local override file.

Migrations are `0001` initial schema and `0002` update provenance. For host Python against a separately reachable PostgreSQL service, set `DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/sindh` in that process and run Alembic before starting services. SQLite is an optional no-Docker development fallback, not the intended public-service database.

## Exercise the complete workflow

1. In website **Alert settings**, stay in demo mode, select Dadu, choose English / mock inbox, give consent and subscribe. Keep this browser open; its management token controls subscription changes and deletion.
2. In another browser profile, subscribe to Thatta with the same demo/mock settings.
3. Open **Administrator workspace**, sign in, enter a new demo advisory for Dadu with a current UTC issue time and future expiry. Preserve severity wording; the demo label is automatically prepended to sample body text.
4. Save the draft. Inspect extracted wording, source, language and **intended district preview** in the publication queue. Approve, then publish. A draft/approved item cannot alert the public. Editing either resets approval.
5. Refresh the website and Expo app with Dadu selected. Ask “What is the latest advisory for Dadu?”; its answer includes provenance/date and the demo label. Unsupported questions return the explicit evidence-insufficient response.
6. Refresh delivery history in the Dadu browser after the worker runs. It shows `mock_delivered` and explicitly says no external notification was sent. Thatta receives no matching warning.
7. Restart the worker or refresh repeatedly: the persistent `(event, subscriber)` uniqueness key prevents another delivery. Existing subscribers receive future publications, not a replay of old seed bulletins.
8. Withdraw or expire an advisory to enqueue the respective lifecycle notice and suppress a pending current-warning job. For an update, create a **new draft** referencing the published advisory ID in **Supersedes advisory ID**. Review/approve/publish it. The old publication becomes withdrawn; new recipients receive an `update` event, and old district recipients get withdrawal information. Published content remains immutable.

A single administrator can approve in this prototype; there is no two-person separation of duties. Human translation review is an explicit operator attestation. English editorial guidance is included; unreviewed Urdu/Sindhi emergency content cannot be approved or published. Draft navigation labels and RTL structure are present, not a claim of complete reviewed localisation.

## Physical Android / iOS testing

Use the phone and development computer on the same trusted LAN. Set `EXPO_PUBLIC_API_URL=http://YOUR_PC_LAN_IP:8000` in `apps/mobile/.env`, restart Expo, and allow the API through Windows Firewall for your private LAN only. `localhost` on a phone means the phone, not your PC. District selection works without GPS permissions.

For screen-only evaluation, use the compatible Expo Go version if available for SDK 58. Remote push requires a development build and a physical device; Expo Go/web/simulators do not verify real delivery. Android local native builds require Android Studio, Android SDK/JDK and a USB-debug-enabled device. Run `npm.cmd run android -w @sfw/mobile`. iOS local builds require macOS + Xcode; Windows cannot run `expo run:ios`. On macOS use `npm run ios -w @sfw/mobile`. A separately configured EAS build is optional; do not initiate paid builds without authorization.

Native builds use the platform's default transport restrictions. For a local HTTP API, use a temporary **debug-only** cleartext configuration or an HTTPS development endpoint; production builds must use HTTPS. Never globally weaken device transport policy for a public release.

## Notification providers and reliability

The default `mock` adapter requires no credentials. Real adapters require `ENABLE_REAL_NOTIFICATIONS=true` **in the worker's environment**, with a non-demo subscription and published live advisory of matching district/language. Demo subscriptions reject external channels at validation, matching and dispatch boundaries.

**Expo:** create your own Expo/EAS project, set `extra.eas.projectId` in `apps/mobile/app.json`, configure FCM v1 credentials for Android and APNs credentials for iOS, and build/sign an installable development app. Add your Firebase platform configuration files via the official Expo setup and keep provider service-account keys outside source control. In live alert settings choose **Register device for push**, grant notification permission, then explicitly subscribe. Optionally configure `EXPO_ACCESS_TOKEN` server-side if push access-token protection is enabled. [Expo push setup](https://docs.expo.dev/push-notifications/push-notifications-setup/) and [notification SDK](https://docs.expo.dev/versions/latest/sdk/notifications/) describe the account/platform steps. A ticket records `accepted`, not `delivered`. Receipt reconciliation and on-device delivery validation remain operator work before public service.

**Telegram:** create your own bot through Telegram's official BotFather workflow, store its token in worker-only `TELEGRAM_BOT_TOKEN`, have the intended user initiate the bot conversation, obtain that consenting chat's numeric ID, and enter it as the subscription destination. No automatic user discovery or broadcast occurs. See [Telegram Bot API](https://core.telegram.org/bots/api). Successful API acceptance does not confirm a user read the message.

Worker sends at most one job every two seconds per process. PostgreSQL row locks and persistent event keys prevent concurrent selection of the same pending job. Confirmed connection failures use exponential backoff (up to one hour, five attempts); explicit 429 rejections use Retry-After. Timeouts/server errors after possible acceptance are `unknown`; a crash after the durable pre-send marker leaves `in_flight`. These records are visible to admins and are **never automatically resent**. External providers lack end-to-end exactly-once guarantees: this conservative policy trades possible missed delivery for avoiding duplicate ambiguous sends. Reconcile with the provider before any manual repair. Multi-worker fleet-wide provider quotas need a shared rate limiter. Expired/withdrawn warnings, deleted subscribers and changed district/language/demo preferences are rechecked immediately before dispatch. Lifecycle notices explicitly say no longer current.

Unsubscribe deletes subscriber and their delivery records. Native management tokens use SecureStore; browser management tokens use local storage and must be treated as credentials. No precise coordinates or public admin signups exist. Losing the token requires operator assistance to remove a subscription; build an authenticated recovery process before a public rollout.

## Chatbot and optional LLM

Public chat is useful without an LLM: it routes preparedness questions or retrieves current approved district bulletins, returns original evidence with citations/date, requests a district when absent and refuses unsupported predictions/safety/route requests. Retrieved content is data, never an instruction. Cached/offline content is not used to invent a new warning.

`services/api/llm.py` defines an optional server-only `ExplanationProvider` and OpenAI-compatible implementation configured by `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`. The public chatbot deliberately remains structured retrieval; configuring keys alone does not change public answers or send evidence to a provider. An operator can integrate the interface after language, grounding and safety evaluation. It is an extension interface, not a tested hosted LLM integration. Never put keys in `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*` variables.

## Checks

```powershell
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m ruff check services tests
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd exec -w @sfw/mobile -- expo export --platform all
```

See [validation report](docs/VALIDATION.md), [source investigation](docs/SOURCES.md) and [dependency audit](docs/dependency-audit.json). No mandatory paid APIs are used.

## From prototype to dependable public service

This local prototype is not ready to be a sole emergency warning system. Before deployment, verify collection permissions/feed contracts and source licences; establish named human review ownership and response procedures; conduct Urdu/Sindhi expert review; validate native permissions, background/killed-app push and real devices; reconcile provider receipts; and load-test the durable queue under PostgreSQL.

Use managed/operated PostgreSQL with backups and restore drills, HTTPS, secure cookies, a single configured origin or same-site API reverse proxy, secret management, an isolated PDF extraction process with time/memory limits, shared gateway rate/body limits, source-failure and worker-heartbeat alerting, retention policy, dependency monitoring, and administrator MFA/recovery. Current in-memory request limits apply per API process. Local PDF extraction is bounded by file/page counts but is not a sandbox against hostile resource-exhausting PDFs. No arbitrary backend URL fetch is implemented, preventing SSRF through source reference fields. Add hardened allowlisted fetching only when a permitted feed exists.

Keep API sessions and subscription tokens out of logs. Move delivery dispatch toward a reconciliation design appropriate to each provider; do not advertise exactly-once delivery or equate acceptance with delivery. Maintain independent official emergency channels and clearly explain stale/missing source status. Public hosting, stores, credentials and any paid infrastructure require separate explicit authorization.
