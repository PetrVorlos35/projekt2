const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const jwtSecret = 'tajnyHeslo'; 
const cron = require('node-cron');
const axios = require('axios');
const bcrypt = require('bcrypt');
const saltRounds = 10;
require('dotenv').config();


const app = express();
app.use(cookieParser());


app.use(express.static('public'));

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE, 
    port: process.env.DB_PORT
  });
  
  db.connect((err) => {
    if (err) {
      console.error('Database connection failed: ' + err.stack);
      return;
    }
    console.log('Connected to the database');
  });
  
  app.use(bodyParser.urlencoded({ extended: true }));
  

app.get('/api-key', (req, res) => {
  res.json({ apiKey: process.env.API_KEY });
});

async function getApiKey() {
  return process.env.API_KEY;
}

async function getRandomPlayer() {
  const apiKey = await getApiKey();
  const headers = {
      'Authorization': `${apiKey}`
  };

  const initialUrl = 'https://api.balldontlie.io/v1/players/active?per_page=25';
  try {
      const initialResponse = await axios.get(initialUrl, { headers });
      if (initialResponse.status === 200 && initialResponse.data.data.length > 0) {
          const totalPages = initialResponse.data.meta.total_pages;
          const randomPage = Math.floor(Math.random() * totalPages) + 1;

          const apiUrl = `https://api.balldontlie.io/v1/players/active?per_page=25&page=${randomPage}`;
          const response = await axios.get(apiUrl, { headers });
          if (response.status === 200 && response.data.data.length > 0) {
              const playersOnPage = response.data.data.length;
              const randomIndex = Math.floor(Math.random() * playersOnPage);
              const randomPlayer = response.data.data[randomIndex];

              const randomPlayerDetails = {
                  name: `${randomPlayer.first_name} ${randomPlayer.last_name}`,
                  team: randomPlayer.team.full_name,
                  division: randomPlayer.team.division,
                  conference: randomPlayer.team.conference,
                  position: randomPlayer.position,
                  height: randomPlayer.height,
                  number: randomPlayer.jersey_number || 'N/A'
              };

              console.log('Randomly selected player:', randomPlayerDetails);
              return randomPlayerDetails;
          } else {
              console.log('No players found on this page.');
          }
      } else {
          console.log('Failed to fetch player data.');
      }
  } catch (error) {
      console.error('Error:', error);
  }
  return null;
}

async function insertDailyPlayer() {
  const playerDetails = await getRandomPlayer();
  if (playerDetails) {
      const sql = 'INSERT INTO daily_players (player_name, team, division, conference, position, height, number) VALUES (?, ?, ?, ?, ?, ?, ?)';
      db.query(sql, [playerDetails.name, playerDetails.team, playerDetails.division, playerDetails.conference, playerDetails.position, playerDetails.height, playerDetails.number], (err, result) => {
          if (err) {
              console.error('Error saving daily player:', err);
          } else {
              // console.log('Daily player saved:', playerDetails);
          }
      });
  }
}

// Schedule a task to run every 24 hours
cron.schedule('0 12 * * *', async () => {
  await insertDailyPlayer();
});

// Generate a player immediately
// insertDailyPlayer();

