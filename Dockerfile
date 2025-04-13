# 1. Базовый образ
FROM node:18

# 2. Рабочая директория
WORKDIR /opt/build

# 3. Установка инструментов
RUN apt update && apt install -y git && \
    npm install -g pm2

# 4. Клонируем проект
RUN git clone https://github.com/mayzer57/tutor-diary.git -b main . && \
    git remote rm origin

# 5. Устанавливаем зависимости и билдим фронт
WORKDIR /opt/build/client
RUN npm install && npm run build

# 6. Устанавливаем зависимости сервера
WORKDIR /opt/build/server
RUN npm install

# 7. Открываем порт
EXPOSE 5001

# 8. Запускаем сервер
CMD ["pm2-runtime", "server.js"]
