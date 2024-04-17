const express = require('express');
const xlsx = require('xlsx');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const jwtSecret = 'tajnyHeslo'; 


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

  app.get('/saveStats', (req, res) => {
    // Přečtení parametrů z query stringu
    const { userId, attempts, winLoss } = req.query;
  
    // Zde byste umístili logiku pro zpracování a ukládání dat do databáze
    console.log(`Ukládám statistiky pro uživatele ${userId}: pokusy = ${attempts}, výsledek = ${winLoss}`);

    const sql = 'CALL InsertStatistiky2(?, ?, ?)';
    db.query(sql, [userId, attempts, winLoss], (err, result) => {
      if (err) throw err;
      console.log('Stats saved successfully');
      // res.redirect('/index.html');
    });
  });


app.get('/statistiky', (req, res) => {
  const { userId } = req.query; 
  // console.log('Získávám statistiky pro uživatele s ID:', userId);
  const sql = `
    SELECT 
      UzivateleID,
      COUNT(*) AS PocetOdehranychHer,
      (SELECT CurrentWinStreak FROM Statistiky WHERE UzivateleID = S.UzivateleID ORDER BY ID DESC LIMIT 1) AS CurrentWinStreak,
      MAX(LongestWinStreak) AS LongestWinStreak,
      (SUM(VyhraProhra) / COUNT(*)) * 100 AS ProcentoVyhry
    FROM 
      Statistiky S
    WHERE 
      UzivateleID = ?;`;

  db.query(sql, [userId], (err, result) => {
    if (err) res.send(err);
    else res.json(result[0]);
  });
});

app.get('/vyhry', (req, res) => {
  const { userId } = req.query;
  // console.log('Získávám guess distribution pro uživatele s ID:', userId);


  const sql = `
    SELECT 
      PokusUhodnuti,
      COUNT(*) AS PocetVyhranychHer
    FROM 
      Statistiky
    WHERE 
      UzivateleID = ? AND VyhraProhra = 1
    GROUP BY 
      PokusUhodnuti
    ORDER BY 
      PokusUhodnuti;`;

  db.query(sql, [userId], (err, result) => {
    if (err) res.send(err);
    else res.json(result);
  });
});




  
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const sql = 'SELECT ID, Username FROM Uzivatele WHERE Username = ? AND Heslo = ?';
  db.query(sql, [username, password], (err, results) => {
      if (err) throw err;

      if (results.length > 0) {
          const user = results[0]; 
          const token = jwt.sign({ id: user.ID, username: user.Username }, jwtSecret, { expiresIn: '1h' });
      
          res.cookie('token', token, { httpOnly: true, secure: true }); 
          // Redirect with success message as a query parameter
          res.redirect('/index.html?success=1');
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

      // Send back user information, including the ID
      res.json({ id: decoded.id, username: decoded.username });
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

  app.get('/users', (req, res) => {
    db.query('SELECT * FROM Uzivatele', (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  });

  app.use(bodyParser.json()); // Ujistěte se, že tato řádka je přítomna
  
  app.post('/send-friend-request', (req, res) => {
    const sender_id = req.body.sender_id;
    const receiver_id = req.body.receiver_id;
    // console.log(req.body); 

    if (!sender_id || !receiver_id) {
      return res.status(400).send('Sender and receiver IDs are required.');
    }
  
    const sql = 'INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, ?)';
    db.query(sql, [sender_id, receiver_id, 'pending'], (err, result) => {
      if (err) {
        console.error('Error sending friend request:', err);
        return res.status(500).send('Error sending friend request.');
      }
      // console.log('Friend request sent successfully');
      res.status(200).send('Friend request sent successfully.');
    });
  });
  



  const PORT = 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  