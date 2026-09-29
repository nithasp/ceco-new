# CECO

The website of Collective Engineering Co., Ltd., with the CMS that feeds it.

```
ceco-master-final/
├── frontend/   Angular 13 — the public site and the /admin CMS
└── backend/    Node.js · Express · MySQL · JWT — the content API
```

The site used to read its content from a Strapi instance at `api.beonit.xyz/strapi`. That service is
gone, so `backend/` replaces it: same content, a plain REST shape instead of Strapi's
`data[].attributes` envelope, and a CMS built into the site itself at `/admin`.

---

## Running it

Two terminals. The backend first, because the site reads from it.

```bash
# 1 — API  (http://localhost:3000)
cd backend
npm install
docker compose up -d
cp .env.example .env         # fill in TOKEN_SECRET, PASSWORD_PEPPER and ADMIN_PASSWORD
npm run setup                # migrate, create the editor account, load the content
npm run dev
```

```bash
# 2 — website  (http://localhost:4200)
cd frontend
npm install
npm start
```

Then open:

- **http://localhost:4200** — the site
- **http://localhost:4200/admin** — the CMS (redirects to the login page)
- **http://localhost:3000/docs** — the API reference

`backend/README.md` has the full setup, including how to switch file storage over to Cloudflare R2.

---

## The CMS

`/admin` is behind a route guard: anything under it needs a session, and the API checks the token
again on every request. There is one editor account and no sign-up route.

| Page                    | What it edits                                                        |
| ----------------------- | -------------------------------------------------------------------- |
| `/admin`                | An overview of what is published                                     |
| `/admin/home`           | The hero carousel and the "Recently Projects" slider                 |
| `/admin/previous-work`  | The company / work / year table on each of the four service pages     |
| `/admin/job`            | The openings on the career page                                       |
| `/admin/documents`      | The navbar logo and the company profile PDF                           |
| `/admin/media`          | Every uploaded image and file                                         |

Each page has a **ไทย / English** tab, because content is stored once per language rather than
translated in the browser. Items can be added, edited, reordered, hidden without deleting, and
deleted. Images are chosen from the media library or uploaded in place.

The CMS is a lazily loaded Angular module, so a visitor to the public site never downloads it.

---

## What the site reads

| Component               | Endpoint                                |
| ----------------------- | --------------------------------------- |
| `carousel`              | `GET /api/v1/content/header`            |
| `carousel2`             | `GET /api/v1/content/recent-projects`   |
| `previous-work`         | `GET /api/v1/content/experiences`       |
| `job`                   | `GET /api/v1/content/recruitments`      |
| `header` (navbar logo)  | `GET /api/v1/content/logo`              |
| `footer` (PDF download) | `GET /api/v1/content/company-profile`   |

These are public and read-only, and return published rows only, so a draft never reaches a visitor.

The API base URL lives in `frontend/src/environments/`. Set `apiUrl` in `environment.prod.ts` before
building for production.
