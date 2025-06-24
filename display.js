const indexElem = document.getElementById('client-index');
const fishContainer = document.getElementById('fish-container');

const roomName = 'feed-the-fish';
const serverURL = 'wss://nosch.uber.space/web-rooms/';
const socket = new WebSocket(serverURL);
let clientId = null;
let clientCount = 0;

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
const audioFiles = ['background.wav'];
const audioBuffers = [];

const numRows = 7;
const numFishes = 2 * numRows;
const fishes = [];
const freeFishIds = [];
const fishByClientId = new Map();
const maxPoints = 5;
let pointDisplay = null;

document.addEventListener("click", async () => {
  await requestWebAudio();
  loopSound(0, 0.4, 4);
}, { once: true });

createFishes();
loadAudioFiles();
createPointDisplay();

const message = document.createElement("div");
message.id = "message";
message.className = "hidden";
fishContainer.appendChild(message);

const food = document.createElement("div");
food.classList.add('food');
food.style.width = "18px";
food.style.height = "12px";
food.style.borderRadius = "50% / 40%";
food.style.backgroundColor = "brown";
food.style.position = "absolute";
food.style.zIndex = "5";
fishContainer.appendChild(food);

let foodVX = 12;
let foodVY = 6;
let foodInterval = null;
let foodX = Math.random() * (fishContainer.offsetWidth - 18);
let foodY = Math.random() * (fishContainer.offsetHeight - 100);
food.style.left = foodX + "px";
food.style.top = foodY + "px";

function createFishes() {
  for (let i = 0; i < numFishes / 2; i++) {
    const rowElem = document.createElement('div');
    rowElem.id = `row-${i + 1}`;
    rowElem.classList.add('fish-row');
    fishContainer.appendChild(rowElem);

    for (let j = 0; j < 2; j++) {
      const fishIndex = 2 * i + j;
      const isLeft = !j;
      const side = isLeft ? 'left' : 'right';

      const fishElem = document.createElement('div');
      fishElem.classList.add('fish');
      fishElem.classList.add(side);
      fishElem.classList.add('swim');
      fishElem.style.animationDuration = `${0.6 + 0.4 * Math.random()}s`;
      rowElem.appendChild(fishElem);

      const fishImage = document.createElement('img');
      fishImage.classList.add('fish-image');
      fishImage.alt = `Fisch ${i + 1}`;
      fishImage.src = `images/${side}-fish.png`;
      fishElem.appendChild(fishImage);

      const fishNumber = document.createElement('div');
      fishNumber.classList.add('fish-number');
      fishNumber.innerText = fishIndex + 1;
      fishElem.appendChild(fishNumber);

      const fish = {
        id: fishIndex,
        clientId: null,
        element: fishElem,
        image: fishImage,
        position: 0,
        direction: 0,
        points: 0,
      };

      fishes.push(fish);
      freeFishIds.push(fishIndex);
    }
  }
}

function stopAllFish() {
  for (let fish of fishes) {
    fish.direction = 0;
  }
}

function resetAllFish() {
  for (let fish of fishes) {
    fish.position = 0;
    fish.direction = 0;
    fish.points = 0;
    fish.element.classList.remove('dance');
    fish.image.classList.remove('mirrored');
    updatePoints(fish.id);
  }

  socket.send(JSON.stringify(['*broadcast-message*', ['reset']]));
}

function getFish(clientId) {
  let fish = null;

  if (freeFishIds.length > 0) {
    const fishId = freeFishIds.shift();

    fish = fishes[fishId];
    fish.clientId = clientId;
    fishByClientId.set(clientId, fish);
  }

  return fish;
}

function releaseFish(clientId) {
  const fish = fishByClientId.get(clientId);

  if (fish !== null) {
    fish.clientId = null;
    fish.position = 0;
    fish.points = 0;
    fish.image.classList.remove('mirrored');

    fishByClientId.delete(clientId);
    freeFishIds.push(fish.id);
    updatePoints(fish.id);
  }
}

function createPointDisplay() {
  pointDisplay = document.createElement("div");
  pointDisplay.className = "point-display";

  for (let i = 1; i <= numFishes; i++) {
    const cell = document.createElement("div");
    const label = document.createElement("div");
    label.textContent = i;
    label.style.color = "white";
    label.style.marginBottom = "2px";
    cell.appendChild(label);
    const row = document.createElement("div");
    row.style.display = "flex";

    for (let j = 0; j < maxPoints; j++) {
      const circle = document.createElement("div");
      circle.classList.add('point-circle');
      circle.style.width = "10px";
      circle.style.height = "10px";
      circle.style.borderRadius = "50%";
      circle.style.border = "1px solid brown";
      circle.style.margin = "1px";
      circle.style.backgroundColor = "transparent";
      row.appendChild(circle);
    }
    cell.appendChild(row);
    pointDisplay.appendChild(cell);
  }

  fishContainer.appendChild(pointDisplay);
}

