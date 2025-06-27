const express = require('express');
const sql = require('mssql');
const jwt = require('jsonwebtoken');

module.exports = (dbPool)=>{
  const router = express.Router();

  // Token doğrulama middleware
  router.use((req,res,next)=>{
    const auth = req.headers.authorization || '';
    const token = auth.split(' ')[1];
    if(!token) return res.sendStatus(401);
    try{
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    }catch(e){ return res.sendStatus(401); }
  });

  router.post('/', async (req,res)=>{
    const {matchId} = req.body;
    try{
      const pool = await dbPool;
      await pool.request()
        .input('u',sql.Int,req.user.id)
        .input('m',sql.Int,matchId)
        .query('INSERT INTO Favorites(userId,matchId) VALUES(@u,@m)');
      res.json({msg:'Eklendi'});
    }catch(e){ console.error(e); res.status(500).json({msg:'fav err'}); }
  });

  router.get('/', async (req,res)=>{
    const pool = await dbPool;
    const rs = await pool.request()
      .input('u',sql.Int,req.user.id)
      .query(`
        SELECT f.id,m.home,m.away,m.date,m.score
        FROM Favorites f
        JOIN Matches m ON m.id=f.matchId
        WHERE f.userId=@u`);
    res.json(rs.recordset);
  });

/* ... mevcut kodun altına ekle ... */
router.delete('/:id', async (req, res) => {
  const favId = parseInt(req.params.id);
  try {
    const pool = await dbPool;
    const rows = await pool.request()
      .input('fid', sql.Int, favId)
      .input('uid', sql.Int, req.user.id)
      .query('DELETE FROM Favorites WHERE id=@fid AND userId=@uid');
    if (rows.rowsAffected[0] === 0) return res.sendStatus(404);
    res.json({ msg: 'Silindi' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'fav delete err' });
  }
});


  return router;
};
