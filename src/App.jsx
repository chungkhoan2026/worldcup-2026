import React, { useState, useEffect, useCallback, useRef } from "react";

/* WORLD CUP 2026 — Lịch & phân tích (giờ Việt Nam) — Người viết app: PAK
   Nguồn: API-Football (league=1, season=2026) qua hàm trung gian /api/football */

const WC_LEAGUE_ID = 1;
const SEASON = 2026;

// Kho "Nhận định chuyên sâu" nhập tay cho từng trận, nhận diện theo cặp tên đội (không phân biệt thứ tự).
// Mỗi key là 2 tên đội nối bằng "|" (viết thường). Giá trị là nội dung phân tích (mảng các đoạn).
const DEEP_NOTES = {
  "south africa|canada": {
    title: "Nhận định chuyên sâu",
    blocks: [
      { h: "Đánh giá chung", t: "Canada (đồng chủ nhà World Cup 2026) được đánh giá cao hơn rõ rệt: lợi thế sân bãi quen thuộc, phong độ ổn định và dàn cầu thủ chất lượng (Alphonso Davies, Jonathan David…), được coi là ứng viên vượt qua vòng này dễ dàng hơn. Nam Phi chơi kỷ luật, chắc chắn, hay gây bất ngờ nhờ tinh thần chiến đấu và các tình huống cố định — được xem là 'ngựa ô' nhưng bị đánh giá thấp hơn về chất lượng đội hình tổng thể." },
      { h: "Dự đoán phổ biến", t: "Siêu máy tính Opta: Canada thắng ~55% trong 90 phút, tổng cơ hội đi tiếp ~68%. Nhiều nguồn (Sports Mole, VietnamNet, chuyên gia Việt Nam) nghiêng về Canada thắng sát nút 2-1 hoặc 1-0; một số ý kiến cho rằng trận có thể kéo dài tới hiệp phụ. Canada được ưu tiên nhờ tốc độ, pressing cao và khả năng chuyển trạng thái nhanh." },
      { h: "Nhận định tóm tắt", t: "Canada thắng 2-1 (hoặc 2-0 nếu chơi chắc chắn) — kịch bản được đa số chuyên gia và siêu máy tính ủng hộ nhất." },
      { h: "Vì sao Canada được đánh giá cao", t: "Lợi thế chủ nhà (sân Bắc Mỹ, khán giả ủng hộ, quen múi giờ và khí hậu). Chất lượng đội hình với nhiều ngôi sao đang đá ở châu Âu (Davies - Bayern, David - Lille, Eustaquio, Buchanan…), hàng công nhanh, pressing tốt. Phong độ vòng bảng tốt, trong khi Nam Phi dù kỷ luật nhưng thường thiếu sắc bén ở khâu dứt điểm." },
      { h: "Nam Phi có thể gây khó khăn gì", t: "Phòng ngự chắc, phản công nhanh, giỏi đá phạt và phạt góc. Tinh thần chiến đấu cao, thường lì lợm ở các trận knock-out. Có thể gây bất ngờ nếu Canada chủ quan hoặc mắc lỗi phòng ngự." },
      { h: "Dự đoán chi tiết", t: "Tỷ số: Canada 2-1 Nam Phi (nhiều khả năng Canada dẫn trước, Nam Phi gỡ hòa tạm thời, rồi Canada quyết định ở hiệp 2). Canada thắng trong 90 phút: ~55-60%. Canada đi tiếp: 65-70%. Kịch bản thay thế: nếu Canada chơi chặt 2-0; bất ngờ hòa 1-1 kéo dài hiệp phụ (Canada vẫn nhỉnh hơn ở loạt luân lưu)." },
      { h: "Cầu thủ nổi bật", t: "Canada: Jonathan David (dự kiến ghi bàn), Alphonso Davies. Nam Phi: trông chờ các tình huống cố định từ trung vệ hoặc tiền vệ." },
    ],
  },
  "ivory coast|norway": {
    title: "Nhận định chuyên sâu",
    blocks: [
      { h: "Phân tích cụ thể", t: "Na Uy dựa vào pressing tầm cao, thể lực bền bỉ và khả năng chuyển trạng thái nhanh. Bờ Biển Ngà mạnh ở tốc độ cá nhân, kỹ thuật và khai thác khoảng trống sau lưng hàng thủ đối phương. Trận đấu là sự đối đầu giữa tổ chức kỷ luật (Na Uy) và cá nhân xuất sắc (Bờ Biển Ngà)." },
      { h: "Đánh giá chung từ thế giới & chuyên gia", t: "Các chuyên gia như Gary Neville (Sky Sports) và giới phân tích Opta đánh giá đây là cặp đấu cân bằng nhất ngày, hai đội đều có lối chơi hiện đại nhưng chưa nhiều kinh nghiệm ở giai đoạn knock-out. Na Uy nhỉnh hơn về thể lực, Bờ Biển Ngà nguy hiểm hơn ở khoảnh khắc quyết định." },
      { h: "Dự đoán phổ biến", t: "Siêu máy tính Opta và phần lớn chuyên gia cho rằng trận sẽ rất chặt chẽ, ít bàn thắng trong 90 phút, dễ phải phân định bằng hiệp phụ hoặc penalty." },
      { h: "Xác suất (theo mô phỏng)", t: "Thắng trong 90 phút: Na Uy ~45-48%, Bờ Biển Ngà ~38-42%, Hòa ~20-25%. Xác suất đi tiếp: Na Uy ~52-55%, Bờ Biển Ngà ~45-48%. Dự đoán bàn thắng: trung bình 2.4-2.6 bàn/trận, nhiều kịch bản phải kéo dài hiệp phụ/penalty. Siêu máy tính: trận rất cân bằng, Na Uy nhỉnh hơn nhẹ nhờ thể lực và tổ chức tốt hơn trong mô phỏng dài hạn." },
      { h: "Nhận định tóm tắt", t: "Trận 'cân não', nơi sự ổn định tâm lý và khả năng tận dụng cơ hội sẽ quyết định người thắng cuộc." },
      { h: "Dự đoán chi tiết", t: "Cả hai chơi thăm dò ở hiệp 1, pressing cao từ phút đầu. Na Uy có thể kiểm soát nhịp độ tốt hơn nhờ thể lực, nhưng Bờ Biển Ngà nguy hiểm ở phản công. Khả năng cao trận đấu kéo dài." },
      { h: "Dự đoán kết quả", t: "Hòa 1-1 sau 90 phút, Na Uy thắng trên chấm penalty (hoặc Bờ Biển Ngà thắng sát nút 2-1 nếu tận dụng tốt tình huống cố định)." },
    ],
  },
  "france|sweden": {
    title: "Nhận định chuyên sâu",
    blocks: [
      { h: "Phân tích cụ thể", t: "Pháp sở hữu chiều sâu đội hình tuyệt vời, khả năng kiểm soát trận đấu và chuyển đổi nhanh từ phòng ngự sang tấn công. Thụy Điển dựa vào khối phòng ngự chắc chắn và pressing có tổ chức, nhưng thiếu ngôi sao sáng tạo để xuyên phá hàng thủ Pháp." },
      { h: "Đánh giá chung từ thế giới & chuyên gia", t: "Thierry Henry, Rio Ferdinand và Opta đều coi Pháp là một trong những ứng viên vô địch hàng đầu. Thụy Điển được đánh giá cao về tính tổ chức nhưng khó cạnh tranh với chất lượng tổng thể của Pháp ở giai đoạn knock-out." },
      { h: "Dự đoán phổ biến", t: "Pháp thắng cách biệt; chuyên gia dự đoán họ kiểm soát trận đấu từ sớm và không cho Thụy Điển nhiều cơ hội." },
      { h: "Xác suất (theo mô phỏng)", t: "Thắng trong 90 phút: Pháp ~68-75%, Thụy Điển ~12-18%, Hòa ~15-20%. Xác suất đi tiếp: Pháp >80%. Dự đoán bàn thắng: trung bình 2.7-3.0 bàn/trận (Pháp thường thắng cách biệt). Siêu máy tính: Pháp vượt trội rõ rệt về chất lượng và kinh nghiệm — một trong những trận được dự đoán 'một chiều' nhất ngày." },
      { h: "Nhận định tóm tắt", t: "Trận đấu Pháp được kỳ vọng thể hiện đẳng cấp, trong khi Thụy Điển chủ yếu chơi phòng ngự phản công." },
      { h: "Dự đoán chi tiết", t: "Pháp chiếm ưu thế kiểm soát bóng, tận dụng tốc độ ở hai cánh và khả năng dứt điểm đa dạng. Thụy Điển có thể gây khó khăn trong 20-30 phút đầu nhưng sẽ mệt mỏi ở hiệp 2." },
      { h: "Dự đoán kết quả", t: "Pháp thắng 2-0 hoặc 2-1, đi tiếp với tỷ lệ rất cao (>75%)." },
    ],
  },
  "mexico|ecuador": {
    title: "Nhận định chuyên sâu",
    blocks: [
      { h: "Phân tích cụ thể", t: "Mexico tận dụng lợi thế sân nhà (độ cao gây khó chịu cho đối thủ, khán giả cuồng nhiệt) cùng lối chơi pressing mạnh, tốc độ cao. Ecuador chơi chắc chắn, phòng ngự tốt nhưng thường thiếu sáng tạo và khả năng chịu áp lực lâu dài." },
      { h: "Đánh giá chung từ thế giới & chuyên gia", t: "Chuyên gia Mỹ Latinh (ESPN, Telemundo) đánh giá Mexico nhỉnh hơn rõ rệt nhờ yếu tố sân bãi và phong độ gần đây. Ecuador được coi là đội khó chịu nhưng khó lật ngược thế trận trước chủ nhà." },
      { h: "Dự đoán phổ biến", t: "Mexico thắng sát nút; chuyên gia nhấn mạnh yếu tố sân nhà là chìa khóa." },
      { h: "Xác suất (theo mô phỏng)", t: "Thắng trong 90 phút: Mexico ~58-65%, Ecuador ~20-25%, Hòa ~18-22%. Xác suất đi tiếp: Mexico ~68-72%. Dự đoán bàn thắng: trung bình 2.5-2.8 bàn/trận. Siêu máy tính: yếu tố sân nhà (độ cao + khán giả) được tính toán mạnh, giúp Mexico có lợi thế rõ rệt trong các mô phỏng." },
      { h: "Nhận định tóm tắt", t: "Mexico kiểm soát nhịp độ, Ecuador cố gắng phản công nhưng dễ bị áp đảo ở hiệp 2." },
      { h: "Dự đoán chi tiết", t: "Mexico đẩy cao đội hình từ sớm, tận dụng khán giả để tạo sức ép. Ecuador có thể trụ vững hiệp 1 nhưng thể lực giảm sút ở hiệp 2, dẫn đến sai lầm." },
      { h: "Dự đoán kết quả", t: "Mexico thắng 2-1 hoặc 1-0, đi tiếp với tỷ lệ ~65-70%." },
    ],
  },
};

// Tìm nhận định chuyên sâu cho một trận theo tên 2 đội (không phân biệt thứ tự)
function getDeepNote(homeName, awayName) {
  const norm = (s) => (s || "").trim().toLowerCase()
    .replace("côte d'ivoire", "ivory coast")
    .replace("cote d'ivoire", "ivory coast");
  const a = norm(homeName), b = norm(awayName);
  return DEEP_NOTES[`${a}|${b}`] || DEEP_NOTES[`${b}|${a}`] || null;
}
const API = (path, params = {}) => {
  const qs = new URLSearchParams({ path, ...params }).toString();
  return `/api/football?${qs}`;
};

// Phân bảng cố định theo kết quả bốc thăm (tên đội đúng như API-Football trả về)
const GROUP_TEAMS = {
  A: ["Mexico", "South Africa", "South Korea", "Czech Republic", "Czechia"],
  B: ["Canada", "Switzerland", "Qatar", "Italy", "Bosnia and Herzegovina", "Northern Ireland", "Wales"],
  C: ["Brazil", "Morocco", "Haiti", "Scotland"],
  D: ["USA", "United States", "Paraguay", "Australia", "Turkey", "Türkiye", "Turkiye"],
  E: ["Germany", "Curacao", "Curaçao", "Ivory Coast", "Cote d'Ivoire", "Côte d'Ivoire", "Ecuador"],
  F: ["Netherlands", "Japan", "Sweden", "Tunisia"],
  G: ["Belgium", "Egypt", "Iran", "New Zealand"],
  H: ["Spain", "Cape Verde", "Cabo Verde", "Saudi Arabia", "Uruguay"],
  I: ["France", "Senegal", "Iraq", "Norway"],
  J: ["Argentina", "Algeria", "Austria", "Jordan"],
  K: ["Portugal", "DR Congo", "Congo DR", "Uzbekistan", "Colombia"],
  L: ["England", "Croatia", "Ghana", "Panama"],
};

function groupOfTeam(name) {
  if (!name) return null;
  for (const [g, teams] of Object.entries(GROUP_TEAMS)) {
    if (teams.includes(name)) return g;
  }
  return null;
}

// Lịch sử đối đầu nhập sẵn (dùng khi API-Football không có dữ liệu trận cũ).
// Mỗi cặp dùng khóa "TÊN1|TÊN2" (xếp theo bảng chữ cái), trong đó "matches" liệt kê các lần gặp.
const MANUAL_H2H = {};

function manualH2H(nameA, nameB) {
  const key1 = `${nameA}|${nameB}`, key2 = `${nameB}|${nameA}`;
  return MANUAL_H2H[key1] || MANUAL_H2H[key2] || null;
}

