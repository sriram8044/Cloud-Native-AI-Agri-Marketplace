# ==============================================================================
# Stage 1: Build React 18 Application with Node 22
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /build

# Leverage Docker layer caching for node dependencies
COPY package*.json ./
RUN npm ci

# Copy frontend source files and compile production bundle
COPY . .
RUN npm run build

# ==============================================================================
# Stage 2: Production Nginx Static Server & Reverse Proxy
# ==============================================================================
FROM nginx:1.27-alpine AS runtime

# Remove default boilerplate site
RUN rm -rf /usr/share/nginx/html/*

# Deploy custom Nginx reverse proxy and SPA routing configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /build/dist /usr/share/nginx/html

EXPOSE 80

# Health check to ensure Nginx server is alive and returning root index
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
