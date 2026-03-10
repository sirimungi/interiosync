FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
EXPOSE 3000
ENV VITE_API_URL=http://localhost:8000
CMD ["npm", "run", "dev"]
