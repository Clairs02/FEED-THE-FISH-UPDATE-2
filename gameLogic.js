const players = {};
const food = { x: 0, y: 0 };
let foodEaten = 0;

function addPlayer(id) {
    players[id] = { x: Math.random() * 500, y: Math.random() * 500, points: 0 };
}

function removePlayer(id) {
    delete players[id];
}

function movePlayer(id, direction) {
    const player = players[id];
    if (!player) return;

    switch (direction) {
        case 'up':
            player.y -= 5;
            break;
        case 'down':
            player.y += 5;
            break;
        case 'left':
            player.x -= 5;
            break;
        case 'right':
            player.x += 5;
            break;
    }

    checkCollision(id);
}

function spawnFood() {
    food.x = Math.random() * 500;
    food.y = Math.random() * 500;
}

function checkCollision(id) {
    const player = players[id];
    if (!player) return;

    for (const otherId in players) {
        if (otherId !== id) {
            const otherPlayer = players[otherId];
            if (Math.abs(player.x - otherPlayer.x) < 20 && Math.abs(player.y - otherPlayer.y) < 20) {
                player.points -= 1;
                otherPlayer.points -= 1;
                if (player.points < 0) player.points = 0;
                if (otherPlayer.points < 0) otherPlayer.points = 0;
            }
        }
    }

    if (Math.abs(player.x - food.x) < 20 && Math.abs(player.y - food.y) < 20) {
        player.points += 1;
        foodEaten += 1;
        spawnFood();
    }

    checkWinner();
}

function checkWinner() {
    for (const id in players) {
        if (players[id].points >= 5) {
            return { winner: id };
        }
    }
    return null;
}

function getGameState() {
    return { players, food };
}

module.exports = {
    addPlayer,
    removePlayer,
    movePlayer,
    spawnFood,
    getGameState,
};