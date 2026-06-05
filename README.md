# Azentrix Task Board 📋

A professional, real-time collaborative project management tool designed for efficiency and seamless teamwork. This application allows users to create kanban-style boards, manage tasks in real-time, and collaborate with team members.

## 🖼️ Preview

| Login Page | Boards Dashboard | Board View |
| :---: | :---: | :---: |
| ![Login](./screenshots/login.png) | ![Dashboard](./screenshots/dashboard.png) | ![Board](./screenshots/board.png) |

*(Note: If images aren't showing, please check the `/screenshots` folder)*

## 🚀 Key Features

- **Real-time Collaboration**: Built with Socket.io for instant updates across all clients.
- **Kanban Boards**: Create and manage multiple project boards with flexible layouts.
- **Secure Authentication**: JWT-based authentication with secure token management.
- **Invite System**: Join boards using unique invite codes.
- **Modern UI/UX**: A clean, professional interface built with React 19 and Tailwind CSS.
- **Robust Backend**: Type-safe API developed with Express and Drizzle ORM.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Hooks / Context
- **API Client**: Axios
- **Notifications**: React Hot Toast
- **Real-time**: Socket.io-client

### Backend
- **Runtime**: Node.js / TypeScript
- **Framework**: Express
- **Database**: Neon (PostgreSQL)
- **ORM**: Drizzle ORM
- **Real-time**: Socket.io
- **Security**: Helmet, CORS, bcryptjs, JSON Web Tokens (JWT)

## 📦 Local Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database (or Neon)

### 1. Clone the repository
\`\`\`bash
git clone <your-repo-url>
cd azentrix-fullstack-task2
\`\`\`

### 2. Backend Setup
\`\`\`bash
cd server
npm install
# Create a .env file with the following:
# PORT=3001
# DATABASE_URL=your_postgres_url
# JWT_SECRET=your_secret_key
# CLIENT_URL=http://localhost:5173

npm run dev
\`\`\`

### 3. Frontend Setup
\`\`\`bash
cd client
npm install
# Create a .env file with:
# VITE_API_URL=http://localhost:3001/api/v1

npm run dev
\`\`\`

## 🗺️ Project Structure

- \`/client\`: React frontend application.
- \`/server\`: Node.js/Express backend API.
- \`/server/src/routes\`: API endpoints definition.
- \`/server/src/lib\`: Database and utility logic.
- \`/client/src/features\`: Domain-driven UI components (Auth, Boards, Cards).
- \`/client/src/shared\`: Reusable hooks, components, and API utilities.

## 🛡️ Security Implementations
- **Password Hashing**: Used `bcryptjs` for secure password storage.
- **Authorization**: Protected routes using JWT middleware.
- **HTTP Security**: Implemented `helmet` for secure HTTP headers.
- **CORS**: Configured to only allow requests from the authorized client URL.
