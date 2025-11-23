const API_URL = "https://script.google.com/macros/s/AKfycbzaYj_dmVJtKGYBod7r7YA3HIkVh7yUdwTme98p15KxonEWhdsLAxe2CGu7aMcjwgzOZQ/exec";

/* =========================================================
   SCRIPT.JS – VERSION CONNECTÉE v17
   Compatible avec backend Code.gs v17
   ========================================================= */

let STATE = null;
let admin = false;

// Chargement initial
async function loadState() {
  const r = await fetch(API_URL);
  STATE = await r.json();
  renderRanking();
}
loadState();

/* =========================================================
   OUTILS API
   ========================================================= */

async function apiPost(data) {
  const r = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data)
  });
  return await r.json();
}

/* =========================================================
   ADMIN
   ========================================================= */
function toggleAdmin() {
  const pin = prompt("Entrer le code admin :");
  if (pin === "2025") {
    admin = true;
    document.body.classList.add("admin");
    alert("Mode admin activé !");
  } else {
    alert("Code incorrect");
  }
}

/* =========================================================
   AJOUT JOUEUR
   ========================================================= */
async function addPlayer() {
  const name = document.getElementById("newPlayerName").value.trim();
  if (!name) return;

  STATE.players[name] = {
    prenom: "",
    elo: 1000,
    paid: false,
    w: 0,
    l: 0,
    matches: 0,
    goals: 0,
    assists: 0,
    saves: 0,
    misses: 0,
    ratio_att: "-",
    ratio_def: "-",
    badges_level: {
      hat_trick_def: 0,
      mur_de_fer: 0,
      precision_chir: 0,
      serial_passeur_def: 0,
      vainqueur_ecrasant: 0,
      progres_continu: 0
    }
  };

  await apiPost({
    action: "updatePlayers",
    players: STATE.players
  });

  await loadState();
  document.getElementById("newPlayerName").value = "";
}

/* =========================================================
   FORMULAIRE MATCH
   ========================================================= */
function renderMatchForm() {
  const mode = document.getElementById("mode").value;
  const div = document.getElementById("matchForm");

  if (mode === "1v1") {
    div.innerHTML = `
      <div class="row">
        <input id="p1" placeholder="Joueur A">
        <input id="p2" placeholder="Joueur B">
      </div>
      <div class="row">
        <input id="scoreA" type="number" placeholder="Score A">
        <input id="scoreB" type="number" placeholder="Score B">
      </div>`;
  }

  if (mode === "2v2") {
    div.innerHTML = `
      <div class="row"><input id="a1" placeholder="Attquant A"><input id="d1" placeholder="Défenseur A"></div>
      <div class="row"><input id="a2" placeholder="Attaquant B"><input id="d2" placeholder="Défenseur B"></div>
      <div class="row"><input id="scoreA" type="number" placeholder="Score A"><input id="scoreB" type="number" placeholder="Score B"></div>`;
  }
}
renderMatchForm();

function clearMatchForm() {
  document.getElementById("matchForm").innerHTML = "";
  renderMatchForm();
}

/* =========================================================
   ENREGISTREMENT MATCH
   ========================================================= */
async function submitMatch() {
  const mode = document.getElementById("mode").value;
  const scoreA = Number(document.getElementById("scoreA").value);
  const scoreB = Number(document.getElementById("scoreB").value);

  let payload = { action: "submitMatch", mode, scoreA, scoreB };

  if (mode === "1v1") {
    payload.p1 = document.getElementById("p1").value;
    payload.p2 = document.getElementById("p2").value;
  }

  if (mode === "2v2") {
    payload.a1 = document.getElementById("a1").value;
    payload.d1 = document.getElementById("d1").value;
    payload.a2 = document.getElementById("a2").value;
    payload.d2 = document.getElementById("d2").value;
  }

  await apiPost(payload);
  await loadState();
}

/* =========================================================
   NOUVELLE SAISON
   ========================================================= */
async function newSeason() {
  if (!admin) return alert("Admin seulement !");
  if (!confirm("Réinitialiser la saison ?")) return;

  await apiPost({ action: "newSeason" });
  await loadState();
}

/* =========================================================
   BONUS ELO
   ========================================================= */
async function applyBonus() {
  if (!admin) return alert("Admin seulement !");

  const name = document.getElementById("bonusName").value;
  const amount = Number(document.getElementById("bonusAmount").value);

  await apiPost({ action: "applyBonus", name, amount });
  await loadState();
}

/* =========================================================
   CLASSEMENT
   ========================================================= */
function renderRanking() {
  const tbody = document.getElementById("rankingBody");
  tbody.innerHTML = "";

  const arr = Object.entries(STATE.players).sort((a, b) => b[1].elo - a[1].elo);

  for (const [name, p] of arr) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${name}</td>
      <td>${p.elo}</td>
      <td>${p.w}</td>
      <td>${p.l}</td>
      <td>${p.goals}</td>
      <td>${p.assists}</td>
      <td>${p.saves}</td>
      <td>${p.misses}</td>`;
    tbody.appendChild(tr);
  }
}
