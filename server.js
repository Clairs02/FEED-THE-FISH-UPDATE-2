const WebSocket = require('ws');
const { Game } = require('./gameLogic');

const server = new WebSocket.Server({ port: 8080 });
const games = {};

server.on('connection', (socket) => {
    let playerId = Math.random().toString(36).substring(2, 15);
    let gameId = null;

    socket.on('message', (message) => {
        const data = JSON.parse(message);

        switch (data[0]) {
            case '*enter-room*':
                gameId = data[1];
                if (!games[gameId]) {
                    games[gameId] = new Game(gameId);
                }
                games[gameId].addPlayer(playerId, socket);
                break;

            case '*send-message*':
                if (gameId) {
                    games[gameId].handleMessage(playerId, data[1]);
                }
                break;
        }
    });

    socket.on('close', () => {
        if (gameId) {
            games[gameId].removePlayer(playerId);
        }
    });
});

console.log('WebSocket server is running on ws://localhost:8080');