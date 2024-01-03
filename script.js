document.getElementById('searchBar').addEventListener('input', function() {
    const searchTerm = this.value;
    if (searchTerm.length > 0) {
      fetch(`http://localhost:3000/search?term=${encodeURIComponent(searchTerm)}`)
        .then(response => response.json())
        .then(players => {
          const suggestionsList = document.getElementById('suggestions');
          suggestionsList.innerHTML = players.map(player => `<li>${player.Player}</li>`).join('');

          // Add click event listener to suggestions list items
          suggestionsList.querySelectorAll('li').forEach(suggestion => {
            suggestion.addEventListener('click', function() {
              document.getElementById('searchBar').value = this.textContent;
              suggestionsList.innerHTML = ''; // Clear the suggestions list
            });
          });
        })
        .catch(error => console.error('Error:', error));
    } else {
      document.getElementById('suggestions').innerHTML = '';
    }
  });

  // Add event listener for the "Random Player" button
  document.addEventListener('DOMContentLoaded', function() {
// Wrap your code in a function
function getRandomPlayer() {
  fetch('http://localhost:3000/random')
    .then(response => response.json())
    .then(randomPlayer => {
      console.log(`Randomly selected player: ${randomPlayer.Player}, Number: ${randomPlayer.No}, Height: ${randomPlayer.Ht}`);
    })
    .catch(error => console.error('Error:', error));
}

// Call the function when the page loads
getRandomPlayer();
});

// const axios = require('axios');

var nameToFind = "";
const pageSize = 25;
let page = 1;
let foundPlayers = [];


function getInput() {
    var userinput = document.getElementById("searchBar").value;
    // foundPlayers = [];
    // page = 1;
    // nameToFind = userinput; 

    // console.log(nameToFind);

    return userinput;
}

let height = '';
let No = '';

async function fetchSinglePlayer(playerName) {
    const apiUrl = `https://www.balldontlie.io/api/v1/players?search=${playerName}&per_page=1`;
    
    


    
    try {
      const response = await axios.get(apiUrl);
      if (response.status === 200) {
        const player = response.data.data[0];
  
        if (player) {
          const playerId = player.id;
          const averagesResponse = await axios.get(`https://www.balldontlie.io/api/v1/season_averages?season=2023&player_ids[]=${playerId}`);
  
          if (averagesResponse.status === 200) {
            const playerAverages = averagesResponse.data.data;
  
            if (playerAverages.length > 0) {
              const playerWithAverages = {
                player: player,
                averages: playerAverages,
              };

            
  
              console.log(playerWithAverages);
  
              // You can also update your HTML table here if needed.
              const tableBody = document.getElementById('playerData');
            const row = tableBody.insertRow();
            row.insertCell(0).innerHTML = player.first_name + ' ' + player.last_name;
            row.insertCell(1).innerHTML = player.team.full_name;
            row.insertCell(2).innerHTML = player.team.conference;
            row.insertCell(3).innerHTML = player.team.division;
            row.insertCell(4).innerHTML = player.position;
            fetch(`http://localhost:3000/search?term=${playerName}`)
            .then(response => response.json())
            .then(players => {
                if (Array.isArray(players) && players.length > 0) {
                const playerData = players[0]; // Access the first (and only) object in the array
                console.log(playerData.Ht, playerData.No, playerData.Player);
                height = playerData.Ht;
                No = playerData.No;
                row.insertCell(5).innerHTML = height;
                row.insertCell(6).innerHTML = No;
                } else {
                console.log('No player data found.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
            

  
            } else {
              console.log(`No season averages found for player: ${playerName}`);
            }
          } else {
            console.log(`Failed to retrieve season averages. Status code: ${averagesResponse.status}`);
          }
        } else {
          console.log(`No player found with the name: ${playerName}`);
        }
      } else {
        console.log(`Failed to retrieve player data. Status code: ${response.status}`);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }