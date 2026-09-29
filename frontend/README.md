# Ceco

The public website and the `/admin` CMS. Angular 13, generated with Angular CLI 13.3.3.

The site reads its content from the API in `../backend`, so **start that first** — see
`../backend/README.md`. With no API running, the pages render but the carousel, projects, job list,
logo and profile download stay empty.

## Development server

`npm start` (or `ng serve`), then open `http://localhost:4200/`. The app reloads on change.

| Route          | What it is                                       |
| -------------- | ------------------------------------------------ |
| `/`            | Home                                             |
| `/installation`, `/design`, `/commissioning`, `/maintenance` | The service pages   |
| `/job`         | Career page                                      |
| `/admin`       | The CMS — redirects to `/admin/login` without a session |

## Where the API lives

`src/environments/environment.ts` holds `apiUrl` for development and
`environment.prod.ts` the one used by `ng build`. Set the production value before deploying.

Uploaded files come back as absolute URLs, so there is no second base URL to keep in step.

## How it is put together

- `src/app/services/cms.service.ts` — the public content the site reads
- `src/app/services/auth.service.ts` — sign in, sign out, and renewing the session
- `src/app/guards/auth.guard.ts` — keeps `/admin` behind a session
- `src/app/http.interceptor.ts` — attaches the bearer token, and retries once after renewing an
  expired one
- `src/app/admin/` — the CMS, a lazily loaded module so the public site never downloads it

The access token is kept in memory only. On reload the session is restored from the HttpOnly refresh
cookie, which JavaScript cannot read.

## Build

`npm run build` writes to `dist/`. `npm test` runs the unit tests through Karma.
