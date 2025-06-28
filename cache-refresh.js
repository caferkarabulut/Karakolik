// cache-refresh.js
const cron  = require('node-cron');
const fetch = (...a) => import('node-fetch').then(({default: f}) => f(...a));

cron.schedule('*/30 * * * *', async () => {
  try {
    // Futbol fikstürleri
    await fetch('http://localhost:3000/api/football/matches?league=203&season=2023');

    // Futbol puan durumları
    const seasons = [
      { league: 203, name: 'Süper Lig' },
      { league: 39,  name: 'Premier League' },
      { league: 140, name: 'La Liga' },
      { league: 135, name: 'Serie A' },
      { league: 78,  name: 'Bundesliga' }
    ];
    for (const s of seasons) {
      await fetch(`http://localhost:3000/api/football/standings?league=${s.league}&season=2023`);
    }

    console.log('[cron] Futbol verileri yenilendi', new Date().toLocaleTimeString());
  } catch (e) {
    console.error('[cron] Yenileme hatası:', e.message);
  }
});
