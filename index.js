require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const dbPool = require('./dbPool');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));
app.use(morgan('combined'));

const validate = rules => [
  ...rules,
  (req, res, next) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json(errs.array());
    next();
  }
];

app.post(
  '/register',
  validate([body('username').isLength({ min: 3 }), body('password').isLength({ min: 6 })]),
  async (req, res) => {
    try {
      const { username, password } = req.body;
      const pool = await dbPool;
      const dup = await pool.request()
        .input('u', sql.NVarChar, username)
        .query('SELECT 1 FROM Users WHERE username=@u');
      if (dup.recordset.length) return res.status(409).json({ msg: 'User already exists' });

      const hash = await bcrypt.hash(password, 10);
      await pool.request()
        .input('u', sql.NVarChar, username)
        .input('p', sql.NVarChar, hash)
        .query('INSERT INTO Users(username,password) VALUES(@u,@p)');

      res.status(201).json({ msg: 'Registration successful' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ msg: 'Register error' });
    }
  }
);

app.post(
  '/login',
  validate([body('username').notEmpty(), body('password').notEmpty()]),
  async (req, res) => {
    try {
      const { username, password } = req.body;
      const pool = await dbPool;
      const rs = await pool.request()
        .input('u', sql.NVarChar, username)
        .query('SELECT * FROM Users WHERE username=@u');
      const user = rs.recordset[0];
      if (!user || !(await bcrypt.compare(password, user.password)))
        return res.status(401).json({ msg: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id, username }, process.env.JWT_SECRET, { expiresIn: '2h' });
      res.json({ token });
    } catch (e) {
      console.error(e);
      res.status(500).json({ msg: 'Login error' });
    }
  }
);

const footballRouter = require('./routes/football');
app.use('/api/football', footballRouter);
app.use('/api/favorites', require('./routes/favorites')(dbPool));
app.use('/api/team-fav', require('./routes/team-fav')(dbPool));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running → http://localhost:${PORT}`));