function toVN(iso) {
  if (!iso) return { date: "—", time: "—" };
  const d = new Date(iso);
  const vn = new Date(d.getTime() + 7 * 3600 * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return { date: `${p(vn.getUTCDate())}/${p(vn.getUTCMonth() + 1)}`, time: `${p(vn.getUTCHours())}:${p(vn.getUTCMinutes())}` };
}

// Kiểm tra một trận có diễn ra "hôm nay" theo giờ Việt Nam hay không
function isToday(iso) {
  if (!iso) return false;
  const vnNow = new Date(Date.now() + 7 * 3600 * 1000);
  const vnMatch = new Date(new Date(iso).getTime() + 7 * 3600 * 1000);
  return vnNow.getUTCFullYear() === vnMatch.getUTCFullYear()
    && vnNow.getUTCMonth() === vnMatch.getUTCMonth()
    && vnNow.getUTCDate() === vnMatch.getUTCDate();
}

// Trận sắp đá trong vòng 24h tới (tính từ bây giờ), nhưng KHÔNG rơi vào hôm nay (để tránh trùng banner "đá hôm nay")
function isSoon24h(iso) {
  if (!iso || isToday(iso)) return false;
  const diffMs = new Date(iso).getTime() - Date.now();
  return diffMs > 0 && diffMs <= 24 * 3600 * 1000;
}

const C = { bg: "#0B1120", card: "#121A2B", line: "#1E293B", line2: "#243049", text: "#E7ECF3", sub: "#AEBBD0", dim: "#8C99B0", accent: "#E63946", gold: "#FFD166", green: "#4ADE80" };

export default function App() {
  const [view, setView] = useState({ name: "groups" });
  const [locked, setLocked] = useState(true);      // app khởi động bị khoá, cần mật khẩu mới vào
  const [passInput, setPassInput] = useState("");   // ô nhập mật khẩu
  const [passErr, setPassErr] = useState("");
  const [groups, setGroups] = useState(null);
  const [knockout, setKnockout] = useState(null); // các trận vòng loại trực tiếp, gom theo vòng
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await fetch(API("fixtures", { league: WC_LEAGUE_ID, season: SEASON }));
      const json = await res.json();
      if (json.errors && (Array.isArray(json.errors) ? json.errors.length : Object.keys(json.errors).length)) {
        throw new Error(typeof json.errors === "object" ? Object.values(json.errors).join("; ") : String(json.errors));
      }
      const fixtures = json.response || [];
      const map = {};
      const ko = {}; // { "Round of 32": [...], "Round of 16": [...], ... }
      for (const f of fixtures) {
        const round = (f.league?.round || "");
        const roundLow = round.toLowerCase();
        if (roundLow.includes("group")) {
          // Vòng bảng
          const g = groupOfTeam(f.teams?.home?.name) || groupOfTeam(f.teams?.away?.name);
          if (!g) continue;
          (map[g] ||= []).push(f);
        } else {
          // Vòng loại trực tiếp (Round of 32/16, Quarter/Semi-finals, 3rd Place, Final...)
          (ko[round] ||= []).push(f);
        }
      }
      setGroups(map);
      setKnockout(ko);
    } catch (e) {
      if (!silent) setError("Không tải được dữ liệu. " + e.message);
    } finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Tự động làm mới ngầm danh sách bảng theo KHUNG GIỜ (giờ VN):
  // - Từ 22h tối đến 12h trưa hôm sau: làm mới mỗi 15 phút (khung giờ World Cup hay đá).
  // - Ngoài khung đó: không tự làm mới, để người dùng tự bấm nút ↻.
  useEffect(() => {
    const inRefreshWindow = () => {
      const vnHour = new Date(Date.now() + 7 * 3600 * 1000).getUTCHours(); // giờ hiện tại theo VN (0-23)
      return vnHour >= 22 || vnHour < 12; // 22h,23h,0h...11h => true
    };
    const tick = () => { if (inRefreshWindow()) loadAll(true); };
    const timer = setInterval(tick, 15 * 60 * 1000); // kiểm tra & làm mới mỗi 15 phút
    return () => clearInterval(timer);
  }, [loadAll]);

  const tryUnlock = () => {
    if (passInput.trim().toLowerCase() === "lapvit") {
      setLocked(false); setPassErr(""); setPassInput("");
    } else {
      setPassErr("Mật khẩu chưa đúng, thử lại nhé!");
    }
  };

  if (locked) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter',system-ui,sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ fontSize: 72, marginBottom: 8 }}>🔒</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: C.gold, marginBottom: 4, textAlign: "center" }}>WORLD CUP 2026</div>
        <div style={{ fontSize: 15, color: C.sub, marginBottom: 6, textAlign: "center" }}>Ứng dụng đang khoá — nhập mật khẩu để vào xem</div>
        <div style={{ fontSize: 13, color: C.dim, marginBottom: 24, textAlign: "center", fontStyle: "italic" }}>Theo yêu cầu của Minh Nổ - Lập Vịt</div>
        <input
          type="password"
          value={passInput}
          onChange={(e) => { setPassInput(e.target.value); setPassErr(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") tryUnlock(); }}
          placeholder="Nhập mật khẩu…"
          autoFocus
          style={{ width: "100%", maxWidth: 320, padding: "14px 16px", fontSize: 18, textAlign: "center", borderRadius: 12, border: `2px solid ${passErr ? C.accent : C.line2}`, background: C.card, color: C.text, outline: "none", marginBottom: 12 }}
        />
        {passErr && <div style={{ color: "#FF6B7A", fontSize: 14, marginBottom: 12, fontWeight: 600 }}>{passErr}</div>}
        <button onClick={tryUnlock} style={{ width: "100%", maxWidth: 320, padding: "14px", fontSize: 18, fontWeight: 800, borderRadius: 12, border: "none", background: C.accent, color: "#fff", cursor: "pointer" }}>
          🔓 Mở khoá
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`*{box-sizing:border-box}.card{transition:transform .15s,border-color .15s}.card:hover{transform:translateY(-2px);border-color:${C.accent}!important}@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite;display:inline-block}.pill{font-size:11px;font-weight:700;letter-spacing:.4px;padding:3px 9px;border-radius:999px}button{font-family:inherit}@keyframes blink{0%,100%{opacity:1}50%{opacity:.35}}@keyframes liveGlow{0%,100%{box-shadow:0 0 0 0 rgba(230,57,70,.6)}50%{box-shadow:0 0 14px 3px rgba(230,57,70,.85)}}.live-banner{animation:liveGlow 1.3s ease-in-out infinite}.live-dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#FF3B3B;animation:blink 1s ease-in-out infinite}.soon-dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#FFD166;animation:blink 1.4s ease-in-out infinite}.today-dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#FF8C42;animation:blink 1.2s ease-in-out infinite}.blink-text{animation:blink 1s ease-in-out infinite}.blink-text-soft{animation:blink 1.4s ease-in-out infinite}@media(prefers-reduced-motion:reduce){.card{transition:none}.spin{animation:none}.live-banner{animation:none}.live-dot{animation:none}.soon-dot{animation:none}.blink-text{animation:none}.blink-text-soft{animation:none}.today-dot{animation:none}}`}</style>

      <header style={{ borderBottom: `1px solid ${C.line}`, padding: "16px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, background: "rgba(11,17,32,.92)", backdropFilter: "blur(8px)", zIndex: 10 }}>
        {view.name !== "groups" && (
          <button onClick={() => setView(view.name === "match" ? (view.g === "KO" ? { name: "knockout" } : { name: "group", g: view.g }) : { name: "groups" })} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 48, lineHeight: 1, padding: "4px 12px", minWidth: 56, minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
        )}
        <span style={{ fontSize: 28 }}>🏆</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 20 }}>WORLD CUP 2026</div>
          <div style={{ fontSize: 15, color: C.text }}>Lịch & phân tích · giờ Việt Nam (UTC+7)</div>
          <div style={{ fontSize: 14, color: C.gold, fontWeight: 700 }}>Người viết app: PAK</div>
          <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>Cộng tác viên: Nguyễn Viết Lập, Sơn Công Chúa, Minh Nổ, Trường Cò</div>
        </div>
        <button onClick={() => loadAll(false)} title="Cập nhật" style={{ background: "none", border: `1px solid ${C.line2}`, color: C.sub, borderRadius: 12, padding: "12px 16px", cursor: "pointer", fontSize: 24, minWidth: 56, minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>↻</button>
      </header>

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 28px" }}>
        {loading && <Center>Đang tải lịch thi đấu trực tuyến…</Center>}
        {error && !loading && (
          <div style={{ background: "rgba(230,57,70,.1)", border: `1px solid ${C.accent}`, borderRadius: 12, padding: 16, color: "#FF6B7A" }}>
            {error}
            <button onClick={() => loadAll(false)} style={{ display: "block", marginTop: 10, background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 700 }}>Thử lại</button>
          </div>
        )}
        {!loading && !error && groups && Object.keys(groups).length === 0 && (
          <Center>Chưa có dữ liệu trận đấu. Thử bấm nút ↻ để tải lại.</Center>
        )}
        {!loading && !error && groups && Object.keys(groups).length > 0 && (
          <>
            {(view.name === "groups" || view.name === "knockout") && (
              <div style={{ display: "flex", gap: 10, marginBottom: 20, justifyContent: "center" }}>
                <button onClick={() => setView({ name: "groups" })} style={{ flex: "0 1 220px", padding: "12px 16px", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: "pointer", border: `1px solid ${view.name === "groups" ? C.accent : C.line2}`, background: view.name === "groups" ? "rgba(230,57,70,.15)" : C.card, color: view.name === "groups" ? "#FF6B7A" : C.sub }}>📋 Vòng bảng</button>
                <button onClick={() => setView({ name: "knockout" })} style={{ flex: "0 1 220px", padding: "12px 16px", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: "pointer", border: `1px solid ${view.name === "knockout" ? C.accent : C.line2}`, background: view.name === "knockout" ? "rgba(230,57,70,.15)" : C.card, color: view.name === "knockout" ? "#FF6B7A" : C.sub }}>🏆 Vòng loại trực tiếp</button>
              </div>
            )}
            {view.name === "groups" && <Groups groups={groups} onOpen={(g) => setView({ name: "group", g })} />}
            {view.name === "knockout" && <Knockout knockout={knockout} onOpenMatch={(m) => setView({ name: "match", g: "KO", match: m })} />}
            {view.name === "group" && <Group g={view.g} fixtures={groups[view.g] || []} onOpenMatch={(m) => setView({ name: "match", g: view.g, match: m })} />}
            {view.name === "match" && <Match g={view.g} match={view.match} />}
          </>
        )}
      </main>

      <footer style={{ textAlign: "center", padding: "24px 16px", color: C.sub, fontSize: 12, borderTop: `1px solid ${C.line}`, marginTop: 24 }}>
        Dữ liệu: API-Football · cập nhật trực tuyến mỗi khi mở.
        <div style={{ marginTop: 8, color: C.gold, fontWeight: 800, fontSize: 15 }}>Người viết app: PAK</div>
        <div style={{ marginTop: 4, color: C.text, fontWeight: 600, fontSize: 14 }}>Cộng tác viên: Nguyễn Viết Lập, Sơn Công Chúa, Minh Nổ, Trường Cò</div>
      </footer>
    </div>
  );
}

function Center({ children }) {
  return <div style={{ textAlign: "center", padding: 40, color: C.sub }}><span className="spin">⏳</span><div style={{ marginTop: 10, fontSize: 13 }}>{children}</div></div>;
}

function teamsOf(fixtures) {
  const seen = {};
  for (const f of fixtures) for (const side of ["home", "away"]) {
    const tt = f.teams[side];
    if (tt && !seen[tt.id]) seen[tt.id] = { id: tt.id, name: tt.name, logo: tt.logo };
  }
  return Object.values(seen).slice(0, 4);
}
function isDone(m) { return ["FT", "AET", "PEN"].includes(m.fixture?.status?.short); }
// Trận đang diễn ra (bao gồm hiệp 1, nghỉ giữa hiệp, hiệp 2, hiệp phụ, loạt luân lưu)
function isLive(m) { return ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"].includes(m.fixture?.status?.short); }

// Hiển thị nhanh tỉ số + phạt góc + thẻ vàng cho 1 trận đang đá, ngay trong thẻ bảng.
// Tự tải thống kê + sự kiện; tự làm mới mỗi 60 giây (nhẹ hơn khu chi tiết để tiết kiệm lượt API).
function LiveMini({ match, compact }) {
  const [data, setData] = useState(null);
  const hId = match.teams.home.id, aId = match.teams.away.id;
  const koLabel = { "1H": "Hiệp 1", "HT": "Nghỉ", "2H": "Hiệp 2", "ET": "Hiệp phụ", "BT": "Nghỉ HP", "P": "Luân lưu", "INT": "Tạm dừng" };

  useEffect(() => {
    let alive = true;
    const fetchData = async () => {
      try {
        const t = Date.now();
        const [rSt, rEv, rFx] = await Promise.all([
          fetch(API("fixtures/statistics", { fixture: match.fixture.id, _t: t })).then(x => x.json()),
          fetch(API("fixtures/events", { fixture: match.fixture.id, _t: t })).then(x => x.json()),
          fetch(API("fixtures", { id: match.fixture.id, _t: t })).then(x => x.json()),
        ]);
        if (!alive) return;
        const stats = rSt.response || [];
        const events = rEv.response || [];
        const fx = rFx.response?.[0];
        const corner = (tid) => { const b = stats.find(s => s.team.id === tid); const it = b?.statistics?.find(x => x.type === "Corner Kicks"); return it?.value ?? 0; };
        const yellow = (tid) => events.filter(e => e.type === "Card" && e.detail === "Yellow Card" && e.team?.id === tid).length;
        setData({
          cH: corner(hId), cA: corner(aId), yH: yellow(hId), yA: yellow(aId),
          status: fx?.fixture?.status?.short, elapsed: fx?.fixture?.status?.elapsed, extra: fx?.fixture?.status?.extra,
          gh: fx?.goals?.home, ga: fx?.goals?.away,
        });
      } catch { /* bỏ qua, lần sau thử lại */ }
    };
    fetchData();
    const timer = setInterval(fetchData, 60000);
    return () => { alive = false; clearInterval(timer); };
  }, [match.fixture.id, hId, aId]);

  if (!data) return <span style={{ fontSize: 11, color: C.dim, marginLeft: 6 }}>· đang tải số liệu…</span>;
  const done = ["FT", "AET", "PEN"].includes(data.status);
  const timeStr = data.elapsed != null ? `${data.elapsed}${data.extra ? "+" + data.extra : ""}'` : "";
  const statusText = done
    ? (data.status === "PEN" ? "KẾT THÚC (luân lưu)" : data.status === "AET" ? "KẾT THÚC (hiệp phụ)" : "ĐÃ KẾT THÚC")
    : `${koLabel[data.status] || "Đang đá"}${timeStr ? " " + timeStr : ""}`;

  // Một dòng số liệu: số áp sát 2 mép (đội nhà trái, đội khách phải), nhãn ở giữa
  const StatRow = ({ label, h, a }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 4px" }}>
      <span style={{ fontWeight: 900, fontSize: 17, color: C.text, minWidth: 24, textAlign: "left" }}>{h}</span>
      <span style={{ fontSize: 11, color: C.sub, whiteSpace: "nowrap", flex: 1, textAlign: "center" }}>{label}</span>
      <span style={{ fontWeight: 900, fontSize: 17, color: C.text, minWidth: 24, textAlign: "right" }}>{a}</span>
    </div>
  );

  return (
    <div style={{ marginTop: compact ? 8 : 4, marginLeft: compact ? 0 : 18 }}>
      {/* Trạng thái + phút, căn giữa */}
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 800, color: done ? C.green : "#FF6B7A" }}>
          {done ? "✓" : <span className="live-dot" />} {statusText}
        </span>
      </div>
      {/* TỈ SỐ TO ở giữa, là chính */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <span style={{ fontWeight: 900, fontSize: 30, color: done ? C.gold : "#FF6B7A", letterSpacing: 2 }}>
          {data.gh ?? 0} - {data.ga ?? 0}
        </span>
      </div>
      {/* Phạt góc + thẻ vàng: số áp sát 2 bên */}
      <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 10, padding: "6px 18px" }}>
        <StatRow label="Phạt góc" h={data.cH} a={data.cA} />
        <StatRow label="Thẻ vàng" h={data.yH} a={data.yA} />
      </div>
    </div>
  );
}

function Groups({ groups, onOpen }) {
  const ids = Object.keys(groups).sort();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 18 }}>
      {ids.map((id) => {
        const teams = teamsOf(groups[id]);
        const done = groups[id].filter(isDone).length;
        // Các trận của bảng này diễn ra hôm nay (theo giờ VN), chưa đá xong, sắp theo giờ
        // Trận ĐANG đá (live) — ưu tiên cao nhất, màu đỏ
        const liveMatches = groups[id]
          .filter((m) => isLive(m))
          .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));
        // Trận hôm nay nhưng CHƯA đá (không gồm trận đang đá) — màu cam
        const todayMatches = groups[id]
          .filter((m) => isToday(m.fixture?.date) && !isDone(m) && !isLive(m))
          .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));
        // Các trận sắp đá trong 24h tới (không tính hôm nay)
        const soonMatches = groups[id]
          .filter((m) => isSoon24h(m.fixture?.date) && !isDone(m))
          .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));
        // Các trận đã đá xong của bảng (kèm tỉ số), sắp theo thời gian
        const doneMatches = groups[id]
          .filter((m) => isDone(m))
          .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));
        return (
          <button key={id} onClick={() => onOpen(id)} className="card" style={{ textAlign: "left", cursor: "pointer", background: C.card, border: `1px solid ${liveMatches.length > 0 ? C.accent : C.line}`, borderRadius: 16, padding: 18, color: "inherit" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: C.accent }}>Bảng {id}</span>
              <span className="pill" style={{ background: C.line, color: "#9FB0C9" }}>{done}/{groups[id].length} đã đá</span>
            </div>
            {liveMatches.length > 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.accent}`, borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                  <span className="live-dot" />
                  <span style={{ fontWeight: 800, fontSize: 13, color: "#FF6B7A", letterSpacing: ".5px" }}>ĐANG ĐÁ</span>
                </div>
                {liveMatches.map((m, idx) => (
                  <div key={m.fixture.id} style={{ paddingTop: idx > 0 ? 10 : 0, marginTop: idx > 0 ? 10 : 0, borderTop: idx > 0 ? `1px solid ${C.line2}` : "none" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                      <span style={{ textAlign: "right" }}>{m.teams.home.name}</span>
                      <span style={{ color: C.dim, fontSize: 11, padding: "0 10px" }}>vs</span>
                      <span style={{ textAlign: "left" }}>{m.teams.away.name}</span>
                    </div>
                    <LiveMini match={m} compact />
                  </div>
                ))}
              </div>
            )}
            {todayMatches.length > 0 && (
              <div style={{ background: "rgba(255,140,66,.12)", border: `1px solid #FF8C42`, borderRadius: 10, padding: "8px 10px", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: todayMatches.length ? 6 : 0 }}>
                  <span className="today-dot" />
                  <span style={{ fontWeight: 800, fontSize: 13, color: "#FF8C42", letterSpacing: ".5px" }}>ĐÁ HÔM NAY</span>
                </div>
                {todayMatches.map((m) => {
                  const tt = toVN(m.fixture.date);
                  return (
                    <div key={m.fixture.id} style={{ fontSize: 13, color: C.text, fontWeight: 600, padding: "2px 0" }}>
                      🕒 <b style={{ color: C.gold }}>{tt.time}</b> · {m.teams.home.name} <span style={{ color: C.sub }}>vs</span> {m.teams.away.name}
                    </div>
                  );
                })}
              </div>
            )}
            {soonMatches.length > 0 && (
              <div style={{ background: "rgba(255,209,102,.10)", border: `1px solid ${C.gold}`, borderRadius: 10, padding: "8px 10px", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>⏳</span>
                  <span style={{ fontWeight: 800, fontSize: 13, color: C.gold, letterSpacing: ".5px" }}>SẮP ĐÁ (trong 24h)</span>
                </div>
                {soonMatches.map((m) => {
                  const tt = toVN(m.fixture.date);
                  return (
                    <div key={m.fixture.id} style={{ fontSize: 13, color: C.text, fontWeight: 600, padding: "2px 0" }}>
                      🕒 <b style={{ color: C.gold }}>{tt.date} · {tt.time}</b> · {m.teams.home.name} <span style={{ color: C.sub }}>vs</span> {m.teams.away.name}
                    </div>
                  );
                })}
              </div>
            )}
            {teams.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", fontSize: 16 }}>
                <img src={t.logo} alt="" width={24} height={24} style={{ objectFit: "contain" }} /><span>{t.name}</span>
              </div>
            ))}
            {doneMatches.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.line2}` }}>
                <div style={{ fontSize: 12, color: C.green, fontWeight: 700, marginBottom: 6 }}>Kết quả đã đá:</div>
                {doneMatches.map((m) => (
                  <div key={m.fixture.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "3px 0" }}>
                    <span style={{ flex: 1, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.teams.home.name}</span>
                    <span style={{ fontWeight: 800, color: C.gold, minWidth: 44, textAlign: "center" }}>{m.goals.home}-{m.goals.away}</span>
                    <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.teams.away.name}</span>
                  </div>
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Thứ tự và tên tiếng Việt các vòng loại trực tiếp
const KO_ORDER = [
  { match: ["round of 32", "1/16"], vi: "Vòng 1/16" },
  { match: ["round of 16", "1/8"], vi: "Vòng 1/8" },
  { match: ["quarter"], vi: "Tứ kết" },
  { match: ["semi"], vi: "Bán kết" },
  { match: ["3rd place", "third place", "play-off for third"], vi: "Tranh hạng ba" },
  { match: ["final"], vi: "Chung kết" },
];
function koViName(round) {
  const low = (round || "").toLowerCase();
  // "final" phải kiểm sau "semi-final"/"quarter-final" để không nhầm
  if (low.includes("semi")) return "Bán kết";
  if (low.includes("quarter")) return "Tứ kết";
  if (low.includes("round of 32") || low.includes("1/16")) return "Vòng 1/16";
  if (low.includes("round of 16") || low.includes("1/8")) return "Vòng 1/8";
  if (low.includes("3rd") || low.includes("third")) return "Tranh hạng ba";
  if (low.includes("final")) return "Chung kết";
  return round;
}
function koRank(round) {
  const vi = koViName(round);
  const order = ["Vòng 1/16", "Vòng 1/8", "Tứ kết", "Bán kết", "Tranh hạng ba", "Chung kết"];
  const i = order.indexOf(vi);
  return i === -1 ? 99 : i;
}

function Knockout({ knockout, onOpenMatch }) {
  const rounds = knockout ? Object.keys(knockout) : [];
  // Sắp xếp các vòng theo thứ tự thi đấu
  const sortedRounds = [...rounds].sort((a, b) => koRank(a) - koRank(b));
  const hasAny = sortedRounds.length > 0;

  return (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 800, margin: "4px 0 16px" }}><span style={{ color: C.accent }}>🏆 Vòng loại trực tiếp</span></h2>

      {!hasAny && (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20, textAlign: "center", color: C.sub, fontSize: 14, lineHeight: 1.7 }}>
          Đang chờ dữ liệu các cặp đấu vòng loại trực tiếp từ nhà cung cấp.<br />
          Nếu vòng bảng đã kết thúc mà vẫn chưa hiện, hãy thử bấm nút làm mới (↻) ở góc trên.
        </div>
      )}

      {sortedRounds.map((round) => {
        const matches = [...knockout[round]].sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));
        return (
          <div key={round} style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: C.gold, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              {koViName(round)} <span style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>({matches.length} trận)</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 12 }}>
              {matches.map((m) => {
                const t = toVN(m.fixture.date);
                const done = isDone(m); const live = isLive(m);
                const today = isToday(m.fixture?.date) && !done && !live;
                const soon = isSoon24h(m.fixture?.date) && !done && !live && !today;
                return (
                  <button key={m.fixture.id} onClick={() => onOpenMatch(m)} className={live ? "card live-banner" : "card"} style={{ textAlign: "left", cursor: "pointer", background: C.card, border: `1px solid ${live ? C.accent : today ? "#FF8C42" : soon ? C.gold : C.line}`, borderRadius: 14, padding: 14, color: "inherit" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span className={live ? "blink-text" : (today || soon) ? "blink-text-soft" : ""} style={{ fontSize: 13, fontWeight: (live || today || soon) ? 800 : 600, color: live ? "#FF6B7A" : today ? "#FF8C42" : soon ? C.gold : C.text }}>📅 {t.date} &nbsp;🕒 {t.time}</span>
                      {live ? <span className="pill live-banner" style={{ background: "rgba(230,57,70,.2)", color: "#FF6B7A", display: "inline-flex", alignItems: "center", gap: 5 }}><span className="live-dot" /> ĐANG ĐÁ</span>
                        : done ? <span className="pill" style={{ background: "rgba(34,197,94,.15)", color: C.green }}>ĐÃ ĐÁ</span>
                        : today ? <span className="pill" style={{ background: "rgba(255,140,66,.18)", color: "#FF8C42", display: "inline-flex", alignItems: "center", gap: 5 }}><span className="today-dot" /> HÔM NAY</span>
                        : soon ? <span className="pill" style={{ background: "rgba(255,209,102,.15)", color: C.gold, display: "inline-flex", alignItems: "center", gap: 5 }}><span className="soon-dot" /> SẮP ĐÁ</span>
                        : <span className="pill" style={{ background: "rgba(230,57,70,.15)", color: "#FF6B7A" }}>CHƯA ĐÁ</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ flex: 1, textAlign: "right", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>{m.teams.home.name || "Chưa xác định"} {m.teams.home.logo && <img src={m.teams.home.logo} width={22} height={22} alt="" />}</span>
                      <span style={{ minWidth: 56, textAlign: "center", fontWeight: 800, color: done ? C.gold : live ? "#FF6B7A" : C.dim }}>{done || live ? `${m.goals.home ?? 0}-${m.goals.away ?? 0}` : "vs"}</span>
                      <span style={{ flex: 1, textAlign: "left", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>{m.teams.away.logo && <img src={m.teams.away.logo} width={22} height={22} alt="" />} {m.teams.away.name || "Chưa xác định"}</span>
                    </div>
                    {live && <div style={{ marginTop: 6 }}><LiveMini match={m} compact /></div>}
                    {done && (
                      <div style={{ marginTop: 6, textAlign: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 800, color: C.green }}>
                          ✓ {m.fixture?.status?.short === "PEN" ? "Kết thúc (luân lưu)" : m.fixture?.status?.short === "AET" ? "Kết thúc (hiệp phụ)" : "Trận đấu đã kết thúc"}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <QualifiedTeams />
    </div>
  );
}

// Mục "Đội đã/đang giành vé": lấy bảng xếp hạng 12 bảng, hiện top 2 mỗi bảng + danh sách hạng ba
function QualifiedTeams() {
  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true); setErr("");
    try {
      const r = await fetch(API("standings", { league: WC_LEAGUE_ID, season: SEASON }));
      const j = await r.json();
      if (j.errors && (Array.isArray(j.errors) ? j.errors.length : Object.keys(j.errors).length)) {
        throw new Error(typeof j.errors === "object" ? Object.values(j.errors).join("; ") : String(j.errors));
      }
      // standings: response[0].league.standings là mảng các bảng
      const sd = j.response?.[0]?.league?.standings || [];
      setStandings(sd);
    } catch (e) { setErr("Chưa tải được bảng xếp hạng. " + e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontWeight: 800, fontSize: 18, color: C.green }}>✅ Đội đang giành vé đi tiếp</span>
        {!standings && <button onClick={load} disabled={loading} style={{ background: loading ? C.line : C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", cursor: loading ? "default" : "pointer", fontWeight: 700, fontSize: 13 }}>{loading ? "Đang tải…" : "Xem"}</button>}
      </div>
      {err && <div style={{ fontSize: 13, color: "#FF6B7A" }}>{err}</div>}
      {!standings && !err && <div style={{ fontSize: 13, color: C.sub }}>Bấm "Xem" để tải bảng xếp hạng hiện tại của 12 bảng (top 2 mỗi bảng đi tiếp, cùng 8 đội hạng ba xuất sắc nhất).</div>}
      {standings && (() => {
        // API có thể trả standings dạng lồng (mảng các bảng) HOẶC phẳng. Gom lại theo tên bảng (group)
        // để chắc chắn đủ 12 bảng, không sót đội nào (ví dụ Tây Ban Nha bảng H).
        const allRows = [];
        for (const item of standings) {
          if (Array.isArray(item)) allRows.push(...item);
          else if (item && item.team) allRows.push(item);
        }
        // Gom theo tên bảng
        const byGroup = {};
        for (const row of allRows) {
          const gName = row.group || "Bảng ?";
          (byGroup[gName] ||= []).push(row);
        }
        // Sắp xếp mỗi bảng theo thứ hạng (rank) để top 2 đúng vị trí
        const groupNames = Object.keys(byGroup).sort();
        const groups = groupNames.map(name => {
          const tbl = byGroup[name].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
          return { name, tbl };
        });
        const thirds = []; // gom các đội hạng ba để so sánh
        return (
          <div>
            <div style={{ fontSize: 12, color: C.dim, marginBottom: 12 }}>Top 2 mỗi bảng đi thẳng. 8 đội hạng ba xuất sắc nhất (trong 12 đội hạng ba) cũng đi tiếp.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12, marginBottom: 16 }}>
              {groups.map(({ name, tbl }, gi) => {
                const groupName = name;
                if (tbl[2]) thirds.push({ ...tbl[2], groupName });
                return (
                  <div key={gi} style={{ background: "rgba(255,255,255,.03)", borderRadius: 10, padding: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.accent, marginBottom: 6 }}>{groupName}</div>
                    {tbl.map((row, ri) => (
                      <div key={ri} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "3px 0", color: ri < 2 ? C.green : ri === 2 ? C.gold : C.sub, fontWeight: ri < 2 ? 700 : 500 }}>
                        <span style={{ minWidth: 16 }}>{ri + 1}.</span>
                        {row.team?.logo && <img src={row.team.logo} width={18} height={18} alt="" />}
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.team?.name}</span>
                        <span style={{ fontWeight: 700 }}>{row.points}đ</span>
                        {ri < 2 && <span style={{ fontSize: 10 }}>✅</span>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            {thirds.length > 0 && (
              <div style={{ borderTop: `1px solid #1A2336`, paddingTop: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.gold, marginBottom: 8 }}>Các đội hạng ba (xếp theo điểm, hiệu số) — 8 đội đầu đi tiếp:</div>
                {thirds.sort((a, b) => (b.points - a.points) || (b.goalsDiff - a.goalsDiff)).map((tm, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "4px 0", color: i < 8 ? C.green : C.sub, fontWeight: i < 8 ? 700 : 500 }}>
                    <span style={{ minWidth: 20 }}>{i + 1}.</span>
                    {tm.team?.logo && <img src={tm.team.logo} width={18} height={18} alt="" />}
                    <span style={{ flex: 1 }}>{tm.team?.name} <span style={{ color: C.dim, fontSize: 11 }}>({tm.groupName})</span></span>
                    <span>{tm.points}đ · HS {tm.goalsDiff > 0 ? "+" : ""}{tm.goalsDiff}</span>
                    {i < 8 && <span style={{ fontSize: 10 }}>✅</span>}
                  </div>
                ))}
                <div style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>Lưu ý: thứ hạng còn thay đổi cho tới khi tất cả các bảng đá xong. Đây là ảnh chụp hiện tại, mang tính tham khảo.</div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function Group({ g, fixtures, onOpenMatch }) {
  const sorted = [...fixtures].sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));
  return (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 800, margin: "4px 0 20px" }}><span style={{ color: C.accent }}>Bảng {g}</span></h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sorted.map((m) => {
          const t = toVN(m.fixture.date); const done = isDone(m);
          const live = isLive(m); const today = !done && !live && isToday(m.fixture?.date); const soon = !done && !live && isSoon24h(m.fixture?.date);
          const sc = `${m.goals.home ?? "-"}-${m.goals.away ?? "-"}`;
          return (
            <button key={m.fixture.id} onClick={() => onOpenMatch(m)} className={live ? "card live-banner" : "card"} style={{ textAlign: "left", cursor: "pointer", background: C.card, border: `1px solid ${live ? C.accent : today ? "#FF8C42" : C.line}`, borderRadius: 14, padding: 14, color: "inherit" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span className={live ? "blink-text" : today ? "blink-text-soft" : soon ? "blink-text-soft" : ""} style={{ fontSize: 14, color: live ? "#FF6B7A" : today ? "#FF8C42" : soon ? C.gold : C.text, fontWeight: (live || today || soon) ? 800 : 600 }}>📅 {t.date} &nbsp;🕒 {t.time}</span>
                {live ? (
                  <span className="pill live-banner" style={{ background: "rgba(230,57,70,.2)", color: "#FF6B7A", display: "inline-flex", alignItems: "center", gap: 5 }}><span className="live-dot" /> ĐANG ĐÁ</span>
                ) : done ? (
                  <span className="pill" style={{ background: "rgba(34,197,94,.15)", color: C.green }}>ĐÃ ĐÁ</span>
                ) : today ? (
                  <span className="pill" style={{ background: "rgba(255,140,66,.18)", color: "#FF8C42", display: "inline-flex", alignItems: "center", gap: 5 }}><span className="today-dot" /> HÔM NAY</span>
                ) : soon ? (
                  <span className="pill" style={{ background: "rgba(255,209,102,.15)", color: C.gold, display: "inline-flex", alignItems: "center", gap: 5 }}><span className="soon-dot" /> SẮP ĐÁ</span>
                ) : (
                  <span className="pill" style={{ background: "rgba(230,57,70,.15)", color: "#FF6B7A" }}>CHƯA ĐÁ</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ flex: 1, textAlign: "right", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>{m.teams.home.name} <img src={m.teams.home.logo} width={22} height={22} alt="" /></span>
                <span style={{ minWidth: 56, textAlign: "center", fontWeight: 800, color: done ? C.gold : live ? "#FF6B7A" : C.dim }}>{done || live ? `${m.goals.home ?? 0}-${m.goals.away ?? 0}` : "vs"}</span>
                <span style={{ flex: 1, textAlign: "left", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><img src={m.teams.away.logo} width={22} height={22} alt="" /> {m.teams.away.name}</span>
              </div>
              {live && <div style={{ marginTop: 6 }}><LiveMini match={m} compact /></div>}
              {done && (
                <div style={{ marginTop: 6, textAlign: "center" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 800, color: C.green }}>
                    ✓ {m.fixture?.status?.short === "PEN" ? "Kết thúc (luân lưu)" : m.fixture?.status?.short === "AET" ? "Kết thúc (hiệp phụ)" : "Trận đấu đã kết thúc"}
                  </span>
                </div>
              )}
              <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Phong cách trọng tài: tự tính trung bình thẻ vàng/đỏ mỗi trận từ các trận đã đá của giải.
function RefereeInfo({ referee }) {
  const [data, setData] = useState(null);   // { matches, yellow, red, yPerGame, rPerGame }
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true); setErr("");
    try {
      // 1) Lấy toàn bộ trận của giải, lọc các trận do trọng tài này bắt VÀ đã đá xong
      const rFix = await fetch(API("fixtures", { league: WC_LEAGUE_ID, season: SEASON })).then(x => x.json());
      const all = rFix.response || [];
      const refMatches = all.filter(f =>
        f.fixture?.referee && referee &&
        f.fixture.referee.split(",")[0].trim().toLowerCase() === referee.split(",")[0].trim().toLowerCase() &&
        ["FT", "AET", "PEN"].includes(f.fixture?.status?.short)
      );
      if (refMatches.length === 0) { setData({ matches: 0 }); setLoading(false); return; }
      // 2) Với mỗi trận, gọi events đếm thẻ vàng/đỏ
      let yellow = 0, red = 0;
      const yellowPerMatch = []; // số thẻ vàng từng trận, để tính ít nhất / nhiều nhất
      for (const f of refMatches) {
        const rEv = await fetch(API("fixtures/events", { fixture: f.fixture.id })).then(x => x.json());
        const evs = rEv.response || [];
        let yThis = 0;
        for (const e of evs) {
          if (e.type === "Card") {
            if (e.detail === "Yellow Card") { yellow++; yThis++; }
            else if (e.detail === "Red Card" || e.detail === "Second Yellow card") red++;
          }
        }
        yellowPerMatch.push(yThis);
      }
      const n = refMatches.length;
      setData({
        matches: n, yellow, red,
        yPerGame: +(yellow / n).toFixed(1), rPerGame: +(red / n).toFixed(2),
        yMin: Math.min(...yellowPerMatch), yMax: Math.max(...yellowPerMatch),
      });
    } catch (e) { setErr("Chưa tính được. " + e.message); }
    finally { setLoading(false); }
  };

  if (!referee) return (
    <div style={{ background: "rgba(255,209,102,.08)", border: `1px solid ${C.gold}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: C.gold, marginBottom: 6 }}>🧑‍⚖️ Phong cách trọng tài</div>
      <div style={{ fontSize: 12, color: C.sub }}>Trọng tài của trận này chưa được công bố (thường công bố sát giờ thi đấu). Khi có tên trọng tài, mục này sẽ hiện thống kê thẻ phạt của ông ấy.</div>
    </div>
  );
  // Nhãn phong cách dựa trên thẻ vàng trung bình
  const styleLabel = (y) => y >= 5 ? "rất nghiêm khắc 🔴" : y >= 3.5 ? "nghiêm khắc" : y >= 2 ? "trung bình" : "dễ tính 🟢";

  return (
    <div style={{ background: "rgba(255,209,102,.08)", border: `1px solid ${C.gold}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: C.gold }}>🧑‍⚖️ Phong cách trọng tài</span>
        {!data && <button onClick={load} disabled={loading} style={{ background: loading ? C.line : C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", cursor: loading ? "default" : "pointer", fontWeight: 700, fontSize: 12 }}>{loading ? "Đang tính…" : "Xem"}</button>}
      </div>
      {err && <div style={{ fontSize: 12, color: "#FF6B7A", marginTop: 6 }}>{err}</div>}
      {!data && !err && <div style={{ fontSize: 12, color: C.sub, marginTop: 6 }}>Bấm "Xem" để tính trung bình thẻ phạt của trọng tài {referee.split(",")[0]} ở giải này.</div>}
      {data && data.matches === 0 && <div style={{ fontSize: 13, color: C.sub, marginTop: 6 }}>Chưa có trận nào đã đá của trọng tài này để thống kê.</div>}
      {data && data.matches > 0 && (
        <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, color: "#E7ECF3" }}>
          Trọng tài <b>{referee.split(",")[0]}</b> đã bắt <b>{data.matches}</b> trận ở giải này.<br />
          Trung bình mỗi trận: <b style={{ color: C.gold }}>{data.yPerGame} thẻ vàng</b>{data.red > 0 ? <>, <b style={{ color: "#FF6B7A" }}>{data.rPerGame} thẻ đỏ</b></> : ""}.<br />
          Mỗi trận thường rút <b style={{ color: C.gold }}>ít nhất {data.yMin}</b> đến <b style={{ color: C.gold }}>nhiều nhất {data.yMax}</b> thẻ vàng.<br />
          Phong cách: <b>{styleLabel(data.yPerGame)}</b>.
          <div style={{ fontSize: 11, color: C.dim, marginTop: 6 }}>Tính từ {data.matches} trận, mẫu còn nhỏ nên chỉ mang tính tham khảo.</div>
        </div>
      )}
    </div>
  );
}

function Match({ g, match }) {
  const [stats, setStats] = useState(null);
  const [referee, setReferee] = useState(match.fixture.referee || null);
  const [h2h, setH2h] = useState(null);
  const [formHome, setFormHome] = useState(null);
  const [formAway, setFormAway] = useState(null);
  const [styleHome, setStyleHome] = useState(null);
  const [styleAway, setStyleAway] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  // Dữ liệu trực tiếp khi trận đang đá
  const [live, setLive] = useState(null);        // { status, elapsed, extra, gh, ga }
  const [clockSec, setClockSec] = useState(0);   // số giây tự đếm thêm kể từ mốc phút API trả về
  const clockBase = useRef(null);                // { elapsed, extra, status, at } mốc lần API cập nhật gần nhất
  const [events, setEvents] = useState([]);       // diễn biến: bàn thắng, thẻ
  const [liveStats, setLiveStats] = useState([]); // thống kê hiện tại
  const [liveLoading, setLiveLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [lineups, setLineups] = useState(null);     // đội hình ra sân
  const [lineupLoading, setLineupLoading] = useState(false);
  const [lineupErr, setLineupErr] = useState("");
  const [standing, setStanding] = useState(null); // bảng xếp hạng của bảng chứa 2 đội này
  const done = isDone(match);
  const t = toVN(match.fixture.date);
  const hId = match.teams.home.id, aId = match.teams.away.id;

  // Phong độ: trả về cả thống kê tổng VÀ chi tiết từng trận (đối thủ, tỉ số, kết quả)
  function summarizeForm(fixtures, teamId) {
    let w = 0, d = 0, l = 0, gf = 0, ga = 0;
    const seq = [], recent = [];
    for (const fx of fixtures) {
      const isHome = fx.teams.home.id === teamId;
      const my = isHome ? fx.goals.home : fx.goals.away;
      const op = isHome ? fx.goals.away : fx.goals.home;
      const opp = isHome ? fx.teams.away : fx.teams.home;
      if (my == null || op == null) continue;
      gf += my; ga += op;
      let r;
      if (my > op) { w++; r = "T"; }
      else if (my < op) { l++; r = "B"; }
      else { d++; r = "H"; }
      seq.push(r);
      recent.push({ opp: opp?.name || "—", oppLogo: opp?.logo, my, op, r, date: fx.fixture.date });
    }
    return { w, d, l, gf, ga, seq, recent };
  }

  // Tính lối chơi: lấy thống kê các trận đã đá gần nhất của 1 đội, tính trung bình
  async function computeStyle(teamFixtures, teamId) {
    // quét tối đa 6 trận đã đá gần nhất để gom dữ liệu lối chơi (gồm cả trận trước giải)
    const finished = teamFixtures.filter(fx => ["FT","AET","PEN"].includes(fx.fixture?.status?.short)).slice(0, 6);
    if (finished.length === 0) return null;
    const get = (block, type) => {
      const it = block?.statistics?.find(x => x.type === type);
      if (!it || it.value == null) return null;
      if (typeof it.value === "string" && it.value.includes("%")) return parseFloat(it.value);
      return Number(it.value);
    };
    let nPoss = 0, sumPoss = 0, nSh = 0, sumSh = 0, nSot = 0, sumSot = 0, nCor = 0, sumCor = 0, nYc = 0, sumYc = 0, n = 0;
    for (const fx of finished) {
      try {
        const r = await fetch(API("fixtures/statistics", { fixture: fx.fixture.id }));
        const j = await r.json();
        const block = (j.response || []).find(s => s.team.id === teamId);
        if (!block) continue;
        const poss = get(block, "Ball Possession");
        const sh = get(block, "Total Shots");
        const sot = get(block, "Shots on Goal");
        const cor = get(block, "Corner Kicks");
        const yc = get(block, "Yellow Cards");
        if (poss != null) { sumPoss += poss; nPoss++; }
        if (sh != null) { sumSh += sh; nSh++; }
        if (sot != null) { sumSot += sot; nSot++; }
        if (cor != null) { sumCor += cor; nCor++; }
        if (yc != null) { sumYc += yc; nYc++; }
        n++;
      } catch { /* bỏ qua trận lỗi */ }
    }
    if (n === 0) return null;
    return {
      games: n,
      poss: nPoss ? Math.round(sumPoss / nPoss) : null,
      shots: nSh ? +(sumSh / nSh).toFixed(1) : null,
      sot: nSot ? +(sumSot / nSot).toFixed(1) : null,
      corners: nCor ? +(sumCor / nCor).toFixed(1) : null,
      cards: nYc ? +(sumYc / nYc).toFixed(1) : null,
    };
  }

  // Diễn giải lối chơi thành câu
  function styleText(st, fm, teamName) {
    if (!st) return null;
    const parts = [];
    if (st.poss != null) {
      if (st.poss >= 55) parts.push(`thiên về kiểm soát bóng (cầm bóng trung bình ${st.poss}%)`);
      else if (st.poss <= 45) parts.push(`thường nhường bóng, chơi phòng ngự phản công (cầm bóng ${st.poss}%)`);
      else parts.push(`cân bằng trong kiểm soát bóng (${st.poss}%)`);
    }
    if (st.shots != null) {
      if (st.shots >= 14) parts.push(`dứt điểm nhiều (TB ${st.shots} cú sút/trận)`);
      else if (st.shots <= 8) parts.push(`ít dứt điểm (TB ${st.shots} cú sút/trận)`);
      else parts.push(`mức dứt điểm vừa phải (${st.shots} sút/trận)`);
    }
    if (st.sot != null) parts.push(`trong đó ~${st.sot} sút trúng đích`);
    if (st.corners != null) {
      if (st.corners >= 6) parts.push(`tạo nhiều phạt góc (TB ${st.corners}/trận), cho thấy hay tấn công biên`);
      else if (st.corners <= 3) parts.push(`ít phạt góc (TB ${st.corners}/trận)`);
      else parts.push(`phạt góc trung bình ${st.corners}/trận`);
    }
    if (st.cards != null) {
      if (st.cards >= 2.5) parts.push(`lối đá rát, hay bị thẻ vàng (TB ${st.cards} thẻ/trận) — cần thận trọng nguy cơ thẻ phạt`);
      else if (st.cards <= 1) parts.push(`chơi kỷ luật, ít bị thẻ (TB ${st.cards} thẻ vàng/trận)`);
      else parts.push(`mức độ phạm lỗi trung bình (${st.cards} thẻ vàng/trận)`);
    }
    // tấn công/phòng ngự dựa trên bàn thắng/thua từ form
    if (fm) {
      if (fm.gf >= fm.l + fm.w && fm.gf >= 12) parts.push(`hàng công mạnh`);
      if (fm.ga <= 6) parts.push(`hàng thủ chắc chắn`);
    }
    return `${teamName} ${parts.join(", ")}.`;
  }

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      // Luôn gọi chi tiết trận để lấy trọng tài mới nhất (danh sách fixtures hay để referee = null)
      fetch(API("fixtures", { id: match.fixture.id }))
        .then(x => x.json())
        .then(j => { const ref = j.response?.[0]?.fixture?.referee; if (ref) setReferee(ref); })
        .catch(() => {});

      // Tải bảng xếp hạng để biết bối cảnh: đội nào đã/sắp bị loại, đã qua vòng... (nền, không chặn)
      fetch(API("standings", { league: WC_LEAGUE_ID, season: SEASON }))
        .then(x => x.json())
        .then(j => {
          const allTables = j.response?.[0]?.league?.standings || [];
          // Tìm bảng chứa cả 2 đội của trận này
          const tbl = allTables.find(t => Array.isArray(t) && t.some(r => r.team?.id === hId) && t.some(r => r.team?.id === aId));
          if (tbl) setStanding(tbl);
        })
        .catch(() => {});

      if (done) {
        const r = await fetch(API("fixtures/statistics", { fixture: match.fixture.id }));
        const j = await r.json(); setStats(j.response || []);
        // Tải thêm phong độ + đối đầu để chấm xem dự đoán của app đúng hay sai.
        // Quan trọng: loại bỏ CHÍNH trận này khỏi dữ liệu, để dự đoán "như thể chưa biết kết quả".
        try {
          const [rh2h, rH, rA] = await Promise.all([
            fetch(API("fixtures/headtohead", { h2h: `${hId}-${aId}`, last: 12 })).then(x => x.json()),
            fetch(API("fixtures", { team: hId, last: 12 })).then(x => x.json()),
            fetch(API("fixtures", { team: aId, last: 12 })).then(x => x.json()),
          ]);
          const exclude = (arr) => (arr || []).filter(fx => fx.fixture?.id !== match.fixture.id);
          setH2h(exclude(rh2h.response));
          setFormHome(summarizeForm(exclude(rH.response), hId));
          setFormAway(summarizeForm(exclude(rA.response), aId));
        } catch { /* nếu lỗi thì bỏ qua phần chấm điểm */ }
      } else {
        const [rh2h, rH, rA] = await Promise.all([
          fetch(API("fixtures/headtohead", { h2h: `${hId}-${aId}`, last: 10 })).then(x => x.json()),
          fetch(API("fixtures", { team: hId, last: 10 })).then(x => x.json()),
          fetch(API("fixtures", { team: aId, last: 10 })).then(x => x.json()),
        ]);
        setH2h(rh2h.response || []);
        const fHome = summarizeForm(rH.response || [], hId);
        const fAway = summarizeForm(rA.response || [], aId);
        setFormHome(fHome);
        setFormAway(fAway);
        // Tính lối chơi (nền, không chặn giao diện)
        computeStyle(rH.response || [], hId).then(s => setStyleHome(s)).catch(() => {});
        computeStyle(rA.response || [], aId).then(s => setStyleAway(s)).catch(() => {});
      }
    } catch (e) { setErr("Không tải được chi tiết. " + e.message); } finally { setLoading(false); }
  }, [done, match.fixture.id, hId, aId]);
  useEffect(() => { load(); }, [load]);

  // Tải dữ liệu TRỰC TIẾP: tỉ số hiện tại, phút thi đấu, diễn biến, thống kê live
  const loadLive = useCallback(async () => {
    setLiveLoading(true);
    try {
      const t = Date.now(); // tham số phá cache: mỗi lần gọi một giá trị khác nhau => luôn lấy số mới nhất
      // Gọi "live=all" của giải: API trả về fixture KÈM events đầy đủ nhất (bàn thắng, thẻ...).
      // Đồng thời gọi events riêng + thống kê để dự phòng và bổ sung.
      const [rLive, rEv, rSt] = await Promise.all([
        fetch(API("fixtures", { league: WC_LEAGUE_ID, season: SEASON, live: "all", _t: t })).then(x => x.json()),
        fetch(API("fixtures/events", { fixture: match.fixture.id, _t: t })).then(x => x.json()),
        fetch(API("fixtures/statistics", { fixture: match.fixture.id, _t: t })).then(x => x.json()),
      ]);
      // Tìm đúng trận này trong danh sách các trận đang đá
      const fx = (rLive.response || []).find(f => f.fixture?.id === match.fixture.id);
      if (fx) {
        const st = fx.fixture?.status?.short;
        const el = fx.fixture?.status?.elapsed;
        const ex = fx.fixture?.status?.extra;
        setLive({ status: st, elapsed: el, extra: ex, gh: fx.goals?.home, ga: fx.goals?.away });
        // Đặt lại mốc đồng hồ để tự đếm tiếp từ phút API vừa trả về
        if (el != null && ["1H", "2H", "ET"].includes(st)) {
          clockBase.current = { elapsed: el, extra: ex || 0, status: st, at: Date.now() };
          setClockSec(0);
        } else {
          clockBase.current = null; // nghỉ giữa hiệp/kết thúc thì không chạy đồng hồ
        }
        if (fx.fixture?.referee) setReferee(fx.fixture.referee);
      }
      // Diễn biến: ưu tiên endpoint events RIÊNG (chắc chắn đầy đủ nhất);
      // nếu vì lý do nào đó rỗng thì mới lấy từ trong fixture của live=all.
      const evFromEndpoint = rEv.response || [];
      const evFromFixture = fx?.events || [];
      setEvents(evFromEndpoint.length > 0 ? evFromEndpoint : evFromFixture);
      setLiveStats(rSt.response || []);
      setLastUpdate(new Date());
    } catch { /* bỏ qua lỗi tạm thời, lần làm mới sau sẽ thử lại */ }
    finally { setLiveLoading(false); }
  }, [match.fixture.id]);

  // Tải danh sách cầu thủ ra sân (đội hình).
  const loadLineups = useCallback(async () => {
    setLineupLoading(true); setLineupErr("");
    try {
      const r = await fetch(API("fixtures/lineups", { fixture: match.fixture.id }));
      const j = await r.json();
      if (j.errors && (Array.isArray(j.errors) ? j.errors.length : Object.keys(j.errors).length)) {
        throw new Error(typeof j.errors === "object" ? Object.values(j.errors).join("; ") : String(j.errors));
      }
      setLineups(j.response || []);
    } catch (e) {
      setLineupErr("Chưa tải được đội hình. " + e.message);
    } finally { setLineupLoading(false); }
  }, [match.fixture.id]);

  // Tự động tải đội hình khi trận đang đá / đã đá / sắp đá trong ~3 giờ tới.
  // Trận còn xa thì không tải vì API chưa có dữ liệu. Đặt SAU khi loadLineups đã khai báo.
  useEffect(() => {
    const ms = new Date(match.fixture.date).getTime() - Date.now();
    const soonOrLive = isLive(match) || done || (ms <= 3 * 3600 * 1000 && ms > -4 * 3600 * 1000);
    if (soonOrLive && !lineups && !lineupLoading) loadLineups();
  }, [match, done, lineups, lineupLoading, loadLineups]);

  // Khi trận đang đá: tải ngay + tự động làm mới mỗi 20 giây. Ngừng khi rời trang hoặc trận kết thúc.
  useEffect(() => {
    if (!isLive(match)) return;
    loadLive();
    const timer = setInterval(loadLive, 20000);
    return () => clearInterval(timer);
  }, [match, loadLive]);

  // Đồng hồ tự chạy: mỗi giây tăng bộ đếm để hiển thị nhích lên (giây là ước lượng giữa 2 lần API cập nhật)
  useEffect(() => {
    if (!isLive(match)) return;
    const tick = setInterval(() => {
      if (clockBase.current) setClockSec(Math.floor((Date.now() - clockBase.current.at) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [match]);

  // Tính phút:giây hiển thị trên đồng hồ, tự cộng dồn từ mốc API + số giây tự đếm
  function liveClock() {
    const b = clockBase.current;
    if (!b) return null;
    const totalSec = (b.elapsed * 60) + clockSec; // phút API * 60 + giây tự đếm
    let mm = Math.floor(totalSec / 60);
    const ss = totalSec % 60;
    // Bù giờ: nếu vượt mốc 45' (hiệp 1) hoặc 90' (hiệp 2) thì hiển thị dạng 45+x / 90+x
    let base = null;
    if (b.status === "1H" && mm >= 45) base = 45;
    else if (b.status === "2H" && mm >= 90) base = 90;
    else if (b.status === "ET" && mm >= 120) base = 120;
    if (base != null) return { main: base, extra: mm - base, ss, isExtra: true };
    return { main: mm, extra: 0, ss, isExtra: false };
  }

  // Tỉ số hiện tại (ưu tiên dữ liệu live mới nhất, nếu chưa có thì lấy từ match ban đầu)
  const liveStatLabel = { "1H": "Hiệp 1", "HT": "Nghỉ giữa hiệp", "2H": "Hiệp 2", "ET": "Hiệp phụ", "BT": "Nghỉ hiệp phụ", "P": "Đá luân lưu", "LIVE": "Đang đá", "INT": "Tạm dừng", "SUSP": "Tạm hoãn" };


  const stat = (teamId, type) => {
    const block = stats?.find((s) => s.team.id === teamId);
    const item = block?.statistics?.find((x) => x.type === type);
    return item ? (item.value ?? "—") : "—";
  };

  function h2hSummary() {
    if (!h2h) return null;
    let hw = 0, aw = 0, dr = 0, gdSum = 0; // gdSum = tổng hiệu số bàn (dương = nghiêng đội nhà hId)
    for (const fx of h2h) {
      if (fx.goals.home == null) continue;
      const homeWin = fx.goals.home > fx.goals.away;
      const draw = fx.goals.home === fx.goals.away;
      const winnerIsHomeTeam = fx.teams.home.id === hId ? homeWin : !homeWin && !draw;
      // Hiệu số bàn xét theo góc nhìn đội hId
      const myG = fx.teams.home.id === hId ? fx.goals.home : fx.goals.away;
      const opG = fx.teams.home.id === hId ? fx.goals.away : fx.goals.home;
      gdSum += (myG - opG);
      if (draw) dr++;
      else if (winnerIsHomeTeam) hw++;
      else aw++;
    }
    return { hw, aw, dr, total: hw + aw + dr, gdSum };
  }

  // điểm phong độ (thắng 3, hòa 1)
  const pts = (fm) => fm ? fm.w * 3 + fm.d : 0;

  // Suy đoán nguy cơ một đội XOAY TUA đội hình dự bị (đã chắc suất hoặc đã hết cơ hội ở lượt cuối)
  function rotationInfo() {
    if (!standing || standing.length === 0) return { hRotate: false, aRotate: false, note: null };
    const rowH = standing.find(r => r.team?.id === hId);
    const rowA = standing.find(r => r.team?.id === aId);
    if (!rowH || !rowA) return { hRotate: false, aRotate: false, note: null };
    // "Có thể xoay tua" khi: đã đá >=2 trận VÀ (đã rất chắc suất: >=6đ và đứng nhất/nhì) HOẶC (gần như hết cơ hội)
    const judge = (row) => {
      const played = row.all?.played ?? 0;
      const pts = row.points ?? 0;
      const rank = row.rank ?? 9;
      if (played < 2) return false;
      const lockedIn = pts >= 6 && rank <= 2;        // gần chắc đi tiếp
      const eliminated = pts === 0 && played >= 2;    // gần như hết cơ hội
      return lockedIn || eliminated;
    };
    const hRotate = judge(rowH), aRotate = judge(rowA);
    let note = null;
    if (hRotate && aRotate) note = `Cả hai đội đều có thể đã an bài về thứ hạng và có khả năng tung đội hình dự bị để giữ sức — kết quả thực tế có thể khác xa dự đoán.`;
    else if (hRotate) note = `${match.teams.home.name} nhiều khả năng đã yên tâm về thứ hạng, có thể xoay tua đội hình ở trận này — dự đoán dưới đây có thể không phản ánh đúng sức mạnh thực tế trên sân.`;
    else if (aRotate) note = `${match.teams.away.name} nhiều khả năng đã yên tâm về thứ hạng, có thể xoay tua đội hình ở trận này — dự đoán dưới đây có thể không phản ánh đúng sức mạnh thực tế trên sân.`;
    return { hRotate, aRotate, note };
  }

  function verdict() {
    const fh = formHome, fa = formAway, hs = h2hSummary();
    if (!fh && !fa) return null;
    const ph = pts(fh), pa = pts(fa);
    const diff = ph - pa;

    // Dự đoán tỉ số từ dữ liệu thật: trung bình bàn ghi/thủng của mỗi đội trong các trận gần nhất
    const gamesH = fh ? (fh.w + fh.d + fh.l) : 0;
    const gamesA = fa ? (fa.w + fa.d + fa.l) : 0;
    // Trung bình bàn ghi/thủng mỗi trận của từng đội (đặt mặc định 1.3 nếu thiếu dữ liệu)
    const hAtk = gamesH ? fh.gf / gamesH : 1.3;
    const hDef = gamesH ? fh.ga / gamesH : 1.3;
    const aAtk = gamesA ? fa.gf / gamesA : 1.3;
    const aDef = gamesA ? fa.ga / gamesA : 1.3;
    // Mức ghi bàn trung bình chung của giải, dùng làm "mốc" để so sánh sức mạnh
    const LEAGUE_AVG = 1.35;
    // Chỉ số tấn công / phòng ngự so với mặt bằng chung (1 = trung bình, >1 mạnh hơn, <1 yếu hơn)
    const hAtkR = hAtk / LEAGUE_AVG, hDefR = hDef / LEAGUE_AVG;
    const aAtkR = aAtk / LEAGUE_AVG, aDefR = aDef / LEAGUE_AVG;
    // Bàn kỳ vọng = (sức công đội này) × (độ hở hàng thủ đối thủ) × mốc giải
    // Hàng công mạnh gặp hàng thủ yếu => số nở ra; mạnh gặp thủ chắc => số co lại.
    let expH = hAtkR * aDefR * LEAGUE_AVG;
    let expA = aAtkR * hDefR * LEAGUE_AVG;
    // Lợi thế sân/tinh thần dựa trên chênh lệch phong độ (rõ rệt hơn trước)
    expH += diff * 0.10;
    expA -= diff * 0.10;
    // Đối đầu trực tiếp: vừa tính SỐ TRẬN thắng, vừa tính MỨC THẮNG ĐẬM (hiệu số bàn) trong lịch sử
    if (hs && hs.total) {
      expH += (hs.hw - hs.aw) * 0.10;
      expA += (hs.aw - hs.hw) * 0.10;
      // Trung bình hiệu số bàn trong các lần gặp nhau: thắng càng đậm thì cộng càng nhiều (giới hạn để không quá đà)
      const avgGd = hs.gdSum / hs.total;
      expH += Math.max(-1.2, Math.min(1.2, avgGd * 0.30));
      expA -= Math.max(-1.2, Math.min(1.2, avgGd * 0.30));
    }
    expH = Math.max(0, expH);
    expA = Math.max(0, expA);
    // Làm tròn nhưng giữ được tỉ số cách biệt: dùng làm tròn có ngưỡng .4 để dễ ra 0,2,3,4 bàn
    const smartRound = (x) => {
      const base = Math.floor(x);
      const frac = x - base;
      return frac >= 0.45 ? base + 1 : base; // .45 thay vì .5 => dễ lên bàn hơn, đa dạng hơn
    };
    let gH = Math.max(0, smartRound(expH));
    let gA = Math.max(0, smartRound(expA));
    // Chỉ phá thế hòa khi một đội nhỉnh hơn HẲN về phong độ (chênh >= 6 điểm, tức ~2 trận thắng)
    if (gH === gA && Math.abs(diff) >= 6) { if (diff > 0) gH++; else gA++; }
    // "Điểm vượt trội tổng hợp": gộp công, thủ, phong độ, đối đầu để đo mức chênh lệch đẳng cấp
    const domH = (hAtkR + hDefR) + diff * 0.10 + (hs && hs.total ? (hs.hw - hs.aw) * 0.3 + (hs.gdSum / hs.total) * 0.3 : 0);
    const domA = (aAtkR + aDefR) - diff * 0.10 + (hs && hs.total ? (hs.aw - hs.hw) * 0.3 - (hs.gdSum / hs.total) * 0.3 : 0);
    const domGap = domH - domA;
    // Chỉ nới cách biệt khi một đội vượt trội RÕ RỆT (ngưỡng cao hơn để giữ được các trận hòa cân sức)
    if (Math.abs(domGap) >= 1.8 && Math.abs(gH - gA) <= 1) {
      if (domGap > 0) gH = Math.max(gH, gA + 2);
      else gA = Math.max(gA, gH + 2);
    }
    // Đội vượt trội cực mạnh (chênh rất lớn) => đảm bảo cách biệt tối thiểu 3 bàn
    if (Math.abs(domGap) >= 2.8) {
      if (domGap > 0 && gH - gA < 3) gH = gA + 3;
      else if (domGap < 0 && gA - gH < 3) gA = gH + 3;
    }
    const scoreline = `${gH}-${gA}`;

    let pick;
    if (gH > gA) pick = `${match.teams.home.name} được đánh giá nhỉnh hơn`;
    else if (gA > gH) pick = `${match.teams.away.name} được đánh giá nhỉnh hơn`;
    else pick = "Cân bằng, nhiều khả năng hòa";

    // Tỉ lệ thắng dựa trên mức vượt trội tổng hợp (đã gồm công, thủ, phong độ, đối đầu)
    let hWin = 38 + diff * 3 + domGap * 7;
    let aWin = 38 - diff * 3 - domGap * 7;
    if (hs && hs.total) { hWin += (hs.hw - hs.aw) * 2; aWin += (hs.aw - hs.hw) * 2; }
    // Nếu nghi đội mạnh hơn xoay tua đội hình dự bị: kéo % về gần nhau hơn (tăng bất ngờ/hòa)
    const rot = rotationInfo();
    if (rot.hRotate && !rot.aRotate) { hWin -= 12; aWin += 6; }       // đội nhà có thể xoay tua
    else if (rot.aRotate && !rot.hRotate) { aWin -= 12; hWin += 6; }  // đội khách có thể xoay tua
    hWin = Math.max(8, Math.min(85, hWin)); aWin = Math.max(8, Math.min(85, aWin));
    let drawP = Math.max(8, 100 - hWin - aWin);
    if (rot.hRotate || rot.aRotate) drawP += 6; // cả hai trường hợp đều tăng nhẹ khả năng hòa/bất ngờ
    const sum = hWin + aWin + drawP;
    const pHome = Math.round(hWin / sum * 100), pDraw = Math.round(drawP / sum * 100), pAway = Math.round(aWin / sum * 100);

    const H = match.teams.home.name, A = match.teams.away.name;

    // GIẢI THÍCH CĂN CỨ: vì sao ra tỉ số và % này
    const reasons = [];
    // 1) Trung bình bàn thắng/thua
    reasons.push(`Trung bình mỗi trận: ${H} ghi ${hAtk.toFixed(1)} bàn, thủng ${hDef.toFixed(1)} bàn; ${A} ghi ${aAtk.toFixed(1)} bàn, thủng ${aDef.toFixed(1)} bàn.`);
    // 2) Hàng công gặp hàng thủ
    if (hAtk > aDef + 0.3) reasons.push(`Hàng công ${H} (${hAtk.toFixed(1)}) mạnh hơn mức thủng lưới của ${A} (${aDef.toFixed(1)}), nên ${H} có lợi thế ghi bàn.`);
    else if (aAtk > hDef + 0.3) reasons.push(`Hàng công ${A} (${aAtk.toFixed(1)}) mạnh hơn mức thủng lưới của ${H} (${hDef.toFixed(1)}), nên ${A} có lợi thế ghi bàn.`);
    else reasons.push(`Sức công của hai đội tương đương khả năng phòng ngự của đối thủ, nên tỉ số dự đoán không chênh lệch nhiều.`);
    // 3) Phong độ
    if (Math.abs(diff) >= 4) reasons.push(`${diff > 0 ? H : A} có phong độ tốt hơn hẳn trong 10 trận gần đây (chênh ${Math.abs(diff)} điểm), được cộng thêm lợi thế.`);
    else if (Math.abs(diff) >= 1) reasons.push(`${diff > 0 ? H : A} nhỉnh hơn đôi chút về phong độ gần đây.`);
    else reasons.push(`Phong độ hai đội khá cân bằng.`);
    // 4) Đối đầu
    if (hs && hs.total) {
      if (hs.hw > hs.aw) reasons.push(`Lịch sử đối đầu: ${H} thắng ${hs.hw}, ${A} thắng ${hs.aw}, hòa ${hs.dr} — nghiêng về ${H}.`);
      else if (hs.aw > hs.hw) reasons.push(`Lịch sử đối đầu: ${A} thắng ${hs.aw}, ${H} thắng ${hs.hw}, hòa ${hs.dr} — nghiêng về ${A}.`);
      else reasons.push(`Lịch sử đối đầu khá cân bằng (${hs.hw}-${hs.dr}-${hs.aw}).`);
    }

    // LỜI KHUYÊN / KẾT LUẬN
    const fav = pHome > pAway ? H : pAway > pHome ? A : null;
    const favPct = Math.max(pHome, pAway);
    let advice;
    if (!fav || Math.abs(pHome - pAway) < 8) {
      advice = `Đây là trận cân tài cân sức, rất khó đoán. Khả năng hòa hoặc một đội thắng sít sao đều cao — người xem nên theo dõi cả trận.`;
    } else if (favPct >= 55) {
      advice = `${fav} được đánh giá cao hơn rõ rệt (${favPct}% thắng) và nhiều khả năng giành trọn 3 điểm. Tuy nhiên bóng đá luôn có bất ngờ.`;
    } else {
      advice = `${fav} nhỉnh hơn (${favPct}% thắng) nhưng không áp đảo. Đối thủ vẫn hoàn toàn có cơ hội tạo bất ngờ nếu tận dụng tốt cơ hội.`;
    }

    return { pick, scoreline, diff, pHome, pDraw, pAway, reasons, advice };
  }

  // Chấm điểm: so dự đoán của app với kết quả THẬT của trận đã đá
  function review() {
    if (!done || (!formHome && !formAway)) return null;
    const v = verdict();
    if (!v) return null;
    const realH = match.goals?.home, realA = match.goals?.away;
    if (realH == null || realA == null) return null;
    // Kết quả thật: ai thắng?
    const realOutcome = realH > realA ? "home" : realA > realH ? "away" : "draw";
    // Dự đoán của app (từ tỉ số dự đoán)
    const [pgH, pgA] = v.scoreline.split("-").map(Number);
    const predOutcome = pgH > pgA ? "home" : pgA > pgH ? "away" : "draw";
    const outcomeOk = realOutcome === predOutcome;       // đoán đúng đội thắng/hòa
    const exactOk = pgH === realH && pgA === realA;        // đoán đúng cả tỉ số
    const H = match.teams.home.name, A = match.teams.away.name;
    const realLabel = realOutcome === "home" ? `${H} thắng` : realOutcome === "away" ? `${A} thắng` : "Hòa";
    return { outcomeOk, exactOk, predScore: v.scoreline, realScore: `${realH}-${realA}`, realLabel, predPick: v.pick };
  }

  // Phân tích BỐI CẢNH bảng đấu: đội nào đã bị loại, đã/sắp qua vòng, còn cần gì
  function contextAnalysis() {
    if (!standing || standing.length === 0) return null;
    const rowH = standing.find(r => r.team?.id === hId);
    const rowA = standing.find(r => r.team?.id === aId);
    if (!rowH || !rowA) return null;
    const totalGroupMatches = 3; // mỗi đội đá 3 trận vòng bảng
    const lines = [];

    // Phân tích cho từng đội
    for (const [row, name] of [[rowH, match.teams.home.name], [rowA, match.teams.away.name]]) {
      const played = row.all?.played ?? 0;
      const pts = row.points ?? 0;
      const rank = row.rank ?? 0;
      const remaining = totalGroupMatches - played;
      const maxPossible = pts + remaining * 3; // điểm tối đa có thể đạt được

      let status;
      if (played >= totalGroupMatches) {
        // Đã đá hết vòng bảng
        if (rank <= 2) status = `đã kết thúc vòng bảng ở vị trí thứ ${rank} (${pts} điểm) — gần như chắc suất đi tiếp.`;
        else if (rank === 3) status = `xếp thứ 3 bảng (${pts} điểm) — cơ hội đi tiếp phụ thuộc so sánh với các đội hạng ba bảng khác.`;
        else status = `xếp cuối bảng (${pts} điểm) — gần như đã bị loại.`;
      } else {
        // Còn trận chưa đá
        if (pts === 0 && played >= 2 && maxPossible < 3) status = `mới có ${pts} điểm sau ${played} trận, cơ hội đi tiếp rất mong manh.`;
        else if (pts >= 6) status = `đang có ${pts} điểm sau ${played} trận, rất sáng cửa đi tiếp — có thể đá thoải mái.`;
        else if (pts === 0 && played >= 2) status = `chưa có điểm nào sau ${played} trận, buộc phải thắng trận này để nuôi hy vọng.`;
        else status = `đang có ${pts} điểm sau ${played} trận (xếp thứ ${rank}), vẫn còn cơ hội nhưng cần kết quả tốt.`;
      }
      lines.push(`${name} ${status}`);
    }

    // Động lực trận đấu
    const hPlayed = rowH.all?.played ?? 0, aPlayed = rowA.all?.played ?? 0;
    const hPts = rowH.points ?? 0, aPts = rowA.points ?? 0;
    let motivation = "";
    if (hPlayed >= 3 && aPlayed >= 3) {
      motivation = "Cả hai đội đã đá xong vòng bảng — đây là dữ liệu để theo dõi, không còn ảnh hưởng tới việc đi tiếp.";
    } else {
      const hNeed = hPts < 6 && hPlayed < 3;
      const aNeed = aPts < 6 && aPlayed < 3;
      if (hNeed && aNeed) motivation = "Cả hai đội đều cần điểm để đi tiếp, nên đây hứa hẹn là trận cầu căng thẳng, đôi công.";
      else if (hNeed) motivation = `${match.teams.home.name} cần điểm hơn nên nhiều khả năng sẽ chủ động tấn công.`;
      else if (aNeed) motivation = `${match.teams.away.name} cần điểm hơn nên nhiều khả năng sẽ chủ động tấn công.`;
      else motivation = "Cả hai đội đều đã tương đối ổn định về thứ hạng.";
    }

    return { lines, motivation };
  }

  // Nhận định chữ dài, có lý lẽ
  function analysisText() {
    const fh = formHome, fa = formAway;
    if (!fh && !fa) return null;
    const H = match.teams.home.name, A = match.teams.away.name;
    const parts = [];
    if (fh) {
      const tone = fh.w >= 6 ? "đang có phong độ rất tốt" : fh.w >= 4 ? "có phong độ khá ổn định" : fh.l >= 5 ? "đang sa sút" : "phong độ thất thường";
      parts.push(`${H} ${tone} với ${fh.w} thắng, ${fh.d} hòa, ${fh.l} thua trong 10 trận gần đây, ghi ${fh.gf} bàn và để thủng lưới ${fh.ga} bàn.`);
    }
    if (fa) {
      const tone = fa.w >= 6 ? "đang chơi bùng nổ" : fa.w >= 4 ? "thi đấu tương đối tốt" : fa.l >= 5 ? "gặp nhiều khó khăn" : "có phong độ chưa ổn định";
      parts.push(`${A} ${tone} với ${fa.w} thắng, ${fa.d} hòa, ${fa.l} thua, hiệu số ghi/thủng lưới ${fa.gf}/${fa.ga}.`);
    }
    if (fh && fa) {
      const atkH = fh.gf, atkA = fa.gf, defH = fh.ga, defA = fa.ga;
      if (atkH > atkA) parts.push(`Về hàng công, ${H} ghi bàn hiệu quả hơn.`);
      else if (atkA > atkH) parts.push(`Về hàng công, ${A} sắc bén hơn.`);
      if (defH < defA) parts.push(`Hàng thủ ${H} chắc chắn hơn.`);
      else if (defA < defH) parts.push(`Hàng thủ ${A} an toàn hơn.`);
    }
    return parts.join(" ");
  }

  const seqColor = (c) => c === "T" ? C.green : c === "B" ? "#FF6B7A" : C.gold;
  const v = !done ? verdict() : null;
  const rev = done ? review() : null;

  return (
    <div style={{ zoom: 1.25 }}>
      <div style={{ background: "linear-gradient(135deg,#15203A,#101727)", border: `1px solid ${isLive(match) ? C.accent : C.line2}`, borderRadius: 16, padding: "20px 16px", marginBottom: 16 }}>
        <div style={{ textAlign: "center", fontSize: 14, color: C.text, fontWeight: 600, marginBottom: 8 }}>Bảng {g} · {t.date}/2026 · {t.time} (giờ VN)</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <Side team={match.teams.home} />
          <div style={{ fontSize: 30, fontWeight: 900, color: done ? C.gold : isLive(match) ? "#FF6B7A" : C.dim, minWidth: 70, textAlign: "center" }}>
            {done ? `${match.goals.home}-${match.goals.away}`
              : isLive(match) ? `${live?.gh ?? match.goals.home ?? 0}-${live?.ga ?? match.goals.away ?? 0}`
              : "—"}
          </div>
          <Side team={match.teams.away} />
        </div>
        {done && (
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(34,197,94,.15)", border: `1px solid ${C.green}`, borderRadius: 999, padding: "4px 16px", fontWeight: 800, fontSize: 13, color: C.green }}>
              ✓ {match.fixture?.status?.short === "PEN" ? "KẾT THÚC (luân lưu)" : match.fixture?.status?.short === "AET" ? "KẾT THÚC (hiệp phụ)" : "ĐÃ KẾT THÚC"}
            </span>
          </div>
        )}
        {isLive(match) && (
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <span className="live-banner" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(230,57,70,.18)", border: `1px solid ${C.accent}`, borderRadius: 999, padding: "4px 14px" }}>
              <span className="live-dot" />
              <span style={{ fontWeight: 800, fontSize: 13, color: "#FF6B7A" }}>
                {liveStatLabel[live?.status] || "ĐANG ĐÁ"}
              </span>
            </span>
            {/* Đồng hồ số: tự chạy phút:giây, hiện bù giờ khi vượt mốc 45/90 */}
            {live?.elapsed != null && (() => {
              const lc = liveClock();
              const ss2 = lc ? String(lc.ss).padStart(2, "0") : "00";
              return (
                <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
                  <div style={{ display: "inline-flex", alignItems: "baseline", gap: 3, background: "#0A0E18", border: `2px solid ${C.accent}`, borderRadius: 12, padding: "8px 18px", boxShadow: "0 0 16px rgba(230,57,70,.35)" }}>
                    {live.status === "HT" ? (
                      <span style={{ fontFamily: "'Courier New',monospace", fontWeight: 900, fontSize: 22, color: C.gold, lineHeight: 1 }}>NGHỈ</span>
                    ) : lc ? (
                      <>
                        <span style={{ fontFamily: "'Courier New',monospace", fontWeight: 900, fontSize: 34, color: "#FF6B7A", lineHeight: 1, letterSpacing: 1 }}>{String(lc.main).padStart(2, "0")}</span>
                        {lc.isExtra && lc.extra > 0 && <span style={{ fontFamily: "'Courier New',monospace", fontWeight: 900, fontSize: 22, color: C.gold, lineHeight: 1 }}>+{lc.extra}</span>}
                        <span style={{ fontFamily: "'Courier New',monospace", fontWeight: 900, fontSize: 20, color: C.sub, lineHeight: 1 }}>:{ss2}</span>
                      </>
                    ) : (
                      <span style={{ fontFamily: "'Courier New',monospace", fontWeight: 900, fontSize: 34, color: "#FF6B7A", lineHeight: 1 }}>{String(live.elapsed).padStart(2, "0")}'</span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
        <div style={{ textAlign: "center", fontSize: 13, color: C.sub, marginTop: 4 }}></div>
        {referee
          ? <div style={{ textAlign: "center", fontSize: 12, color: C.gold, marginTop: 6 }}>🧑‍⚖️ Trọng tài: {referee}</div>
          : !done && <div style={{ textAlign: "center", fontSize: 12, color: C.dim, marginTop: 6 }}>🧑‍⚖️ Trọng tài: chưa công bố</div>}
      </div>

      <div style={{ marginBottom: 16 }}>
        {lineupLoading && !lineups && (
          <div style={{ fontSize: 13, color: C.sub, textAlign: "center", padding: 12 }}>Đang tải đội hình ra sân…</div>
        )}
        {lineupErr && <div style={{ fontSize: 13, color: "#FF6B7A", marginTop: 8, textAlign: "center" }}>{lineupErr}</div>}
        {lineups && lineups.length === 0 && (
          <div style={{ fontSize: 13, color: C.sub, textAlign: "center", padding: 12, background: C.card, borderRadius: 12, border: `1px solid ${C.line}` }}>
            Đội hình ra sân thường được công bố khoảng 1 giờ trước trận. Vui lòng quay lại gần giờ thi đấu.
          </div>
        )}
        {lineups && lineups.length > 0 && (
          <div>
            <div style={{ fontWeight: 800, marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}>👥 Đội hình ra sân</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {lineups.map((lu) => (
              <div key={lu.team.id} style={{ background: C.card, border: `1px solid ${C.line2}`, borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  {lu.team.logo && <img src={lu.team.logo} alt="" style={{ width: 22, height: 22 }} />}
                  <span style={{ fontWeight: 800, fontSize: 14 }}>{lu.team.name}</span>
                </div>
                {lu.formation && <div style={{ fontSize: 12, color: C.gold, marginBottom: 8 }}>Sơ đồ: {lu.formation}</div>}
                <div style={{ fontSize: 12, color: C.sub, fontWeight: 700, marginBottom: 4 }}>Đội hình chính</div>
                {(lu.startXI || []).map((p) => (
                  <div key={p.player.id} style={{ fontSize: 13, color: C.text, padding: "2px 0", display: "flex", gap: 6 }}>
                    <span style={{ color: C.gold, minWidth: 22, fontWeight: 700 }}>{p.player.number ?? "—"}</span>
                    <span>{p.player.name}</span>
                  </div>
                ))}
                {lu.substitutes && lu.substitutes.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, color: C.sub, fontWeight: 700, margin: "8px 0 4px" }}>Dự bị</div>
                    {lu.substitutes.map((p) => (
                      <div key={p.player.id} style={{ fontSize: 12, color: C.dim, padding: "1px 0", display: "flex", gap: 6 }}>
                        <span style={{ minWidth: 22 }}>{p.player.number ?? "—"}</span>
                        <span>{p.player.name}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
          </div>
        )}
      </div>

      {isLive(match) && (
        <div style={{ background: C.card, border: `1px solid ${C.accent}`, borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontWeight: 800, color: "#FF6B7A", display: "flex", alignItems: "center", gap: 7 }}>
              <span className="live-dot" /> Diễn biến trực tiếp
            </span>
            <button onClick={loadLive} disabled={liveLoading} style={{ background: liveLoading ? C.line : C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", cursor: liveLoading ? "default" : "pointer", fontWeight: 700, fontSize: 13 }}>
              {liveLoading ? "Đang cập nhật…" : "↻ Cập nhật ngay"}
            </button>
          </div>

          {lastUpdate && (
            <div style={{ fontSize: 11, color: C.dim, marginBottom: 12 }}>
              Tự động làm mới mỗi 20 giây · Cập nhật lúc {toVN(lastUpdate.toISOString()).time}
            </div>
          )}

          {/* Tỉ số trực tiếp ngay trong khung tổng hợp, khỏi kéo lên đầu trang */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, background: "rgba(230,57,70,.10)", border: `1px solid ${C.line2}`, borderRadius: 12, padding: "10px 14px", marginBottom: 14 }}>
            <span style={{ flex: 1, textAlign: "right", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
              {match.teams.home.name} <img src={match.teams.home.logo} width={22} height={22} alt="" />
            </span>
            <span style={{ fontWeight: 900, fontSize: 26, color: "#FF6B7A", minWidth: 60, textAlign: "center" }}>
              {(live?.gh ?? match.goals.home ?? 0)} - {(live?.ga ?? match.goals.away ?? 0)}
            </span>
            <span style={{ flex: 1, textAlign: "left", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <img src={match.teams.away.logo} width={22} height={22} alt="" /> {match.teams.away.name}
            </span>
          </div>
          {live?.elapsed != null && (
            <div style={{ textAlign: "center", fontSize: 12, color: C.gold, fontWeight: 700, marginTop: -6, marginBottom: 14 }}>
              ⏱ {liveStatLabel[live?.status] || "Đang đá"} · phút {live.elapsed}'
            </div>
          )}

          {/* Diễn biến: bàn thắng, thẻ, VAR, thay người theo thứ tự thời gian */}
          {(() => {
            const shown = events.filter(e => ["Goal", "Card", "Var", "subst"].includes(e.type));
            return shown.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 36px 1fr", gap: 8, paddingBottom: 6, borderBottom: `1px solid ${C.line2}`, marginBottom: 4 }}>
                <span style={{ textAlign: "right", fontWeight: 800, fontSize: 12, color: C.sub }}>{match.teams.home.name}</span>
                <span></span>
                <span style={{ textAlign: "left", fontWeight: 800, fontSize: 12, color: C.sub }}>{match.teams.away.name}</span>
              </div>
              {shown.map((e, i) => {
                const isHomeTeam = e.team?.id === hId;
                let icon = "•", label = e.detail || e.type;
                if (e.type === "Goal") { icon = "⚽"; label = e.detail === "Own Goal" ? "Phản lưới nhà" : e.detail === "Penalty" ? "Ghi bàn (phạt đền)" : "Ghi bàn"; }
                else if (e.type === "Card") { icon = e.detail === "Red Card" ? "🟥" : "🟨"; label = e.detail === "Red Card" ? "Thẻ đỏ" : "Thẻ vàng"; }
                else if (e.type === "Var") { icon = "📺"; label = (e.detail || "").includes("Disallowed") ? "Bàn thắng bị từ chối (VAR)" : "VAR: " + (e.detail || ""); }
                else if (e.type === "subst") { icon = "🔄"; label = "Thay người"; }
                const content = (
                  <span style={{ fontSize: 13, lineHeight: 1.4 }}>
                    {icon} <b>{e.player?.name || "—"}</b> <span style={{ color: C.sub }}>({label})</span>
                  </span>
                );
                const minute = <span style={{ color: C.gold, fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{e.time?.elapsed}'</span>;
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 36px 1fr", alignItems: "center", gap: 8, padding: "3px 0", borderBottom: i < shown.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none" }}>
                    {/* Cột trái = đội nhà */}
                    <span style={{ textAlign: "right", color: isHomeTeam ? C.text : "transparent" }}>{isHomeTeam ? content : null}</span>
                    {/* Cột giữa = phút */}
                    <span style={{ textAlign: "center" }}>{minute}</span>
                    {/* Cột phải = đội khách */}
                    <span style={{ textAlign: "left", color: !isHomeTeam ? C.text : "transparent" }}>{!isHomeTeam ? content : null}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: C.dim, marginBottom: 14 }}>Chưa có diễn biến nào (bàn thắng/thẻ).</div>
          );
          })()}

          {/* Thống kê trực tiếp */}
          {liveStats.length >= 1 ? (
            <div style={{ borderTop: `1px solid #1A2336`, paddingTop: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: C.sub }}>Thống kê hiện tại</div>
              {[["Kiểm soát bóng", "Ball Possession"], ["Tổng số sút", "Total Shots"], ["Sút trúng đích", "Shots on Goal"], ["Phạt góc", "Corner Kicks"]].map(([lb, ty]) => {
                const gv = (tid) => { const b = liveStats.find(s => s.team.id === tid); const it = b?.statistics?.find(x => x.type === ty); return it?.value ?? "—"; };
                return (
                  <div key={ty} style={{ display: "grid", gridTemplateColumns: "44px 1fr 44px", alignItems: "center", padding: "5px 0", fontSize: 13 }}>
                    <span style={{ textAlign: "center", fontWeight: 800 }}>{gv(hId)}</span>
                    <span style={{ textAlign: "center", color: C.sub, fontSize: 12 }}>{lb}</span>
                    <span style={{ textAlign: "center", fontWeight: 800 }}>{gv(aId)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ borderTop: `1px solid #1A2336`, paddingTop: 12, fontSize: 13, color: C.dim }}>
              Đang chờ số liệu thống kê từ nhà cung cấp (thường cập nhật sau khoảng 10-15 phút đầu trận).
            </div>
          )}
        </div>
      )}

      {err && <div style={{ color: "#FF6B7A", fontSize: 13 }}>{err} <button onClick={load} style={{ marginLeft: 8, color: C.accent, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Thử lại</button></div>}

      {done && !loading && stats && (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 12 }}>Thống kê trận đấu</div>
          {[["Sút trúng đích","Shots on Goal"],["Phạt góc","Corner Kicks"],["Thẻ vàng","Yellow Cards"],["Thẻ đỏ","Red Cards"],["Kiểm soát bóng","Ball Possession"]].map(([label,type]) => (
            <div key={type} style={{ display: "grid", gridTemplateColumns: "50px 1fr 50px", alignItems: "center", padding: "7px 0", borderBottom: `1px solid #1A2336` }}>
              <span style={{ textAlign: "center", fontWeight: 800 }}>{stat(match.teams.home.id, type)}</span>
              <span style={{ textAlign: "center", fontSize: 12, color: "#9FB0C9" }}>{label}</span>
              <span style={{ textAlign: "center", fontWeight: 800 }}>{stat(match.teams.away.id, type)}</span>
            </div>
          ))}
          {stats.length === 0 && <div style={{ color: C.sub, fontSize: 13 }}>Chưa có số liệu thống kê cho trận này.</div>}
        </div>
      )}

      {done && !loading && rev && (
        <div style={{ background: rev.outcomeOk ? "rgba(34,197,94,.10)" : "rgba(230,57,70,.10)", border: `1px solid ${rev.outcomeOk ? C.green : C.accent}`, borderRadius: 14, padding: 16, marginTop: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 10, color: rev.outcomeOk ? C.green : "#FF6B7A" }}>
            {rev.exactOk ? "🎯 App dự đoán CHÍNH XÁC tỉ số!" : rev.outcomeOk ? "✅ App dự đoán đúng kết quả" : "❌ App dự đoán chưa chính xác"}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "#D5DEEC" }}>
            App dự đoán: <b style={{ color: C.gold }}>{rev.predScore}</b> ({rev.predPick}).<br />
            Kết quả thật: <b style={{ color: C.gold }}>{rev.realScore}</b> ({rev.realLabel}).<br />
            {rev.exactOk
              ? "App đoán đúng cả tỉ số chính xác — quá tài!"
              : rev.outcomeOk
              ? "App đoán đúng đội thắng/hòa, nhưng tỉ số cụ thể có chênh lệch."
              : "App đoán sai lần này. Kết quả bóng đá luôn có bất ngờ, dự đoán chỉ mang tính tham khảo."}
          </div>
        </div>
      )}

      {!done && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* So sánh trực quan */}
          {formHome && formAway && v && (
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16 }}>
              <div style={{ fontWeight: 800, marginBottom: 12 }}>📊 So sánh hai đội</div>
              <CompareBar label="Số trận thắng (trong 10)" h={formHome.w} a={formAway.w} hName={match.teams.home.name} aName={match.teams.away.name} />
              <CompareBar label="Bàn thắng ghi được" h={formHome.gf} a={formAway.gf} hName={match.teams.home.name} aName={match.teams.away.name} />
              <CompareBar label="Bàn thua (ít hơn = tốt)" h={formHome.ga} a={formAway.ga} hName={match.teams.home.name} aName={match.teams.away.name} invert />
              {(() => {
                const H = match.teams.home.name, A = match.teams.away.name;
                const lines = [];
                lines.push(`Trong 10 trận gần nhất, ${H} thắng ${formHome.w}, hòa ${formHome.d}, thua ${formHome.l}; ${A} thắng ${formAway.w}, hòa ${formAway.d}, thua ${formAway.l}.`);
                if (formHome.w > formAway.w) lines.push(`Xét số trận thắng, ${H} có phong độ tốt hơn.`);
                else if (formAway.w > formHome.w) lines.push(`Xét số trận thắng, ${A} có phong độ tốt hơn.`);
                else lines.push(`Hai đội có số trận thắng ngang nhau.`);
                if (formHome.gf > formAway.gf) lines.push(`Về hàng công, ${H} ghi bàn nhiều hơn (${formHome.gf} so với ${formAway.gf} bàn).`);
                else if (formAway.gf > formHome.gf) lines.push(`Về hàng công, ${A} ghi bàn nhiều hơn (${formAway.gf} so với ${formHome.gf} bàn).`);
                else lines.push(`Về hàng công, hai đội ghi bàn ngang nhau (${formHome.gf} bàn).`);
                if (formHome.ga < formAway.ga) lines.push(`Về hàng thủ, ${H} chắc chắn hơn (chỉ thủng ${formHome.ga} so với ${formAway.ga} bàn).`);
                else if (formAway.ga < formHome.ga) lines.push(`Về hàng thủ, ${A} chắc chắn hơn (chỉ thủng ${formAway.ga} so với ${formHome.ga} bàn).`);
                else lines.push(`Về hàng thủ, hai đội thủng lưới ngang nhau (${formHome.ga} bàn).`);
                return (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid #1A2336`, fontSize: 14, lineHeight: 1.8, color: "#D5DEEC" }}>
                    {lines.map((t2, k) => <div key={k}>• {t2}</div>)}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Phong độ + 5 trận gần nhất chi tiết */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[[match.teams.home, formHome], [match.teams.away, formAway]].map(([team, fm], i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, marginBottom: 8 }}>
                  <img src={team.logo} width={22} height={22} alt="" /> {team.name}
                </div>
                {fm ? (
                  <>
                    <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                      {fm.seq.length ? fm.seq.map((c, k) => (
                        <span key={k} style={{ width: 22, height: 22, borderRadius: 6, background: seqColor(c), color: "#0B1120", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{c}</span>
                      )) : <span style={{ color: C.sub, fontSize: 13 }}>Chưa có dữ liệu</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "#9FB0C9", marginBottom: 8 }}>
                      <b style={{ color: C.green }}>{fm.w}T</b> <b style={{ color: C.gold }}>{fm.d}H</b> <b style={{ color: "#FF6B7A" }}>{fm.l}B</b> · Ghi/thủng: {fm.gf}/{fm.ga}
                    </div>
                    {fm.recent.length > 0 && (
                      <div style={{ borderTop: `1px solid #1A2336`, paddingTop: 8 }}>
                        <div style={{ fontSize: 11, color: C.dim, marginBottom: 5 }}>Các trận gần nhất:</div>
                        {fm.recent.map((m2, k) => (
                          <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "3px 0" }}>
                            <span style={{ width: 16, height: 16, borderRadius: 4, background: seqColor(m2.r), color: "#0B1120", fontWeight: 800, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{m2.r}</span>
                            <span style={{ color: C.sub, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>vs {m2.opp}</span>
                            <span style={{ fontWeight: 700 }}>{m2.my}-{m2.op}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : <span style={{ color: C.sub, fontSize: 13 }}>Đang tải…</span>}
              </div>
            ))}
          </div>

          {/* Lịch sử đối đầu */}
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>⚔️ Lịch sử đối đầu</div>
            {h2h && h2h.length > 0 ? (
              <>
                {(() => { const hs = h2hSummary(); return hs ? (
                  <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center", marginBottom: 12, fontSize: 13 }}>
                    <div><div style={{ fontWeight: 800, fontSize: 18, color: C.green }}>{hs.hw}</div><div style={{ color: C.sub }}>{match.teams.home.name} thắng</div></div>
                    <div><div style={{ fontWeight: 800, fontSize: 18, color: C.gold }}>{hs.dr}</div><div style={{ color: C.sub }}>Hòa</div></div>
                    <div><div style={{ fontWeight: 800, fontSize: 18, color: "#FF6B7A" }}>{hs.aw}</div><div style={{ color: C.sub }}>{match.teams.away.name} thắng</div></div>
                  </div>
                ) : null; })()}
                {h2h.slice(0, 5).map((fx) => {
                  const dd = toVN(fx.fixture.date);
                  return (
                    <div key={fx.fixture.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid #1A2336`, fontSize: 13 }}>
                      <span style={{ color: C.sub, minWidth: 90 }}>{dd.date}/{new Date(fx.fixture.date).getUTCFullYear()}</span>
                      <span style={{ flex: 1, textAlign: "right" }}>{fx.teams.home.name}</span>
                      <span style={{ fontWeight: 800, color: C.gold, minWidth: 50, textAlign: "center" }}>{fx.goals.home}-{fx.goals.away}</span>
                      <span style={{ flex: 1, textAlign: "left" }}>{fx.teams.away.name}</span>
                    </div>
                  );
                })}
              </>
            ) : (() => {
              const mh = manualH2H(match.teams.home.name, match.teams.away.name);
              if (mh) {
                // tính tổng từ dữ liệu nhập sẵn
                let hw = 0, aw = 0, dr = 0;
                for (const m2 of mh.matches) {
                  const hIsHome = m2.home === match.teams.home.name;
                  const myG = hIsHome ? m2.hg : m2.ag;
                  const opG = hIsHome ? m2.ag : m2.hg;
                  if (myG === opG) dr++;
                  else if (myG > opG) hw++;
                  else aw++;
                }
                return (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center", marginBottom: 12, fontSize: 13 }}>
                      <div><div style={{ fontWeight: 800, fontSize: 18, color: C.green }}>{hw}</div><div style={{ color: C.sub }}>{match.teams.home.name} thắng</div></div>
                      <div><div style={{ fontWeight: 800, fontSize: 18, color: C.gold }}>{dr}</div><div style={{ color: C.sub }}>Hòa</div></div>
                      <div><div style={{ fontWeight: 800, fontSize: 18, color: "#FF6B7A" }}>{aw}</div><div style={{ color: C.sub }}>{match.teams.away.name} thắng</div></div>
                    </div>
                    {mh.matches.map((m2, k) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid #1A2336`, fontSize: 13 }}>
                        <span style={{ color: C.sub, minWidth: 120 }}>{m2.comp}</span>
                        <span style={{ flex: 1, textAlign: "right" }}>{m2.home}</span>
                        <span style={{ fontWeight: 800, color: C.gold, minWidth: 50, textAlign: "center" }}>{m2.hg}-{m2.ag}</span>
                        <span style={{ flex: 1, textAlign: "left" }}>{m2.away}</span>
                      </div>
                    ))}
                    {mh.note && <div style={{ fontSize: 12, color: C.dim, marginTop: 8 }}>{mh.note}</div>}
                  </>
                );
              }
              return <span style={{ color: C.sub, fontSize: 13 }}>Chưa có dữ liệu đối đầu gần đây giữa hai đội trong hệ thống. Tham khảo phong độ và so sánh ở trên để đánh giá.</span>;
            })()}
          </div>

          {/* Phân tích lối chơi */}
          {(styleHome || styleAway) && (
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16 }}>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>🎯 Phân tích lối chơi</div>
              {styleText(styleHome, formHome, match.teams.home.name) && (
                <div style={{ fontSize: 14, lineHeight: 1.8, color: "#D5DEEC", marginBottom: 10 }}>• {styleText(styleHome, formHome, match.teams.home.name)}</div>
              )}
              {styleText(styleAway, formAway, match.teams.away.name) && (
                <div style={{ fontSize: 14, lineHeight: 1.8, color: "#D5DEEC" }}>• {styleText(styleAway, formAway, match.teams.away.name)}</div>
              )}
              <div style={{ fontSize: 11, color: C.dim, marginTop: 10 }}>Tính từ trung bình các trận đã đá gần nhất. Đầu giải ít trận nên số liệu có thể chưa đầy đủ.</div>
            </div>
          )}

          {/* Nhận định chữ dài + dự đoán */}
          {v && (
            <div style={{ background: "linear-gradient(135deg,#1A2440,#13192B)", border: `1px solid ${C.line2}`, borderRadius: 14, padding: 16 }}>
              <div style={{ fontWeight: 800, marginBottom: 10, color: C.gold }}>✨ Nhận định & dự đoán</div>

              {(() => {
                const note = getDeepNote(match.teams.home.name, match.teams.away.name);
                return note ? (
                  <div style={{ background: "rgba(255,209,102,.08)", border: `1px solid ${C.gold}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: C.gold, marginBottom: 10 }}>⭐ {note.title}</div>
                    {note.blocks.map((b, i) => (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#E7ECF3", marginBottom: 3 }}>{b.h}</div>
                        <div style={{ fontSize: 14, lineHeight: 1.7, color: "#D5DEEC" }}>{b.t}</div>
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}

              {(() => {
                const ctx = contextAnalysis();
                return ctx ? (
                  <div style={{ background: "rgba(96,165,250,.10)", border: "1px solid #60A5FA", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#60A5FA", marginBottom: 8 }}>🎯 Bối cảnh bảng đấu</div>
                    {ctx.lines.map((ln, i) => (
                      <div key={i} style={{ fontSize: 13, lineHeight: 1.7, color: "#D5DEEC", marginBottom: 5, display: "flex", gap: 6 }}>
                        <span style={{ color: "#60A5FA" }}>•</span><span>{ln}</span>
                      </div>
                    ))}
                    <div style={{ fontSize: 13, lineHeight: 1.7, color: "#E7ECF3", marginTop: 8, fontStyle: "italic" }}>{ctx.motivation}</div>
                    <div style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>Lưu ý: việc đi tiếp của đội hạng ba còn phụ thuộc kết quả các bảng khác.</div>
                  </div>
                ) : null;
              })()}

              {analysisText() && <div style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 12, color: "#D5DEEC" }}>{analysisText()}</div>}

              {(() => {
                const rot = rotationInfo();
                return rot.note ? (
                  <div style={{ background: "rgba(255,140,66,.12)", border: "1px solid #FF8C42", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#FF8C42", marginBottom: 6 }}>🔄 Lưu ý xoay tua đội hình</div>
                    <div style={{ fontSize: 13, lineHeight: 1.7, color: "#E7ECF3" }}>{rot.note}</div>
                  </div>
                ) : null;
              })()}
              <div style={{ fontSize: 14, marginBottom: 12 }}>Đánh giá chung: <b>{v.pick}</b>. Dự đoán tỉ số: <b style={{ color: C.gold }}>{v.scoreline}</b>.</div>
              <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center", marginBottom: 14 }}>
                <Pred label={match.teams.home.name} value={v.pHome + "%"} />
                <Pred label="Hòa" value={v.pDraw + "%"} />
                <Pred label={match.teams.away.name} value={v.pAway + "%"} />
              </div>

              {v.reasons && v.reasons.length > 0 && (
                <div style={{ background: "rgba(255,255,255,.04)", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.gold, marginBottom: 8 }}>📌 Vì sao có dự đoán này?</div>
                  {v.reasons.map((rs, i) => (
                    <div key={i} style={{ fontSize: 13, lineHeight: 1.7, color: "#D5DEEC", marginBottom: 5, display: "flex", gap: 6 }}>
                      <span style={{ color: C.gold }}>•</span><span>{rs}</span>
                    </div>
                  ))}
                </div>
              )}

              {v.advice && (
                <div style={{ background: "rgba(255,209,102,.10)", border: `1px solid ${C.gold}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.gold, marginBottom: 6 }}>💡 Lời khuyên</div>
                  <div style={{ fontSize: 14, lineHeight: 1.7, color: "#E7ECF3" }}>{v.advice}</div>
                </div>
              )}

              {/* Dự đoán phạt góc — tính từ trung bình phạt góc/trận thật của 2 đội */}
              {(styleHome?.corners != null || styleAway?.corners != null) && (() => {
                const cH = styleHome?.corners ?? 5;   // mặc định 5 nếu thiếu dữ liệu 1 đội
                const cA = styleAway?.corners ?? 5;
                // Khi 2 đội gặp nhau, hàng thủ kìm hãm nhau nên tổng phạt góc thường THẤP hơn
                // tổng trung bình đơn thuần. Dùng hệ số 0.85 và chặn trong khoảng thực tế (6–14).
                let totalCorners = Math.round((cH + cA) * 0.85);
                totalCorners = Math.max(6, Math.min(14, totalCorners));
                // Khoảng 2 số liền nhau quanh giá trị trung bình (vd 10 => 10–11)
                const low = totalCorners, high = totalCorners + 1;
                return (
                  <div style={{ background: "rgba(74,222,128,.08)", border: `1px solid ${C.green}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.green, marginBottom: 6 }}>🚩 Dự đoán phạt góc</div>
                    <div style={{ fontSize: 14, lineHeight: 1.7, color: "#E7ECF3" }}>
                      Tổng phạt góc dự kiến cả trận: <b style={{ color: C.gold }}>khoảng {low}–{high} quả</b> (trung bình ~{totalCorners}).
                      {styleHome?.corners != null && <><br />{match.teams.home.name}: ~{cH.toFixed(1)} quả/trận.</>}
                      {styleAway?.corners != null && <><br />{match.teams.away.name}: ~{cA.toFixed(1)} quả/trận.</>}
                    </div>
                  </div>
                );
              })()}

              <RefereeInfo referee={referee} />

              <div style={{ fontSize: 11, color: C.dim, marginTop: 4, textAlign: "center" }}>Nhận định tự động dựa trên dữ liệu phong độ thật từ API-Football, mang tính tham khảo.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CompareBar({ label, h, a, hName, aName, invert }) {
  const total = h + a;
  let hPct = total > 0 ? (h / total) * 100 : 50;
  let aPct = 100 - hPct;
  // đội "tốt hơn" tô đậm; nếu invert (bàn thua) thì ít hơn là tốt
  const hBetter = invert ? h < a : h > a;
  const aBetter = invert ? a < h : a > h;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <b style={{ color: hBetter ? C.green : C.sub }}>{h}</b>
        <span style={{ color: C.dim }}>{label}</span>
        <b style={{ color: aBetter ? C.green : C.sub }}>{a}</b>
      </div>
      <div style={{ display: "flex", height: 8, borderRadius: 6, overflow: "hidden", background: "#0B1120" }}>
        <div style={{ width: hPct + "%", background: hBetter ? C.green : C.line2 }} />
        <div style={{ width: aPct + "%", background: aBetter ? C.accent : C.line2 }} />
      </div>
    </div>
  );
}

function Side({ team }) {
  return <div style={{ flex: 1, textAlign: "center" }}><img src={team.logo} width={44} height={44} alt="" style={{ objectFit: "contain" }} /><div style={{ fontWeight: 700, marginTop: 4, fontSize: 14 }}>{team.name}</div></div>;
}
function Pred({ label, value }) { return <div><div style={{ fontSize: 11, color: C.sub, marginBottom: 4 }}>{label}</div><div style={{ fontWeight: 800, fontSize: 16, color: C.gold }}>{value || "—"}</div></div>; }
function FormBox({ t }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, marginBottom: 8 }}><img src={t.logo} width={20} height={20} alt="" /> {t.name}</div>
      <div style={{ fontSize: 13, color: "#9FB0C9" }}>Phong độ gần đây: <b style={{ color: C.text }}>{t.last_5?.form || "—"}</b></div>
      <div style={{ fontSize: 13, color: "#9FB0C9", marginTop: 4 }}>Ghi/thủng lưới (10 trận): {t.last_5?.goals?.for?.total ?? "—"} / {t.last_5?.goals?.against?.total ?? "—"}</div>
    </div>
  );
}
