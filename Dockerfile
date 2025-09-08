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

# Устанавливаем зависимости для клиента и сервера
WORKDIR /opt/build
RUN npm install
WORKDIR /opt/build/client
RUN npm install && npm run build

# Возвращаемся к корню для запуска
WORKDIR /opt/build

# Пробрасываем порт (опционально, Render сам задаёт)
EXPOSE 10000

# Запуск через pm2-runtime
CMD ["pm2-runtime", "server/server.js"]
