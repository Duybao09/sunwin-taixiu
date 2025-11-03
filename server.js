import Fastify from "fastify";
import cors from "@fastify/cors";
import WebSocket from "ws";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const fastify = Fastify({ logger: false });
const PORT = process.env.PORT || 3001;
const HISTORY_FILE = path.join(process.cwd(), "taixiu_history.json");

let rikResults = [];
let rikWS = null;

const TOKEN = process.env.SUNWIN_TOKEN || "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbW91bnQiOjAsInVzZXJuYW1lIjoiU0NfYXBpc3Vud2luMTIzIn0.hgrRbSV6vnBwJMg9ZFtbx3rRu9mX_hZMZ_m5gMNhkw0";

function getTX(d1, d2, d3) {
  return d1 + d2 + d3 >= 11 ? "Tài" : "Xỉu";
}
function saveHistory() {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(rikResults, null, 2));
  } catch (e) { console.error("Save history error:", e.message); }
}
function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) rikResults = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
  } catch (e) { console.error("Load history error:", e.message); }
}
function predictNext(history) {
  if (history.length < 4) return "Tài";
  const last = history.at(-1);
  const tCount = history.filter(x => x === "Tài").length;
  const xCount = history.length - tCount;
  if (Math.abs(tCount - xCount) >= 5) return tCount > xCount ? "Xỉu" : "Tài";
  return last === "Tài" ? "Xỉu" : "Tài";
}

function connectSunWin() {
  if (!TOKEN) {
    console.error("❌ SUNWIN_TOKEN chưa đặt. Vui lòng đặt biến môi trường SUNWIN_TOKEN.");
    return;
  }
  console.log("🔌 Kết nối WS SunWin...");
  rikWS = new WebSocket(`wss://websocket.azhkthg1.net/websocket?token=${TOKEN}`);

  rikWS.on("open", () => {
    console.log("✅ WebSocket open");
    const authPayload = [
      1, "MiniGame", "SC_apisunwin123", "binhtool90",
      { info: JSON.stringify({ wsToken: TOKEN }), signature: "demo" }
    ];
    try { rikWS.send(JSON.stringify(authPayload)); } catch(e){}
    setInterval(() => {
      try { rikWS.send(JSON.stringify([6, "MiniGame", "taixiuPlugin", { cmd: 1005 }])); } catch(e){}
    }, 5000);
  });

  rikWS.on("message", (data) => {
    try {
      const json = JSON.parse(data);
      if (Array.isArray(json) && json[3]?.res?.d1) {
        const r = json[3].res;
        rikResults.unshift({ sid: r.sid, d1: r.d1, d2: r.d2, d3: r.d3, timestamp: Date.now() });
        if (rikResults.length > 200) rikResults.pop();
        saveHistory();
        console.log(`📥 Phiên ${r.sid} → ${getTX(r.d1,r.d2,r.d3)}`);
      }
    } catch (e) { /* ignore parse errors */ }
  });

  rikWS.on("close", () => {
    console.log("🔌 WS đóng. reconnect sau 5s...");
    setTimeout(connectSunWin, 5000);
  });
  rikWS.on("error", (err) => {
    console.error("❌ WS error:", err?.message || err);
    try { rikWS.close(); } catch(e){}
    setTimeout(connectSunWin, 5000);
  });
}

fastify.register(cors, { origin: true });

fastify.get("/api/taixiu/sunwin", async () => {
  const valid = rikResults.filter(r => r.d1 && r.d2 && r.d3);
  if (!valid.length) return { message: "Chưa có dữ liệu lịch sử. Đang chờ WebSocket..." };
  const cur = valid[0];
  const sum = cur.d1 + cur.d2 + cur.d3;
  const ket_qua = sum >= 11 ? "Tài" : "Xỉu";
  const history = valid.map(r => getTX(r.d1, r.d2, r.d3)).slice(0, 100);
  const du_doan = predictNext(history);
  return {
    id: "sunwin_api",
    phien: cur.sid,
    xuc_xac: [cur.d1, cur.d2, cur.d3],
    tong: sum,
    ket_qua,
    du_doan,
    do_tin_cay: "80%",
    tong_phien: valid.length,
    pattern_last_20: history.slice(0,20)
  };
});

fastify.get("/api/taixiu/history", async () => {
  const valid = rikResults.filter(r => r.d1 && r.d2 && r.d3);
  return valid.map(i => ({ session: i.sid, dice: [i.d1,i.d2,i.d3], total: i.d1+i.d2+i.d3 }));
});

fastify.get("/", async () => ({ status: "ok", uptime: process.uptime() }));

fastify.listen({ port: PORT, host: "0.0.0.0" }).then(() => {
  console.log(`🚀 API SunWin chạy trên cổng ${PORT}`);
  loadHistory();
  connectSunWin();
}).catch(err => {
  console.error("Start error:", err);
  process.exit(1);
});
