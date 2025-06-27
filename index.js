require('dotenv').config();                 // .env kökte

const express  = require('express');
const cors     = require('cors');
const sql      = require('mssql');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const app = express();

/* ---------- Middleware ---------- */
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

/* ---------- MSSQL ---------- */
const dbPool = new sql.ConnectionPool({
  user    : process.env.DB_USER,
  password: process.env.DB_PASS,
  server  : process.env.DB_SERVER,          // Örn: localhost\SQLEXPRESS
  database: process.env.DB_NAME,
  options : { trustServerCertificate: true }
}).connect();

/* ---------- Helper ---------- */
const validate = (rules)=>[...rules,(req,res,next)=>{
  const errs = validationResult(req);
  if(!errs.isEmpty()) return res.status(400).json(errs.array());
  next();
}];

/* ---------- AUTH ---------- */
app.post('/register',
  validate([
    body('username').isLength({min:3}),
    body('password').isLength({min:6})
  ]),
  async (req,res)=>{
    try{
      const {username,password} = req.body;
      const pool = await dbPool;

      const dup = await pool.request()
        .input('u',sql.NVarChar,username)
        .query('SELECT 1 FROM Users WHERE username=@u');
      if(dup.recordset.length) return res.status(409).json({msg:'Kullanıcı var'});

      const hash = await bcrypt.hash(password,10);
      await pool.request()
        .input('u',sql.NVarChar,username)
        .input('p',sql.NVarChar,hash)
        .query('INSERT INTO Users(username,password) VALUES(@u,@p)');

      res.status(201).json({msg:'Kayıt başarılı'});
    }catch(e){console.error(e);res.status(500).json({msg:'Register error'});}
});

app.post('/login',
  validate([
    body('username').notEmpty(),
    body('password').notEmpty()
  ]),
  async (req,res)=>{
    try{
      const {username,password}=req.body;
      const pool = await dbPool;

      const rs = await pool.request()
        .input('u',sql.NVarChar,username)
        .query('SELECT * FROM Users WHERE username=@u');
      const user = rs.recordset[0];

      if(!user || !(await bcrypt.compare(password,user.password)))
        return res.status(401).json({msg:'Hatalı bilgi'});

      const token = jwt.sign(
        {id:user.id,username},
        process.env.JWT_SECRET,
        {expiresIn:'2h'}
      );
      res.json({token});
    }catch(e){console.error(e);res.status(500).json({msg:'Login error'});}
});

/* ---------- Spor route’ları ---------- */
const football   = require('./routes/football')(dbPool);
const basketball = require('./routes/basketball')(dbPool);
const volleyball = require('./routes/volleyball')(dbPool);

app.use('/api/football',   football);
app.use('/api/basketball', basketball);
app.use('/api/volleyball', volleyball);

/* ---------- Server ---------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Server up → http://localhost:${PORT}`));


const favRoute = require('./routes/favorites')(dbPool);
app.use('/api/favorites', favRoute);
