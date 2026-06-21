import React, { useState, useEffect, useCallback } from "react";

/* WORLD CUP 2026 — Lịch & phân tích (giờ Việt Nam) — Người viết app: Phạm Anh Khoa
   Nguồn: API-Football (league=1, season=2026) qua hàm trung gian /api/football */

const WC_LEAGUE_ID = 1;
const SEASON = 2026;
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
  const [groups, setGroups] = useState(null);
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
      for (const f of fixtures) {
        // Chỉ lấy vòng bảng (Group Stage); bỏ qua knock-out
        const round = (f.league?.round || "").toLowerCase();
        if (!round.includes("group")) continue;
        const g = groupOfTeam(f.teams?.home?.name) || groupOfTeam(f.teams?.away?.name);
        if (!g) continue;
        (map[g] ||= []).push(f);
      }
      setGroups(map);
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

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`*{box-sizing:border-box}.card{transition:transform .15s,border-color .15s}.card:hover{transform:translateY(-2px);border-color:${C.accent}!important}@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite;display:inline-block}.pill{font-size:11px;font-weight:700;letter-spacing:.4px;padding:3px 9px;border-radius:999px}button{font-family:inherit}@keyframes blink{0%,100%{opacity:1}50%{opacity:.35}}@keyframes liveGlow{0%,100%{box-shadow:0 0 0 0 rgba(230,57,70,.6)}50%{box-shadow:0 0 14px 3px rgba(230,57,70,.85)}}.live-banner{animation:liveGlow 1.3s ease-in-out infinite}.live-dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#FF3B3B;animation:blink 1s ease-in-out infinite}.soon-dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#FFD166;animation:blink 1.4s ease-in-out infinite}.blink-text{animation:blink 1s ease-in-out infinite}.blink-text-soft{animation:blink 1.4s ease-in-out infinite}@media(prefers-reduced-motion:reduce){.card{transition:none}.spin{animation:none}.live-banner{animation:none}.live-dot{animation:none}.soon-dot{animation:none}.blink-text{animation:none}.blink-text-soft{animation:none}}`}</style>

      <header style={{ borderBottom: `1px solid ${C.line}`, padding: "16px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, background: "rgba(11,17,32,.92)", backdropFilter: "blur(8px)", zIndex: 10 }}>
        {view.name !== "groups" && (
          <button onClick={() => setView(view.name === "match" ? { name: "group", g: view.g } : { name: "groups" })} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 48, lineHeight: 1, padding: "4px 12px", minWidth: 56, minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
        )}
        <span style={{ fontSize: 28 }}>🏆</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 20 }}>WORLD CUP 2026</div>
          <div style={{ fontSize: 15, color: C.text }}>Lịch & phân tích · giờ Việt Nam (UTC+7)</div>
          <div style={{ fontSize: 14, color: C.gold, fontWeight: 700 }}>Người viết app: Phạm Anh Khoa</div>
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
            {view.name === "groups" && <Groups groups={groups} onOpen={(g) => setView({ name: "group", g })} />}
            {view.name === "group" && <Group g={view.g} fixtures={groups[view.g] || []} onOpenMatch={(m) => setView({ name: "match", g: view.g, match: m })} />}
            {view.name === "match" && <Match g={view.g} match={view.match} />}
          </>
        )}
      </main>

      <footer style={{ textAlign: "center", padding: "24px 16px", color: C.sub, fontSize: 12, borderTop: `1px solid ${C.line}`, marginTop: 24 }}>
        Dữ liệu: API-Football · cập nhật trực tuyến mỗi khi mở.
        <div style={{ marginTop: 8, color: C.gold, fontWeight: 800, fontSize: 15 }}>Người viết app: Phạm Anh Khoa</div>
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

