FROM node:22-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5176
CMD ["npm", "run", "start"]
