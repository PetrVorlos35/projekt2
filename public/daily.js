
document.addEventListener('DOMContentLoaded', function() {
    async function fetchDailyPlayer() {
        try {
            const response = await fetch('/daily-player');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();

            // Store player details in variables
            window.randomPlayerName = data.player_name;
            window.randomPlayerTeam = data.team;
            window.randomPlayerDivision = data.division;
            window.randomPlayerConference = data.conference;
            window.randomPlayerPosition = data.position;
            window.randomPlayerHeight = data.height;
            window.randomPlayerNo = data.number;

            // document.getElementById('dailyPlayerName').textContent = data.player_name;

            // Check if the user has already guessed the daily player
            checkIfUserGuessed();
        } catch (error) {
            console.error('Error fetching daily player:', error);
            // document.getElementById('dailyPlayerName').textContent = 'Error loading player';
        }
    }
    
    
    

    function updateCountdown() {
        const now = new Date();
        const nextDay = new Date();
        nextDay.setHours(24, 0, 0, 0); 
    
        if (now > nextDay) {
            nextDay.setDate(nextDay.getDate() + 1); 
    
            if (!localStorage.getItem('pageRefreshed')) {
                localStorage.setItem('pageRefreshed', 'true'); 
                setTimeout(() => {
                    location.reload(); 
                }, 2000); 
                return;
            }
        } else {
            localStorage.removeItem('pageRefreshed'); 
        }
    
        const timeDiff = nextDay - now;
    
        const hours = Math.floor(timeDiff / 1000 / 60 / 60);
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
        document.getElementById('countdownTimer').textContent = `${hours}h ${minutes}m ${seconds}s`;
    }

    setInterval(updateCountdown, 1000);
    updateCountdown();
    fetchDailyPlayer();
});

let ID;
fetch('/get-user-info')
.then(response => {
    if (response.ok) {
        return response.json();
    }
})
.then(data => {
    ID = data.id;
})
.catch(error => {
    console.error('There has been a problem with your fetch operation:', error);
});


async function checkIfUserGuessed() {
    try {
        const response = await fetch(`/check-daily-guess?userId=${ID}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log(data);
        if (!data.continueGame) {
            disableGuessInput(data.data);
        }
    } catch (error) {
        console.error('Error checking if user guessed:', error);
    }
}

function disableGuessInput(data) {
    const searchBar = document.getElementById('searchBar');
    const guessBtn = document.getElementById('guessBtn');
    const popupBtn = document.getElementById('popupBtn');

    popupBtn.hidden = false;
    searchBar.disabled = true;
    guessBtn.disabled = true;
    guessBtn.hidden = true;

    searchBar.placeholder = 'You have already guessed the player for today';

    if (data) {
        const guesses = JSON.parse(data.guesses);
        fetchGuessedPlayers(guesses);
    }
}

async function fetchGuessedPlayers(guessedPlayers) {
    const apiKey = await getApiKey();
    const headers = {
        'Authorization': ` ${apiKey}`
    };

    const playerPromises = guessedPlayers.map(async (playerName) => {
        const nameSplit = playerName.split(" ");
        let playerFirstName = nameSplit[0];
        let playerLastName = nameSplit[1];

        const apiUrl = `https://api.balldontlie.io/v1/players/active?first_name=${playerFirstName}&last_name=${playerLastName}`;
        try {
            const response = await axios.get(apiUrl, { headers });
            if (response.status === 200 && response.data.data.length > 0) {
                return response.data.data[0];
            } else {
                console.log(`No player found with the name: ${playerName}`);
                return null;
            }
        } catch (error) {
            console.error('Error:', error);
            return null;
        }
    });

    const players = await Promise.all(playerPromises);

    const tableBody = document.getElementById('playerData');
    players.forEach(player => {
        if (player) {
            const row = tableBody.insertRow();
            row.className = 'player-row';
            row.insertCell(0).innerHTML = player.first_name + ' ' + player.last_name;
            row.insertCell(1).innerHTML = player.team.full_name;
            row.insertCell(2).innerHTML = player.team.conference;
            row.insertCell(3).innerHTML = player.team.division;
            row.insertCell(4).innerHTML = player.position;
            row.insertCell(5).innerHTML = player.height;
            row.insertCell(6).innerHTML = player.jersey_number;

            highlightComparison(player, row);

        }
    });
}

