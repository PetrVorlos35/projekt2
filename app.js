const express = require('express');
const xlsx = require('xlsx');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const jwtSecret = 'tajnyHeslo'; // Replace this with a real secret key


const app = express();
app.use(cookieParser());


app.use(express.static('public'));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'projekt3', 
  });
  
  db.connect((err) => {
    if (err) {
      console.error('Database connection failed: ' + err.stack);
      return;
    }
    console.log('Connected to the database');
  });
  
  app.use(bodyParser.urlencoded({ extended: true }));
  
  
app.post('/register', (req, res) => {
    const { username, password } = req.body;
  
    const sql = 'INSERT INTO Uzivatele (Username, Heslo) VALUES (?, ?)';
    db.query(sql, [username, password], (err, result) => {
        if (err) throw err;
        console.log('User registered successfully');
        res.redirect('/index.html');
    });
  });

  app.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    const sql = 'SELECT * FROM Uzivatele WHERE Username = ? AND Heslo = ?';
    db.query(sql, [username, password], (err, results) => {
      if (err) throw err;
  
      if (results.length > 0) {
        const token = jwt.sign({ username: username }, jwtSecret, { expiresIn: '1h' });
        
        // Set token in HTTP-only cookie
        res.cookie('token', token, { httpOnly: true, secure: true }); // use secure: true in production
        res.redirect('/index.html');
      } else {
        console.log('Incorrect Username and/or Password!');
        res.status(401).send('Incorrect Username and/or Password!');
      }
    });
});

app.get('/get-user-info', (req, res) => {
  const token = req.cookies.token; // Access the token from the HTTP-only cookie
  if (!token) {
      return res.status(401).send('No token provided');
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
          return res.status(500).send('Failed to authenticate token.');
      }

      // Send back user information. Adjust according to your token payload structure
      res.json({ username: decoded.username });
  });
});

app.get('/logout', (req, res) => {
  // Clear the cookie named 'token'
  res.clearCookie('token');
  
  // Optionally, redirect the user to the login page or home page after logging out
  res.redirect('/login.html');
});


const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.sendStatus(403); // Invalid token
    req.user = user;
    next();
  });
};

app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: "You have access to the protected data", user: req.user });
});


function readSpreadsheet(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);
  return data.map(player => ({
    No: player['No.'],
    Player: player.Player,
    Ht: player.Ht,
    Inches: player.Inches
  }));
}

const players = readSpreadsheet('public/players.xlsx'); 

app.use(cors());

app.get('/search', (req, res) => {
    const searchTerm = req.query.term ? req.query.term.toLowerCase() : '';
    const filteredPlayers = players.filter(player =>
      player.Player.toLowerCase().includes(searchTerm)
    );
    res.json(filteredPlayers);
  });

app.get('/random', (req, res) => {
    const randomIndex = Math.floor(Math.random() * players.length);
    const randomPlayer = players[randomIndex];
    console.log('Randomly selected player:', randomPlayer);
    res.json(randomPlayer);
  });

  

  const PORT = 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  