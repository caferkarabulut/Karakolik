const express = require('express');
const sql = require('mssql');

module.exports = (dbPool) => {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const pool = await dbPool;
    const rs = await pool.request().query('SELECT * FROM Favorites');
    res.json(rs.recordset);
  });

  router.post('/', async (req, res) => {
    const { fixture_id, home, away, date, score } = req.body;
    const pool = await dbPool;
    await pool.request()
      .input('fid', sql.Int, fixture_id)
      .input('h', sql.NVarChar(100), home)
      .input('a', sql.NVarChar(100), away)
      .input('d', sql.DateTime2, date)
      .input('s', sql.NVarChar(20), score)
      .query('INSERT INTO Favorites(fixture_id,home,away,date,score) VALUES(@fid,@h,@a,@d,@s)');
    res.status(201).json({ msg: 'Added to favorites' });
  });

  router.delete('/:id', async (req, res) => {
    const pool = await dbPool;
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Favorites WHERE fixture_id=@id');
    res.json({ msg: 'Removed from favorites' });
  });

  return router;
};
