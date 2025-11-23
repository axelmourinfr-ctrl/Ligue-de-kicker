// Ligue Baby-foot – script.js v16 connecté
// Utilise Google Apps Script comme backend partagé entre tous les téléphones.

const API_URL = "https://script.google.com/macros/s/AKfycbzaYj_dmVJtKGYBod7r7YA3HIkVh7yUdwTme98p15KxonEWhdsLAxe2CGu7aMcjwgzOZQ/exec";

let STATE = {
  players: {},
  history: []
};

const BADGE_LEVELS = ["—", "Bois", "Bronze", "Argent", "Or", "Diamant"];

// ---------------- API ----------------
async function apiCall(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return await res.json();
}

async function loadState() {
  try {
    const data = await apiCall({ action: "getState" });
    if (data.ok) {
      STATE = data.state;
      renderAll();
      renderMatchForm();
    } else {
      alert("Erreur serveur: " + data.error);
    }
  } catch (e) {
    console.error(e);
    alert("Erreur réseau lors du chargement de la ligue.");
  }
}

// ---------------- INIT ----------------
window.addEventListener("load", () => {
  loadState();
});

// ---------------- FORM MATCH ----------------
function renderMatchForm() {
  const modeSelect = document.getElementById("mode");
  if (!modeSelect) return;
  const mode = modeSelect.value;
  const container = document.getElementById("matchForm");
  const players = Object.keys(STATE.players).sort();

  let html = "";

  if (mode === "1v1") {
    html += `
      <div class="row">
        <label>Joueur 1</label>
        <select id="p1">
          <option value="">-- Choisir --</option>
          ${players.map(p => `<option value="${p}">${p}</option>`).join("")}
        </select>
        <input id="score1" type="number" min="0" max="11" placeholder="Score J1" />
      </div>
      <div class="row">
        <label>Joueur 2</label>
        <select id="p2">
          <option value="">-- Choisir --</option>
          ${players.map(p => `<option value="${p}">${p}</option>`).join("")}
        </select>
        <input id="score2" type="number" min="0" max="11" placeholder="Score J2" />
      </div>
      <p class="hint">En 1 vs 1, seuls Elo, score et badges basés sur le score sont pris en compte.</p>
    `;
  } else {
    html += `
      <h3>Équipe A</h3>
      <div class="row">
        <label>Défenseur A</label>
        <select id="teamAdef">
          <option value="">-- Choisir --</option>
          ${players.map(p => `<option value="${p}">${p}</option>`).join("")}
        </select>
      </div>
      <div class="row">
        <label>Attaquant A</label>
        <select id="teamAatt">
          <option value="">-- Choisir --</option>
          ${players.map(p => `<option value="${p}">${p}</option>`).join("")}
        </select>
      </div>
      <div class="row">
        <label>Score A</label>
        <input id="scoreA" type="number" min="0" max="11" placeholder="Score A" />
      </div>

      <h4>Stats Équipe A</h4>
      <div class="row">
        <label>Déf A - Buts</label>
        <input id="Adef_goals" type="number" min="0" placeholder="0" />
        <label>Passes</label>
        <input id="Adef_assists" type="number" min="0" placeholder="0" />
      </div>
      <div class="row">
        <label>Déf A - Arrêts</label>
        <input id="Adef_saves" type="number" min="0" placeholder="0" />
        <label>Tirs encaissés</label>
        <input id="Adef_conceded" type="number" min="0" placeholder="0" />
      </div>
      <div class="row">
        <label>Att A - Buts</label>
        <input id="Aatt_goals" type="number" min="0" placeholder="0" />
        <label>Tirs ratés</label>
        <input id="Aatt_misses" type="number" min="0" placeholder="0" />
      </div>

      <h3>Équipe B</h3>
      <div class="row">
        <label>Défenseur B</label>
        <select id="teamBdef">
          <option value="">-- Choisir --</option>
          ${players.map(p => `<option value="${p}">${p}</option>`).join("")}
        </select>
      </div>
      <div class="row">
        <label>Attaquant B</label>
        <select id="teamBatt">
          <option value="">-- Choisir --</option>
          ${players.map(p => `<option value="${p}">${p}</option>`).join("")}
        </select>
      </div>
      <div class="row">
        <label>Score B</label>
        <input id="scoreB" type="number" min="0" max="11" placeholder="Score B" />
      </div>

      <h4>Stats Équipe B</h4>
      <div class="row">
        <label>Déf B - Buts</label>
        <input id="Bdef_goals" type="number" min="0" placeholder="0" />
        <label>Passes</label>
        <input id="Bdef_assists" type="number" min="0" placeholder="0" />
      </div>
      <div class="row">
        <label>Déf B - Arrêts</label>
        <input id="Bdef_saves" type="number" min="0" placeholder="0" />
        <label>Tirs encaissés</label>
        <input id="Bdef_conceded" type="number" min="0" placeholder="0" />
      </div>
      <div class="row">
        <label>Att B - Buts</label>
        <input id="Batt_goals" type="number" min="0" placeholder="0" />
        <label>Tirs ratés</label>
        <input id="Batt_misses" type="number" min="0" placeholder="0" />
      </div>
      <p class="hint">Les stats sont facultatives, mais permettent de débloquer les badges et les ratios.</p>
    `;
  }

  container.innerHTML = html;
}

