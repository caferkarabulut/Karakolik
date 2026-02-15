# Karakolik – Football Tracking & Favorites System

A full-stack web application that lets users follow live football fixtures, league standings, and manage their favorite teams and matches. Built with Node.js, Express, and Microsoft SQL Server, powered by real-time data from the API-Football service.

## Features

- **Live Fixtures** – View upcoming and recent matches across five major European leagues
- **League Standings** – Browse real-time standings for Süper Lig, Premier League, La Liga, Serie A, and Bundesliga
- **Team Favorites** – Star any team from the standings table to add it to your personal favorites
- **Match Favorites** – Save individual fixtures for quick access later
- **User Authentication** – Register / login with JWT-based session management
- **Auto-Refresh Cache** – A cron job periodically refreshes fixture and standings data

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript, Bootstrap 5 |
| Backend | Node.js, Express.js |
| Database | Microsoft SQL Server (MSSQL) |
| Auth | JSON Web Token (JWT), bcrypt |
| External API | API-Football (api-sports.io) |
| Scheduling | node-cron |

## Getting Started

### Prerequisites

- Node.js v18+
- Microsoft SQL Server instance
- API-Football key ([rapidapi.com](https://rapidapi.com))

### Installation

```bash
git clone https://github.com/caferkarabulut/Karakolik.git
cd Karakolik
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```
DB_USER=your_db_user
DB_PASS=your_db_password
DB_SERVER=your_db_server
DB_NAME=your_db_name
JWT_SECRET=your_jwt_secret
API_FOOTBALL_KEY=your_api_key
```

### Database Setup

Create the following tables on your MSSQL instance:

- `Users` – stores registered user credentials
- `Favorites` – stores favorite matches per user
- `Teams` – caches team info fetched from the API
- `TeamFavorites` – maps users to their favorite teams

### Run

```bash
node index.js
```

The app will be available at `http://localhost:3000`.

## Project Structure

```
├── public/
│   ├── js/
│   │   └── scripts.js
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── football.html
│   └── favorites.html
│
├── routes/
│   ├── football.js
│   ├── favorites.js
│   └── team-fav.js
│
├── cache-refresh.js
├── dbPool.js
├── index.js
├── .env (not tracked)
├── .gitignore
├── package.json
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Create a new user account |
| POST | `/login` | Authenticate and receive a JWT |
| GET | `/api/football/matches` | Fetch upcoming fixtures |
| GET | `/api/football/standings` | Fetch league standings |
| GET | `/api/favorites` | List saved favorite matches |
| POST | `/api/favorites` | Add a match to favorites |
| DELETE | `/api/favorites/:id` | Remove a match from favorites |
| GET | `/api/team-fav` | List favorite teams (auth required) |
| POST | `/api/team-fav` | Toggle a team favorite (auth required) |

## License

This project is provided for educational and portfolio purposes.
