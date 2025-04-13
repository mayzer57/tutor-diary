# 1. Node.js base
FROM node:18

# 2. Рабочая директория
WORKDIR /opt/build

# 3. Утилиты
RUN apt update && apt install -y git && \
    npm install -g pm2

# 4. Клонируем проект
RUN git clone https://github.com/mayzer57/tutor-diary.git -b main . && \
    git remote rm origin

# 5. Установка фронта и билд
WORKDIR /opt/build/client
RUN npm install && npm run build

# 6. Установка бэка
WORKDIR /opt/build/server
RUN npm install

# 7. Открытый порт
EXPOSE 5001

# 8. Запуск сервера через pm2
CMD ["pm2-runtime", "server.js"]
