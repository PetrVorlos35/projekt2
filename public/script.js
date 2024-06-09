document.getElementById('searchBar').addEventListener('input', async function() {
  const searchTerm = this.value.trim();
  if (searchTerm.length > 0) {
      const apiKey = await getApiKey();
      const headers = {
          'Authorization': `${apiKey}`
      };

      const apiUrl = `https://api.balldontlie.io/v1/players/active?search=${encodeURIComponent(searchTerm)}`;
      try {
          const response = await axios.get(apiUrl, { headers });
          if (response.status === 200) {
              const players = response.data.data;
              const suggestionsList = document.getElementById('suggestions');
              suggestionsList.innerHTML = players.map(player => `<li tabindex="0">${player.first_name} ${player.last_name}</li>`).join('');

              document.querySelectorAll('#suggestions li').forEach(item => {
                  item.addEventListener('click', function() {
                      document.getElementById('searchBar').value = this.textContent.trim();
                      suggestionsList.innerHTML = '';
                  });
              });
          }
      } catch (error) {
          console.error('Error:', error);
      }
  } else {
      document.getElementById('suggestions').innerHTML = '';
  }
});



document.addEventListener('DOMContentLoaded', function() {
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

                  randomPlayerName = `${randomPlayer.first_name} ${randomPlayer.last_name}`;
                  randomPlayerNo = randomPlayer.jersey_number || "N/A";
                  randomPlayerHeight = randomPlayer.height || "N/A"; 
                  rndStats = await randomPlayerStats(randomPlayerName);

                  console.log(`Randomly selected player: ${randomPlayerName}, Number: ${randomPlayerNo}, Height: ${randomPlayerHeight}`);
              } else {
                  console.log('No players found on this page.');
              }
          } else {
              console.log('Failed to fetch player data.');
          }
      } catch (error) {
          console.error('Error:', error);
      }
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

  const apiUrl = `https://api.balldontlie.io/v1/players/active?first_name=${playerFirstName}&last_name=${playerLastName}&per_page=1`;

  try {
      const apiKey = await getApiKey();
      const response = await axios.get(apiUrl, {
          headers: {
              'Authorization': ` ${apiKey}`
          }
      });
      if (response.status === 200 && response.data.data.length > 0) {
          const player = response.data.data[0];
          rndPosition = player.position;
          rndDivision = player.team.division;
          rndConf = player.team.conference;
          rndTeam = player.team.full_name;
          abbreviation = player.team.abbreviation;
          return {
              player: player,
              position: player.position,
              division: player.team.division,
              conference: player.team.conference,
              teamName: player.team.full_name
          };
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
let abbreviation;
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
var guessBtn = document.getElementById('guessBtn');

var playAgainBtn = document.getElementById('playAgainBtn');
playAgainBtn.hidden = true;

const popupBtn = document.getElementById('popupBtn');
popupBtn.hidden = true;

function convertHeightToInches(heightStr) {
    let [feet, inches] = heightStr.split('-').map(Number);
    return (feet * 12) + inches;
}

function checkWin(playerName, row, player, playerData) {
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
  } else {
      if (guesses < 8) {
          if (playerData.jersey_number == Number(randomPlayerNo)) {
              row.cells[6].style.backgroundColor = 'green';
              row.cells[6].style.color = 'white';
          }
          if (playerData.jersey_number != Number(randomPlayerNo)) {
              let difference = Math.abs(playerData.jersey_number - Number(randomPlayerNo));
              if (difference <= 2) {
                  row.cells[6].style.backgroundColor = 'orange';
                  row.cells[6].style.color = 'white';
                  if (playerData.jersey_number < Number(randomPlayerNo)) {
                      row.cells[6].innerHTML += '↑';
                  } else {
                      row.cells[6].innerHTML += '↓';
                  }
              } else {
                  if (playerData.jersey_number < Number(randomPlayerNo)) {
                      row.cells[6].innerHTML += '↑';
                  } else {
                      row.cells[6].innerHTML += '↓';
                  }
              }
          }
          if (randomPlayerHeight == playerData.height) {
              row.cells[5].style.backgroundColor = 'green';
              row.cells[5].style.color = 'white';
          }
          if (randomPlayerHeight != playerData.height) {
              let difference = Math.abs(convertHeightToInches(playerData.height) - convertHeightToInches(randomPlayerHeight));
            //   console.log(convertHeightToInches(playerData.height));
            //   console.log(convertHeightToInches(randomPlayerHeight));
            //   console.log(difference);
              if (difference <= 2) {
                  row.cells[5].style.backgroundColor = 'orange';
                  row.cells[5].style.color = 'white';
                  if (convertHeightToInches(playerData.height) < convertHeightToInches(randomPlayerHeight)) {
                      row.cells[5].innerHTML += '↑';
                  } else {
                      row.cells[5].innerHTML += '↓';
                  }
              } else {
                  if (convertHeightToInches(playerData.height) < convertHeightToInches(randomPlayerHeight)) {
                      row.cells[5].innerHTML += '↑';
                  } else {
                      row.cells[5].innerHTML += '↓';
                  }
              }
          }

          // Position
          if (rndPosition.includes(player.position) || player.position.includes(rndPosition)) {
              row.cells[4].style.backgroundColor = 'orange';
              row.cells[4].style.color = 'white';
          }
          console.log(rndPosition);
          if (rndPosition == player.position) {
              row.cells[4].style.backgroundColor = 'green';
              row.cells[4].style.color = 'white';
          }

          // Division
          if (player.team.division == rndDivision) {
              row.cells[3].style.backgroundColor = 'green';
              row.cells[3].style.color = 'white';
          }

          // Conference
          if (player.team.conference == rndConf) {
              row.cells[2].style.backgroundColor = 'green';
              row.cells[2].style.color = 'white';
          }

          // Team
          if (player.team.full_name == rndTeam) {
              row.cells[1].style.backgroundColor = 'green';
              row.cells[1].style.color = 'white';
          }
      } else {
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

  winPlayer.innerHTML = randomPlayerName;
  winLossText.innerHTML = wonOrLost === 1 ? 'You won!' : 'You lost!';
  teamName.innerHTML = abbreviation;
  division.innerHTML = rndDivision;
  conference.innerHTML = rndConf;
  position.innerHTML = rndPosition;
  height.innerHTML = randomPlayerHeight;
  No.innerHTML = randomPlayerNo;
}

function saveStats(userId, attempts, winLoss) {
  togglePopup();
  playAgainBtn.hidden = false;
  popupBtn.hidden = false;
  fetch(`http://localhost:3000/saveStats?userId=${userId}&attempts=${attempts}&winLoss=${winLoss}`)
      .then(response => response.json())
      .then(data => console.log(data))
}

async function fetchSinglePlayer(playerName) {
  const apiKey = await getApiKey();
  const headers = {
      'Authorization': ` ${apiKey}`
  };

  var nameSplit = playerName.split(" ");
  let playerFirstName = nameSplit[0];
  let playerLastName = nameSplit[1];

  const apiUrl = `https://api.balldontlie.io/v1/players/active?first_name=${playerFirstName}&last_name=${playerLastName}&per_page=1`;
  try {
      const response = await axios.get(apiUrl, { headers });
      if (response.status === 200 && response.data.data.length > 0) {
          const player = response.data.data[0];

          console.log(player);

          const tableBody = document.getElementById('playerData');
          const row = tableBody.insertRow();
          row.className = 'player-row';
          row.insertCell(0).innerHTML = player.first_name + ' ' + player.last_name;
          row.insertCell(1).innerHTML = player.team.full_name;
          row.insertCell(2).innerHTML = player.team.conference;
          row.insertCell(3).innerHTML = player.team.division;
          row.insertCell(4).innerHTML = player.position;
          row.insertCell(5).innerHTML = player.height;
          row.insertCell(6).innerHTML = player.jersey_number;

          getInput();

          if (guesses > 7) {
              if (checkWin(playerName, row, player, player)) {
                  return;
              } else {
                  lost(row);
              }
          } else {
              checkWin(playerName, row, player, player);
              guesses++;
          }

      } else {
          console.log(`No player found with the name: ${playerName}`);
      }
  } catch (error) {
      console.error('Error:', error);
  }
}