function highlightComparison(player, row) {
    const fullName = player.first_name + ' ' + player.last_name;
    if (fullName === window.randomPlayerName) {
        row.cells[0].style.backgroundColor = 'green';
        row.cells[0].style.color = 'white';
    }
    // Porovnání týmu
    if (player.team.full_name === window.randomPlayerTeam) {
        row.cells[1].style.backgroundColor = 'green';
        row.cells[1].style.color = 'white';
    }

    // Porovnání konference
    if (player.team.conference === window.randomPlayerConference) {
        row.cells[2].style.backgroundColor = 'green';
        row.cells[2].style.color = 'white';
    }

    // Porovnání divize
    if (player.team.division === window.randomPlayerDivision) {
        row.cells[3].style.backgroundColor = 'green';
        row.cells[3].style.color = 'white';
    }

    // Porovnání pozice
    if (window.randomPlayerPosition.includes(player.position) || player.position.includes(window.randomPlayerPosition)) {
        row.cells[4].style.backgroundColor = 'orange';
        row.cells[4].style.color = 'white';
    }
    if (window.randomPlayerPosition === player.position) {
        row.cells[4].style.backgroundColor = 'green';
        row.cells[4].style.color = 'white';
    }

    // Porovnání výšky
    if (window.randomPlayerHeight === player.height) {
        row.cells[5].style.backgroundColor = 'green';
        row.cells[5].style.color = 'white';
    } else {
        let difference = Math.abs(convertHeightToInches(player.height) - convertHeightToInches(window.randomPlayerHeight));
        if (difference <= 2) {
            row.cells[5].style.backgroundColor = 'orange';
            row.cells[5].style.color = 'white';
            row.cells[5].innerHTML += convertHeightToInches(player.height) < convertHeightToInches(window.randomPlayerHeight) ? '↑' : '↓';
        } else {
            row.cells[5].innerHTML += convertHeightToInches(player.height) < convertHeightToInches(window.randomPlayerHeight) ? '↑' : '↓';
        }
    }

    // Porovnání čísla dresu
    if (window.randomPlayerNo === player.jersey_number) {
        row.cells[6].style.backgroundColor = 'green';
        row.cells[6].style.color = 'white';
    } else {
        let difference = Math.abs(player.jersey_number - window.randomPlayerNo);
        if (difference <= 2) {
            row.cells[6].style.backgroundColor = 'orange';
            row.cells[6].style.color = 'white';
            row.cells[6].innerHTML += player.jersey_number < window.randomPlayerNo ? '↑' : '↓';
        } else {
            row.cells[6].innerHTML += player.jersey_number < window.randomPlayerNo ? '↑' : '↓';
        }
    }
}


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
  
                let currentFocus = -1; 
  
                suggestionsList.addEventListener('keydown', function(e) {
                    if (e.key === "ArrowDown") {
                        currentFocus++;
                        addActive(suggestionsList.querySelectorAll('li'));
                    } else if (e.key === "ArrowUp") {
                        currentFocus--;
                        addActive(suggestionsList.querySelectorAll('li'));
                    } else if (e.key === "Enter") {
                        e.preventDefault(); 
                        if (currentFocus > -1) {
                            suggestionsList.querySelectorAll('li')[currentFocus].click();
                        }
                    }
                });
  
                function addActive(li) {
                    if (!li) return;
                    removeActive(li);
                    if (currentFocus >= li.length) currentFocus = 0;
                    if (currentFocus < 0) currentFocus = li.length - 1;
                    li[currentFocus].classList.add('active');
                }
  
                function removeActive(li) {
                    for (let i = 0; i < li.length; i++) {
                        li[i].classList.remove('active');
                    }
                }
  
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

