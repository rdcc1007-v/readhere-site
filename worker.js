/* 讀到這裡官網 Worker：靜態檔由 ASSETS 提供，/api/apply 收下 Android 申請。 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

async function ensureSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at TEXT NOT NULL,
        user_agent TEXT
      )`
    )
    .run();
}

async function handleApply(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (request.method !== "POST") {
    return json(405, { success: false, error: "請用 POST 送出。" });
  }
  if (!env.DB) {
    return json(503, { success: false, error: "申請系統還沒設定好。" });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { success: false, error: "格式不對。" });
  }

  const name = String(body?.姓名 || body?.name || "").trim();
  const email = String(body?.["Gmail 信箱"] || body?.email || "").trim();
  if (!name) return json(400, { success: false, error: "請填寫姓名" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { success: false, error: "請填寫正確的 Gmail 信箱" });
  }

  await ensureSchema(env.DB);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO applications (id, name, email, created_at, user_agent) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(id, name, email, createdAt, request.headers.get("User-Agent") || "")
    .run();

  // 若 formsubmit 恢復，順便寄一封到信箱；失敗不影響申請成功。
  try {
    await fetch("https://formsubmit.co/ajax/a.pieceofcake.zip@gmail.com", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        姓名: name,
        "Gmail 信箱": email,
        _subject: "【讀到這裡】Android APP 申請",
        _template: "table",
      }),
    });
  } catch {
    /* formsubmit 掛掉時略過 */
  }

  return json(200, { success: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/apply") {
      return handleApply(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