function Groups({ groups, onOpen }) {
  const ids = Object.keys(groups).sort();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 18 }}>
      {ids.map((id) => {
        const teams = teamsOf(groups[id]);
        const done = groups[id].filter(isDone).length;
        // Các trận của bảng này diễn ra hôm nay (theo giờ VN), chưa đá xong, sắp theo giờ
        const todayMatches = groups[id]
          .filter((m) => isToday(m.fixture?.date) && !isDone(m))
          .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));
        // Các trận sắp đá trong 24h tới (không tính hôm nay)
        const soonMatches = groups[id]
          .filter((m) => isSoon24h(m.fixture?.date) && !isDone(m))
          .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));
        return (
          <button key={id} onClick={() => onOpen(id)} className="card" style={{ textAlign: "left", cursor: "pointer", background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18, color: "inherit" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: C.accent }}>Bảng {id}</span>
              <span className="pill" style={{ background: C.line, color: "#9FB0C9" }}>{done}/{groups[id].length} đã đá</span>
            </div>
            {todayMatches.length > 0 && (
              <div className="live-banner" style={{ background: "rgba(230,57,70,.14)", border: `1px solid ${C.accent}`, borderRadius: 10, padding: "8px 10px", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: todayMatches.length ? 6 : 0 }}>
                  <span className="live-dot" />
                  <span style={{ fontWeight: 800, fontSize: 13, color: "#FF6B7A", letterSpacing: ".5px" }}>ĐÁ HÔM NAY</span>
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
          </button>
        );
      })}
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
            <button key={m.fixture.id} onClick={() => onOpenMatch(m)} className="card" style={{ textAlign: "left", cursor: "pointer", background: C.card, border: `1px solid ${live ? C.accent : today ? C.accent : C.line}`, borderRadius: 14, padding: 14, color: "inherit" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span className={(live || today) ? "blink-text" : soon ? "blink-text-soft" : ""} style={{ fontSize: 14, color: (live || today) ? "#FF6B7A" : soon ? C.gold : C.text, fontWeight: (live || today || soon) ? 800 : 600 }}>📅 {t.date} &nbsp;🕒 {t.time}</span>
                {live ? (
                  <span className="pill" style={{ background: "rgba(230,57,70,.2)", color: "#FF6B7A", display: "inline-flex", alignItems: "center", gap: 5 }}><span className="live-dot" /> ĐANG ĐÁ</span>
                ) : done ? (
                  <span className="pill" style={{ background: "rgba(34,197,94,.15)", color: C.green }}>ĐÃ ĐÁ</span>
                ) : today ? (
                  <span className="pill" style={{ background: "rgba(230,57,70,.15)", color: "#FF6B7A", display: "inline-flex", alignItems: "center", gap: 5 }}><span className="live-dot" /> HÔM NAY</span>
                ) : soon ? (
                  <span className="pill" style={{ background: "rgba(255,209,102,.15)", color: C.gold, display: "inline-flex", alignItems: "center", gap: 5 }}><span className="soon-dot" /> SẮP ĐÁ</span>
                ) : (
                  <span className="pill" style={{ background: "rgba(230,57,70,.15)", color: "#FF6B7A" }}>CHƯA ĐÁ</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ flex: 1, textAlign: "right", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>{m.teams.home.name} <img src={m.teams.home.logo} width={22} height={22} alt="" /></span>
                <span style={{ minWidth: 56, textAlign: "center", fontWeight: 800, color: done ? C.gold : C.dim }}>{done ? sc : "vs"}</span>
                <span style={{ flex: 1, textAlign: "left", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><img src={m.teams.away.logo} width={22} height={22} alt="" /> {m.teams.away.name}</span>
              </div>
              <div style={{ fontSize: 13, color: C.sub, marginTop: 8 }}>📍 {m.fixture.venue?.name || "—"}{m.fixture.venue?.city ? `, ${m.fixture.venue.city}` : ""}</div>
            </button>
          );
        })}
      </div>
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
  const [live, setLive] = useState(null);        // { status, elapsed, gh, ga }
  const [events, setEvents] = useState([]);       // diễn biến: bàn thắng, thẻ
  const [liveStats, setLiveStats] = useState([]); // thống kê hiện tại
  const [liveLoading, setLiveLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [lineups, setLineups] = useState(null);     // đội hình ra sân
  const [lineupLoading, setLineupLoading] = useState(false);
  const [lineupErr, setLineupErr] = useState("");
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
    let nPoss = 0, sumPoss = 0, nSh = 0, sumSh = 0, nSot = 0, sumSot = 0, nCor = 0, sumCor = 0, n = 0;
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
        if (poss != null) { sumPoss += poss; nPoss++; }
        if (sh != null) { sumSh += sh; nSh++; }
        if (sot != null) { sumSot += sot; nSot++; }
        if (cor != null) { sumCor += cor; nCor++; }
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
      const [rFix, rEv, rSt] = await Promise.all([
        fetch(API("fixtures", { id: match.fixture.id })).then(x => x.json()),
        fetch(API("fixtures/events", { fixture: match.fixture.id })).then(x => x.json()),
        fetch(API("fixtures/statistics", { fixture: match.fixture.id })).then(x => x.json()),
      ]);
      const fx = rFix.response?.[0];
      if (fx) {
        setLive({
          status: fx.fixture?.status?.short,
          elapsed: fx.fixture?.status?.elapsed,
          gh: fx.goals?.home,
          ga: fx.goals?.away,
        });
        if (fx.fixture?.referee) setReferee(fx.fixture.referee);
      }
      setEvents(rEv.response || []);
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

  // Khi trận đang đá: tải ngay + tự động làm mới mỗi 45 giây. Ngừng khi rời trang hoặc trận kết thúc.
  useEffect(() => {
    if (!isLive(match)) return;
    loadLive();
    const timer = setInterval(loadLive, 30000);
    return () => clearInterval(timer);
  }, [match, loadLive]);

  // Tỉ số hiện tại (ưu tiên dữ liệu live mới nhất, nếu chưa có thì lấy từ match ban đầu)
  const liveStatLabel = { "1H": "Hiệp 1", "HT": "Nghỉ giữa hiệp", "2H": "Hiệp 2", "ET": "Hiệp phụ", "BT": "Nghỉ hiệp phụ", "P": "Luân lưu", "LIVE": "Đang đá", "INT": "Tạm dừng" };


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
    // Nếu ra hòa nhưng một đội nhỉnh hơn rõ về phong độ thì cộng 1 bàn cho đội đó
    if (gH === gA && Math.abs(diff) >= 3) { if (diff > 0) gH++; else gA++; }
    // "Điểm vượt trội tổng hợp": gộp công, thủ, phong độ, đối đầu để đo mức chênh lệch đẳng cấp
    const domH = (hAtkR + hDefR) + diff * 0.10 + (hs && hs.total ? (hs.hw - hs.aw) * 0.3 + (hs.gdSum / hs.total) * 0.3 : 0);
    const domA = (aAtkR + aDefR) - diff * 0.10 + (hs && hs.total ? (hs.aw - hs.hw) * 0.3 - (hs.gdSum / hs.total) * 0.3 : 0);
    const domGap = domH - domA;
    // Nếu một đội vượt trội rõ rệt mà tỉ số dự đoán vẫn sát, nới cách biệt cho đúng thực tế
    if (Math.abs(domGap) >= 1.0 && Math.abs(gH - gA) <= 1) {
      if (domGap > 0) gH = Math.max(gH, gA + 2);
      else gA = Math.max(gA, gH + 2);
    }
    // Đội vượt trội cực mạnh (chênh rất lớn) => đảm bảo cách biệt tối thiểu 3 bàn
    if (Math.abs(domGap) >= 2.2) {
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
    hWin = Math.max(8, Math.min(85, hWin)); aWin = Math.max(8, Math.min(85, aWin));
    const drawP = Math.max(8, 100 - hWin - aWin);
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
    <div>
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
        {isLive(match) && (
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <span className="live-banner" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(230,57,70,.18)", border: `1px solid ${C.accent}`, borderRadius: 999, padding: "4px 14px" }}>
              <span className="live-dot" />
              <span style={{ fontWeight: 800, fontSize: 13, color: "#FF6B7A" }}>
                {liveStatLabel[live?.status] || "ĐANG ĐÁ"}{live?.elapsed != null ? ` · phút ${live.elapsed}'` : ""}
              </span>
            </span>
          </div>
        )}
        <div style={{ textAlign: "center", fontSize: 13, color: C.sub, marginTop: 12 }}>📍 {match.fixture.venue?.name || "—"}</div>
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
              Tự động làm mới mỗi 30 giây · Cập nhật lúc {toVN(lastUpdate.toISOString()).time}
            </div>
          )}

          {/* Diễn biến: bàn thắng, thẻ vàng/đỏ theo thứ tự thời gian */}
          {events.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {events.filter(e => ["Goal", "Card"].includes(e.type)).map((e, i) => {
                const isHomeTeam = e.team?.id === hId;
                let icon = "•", label = e.detail || e.type;
                if (e.type === "Goal") { icon = "⚽"; label = e.detail === "Own Goal" ? "Phản lưới nhà" : e.detail === "Penalty" ? "Ghi bàn (phạt đền)" : "Ghi bàn"; }
                else if (e.type === "Card") { icon = e.detail === "Red Card" ? "🟥" : "🟨"; label = e.detail === "Red Card" ? "Thẻ đỏ" : "Thẻ vàng"; }
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: isHomeTeam ? "flex-start" : "flex-end", textAlign: isHomeTeam ? "left" : "right", fontSize: 13 }}>
                    {isHomeTeam && <span style={{ minWidth: 34, color: C.gold, fontWeight: 800 }}>{e.time?.elapsed}'</span>}
                    <span>{icon} <b>{e.player?.name || "—"}</b> <span style={{ color: C.sub }}>({label})</span></span>
                    {!isHomeTeam && <span style={{ minWidth: 34, color: C.gold, fontWeight: 800 }}>{e.time?.elapsed}'</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: C.dim, marginBottom: 14 }}>Chưa có diễn biến nào (bàn thắng/thẻ).</div>
          )}

          {/* Thống kê trực tiếp */}
          {liveStats.length >= 2 && (
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
              {analysisText() && <div style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 12, color: "#D5DEEC" }}>{analysisText()}</div>}
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
