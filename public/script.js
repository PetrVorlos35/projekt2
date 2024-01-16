document.getElementById('searchBar').addEventListener('input', function() {
    const searchTerm = this.value;
    if (searchTerm.length > 0) {
      fetch(`http://localhost:3000/search?term=${encodeURIComponent(searchTerm)}`)
        .then(response => response.json())
        .then(players => {
          const suggestionsList = document.getElementById('suggestions');
          suggestionsList.style.border = 'solid white';
          suggestionsList.innerHTML = players.map(player => `<li>${player.Player}</li>`).join('');

          suggestionsList.querySelectorAll('li').forEach(suggestion => {
            suggestion.addEventListener('click', function() {
              document.getElementById('searchBar').value = this.textContent;
              suggestionsList.innerHTML = ''; 
              suggestionsList.style.border = 'none';
            });
          });
        })
        .catch(error => console.error('Error:', error));
    } else {
      document.getElementById('suggestions').innerHTML = '';
      document.getElementById('suggestions').style.border = 'none';
    }
  });

  document.addEventListener('DOMContentLoaded', function() {
function getRandomPlayer() {
  fetch('http://localhost:3000/random')
    .then(response => response.json())
    .then(randomPlayer => {
        randomPlayerName = randomPlayer.Player;
      console.log(`Randomly selected player: ${randomPlayer.Player}, Number: ${randomPlayer.No}, Height: ${randomPlayer.Ht}`);
    })
    .catch(error => console.error('Error:', error));
}

getRandomPlayer();
});

var nameToFind = "";
const pageSize = 25;
let page = 1;
let foundPlayers = [];
let randomPlayerName;


let guesses = 1;
var userinput = document.getElementById("searchBar");
function getInput() {
    userinput.value = '';
    userinput.placeholder = `Guess ${guesses + 1} of 8`;
}

let height = '';
let No = '';
var guessBtn = document.getElementById('guessBtn')

function chechWin(playerName, row) {
    console.log(randomPlayerName);
    console.log(playerName);
    if (randomPlayerName == playerName) {
        guessBtn.disabled = true;
        userinput.disabled = true;
        userinput.placeholder = `Vyhrál jsi!! Počet pokusů: ${guesses}`;
        return true;
    }
}

function lost() {
  userinput.placeholder = `Prohrál jsi!`;
  guessBtn.disabled = true;
  serinput.disabled = true;
}

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
                const playerData = players[0];
                console.log(playerData.Ht, playerData.No, playerData.Player);
                height = playerData.Ht;
                No = playerData.No;
                row.insertCell(5).innerHTML = height;
                row.insertCell(6).innerHTML = No;
                getInput();
                if (guesses > 7) {
                  if(chechWin(playerName)){
                    return;
                  }else{
                    lost();
                    return alert("Konec hry, vyčerpal jsi pokusy");
                  }
                }else{
                  chechWin(playerName, row);
                  guesses++;
                }
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