function moveFood() {
  const minX = 100;
  const minY = 0;
  const maxX = fishContainer.offsetWidth - food.offsetWidth - 100;
  const maxY = numRows * 100;

  foodX = minX + Math.random() * (maxX - minX);
  foodY = minY + Math.random() * (maxY - minY);

  food.style.left = foodX + "px";
  food.style.top = foodY + "px";
  foodVX = 10 + Math.random() * 5;
  foodVY = 4 + Math.random() * 4;
}

function animateFood() {
  let x = foodX;
  let y = foodY;

  foodInterval = setInterval(() => {
    const minX = 100;
    const minY = 0;
    const maxX = fishContainer.offsetWidth - food.offsetWidth - 100;
    const maxY = numRows * 100;

    foodVX += (Math.random() - 0.5) * 2;
    foodVY += (Math.random() - 0.5) * 2;
    foodVX = Math.max(Math.min(foodVX, 12), -12);
    foodVY = Math.max(Math.min(foodVY, 8), -8);

    if (x <= minX) foodVX = Math.abs(foodVX);
    if (x >= maxX) foodVX = -Math.abs(foodVX);
    if (y <= minY) foodVY = Math.abs(foodVY);
    if (y >= maxY) foodVY = -Math.abs(foodVY);

    x += foodVX;
    y += foodVY;
    x = Math.max(0, Math.min(maxX, x));
    y = Math.max(0, Math.min(maxY, y));
    food.style.left = x + "px";
    food.style.top = y + "px";

    for (let i = 0; i < numFishes; i++) {
      const fish = fishes[i];

      if (checkCollision(fish.image, food)) {
        fish.points++;
        socket.send(JSON.stringify(['*send-message*', fish.clientId, ['nomnom', fish.points]]));

        food.classList.add('hidden');
        clearInterval(foodInterval);

        updatePoints(i);

        if (fish.points === maxPoints) {
          socket.send(JSON.stringify(['*broadcast-message*', ['win', fish.id]]));
          stopAllFish();
          showMessageAndRestart(fish.id);
          fish.element.classList.add('dance');
        } else {
          showMessageAndRestart();
        }
      }
    }
  }, 16);
}

function showMessageAndRestart(winningFishId = null) {
  message.textContent = (winningFishId === null) ? "Feed the Fish!" : `Fish ${winningFishId + 1} wins!`;
  message.classList.remove("hidden");

  const delay = (winningFishId === null) ? 1500 : 5000;

  setTimeout(() => {
    if (winningFishId !== null) {
      resetAllFish();
    }

    message.classList.add("hidden");
    food.classList.remove('hidden');
    animateFood();
  }, delay);
}

function updatePoints(index) {
  const fish = fishes[index];
  const display = pointDisplay.children[index];
  const circles = display.querySelectorAll('.point-circle');

  for (let i = 0; i < maxPoints; i++) {
    if (i < fish.points) {
      circles[i].style.backgroundColor = "brown";
    } else {
      circles[i].style.backgroundColor = "transparent";
    }
  }

  return (fish.points === 2) ? index : null;
}

function createBubble() {
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.style.left = Math.random() * window.innerWidth + "px";
  bubble.style.width = 5 + Math.random() * 10 + "px";
  bubble.style.height = bubble.style.width;
  bubble.style.bottom = "-20px";
  document.body.appendChild(bubble);
  let y = 0;
  const speed = 0.5 + Math.random();
  const interval = setInterval(() => {
    y += speed;
    bubble.style.bottom = y + "px";
    if (y > window.innerHeight + 20) {
      clearInterval(interval);
      bubble.remove();
    }
  }, 30);
}

setInterval(() => {
  if (document.visibilityState === "visible") createBubble();
}, 500);

let lastTime = performance.now();
requestAnimationFrame(onAnimationFrame);

