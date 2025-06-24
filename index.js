const fishContainer = document.getElementById('fish-container');
const player1ScoreElem = document.getElementById('player1-score');
const player2ScoreElem = document.getElementById('player2-score');
const foodElem = document.getElementById('food');
const message = document.getElementById('message');

let roomName = 'multiplayer-fish-game';
let serverURL = 'wss://yourserver.com/web-rooms/';
let socket = new WebSocket(serverURL);
let clientId = null;
let player1Id = null;
let player2Id = null;
let player1Score = 0;
let player2Score = 0;
let foodPosition = { x: 0, y: 0 };
let fishPositions = {};

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
const audioFiles = ['blubb.wav', 'nomnom.wav', 'fail.wav', 'win.wav'];
const audioBuffers = [];

loadAudioFiles();

socket.addEventListener('open', () => {
  socket.send(JSON.stringify(['*enter-room*', roomName]));
  console.log("WebSocket connected");
});

socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  const cmd = data[0];

  switch (cmd) {
    case '*client-id*':
      clientId = data[1];
      if (player1Id === null) {
        player1Id = clientId;
      } else {
        player2Id = clientId;
      }
      break;

    case 'update':
      fishPositions = data[1];
      foodPosition = data[2];
      updateGame();
      break;

    case 'score':
      player1Score = data[1];
      player2Score = data[2];
      updateScores();
      break;

    case 'win':
      displayWinner(data[1]);
      break;
  }
});

function updateGame() {
  // Update fish positions and food position on the screen
  // Render fish and food based on fishPositions and foodPosition
}

function updateScores() {
  player1ScoreElem.innerText = `Player 1 Score: ${player1Score}`;
  player2ScoreElem.innerText = `Player 2 Score: ${player2Score}`;
}

function displayWinner(winnerId) {
  message.innerText = winnerId === player1Id ? "Player 1 Wins!" : "Player 2 Wins!";
  message.classList.remove("hidden");
}

function loadAudioFiles() {
  const promises = audioFiles.map((file, index) => {
    return fetch('sounds/' + file)
      .then(data => data.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(decodedAudio => {
        audioBuffers[index] = decodedAudio;
      });
  });

  return Promise.all(promises);
}

function playSound(index) {
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffers[index];
  source.connect(audioContext.destination);
  source.start(0);
}