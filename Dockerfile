FROM node:20
WORKDIR /opt/build
RUN apt update && apt install -y git && npm install -g pm2
RUN git clone https://github.com/mayzer57/tutor-diary.git -b main . && git remote rm origin
WORKDIR /opt/build/client
RUN npm install && npm run build
WORKDIR /opt/build
RUN npm install --production
EXPOSE 10000
CMD ["pm2-runtime", "server/server.js"]
