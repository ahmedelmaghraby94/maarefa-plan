export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "لم يتم التحقق من جلسة الدخول." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const path = url.searchParams.get("path") || "";
  if (!/^\d+\/[A-Za-z0-9._-]+$/.test(path)) {
    return new Response(JSON.stringify({ error: "مسار ملف الشاهد غير صالح." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = "https://uifblcubxqddylsqyxda.supabase.co";
  const storageUrl = supabaseUrl + "/storage/v1/object/evidence/" + encodeURI(path);

  try {
    const response = await fetch(storageUrl, {
      method: "POST",
      headers: {
        "Authorization": auth,
        "apikey": process.env.SUPABASE_ANON_KEY || "",
        "Content-Type": req.headers.get("content-type") || "application/octet-stream",
        "x-upsert": "false",
      },
      body: req.body,
      duplex: "half",
    });

    const body = await response.text();
    return new Response(body || JSON.stringify({ ok: response.ok }), {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error?.message || "تعذر رفع الشاهد." }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
