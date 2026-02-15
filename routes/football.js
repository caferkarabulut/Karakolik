const express = require('express');
const axios = require('axios');

const FIX_URL = 'https://v3.football.api-sports.io/fixtures';
const STAND_URL = 'https://v3.football.api-sports.io/standings';

const router = express.Router();

router.get('/matches', async (req, res) => {
  try {
    const params = { next: 10 };
    if (req.query.league) params.league = req.query.league;
    if (req.query.season) params.season = req.query.season;

    const api = await axios.get(FIX_URL, {
      params,
      headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY }
    });

    const rows = api.data.response.map(fx => ({
      id: fx.fixture.id,
      home: fx.teams.home.name,
      away: fx.teams.away.name,
      date: fx.fixture.date,
      score: `${fx.goals.home ?? '-'} - ${fx.goals.away ?? '-'}`
    }));

    res.json(rows);
  } catch (e) {
    console.error('[football/matches]', e.response?.data || e.message);
    res.status(500).json({ msg: 'API fetch error' });
  }
});

router.get('/standings', async (req, res) => {
  try {
    const league = req.query.league || 203;
    const season = req.query.season || 2024;

    const api = await axios.get(STAND_URL, {
      params: { league, season },
      headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY }
    });

    const table = (api.data.response[0]?.league?.standings[0] || []).map(r => ({
      rank: r.rank,
      team: r.team.name,
      team_id: r.team.id,
      played: r.all.played,
      win: r.all.win,
      draw: r.all.draw,
      lose: r.all.lose,
      goals_for: r.all.goals.for,
      goals_against: r.all.goals.against,
      points: r.points
    }));

    res.json(table);
  } catch (e) {
    console.error('[football/standings]', e.response?.data || e.message);
    res.status(500).json({ msg: 'API fetch error' });
  }
});

module.exports = router;