function clearMatchForm() {
  renderMatchForm();
}

// ---------------- AJOUT JOUEUR ----------------
async function addPlayer() {
  const name = document.getElementById("newPlayerName").value.trim();
  if (!name) {
    alert("Veuillez entrer un nom de joueur.");
    return;
  }

  try {
    const data = await apiCall({
      action: "addPlayer",
      name: name
    });
    if (data.ok) {
      STATE = data.state;
      renderAll();
      document.getElementById("newPlayerName").value = "";
      renderMatchForm();
    } else {
      alert("Erreur: " + data.error);
    }
  } catch (e) {
    alert("Erreur réseau: impossible d'ajouter le joueur.");
    console.error(e);
  }
}

// ---------------- ENREGISTREMENT MATCH ----------------
async function submitMatch() {
  const modeSelect = document.getElementById("mode");
  if (!modeSelect) return;
  const mode = modeSelect.value;

  if (mode === "1v1") {
    await submitMatch1v1();
  } else {
    await submitMatch2v2();
  }
}

async function submitMatch1v1() {
  const p1 = document.getElementById("p1").value;
  const p2 = document.getElementById("p2").value;
  const s1 = parseInt(document.getElementById("score1").value, 10);
  const s2 = parseInt(document.getElementById("score2").value, 10);

  if (!p1 || !p2 || isNaN(s1) || isNaN(s2)) {
    alert("Veuillez compléter les joueurs et les scores.");
    return;
  }
  if (p1 === p2) {
    alert("Les deux joueurs ne peuvent pas être identiques.");
    return;
  }

  try {
    const data = await apiCall({
      action: "addMatch1v1",
      p1, p2, s1, s2
    });
    if (data.ok) {
      STATE = data.state;
      renderAll();
      clearMatchForm();
    } else {
      alert("Erreur: " + data.error);
    }
  } catch (e) {
    alert("Erreur réseau lors de l'enregistrement du match.");
    console.error(e);
  }
}

function valOrNull(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const v = el.value;
  if (v === "" || v === null || typeof v === "undefined") return null;
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
}

async function submitMatch2v2() {
  const Adef = document.getElementById("teamAdef").value;
  const Aatt = document.getElementById("teamAatt").value;
  const Bdef = document.getElementById("teamBdef").value;
  const Batt = document.getElementById("teamBatt").value;
  const scoreA = parseInt(document.getElementById("scoreA").value, 10);
  const scoreB = parseInt(document.getElementById("scoreB").value, 10);

  if (!Adef || !Aatt || !Bdef || !Batt || isNaN(scoreA) || isNaN(scoreB)) {
    alert("Veuillez compléter les joueurs et les scores.");
    return;
  }
  const names = [Adef, Aatt, Bdef, Batt];
  if ((new Set(names)).size < names.length) {
    alert("Un joueur ne peut pas apparaître deux fois dans le match.");
    return;
  }

  const payload = {
    action: "addMatch2v2",
    Adef, Aatt, Bdef, Batt,
    scoreA, scoreB,
    Adef_goals: valOrNull("Adef_goals"),
    Adef_assists: valOrNull("Adef_assists"),
    Adef_saves: valOrNull("Adef_saves"),
    Adef_conceded: valOrNull("Adef_conceded"),
    Aatt_goals: valOrNull("Aatt_goals"),
    Aatt_misses: valOrNull("Aatt_misses"),
    Bdef_goals: valOrNull("Bdef_goals"),
    Bdef_assists: valOrNull("Bdef_assists"),
    Bdef_saves: valOrNull("Bdef_saves"),
    Bdef_conceded: valOrNull("Bdef_conceded"),
    Batt_goals: valOrNull("Batt_goals"),
    Batt_misses: valOrNull("Batt_misses")
  };

  try {
    const data = await apiCall(payload);
    if (data.ok) {
      STATE = data.state;
      renderAll();
      clearMatchForm();
    } else {
      alert("Erreur: " + data.error);
    }
  } catch (e) {
    alert("Erreur réseau lors de l'enregistrement du match 2v2.");
    console.error(e);
  }
}