let guesses = 1;
let wonOrLost;
var userinput = document.getElementById("searchBar");
function getInput() {
    userinput.value = '';
    userinput.placeholder = `Guess ${guesses + 1} of 8`;
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

            guessedPlayers.push(playerName);

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

let guessedPlayers = [];

async function getApiKey() {
    try {
        const response = await fetch('http://localhost:3000/api-key');
        const data = await response.json();
        return data.apiKey;
    } catch (error) {
        console.error('Error fetching API key:', error);
    }
}

function saveDailyStats(userId, attempts, winLoss) {
    playAgainBtn.hidden = false;
    fetch(`/save-daily-stats?userId=${ID}&attempts=${attempts}&winLoss=${winLoss}&guesses=${encodeURIComponent(JSON.stringify(guessedPlayers))}`)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (winLoss == 1) {
                disableGuessInput();
            }
        })
        .catch(error => console.error('Error:', error));
}

var guessBtn = document.getElementById('guessBtn');

var playAgainBtn = document.getElementById('playAgainBtn');
playAgainBtn.hidden = true;

const popupBtn = document.getElementById('popupBtn');
popupBtn.hidden = true;

function convertHeightToInches(heightStr) {
    let [feet, inches] = heightStr.split('-').map(Number);
    return (feet * 12) + inches;
}


// Function to check if the guessed player matches the daily player
function checkWin(playerName, row, player, playerData) {
    console.log(randomPlayerName);
    console.log(playerName);
    if (randomPlayerName === playerName) {
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
        saveDailyStats(ID, guesses, 1);
        return true;
    } else {
        if (guesses < 8) {
            if (playerData.jersey_number === Number(randomPlayerNo)) {
                row.cells[6].style.backgroundColor = 'green';
                row.cells[6].style.color = 'white';
            }
            if (playerData.jersey_number !== Number(randomPlayerNo)) {
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
            if (randomPlayerHeight === playerData.height) {
                row.cells[5].style.backgroundColor = 'green';
                row.cells[5].style.color = 'white';
            }
            if (randomPlayerHeight !== playerData.height) {
                let difference = Math.abs(convertHeightToInches(playerData.height) - convertHeightToInches(randomPlayerHeight));
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
            if (randomPlayerPosition.includes(player.position) || player.position.includes(randomPlayerPosition)) {
                row.cells[4].style.backgroundColor = 'orange';
                row.cells[4].style.color = 'white';
            }
            if (randomPlayerPosition === player.position) {
                row.cells[4].style.backgroundColor = 'green';
                row.cells[4].style.color = 'white';
            }

            // Division
            if (player.team.division === randomPlayerDivision) {
                row.cells[3].style.backgroundColor = 'green';
                row.cells[3].style.color = 'white';
            }

            // Conference
            if (player.team.conference === randomPlayerConference) {
                row.cells[2].style.backgroundColor = 'green';
                row.cells[2].style.color = 'white';
            }

            // Team
            if (player.team.full_name === randomPlayerTeam) {
                row.cells[1].style.backgroundColor = 'green';
                row.cells[1].style.color = 'white';
            }
        } else {
            // lost(row);
        }
    }
}

// Function to handle the case when the user loses
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
    saveDailyStats(ID, guesses, 0);
}

// Function to toggle the popup display
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
    teamName.innerHTML = randomPlayerTeam;
    division.innerHTML = randomPlayerDivision;
    conference.innerHTML = randomPlayerConference;
    position.innerHTML = randomPlayerPosition;
    height.innerHTML = randomPlayerHeight;
    No.innerHTML = randomPlayerNo;
}
