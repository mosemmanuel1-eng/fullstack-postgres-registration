# Full-Stack PostgreSQL Registration App

This is a small real-world-style full-stack app:

- Frontend: HTML, CSS, browser JavaScript
- Backend: Node.js
- Database: PostgreSQL
- Hosting target: Render Web Service + Render PostgreSQL

## File Map

- `public/index.html`: page structure shown in the browser
- `public/styles.css`: page design
- `public/app.js`: frontend JavaScript that calls the backend
- `server.js`: backend server and API routes
- `package.json`: tells Render how to install and start the app
- `.env.example`: example of the database variable needed locally

## Production Hosting Map

- GitHub stores these code files.
- Render Web Service runs `server.js` and serves the frontend files.
- Render PostgreSQL stores the registrations.
- `DATABASE_URL` is stored privately in Render environment variables.

## Render Settings

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

Environment variable:

```text
DATABASE_URL=your Render PostgreSQL internal database URL
```
