# Multiplayer Fish Game

## Overview
The Multiplayer Fish Game is an interactive web-based game where two players control their fish to collect food and score points while avoiding collisions with each other. The first player to reach 5 points wins the game.

## Project Structure
```
multiplayer-fish-game
├── public
│   ├── index.html          # HTML structure for the game
│   ├── styles.css         # CSS styles for the game
│   └── sounds             # Directory containing audio files
│       ├── blubb.wav      # Sound played when the fish moves
│       ├── nomnom.wav     # Sound played when the fish collects food
│       ├── fail.wav       # Sound played when the fish collide
│       └── win.wav        # Sound played when a player wins
├── src
│   ├── client
│   │   ├── index.js       # Entry point for the client-side application
│   │   └── game.js        # Game logic for the client
│   └── server
│       ├── server.js      # WebSocket server setup
│       └── gameLogic.js   # Core game logic
├── package.json            # npm configuration file
├── README.md               # Project documentation
└── .gitignore              # Files and directories to ignore by Git
```

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd multiplayer-fish-game
   ```
3. Install the dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm start
   ```
5. Open your browser and navigate to `http://localhost:3000` to play the game.

## Gameplay Rules
- Each player controls a fish that moves towards a moving food object.
- Players earn points when their fish touches the food.
- Players lose points when their fish collide with each other.
- The game ends when a player reaches 5 points, and a winner is declared.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the MIT License.