# Stage 1: Build static assets
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Declare build arguments
ARG VITE_CLOUDINARY_API_KEY
ARG VITE_CLOUDINARY_API_SECRET
ARG VITE_CLOUDINARY_CLOUD_NAME

# Set environment variables for build time
ENV VITE_CLOUDINARY_API_KEY=$VITE_CLOUDINARY_API_KEY
ENV VITE_CLOUDINARY_API_SECRET=$VITE_CLOUDINARY_API_SECRET
ENV VITE_CLOUDINARY_CLOUD_NAME=$VITE_CLOUDINARY_CLOUD_NAME

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
