const express = require('express');
const axios   = require('axios');
const sql     = require('mssql');

const SPORT   = 'football';
const API_URL = 'https://v3.football.api-sports.io/fixtures';
const TTL_MIN = 15;

module.exports = (dbPool)=>{
  const router = express.Router();

  router.get('/matches', async (_req,res)=>{
    try{
      const pool = await dbPool;

      /* Cache */
      const cached = await pool.request()
        .input('sport',sql.NVarChar,SPORT)
        .query(`
          SELECT api_id,home,away,[date],score
          FROM Matches
          WHERE sport=@sport
            AND DATEDIFF(MINUTE,date_fetched,GETDATE()) < ${TTL_MIN}
          ORDER BY [date] DESC`);
      if(cached.recordset.length) return res.json(cached.recordset);

      /* API */
      const api = await axios.get(API_URL,{
        params : { next: 10 },
        headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY }
      });

      const rows = api.data.response.map(fx=>({
        sport : SPORT,
        api_id: fx.fixture.id,
        home  : fx.teams.home.name,
        away  : fx.teams.away.name,
        date  : fx.fixture.date,
        score : `${fx.goals.home ?? '-'} - ${fx.goals.away ?? '-'}`
      }));

      /* DB güncelle */
      await pool.request()
        .input('sport',sql.NVarChar,SPORT)
        .query('DELETE FROM Matches WHERE sport=@sport');

      const tbl = new sql.Table('Matches');
      tbl.columns.add('sport',        sql.NVarChar(20));
      tbl.columns.add('api_id',       sql.Int);
      tbl.columns.add('home',         sql.NVarChar(100));
      tbl.columns.add('away',         sql.NVarChar(100));
      tbl.columns.add('date',         sql.DateTime2);
      tbl.columns.add('score',        sql.NVarChar(20));
      tbl.columns.add('date_fetched', sql.DateTime2);

      const now = new Date();
      rows.forEach(r=>tbl.rows.add(r.sport,r.api_id,r.home,r.away,r.date,r.score,now));
      await pool.request().bulk(tbl);

      res.json(rows);
    }catch(e){console.error(e);res.status(500).json({msg:'football route error'});}
  });

  return router;
};
