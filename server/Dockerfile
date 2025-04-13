FROM node:18
WORKDIR /opt/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5001
CMD ["node", "server.js"]