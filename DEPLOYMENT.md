# Deployment guide

Two ways to deploy the backend + frontend, plus how to ship the mobile app.
Pick **Option A** if you want the least setup work; pick **Option B** if
you want everything on one server you control.

Either way, **first**: generate a real secret key and change the seeded
admin password — do not deploy with the `.env.example` defaults.

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

---

## Option A (recommended): managed platforms, zero server admin

Backend and frontend deploy to different services, each handling scaling/
HTTPS/restarts for you.

### Backend → Railway / Render / Fly.io

All three can deploy directly from this repo's `backend/` folder using
either the `Dockerfile` (already there) or the `Procfile` (already there,
for platforms that prefer buildpacks over Docker).

1. Create a new service, point it at your repo, set the root/working
   directory to `backend/`.
2. Add a managed PostgreSQL database (all three platforms offer one) and
   copy its connection string.
3. Set these environment variables on the service:
   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | the Postgres connection string from step 2 |
   | `SECRET_KEY` | the random string you generated above |
   | `ANTHROPIC_API_KEY` | your real Anthropic API key |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | your real admin login (change from defaults) |
   | `ALLOWED_ORIGINS` | your frontend's URL, once you have it from step below (e.g. `https://your-app.vercel.app`) |
4. Deploy. The platform will build the Dockerfile (or use the `Procfile`
   or `Procfile`'s `gunicorn -c gunicorn_conf.py app.main:app`) and expose
   a public URL — that's your API base URL.
5. Confirm it's alive: `curl https://your-backend-url/health/ready`
   should return `{"status": "ready"}` once the database connects.

### Frontend → Vercel / Netlify

1. Import the repo, set the root directory to `frontend/`.
2. Build command: `npm run build`. Output directory: `dist`.
3. Set environment variable `VITE_API_URL` to your backend's URL from
   above (e.g. `https://your-backend-url`). This **overrides**
   `frontend/.env.production`'s default of `/api` — that default is only
   for Option B below.
4. Deploy. You'll get a URL like `https://your-app.vercel.app`.
5. Go back to your backend's `ALLOWED_ORIGINS` env var and set it to this
   exact URL, then redeploy the backend (CORS needs to know the frontend's
   real origin).

You now have two separate HTTPS URLs, both production-ready.

---

## Option B: self-hosted on one server (Docker Compose + nginx)

Everything — Postgres, backend, frontend — runs on a single VPS
(DigitalOcean, Hetzner, a home server, etc.) behind nginx on port 80.

```bash
git clone <your-repo> && cd ai-autonomous-company
cp .env.example .env
# edit .env: real SECRET_KEY, ANTHROPIC_API_KEY, ADMIN_PASSWORD,
# and ALLOWED_ORIGINS=http://your-server-ip (or your domain once you have one)
docker compose -f docker-compose.prod.yml up --build -d
```

This starts:
- `db` — PostgreSQL with a persistent volume (`db_data`)
- `backend` — Gunicorn + multiple Uvicorn workers (`Dockerfile.prod`), not
  exposed to the internet directly
- `nginx` — serves the built frontend and reverse-proxies `/api/*` to the
  backend, on port 80 (`deploy/nginx.conf`, `deploy/frontend.Dockerfile`)

Visit `http://your-server-ip`. The frontend's `.env.production` already
points it at `/api` so it reaches the backend through nginx on the same
domain — no separate CORS setup needed for this path.

**This does not set up HTTPS.** For a real domain, put a TLS-terminating
reverse proxy in front of nginx — the easiest option is swapping nginx for
[Caddy](https://caddyserver.com/) (automatic HTTPS via Let's Encrypt with
a ~5-line Caddyfile), or run `certbot` alongside this nginx config.

**Database migrations:** there's no migration tool wired up yet (tables
are created via `Base.metadata.create_all`, which only adds new tables —
it won't alter existing ones). For a real production deployment where the
schema will evolve, add [Alembic](https://alembic.sqlalchemy.org/) before
your data matters.

---

## CI

`.github/workflows/ci.yml` runs on every push/PR: verifies the backend
imports cleanly and every route registers, and that the frontend builds.
It does **not** deploy anywhere — that needs your chosen platform's
credentials as GitHub secrets, which aren't configured here. Once you've
picked a platform from Option A, most have an official GitHub Action you
can add as a new job (e.g. `railwayapp/railway-deploy`, Render's deploy
hook via `curl`, or Vercel's `amondnet/vercel-action`).

---

## Mobile (Flutter) → Google Play

1. Point the app at your real backend instead of the local dev default:
   edit `mobile/lib/config.dart`'s default, or build with:
   ```bash
   flutter build appbundle --dart-define=API_BASE_URL=https://your-backend-url
   ```
2. This produces `build/app/outputs/bundle/release/app-release.aab`.
3. You'll need to configure signing first (a release keystore) — Flutter's
   official guide covers this step by step:
   https://docs.flutter.dev/deployment/android
4. Upload the `.aab` to the Google Play Console (Internal testing track
   first, before any public release).
5. Since the backend is now real HTTPS, you can (and should) remove the
   `android:usesCleartextTraffic="true"` flag from `AndroidManifest.xml`
   that `mobile/README.md` had you add for local HTTP development.

For iOS, the equivalent is `flutter build ipa` plus an Apple Developer
account and Xcode signing — see
https://docs.flutter.dev/deployment/ios.

---

## Post-deploy checklist

- [ ] `SECRET_KEY` changed from the default
- [ ] `ADMIN_PASSWORD` changed from the default (log in once and rotate it)
- [ ] `ALLOWED_ORIGINS` set to your real frontend origin(s), not `*`
- [ ] `ANTHROPIC_API_KEY` is a real key with billing set up
- [ ] `GET /health/ready` returns `{"status": "ready"}`
- [ ] HTTPS is in place (Option A gives you this automatically; Option B
      needs Caddy/certbot added as described above)
- [ ] Mobile app's `API_BASE_URL` points at the real backend, not `10.0.2.2`
