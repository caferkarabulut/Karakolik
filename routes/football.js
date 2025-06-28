const express = require('express');
const axios   = require('axios');

const SPORT      = 'football';
const FIX_URL    = 'https://v3.football.api-sports.io/fixtures';
const STAND_URL  = 'https://v3.football.api-sports.io/standings';

module.exports = () => {
  const router = express.Router();

  /* ============ FİKSTÜR ============ */
  // /api/football/matches?league=39&season=2024
  router.get('/matches', async (req, res) => {
    try {
      const params = { next: 10 };           // yaklaşan / son 10
      if (req.query.league) params.league = req.query.league;
      if (req.query.season) params.season = req.query.season;

      const api = await axios.get(FIX_URL, {
        params,
        headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY }
      });

      const rows = api.data.response.map(fx => ({
        id   : fx.fixture.id,
        home : fx.teams.home.name,
        away : fx.teams.away.name,
        date : fx.fixture.date,
        score: `${fx.goals.home ?? '-'} - ${fx.goals.away ?? '-'}`
      }));

      res.json(rows);
    } catch (e) {
      console.error('[matches ERR]', e.response?.data || e.message);
      res.status(500).json({ msg: 'api-fetch error' });
    }
  });

  /* ============ PUAN DURUMU ============ */
  // /api/football/standings?league=203&season=2023
  router.get('/standings', async (req, res) => {
    try {
      const league = req.query.league || 203;   // varsayılan Süper Lig
      const season = req.query.season || 2023;

      const api = await axios.get(STAND_URL, {
        params : { league, season },
        headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY }
      });

      const resp = api.data.response;

      /* Ücretsiz planda bazı liglerde dolu gelmez → boş dizi döndür */
      if (!Array.isArray(resp) || !resp.length ||
          !resp[0].league.standings.length) {
        return res.json([]);        // front-end boş tablo gösterir
      }

      const table = resp[0].league.standings[0];   // API formatı

      const tbl = table.map(r => ({
        rank   : r.rank,
        team   : r.team.name,
        played : r.all.played,
        win    : r.all.win,
        draw   : r.all.draw,
        lose   : r.all.lose,
        points : r.points,
        goals_for     : r.goals?.for      ?? 0,
        goals_against : r.goals?.against  ?? 0
        }));


      res.json(tbl);
    } catch (e) {
      console.error('[standings ERR]', e.response?.data || e.message);
      res.status(500).json({ msg: 'api-fetch error' });
    }
  });

  return router;
};
