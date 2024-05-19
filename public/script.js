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
        randomPlayerNo = randomPlayer.No;
        randomPlayerHeight = randomPlayer.Inches;
        rndStats = randomPlayerStats(randomPlayerName);
      console.log(`Randomly selected player: ${randomPlayer.Player}, Number: ${randomPlayer.No}, Height: ${randomPlayer.Ht}, Inches: ${randomPlayer.Inches}`);
    })
    .catch(error => console.error('Error:', error));
    

}

getRandomPlayer();
});

async function getApiKey() {
  try {
    const response = await fetch('http://localhost:3000/api-key');
    const data = await response.json();
    return data.apiKey;
  } catch (error) {
    console.error('Error fetching API key:', error);
  }
}

async function randomPlayerStats(playerName) {

  var nameSplit = playerName.split(" ");
    let playerFirstName = nameSplit[0];
    let playerLastName = nameSplit[1];

    const apiUrl = `https://api.balldontlie.io/v1/players?first_name=${playerFirstName}&last_name=${playerLastName}&per_page=1`;

  try {
    const apiKey = await getApiKey();
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': ` ${apiKey}`
      }
    });
    if (response.status === 200 && response.data.data.length > 0) {
      const player = response.data.data[0];
      const playerId = player.id;
      const averagesResponse = await axios.get(`https://api.balldontlie.io/v1/season_averages?season=2023&player_ids[]=${playerId}`, {
        headers: {
          'Authorization': ` ${apiKey}`
        }
      });

      if (averagesResponse.status === 200 && averagesResponse.data.data.length > 0) {
        const playerAverages = averagesResponse.data.data[0];
        rndPosition = player.position;
        rndDivision = player.team.division;
        rndConf = player.team.conference;
        rndTeam = player.team.full_name;
        return {
          player: player,
          averages: playerAverages,
          position: player.position,
          division: player.team.division,
          conference: player.team.conference,
          teamName: player.team.full_name
        };
      }
    }
  } catch (error) {
    console.error("Error while fetching player stats: ", error);
  }
  return null;
}

var nameToFind = "";
const pageSize = 25;
let page = 1;
let foundPlayers = [];
let randomPlayerName;
let randomPlayerNo;
let randomPlayerHeight;
let rndPosition;
let rndDivision;
let rndConf;
let rndTeam;
var rndStats;


let guesses = 1;
let wonOrLost;
var userinput = document.getElementById("searchBar");
function getInput() {
    userinput.value = '';
    userinput.placeholder = `Guess ${guesses + 1} of 8`;
}

let height = '';
let No = '';
var guessBtn = document.getElementById('guessBtn')

var playAgainBtn = document.getElementById('playAgainBtn');
playAgainBtn.hidden = true;

const popupBtn = document.getElementById('popupBtn');
popupBtn.hidden = true;

function chechWin(playerName, row, player, playerData) {
    console.log(randomPlayerName);
    console.log(playerName);
    if (randomPlayerName == playerName) {
      Array.from(row.cells).forEach((cell) => {
        cell.style.backgroundColor = 'green';
        cell.style.color = 'white';
      });
      guessBtn.disabled = true;
      guessBtn.hidden = true;
      popupBtn.hidden = false;
      userinput.disabled = true;
      userinput.placeholder = `You won!! Guesses: ${guesses}`;
      wonOrLost = 1;
      saveStats(idUser, guesses, 1);
      return true;
    }else{
      if (guesses < 8) {
        if (playerData.No == randomPlayerNo) {
          row.cells[6].style.backgroundColor = 'green';
          row.cells[6].style.color = 'white';
        }
        if (playerData.No != randomPlayerNo){
          difference = Math.abs(playerData.No - randomPlayerNo);
          if (difference <= 2) {
            row.cells[6].style.backgroundColor = 'orange';
            row.cells[6].style.color = 'white';
            if (playerData.No < randomPlayerNo) {
              row.cells[6].innerHTML += '↑';
            }else{
              row.cells[6].innerHTML += '↓';
            }
          }else{
            if (playerData.No < randomPlayerNo) {
              row.cells[6].innerHTML += '↑';
            }else{
              row.cells[6].innerHTML += '↓';
            }
          }
        }
        if (randomPlayerHeight == playerData.Inches) {
          row.cells[5].style.backgroundColor = 'green';
          row.cells[5].style.color = 'white';
        }
        if (randomPlayerHeight != playerData.Inches) {
          difference = Math.abs(playerData.Inches - randomPlayerHeight);
          if (difference <= 2) {
            row.cells[5].style.backgroundColor = 'orange';
            row.cells[5].style.color = 'white';
            if (playerData.Inches < randomPlayerHeight) {
              row.cells[5].innerHTML += '↑';
            }else{
              row.cells[5].innerHTML += '↓';
            }
          }else{
            if (playerData.Inches < randomPlayerHeight) {
              row.cells[5].innerHTML += '↑';
            }else{
              row.cells[5].innerHTML += '↓';
            }
          }
        }

        // pozice
        if (rndPosition.includes(player.position) || player.position.includes(rndPosition)) {
          row.cells[4].style.backgroundColor = 'orange';
          row.cells[4].style.color = 'white';
        }
        console.log(rndPosition);
        if(rndPosition == player.position){
          row.cells[4].style.backgroundColor = 'green';
          row.cells[4].style.color = 'white';
        }

        // divize
        if (player.team.division == rndDivision) {
          row.cells[3].style.backgroundColor = 'green';
          row.cells[3].style.color = 'white';
        }

        // konference
        if (player.team.conference == rndConf) {
          row.cells[2].style.backgroundColor = 'green';
          row.cells[2].style.color = 'white';
        }

        if (player.team.full_name == rndTeam) {
          row.cells[1].style.backgroundColor = 'green';
          row.cells[1].style.color = 'white';
        }
      }else{
        return false;
      }
    }
}

