
FROM node:18-alpine3.20
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
RUN apk update && apk upgrade --no-cache
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]