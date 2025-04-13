FROM node:18

WORKDIR /opt/build

RUN apt update && apt install -y git && \
    npm install -g pm2 && \
    mkdir -p /root/.ssh && \
    ssh-keyscan -t rsa github.com > /root/.ssh/known_hosts

RUN git clone https://github.com/mayzer57/tutor-diary.git -b main . && \
    git checkout b372542c5e337d6ab7721ff4641e8b595a7ebf63 && \
    git remote rm origin

WORKDIR /opt/build/server
RUN npm install

EXPOSE 5001

CMD ["node", "server.js"]
