# 1. Базовый образ Node.js
FROM node:18

# 2. Рабочая директория
WORKDIR /opt/build

# 3. Установка зависимостей: git, pm2 и SSH-доступ к GitHub
RUN apt update && apt install -y git && \
    npm install -g pm2 && \
    mkdir -p /root/.ssh && \
    ssh-keyscan -t rsa github.com > /root/.ssh/known_hosts

# 4. Клонируем проект и переключаемся на нужный коммит
RUN git clone https://github.com/mayzer57/tutor-diary.git -b main . && \
    git checkout b372542c5e337d6ab7721ff4641e8b595a7ebf63 && \
    git remote rm origin

# 5. Переход в серверную директорию и установка зависимостей
WORKDIR /opt/build/server

# Удаляем старые node_modules и package-lock (на всякий случай)
RUN rm -rf node_modules package-lock.json

# Устанавливаем bcryptjs вместо bcrypt
RUN npm install bcryptjs && npm install

# 6. Открываем порт
EXPOSE 5001

# 7. Запуск сервера через pm2
CMD ["pm2-runtime", "server.js"]
