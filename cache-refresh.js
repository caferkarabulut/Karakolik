const cron = require('node-cron');
const fetch = (...a) => import('node-fetch').then(({ default: f }) => f(...a));

const BASE_URL = 'http://localhost:3000/api/football';

const LEAGUES = [
  { id: 203, name: 'Süper Lig' },
  { id: 39, name: 'Premier League' },
  { id: 140, name: 'La Liga' },
  { id: 135, name: 'Serie A' },
  { id: 78, name: 'Bundesliga' }
];

function getCurrentSeason() {
  const now = new Date();
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}

cron.schedule('*/30 * * * *', async () => {
  const season = getCurrentSeason();
  try {
    await fetch(`${BASE_URL}/matches?league=203&season=${season}`);
    for (const league of LEAGUES) {
      await fetch(`${BASE_URL}/standings?league=${league.id}&season=${season}`);
    }
    console.log('[cron] Football data refreshed', new Date().toLocaleTimeString());
  } catch (e) {
    console.error('[cron] Refresh error:', e.message);
  }
});
