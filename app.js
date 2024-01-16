const express = require('express');
const xlsx = require('xlsx');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();

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
        console.log('Login successful');
        res.redirect('/index.html');
      } else {
        console.log('Incorrect Username and/or Password!');
        res.send('Incorrect Username and/or Password! <button onclick="document.location=`login.html`">Back</button>');
      }
    });
  });

function readSpreadsheet(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);
  return data.map(player => ({
    No: player['No.'],
    Player: player.Player,
    Ht: player.Ht
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
  