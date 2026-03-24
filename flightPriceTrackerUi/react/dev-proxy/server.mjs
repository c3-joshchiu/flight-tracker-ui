import { createServer, request as httpRequest } from "node:http";
import { URL } from "node:url";

const {
  OAUTH_CLIENT_ID,
  OAUTH_CLIENT_SECRET,
  API_BASE_URL,
  PROXY_PORT = "3001",
} = process.env;

if (!OAUTH_CLIENT_ID || !OAUTH_CLIENT_SECRET || !API_BASE_URL) {
  console.error(
    "Missing required env vars: OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, API_BASE_URL\n" +
      "Copy .env.example to .env and fill in real values.",
  );
  process.exit(1);
}

// Token endpoint is at the app root, not under /flights
const apiUrl = new URL(API_BASE_URL);
const tokenUrl = new URL(
  apiUrl.pathname.replace(/\/flights\/?$/, "") + "/oauth/token",
  apiUrl.origin,
).href;

let cachedToken = null;
let tokenExpiry = 0;
const BUFFER_MS = 60_000;

async function acquireToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) return cachedToken;

  const basicCred = Buffer.from(
    `${OAUTH_CLIENT_ID}:${OAUTH_CLIENT_SECRET}`,
  ).toString("base64");

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: OAUTH_CLIENT_ID,
    client_secret: OAUTH_CLIENT_SECRET,
  }).toString();

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicCred}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    redirect: "error", // C3 returns 302 when Basic header is wrong
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Token request failed: ${res.status} ${res.statusText} ${text}`,
    );
  }

  const json = await res.json();
  if (!json.access_token) {
    throw new Error(`No access_token in response: ${JSON.stringify(json)}`);
  }

  cachedToken = json.access_token;
  tokenExpiry =
    now + (json.expires_in ? json.expires_in * 1000 : 3_600_000) - BUFFER_MS;

  console.log("[proxy] Token acquired, expires in ~%ds", Math.round((tokenExpiry - now) / 1000));
  return cachedToken;
}

async function forward(req, res) {
  let token;
  try {
    token = await acquireToken();
  } catch (err) {
    console.error("[proxy] Token error:", err.message);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Token acquisition failed", detail: err.message }));
    return;
  }

  // Build target URL: API_BASE_URL is the /flights root, req.url is /flights/...
  const subPath = (req.url || "/").replace(/^\/flights\/?/, "");
  const target = new URL(subPath, API_BASE_URL.replace(/\/?$/, "/"));
  // Preserve query string
  target.search = new URL(req.url, "http://localhost").search;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": req.headers["content-type"] || "application/json",
  };
  if (req.headers.accept) headers.Accept = req.headers.accept;

  try {
    const apiRes = await fetch(target.href, {
      method: req.method,
      headers,
      body: ["POST", "PUT", "PATCH"].includes(req.method)
        ? await collectBody(req)
        : undefined,
      redirect: "manual",
    });

    res.writeHead(apiRes.status, {
      "Content-Type": apiRes.headers.get("content-type") || "application/json",
    });
    const buf = Buffer.from(await apiRes.arrayBuffer());
    res.end(buf);
  } catch (err) {
    console.error("[proxy] Forward error:", err.message);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "API request failed", detail: err.message }));
  }
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const port = Number(PROXY_PORT);
createServer((req, res) => {
  console.log("[proxy] %s %s", req.method, req.url);
  forward(req, res);
}).listen(port, () => {
  console.log("[proxy] Listening on %d → %s", port, API_BASE_URL);
});