// ---------------- GESTION LIGUE ----------------
async function newSeason() {
  if (!confirm("Réinitialiser les stats & badges (Elo conservé) ?")) return;
  try {
    const data = await apiCall({ action: "newSeason" });
    if (data.ok) {
      STATE = data.state;
      renderAll();
    } else {
      alert("Erreur: " + data.error);
    }
  } catch (e) {
    alert("Erreur réseau lors du reset de saison.");
    console.error(e);
  }
}

async function applyBonus() {
  const name = document.getElementById("bonusName").value.trim();
  const amount = parseInt(document.getElementById("bonusAmount").value, 10);
  if (!name || isNaN(amount)) {
    alert("Nom ou montant invalide.");
    return;
  }
  try {
    const data = await apiCall({ action: "bonus", name, amount });
    if (data.ok) {
      STATE = data.state;
      renderAll();
      document.getElementById("bonusName").value = "";
      document.getElementById("bonusAmount").value = "";
    } else {
      alert("Erreur: " + data.error);
    }
  } catch (e) {
    alert("Erreur réseau lors de l'application du bonus.");
    console.error(e);
  }
}

// ---------------- RENDU ----------------
function renderAll() {
  renderRanking();
  renderBadgesTable();
  renderHallOfFame();
  renderLastMatches();
}

function computeAttRatio(p) {
  const totalShots = (p.attGoals || 0) + (p.attMisses || 0);
  if (totalShots <= 0) return null;
  return (p.attGoals / totalShots) * 100;
}

function computeDefScore(p) {
  const num = (p.defSaves || 0) + (p.defPasses || 0) + (p.defGoals || 0);
  const den = num + (p.defConceded || 0);
  if (den <= 0) return null;
  return (num / den) * 100;
}

function renderRanking() {
  const tbody = document.getElementById("rankingBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const arr = Object.entries(STATE.players || {})
    .map(([name, p]) => ({ name, ...p }))
    .sort((a, b) => b.elo - a.elo);

  arr.forEach(p => {
    const tr = document.createElement("tr");
    const attRatio = computeAttRatio(p);
    const defScore = computeDefScore(p);

    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${p.elo}</td>
      <td>${p.w || 0}</td>
      <td>${p.l || 0}</td>
      <td>${p.matches || 0}</td>
      <td>${attRatio === null ? "—" : attRatio.toFixed(1)}</td>
      <td>${defScore === null ? "—" : defScore.toFixed(1)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderBadgesTable() {
  const tbody = document.getElementById("badgesBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const arr = Object.entries(STATE.players || {})
    .map(([name, p]) => ({ name, ...p }))
    .sort((a, b) => b.elo - a.elo);

  arr.forEach(p => {
    const b = p.badges || {};
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${BADGE_LEVELS[b.hat_trick_def || 0]}</td>
      <td>${BADGE_LEVELS[b.mur_de_fer || 0]}</td>
      <td>${BADGE_LEVELS[b.serial_passeur_def || 0]}</td>
      <td>${BADGE_LEVELS[b.precision_chir || 0]}</td>
      <td>${BADGE_LEVELS[b.vainqueur_ecrasant || 0]}</td>
      <td>${BADGE_LEVELS[b.progres_continu || 0]}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderHallOfFame() {
  const tbody = document.getElementById("hofBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const arr = Object.entries(STATE.players || {})
    .map(([name, p]) => {
      const b = p.badges || {};
      let diamonds = 0, gold = 0, silver = 0;
      Object.values(b).forEach(lvl => {
        if (lvl === 5) diamonds++;
        else if (lvl === 4) gold++;
        else if (lvl === 3) silver++;
      });
      return { name, diamonds, gold, silver };
    })
    .sort((a, b) =>
      b.diamonds - a.diamonds ||
      b.gold - a.gold ||
      b.silver - a.silver
    );

  arr.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${p.diamonds}</td>
      <td>${p.gold}</td>
      <td>${p.silver}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderLastMatches() {
  const div = document.getElementById("lastMatches");
  if (!div) return;
  const hist = (STATE.history || []).slice(-10).reverse();
  if (hist.length === 0) {
    div.textContent = "Aucun match enregistré pour l'instant.";
    return;
  }
  const lines = hist.map(m => {
    const d = new Date(m.date);
    const when = d.toLocaleString("fr-BE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
    if (m.mode === "1v1") {
      return `• [${when}] 1v1 : ${m.p1} ${m.s1} - ${m.s2} ${m.p2}`;
    } else {
      return `• [${when}] 2v2 : (${m.teamA[0].name}/${m.teamA[1].name}) ${m.scoreA} - ${m.scoreB} (${m.teamB[0].name}/${m.teamB[1].name})`;
    }
  });
  div.innerHTML = lines.join("<br>");
}
