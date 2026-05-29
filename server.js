const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();
const { Pool } = require("pg");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Add your PostgreSQL connection string as an environment variable.");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS registrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON."));
      }
    });
  });
}

function serveStaticFile(req, res) {
  const requestedPath = req.url === "/" ? "/index.html" : req.url;
  const safePath = path.normalize(decodeURIComponent(requestedPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const extension = path.extname(filePath);
    const contentTypes = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript"
    };

    res.writeHead(200, { "Content-Type": contentTypes[extension] || "application/octet-stream" });
    res.end(content);
  });
}

async function handleRegister(req, res) {
  try {
    const body = await parseRequestBody(req);
    const name = String(body.name || "").trim();

    if (name.length < 2) {
      sendJson(res, 400, { message: "Please enter a name with at least 2 characters." });
      return;
    }

    if (name.length > 80) {
      sendJson(res, 400, { message: "Please keep the name under 80 characters." });
      return;
    }

    await pool.query("INSERT INTO registrations (name) VALUES ($1);", [name]);
    sendJson(res, 201, { message: `Registration successful. Welcome, ${name}!` });
  } catch (error) {
    sendJson(res, 500, { message: error.message });
  }
}

async function handleUsers(req, res) {
  try {
    const result = await pool.query("SELECT id, name, created_at FROM registrations ORDER BY id DESC LIMIT 20;");
    sendJson(res, 200, { users: result.rows });
  } catch (error) {
    sendJson(res, 500, { message: error.message });
  }
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/register") {
    handleRegister(req, res);
    return;
  }

  if (req.method === "GET" && req.url === "/api/users") {
    handleUsers(req, res);
    return;
  }

  if (req.method === "GET") {
    serveStaticFile(req, res);
    return;
  }

  res.writeHead(405);
  res.end("Method not allowed");
});

initializeDatabase()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`App running at http://localhost:${PORT}`);
      console.log("Connected to PostgreSQL.");
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error.message);
    process.exit(1);
  });
