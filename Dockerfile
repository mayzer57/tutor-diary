# Node.js base
FROM node:20

# Рабочая директория
WORKDIR /opt/build

# Утилиты
RUN apt update && apt install -y git && \
    npm install -g pm2

# Клонируем весь проект
RUN git clone https://github.com/mayzer57/tutor-diary.git -b main . && \
    git remote rm origin

# Устанавливаем и собираем фронтенд
WORKDIR /opt/build/client
RUN npm install && npm run build

# Устанавливаем зависимости бэкенда
WORKDIR /opt/build
RUN npm install --production

# Пробрасываем порт (совпадает с Render)
EXPOSE 5001

# Запуск через pm2-runtime
CMD ["pm2-runtime", "server/server.js"]
