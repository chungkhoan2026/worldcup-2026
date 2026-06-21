// api/football.js
// Hàm trung gian (Vercel Serverless Function).
// Nhiệm vụ: giấu API key + tránh lỗi CORS khi gọi API-Football từ trình duyệt.
// App phía trước gọi: /api/football?path=fixtures&league=15&season=2026
// Hàm này chuyển tiếp tới https://v3.football.api-sports.io/<path>?<các-tham-số>
export default async function handler(req, res) {
  // Cho phép app (cùng domain) gọi được
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  const KEY = process.env.API_FOOTBALL_KEY; // <-- đặt trong Vercel, KHÔNG để lộ trong code
  if (!KEY) {
    return res.status(500).json({ error: "Thiếu API_FOOTBALL_KEY trong cấu hình máy chủ." });
  }
  // Lấy 'path' (vd: fixtures) rồi gắn các tham số còn lại
  const { path = "", _t, ...params } = req.query; // _t chỉ để phá cache, không gửi tới API-Football
  const allowed = new Set([
    "fixtures",
    "fixtures/statistics",
    "fixtures/events",
    "fixtures/lineups",
    "fixtures/headtohead",
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
    // Dữ liệu trực tiếp (diễn biến, thống kê): KHÔNG cache, để bấm là lấy số mới ngay.
    // Dữ liệu ít đổi (lịch, đội hình, đối đầu, bảng xếp hạng...): cache nhẹ 60s cho tiết kiệm lượt API.
    const noCachePaths = new Set(["fixtures/statistics", "fixtures/events"]);
    if (noCachePaths.has(path)) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    } else {
      res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    }
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: "Lỗi gọi API-Football", detail: String(e) });
  }
}
