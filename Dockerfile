# POS SaaS 系统 - Docker部署版
FROM node:18-alpine AS frontend-build
WORKDIR /build
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY frontend/ ./
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}
RUN yarn build

FROM python:3.11-slim
WORKDIR /app

# Install nginx
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# Backend dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY backend/ ./backend/

# Copy frontend build
COPY --from=frontend-build /build/build /app/frontend-build

# Nginx config
RUN echo 'server { \n\
    listen 80; \n\
    server_name _; \n\
    \n\
    # Frontend \n\
    location / { \n\
        root /app/frontend-build; \n\
        try_files $uri $uri/ /index.html; \n\
    } \n\
    \n\
    # Backend API \n\
    location /api/ { \n\
        proxy_pass http://127.0.0.1:8001; \n\
        proxy_set_header Host $host; \n\
        proxy_set_header X-Real-IP $remote_addr; \n\
    } \n\
    \n\
    # Uploads \n\
    location /uploads/ { \n\
        alias /app/backend/uploads/; \n\
    } \n\
}' > /etc/nginx/sites-available/default

# Start script
RUN echo '#!/bin/bash \n\
cd /app/backend && uvicorn server:app --host 0.0.0.0 --port 8001 & \n\
nginx -g "daemon off;"' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 80
CMD ["/app/start.sh"]
