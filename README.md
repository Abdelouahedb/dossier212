# DOSSIER 212

> **Crimes. Disappearances. Investigations.**  
> *We document the criminal cases that have shaped Morocco and the world.*

DOSSIER 212 is a French and English investigative journalism site and archive covering unsolved mysteries, cold cases, and significant criminal events. Published case files can include timelines, profiles, images, and sources. Editors manage dossiers and media through the admin area.

[Visit dossier212.page](https://www.dossier212.page/)

## Run locally

You'll need Node.js and npm, a PostgreSQL development database that accepts TLS connections, and Cloudinary credentials. Use a Node.js release that supports `node --watch` if you plan to run the development command.

1. Install dependencies and copy the environment template.

   ```sh
   npm ci
   cp .env.example .env
   ```

   In PowerShell, use `Copy-Item .env.example .env` for the second command.

2. Fill in `.env` using [.env.example](.env.example) as a guide.

   | Variables | Purpose |
   | --- | --- |
   | `DATABASE_URL` | Connection string for a development PostgreSQL database, such as a separate Neon database. The app creates tables and adds missing columns at startup, so the database role needs the corresponding permissions. |
   | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Credentials used by the admin media uploader. |
   | `SESSION_SECRET` | Random secret used to sign session cookies. |
   | `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Credentials for the admin login. |
   | `PORT` | Optional local port. Defaults to `3000`. |

3. Run `npm start`, or use `npm run dev` to restart the server when source files change. Startup initializes the database through `getDb()` in [database/init.js](database/init.js).

4. Open [the public site](http://localhost:3000/) or [the admin login](http://localhost:3000/admin/login). A newly initialized database has no published dossiers. Create and publish a dossier in the admin area to see it on the public site.

## Project structure

| Path | Responsibility |
| --- | --- |
| [server.js](server.js) | Configures Express, EJS, static assets, cookies, and route mounting. |
| [routes/public.js](routes/public.js) | Renders public pages, handles language and theme preferences, and serves the sitemap and robots.txt. |
| [routes/admin.js](routes/admin.js) | Handles login, dossier editing and publishing, and media uploads. |
| [middleware/auth.js](middleware/auth.js) | Checks admin credentials and guards admin routes. |
| [database/init.js](database/init.js) | Initializes the PostgreSQL connection pool and the schema used at runtime. |
| [views/](views/) | EJS templates for public pages, admin screens, and shared components. |
| [public/](public/) | Stylesheets, browser JavaScript, favicons, and other static assets. |
| [vercel.json](vercel.json) | Routes Vercel requests to the Node.js entry point. |

## Developer notes

- **Database queries.** The application uses PostgreSQL through `pg`. Query helpers in both route files translate legacy `?` placeholders to PostgreSQL's numbered placeholders. Follow the convention of the helper or connection you are calling.
- **Schema.** `dossiers` stores case metadata, localized Markdown, sources, and integer flags for publication and featuring. `personnes` and `chronologie` store case profiles and timeline entries. `images` stores media URLs and Cloudinary public IDs, with an optional link to a dossier.
- **Sessions.** `cookie-session` stores session data in a signed browser cookie. The app uses secure cookies in production and trusts one proxy hop for HTTPS termination.
- **Media.** Admin uploads pass through Express and stream to the `dossier212` folder in Cloudinary through Multer's Cloudinary storage adapter.
- **Localization.** Language and theme preferences are stored in cookies. Public templates default to English and dark mode. Dossiers store French and English text in separate fields.
