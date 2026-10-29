# Free demo deployment: Render + Neon

This deploys the website and API as two Render **Free** web services and uses the chosen **Neon Free** database. It does not run a persistent worker or send external alerts. Free Render services sleep when idle, share their workspace's free instance-hour allowance, and are intended for demonstrations rather than an operational emergency service. Do not configure keepalive traffic to evade provider limits.

## The short route

1. Sign in to Neon and Render using your own accounts. In Codex, connect the Neon and Render integrations if you want the assistant to configure them with you. No credentials need to be pasted into chat. GitHub is already connected, but a source repository for this local project still needs to be selected or created.
2. Create a **Neon Free** project named `sindh-flood-watch`. Retain the **direct** connection URL for migrations; keep its TLS options. Do not choose a paid plan.
3. Put this project's source in a private GitHub repository. `.gitignore` excludes local databases, credentials, dependencies and build output. Never upload the entire local workspace without those exclusions.
4. In Render, create the API web service first using the settings below. Enter the Neon URL privately as an environment secret. The app creates its database schema on startup and does not create a default administrator or seed warnings.
5. Create the web service with the settings below. Enter the API's **actual assigned public HTTPS URL** as `API_UPSTREAM_URL`; do not assume a service name is an available subdomain.
6. Copy the web service's assigned HTTPS URL to the API's `CORS_ORIGINS` setting, replacing its temporary placeholder. Redeploy the API. Create the first administrator using the private local CLI with the same Neon URL (see `NEON.md`).
7. Open the website. Check `/api/health/ready`, sign in, and verify manually approved information and source status. Send the assistant the **public web URL only** to run read-only deployment checks.

If either provider requests a card, paid plan, or terms acceptance, stop and handle that step yourself; do not add billing to complete this free demo. The supplied `render.yaml` specifies free plans only. Manual service creation is an alternative if Blueprint setup requests billing.

## Render API service

Connect the private source repository. Keep **Root Directory empty** (the monorepo root).

| Setting | Value |
|---|---|
| Service type | Web Service |
| Runtime | Python 3 |
| Plan | **Free** |
| Build command | `pip install -r requirements.lock.txt` |
| Start command | `python scripts/render-api-start.py` |
| Health check | `/health/ready` |
| `PYTHON_VERSION` | `3.13.9` |
| `DATABASE_URL` | Your private direct Neon PostgreSQL URL, including TLS parameters |
| `COOKIE_SECURE` | `true` |
| `ENABLE_REAL_NOTIFICATIONS` | `false` |
| `CORS_ORIGINS` | Actual web HTTPS origin; before its URL is known, use `https://not-configured.invalid` |

The initial placeholder prevents administrator login until the real web origin is set. Read-only public endpoints still work. Do not set `CORS_ORIGINS=*`. The API has a public Render URL, but browsers use the web service's same-origin `/api` proxy so secure administrator cookies work without relying on cross-site cookies.

## Render website service

Connect the same repository. Keep **Root Directory empty**.

| Setting | Value |
|---|---|
| Service type | Web Service |
| Runtime | Node |
| Plan | **Free** |
| Build command | `npm ci && npm run build -w @sfw/web` |
| Start command | `npm run start -w @sfw/web -- --port $PORT` |
| Health check | `/` |
| `NODE_VERSION` | `24.18.0` |
| `NEXT_PUBLIC_API_URL` | `/api` |
| `NEXT_PUBLIC_DEMO_MODE` | `false` |
| `NEXT_TELEMETRY_DISABLED` | `1` |
| `API_UPSTREAM_URL` | Actual public HTTPS origin of the API service, without a trailing path |

Both `NEXT_PUBLIC_*` settings and the proxy destination are read during build. Rebuild the web service after changing them. Do not set `NEXT_STANDALONE` for this native Node service; the separate Docker deployment continues to use standalone output.

## Administrator and native mobile app

Render Free has no interactive service shell. On your computer, use the hidden URL prompt in `NEON.md` to set `DATABASE_URL`, then run `python -m services.api.manage create-admin --username admin` with the project's virtualenv Python. Set your own strong password at its hidden prompts. This writes the administrator to the same Neon database used by the hosted API.

Set `EXPO_PUBLIC_API_URL=https://YOUR_WEB_URL/api` and `EXPO_PUBLIC_DEMO_MODE=false` in the mobile build environment, then rebuild the app. A hosted Expo web preview or an app-store release is a separate step; deploying the API does not install an Android/iOS app on a phone.

Subscriptions may be saved but delivery jobs will remain pending without a worker. Do not present this as a live notification service. Only run the worker for supervised mock-delivery tests or move to an approved persistent worker host later. Free services can take around a minute to wake; refresh after a cold start if the app initially reports connection unavailable.

## Verification

Run `node scripts/check-deployment.mjs https://YOUR_WEB_URL`. It checks public HTTP responses and collection isolation without creating warnings or subscriptions. Then test administrator login and publication with a clearly fictional demo record, never a fabricated live warning.

No remote account/project/service is created merely by adding these files. Deployment is complete only after provider services finish successfully and the assigned public URL passes checks.

Official references: [Render Free limits](https://render.com/docs/free), [FastAPI deployment](https://render.com/docs/deploy-fastapi), [Next.js deployment](https://render.com/docs/deploy-nextjs-app), [Neon connections](https://neon.com/docs/connect/connect-from-any-app).
