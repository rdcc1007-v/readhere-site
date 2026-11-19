/* 讀到這裡官網 Pages Functions：/api/wish 收下許願池的許願（寫入 D1 wishes 表，並用 Resend 通知）。 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

const NOTIFY_TO = "rdcc1007@gmail.com";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function ensureSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS wishes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        wish TEXT NOT NULL,
        email TEXT,
        created_at TEXT NOT NULL,
        user_agent TEXT
      )`
    )
    .run();
}

async function sendResend(env, { subject, name, wish, email }) {
  if (!env.RESEND_API_KEY) return;
  const from = env.RESEND_FROM || "讀到這裡 <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [NOTIFY_TO],
      reply_to: email || undefined,
      subject,
      html: `<p><strong>姓名</strong>：${escapeHtml(name)}</p><p><strong>許願內容</strong>：${escapeHtml(wish)}</p><p><strong>Gmail</strong>：${escapeHtml(email || "（未留）")}</p>`,
      text: `姓名：${name}\n許願內容：${wish}\nGmail：${email || "（未留）"}`,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Resend failed", res.status, detail);
  }
}

async function handleWish(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (request.method !== "POST") {
    return json(405, { success: false, error: "請用 POST 送出。" });
  }
  if (!env.DB) {
    return json(503, { success: false, error: "許願池還沒設定好。" });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { success: false, error: "格式不對。" });
  }

  const name = String(body?.姓名 || body?.name || "").trim();
  const wish = String(body?.許願內容 || body?.wish || "").trim();
  const email = String(body?.["Gmail 信箱"] || body?.email || "").trim();
  if (!name) return json(400, { success: false, error: "請填寫姓名" });
  if (!wish) return json(400, { success: false, error: "請寫下你的許願" });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { success: false, error: "請填寫正確的 Gmail 信箱" });
  }

  await ensureSchema(env.DB);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO wishes (id, name, wish, email, created_at, user_agent) VALUES (?,?,?,?,?,?)"
  )
    .bind(id, name, wish, email || null, createdAt, request.headers.get("User-Agent") || "")
    .run();

  // Resend 通知；失敗不影響許願成功（資料已在 D1）。
  try {
    await sendResend(env, {
      subject: "許願池新許願",
      name,
      wish,
      email,
    });
  } catch (err) {
    console.error("Resend error", err);
  }

  return json(200, { success: true });
}

export async function onRequestPost(context) {
  return handleWish(context.request, context.env);
}

export async function onRequestOptions(context) {
  return handleWish(context.request, context.env);
}