function onAnimationFrame() {
  const time = performance.now();
  const dT = time - lastTime;
  const pPx = dT * 0.5; // pixels per millisecond

  for (let i = 0; i < fishes.length / 2; i++) {
    const leftFishIndex = 2 * i;
    const rightFishIndex = leftFishIndex + 1;
    const leftFish = fishes[leftFishIndex];
    const rightFish = fishes[rightFishIndex];

    const nextLeftPos = Math.max(0, leftFish.position + (leftFish.direction * pPx));
    leftFish.element.style.left = `${nextLeftPos}px`;
    leftFish.position = nextLeftPos;

    const nextRightPos = Math.max(0, rightFish.position + (rightFish.direction * pPx));
    rightFish.element.style.right = `${nextRightPos}px`;
    rightFish.position = nextRightPos;

    if (checkCollision(leftFish.element, rightFish.element)) {
      if (leftFish.direction !== 0) {
        if (leftFish.points > 0) {
          leftFish.points--;
        }

        socket.send(JSON.stringify(['*send-message*', leftFish.clientId, ['collision', leftFish.points]]));

        leftFish.position = 0;
        leftFish.element.style.left = 0;
        leftFish.image.classList.remove('mirrored');
      }

      if (rightFish.direction !== 0) {
        if (rightFish.points > 0) {
          rightFish.points--;
        }

        socket.send(JSON.stringify(['*send-message*', rightFish.clientId, ['collision', rightFish.points]]));

        rightFish.position = 0;
        rightFish.element.style.right = 0;
        rightFish.image.classList.remove('mirrored');
      }

      updatePoints(leftFishIndex);
      updatePoints(rightFishIndex);
    } else {
      if (leftFish.pos === 0) {
        leftFish.image.classList.remove('mirrored');
      }

      if (rightFish.pos === 0) {
        rightFish.image.classList.remove('mirrored');
      }
    }
  }

  lastTime = time;
  requestAnimationFrame(onAnimationFrame);
}

function checkCollision(el1, el2) {
  const r1 = el1.getBoundingClientRect();
  const r2 = el2.getBoundingClientRect();
  return !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom);
}

animateFood();

// WebSocket-Setup
socket.addEventListener('open', () => {
  socket.send(JSON.stringify(['*enter-room*', roomName]));
  socket.send(JSON.stringify(['*subscribe-client-count*']));
  socket.send(JSON.stringify(['*subscribe-client-enter-exit*']));

  setInterval(() => socket.send(''), 30000); // Keep alive
  console.log("✅ WebSocket verbunden");
});

socket.addEventListener('message', (event) => {
  if (!event.data) return;
  const data = JSON.parse(event.data);
  const cmd = data[0];

  console.log("Empfangen:", data);

  switch (cmd) {
    case '*client-id*': {
      clientId = data[1];
      indexElem.innerText = `#${clientId}/${clientCount}`;
      break;
    }

    case '*client-count*': {
      clientCount = data[1];
      indexElem.innerText = `#${clientId}/${clientCount}`;
      break;
    }

    case '*client-enter*': {
      const enterId = data[1];
      const fish = getFish(enterId);
      socket.send(JSON.stringify(['*send-message*', enterId, ['init', clientId, fish.id]]));
      break;
    }

    case '*client-exit*': {
      const exitId = data[1];
      releaseFish(exitId);
      break;
    }

    case 'move-fish': {
      const fishId = data[1];
      const direction = data[2];
      const fish = fishes[fishId];

      fish.direction = direction;

      const isLeft = (fishId % 2 === 0);
      if (direction < 0) {
        fish.image.classList.add('mirrored');
      } else if (direction > 0) {
        fish.image.classList.remove('mirrored');
      } else if (fish.position === 0) {
        fish.image.classList.remove('mirrored');
      }

      break;
    }

    case 'clear': {
      clearColors();
      break;
    }

    case 'error': {
      console.warn('Serverfehler:', data[1]);
      break;
    }
  }
});

// get promise for web audio check and start
function requestWebAudio() {
  return new Promise((resolve, reject) => {
    if (audioContext && audioContext.state !== "running") {
      audioContext.resume()
        .then(() => resolve())
        .catch(() => reject());
    }
  });
}

// load audio files into audio buffers
let numBuffersReady = 0;

function loadAudioFiles() {
  return new Promise((resolve, reject) => {
    for (let i = 0; i < audioFiles.length; i++) {
      fetch('sounds/' + audioFiles[i])
        .then(data => data.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(decodedAudio => {
          audioBuffers[i] = decodedAudio;
          numBuffersReady++;
          if (numBuffersReady === audioFiles.length) {
            resolve();
          }
        });
    }
  });
}

// play buffer by index
function loopSound(index, level = 1, fadeTime = 0.01) {
  const time = audioContext.currentTime;

  const gain = audioContext.createGain();
  gain.connect(audioContext.destination);
  gain.gain.value = 0;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(level, time + fadeTime);

  const source = audioContext.createBufferSource();
  source.connect(gain);
  source.buffer = audioBuffers[index];
  source.start(time);
  source.loop = true;
}