// API endpoint to get a random player
app.get('/get-random-player', async (req, res) => {
  try {
      const randomPlayer = await getRandomPlayer();
      if (randomPlayer) {
          res.json(randomPlayer);
      } else {
          res.status(500).json({ error: 'Failed to fetch random player' });
      }
  } catch (error) {
      console.error('Error fetching random player:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});


// API endpoint to get the daily player
app.get('/daily-player', (req, res) => {
  const sql = 'SELECT id, player_name, team, division, conference, position, height, number FROM daily_players ORDER BY generated_at DESC LIMIT 1';
  db.query(sql, (err, result) => {
      if (err) return res.status(500).send({ error: 'Error fetching daily player' });
      if (result.length > 0) {
          res.json(result[0]);
      } else {
          res.json({ player_name: 'No player found for today' });
      }
  });
});

app.get('/save-daily-stats', (req, res) => {
  const { userId, attempts, winLoss, guesses } = req.query;

  console.log(`Ukládám denní statistiky pro uživatele ${userId}: pokusy = ${attempts}, výsledek = ${winLoss}, hádání = ${guesses}`);

  const sql = 'CALL InsertDailyStats(?, (SELECT id FROM daily_players ORDER BY generated_at DESC LIMIT 1), ?, ?, ?)';
  db.query(sql, [userId, attempts, winLoss, guesses], (err, result) => {
      if (err) return res.status(500).send('Error saving daily stats');
      res.json({ success: true });
  });
});

app.post('/save-rapid-stats', (req, res) => {
  const { user_id, correct_guesses } = req.query;

  if (!user_id || correct_guesses === undefined) {
      return res.status(400).send('User ID and correct guesses are required.');
  }

  const sql = 'INSERT INTO rapid_game_stats (user_id, correct_guesses) VALUES (?, ?)';
  db.query(sql, [user_id, correct_guesses], (err, result) => {
      if (err) {
          console.error('Error saving rapid game stats:', err);
          return res.status(500).send('Failed to save rapid game stats.');
      }
      res.status(200).send('Rapid game stats saved successfully.');
  });
});

app.get('/user-rapid-stats', (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
      return res.status(400).send('User ID is required.');
  }

  const sql = `
      SELECT 
          user_id,
          COUNT(*) AS games_played,
          SUM(correct_guesses) AS total_correct_guesses,
          MAX(correct_guesses) AS max_correct_guesses,
          AVG(correct_guesses) AS avg_correct_guesses
      FROM 
          rapid_game_stats
      WHERE 
          user_id = ?
      GROUP BY 
          user_id
  `;
  db.query(sql, [user_id], (err, results) => {
      if (err) {
          console.error('Error fetching user rapid stats:', err);
          return res.status(500).send('Failed to fetch user rapid stats.');
      }
      if (results.length > 0) {
          res.json(results[0]);
      } else {
          res.status(404).send('No stats found for this user.');
      }
  });
});

// Endpoint to get rapid game leaderboard
app.get('/rapid-leaderboard', (req, res) => {
  const sql = `
      SELECT 
          rgs.id AS game_id,
          rgs.user_id,
          u.Username,
          rgs.correct_guesses,
          rgs.game_date
      FROM 
          rapid_game_stats rgs
      JOIN 
          Uzivatele u ON rgs.user_id = u.ID
      ORDER BY 
          rgs.correct_guesses DESC
      LIMIT 10
  `;
  db.query(sql, (err, results) => {
      if (err) {
          console.error('Error fetching leaderboard:', err);
          return res.status(500).send('Failed to fetch leaderboard.');
      }
      res.json(results);
  });
});



// API endpoint to check if the user has already guessed the daily player
app.get('/check-daily-guess', (req, res) => {
  const { userId } = req.query;
  const sql = `
      SELECT *
      FROM daily_stats
      WHERE user_id = ? AND daily_player_id = (SELECT id FROM daily_players ORDER BY generated_at DESC LIMIT 1)
  `;
  db.query(sql, [userId], (err, result) => {
      if (err) return res.status(500).send({ error: 'Error checking daily guess' });

      if (result.length === 0) {
          console.log('User has not guessed the daily player yet');
          res.json({ continueGame: true });
      } else {
          res.json({ continueGame: false, data: result[0] });
      }
  });
});



  
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url} - Body:`, req.body);
  next();
});

app.post('/register', (req, res) => {
  const { username, password, email } = req.body;

  console.log('Received registration request:', { username, email });

  if (!username || !password || !email) {
    console.error('Missing required fields:', { username, password, email });
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Kontrola, zda uživatelské jméno nebo email již nejsou používány
  const checkSql = 'SELECT Username, Email FROM Uzivatele WHERE Username = ? OR Email = ?';
  db.query(checkSql, [username, email], (err, results) => {
    if (err) {
      console.error('Database error during check:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length > 0) {
      let errorMessage = '';
      let field = '';

      if (results[0].Username === username) {
        errorMessage = 'Username is already in use';
        field = 'username';
      } else if (results[0].Email === email) {
        errorMessage = 'Email is already in use';
        field = 'email';
      }

      console.log('Validation error:', errorMessage);
      return res.status(400).json({ message: errorMessage, field: field });
    } else {
      console.log('Proceeding to hash password');

      // Hashování hesla před vložením uživatele do databáze
      bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) {
          console.error('Error hashing password:', err);
          return res.status(500).json({ message: 'Server error' });
        }

        console.log('Password hashed successfully:', hashedPassword);

        // Vložení nového uživatele s hashovaným heslem
        const insertSql = 'INSERT INTO Uzivatele (Username, Heslo, Email) VALUES (?, ?, ?)';
        db.query(insertSql, [username, hashedPassword, email], (err, result) => {
          if (err) {
            console.error('Database error during insert:', err);
            return res.status(500).json({ message: 'Server error' });
          }

          console.log('User registered successfully');
          // Vrátíme JSON odpověď místo přesměrování
          return res.status(200).json({ success: true, redirectUrl: '/login.html' });
        });
      });
    }
  });
});







  app.get('/saveStats', (req, res) => {
    const { userId, attempts, winLoss } = req.query;
  
    console.log(`Ukládám statistiky pro uživatele ${userId}: pokusy = ${attempts}, výsledek = ${winLoss}`);

    const sql = 'CALL InsertStatistiky2(?, ?, ?)';
    db.query(sql, [userId, attempts, winLoss], (err, result) => {
      if (err) throw err;
      console.log('Stats saved successfully');
    });
  });

  const storage = multer.memoryStorage();
  const upload = multer({ storage: storage });

app.post('/upload-profile-picture', upload.single('profilePhoto'), (req, res) => {
  const file = req.file;
  if (!file) {
      return res.status(400).send('No file uploaded.');
  }

  const userId = req.query.userId; 
  const sql = 'UPDATE Uzivatele SET ProfilePicture = ? WHERE ID = ?';
  db.query(sql, [file.buffer, userId], (err, result) => {
      if (err) {
          console.error('Database update failed', err);
          return res.status(500).send('Failed to update user profile.');
      }
      res.send('Profile updated successfully!');
  });
});

app.get('/profile-picture', (req, res) => {
  const userId = req.query.userId;
  const sql = 'SELECT ProfilePicture FROM Uzivatele WHERE ID = ?';
  db.query(sql, [userId], (err, result) => {
      if (err) {
          console.error('Error fetching profile picture:', err);
          return res.status(500).send('Error fetching profile picture.');
      }
      if (result[0] && result[0].ProfilePicture) {
          res.set('Content-Type', 'image/jpeg');
          res.send(result[0].ProfilePicture);
      } else {
          res.sendFile('/Users/petrvorel35/projekt2/public/defaultpfp.png', { headers: { 'Content-Type': 'image/png' } });
      }
  });
});



app.get('/statistiky', (req, res) => {
  const { userId } = req.query; 
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

app.get('/dailyStats', (req, res) => {
  const { userId } = req.query; 
  const sql = `
    SELECT 
      user_id,
      COUNT(*) AS PocetOdehranychHer,
      (SELECT CurrentWinStreak FROM daily_stats WHERE user_id = DS.user_id ORDER BY id DESC LIMIT 1) AS CurrentWinStreak,
      MAX(LongestWinStreak) AS LongestWinStreak,
      (SUM(win_loss) / COUNT(*)) * 100 AS ProcentoVyhry
    FROM 
      daily_stats DS
    WHERE 
      user_id = ?;`;

  db.query(sql, [userId], (err, result) => {
    if (err) res.send(err);
    else res.json(result[0]);
  });
});

app.get('/vyhry', (req, res) => {
  const { userId } = req.query;


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


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

  
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const sql = 'SELECT ID, Username, Email, Heslo FROM Uzivatele WHERE Username = ?';
  db.query(sql, [username], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (results.length > 0) {
      const user = results[0];
      const storedPassword = user.Heslo;

      // Funkce pro ověření hesla
      const verifyPassword = (inputPassword, storedPassword) => {
        // Zkusíme porovnat heslo jako hashované (bcrypt)
        bcrypt.compare(inputPassword, storedPassword, (err, isMatch) => {
          if (err) {
            return res.status(500).json({ message: 'Internal server error' });
          }

          if (isMatch) {
            // Generate JWT token
            const token = jwt.sign({ id: user.ID, username: user.Username, email: user.Email }, jwtSecret, { expiresIn: '1h' });

            // Set token as a cookie
            res.cookie('token', token, { httpOnly: true, secure: true });
            return res.status(200).json({ success: true });
          } else {
            // Pokud bcrypt neporovnal úspěšně, zkusíme přímé porovnání
            if (inputPassword === storedPassword) {
              // Vygenerujeme JWT token
              const token = jwt.sign({ id: user.ID, username: user.Username, email: user.Email }, jwtSecret, { expiresIn: '1h' });

              // Nastavení tokenu jako cookie
              res.cookie('token', token, { httpOnly: true, secure: true });
              return res.status(200).json({ success: true });
            } else {
              return res.status(401).json({ message: 'Incorrect Username and/or Password!' });
            }
          }
        });
      };

      // Ověření hesla
      verifyPassword(password, storedPassword);

    } else {
      res.status(401).json({ message: 'Incorrect Username and/or Password!' });
    }
  });
});




app.get('/friend_info', (req, res) => {
  const { userId } = req.query;
  const sql = 'SELECT Username, Email FROM Uzivatele WHERE ID = ?';
  db.query(sql, [userId], (err, result) => {
    if (err) res.send(err + 'Error fetching friend info');
    else res.json(result[0]);
  }
  );
});

app.get('/get-user-info', (req, res) => {
  const token = req.cookies.token; 
  if (!token) {
      return res.status(401).send('No token provided');
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
          return res.status(500).send('Failed to authenticate token.');
      }

      res.json({ id: decoded.id, username: decoded.username , email: decoded.email});
  });
});


app.get('/logout', (req, res) => {
  res.clearCookie('token');
  
  res.redirect('/login.html');
});


const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.sendStatus(403); 
    req.user = user;
    next();
  });
};

app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: "You have access to the protected data", user: req.user });
});


app.use(cors());


  app.get('/users', (req, res) => {
    const userId = req.query.user_id;  
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    const query = `
        SELECT * FROM Uzivatele WHERE ID NOT IN (
            SELECT receiver_id FROM friend_requests WHERE sender_id = ? AND status IN ('pending', 'accepted')
            UNION
            SELECT sender_id FROM friend_requests WHERE receiver_id = ? AND status IN ('pending', 'accepted')
        )
    `;
    db.query(query, [userId, userId], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});


app.use(bodyParser.json()); 

  
  app.post('/send-friend-request', (req, res) => {
    const sender_id = req.body.sender_id;
    const receiver_id = req.body.receiver_id;

    if (!sender_id || !receiver_id) {
      return res.status(400).send('Sender and receiver IDs are required.');
    }
  
    const sql = 'INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, ?)';
    db.query(sql, [sender_id, receiver_id, 'pending'], (err, result) => {
      if (err) {
        console.error('Error sending friend request:', err);
        return res.status(500).send('Error sending friend request.');
      }
      res.status(200).send('Friend request sent successfully.');
    });
  });
  
  app.post('/accept-friend-request', (req, res) => {
    const sender_id = req.body.sender_id;
    const receiver_id = req.body.receiver_id;
  
    if (!sender_id || !receiver_id) {
      return res.status(400).send('Sender and receiver IDs are required.');
    }
  
    const sql = 'UPDATE friend_requests SET status = "accepted" WHERE sender_id = ? AND receiver_id = ?';
    db.query(sql, [sender_id, receiver_id], (err, result) => {
      if (err) {
        console.error('Error accepting friend request:', err);
        return res.status(500).send('Error accepting friend request.');
      }
      res.status(200).send('Friend request accepted successfully.');
    });
  });

  app.post('/reject-friend-request', (req, res) => {
    const sender_id = req.body.sender_id;
    const receiver_id = req.body.receiver_id;
  
    if (!sender_id || !receiver_id) {
      return res.status(400).send('Sender and receiver IDs are required.');
    }
  
    const sql = 'UPDATE friend_requests SET status = "declined" WHERE sender_id = ? AND receiver_id = ?';
    db.query(sql, [sender_id, receiver_id], (err, result) => {
      if (err) {
        console.error('Error rejecting friend request:', err);
        return res.status(500).send('Error rejecting friend request.');
      }
      res.status(200).send('Friend request rejected successfully.');
    });
  });

  app.post('/remove-friend', (req, res) => {
    const user_id = req.body.user_id;
    const friend_id = req.body.friend_id;
  
    if (!user_id || !friend_id) {
      return res.status(400).send('User and friend IDs are required.');
    }
  
    const sql = 'DELETE FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)';
    db.query(sql, [user_id, friend_id, friend_id, user_id], (err, result) => {
      if (err) {
        console.error('Error removing friend:', err);
        return res.status(500).send('Error removing friend.');
      }
      res.status(200).send('Friend removed successfully.');
    });
  });

  app.get('/show-friend-requests', (req, res) => {
    const receiver_id = req.query.receiver_id;

    if (!receiver_id) {
      return res.status(400).send('Receiver ID is required.');
    }

    const sql = "SELECT u.id, u.Username, fr.created_at FROM ( SELECT u.Username, MIN(fr.id) AS min_id FROM friend_requests AS fr JOIN Uzivatele AS u ON u.ID = fr.sender_id WHERE fr.receiver_id = ? AND fr.status = 'pending' GROUP BY u.Username ) AS sub JOIN friend_requests AS fr ON fr.id = sub.min_id JOIN Uzivatele AS u ON u.ID = fr.sender_id;";
    db.query(sql, [receiver_id], (err, results) => {
      if (err) {
        console.error('Error fetching friend requests:', err);
        return res.status(500).send('Error fetching friend requests.');
      }
      res.json(results);
    });
  });

  app.get('/show-friends', (req, res) => {
    const user_id = req.query.user_id;
  
    if (!user_id) {
      return res.status(400).send('User ID is required.');
    }
  
    const sql = 'SELECT u.id, u.Username FROM Uzivatele AS u JOIN ( SELECT sender_id AS id FROM friend_requests WHERE receiver_id = ? AND status = "accepted" UNION SELECT receiver_id AS id FROM friend_requests WHERE sender_id = ? AND status = "accepted" ) AS sub ON u.id = sub.id;';
    db.query(sql, [user_id, user_id], (err, results) => {
      if (err) {
        console.error('Error fetching friends:', err);
        return res.status(500).send('Error fetching friends.');
      }
      res.json(results);
    });
  });




  const PORT = 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  