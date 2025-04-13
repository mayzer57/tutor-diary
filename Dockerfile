# 1. Базовый образ
FROM node:18

# 2. Рабочая директория
WORKDIR /opt/build

# 3. Установим git, pm2 и подготовим ssh
RUN apt update && apt install -y git && \
    npm install -g pm2 && \
    mkdir -p /root/.ssh && \
    ssh-keyscan -t rsa github.com > /root/.ssh/known_hosts

# 4. Клонируем проект и переключаемся на нужный коммит
RUN git clone https://github.com/mayzer57/tutor-diary.git -b main . && \
    git checkout b372542c5e337d6ab7721ff4641e8b595a7ebf63 && \
    git remote rm origin

# 5. Устанавливаем зависимости сервера
WORKDIR /opt/build/server
RUN npm install

EXPOSE 5001

CMD ["sh", "-c", "node server.js || tail -f /dev/null"]
