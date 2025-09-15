# Survey App Builder

A full-stack monorepo application for building surveys with TypeScript, Express, React, and TailwindCSS.

## Structure

```
survey_app_builder/
├── apps/
│   ├── api/          # Express TypeScript API
│   └── web/          # React TypeScript Frontend
└── package.json      # Workspace configuration
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

1. Install dependencies for all workspaces:
```bash
npm install
```

2. Install workspace dependencies:
```bash
npm install --workspaces
```

### Development

Start both frontend and backend in development mode:
```bash
npm run dev
```

This will start:
- API server on `http://localhost:3001`
- Web app on `http://localhost:5173`

### Individual Commands

Start only the API:
```bash
npm run dev:api
```

Start only the web app:
```bash
npm run dev:web
```

### API Endpoints

- `GET /api/health` - Health check endpoint

### Tech Stack

**Backend (apps/api):**
- Express.js
- TypeScript
- MongoDB with Mongoose
- JWT Authentication
- bcrypt for password hashing
- CORS enabled

**Frontend (apps/web):**
- React 18
- TypeScript
- Vite
- TailwindCSS
- React Router v6

**Development Tools:**
- ESLint
- Prettier
- ts-node-dev for API hot reload
- Vite HMR for frontend





