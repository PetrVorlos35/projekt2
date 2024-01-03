const express = require('express');
const xlsx = require('xlsx');
const cors = require('cors');

// Function to read spreadsheet and parse the needed columns
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

const players = readSpreadsheet('players.xlsx'); // Ensure the spreadsheet is in the same directory as your app.js

const app = express();
app.use(cors());

// ... Rest of the server code will go here
// Define the search endpoint
app.get('/search', (req, res) => {
    const searchTerm = req.query.term ? req.query.term.toLowerCase() : '';
    const filteredPlayers = players.filter(player =>
      player.Player.toLowerCase().includes(searchTerm)
    );
    res.json(filteredPlayers);
  });

  // ... Rest of the server code

// Define the random player selection endpoint
app.get('/random', (req, res) => {
    const randomIndex = Math.floor(Math.random() * players.length);
    const randomPlayer = players[randomIndex];
    console.log('Randomly selected player:', randomPlayer);
    res.json(randomPlayer);
  });
  
  
  // ... Rest of the server code
  
  
  // Set the port and start the server
  const PORT = 3000; // You can use any available port
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  