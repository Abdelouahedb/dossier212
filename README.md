# DOSSIER 212

> **Crimes. Disappearances. Investigations.**  
> *We document the criminal cases that have shaped Morocco and the world.*

**DOSSIER 212** is a bilingual (FR/EN) investigative journalism platform and archive dedicated to documenting unsolved mysteries, cold cases, and significant criminal events. 

Designed with a cinematic, "declassified" aesthetic, the platform allows administrators to dynamically construct comprehensive case files featuring interactive timelines, suspect profiles, and multimedia evidence boards.

🌐 **Live Website:** [dossier212.page](https://www.dossier212.page/)

---

## 🕵️‍♂️ Features

- **Bilingual Architecture:** Full support for English and French narratives.
- **Dynamic Case Files:** Build detailed dossiers with key figures (`Personnes`) and chronologies (`Événements`).
- **Cinematic UI/UX:** Dark-mode exclusive, typography-driven design (Garamond & IBM Plex Mono) with premium blur-reveal animations.
- **Headless Media:** Seamless, direct-to-cloud image uploads powered by Cloudinary.
- **Technical SEO:** Auto-generated XML sitemaps, Open Graph preview cards, and Google Search Console integration.
- **Serverless Ready:** Fully optimized for edge deployment on Vercel.

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** EJS (Embedded JavaScript), CSS3, Vanilla JS
- **Database:** PostgreSQL (Neon Serverless)
- **Media Storage:** Cloudinary
- **Deployment:** Vercel

---

## 🤖 AI / Developer Notes (CRITICAL)

If you are an AI assistant (like Codex, Cursor, or Gemini) reading this to help the user modify the code, you **must** understand the following architectural decisions to avoid breaking the application:

### 1. Database Query Wrapping (Postgres vs SQLite)
This project originally used a local `sql.js` (SQLite) database, but was refactored for Vercel Serverless to use `pg` (PostgreSQL). 
To avoid rewriting hundreds of lines of routing logic, **custom wrappers** were created in `routes/admin.js` and `routes/public.js`.
* The wrappers (`fetchAll`, `fetchOne`, `pool_query`) automatically intercept SQLite syntax (`?`) and translate it to Postgres syntax (`$1`, `$2`, etc.) on the fly.
* **Do not** refactor `?` parameters in existing queries, the wrappers handle them natively.
* `RETURNING id` logic is simulated using `SELECT currval('dossiers_id_seq')`.

### 2. Authentication & Sessions
* **No Hardcoded Fallbacks:** The `/admin` login relies *strictly* on the `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables. If they are missing, the server deliberately crashes on boot.
* **Serverless Cookies:** `express-session` was completely removed because Vercel destroys memory stores between requests. The project uses `cookie-session` to encrypt the session directly into the browser cookie. 
* **Proxy Trust:** Because Vercel terminates HTTPS at the load balancer, `app.set('trust proxy', 1)` is required in `server.js` for the secure cookie to be sent back to the browser.

### 3. Media & File Uploads
* The project uses `multer-storage-cloudinary`. 
* Images uploaded via the admin panel bypass the local filesystem entirely and stream directly to the `dossier212` folder in Cloudinary.
* The admin panel UI provides a 1-click Markdown copy button (`![Image](cloudinary_url)`) to easily embed uploaded images into the markdown content.

### 4. Language & Theme Management
* Bilingual support (FR/EN) is managed via a browser cookie (`lang=fr` or `lang=en`). 
* A custom middleware in `server.js` intercepts this cookie and injects `res.locals.lang` into every EJS view.
* The database has separate columns for languages (e.g., `contenu_fr` and `contenu_en`). The `routes/public.js` controller handles serving the correct column based on the cookie.

---

## 📁 Database Schema

* **`dossiers`**: The core case files. Contains metadata, markdown content, read time, and boolean flags (`est_publie`, `est_a_la_une`).
* **`personnes`**: Profiles of people involved in a case (Victims, Suspects, Investigators). Links to `dossiers(id)`.
* **`chronologie`**: Timeline events forming the timeline sequence. Links to `dossiers(id)`.
* **`images`**: Stores the Cloudinary delivery URL and public ID for uploaded evidence/photos. Images can optionally link to a dossier.

---

## 🔐 Environment Variables

To run this project locally, the following variables must be set in `.env`:

```env
# Database (Neon Postgres)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Media (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Security
SESSION_SECRET=a_long_random_string
ADMIN_USERNAME=your_secure_username
ADMIN_PASSWORD=your_secure_password
```
