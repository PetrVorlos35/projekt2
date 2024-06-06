document.addEventListener('DOMContentLoaded', function () {
    let timer;
    let timeLeft = 120; // 2 minutes in seconds
    let guessedPlayers = [];
    let randomPlayerName, randomPlayerTeam, randomPlayerDivision, randomPlayerConference, randomPlayerPosition, randomPlayerHeight, randomPlayerNo;

    document.getElementById('startBtn').addEventListener('click', startGame);

    async function fetchRandomPlayer() {
        try {
            const response = await fetch('/get-random-player');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();

            console.log('Random player:', data);

            // Store player details in variables
            randomPlayerName = data.name;
            randomPlayerTeam = data.team;
            randomPlayerDivision = data.division;
            randomPlayerConference = data.conference;
            randomPlayerPosition = data.position;
            randomPlayerHeight = data.height;
            randomPlayerNo = data.number;
        } catch (error) {
            console.error('Error fetching random player:', error);
        }
    }

    async function startGame() {
        document.getElementById('searchBar').disabled = false;
        document.getElementById('guessBtn').disabled = false;
        document.getElementById('startBtn').disabled = true;
        
        await fetchRandomPlayer(); // Fetch the first random player
        timer = setInterval(updateTimer, 1000);
        document.getElementById('score').textContent = `Score: ${score}`;
    }

    function updateTimer() {
        if (timeLeft <= 0) {
            clearInterval(timer);
            endGame();
        } else {
            timeLeft--;
            document.getElementById('timer').textContent = `Time left: ${Math.floor(timeLeft / 60)}:${timeLeft % 60 < 10 ? '0' : ''}${timeLeft % 60}`;
        }
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

                if (checkWin(playerName, row, player)) {
                    await fetchRandomPlayer(); // Fetch a new random player if the guess is correct
                    clearTable(); // Clear the table
                }

                document.getElementById('searchBar').value = '';
            } else {
                console.log(`No player found with the name: ${playerName}`);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    let score = 0;


    function checkWin(playerName, row, playerData) {
        if (randomPlayerName === playerName) {
            Array.from(row.cells).forEach((cell) => {
                cell.style.backgroundColor = 'green';
                cell.style.color = 'white';
            });
            score++;
            document.getElementById('score').textContent = `Score: ${score}`;
            return true;
        } else {
            if (playerData.jersey_number === randomPlayerNo) {
                row.cells[6].style.backgroundColor = 'green';
                row.cells[6].style.color = 'white';
            } else {
                let difference = Math.abs(playerData.jersey_number - randomPlayerNo);
                if (difference <= 2) {
                    row.cells[6].style.backgroundColor = 'orange';
                    row.cells[6].style.color = 'white';
                    if (playerData.jersey_number < randomPlayerNo) {
                        row.cells[6].innerHTML += '↑';
                    } else {
                        row.cells[6].innerHTML += '↓';
                    }
                } else {
                    if (playerData.jersey_number < randomPlayerNo) {
                        row.cells[6].innerHTML += '↑';
                    } else {
                        row.cells[6].innerHTML += '↓';
                    }
                }
            }
            if (randomPlayerHeight === playerData.height) {
                row.cells[5].style.backgroundColor = 'green';
                row.cells[5].style.color = 'white';
            } else {
                let difference = Math.abs(playerData.height - randomPlayerHeight);
                if (difference <= 2) {
                    row.cells[5].style.backgroundColor = 'orange';
                    row.cells[5].style.color = 'white';
                    if (playerData.height < randomPlayerHeight) {
                        row.cells[5].innerHTML += '↑';
                    } else {
                        row.cells[5].innerHTML += '↓';
                    }
                } else {
                    if (playerData.height < randomPlayerHeight) {
                        row.cells[5].innerHTML += '↑';
                    } else {
                        row.cells[5].innerHTML += '↓';
                    }
                }
            }

            // Position
            if (randomPlayerPosition.includes(playerData.position) || playerData.position.includes(randomPlayerPosition)) {
                row.cells[4].style.backgroundColor = 'orange';
                row.cells[4].style.color = 'white';
            }
            if (randomPlayerPosition === playerData.position) {
                row.cells[4].style.backgroundColor = 'green';
                row.cells[4].style.color = 'white';
            }

            // Division
            if (playerData.team.division === randomPlayerDivision) {
                row.cells[3].style.backgroundColor = 'green';
                row.cells[3].style.color = 'white';
            }

            // Conference
            if (playerData.team.conference === randomPlayerConference) {
                row.cells[2].style.backgroundColor = 'green';
                row.cells[2].style.color = 'white';
            }

            // Team
            if (playerData.team.full_name === randomPlayerTeam) {
                row.cells[1].style.backgroundColor = 'green';
                row.cells[1].style.color = 'white';
            }
        }
        return false;
    }


    function clearTable() {
        const tableBody = document.getElementById('playerData');
        while (tableBody.firstChild) {
            tableBody.removeChild(tableBody.firstChild);
        }
    }

    function endGame() {
        document.getElementById('searchBar').disabled = true;
        document.getElementById('guessBtn').disabled = true;
        document.getElementById('suggestions').innerHTML = '';
        document.getElementById('searchBar').value = '';
        document.getElementById('score').textContent = `Score: ${score}`;
    
        Toastify({
            text: `Game Over! Your final score is ${score}.`,
            duration: 5000,
            close: true, 
            gravity: "top", 
            position: "center", 
            style: {
                background: "white",
                color: "#121827"
            },
            stopOnFocus: true, 
        }).showToast();
    
        saveGameStats(idUser, score);
    }
    

    async function saveGameStats(userId, correctGuesses) {
        try {
            const response = await fetch(`/save-rapid-stats?user_id=${userId}&correct_guesses=${correctGuesses}`, {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error('Failed to save game statistics');
            }
            const data = await response.json();
            console.log('Game statistics saved:', data);
        } catch (error) {
            console.error('Error saving game statistics:', error);
        }
    }
    
    

    async function getApiKey() {
        try {
            const response = await fetch('/api-key');
            const data = await response.json();
            return data.apiKey;
        } catch (error) {
            console.error('Error fetching API key:', error);
        }
    }

    document.getElementById('guessBtn').addEventListener('click', function () {
        fetchSinglePlayer(document.getElementById('searchBar').value);
    });

    document.getElementById('searchBar').addEventListener('input', async function() {
        const searchTerm = this.value.trim();
        if (searchTerm.length > 0) {
            const apiKey = await getApiKey();
            const headers = {
                'Authorization': ` ${apiKey}`
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

      function fetchLeaderboard() {
        fetch(`http://localhost:3000/rapid-leaderboard`)
            .then(response => response.json())
            .then(data => {
                const leaderboardData = document.getElementById("leaderboardData");
                leaderboardData.innerHTML = ''; // Clear previous data
    
                data.forEach((entry, index) => {
                    const row = leaderboardData.insertRow();
                    row.insertCell(0).textContent = index + 1;
                    row.insertCell(1).textContent = entry.Username;
                    row.insertCell(2).textContent = entry.correct_guesses;
                    row.insertCell(3).textContent = new Date(entry.game_date).toLocaleDateString();
    
                    // Center align the text in each cell
                    Array.from(row.cells).forEach(cell => {
                        cell.style.textAlign = 'center';
                    });
                });
            })
            .catch(error => console.error('Error:', error));
    }
    

    fetchLeaderboard();

});

