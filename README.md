# Echoes of the Room 🎮

A small puzzle game I built using HTML, CSS and JavaScript, with a Node.js backend and PostgreSQL database.

## About the Project

The idea behind this game is simple: what if you were stuck in a dark room and could only understand your surroundings by sending echoes?

In this game, you explore different rooms with limited visibility. Whenever you send an echo, nearby tiles become visible for a short time. You have to remember the layout, find the key and reach the exit.

It is not just about moving around. You also need to remember what you have already seen and use your echoes wisely.

## Features

- Dark theme with a mysterious atmosphere
- Echo system that temporarily reveals nearby tiles
- Multiple levels with different layouts
- Key and exit mechanics
- Limited echoes in certain levels
- Moving hazard in the final level
- Basic sound effects
- Backend API to load levels from a PostgreSQL database

## Tech Stack

- HTML
- CSS
- JavaScript
- HTML Canvas
- Node.js
- Express.js
- PostgreSQL

## How to Play

| Action    | Control           |
| --------- | ----------------- |
| Move      | Arrow Keys / WASD |
| Send Echo | Space             |
| Restart   | R                 |

### Basic Gameplay

1. Start the game and explore the room.
2. Press Space to send an echo and reveal nearby tiles.
3. Remember the paths as the visibility fades.
4. Find the key to unlock the exit.
5. Reach the exit and move on to the next level.

Be careful with your echoes because some levels have a limited number of uses.

## Running the Project Locally

### Requirements

- Node.js and npm
- PostgreSQL
- VS Code with Live Server, or another local web server

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd EchoesOfTheRoom
```

Replace `YOUR_REPOSITORY_URL` with your actual GitHub repository URL.

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure the database

Create a `.env` file inside the `backend` folder and add your PostgreSQL connection details.

```env
PGHOST=localhost
PGPORT=5432
PGDATABASE=your_database_name
PGUSER=your_database_user
PORT=3000
```

Replace the example database values with your own local configuration.

Make sure the database and the required `levels` table are set up before starting the game. Check the existing database schema and `backend/seed.js` if you need to initialize the level data.

**Important:** Never upload your `.env` file or actual database credentials to GitHub.

### 4. Start the backend

From inside the `backend` folder, run:

```bash
npm start
```

The backend should start at:

`http://localhost:3000`

You can check whether it is running using:

- `http://localhost:3000/api/health`
- `http://localhost:3000/api/levels`

### 5. Start the game

Open the root `index.html` file using Live Server.

Keep the backend running while playing so the game can fetch its levels from the API.

## What I Learned

While building this project, I got to work with:

- JavaScript game logic and keyboard controls
- Canvas-based rendering and animations
- Fetching data from a backend API
- Connecting a Node.js backend to PostgreSQL
- Organizing frontend and backend code
- Debugging issues during development

## Future Improvements

There are many things I would like to explore as I continue working on this project, including more levels, better gameplay mechanics, player progress tracking and other improvements.

For now, my focus is on making the existing game stable and improving the project step by step.

**Built as a learning project while exploring game development and backend development.**
