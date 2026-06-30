# Deploying Chatter Box on LinkHosting

Chatter Box is a **two-part** app:

- **Frontend**: Vite + React (repo root)
- **Backend API**: Node.js + Express + TypeScript (in `backend/`)
- **Database**: MySQL / MariaDB (required; Prisma is used for migrations)

Because the backend and frontend are separate processes/builds, you should deploy **two sites** in LinkHosting:
- `yourdomain.com` → frontend
- `api.yourdomain.com` → backend API

---

## 0) Important: Git URL format + private repo cloning

### Repo URL format
When LinkHosting asks for a repository URL, it expects a plain public GitHub HTTPS repo URL:

**Correct**
- `https://github.com/KishaKaiser/chatter-box`

**Incorrect (will be rejected)**
- `chatter-box @ git+https://github.com/KishaKaiser/chatter-box.git@main`
- `git+https://...`
- anything with `@branch`, `@commit`, or Python-style dependency syntax

### Private repo limitation
If LinkHosting shows errors like:

- `Only public GitHub HTTPS URLs are supported`
- `fatal: could not read Username for 'https://github.com': terminal prompts disabled`

…then LinkHosting cannot authenticate to clone private repos over HTTPS.

**Workaround:** temporarily set the repo public, deploy, then set it private again.
**Caveat:** if LinkHosting needs to re-clone later (rebuild, move server, etc.), it will fail again unless you make it public again or LinkHosting adds token/GitHub App support.

---

## 1) Create the database (MySQL/MariaDB)

In LinkHosting, create a MySQL/MariaDB database and user (names are examples):

- Database name: `chatter_box`
- Database user: `chatter_box_user`
- Host: `127.0.0.1` (typical for “same server” setups)
- Port: `3306`

You will need a Prisma-style connection string:

`mysql://chatter_box_user:PASSWORD@127.0.0.1:3306/chatter_box`

---

## 2) Deploy the backend API site (`api.yourdomain.com`)

### 2.1 Create a Node.js site
In LinkHosting:
- Add Site → **Node.js**
- Domain: `api.yourdomain.com`
- Node version: 18+ (LTS recommended)
- Repository URL: `https://github.com/KishaKaiser/chatter-box`
- Branch: `main` (or whatever your default branch is)

### 2.2 Configure environment variables
Set these environment variables for the backend site (from `backend/.env.example`):

- `NODE_ENV=production`
- `PORT=4000` (or whatever LinkHosting expects internally)
- `DATABASE_URL=mysql://chatter_box_user:PASSWORD@127.0.0.1:3306/chatter_box`
- `JWT_SECRET=<long random string>`
  - generate example:
    - `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `JWT_EXPIRES_IN=7d`
- `CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com`

### 2.3 Build/start settings (backend)
Because the backend lives in the `backend/` folder, the backend site must run from there.

Use these settings if LinkHosting lets you specify them:

- **App root / Working directory:** `backend`
- **Install command:** `npm ci`
- **Build command:** `npm run build`
- **Start command:** `node dist/index.js`

This backend uses Prisma's JavaScript query engine with the MariaDB/MySQL driver adapter, which avoids the native Prisma/OpenSSL runtime dependency that can fail on restricted hosts.

If LinkHosting still uses a native Prisma engine from an old deploy cache, clear the backend build cache and redeploy. If LinkHosting exposes system packages, it is still safe to add:

- `openssl`

If it uses Nixpacks from this repository, both `nixpacks.toml` and `backend/nixpacks.toml` request OpenSSL. The backend copy matters when LinkHosting treats `backend/` as the app root.

### 2.4 Run Prisma migrations
If LinkHosting provides a “run command” / “post-deploy command” feature, run:

- `npx prisma migrate deploy`
- `npx prisma generate` (often optional because `postinstall` runs `prisma generate`, but safe to run)

Run them in the `backend` working directory.

### 2.5 Verify backend
Once deployed, check:

- `GET https://api.yourdomain.com/health`

Expected: a JSON response indicating the service is up.

---

## 3) Deploy the frontend site (`yourdomain.com`)

### 3.1 Create a Node.js (or Static) site
Create a site for the frontend:
- Domain: `yourdomain.com`
- Repository URL: `https://github.com/KishaKaiser/chatter-box`
- Branch: `main`

### 3.2 Set the frontend API base URL (build-time)
Vite reads env vars at **build time**. Set:

- `VITE_API_BASE_URL=https://api.yourdomain.com`

(How you set this depends on LinkHosting; use its “Environment Variables” UI for the frontend site if it supports it.)

### 3.3 Build/start settings (frontend)
The frontend is at the repo root. Typical settings:

- **Working directory:** repo root
- **Install command:** `npm ci`
- **Build command:** `npm run build`
- **Start command (if using Node):** `npm run preview -- --host 0.0.0.0 --port 4173`

If LinkHosting supports serving static output:
- Build produces `dist/`
- Set the document root/output to `dist`

### 3.4 SPA routing (important)
Chatter Box is a single-page app (SPA). Your web server must rewrite unknown routes to `/index.html`.

If LinkHosting exposes an Nginx/Apache setting, ensure the equivalent of:

- “try files → fallback to /index.html”

---

## 4) Common problems

### Prisma OpenSSL / `libquery_engine-linux-musl.so.node` errors
If the backend starts and then exits with an error like:

- `Prisma failed to detect the libssl/openssl version`
- `libquery_engine-linux-musl.so.node`
- `Command 'node dist/index.js' exited with code 1`

The current backend avoids Prisma's native engine by using Prisma's JavaScript query engine plus `@prisma/adapter-mariadb`. If you still see this error after deploying the latest code, LinkHosting is probably reusing an old build cache or old `node_modules`.

Clear the backend deploy cache, then run from the backend working directory:

- `npm ci`
- `npm run build`
- `npx prisma migrate deploy`
- restart the backend site

If the old native-engine error still appears after a clean rebuild, install OpenSSL for the backend site:

- Debian/Ubuntu style server: install `openssl`
- Alpine style server: install `openssl`
- LinkHosting/Nixpacks: ensure `backend/nixpacks.toml` includes `nixPkgs = ["nodejs_20", "openssl"]`

### `sh: prisma: not found` during `npm run build`
This usually means LinkHosting installed only production dependencies before running the build. The backend now lists Prisma and TypeScript as regular dependencies so this works even when `NODE_ENV=production` is set.

After pulling the latest code, rerun the backend deploy from the `backend` working directory:

- `npm ci`
- `npm run build`
- `npx prisma migrate deploy`
- restart the backend site

### “Invalid Git repository URL”
You must enter only:
- `https://github.com/KishaKaiser/chatter-box`

No `git+`, no `@main`, no dependency syntax.

### “terminal prompts disabled” during clone
The repo is private and LinkHosting can’t prompt for credentials.
Make the repo public (temporarily), deploy, then decide on a longer-term approach.

### Backend CORS errors
Make sure `CORS_ORIGIN` includes your frontend domain(s) exactly, no trailing slash:
- `https://yourdomain.com,https://www.yourdomain.com`

### Database connection errors
Double-check `DATABASE_URL` and that the database/user exists and is reachable from the backend host.

---

## 5) Updating deployments
When you push new commits:
- Frontend: rebuild (Vite outputs new `dist/`)
- Backend: rebuild + rerun migrations:
  - `npm run build`
  - `npx prisma migrate deploy`
  - restart the backend process
