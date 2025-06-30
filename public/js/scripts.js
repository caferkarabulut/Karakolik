
function saveToken(t) {
  localStorage.setItem('token', t);
}
function getToken() {
  return localStorage.getItem('token');
}
function logout() {
  localStorage.removeItem('token');
  location.href = 'index.html';
}

function showAlert(msg, type = 'danger') {
  const holder = document.getElementById('auth-alert');
  if (!holder) return;
  holder.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
}


function renderNav() {
  const token    = getToken();
  const loginL   = document.getElementById('login-link');
  const regL     = document.getElementById('register-link');
  const welcome  = document.getElementById('welcome-div');

  if (!loginL) return;

  if (token) {
    const { username } = JSON.parse(atob(token.split('.')[1]));
    welcome.style.display           = 'inline';
    document.getElementById('welcome-user').textContent = username;
    loginL.style.display = regL.style.display = 'none';
  } else {
    welcome.style.display           = 'none';
    loginL.style.display = regL.style.display = 'inline';
  }
}

document.addEventListener('DOMContentLoaded', renderNav);

async function loginUser(e) {
  e.preventDefault();
  const { username, password } = e.target;
  try {
    const r = await fetch('/login', {
      method:  'POST',
      headers: {'Content-Type':'application/json'},
      body:    JSON.stringify({
        username: username.value,
        password: password.value
      })
    });
    
    if (!r.ok) throw await r.json();

    const { token } = await r.json();
    saveToken(token);
    showAlert('Giriş başarılı', 'success');
    location.href = 'index.html';
  } catch (err) {
    showAlert(err.msg || 'Giriş hatası');
  }
}

async function registerUser(e) {
  e.preventDefault();
  const { username, password } = e.target;
  try {
    const r = await fetch('/register', {
      method:  'POST',
      headers: {'Content-Type':'application/json'},
      body:    JSON.stringify({
        username: username.value,
        password: password.value
      })
    });
    if (!r.ok) throw await r.json();
    showAlert('Kayıt tamam – şimdi giriş yapın', 'success');
    location.href = 'login.html';
  } catch (err) {
    showAlert(err.msg || 'Kayıt hatası');
  }
}

const leagueMap = {
  203: 'Süper Lig',
  39 : 'Premier League',
  140: 'La Liga',
  135: 'Serie A',
  78 : 'Bundesliga'
};

function buildLeagueCards() {
  const wrap = document.getElementById('leagueCards');
  if (!wrap) return;
  Object.entries(leagueMap).forEach(([id,name]) => {
    const col = document.createElement('div');
    col.className = 'col';
    col.innerHTML = `
      <div class="card h-100 text-center shadow-sm">
        <div class="card-body d-flex flex-column justify-content-center">
          <button class="btn btn-outline-primary"
                  onclick="selectLeague(${id},2023,'${name}')">${name}</button>
        </div>
      </div>`;
    wrap.appendChild(col);
  });
}
document.addEventListener('DOMContentLoaded', buildLeagueCards);


function selectLeague(leagueId, season, leagueName) {
  showStandings(leagueId, season, leagueName);
  loadMatches(leagueId, season);
}

async function showStandings(league, season, name) {
  try {
    const res  = await fetch(`/api/football/standings?league=${league}&season=${season}`);
    const data = await res.json();

    
    let favIds = [];
    const token = getToken();
    if (token) {
      const favRes = await fetch('/api/team-fav', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (favRes.ok) {
        favIds = (await favRes.json()).map(t => t.id);
      }
    }

    const title = document.getElementById('stand-title');
    const tbody = document.getElementById('standBody');
    const table = document.getElementById('standTable');
    title.textContent = `${name} ${season}/${season+1} Puan Durumu`;
    title.style.display = 'block';
    tbody.innerHTML = '';
    data.forEach(r => {
      const isFav = favIds.includes(r.team_id);
      tbody.innerHTML += `
        <tr>
          <td>${r.rank}</td>
          <td>
            <button class="btn btn-sm p-0 me-1"
                    onclick="toggleTeamFav(${r.team_id}, this)">
              ${isFav ? '★' : '☆'}
            </button>
            ${r.team}
          </td>
          <td>${r.played}</td><td>${r.win}</td><td>${r.draw}</td>
          <td>${r.lose}</td><td>${r.goals_for}</td>
          <td>${r.goals_against}</td><td><b>${r.points}</b></td>
        </tr>`;
    });
    table.style.display = 'table';
  } catch (e) {
    console.error(e);
    alert('Puan durumu alınamadı');
  }
}

async function loadMatches(leagueId, season) {
  try {
    const url   = `/api/football/matches?league=${leagueId}&season=${season}`;
    const res   = await fetch(url);
    const data  = await res.json();
    const tbody = document.getElementById('match-body');
    if (!tbody) return;

    tbody.innerHTML = data.length
      ? data.map(m => `
          <tr>
            <td>${ getToken()
              ? `<button onclick="toggleTeamFav(${m.home_id}, this)">☆</button>`
              : '' }</td>
            <td>${new Date(m.date).toLocaleString('tr-TR')}</td>
            <td>${m.home}</td><td>${m.away}</td><td>${m.score}</td>
          </tr>`).join('')
      : '<tr><td colspan="5" class="text-center">Maç bulunamadı</td></tr>';
  } catch (e) {
    console.error(e);
    alert('Maç verisi alınamadı');
  }
}


async function toggleTeamFav(teamId, btn) {
  try {
    const response = await fetch('/api/team-fav', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ team_id: teamId })
    });
    if (!response.ok) {
      const err = await response.json();
      console.error('Favori ekleme hatası:', err);
      return alert(err.msg || 'Favorilere ekleme başarısız');
    }
    const { added } = await response.json();
    btn.textContent = added ? '★' : '☆';
    loadFavTeams();
  } catch (e) {
    console.error('[toggleTeamFav]', e);
    alert('Sunucuya bağlanırken hata oluştu');
  }
}

async function loadFavTeams() {
  const wrap = document.getElementById('fav-teams');
  if (!wrap) return;
  try {
    const r = await fetch('/api/team-fav', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!r.ok) throw await r.json();
    const data = await r.json();
    wrap.innerHTML = data.length
      ? data.map(t => `
          <div class="card me-2 mb-2 shadow-sm" style="width:9rem">
            <img src="${t.logo}" class="card-img-top p-2" alt="${t.name}">
            <div class="card-body p-2 text-center">
              <small>${t.name}</small>
            </div>
          </div>`).join('')
      : '<p class="text-muted">Henüz favori takımınız yok</p>';
  } catch (e) {
    console.error(e);
    wrap.innerHTML = '<p class="text-danger">Favoriler yüklenemedi</p>';
  }
}13
