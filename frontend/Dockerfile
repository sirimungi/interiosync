FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
EXPOSE 3000

# When using Docker Compose, backend is at host "backend"; from browser we use localhost:8000
ENV VITE_API_URL=http://localhost:8000
CMD ["npm", "run", "dev"]
