async function loadMatches(sport){
  try{
    const res  = await fetch(`/api/${sport}/matches`);
    const data = await res.json();
    const tbody= document.getElementById('match-body');
    tbody.innerHTML = '';

    data.forEach(m=>{
      const tr = document.createElement('tr');
      const token = getToken();   // kullanıcı giriş yapmış mı?
tr.innerHTML = `
  <td>
    ${ token
        ? `<button onclick="addFav(${m.id})">☆</button>`
        : '' }
  </td>
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
/* ---------- AUTH ---------- */
function saveToken(t){ localStorage.setItem('token', t); }
function getToken(){ return localStorage.getItem('token'); }
function logout(){ localStorage.removeItem('token'); location.href='index.html'; }

/* Login */
async function loginUser(e){
  e.preventDefault();
  const form = e.target;
  const body = {
    username: form.username.value,
    password: form.password.value
  };
  try{
    const res = await fetch('/login',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    if(!res.ok) throw await res.json();
    const {token} = await res.json();
    saveToken(token);
    alert('Giriş başarılı');
    location.href='index.html';
  }catch(err){
    alert(err.msg || 'Giriş hatası');
  }
}

/* Register */
async function registerUser(e){
  e.preventDefault();
  const form = e.target;
  const body = {
    username: form.username.value,
    password: form.password.value
  };
  try{
    const res = await fetch('/register',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    if(!res.ok) throw await res.json();
    alert('Kayıt tamam, şimdi giriş yapın');
    location.href='login.html';
  }catch(err){
    alert(err.msg || 'Kayıt hatası');
  }
}

/* ---------- Navbar Durumu ---------- */
function renderNav(){
  const token = getToken();
  const loginLink = document.getElementById('login-link');
  const regLink   = document.getElementById('register-link');
  const welcome   = document.getElementById('welcome-div');
  if(!loginLink) return;          // sadece index.html’de var

  if(token){
    // basit decode (payload kısmı)
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


async function addFav(matchId){
  const token = getToken();
  if(!token) return alert('Önce giriş yapmalısınız');

  try{
    const res = await fetch('/api/favorites',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer '+token
      },
      body: JSON.stringify({ matchId })
    });
    if(!res.ok) throw await res.json();
    alert('Favorilere eklendi');
  }catch(err){
    alert(err.msg || 'Favori eklenemedi');
  }
}


/* -------- Favoriler listele -------- */
async function loadFavorites(){
  try{
    const res = await fetch('/api/favorites',{
      headers:{ 'Authorization':'Bearer '+getToken() }
    });
    if(!res.ok) throw await res.json();
    const data = await res.json();
    const tbody = document.getElementById('fav-body');
    tbody.innerHTML = '';
    data.forEach(f=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><button onclick="removeFav(${f.id})">🗑️</button></td>
        <td>${new Date(f.date).toLocaleString('tr-TR')}</td>
        <td>${f.home}</td>
        <td>${f.away}</td>
        <td>${f.score}</td>`;
      tbody.appendChild(tr);
    });
  }catch(e){ alert(e.msg || 'Favoriler alınamadı'); }
}

/* -------- Favori sil -------- */
async function removeFav(id){
  if(!confirm('Silinsin mi?')) return;
  try{
    const res = await fetch('/api/favorites/'+id,{
      method:'DELETE',
      headers:{ 'Authorization':'Bearer '+getToken() }
    });
    if(!res.ok) throw await res.json();
    loadFavorites();               // listeyi yenile
  }catch(e){ alert(e.msg || 'Silinemedi'); }
}
