# CECO

The website of Collective Engineering Co., Ltd., with the CMS that feeds it.

The public site is an Angular app. The CMS lives inside it at `/admin` as a lazily loaded module, so
a visitor to the public site never downloads it. Both talk to a Node.js content API backed by MySQL.
Content is stored once per language (ไทย / English) rather than translated in the browser, and the
public endpoints return published rows only, so a draft never reaches a visitor.

```
ceco-master-final/
├── frontend/   Angular 13 — the public site and the /admin CMS
└── backend/    Node.js · Express · MySQL — the content API
```

---

## Tech stack

**Frontend** — Angular 13 · TypeScript · RxJS · Bootstrap 5 with ng-bootstrap · Swiper · AOS ·
ngx-translate for the ไทย / English switch

**Backend** — Node.js 22 · TypeScript · Express 5 · MySQL 8 · db-migrate · zod · JWT · bcrypt ·
multer · pino · Cloudflare R2, falling back to the local disk when it is not configured

**Tooling** — Docker Compose for MySQL and Adminer · Jasmine and supertest · Karma · ESLint and
Prettier · OpenAPI, served at `/docs`

---

## Requirements

Node.js 22 or newer, npm, and Docker — which runs MySQL. Skip Docker if you point `.env` at a MySQL
8 instance of your own.

---

## Install

Two terminals. The backend first, because the site reads from it.

### 1 — backend → http://localhost:3000

```bash
cd backend
npm install
docker compose up -d          # MySQL 8 on 127.0.0.1:3306, Adminer on 127.0.0.1:8081
cp .env.example .env          # fill in the three values below
npm run setup                 # migrate, create the editor account, load the content
npm run dev
```

Three values in `.env` have no default:

| Variable          | Needs                                                                |
| ----------------- | -------------------------------------------------------------------- |
| `TOKEN_SECRET`    | at least 32 characters                                               |
| `PASSWORD_PEPPER` | at least 32 characters                                               |
| `ADMIN_PASSWORD`  | at least 12 characters — the CMS login, together with `ADMIN_USERNAME` |

Generate either secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

The server refuses to start without the first two, and `npm run setup` stops on the third.

### 2 — frontend → http://localhost:4200

```bash
cd frontend
npm install
npm start
```

`src/environments/environment.ts` holds the API URL used in development (`http://localhost:3000`);
`environment.prod.ts` holds the one `ng build` compiles in. Set that before deploying.

### Then open

| URL                           | What it is                                |
| ----------------------------- | ----------------------------------------- |
| `http://localhost:4200`       | The site                                  |
| `http://localhost:4200/admin` | The CMS — redirects to the login page     |
| `http://localhost:3000/docs`  | The API reference                         |
| `http://localhost:8081`       | Adminer, to look at the database directly |

---

## The CMS

`/admin` is behind a route guard: anything under it needs a session, and the API checks the token
again on every request. There is one editor account and no sign-up route.

| Page                   | What it edits                                                     |
| ---------------------- | ----------------------------------------------------------------- |
| `/admin`               | An overview of what is published                                  |
| `/admin/home`          | The hero carousel and the "Recently Projects" slider              |
| `/admin/previous-work` | The company / work / year table on each of the four service pages |
| `/admin/job`           | The openings on the career page                                   |
| `/admin/documents`     | The navbar logo and the company profile PDF                       |
| `/admin/media`         | Every uploaded image and file                                     |

Each page has a **ไทย / English** tab. Items can be added, edited, reordered, hidden without
deleting, and deleted. Images are chosen from the media library or uploaded in place.

---

## More

- `backend/README.md` — every endpoint, the database tables, the scripts, and how to switch file
  storage over to Cloudflare R2
- `frontend/README.md` — the routes, the services, and how the session is kept
