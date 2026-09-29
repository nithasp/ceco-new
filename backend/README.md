# CECO Content API

The backend for the CECO website: a content API the public site reads, and a CMS API the `/admin`
pages write through.

Node.js · Express 5 · MySQL 8 · JWT · Cloudflare R2

It replaces the Strapi instance the site used to call at `api.beonit.xyz/strapi`, which is gone. The
response shape is plain REST rather than Strapi's `data[].attributes` envelope, and the frontend was
updated to match.

---

## Quick start

```bash
cd backend
npm install

docker compose up -d          # MySQL 8 on 127.0.0.1:3306, Adminer on 127.0.0.1:8081
cp .env.example .env          # then fill in the two secrets — see below

npm run migrate:up            # create the tables
npm run seed:admin            # create the single editor account
npm run seed:content          # fill the site with the images and copy it ships with

npm run dev                   # http://localhost:3000
```

`npm run setup` runs the three migrate/seed steps in one go.

Two values in `.env` have no default and the server refuses to start without them:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"   # TOKEN_SECRET
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"   # PASSWORD_PEPPER
```

Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` (at least 12 characters) before `npm run seed:admin`.

| URL                              | What it is                                |
| -------------------------------- | ----------------------------------------- |
| `http://localhost:3000`          | API root                                  |
| `http://localhost:3000/healthz`  | Liveness plus a database check            |
| `http://localhost:3000/docs`     | Swagger UI over `openapi.yaml`            |
| `http://localhost:8081`          | Adminer, to look at the database directly |

---

## Scripts

| Command                | What it does                                                       |
| ---------------------- | ------------------------------------------------------------------ |
| `npm run dev`          | Run from TypeScript, restarting on change                          |
| `npm run build`        | Compile to `dist/`                                                 |
| `npm start`            | Run the compiled server                                            |
| `npm test`             | Reset the test database, migrate it, run the suite (66 specs)      |
| `npm run test:coverage`| The same with a coverage report in `coverage/`                     |
| `npm run typecheck`    | `tsc --noEmit`                                                     |
| `npm run lint`         | ESLint                                                             |
| `npm run format`       | Prettier                                                           |
| `npm run migrate:up`   | Apply migrations                                                   |
| `npm run migrate:reset`| Roll every migration back                                          |
| `npm run seed:admin`   | Create or promote the editor account                               |
| `npm run seed:content` | Fill the content tables; `-- --reset` replaces what is there        |

---

## Layout

```
src/
├── app.ts               Express app: middleware, routes, error handling
├── server.ts            Listen, daily cleanup, graceful shutdown
├── config.ts            Environment, validated with zod — start-up fails on a bad value
├── database.ts          MySQL pool, transactions, and the Queryable adapter
├── logger.ts            pino, with credentials redacted
├── controllers/         Parse the request, call a service, send the response
│   └── admin/           The CMS endpoints
├── middleware/          auth, audit, error, rateLimit, upload
├── repositories/        SQL. The only layer that writes a query
├── routes/              URL to controller
├── schemas/             zod shapes for every body, query and param
├── services/            The rules. Where a decision gets made
│   └── storage/         R2 and local-disk drivers behind one interface
├── scripts/             seedAdmin, seedContent
├── tests/               API and unit specs
├── types/               Shared types
└── utils/               Response envelope, errors, object keys, validation
```

A request goes **route → middleware → controller → service → repository**. A controller never writes
SQL and a repository never makes a decision.

---

## The data

Content is stored **once per language** (`th`, `en`) rather than translated in the browser, which is
how the old CMS worked and what the language switcher in the navbar expects.

| Table                                          | What it holds                                        |
| ---------------------------------------------- | ---------------------------------------------------- |
| `users`, `refresh_tokens`                       | The single editor account and its sessions           |
| `audit_logs`                                    | Who changed what, and when                           |
| `media`                                         | Every uploaded file: its key, URL, type and size     |
| `headers` → `header_slides`                     | The home page hero carousel                          |
| `recent_projects`                               | The "Recently Projects" slider                       |
| `experiences` → `experience_companies` → `experience_works` | The previous-work table on each service page |
| `recruitments`                                  | Open jobs on the career page                         |
| `site_documents`                                | The navbar logo and the company profile PDF          |

Deleting a picture never deletes the words that went with it: `media_id` is `ON DELETE SET NULL`, so
a slide keeps its row and loses its image. Deleting a company does take its work rows with it.

---

## Endpoints

`/api/v1/content/*` is public and read-only — this is what the website itself calls. It returns
published rows only, and every route takes `?locale=th|en`.

```
GET /content/header               the hero carousel
GET /content/recent-projects      the projects slider
GET /content/experiences          every previous-work table
GET /content/experiences/:type    one service page's table
GET /content/recruitments         open jobs
GET /content/documents?kind=pdf   site files
GET /content/company-profile      the PDF the footer links to
GET /content/logo                 the navbar logo
```

