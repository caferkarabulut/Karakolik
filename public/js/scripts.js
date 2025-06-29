
function saveToken(t){ localStorage.setItem('token', t); }
function getToken(){  return localStorage.getItem('token'); }
function logout(){    localStorage.removeItem('token'); location.href='index.html'; }

function showAlert(msg, type='danger'){
  const holder = document.getElementById('auth-alert');
  if(!holder) return;
  holder.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
}

function renderNav(){
  const token = getToken();
  const loginLink = document.getElementById('login-link');
  const regLink   = document.getElementById('register-link');
  const welcome   = document.getElementById('welcome-div');
  if(!loginLink) return;          

  if(token){
    const payload = JSON.parse(atob(token.split('.')[1]));
    welcome.style.display = 'inline';
    document.getElementById('welcome-user').textContent = payload.username;
    loginLink.style.display = regLink.style.display = 'none';
  }else{
    welcome.style.display = 'none';
    loginLink.style.display = regLink.style.display = 'inline';
  }
}
document.addEventListener('DOMContentLoaded', renderNav);

async function loginUser(e){
  e.preventDefault();
  const { username, password } = e.target;
  try{
    const r = await fetch('/login',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username: username.value, password: password.value })
    });
    if(!r.ok) throw await r.json();
    const { token } = await r.json();
    saveToken(token);
    showAlert('Giriş başarılı', 'success');
    location.href='index.html';
  }catch(err){ showAlert(err.msg || 'Giriş hatası'); }
}

async function registerUser(e){
  e.preventDefault();
  const { username, password } = e.target;
  try{
    const r = await fetch('/register',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username: username.value, password: password.value })
    });
    if(!r.ok) throw await r.json();
    showAlert('Kayıt tamam – şimdi giriş yapın', 'success')
    location.href='login.html';
  }catch(err){ showAlert(err.msg || 'Kayıt hatası'); }
}

