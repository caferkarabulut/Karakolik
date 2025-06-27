const express = require('express');
const axios   = require('axios');
const sql     = require('mssql');

const SPORT   = 'basketball';
const API_URL = 'https://v1.basketball.api-sports.io/games';
const TTL_MIN = 15;

module.exports = (dbPool)=>{
  const router = express.Router();

  router.get('/matches', async (_req,res)=>{
    try{
      const pool = await dbPool;

      const cached = await pool.request()
        .input('sport',sql.NVarChar,SPORT)
        .query(`
          SELECT api_id,home,away,[date],score
          FROM Matches
          WHERE sport=@sport
            AND DATEDIFF(MINUTE,date_fetched,GETDATE()) < ${TTL_MIN}`);
      if(cached.recordset.length) return res.json(cached.recordset);

      const api = await axios.get(API_URL,{
        params : { next: 10 },
        headers: { 'x-apisports-key': process.env.API_BASKET_KEY }
      });

      const rows = api.data.response.map(g=>({
        sport : SPORT,
        api_id: g.id,
        home  : g.teams.home.name,
        away  : g.teams.away.name,
        date  : g.date,
        score : `${g.scores.home ?? '-'} - ${g.scores.away ?? '-'}`
      }));

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
    }catch(e){console.error(e);res.status(500).json({msg:'basketball route error'});}
  });

  return router;
};
