// =====================================================================
//  Data layer — Supabase (live) or Demo mode (add ?demo to the URL;
//  runs entirely in this browser so you can rehearse without the database)
// =====================================================================
(function () {
  const C = window.GAME_CONFIG;
  const DEMO = new URLSearchParams(location.search).has("demo");

  // ---- safe storage helpers ----
  function store(kind) {
    const mem = {};
    let s = null;
    try { s = window[kind]; s.setItem("__t", "1"); s.removeItem("__t"); } catch (e) { s = null; }
    return {
      get(k) { try { return s ? s.getItem(k) : (k in mem ? mem[k] : null); } catch (e) { return mem[k] ?? null; } },
      set(k, v) { try { s ? s.setItem(k, v) : (mem[k] = v); } catch (e) { mem[k] = v; } },
      del(k) { try { s ? s.removeItem(k) : delete mem[k]; } catch (e) { delete mem[k]; } }
    };
  }
  const local = store("localStorage");
  // In demo mode each tab is its own "phone", so device/team live in sessionStorage.
  const device = DEMO ? store("sessionStorage") : local;

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  function deviceId() {
    let id = device.get("tbf_device");
    if (!id) { id = uid(); device.set("tbf_device", id); }
    return id;
  }

  // ---- Supabase REST (no SDK needed) ----
  const base = C.supabaseUrl.replace(/\/$/, "") + "/rest/v1/";
  const headers = { apikey: C.supabaseKey, "Content-Type": "application/json" };
  async function get(path) {
    const r = await fetch(base + path, { headers, cache: "no-store" });
    if (!r.ok) throw new Error("GET " + path + " " + r.status);
    return r.json();
  }
  async function rpc(fn, body) {
    const r = await fetch(base + "rpc/" + fn, { method: "POST", headers, body: JSON.stringify(body || {}) });
    if (!r.ok) throw new Error("RPC " + fn + " " + r.status);
    return r.json();
  }

  const live = {
    async getState() { const r = await get("game_state?id=eq.1&select=round,status"); return r[0] || { round: 0, status: "idle" }; },
    async castVote(team, round, choice) { return rpc("cast_vote", { p_device: deviceId(), p_team: team, p_round: round, p_choice: choice }); },
    async hostControl(pin, round, status, answer) { return rpc("host_control", { p_pin: pin, p_round: round, p_status: status, p_answer: answer || null }); },
    async hostReset(pin) { return rpc("host_reset", { p_pin: pin }); },
    async getVotes(round) { return get("votes?round=eq." + round + "&select=team,choice"); },
    async getMyVote(round) { const r = await get("votes?round=eq." + round + "&device_id=eq." + encodeURIComponent(deviceId()) + "&select=choice,team"); return r[0] || null; },
    async getAnswers() { return get("round_answers?select=round,answer"); },
    async getScores() { return rpc("get_scores", {}); }
  };

  // ---- Demo backend (localStorage, shared across tabs) ----
  const DK = { s: "tbf_demo_state", v: "tbf_demo_votes", a: "tbf_demo_answers" };
  const dj = (k, d) => { try { return JSON.parse(local.get(k)) ?? d; } catch (e) { return d; } };
  const ds = (k, v) => local.set(k, JSON.stringify(v));
  const demo = {
    async getState() { return dj(DK.s, { round: 0, status: "idle" }); },
    async castVote(team, round, choice) {
      const s = dj(DK.s, { round: 0, status: "idle" });
      if (s.status !== "open" || s.round !== round) return "closed";
      const votes = dj(DK.v, []); const id = deviceId();
      const prior = votes.find(v => v.device_id === id);
      if (prior && prior.team !== team) return "team_locked";
      const i = votes.findIndex(v => v.device_id === id && v.round === round);
      const row = { device_id: id, team, round, choice };
      if (i >= 0) votes[i] = row; else votes.push(row);
      ds(DK.v, votes); return "ok";
    },
    async hostControl(pin, round, status, answer) {
      if (status === "revealed" && answer) { const a = dj(DK.a, {}); a[round] = answer; ds(DK.a, a); }
      ds(DK.s, { round, status }); return "ok";
    },
    async hostReset() { ds(DK.v, []); ds(DK.a, {}); ds(DK.s, { round: 0, status: "idle" }); return "ok"; },
    async getVotes(round) { return dj(DK.v, []).filter(v => v.round === round).map(v => ({ team: v.team, choice: v.choice })); },
    async getMyVote(round) { const id = deviceId(); return dj(DK.v, []).find(v => v.round === round && v.device_id === id) || null; },
    async getAnswers() { return Object.entries(dj(DK.a, {})).map(([round, answer]) => ({ round: +round, answer })); },
    async getScores() {
      const a = dj(DK.a, {}); const out = {};
      dj(DK.v, []).forEach(v => {
        if (!(v.round in a)) return;
        const k = v.round + "|" + v.team;
        out[k] = out[k] || { round: v.round, team: v.team, voters: 0, correct: 0 };
        out[k].voters++; if (v.choice === a[v.round]) out[k].correct++;
      });
      return Object.values(out).map(r => ({ ...r, pct: Math.round(1000 * r.correct / r.voters) / 10 }));
    }
  };

  // ---- shared scoring summary ----
  // Points per round = % of that team's voters who were right. Total = sum of rounds.
  // Tiebreak = total number of correct votes.
  function summarize(rows) {
    const t = { credit: { points: 0, correct: 0, voters: 0, rounds: {} }, collections: { points: 0, correct: 0, voters: 0, rounds: {} } };
    (rows || []).forEach(r => {
      const x = t[r.team]; if (!x) return;
      const pct = Number(r.pct) || 0;
      x.points += pct; x.correct += r.correct; x.voters += r.voters; x.rounds[r.round] = { pct, voters: r.voters, correct: r.correct };
    });
    t.credit.points = Math.round(t.credit.points); t.collections.points = Math.round(t.collections.points);
    let winner = null;
    if (t.credit.points !== t.collections.points) winner = t.credit.points > t.collections.points ? "credit" : "collections";
    else if (t.credit.correct !== t.collections.correct) winner = t.credit.correct > t.collections.correct ? "credit" : "collections";
    t.winner = winner;
    t.tiebreak = t.credit.points === t.collections.points && !!winner;
    return t;
  }

  window.GameAPI = Object.assign({}, DEMO ? demo : live, {
    demo: DEMO, deviceId, summarize,
    deviceStore: device, localStore: local
  });
})();
