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

function toVN(iso) {
  if (!iso) return { date: "—", time: "—" };
  const d = new Date(iso);
  const vn = new Date(d.getTime() + 7 * 3600 * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return { date: `${p(vn.getUTCDate())}/${p(vn.getUTCMonth() + 1)}`, time: `${p(vn.getUTCHours())}:${p(vn.getUTCMinutes())}` };
}

const C = { bg: "#0B1120", card: "#121A2B", line: "#1E293B", line2: "#243049", text: "#E7ECF3", sub: "#7E8AA0", dim: "#5A6478", accent: "#E63946", gold: "#FFD166", green: "#4ADE80" };

export default function App() {
  const [view, setView] = useState({ name: "groups" });
  const [groups, setGroups] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true); setError("");
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
      setError("Không tải được dữ liệu. " + e.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`*{box-sizing:border-box}.card{transition:transform .15s,border-color .15s}.card:hover{transform:translateY(-2px);border-color:${C.accent}!important}@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite;display:inline-block}.pill{font-size:11px;font-weight:700;letter-spacing:.4px;padding:3px 9px;border-radius:999px}button{font-family:inherit}@media(prefers-reduced-motion:reduce){.card{transition:none}.spin{animation:none}}`}</style>

      <header style={{ borderBottom: `1px solid ${C.line}`, padding: "16px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, background: "rgba(11,17,32,.92)", backdropFilter: "blur(8px)", zIndex: 10 }}>
        {view.name !== "groups" && (
          <button onClick={() => setView(view.name === "match" ? { name: "group", g: view.g } : { name: "groups" })} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 24, lineHeight: 1 }}>‹</button>
        )}
        <span style={{ fontSize: 22 }}>🏆</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>WORLD CUP 2026</div>
          <div style={{ fontSize: 11, color: C.sub }}>Lịch & phân tích · giờ Việt Nam (UTC+7)</div>
          <div style={{ fontSize: 10, color: C.dim }}>Người viết app: Phạm Anh Khoa</div>
        </div>
        <button onClick={loadAll} title="Cập nhật" style={{ background: "none", border: `1px solid ${C.line2}`, color: C.sub, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>↻</button>
      </header>

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 28px" }}>
        {loading && <Center>Đang tải lịch thi đấu trực tuyến…</Center>}
        {error && !loading && (
          <div style={{ background: "rgba(230,57,70,.1)", border: `1px solid ${C.accent}`, borderRadius: 12, padding: 16, color: "#FF6B7A" }}>
            {error}
            <button onClick={loadAll} style={{ display: "block", marginTop: 10, background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 700 }}>Thử lại</button>
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

      <footer style={{ textAlign: "center", padding: "24px 16px", color: C.dim, fontSize: 11, borderTop: `1px solid ${C.line}`, marginTop: 24 }}>
        Dữ liệu: API-Football · cập nhật trực tuyến mỗi khi mở.
        <div style={{ marginTop: 8, color: C.sub, fontWeight: 700 }}>Người viết app: Phạm Anh Khoa</div>
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

function Groups({ groups, onOpen }) {
  const ids = Object.keys(groups).sort();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 18 }}>
      {ids.map((id) => {
        const teams = teamsOf(groups[id]);
        const done = groups[id].filter(isDone).length;
        return (
          <button key={id} onClick={() => onOpen(id)} className="card" style={{ textAlign: "left", cursor: "pointer", background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18, color: "inherit" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: C.accent }}>Bảng {id}</span>
              <span className="pill" style={{ background: C.line, color: "#9FB0C9" }}>{done}/{groups[id].length} đã đá</span>
            </div>
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
          const sc = `${m.goals.home ?? "-"}-${m.goals.away ?? "-"}`;
          return (
            <button key={m.fixture.id} onClick={() => onOpenMatch(m)} className="card" style={{ textAlign: "left", cursor: "pointer", background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, color: "inherit" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: C.sub }}>📅 {t.date} &nbsp;🕒 {t.time}</span>
                <span className="pill" style={done ? { background: "rgba(34,197,94,.15)", color: C.green } : { background: "rgba(230,57,70,.15)", color: "#FF6B7A" }}>{done ? "ĐÃ ĐÁ" : "CHƯA ĐÁ"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ flex: 1, textAlign: "right", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>{m.teams.home.name} <img src={m.teams.home.logo} width={22} height={22} alt="" /></span>
                <span style={{ minWidth: 56, textAlign: "center", fontWeight: 800, color: done ? C.gold : C.dim }}>{done ? sc : "vs"}</span>
                <span style={{ flex: 1, textAlign: "left", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><img src={m.teams.away.logo} width={22} height={22} alt="" /> {m.teams.away.name}</span>
              </div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>📍 {m.fixture.venue?.name || "—"}{m.fixture.venue?.city ? `, ${m.fixture.venue.city}` : ""}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Match({ g, match }) {
  const [stats, setStats] = useState(null);
  const [pred, setPred] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const done = isDone(match);
  const t = toVN(match.fixture.date);

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      if (done) {
        const r = await fetch(API("fixtures/statistics", { fixture: match.fixture.id }));
        const j = await r.json(); setStats(j.response || []);
      } else {
        const r = await fetch(API("predictions", { fixture: match.fixture.id }));
        const j = await r.json(); setPred(j.response?.[0] || null);
      }
    } catch (e) { setErr("Không tải được chi tiết. " + e.message); } finally { setLoading(false); }
  }, [done, match.fixture.id]);
  useEffect(() => { load(); }, [load]);

  const stat = (teamId, type) => {
    const block = stats?.find((s) => s.team.id === teamId);
    const item = block?.statistics?.find((x) => x.type === type);
    return item ? (item.value ?? "—") : "—";
  };

  return (
    <div>
      <div style={{ background: "linear-gradient(135deg,#15203A,#101727)", border: `1px solid ${C.line2}`, borderRadius: 16, padding: "20px 16px", marginBottom: 16 }}>
        <div style={{ textAlign: "center", fontSize: 12, color: "#9FB0C9", marginBottom: 8 }}>Bảng {g} · {t.date}/2026 · {t.time} (giờ VN)</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <Side team={match.teams.home} />
          <div style={{ fontSize: 30, fontWeight: 900, color: done ? C.gold : C.dim, minWidth: 70, textAlign: "center" }}>{done ? `${match.goals.home}-${match.goals.away}` : "—"}</div>
          <Side team={match.teams.away} />
        </div>
        <div style={{ textAlign: "center", fontSize: 12, color: C.sub, marginTop: 12 }}>📍 {match.fixture.venue?.name || "—"}</div>
        {match.fixture.referee && <div style={{ textAlign: "center", fontSize: 12, color: C.gold, marginTop: 6 }}>🧑‍⚖️ Trọng tài: {match.fixture.referee}</div>}
      </div>

      {loading && <Center>Đang tải chi tiết…</Center>}
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

      {!done && !loading && pred && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "linear-gradient(135deg,#1A2440,#13192B)", border: `1px solid ${C.line2}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 10, color: C.gold }}>✨ Dự đoán</div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>{pred.predictions?.advice || "—"}</div>
            <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center", marginTop: 8 }}>
              <Pred label={match.teams.home.name} value={pred.predictions?.percent?.home} />
              <Pred label="Hòa" value={pred.predictions?.percent?.draw} />
              <Pred label={match.teams.away.name} value={pred.predictions?.percent?.away} />
            </div>
          </div>
          {pred.teams && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormBox t={pred.teams.home} /><FormBox t={pred.teams.away} />
            </div>
          )}
        </div>
      )}
      {!done && !loading && !pred && !err && <div style={{ color: C.sub, fontSize: 13, textAlign: "center", padding: 20 }}>Chưa có dữ liệu dự đoán cho trận này.</div>}
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
      <div style={{ fontSize: 13, color: "#9FB0C9", marginTop: 4 }}>Ghi/thủng lưới (5 trận): {t.last_5?.goals?.for?.total ?? "—"} / {t.last_5?.goals?.against?.total ?? "—"}</div>
    </div>
  );
}
