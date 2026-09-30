import { getStore } from "@netlify/blobs";

const json = (d, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json" } });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const store = getStore("gate");
  const body = await req.json().catch(() => ({}));

  if (body.action === "sign") {
    const email = String(body.email || "").trim().slice(0, 100);
    const potato = String(body.potato || "").trim().slice(0, 300);
    if (!/^\S+@\S+\.\S+$/.test(email) || !potato) return json({ error: "bad input" }, 400);
    const list = (await store.get("entries", { type: "json" })) || [];
    list.push({ email, potato, at: new Date().toISOString() });
    await store.setJSON("entries", list);
    return json({ ok: true, count: list.length });
  }

  if (body.action === "unlock") {
    const code = process.env.ACCESS_CODE;
    if (!code || body.code !== code) return json({ error: "wrong code" }, 401);
    const list = (await store.get("entries", { type: "json" })) || [];
    return json({ entries: list });
  }

  return json({ error: "unknown" }, 400);
};

export const config = { path: "/api/gate" };