async function loadMatches(leagueId, season){
  try{
    const url = `/api/football/matches?league=${leagueId}&season=${season}`;
    const res  = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data)){
      console.error('[loadMatches]', data);
      alert(data.msg || 'Maç verisi alınamadı');
      return;
    }

    const tbody = document.getElementById('match-body');
    if(!tbody) return;
    tbody.innerHTML = '';

    if(!data.length){
      tbody.innerHTML = '<tr><td colspan="5" class="text-muted">Bu lig için yakın maç bulunamadı</td></tr>';
      return;
    }

    data.forEach(m=>{
      const token = getToken();
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${ token ? `<button onclick="addFav(${m.id},this)">☆</button>` : '' }</td>
        <td>${new Date(m.date).toLocaleString('tr-TR')}</td>
        <td>${m.home}</td>
        <td>${m.away}</td>
        <td>${m.score}</td>`;
      tbody.appendChild(tr);
    });
  }catch(e){
    console.error(e);
    alert('Maç verisi alınamadı');
  }
}

async function addFav(matchId, btn){
  const token = getToken();
  if(!token) return alert('Önce giriş yapmalısınız');

  try{
    const r = await fetch('/api/favorites',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer '+token
      },
      body: JSON.stringify({ fixture_id: matchId })
    });
    if(!r.ok) throw await r.json();
    btn.textContent = '★';
    btn.disabled = true;
  }catch(err){ alert(err.msg || 'Favori eklenemedi'); }
}

async function loadFavorites(){
  try{
    const r = await fetch('/api/favorites',{
      headers:{ 'Authorization':'Bearer '+getToken() }
    });
    if(!r.ok) throw await r.json();
    const data = await r.json();
    const tbody = document.getElementById('fav-body');
    if(!tbody) return;
    tbody.innerHTML='';
    data.forEach(f=>{
      tbody.innerHTML += `
        <tr>
          <td><button onclick="removeFav(${f.fixture_id})">🗑️</button></td>
          <td>${new Date(f.date).toLocaleString('tr-TR')}</td>
          <td>${f.home}</td><td>${f.away}</td><td>${f.score}</td>
        </tr>`;
    });
  }catch(err){ alert(err.msg || 'Favoriler alınamadı'); }
}

async function removeFav(id){
  if(!confirm('Silinsin mi?')) return;
  try{
    const r = await fetch('/api/favorites/'+id,{
      method:'DELETE',
      headers:{ 'Authorization':'Bearer '+getToken() }
    });
    if(!r.ok) throw await r.json();
    loadFavorites();
  }catch(err){ alert(err.msg || 'Silinemedi'); }
}

const leagueMap = {
  203 : 'Süper Lig',
  39  : 'Premier League',
  140 : 'La Liga',
  135 : 'Serie A',
  78  : 'Bundesliga'
};

function buildLeagueCards(){
  const wrap = document.getElementById('leagueCards');
  if(!wrap) return;
  Object.entries(leagueMap).forEach(([id, name])=>{
    const col = document.createElement('div');
    col.className = 'col';
    col.innerHTML = `
      <div class="card h-100 text-center shadow-sm">
        <div class="card-body d-flex flex-column justify-content-center">
          <button class="btn btn-outline-primary"
                  onclick="selectLeague(${id}, 2023, '${name}')">${name}</button>
        </div>
      </div>`;
    wrap.appendChild(col);
  });
}
document.addEventListener('DOMContentLoaded', buildLeagueCards);

function selectLeague(leagueId, season, leagueName){
  showStandings(leagueId, season, leagueName);
  loadMatches(leagueId, season);              
}

async function showStandings(league, season, name){
  try{
   
    const res  = await fetch(`/api/football/standings?league=${league}&season=${season}`);
    const data = await res.json();

    const title = document.getElementById('stand-title');
    const tbody = document.getElementById('standBody');
    const table = document.getElementById('standTable');
    if(!tbody) return;

    let favIds = [];
    const token = getToken();
    if (token){
      const favRes = await fetch('/api/team-fav',{
        headers:{ 'Authorization':'Bearer '+token }
      });
      if (favRes.ok){
        const favTeams = await favRes.json();          
        favIds = favTeams.map(t=>t.id);               
      }
    }

    
    title.textContent = `${name} ${season}/${season+1} Puan Durumu`;
    title.style.display = 'block';

    tbody.innerHTML = '';
    data.forEach(r=>{
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
          <td>${r.played}</td><td>${r.win}</td><td>${r.draw}</td><td>${r.lose}</td>
          <td>${r.goals_for}</td><td>${r.goals_against}</td><td><b>${r.points}</b></td>
        </tr>`;
    });
    table.style.display = 'table';
  }catch(e){
    console.error(e);
    alert('Puan durumu alınamadı');
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  selectLeague(203, 2023, 'Süper Lig');
});

async function toggleTeamFav(teamId, btn){
  try{
    const r = await fetch('/api/team-fav',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer '+getToken()
      },
      body: JSON.stringify({ team_id: teamId })   
    });
    const { added } = await r.json();
    btn.innerHTML = added ? '★' : '☆';
    loadFavTeams();
  }catch(e){ console.error('[toggleTeamFav]', e); }
}

async function loadFavTeams(){
  const wrap = document.getElementById('fav-teams');
  if(!wrap) return;
  try{
    const r = await fetch('/api/team-fav',{
      headers:{ 'Authorization':'Bearer '+getToken() }
    });
    if(!r.ok) throw await r.json();
    const data = await r.json();
    wrap.innerHTML = data.length
      ? data.map(t=>`
          <div class="card me-2 mb-2 shadow-sm" style="width:9rem">
            <img src="${t.logo || 'img/placeholder.svg'}" class="card-img-top p-2" alt="">
            <div class="card-body p-2 text-center">
              <small>${t.name}</small>
            </div>
          </div>`).join('')
      : '<p class="text-muted">Favori takımınız henüz yok</p>';
  }catch(e){ console.error(e); }
}
