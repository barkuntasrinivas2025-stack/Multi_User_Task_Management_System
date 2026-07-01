# 📋 Multi-User Task Management System
<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" />
</p>

<p align="center">
  <strong>A high-performance, real-time collaborative project management system engineered for seamless team synchronization.</strong>
</p>

---

## 📖 Table of Contents
- [🖼️ Visual Preview](#-visual-preview)
- [🌟 Core Features](#-core-features)
- [🧠 Engineering Decisions](#-engineering-decisions)
- [🛠️ Tech Stack](#-tech-stack)
- [📦 Local Setup](#-local-setup)
- [🗺️ System Architecture](#-system-architecture)
- [🛡️ Security & Optimization](#-security--optimization)

---

## 🖼️ Visual Preview

| Login | Dashboard | Board | Edit Card |
| :---: | :---: | :---: | :---: |
| ![Login](./screenshots/Screenshot%202026-06-06%20100333.png) | ![Dashboard](./screenshots/Screenshot%202026-06-06%20100317.png) | ![Board](./screenshots/Screenshot%202026-06-06%20100249.png) | ![Edit Card](./screenshots/Screenshot%202026-06-06%20100306.png) |

---
## 🌟 Core Features

- **⚡ Real-time Engine**: Powered by Socket.io, enabling instantaneous state synchronization across all connected clients.
- **📋 Kanban Architecture**: Dynamic board management with intuitive drag-and-drop capabilities (via @dnd-kit).
- **🔐 Enterprise Auth**: Robust JWT-based authentication flow with secure HTTP-only token handling.
- **🔑 Invite System**: Secure, UUID-based invitation system for seamless team onboarding.
- **🎨 Modern Interface**: A minimalist, high-contrast design built with Tailwind CSS and React 19, focusing on accessibility and cognitive load reduction.

---

## 🧠 Engineering Decisions

### 1. Real-time Synchronization
Instead of traditional polling, I implemented a **WebSocket-based event system**. This reduces server overhead and provides a "Google Docs-like" experience where changes are reflected immediately across the team.

### 2. Type-Safe Database Layer
I chose **Drizzle ORM** over traditional ORMs to maintain a lean footprint while gaining full TypeScript type safety. This prevents runtime database errors and speeds up development through a "Schema-first" approach.

### 3. State Management & Performance
Utilized **React 19's** latest features and a domain-driven component structure (Features folder) to ensure the application remains scalable. API calls are centralized through a custom Axios instance with global interceptors for consistent error handling.

---

## 🛠️ Tech Stack

### 🎨 Frontend
- **Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Communication**: Axios, Socket.io-client
- **UX**: React Hot Toast, @dnd-kit (for drag-and-drop)

### ⚙️ Backend
- **Runtime**: Node.js, TypeScript (tsx)
- **Framework**: Express.js
- **Database**: Neon (Serverless PostgreSQL)
- **ORM**: Drizzle ORM
- **Real-time**: Socket.io
- **Security**: Helmet, bcryptjs, JWT

---

## 📦 Local Setup

### Prerequisites
- **Node.js**: v18.x or higher
- **PostgreSQL**: Neon instance or local PG database

### 1. Clone & Initialize
```bash
git clone <your-repo-url>
cd azentrix-fullstack-task2
```

### 2. Backend Configuration
```bash
cd server
npm install
```
Create a `.env` file in `/server`:
```env
PORT=3001
DATABASE_URL=your_postgres_url
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```
`npm run dev`

### 3. Frontend Configuration
```bash
cd client
npm install
```
Create a `.env` file in `/client`:
```env
VITE_API_URL=http://localhost:3001/api/v1
```
`npm run dev`

---

## 🗺️ System Architecture

```text
root/
├── client/                # Frontend (React + Vite)
│   ├── src/
│   │   ├── features/       # Domain-specific logic (Auth, Boards, Cards)
│   │   ├── shared/         # Reusable UI, hooks, and API utilities
│   │   └── lib/            # Global configurations
├── server/                # Backend (Express + TypeScript)
│   ├── src/
│   │   ├── routes/        # API Endpoint definitions
│   │   ├── lib/           # DB Schema & Utility logic
│   │   └── index.ts       # Server Entry Point
```

---

## 🛡️ Security & Optimization

- **Data Protection**: Passwords are never stored in plain text; salted hashing via `bcryptjs`.
- **Network Security**: 
  - `Helmet` integration to prevent common web vulnerabilities (XSS, Clickjacking).
  - Strict `CORS` policy to prevent unauthorized domain access.
- **Error Resilience**: Global Axios interceptors handle 401 (Unauthorized) and 503 (Service Unavailable) errors gracefully.
- **Performance**: Optimized build using Vite and tree-shaking for minimal client-side bundles.
