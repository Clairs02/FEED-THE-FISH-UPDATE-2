const fishContainer = document.getElementById('fish-container');
const player1Fish = document.getElementById('player1-fish');
const player2Fish = document.getElementById('player2-fish');
const food = document.getElementById('food');
const player1ScoreElem = document.getElementById('player1-score');
const player2ScoreElem = document.getElementById('player2-score');
const message = document.getElementById('message');

let player1Score = 0;
let player2Score = 0;
let player1Position = { x: 0, y: 0 };
let player2Position = { x: 0, y: 0 };
let foodPosition = { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight };

function updateGame() {
  player1Fish.style.transform = `translate(${player1Position.x}px, ${player1Position.y}px)`;
  player2Fish.style.transform = `translate(${player2Position.x}px, ${player2Position.y}px)`;
  food.style.transform = `translate(${foodPosition.x}px, ${foodPosition.y}px)`;

  checkCollision();
}

function checkCollision() {
  const player1Rect = player1Fish.getBoundingClientRect();
  const player2Rect = player2Fish.getBoundingClientRect();
  const foodRect = food.getBoundingClientRect();

  if (isColliding(player1Rect, foodRect)) {
    player1Score++;
    player1ScoreElem.innerText = player1Score;
    resetFood();
    playSound('nomnom');
  }

  if (isColliding(player2Rect, foodRect)) {
    player2Score++;
    player2ScoreElem.innerText = player2Score;
    resetFood();
    playSound('nomnom');
  }

  if (isColliding(player1Rect, player2Rect)) {
    player1Score--;
    player2Score--;
    player1ScoreElem.innerText = player1Score;
    player2ScoreElem.innerText = player2Score;
    playSound('fail');
  }

  checkWinner();
}

function isColliding(rect1, rect2) {
  return !(rect1.right < rect2.left || 
           rect1.left > rect2.right || 
           rect1.bottom < rect2.top || 
           rect1.top > rect2.bottom);
}

function resetFood() {
  foodPosition = { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight };
}

function checkWinner() {
  if (player1Score >= 5) {
    displayWinner(1);
  } else if (player2Score >= 5) {
    displayWinner(2);
  }
}

function displayWinner(player) {
  message.innerText = `Player ${player} Wins!`;
  message.classList.remove("hidden");
  resetGame();
}

function resetGame() {
  player1Score = 0;
  player2Score = 0;
  player1ScoreElem.innerText = player1Score;
  player2ScoreElem.innerText = player2Score;
  resetFood();
}

function playSound(sound) {
  const audio = new Audio(`sounds/${sound}.wav`);
  audio.play();
}

setInterval(updateGame, 100);