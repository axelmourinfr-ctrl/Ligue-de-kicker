// --- Data ---
const DEFAULT_ELO = 1000;
const K_FACTOR = 32;

let db = JSON.parse(localStorage.getItem('bf_league_db') || '{}');
if (!db.players) db.players = {}; // players[name] = { elo, w, l, goals, assists, saves, misses }

function persist() {
  localStorage.setItem('bf_league_db', JSON.stringify(db));
  renderRanking();
}

// --- Helpers ---
function ensurePlayer(name) {
  const n = (name || '').trim();
  if (!n) return null;
  if (!db.players[n]) {
    db.players[n] = { elo: DEFAULT_ELO, w: 0, l: 0, goals: 0, assists: 0, saves: 0, misses: 0 };
  }
  return n;
}

function expectedScore(rA, rB) {
  return 1 / (1 + Math.pow(10, (rB - rA) / 400));
}

// --- UI: Add Player ---
function addPlayer() {
  const inp = document.getElementById('newPlayerName');
  const name = ensurePlayer(inp.value);
  if (!name) { alert('Nom invalide'); return; }
  inp.value = '';
  persist();
}

// --- Match Form Rendering ---
function renderMatchForm() {
  const mode = document.getElementById('mode').value;
  const box = document.getElementById('matchForm');
  box.innerHTML = '';

  if (mode === '1v1') {
    box.appendChild(playerForm('Joueur A'));
    box.appendChild(playerForm('Joueur B'));
  } else {
    box.appendChild(playerForm('Équipe A - Joueur 1'));
    box.appendChild(playerForm('Équipe A - Joueur 2'));
    box.appendChild(playerForm('Équipe B - Joueur 1'));
    box.appendChild(playerForm('Équipe B - Joueur 2'));
  }

  // Score helper (totals auto)
  const sc = document.createElement('div');
  sc.className = 'player-form';
  sc.innerHTML = `<div class="score-box">
    <div class="badge">Total buts Équipe A</div>
    <input id="scoreA" type="number" value="0" />
    <div class="badge">Total buts Équipe B</div>
    <input id="scoreB" type="number" value="0" />
  </div>
  <p class="hint">Optionnel : si tu laisses 0-0, on calcule avec la somme des buts individuels.</p>`;
  box.appendChild(sc);
}

function playerForm(title) {
  const wrap = document.createElement('div');
  wrap.className = 'player-form';
  wrap.innerHTML = `
    <h4>${title}</h4>
    <div class="row wrap">
      <label>Nom</label>
      <input class="p-name" placeholder="Ex: Axel" />
    </div>
    <div class="row wrap">
      <label>Rôle</label>
      <select class="p-role">
        <option value="attaquant">Attaquant</option>
        <option value="defenseur">Défenseur</option>
      </select>
    </div>
    <div class="row wrap">
      <label>Buts</label>
      <input class="p-goals" type="number" value="0" />
    </div>
    <div class="row wrap">
      <label>Passes</label>
      <input class="p-assists" type="number" value="0" />
    </div>
    <div class="row wrap">
      <label>Arrêts (déf.)</label>
      <input class="p-saves" type="number" value="0" />
    </div>
    <div class="row wrap">
      <label>Tirs ratés (att.)</label>
      <input class="p-misses" type="number" value="0" />
    </div>
  `;
  return wrap;
}

function clearMatchForm() {
  renderMatchForm();
}

