const fishContainer = document.getElementById('fish-container');
const indexElem = document.getElementById('client-index');
const fishElem = document.getElementById('left-side-fish');
const fishImage = document.getElementById('left-side-image');
const fishNumber = document.getElementById('left-side-number');

const failSound = document.getElementById("fail-sound");
const nomnomSound = document.getElementById("nomnom-sound");
const winSound = document.getElementById("win-sound");

let roomName = 'feed-the-fish';
let serverURL = 'wss://nosch.uber.space/web-rooms/';
let socket = new WebSocket(serverURL);
let clientId = null;
let clientCount = 0;
let points = 0;
let muted = false;

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
const audioFiles = ['blubb.wav', 'nomnom.wav', 'fail.wav', 'win.wav'];
const audioBuffers = [];

const maxPoints = 5;
let pointDisplay = null;
let displayId = 0;
let fishId = 0;
let direction = 0;
let pointerId = null;
const speed = 100; // pixels per second

loadAudioFiles();
createPointDisplay();

const message = document.createElement("div");
message.id = "message";
message.className = "hidden";
fishContainer.appendChild(message);

document.addEventListener('pointerdown', onPointerDown);
document.addEventListener('pointermove', onPointerMove);
document.addEventListener('pointerup', onPointerUp);
document.addEventListener('pointercancel', onPointerUp);

function updateFish() {
  const isLeft = (fishId % 2 == 0);
  const imageSrc = isLeft ? 'images/left-fish.png' : 'images/right-fish.png';

  fishImage.src = imageSrc;
  fishNumber.innerText = fishId + 1;
}

function showWin(winningFishId) {
  muted = true;

  if (winningFishId === fishId) {
    message.textContent = 'You Win!';
    message.classList.remove("hidden");
    fishElem.classList.add('dance');
    playSound(3);
  } else {
    message.textContent = `Fish ${winningFishId + 1} wins!`
    message.classList.remove("hidden");

    fishElem.style.animationDuration = `1s`;
    fishElem.classList.add('sad');
  }
}

function showCollision() {
  updatePoints();

  fishElem.style.animationDuration = `0.2s`;
  fishElem.classList.add('collision');

  setTimeout(() => fishElem.classList.remove('collision'), 200);

  playSound(2);
}

function reset() {
  muted = false;
  message.classList.add("hidden");
  fishElem.classList.remove('dance');
  fishElem.classList.remove('sad');
  fishElem.classList.remove('collision');
  fishImage.classList.remove('mirrored');
  points = 0;
}

function onPointerDown(e) {
  if (pointerId === null) {
    pointerId = e.pointerId;
    onPointerMove(e);
    requestWebAudio();
  }
}

function onPointerMove(e) {
  if (e.pointerId === pointerId) {
    const isLeftFish = (fishId % 2 === 0);
    const isLeftClick = e.clientX < window.innerWidth / 2;
    const newDirection = ((isLeftFish && isLeftClick) || (!isLeftFish && !isLeftClick)) ? -1 : 1;

    if (newDirection !== direction) {
      moveFish(newDirection);
      direction = newDirection;
    }
  }
}

function onPointerUp(e) {
  if (e.pointerId === pointerId) {
    moveFish(0);
    direction = 0;
    pointerId = null;
  }
}

function moveFish(direction) {
  if (!muted && displayId !== null && fishId !== null) {
    socket.send(JSON.stringify(['*send-message*', displayId, ['move-fish', fishId, direction]]));

    if (direction < 0) {
      fishImage.classList.add('mirrored');
    } else {
      fishImage.classList.remove('mirrored');
    }

    playSound(0, 0.8, 0, 500);
  }
}

function createPointDisplay() {
  pointDisplay = document.createElement("div");
  pointDisplay.className = "point-display";

  const cell = document.createElement("div");
  const row = document.createElement("div");
  row.style.display = "flex";

  for (let j = 0; j < maxPoints; j++) {
    const circle = document.createElement("div");
    circle.classList.add('point-circle');
    circle.style.width = "30px";
    circle.style.height = "30px";
    circle.style.borderRadius = "50%";
    circle.style.border = "1px solid brown";
    circle.style.margin = "1px";
    circle.style.backgroundColor = "transparent";
    row.appendChild(circle);
  }
  cell.appendChild(row);
  pointDisplay.appendChild(cell);

  fishContainer.appendChild(pointDisplay);
}

function updatePoints() {
  const display = pointDisplay.children[0];
  const circles = display.querySelectorAll('.point-circle');

  for (let i = 0; i < maxPoints; i++) {
    if (i < points) {
      circles[i].style.backgroundColor = "brown";
    } else {
      circles[i].style.backgroundColor = "transparent";
    }
  }
}

// WebSocket-Setup
socket.addEventListener('open', () => {
  socket.send(JSON.stringify(['*enter-room*', roomName]));
  socket.send(JSON.stringify(['*subscribe-client-count*']));
  setInterval(() => socket.send(''), 30000); // Keep alive
  console.log("WebSocket verbunden");
});

socket.addEventListener('message', (event) => {
  if (!event.data) return;
  const data = JSON.parse(event.data);
  const cmd = data[0];
  console.log("Empfangen:", data);

  switch (cmd) {
    case '*client-id*':
      clientId = data[1];
      indexElem.innerText = `#${clientId}/${clientCount}`;
      break;

    case '*client-count*':
      clientCount = data[1];
      indexElem.innerText = `#${clientId}/${clientCount}`;
      break;

    case 'init':
      displayId = data[1];
      fishId = data[2];
      updateFish();
      break;

    case 'nomnom':
      points = data[1];
      updatePoints();
      playSound(1);
      break;

    case 'collision':
      points = data[1];
      showCollision();
      break;

    case 'win':
      const winId = data[1];
      showWin(winId);
      break;

    case 'reset':
      reset();
      updatePoints();
      break;

    case 'error':
      console.warn('Serverfehler:', data[1]);
      break;
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

function playSound(index, level = 1, fadeTime = 0, randomPitch = 200) {
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
  source.detune.value = 2 * randomPitch * Math.random() - randomPitch;
}
