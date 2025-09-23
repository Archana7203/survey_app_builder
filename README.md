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

## Docker Deployment

### Prerequisites
- Docker
- Docker Compose

### Running with Docker Compose

1. Build and start all services:
```bash
docker-compose up --build
```

2. Access the applications:
- Web App: http://localhost:5173
- API: http://localhost:3001

### Individual Container Management

Start specific services:
```bash
docker-compose up api        # Start API only
docker-compose up web        # Start Web only
docker-compose up mongodb    # Start MongoDB only
```

Stop services:
```bash
docker-compose down         # Stop all services
```

View logs:
```bash
docker-compose logs -f      # Follow all logs
docker-compose logs api     # View API logs
docker-compose logs web     # View Web logs
```

### Environment Variables

Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb://root:example@mongodb:27017/survey-app?authSource=admin
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
VITE_API_URL=http://localhost:3001
```





