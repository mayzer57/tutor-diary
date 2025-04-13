# 1. Базовый образ
FROM node:18

# 2. Рабочая директория
WORKDIR /opt/build

# 3. Устанавливаем git, pm2 и ssh для доступа к GitHub
RUN apt update && apt install -y git && \
    npm install -g pm2 && \
    mkdir -p /root/.ssh && \
    ssh-keyscan -t rsa github.com > /root/.ssh/known_hosts

# 4. Клонируем репозиторий и переключаемся на конкретный коммит
RUN git clone https://github.com/mayzer57/tutor-diary.git -b main . && \
    git checkout b372542c5e337d6ab7721ff4641e8b595a7ebf63 && \
    git remote rm origin

# 5. Устанавливаем зависимости сервера с нуля
WORKDIR /opt/build/server
RUN rm -rf node_modules package-lock.json && npm install

# 6. Указываем порт (важно для хостинга/облака)
EXPOSE 5001

# 7. Запускаем через pm2
CMD ["pm2-runtime", "server.js"]
