# Neon Free database setup

## Provisioned project

The connected free organization now contains project `sindh-flood-watch` (`old-glade-05326492`) in Singapore, using PostgreSQL 18 and database `sindh`. Alembic-generated migrations were applied first to `schema-validation`, checked for all eight tables, update provenance and the outbox uniqueness constraint, then applied to the empty `production` branch. Both branches reached revision `0002`. Production has no advisory fixtures or administrator accounts. No connection password has been printed or stored in source. Public resource identifiers are recorded in `deploy/neon-resources.json`.

Do not create another project when following the steps below: select this existing project. Web hosting is still pending GitHub repository setup and Render account access. Database creation alone does not publish the website. The previous statement that a remote connection had not been tested is superseded by this connector-based PostgreSQL schema verification; full hosted API authentication and browser workflows remain unverified.

The application accepts a standard Neon `postgresql://` URL and selects its installed psycopg 3 driver automatically. TLS options from the Neon URL are preserved. Pool connections are checked before reuse to handle suspended serverless compute.

1. Sign up at https://neon.com/ and select the Free plan. Create a project named `sindh-flood-watch` and choose a region near the eventual API host. Do not upgrade or add billing for this demo.
2. Open **Connect** in the Neon console. Copy the connection string. For Alembic migration and first administrator creation, choose the **direct/unpooled** connection. Keep `sslmode=require` and any other TLS options supplied by Neon.
3. Put that value in `DATABASE_URL` only in the backend/worker environment. Do not paste it into chat, a frontend environment variable, or source control. The value contains a database password.
4. On Windows, in each backend terminal, load it without displaying it:

```powershell
$neonCredential = Read-Host 'Paste your Neon database URL' -AsSecureString
$env:DATABASE_URL = [System.Net.NetworkCredential]::new('', $neonCredential).Password
Remove-Variable neonCredential
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m services.api.manage create-admin --username admin
```

Then start the API in that terminal. Load the same URL separately in the worker terminal if you run it. Credentials stay in each process environment; the application does not print them. Start with a fresh Neon project; existing local SQLite records are not automatically copied. Do not seed production warnings. A separate staging database may use the explicitly labelled demo seed.

The same direct URL works for this small demo API. If you later use a pooled URL for high connection concurrency, retain the direct URL for migrations and evaluate transaction-pooling compatibility before switching. Remote schema operations have been verified through the connected Neon tools; the hosted API's driver connection still needs to be configured and tested.

Neon hosts the **database only**. It does not deploy this Next.js frontend, FastAPI process or persistent worker. Free compute has usage limits; the worker checks its database every two seconds and prevents idle suspension, so leaving it running continuously can consume the free allowance. For a no-cost demonstration, leave automatic notifications disabled and run the worker only for supervised tests. Do not promise dependable public alerts from this arrangement.

Reference: https://neon.com/docs/guides/sqlalchemy