// --- Match Submit ---
function submitMatch() {
  const mode = document.getElementById('mode').value;
  const forms = Array.from(document.querySelectorAll('#matchForm .player-form'))
    .filter(div => div.querySelector('.p-name')); // ignore score panel

  if (mode === '1v1' && forms.length !== 2) { alert('Formulaire incomplet'); return; }
  if (mode === '2v2' && forms.length !== 4) { alert('Formulaire incomplet'); return; }

  // Collect data per participant
  const playersData = forms.map(f => ({
    name: (f.querySelector('.p-name').value || '').trim(),
    role: f.querySelector('.p-role').value,
    goals: parseInt(f.querySelector('.p-goals').value || '0', 10),
    assists: parseInt(f.querySelector('.p-assists').value || '0', 10),
    saves: parseInt(f.querySelector('.p-saves').value || '0', 10),
    misses: parseInt(f.querySelector('.p-misses').value || '0', 10),
  }));

  // Validate names and ensure players exist
  for (const p of playersData) {
    if (!p.name) { alert('Veuillez renseigner tous les noms.'); return; }
    ensurePlayer(p.name);
  }

  // Split teams
  const half = playersData.length / 2;
  const teamA = playersData.slice(0, half);
  const teamB = playersData.slice(half);

  // Compute totals
  let scoreA = parseInt(document.getElementById('scoreA')?.value || '0', 10);
  let scoreB = parseInt(document.getElementById('scoreB')?.value || '0', 10);
  if (scoreA === 0 && scoreB === 0) {
    scoreA = teamA.reduce((s, p) => s + (p.goals||0), 0);
    scoreB = teamB.reduce((s, p) => s + (p.goals||0), 0);
  }

  // --- Update stats ---
  for (const p of playersData) {
    const ref = db.players[p.name];
    ref.goals += p.goals;
    ref.assists += p.assists;
    if (p.role === 'defenseur') {
      ref.saves += p.saves;
    } else { // attaquant
      ref.misses += p.misses;
    }
  }

  // --- Determine results (W/L) ---
  const resA = scoreA > scoreB ? 1 : (scoreA === scoreB ? 0.5 : 0);
  const resB = 1 - resA;

  // Increment W/L individually
  for (let i = 0; i < teamA.length; i++) {
    const name = teamA[i].name;
    if (resA === 1) db.players[name].w++;
    else if (resA === 0) db.players[name].l++;
  }
  for (let i = 0; i < teamB.length; i++) {
    const name = teamB[i].name;
    if (resB === 1) db.players[name].w++;
    else if (resB === 0) db.players[name].l++;
  }

  // --- Elo update ---
  if (mode === '1v1') {
    const A = db.players[teamA[0].name];
    const B = db.players[teamB[0].name];
    const eA = expectedScore(A.elo, B.elo);
    const eB = expectedScore(B.elo, A.elo);
    A.elo = Math.round(A.elo + K_FACTOR * (resA - eA));
    B.elo = Math.round(B.elo + K_FACTOR * (resB - eB));
  } else {
    // team Elo = moyenne des deux joueurs
    const eloA = teamA.reduce((s, p) => s + db.players[p.name].elo, 0) / teamA.length;
    const eloB = teamB.reduce((s, p) => s + db.players[p.name].elo, 0) / teamB.length;
    const eA = expectedScore(eloA, eloB);
    const eB = expectedScore(eloB, eloA);
    // Chaque joueur reçoit la même variation basée sur le résultat équipe
    const deltaA = Math.round(K_FACTOR * (resA - eA));
    const deltaB = Math.round(K_FACTOR * (resB - eB));
    for (const p of teamA) db.players[p.name].elo += deltaA;
    for (const p of teamB) db.players[p.name].elo += deltaB;
  }

  persist();
  clearMatchForm();
  alert('Match enregistré !');
}

// --- Ranking ---
function renderRanking() {
  const body = document.getElementById('rankingBody');
  // sort by Elo desc then name
  const rows = Object.entries(db.players)
    .sort((a,b) => b[1].elo - a[1].elo || a[0].localeCompare(b[0]))
    .map(([name, s]) => `<tr>
      <td>${name}</td>
      <td><strong>${s.elo}</strong></td>
      <td>${s.w}</td>
      <td>${s.l}</td>
      <td>${s.goals}</td>
      <td>${s.assists}</td>
      <td>${s.saves}</td>
      <td>${s.misses}</td>
    </tr>`)
    .join('');
  body.innerHTML = rows || '<tr><td colspan="8">Aucun joueur pour l’instant</td></tr>';
}

// --- New Season (reset stats, keep Elo) ---
function newSeason() {
  if (!confirm('Confirmer : réinitialiser les stats (Elo conservé) ?')) return;
  for (const name in db.players) {
    const p = db.players[name];
    p.w = 0; p.l = 0; p.goals = 0; p.assists = 0; p.saves = 0; p.misses = 0;
  }
  persist();
  alert('Nouvelle saison lancée ! Les Elo sont conservés.');
}

// --- Manual Elo Bonus ---
function applyBonus() {
  const name = (document.getElementById('bonusName').value || '').trim();
  const pts = parseInt(document.getElementById('bonusAmount').value || '0', 10);
  if (!name) { alert('Nom manquant'); return; }
  if (isNaN(pts) || pts === 0) { alert('Indique un nombre de points Elo (ex: 50)'); return; }
  ensurePlayer(name);
  db.players[name].elo += pts;
  persist();
  alert(`Bonus Elo appliqué à ${name} : ${pts > 0 ? '+' : ''}${pts}`);
}

// init
renderMatchForm();
persist();