function lost(row) {
  userinput.placeholder = `You lost!`;
  guessBtn.disabled = true;
  guessBtn.hidden = true;
  popupBtn.hidden = false;
  userinput.disabled = true;
  Array.from(row.cells).forEach((cell) => {
    cell.style.backgroundColor = 'red';
    cell.style.color = 'white';
  });
  wonOrLost = 0;
  saveStats(idUser, guesses, 0);
}

function inchesToFeetAndInches(inches) {
  var feet = Math.floor(inches / 12);
  var remainingInches = inches % 12;
  return [feet, remainingInches];
}

function togglePopup() {
  const popup = document.getElementById('popup');
  popup.classList.toggle('hidden');
  const winPlayer = document.getElementById('playerName');
  const winLossText = document.getElementById('winLoss');
  const teamName = document.getElementById('team');
  const division = document.getElementById('division');
  const conference = document.getElementById('conference');
  const position = document.getElementById('position');
  const height = document.getElementById('height');
  const No = document.getElementById('number');

  let convertion = inchesToFeetAndInches(randomPlayerHeight);

  
  winPlayer.innerHTML = randomPlayerName;
  winLossText.innerHTML = wonOrLost === 1 ? 'You won!' : 'You lost!';
  teamName.innerHTML = rndTeam;
  division.innerHTML = rndDivision;
  conference.innerHTML = rndConf;
  position.innerHTML = rndPosition;
  height.innerHTML = convertion[0] + " ft" + " " + convertion[1] + " in";
  No.innerHTML = randomPlayerNo;
}

function saveStats(userId, attempts, winLoss) {
  togglePopup();
  playAgainBtn.hidden = false;
  popupBtn.hidden = false;
  fetch(`http://localhost:3000/saveStats?userId=${userId}&attempts=${attempts}&winLoss=${winLoss}`)
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));  
}





  async function fetchSinglePlayer(playerName) {
    const apiKey = await getApiKey();
    const headers = {
        'Authorization': ` ${apiKey}`
    };

    var nameSplit = playerName.split(" ");
    let playerFirstName = nameSplit[0];
    let playerLastName = nameSplit[1];

    const apiUrl = `https://api.balldontlie.io/v1/players?first_name=${playerFirstName}&last_name=${playerLastName}&per_page=1`;
    try {
        const response = await axios.get(apiUrl, { headers });
        if (response.status === 200 && response.data.data.length > 0) {
            const player = response.data.data[0];
            const playerId = player.id;
            const averagesUrl = `https://api.balldontlie.io/v1/season_averages?season=2023&player_ids[]=${playerId}`;
            const averagesResponse = await axios.get(averagesUrl, { headers });

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
                    row.className = 'player-row';
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
                  if(chechWin(playerName, row, player, playerData)){
                    return;
                  }else{
                    lost(row);
                  }
                }else{
                  chechWin(playerName, row, player, playerData);
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
    } catch (error) {
        console.error('Error:', error);
    }
}

