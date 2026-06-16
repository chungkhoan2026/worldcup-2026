// api/football.js
// Hàm trung gian (Vercel Serverless Function).
// Nhiệm vụ: giấu API key + tránh lỗi CORS khi gọi API-Football từ trình duyệt.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const KEY = process.env.API_FOOTBALL_KEY;
  if (!KEY) {
    return res.status(500).json({ error: "Thiếu API_FOOTBALL_KEY trong cấu hình máy chủ." });
  }

  const { path = "", ...params } = req.query;
  const allowed = new Set([
    "fixtures",
    "fixtures/statistics",
    "fixtures/events",
    "standings",
    "teams",
    "leagues",
    "predictions",
  ]);
  if (!allowed.has(path)) {
    return res.status(400).json({ error: "Đường dẫn không hợp lệ: " + path });
  }

  const qs = new URLSearchParams(params).toString();
  const url = `https://v3.football.api-sports.io/${path}${qs ? "?" + qs : ""}`;

  try {
    const r = await fetch(url, { headers: { "x-apisports-key": KEY } });
    const data = await r.json();
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: "Lỗi gọi API-Football", detail: String(e) });
  }
}
