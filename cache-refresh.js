// cache-refresh.js
const cron  = require('node-cron');
const fetch = (...a) => import('node-fetch').then(({default: f}) => f(...a)); // Node<18

cron.schedule('*/30 * * * *', async () => {
  try {
    /* --- fikstürleri tazele --- */
    await fetch('http://localhost:3000/api/football/matches');
    await fetch('http://localhost:3000/api/basketball/matches');
    await fetch('http://localhost:3000/api/volleyball/matches');

    /* --- puan durumunu tazele (Süper Lig) --- */
    await fetch('http://localhost:3000/api/football/standings?league=203&season=2023');
    await fetch('http://localhost:3000/api/football/standings?league=39&season=2023');  // Premier League
await fetch('http://localhost:3000/api/football/standings?league=140&season=2023'); // La Liga
    await fetch('http://localhost:3000/api/football/standings?league=61&season=2023');  // Serie A  
    await fetch('http://localhost:3000/api/football/standings?league=78&season=2023');  // Bundesliga
    await fetch('http://localhost:3000/api/football/standings?league=135&season=2023'); // Ligue 1
    
    console.log('[cron] Veri yenilendi', new Date().toLocaleTimeString());
  } catch (e) {
    console.error('[cron] Yenileme hatası:', e.message);
  }
});
