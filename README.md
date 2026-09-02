# DOSSIER 212 

**Live Website:** [https://www.dossier212.page/](https://www.dossier212.page/)

DOSSIER 212 is a custom-built, bilingual (French/English) investigative journalism and crime documentary platform. It allows the author to publish deep-dive case files, track personas involved, build interactive chronologies, and manage media.

---

## ??? Technical Architecture

This project is designed to run in a **Serverless Environment (Vercel)**.

*   **Backend:** Node.js / Express.js
*   **Frontend:** EJS (Embedded JavaScript templates), Custom CSS, Vanilla JS
*   **Database:** PostgreSQL (Hosted on Neon.tech)
*   **Media Storage:** Cloudinary
*   **Content Parsing:** Markdown (marked library)
*   **Deployment:** Vercel

---

## ?? AI / Developer Notes (CRITICAL)

If you are an AI assistant (like Codex, Cursor, or Gemini) reading this to help the user modify the code, you **must** understand the following architectural decisions:

### 1. Database Query Wrapping (Postgres vs SQLite)
This project originally used a local sql.js (SQLite) database, but was refactored for Vercel Serverless to use pg (PostgreSQL). 
To avoid rewriting hundreds of lines of routing logic, **custom wrappers** were created in outes/admin.js and outes/public.js.
*   The wrappers (etchAll, etchOne, pool_query) automatically intercept SQLite syntax (?) and translate it to Postgres syntax ($1, $2, etc.) on the fly.
*   **Do not** refactor ? parameters in existing queries, the wrappers handle them natively.
*   RETURNING id logic is simulated using SELECT currval('dossiers_id_seq').

### 2. Authentication & Sessions
*   **No Hardcoded Fallbacks:** The /admin login relies *strictly* on the ADMIN_USERNAME and ADMIN_PASSWORD environment variables. If they are missing, the server deliberately crashes on boot.
*   **Serverless Cookies:** express-session was completely removed because Vercel destroys memory stores between requests. The project uses cookie-session to encrypt the session directly into the browser cookie. 
*   **Proxy Trust:** Because Vercel terminates HTTPS at the load balancer, pp.set('trust proxy', 1) is required in server.js for the secure cookie to be sent back to the browser.

### 3. Media & File Uploads
*   The project uses multer-storage-cloudinary. 
*   Images uploaded via the admin panel bypass the local filesystem entirely and stream directly to the dossier212 folder in Cloudinary.
*   The admin panel UI provides a 1-click Markdown copy button (![Image](cloudinary_url)) to easily embed uploaded images into the markdown content.

### 4. Language & Theme Management
*   Bilingual support (FR/EN) is managed via a browser cookie (lang=fr or lang=en). 
*   A custom middleware in server.js intercepts this cookie and injects es.locals.lang into every EJS view.
*   The database has separate columns for languages (e.g., contenu_fr and contenu_en). The outes/public.js controller handles serving the correct column based on the cookie.

---

## ??? Database Schema

*   **dossiers**: The core case files. Contains metadata, markdown content, read time, and boolean flags (est_publie, est_a_la_une).
*   **personnes**: Profiles of people involved in a case (Victims, Suspects, Investigators). Links to dossiers(id).
*   **chronologie**: Timeline events forming the timeline sequence. Links to dossiers(id).
*   **images**: Stores the Cloudinary URLs of uploaded evidence/photos. Links to dossiers(id).

---

## ?? Environment Variables

To run this project locally or deploy it, the following variables must be set in .env:

`env
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
`
