const express = require('express');
const sql     = require('mssql');
const axios   = require('axios');
const jwt     = require('jsonwebtoken');

module.exports = (dbPool) => {
  const router = express.Router();

  // Auth middleware
  router.use((req, res, next) => {
    const tok = (req.headers.authorization || '').split(' ')[1];
    if (!tok) return res.sendStatus(401);
    try {
      req.user = jwt.verify(tok, process.env.JWT_SECRET);
      next();
    } catch {
      return res.sendStatus(401);
    }
  });

  // POST toggle favorite team
  router.post('/', async (req, res) => {
    const { team_id } = req.body;
    if (!team_id) return res.status(400).json({ msg:'team_id gerekli' });

    try {
      const pool = await dbPool;
      // insert/update Teams table if needed
      const have = await pool.request()
        .input('tid', sql.Int, team_id)
        .query('SELECT 1 FROM Teams WHERE id=@tid');
      if (!have.recordset.length) {
        const api = await axios.get(
          'https://v3.football.api-sports.io/teams',
          { params:{ids:team_id}, headers:{'x-apisports-key':process.env.API_FOOTBALL_KEY} }
        );
        const t = api.data.response[0]?.team;
        await pool.request()
          .input('i', sql.Int,           t.id)
          .input('n', sql.NVarChar(100), t.name)
          .input('l', sql.NVarChar(255), t.logo)
          .query('INSERT INTO Teams(id,name,logo) VALUES(@i,@n,@l)');
      }
      // toggle
      const r = await pool.request()
        .input('uid', sql.Int, req.user.id)
        .input('tid', sql.Int, team_id)
        .query(`
          IF EXISTS(SELECT 1 FROM TeamFavorites WHERE userId=@uid AND team_id=@tid)
            DELETE TeamFavorites WHERE userId=@uid AND team_id=@tid
          ELSE
            INSERT INTO TeamFavorites(userId,team_id) VALUES(@uid,@tid);
          SELECT @@ROWCOUNT AS rows;`);
      const added = r.recordset[0].rows === 1;
      res.status(added?201:200).json({ added });
    } catch (e) {
      console.error(e);
      res.status(500).json({ msg: 'team fav err' });
    }
  });

  // GET list favorites
  router.get('/', async (req, res) => {
    try {
      const pool = await dbPool;
      const fav  = await pool.request()
        .input('u', sql.Int, req.user.id)
        .query('SELECT team_id FROM TeamFavorites WHERE userId=@u');
      const ids = fav.recordset.map(r=>r.team_id);
      if (!ids.length) return res.json([]);

      const rows = await pool.request()
        .query(`SELECT id,name,logo FROM Teams WHERE id IN (${ids.join(',')})`);
      res.json(rows.recordset);
    } catch (e) {
      console.error(e);
      res.status(500).json({ msg: 'team fav list err' });
    }
  });

  return router;
};