`/api/v1/admin/*` needs a bearer token and an account whose role is `admin`. It covers media,
headers and slides, recent projects, experiences with their companies and work rows, jobs, documents
and the audit log — with `PUT .../order` on each list to reorder it.

Full reference, including every request body: **`/docs`**.

Every response uses the same envelope:

```json
{ "status": 200, "message": "Header fetched.", "data": { }, "meta": null }
```

and every failure the same one, with a machine-readable `code`:

```json
{ "status": 404, "message": "slide with id 12 not found", "data": null, "code": "not_found" }
```

---

## Authentication

There is **no register route**. The site has one editor account, created by `npm run seed:admin`.

`POST /auth/login` returns a short-lived access token in the body and sets an HttpOnly `refreshToken`
cookie scoped to `/api/v1/auth`. JavaScript cannot read that cookie, so an XSS bug in the frontend
cannot lift a session out of the browser. The frontend keeps the access token in memory only and
calls `POST /auth/refresh` on reload and whenever a request comes back `token_expired`.

Refresh tokens rotate on every use and are stored only as a SHA-256 hash. Replaying one that has
already been rotated, outside a ten-second grace window for network retries, revokes the whole
session family and writes a `SECURITY` row to the audit log.

Passwords are bcrypt over an HMAC of the password and `PASSWORD_PEPPER` — the HMAC first, because
bcrypt only reads the first 72 bytes and would otherwise drop the pepper on a long password.

The admin role is read **from the database on every request**, not taken from the token, so changing
an account's role takes effect immediately instead of when its token expires.

---

## File storage

Uploads go to **Cloudflare R2** when it is configured, and to the local disk otherwise. Both sit
behind one interface, so nothing else in the app knows the difference — and the site can be
developed and seeded before the bucket exists.

`STORAGE_DRIVER` decides:

- `auto` (default) — R2 when the four R2 values are set, local disk otherwise
- `r2` — always R2; start-up fails if a value is missing
- `local` — always the disk, under `UPLOAD_DIR`, served at `/uploads`

### Switching to R2

1. In the Cloudflare dashboard, **R2 → Create bucket**.
2. **Manage R2 API Tokens → Create Account API token**, with **Object Read & Write** on that bucket.
   Copy the Access Key ID and Secret Access Key — the secret is shown once.
3. Give the bucket a public hostname, or the URLs it returns will not load in a browser: either
   enable the bucket's **r2.dev** subdomain (fine for development) or connect a custom domain
   (better for production, and what you want for `cdn.ceco.co.th` or similar).
4. Fill in `.env`:

   ```env
   R2_ACCOUNT_ID=your-32-character-account-id
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET=ceco-media
   R2_PUBLIC_URL=https://pub-xxxxxxxxxxxx.r2.dev
   R2_PREFIX=ceco
   ```

5. Restart. The log line on start-up says which driver is active.

Existing rows keep the URL they were uploaded with, so files already on disk keep working. To move
them, re-run `npm run seed:content -- --reset` (which re-uploads the shipped assets through the new
driver) or re-upload the others in the media library.

Object keys are `prefix/YYYY/MM/slug-random.ext`. The extension comes from the **declared MIME type**
matched against an allow list (webp, jpeg, png, gif, svg, avif, pdf), never from the uploaded
filename, and the random suffix means an upload can never overwrite an existing object.

---

## What protects what

- **Every input is parsed by a zod schema** before it reaches a service, so a controller never works
  with a shape it did not check.
- **Every SQL value is bound**, never concatenated. Thai copy with an apostrophe cannot change a
  statement.
- **Rate limits** on the whole API, and a tighter one on login and refresh.
- **Bounded everything**: JSON body size, page size, upload size, reorder length.
- **helmet** for the usual response headers; **CORS** restricted to `ALLOWED_ORIGIN`.
- **Errors never leak internals** — a 500 logs the stack server-side and returns
  `"Internal Server Error"`.
- **The audit log** records every write, whether it succeeded or failed, with the account that made
  it. It is read-only over the API, and rows older than `AUDIT_LOG_RETENTION_DAYS` are purged daily.
- **Secrets are redacted** from the logs, and never echoed in a response.

---

## Deployment

`Dockerfile` builds a production image that runs as an unprivileged user and has a health check.
`railway.json` runs migrations before each deploy.

For production, set `ENV=production` (which is what makes the refresh cookie `Secure`),
`ALLOWED_ORIGIN` to the site's real origin, `PUBLIC_BASE_URL` to the API's own URL, `DATABASE_URL`
with `DATABASE_SSL=verify`, and the R2 values.
