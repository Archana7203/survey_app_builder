# ------------------------------
# Stage 1: Build frontend (apps/web)
# ------------------------------
    FROM node:18-alpine AS frontend-builder

    WORKDIR /app

    # Copy root lockfiles and web workspace manifest so npm can resolve workspace deps
    COPY package*.json ./
    COPY apps/web/package*.json ./apps/web/

    # Install dependencies (workspaces-aware; enough to build web)
    RUN npm install

    # Copy web sources and build
    COPY apps/web ./apps/web
    COPY apps/web/tsconfig.json ./apps/web/

    RUN npm --workspace apps/web run build


# ------------------------------
# Stage 2: Build backend (apps/api)
# ------------------------------
    FROM node:18-alpine AS backend-builder

    WORKDIR /app

    # Copy root lockfiles and api workspace manifest
    COPY package*.json ./
    COPY apps/api/package*.json ./apps/api/

    # Install dependencies needed for build (dev deps included)
    RUN npm install

    # Copy backend source and build (tsc + copy data via script)
    COPY apps/api ./apps/api
    COPY apps/api/tsconfig.json ./apps/api/

    RUN npm --workspace apps/api run build


# ------------------------------
# Stage 3: Production image (only runtime deps + built artifacts)
# ------------------------------
    FROM node:18-alpine

    # Work from API workspace directory at runtime
    WORKDIR /app/apps/api

    # Install only production deps for API
    COPY --from=backend-builder /app/apps/api/package*.json ./
    RUN npm install --omit=dev

    # Copy built API and frontend artifacts
    COPY --from=backend-builder /app/apps/api/dist ./dist
    # Place web build where server expects: ../../web/dist from api/dist
    COPY --from=frontend-builder /app/apps/web/dist ../web/dist

    # Expose backend port
    EXPOSE 3001

    # Start backend server
    CMD ["npm", "run", "start"]
    