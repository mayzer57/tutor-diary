
# Node.js base
FROM node:20

# Рабочая директория
WORKDIR /opt/app

# Утилиты
RUN apt update && apt install -y git && \
    npm install -g pm2

# Клонируем только сервер
RUN git clone https://github.com/mayzer57/tutor-diary.git -b main . && \
    git remote rm origin

WORKDIR /opt/app/server
RUN npm install --production

# Пробрасываем порт
EXPOSE 5001

# Запуск через pm2-runtime
CMD ["pm2-runtime", "server.js"]
